import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, role } = body

    if (!email || !password || !role) {
      return errorResponse("Email, password, and role are required", 400)
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        supervisorProfile: true,
      },
    })

    if (!user) {
      return errorResponse("Invalid email or password", 401)
    }

    if (user.role !== role.toUpperCase()) {
      return errorResponse("Invalid role", 401)
    }

    if (user.status !== "ACTIVE") {
      return errorResponse("Account is not active", 403)
    }

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return errorResponse("Invalid email or password", 401)
    }

    // Return user data (in production, return a JWT token)
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      studentId: user.studentProfile?.id,
      supervisorId: user.supervisorProfile?.id,
      token: user.id, // Simplified - use JWT in production
    })
  } catch (error) {
    console.error("Login error:", error)
    return errorResponse("Internal server error", 500)
  }
}

