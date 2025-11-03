import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api"
import { MeetingStatus } from "@prisma/client"

// GET /api/meetings/[id] - Get meeting by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuth(request)
    const { id } = params

    const meeting = await db.meeting.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        supervisor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    if (!meeting) {
      return notFoundResponse()
    }

    return successResponse(meeting)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Get meeting error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// PATCH /api/meetings/[id] - Update meeting
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuth(request)
    const { id } = params
    const body = await request.json()

    const meeting = await db.meeting.findUnique({
      where: { id },
    })

    if (!meeting) {
      return notFoundResponse()
    }

    const updateData: any = {}
    if (body.status) updateData.status = body.status.toUpperCase()
    if (body.scheduledDate) updateData.scheduledDate = new Date(body.scheduledDate)
    if (body.agenda !== undefined) updateData.agenda = body.agenda
    if (body.location !== undefined) updateData.location = body.location
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.recordingUrl !== undefined) updateData.recordingUrl = body.recordingUrl

    const updatedMeeting = await db.meeting.update({
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
    })

    return successResponse(updatedMeeting)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Update meeting error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// DELETE /api/meetings/[id] - Cancel meeting
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuth(request)
    const { id } = params

    const meeting = await db.meeting.update({
      where: { id },
      data: {
        status: MeetingStatus.CANCELLED,
      },
    })

    return successResponse({ message: "Meeting cancelled successfully" })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Cancel meeting error:", error)
    return errorResponse("Internal server error", 500)
  }
}

