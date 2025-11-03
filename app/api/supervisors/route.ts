import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// GET /api/supervisors - Get all supervisors
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const department = searchParams.get("department")

    const where: any = {}

    if (search) {
      const supervisorUsers = await db.user.findMany({
        where: {
          role: UserRole.SUPERVISOR,
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      })
      where.userId = {
        in: supervisorUsers.map((u) => u.id),
      }
    }

    if (department) {
      where.department = {
        contains: department,
        mode: "insensitive",
      }
    }

    const supervisors = await db.supervisor.findMany({
      where,
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
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            overallProgress: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Calculate capacity usage
    const supervisorsWithCapacity = supervisors.map((supervisor) => ({
      ...supervisor,
      currentCapacity: supervisor.students.length,
      capacityUsage: Math.round((supervisor.students.length / supervisor.maxCapacity) * 100),
    }))

    return successResponse(supervisorsWithCapacity)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Get supervisors error:", error)
    return errorResponse("Internal server error", 500)
  }
}

