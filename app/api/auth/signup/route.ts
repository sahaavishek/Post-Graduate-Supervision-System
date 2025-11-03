import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone, role, ...profileData } = body

    if (!email || !password || !name || !role) {
      return errorResponse("Email, password, name, and role are required", 400)
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return errorResponse("User with this email already exists", 409)
    }

    const hashedPassword = await hashPassword(password)

    // Create user and profile in a transaction
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
        const student = await tx.student.create({
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
        return { ...newUser, studentId: student.id }
      } else if (role.toLowerCase() === "supervisor") {
        const supervisor = await tx.supervisor.create({
          data: {
            userId: newUser.id,
            department: profileData.department || "",
            maxCapacity: profileData.maxCapacity || 10,
          },
        })
        return { ...newUser, supervisorId: supervisor.id }
      }

      return newUser
    })

    return successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token: user.id, // Simplified - use JWT in production
      },
      201,
    )
  } catch (error) {
    console.error("Signup error:", error)
    return errorResponse("Internal server error", 500)
  }
}

