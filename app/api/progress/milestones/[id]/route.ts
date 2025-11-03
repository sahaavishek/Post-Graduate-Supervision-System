import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api"

// PATCH /api/progress/milestones/[id] - Update milestone
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuth(request)
    const { id } = params
    const body = await request.json()

    const milestone = await db.milestone.findUnique({
      where: { id },
    })

    if (!milestone) {
      return notFoundResponse()
    }

    const updateData: any = {}
    if (body.progress !== undefined) updateData.progress = body.progress
    if (body.status) updateData.status = body.status.toUpperCase()
    if (body.completedDate) updateData.completedDate = new Date(body.completedDate)
    if (body.name) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null

    const updatedMilestone = await db.milestone.update({
      where: { id },
      data: updateData,
    })

    // Update overall progress
    await updateStudentOverallProgress(milestone.studentId)

    return successResponse(updatedMilestone)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Update milestone error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// DELETE /api/progress/milestones/[id] - Delete milestone
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuth(request)
    const { id } = params

    const milestone = await db.milestone.findUnique({
      where: { id },
    })

    if (!milestone) {
      return notFoundResponse()
    }

    await db.milestone.delete({
      where: { id },
    })

    // Update overall progress
    await updateStudentOverallProgress(milestone.studentId)

    return successResponse({ message: "Milestone deleted successfully" })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Delete milestone error:", error)
    return errorResponse("Internal server error", 500)
  }
}

async function updateStudentOverallProgress(studentId: string) {
  const milestones = await db.milestone.findMany({
    where: { studentId },
  })

  if (milestones.length === 0) {
    return
  }

  const totalProgress = milestones.reduce((sum, m) => sum + m.progress, 0)
  const overallProgress = Math.round(totalProgress / milestones.length)

  await db.student.update({
    where: { id: studentId },
    data: {
      overallProgress,
    },
  })
}

