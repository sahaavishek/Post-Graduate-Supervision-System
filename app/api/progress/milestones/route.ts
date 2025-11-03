import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/utils/api"

// GET /api/progress/milestones - Get milestones
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")

    let finalStudentId = studentId

    if (!finalStudentId) {
      if (authUser.role === "STUDENT") {
        const student = await db.student.findFirst({
          where: { userId: authUser.id },
        })
        if (student) {
          finalStudentId = student.id
        }
      }
    }

    if (!finalStudentId) {
      return errorResponse("Student ID is required", 400)
    }

    const milestones = await db.milestone.findMany({
      where: {
        studentId: finalStudentId,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return successResponse(milestones)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Get milestones error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/progress/milestones - Create or update milestone
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request)
    const body = await request.json()

    const { studentId, name, description, progress, status, dueDate } = body

    if (!studentId || !name) {
      return errorResponse("Student ID and name are required", 400)
    }

    const milestone = await db.milestone.create({
      data: {
        studentId,
        name,
        description,
        progress: progress || 0,
        status: status || "PENDING",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    })

    // Update overall progress
    await updateStudentOverallProgress(studentId)

    return successResponse(milestone, 201)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Create milestone error:", error)
    return errorResponse("Internal server error", 500)
  }
}


