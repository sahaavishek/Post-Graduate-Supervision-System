import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api"
import { SubmissionStatus } from "@prisma/client"

// PATCH /api/weekly-submissions/[id] - Update weekly submission (e.g., add feedback)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuth(request)
    const { id } = params
    const body = await request.json()

    const submission = await db.weeklySubmission.findUnique({
      where: { id },
    })

    if (!submission) {
      return notFoundResponse()
    }

    const updateData: any = {}
    if (body.submissionStatus) {
      updateData.submissionStatus = body.submissionStatus.toUpperCase()
    }
    if (body.supervisorFeedback !== undefined) {
      updateData.supervisorFeedback = body.supervisorFeedback
    }
    if (body.comments !== undefined) {
      updateData.comments = body.comments
    }

    const updatedSubmission = await db.weeklySubmission.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        documents: true,
      },
    })

    return successResponse(updatedSubmission)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Update weekly submission error:", error)
    return errorResponse("Internal server error", 500)
  }
}

