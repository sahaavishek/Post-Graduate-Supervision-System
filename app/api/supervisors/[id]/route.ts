import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// GET /api/supervisors/[id] - Get supervisor by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuth(request)
    const { id } = params

    const supervisor = await db.supervisor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            status: true,
          },
        },
        students: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatar: true,
              },
            },
            milestones: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!supervisor) {
      return notFoundResponse()
    }

    // Supervisors can only see their own profile unless admin
    if (authUser.role === UserRole.SUPERVISOR) {
      if (supervisor.userId !== authUser.id) {
        return errorResponse("Forbidden", 403)
      }
    }

    return successResponse({
      ...supervisor,
      currentCapacity: supervisor.students.length,
      capacityUsage: Math.round((supervisor.students.length / supervisor.maxCapacity) * 100),
    })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return errorResponse(error.message, 401)
    }
    console.error("Get supervisor error:", error)
    return errorResponse("Internal server error", 500)
  }
}

