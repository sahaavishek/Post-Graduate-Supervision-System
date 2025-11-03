import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// GET /api/students - Get all students
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const supervisorId = searchParams.get("supervisorId")
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    const where: any = {}

    if (authUser.role === UserRole.SUPERVISOR) {
      const supervisor = await db.supervisor.findFirst({
        where: { userId: authUser.id },
      })
      if (supervisor) {
        where.supervisorId = supervisor.id
      } else {
        return successResponse([])
      }
    } else if (supervisorId) {
      where.supervisorId = supervisorId
    }

    if (status && status !== "all") {
      const studentUsers = await db.user.findMany({
        where: {
          role: UserRole.STUDENT,
          status: status.toUpperCase(),
        },
        select: { id: true },
      })
      where.userId = {
        in: studentUsers.map((u) => u.id),
      }
    }

    if (search) {
      const studentUsers = await db.user.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      })
      where.userId = {
        in: studentUsers.map((u) => u.id),
      }
    }

    const students = await db.student.findMany({
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
        milestones: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return successResponse(students)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Get students error:", error)
    return errorResponse("Internal server error", 500)
  }
}

