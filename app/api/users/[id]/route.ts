import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, getAuthUser } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// GET /api/users/[id] - Get user by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuth(request)
    const { id } = params

    // Users can only view their own profile unless they're admin
    if (authUser.role !== UserRole.ADMIN && authUser.id !== id) {
      return errorResponse("Forbidden", 403)
    }

    const user = await db.user.findUnique({
      where: { id },
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
    })

    if (!user) {
      return notFoundResponse()
    }

    return successResponse(user)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Get user error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuth(request)
    const { id } = params

    // Users can only update their own profile unless they're admin
    if (authUser.role !== UserRole.ADMIN && authUser.id !== id) {
      return errorResponse("Forbidden", 403)
    }

    const body = await request.json()
    const { password, ...updateData } = body

    const updatePayload: any = {
      ...updateData,
    }

    if (password) {
      const { hashPassword } = await import("@/lib/auth")
      updatePayload.password = await hashPassword(password)
    }

    const user = await db.user.update({
      where: { id },
      data: updatePayload,
    })

    return successResponse(user)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Update user error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// DELETE /api/users/[id] - Deactivate user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuth(request, [UserRole.ADMIN])
    const { id } = params

    const user = await db.user.update({
      where: { id },
      data: {
        status: "INACTIVE",
      },
    })

    return successResponse({ message: "User deactivated successfully" })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return errorResponse(error.message, 401)
    }
    console.error("Delete user error:", error)
    return errorResponse("Internal server error", 500)
  }
}

