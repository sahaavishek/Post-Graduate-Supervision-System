import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// GET /api/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request, [UserRole.ADMIN])

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: any = {}
    if (role && role !== "all") {
      where.role = role.toUpperCase()
    }
    if (status && status !== "all") {
      where.status = status.toUpperCase()
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    const users = await db.user.findMany({
      where,
      include: {
        studentProfile: {
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
        },
        supervisorProfile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return successResponse(users)
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return errorResponse(error.message, 401)
    }
    console.error("Get users error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/users - Create a new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request, [UserRole.ADMIN])

    const body = await request.json()
    const { email, password, name, phone, role, ...profileData } = body

    if (!email || !password || !name || !role) {
      return errorResponse("Email, password, name, and role are required", 400)
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return errorResponse("User with this email already exists", 409)
    }

    const { hashPassword } = await import("@/lib/auth")
    const hashedPassword = await hashPassword(password)

    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role: role.toUpperCase() as UserRole,
        },
      })

      if (role.toLowerCase() === "student") {
        await tx.student.create({
          data: {
            userId: newUser.id,
            program: profileData.program || "",
            startDate: profileData.startDate ? new Date(profileData.startDate) : new Date(),
            expectedCompletion: profileData.expectedCompletion
              ? new Date(profileData.expectedCompletion)
              : null,
            supervisorId: profileData.supervisorId || null,
          },
        })
      } else if (role.toLowerCase() === "supervisor") {
        await tx.supervisor.create({
          data: {
            userId: newUser.id,
            department: profileData.department || "",
            maxCapacity: profileData.maxCapacity || 10,
          },
        })
      }

      return newUser
    })

    return successResponse(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      201,
    )
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return errorResponse(error.message, 401)
    }
    console.error("Create user error:", error)
    return errorResponse("Internal server error", 500)
  }
}

