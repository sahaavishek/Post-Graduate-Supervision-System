import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// GET /api/students/[id] - Get student by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuth(request)
    const { id } = params

    const student = await db.student.findUnique({
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
        supervisor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        milestones: {
          orderBy: {
            createdAt: "asc",
          },
        },
        meetings: {
          include: {
            supervisor: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            scheduledDate: "desc",
          },
          take: 10,
        },
        weeklySubmissions: {
          orderBy: {
            week: "desc",
          },
          take: 10,
        },
      },
    })

    if (!student) {
      return notFoundResponse()
    }

    // Supervisors can only see their own students
    if (authUser.role === UserRole.SUPERVISOR) {
      const supervisor = await db.supervisor.findFirst({
        where: { userId: authUser.id },
      })
      if (supervisor && student.supervisorId !== supervisor.id) {
        return errorResponse("Forbidden", 403)
      }
    }

    return successResponse(student)
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return errorResponse(error.message, 401)
    }
    console.error("Get student error:", error)
    return errorResponse("Internal server error", 500)
  }
}

