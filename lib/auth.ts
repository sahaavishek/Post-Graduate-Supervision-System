import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "./db"
import { UserRole } from "@prisma/client"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  userId?: string
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)
    // In a real app, you'd verify the JWT token here
    // For now, we'll use a simple session-based approach
    const user = await db.user.findFirst({
      where: {
        id: token, // Simplified - use proper JWT verification in production
      },
      include: {
        studentProfile: true,
        supervisorProfile: true,
      },
    })

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      userId: user.studentProfile?.id || user.supervisorProfile?.id || undefined,
    }
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: UserRole[]
): Promise<AuthUser> {
  const user = await getAuthUser(request)
  if (!user) {
    throw new Error("Unauthorized")
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("Forbidden")
  }
  return user
}

