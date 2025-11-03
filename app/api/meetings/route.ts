import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, getAuthUser } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/utils/api"
import { UserRole, MeetingStatus } from "@prisma/client"

// GET /api/meetings - Get meetings (filtered by user role)
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const studentId = searchParams.get("studentId")
    const upcoming = searchParams.get("upcoming") === "true"

    const where: any = {}

    if (authUser.role === UserRole.STUDENT) {
      const student = await db.student.findFirst({
        where: { userId: authUser.id },
      })
      if (student) {
        where.studentId = student.id
      }
    } else if (authUser.role === UserRole.SUPERVISOR) {
      const supervisor = await db.supervisor.findFirst({
        where: { userId: authUser.id },
      })
      if (supervisor) {
        where.supervisorId = supervisor.id
        if (studentId) {
          where.studentId = studentId
        }
      }
    }

    if (status && status !== "all") {
      where.status = status.toUpperCase()
    }

    if (upcoming) {
      where.scheduledDate = {
        gte: new Date(),
      }
      where.status = {
        in: [MeetingStatus.PENDING, MeetingStatus.CONFIRMED],
      }
    }

    const meetings = await db.meeting.findMany({
      where,
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
      orderBy: {
        scheduledDate: "desc",
      },
    })

    return successResponse(meetings)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Get meetings error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/meetings - Create a new meeting
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request)
    const body = await request.json()

    const { title, agenda, scheduledDate, duration, location, meetingType, studentId, supervisorId } =
      body

    if (!title || !scheduledDate || !duration || !meetingType) {
      return errorResponse("Title, scheduled date, duration, and meeting type are required", 400)
    }

    // Determine studentId and supervisorId based on user role
    let finalStudentId = studentId
    let finalSupervisorId = supervisorId

    if (authUser.role === UserRole.STUDENT) {
      const student = await db.student.findFirst({
        where: { userId: authUser.id },
      })
      if (!student) {
        return errorResponse("Student profile not found", 404)
      }
      finalStudentId = student.id
      if (!finalSupervisorId && student.supervisorId) {
        finalSupervisorId = student.supervisorId
      }
    } else if (authUser.role === UserRole.SUPERVISOR) {
      const supervisor = await db.supervisor.findFirst({
        where: { userId: authUser.id },
      })
      if (!supervisor) {
        return errorResponse("Supervisor profile not found", 404)
      }
      finalSupervisorId = supervisor.id
      if (!finalStudentId) {
        return errorResponse("Student ID is required", 400)
      }
    }

    if (!finalStudentId || !finalSupervisorId) {
      return errorResponse("Student and supervisor IDs are required", 400)
    }

    // Generate meeting link if online
    let meetingLink = null
    if (meetingType === "ONLINE") {
      const meetingId = `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`
      meetingLink = `https://utmgradient.webex.com/meet/${meetingId}`
    }

    const meeting = await db.meeting.create({
      data: {
        title,
        agenda,
        scheduledDate: new Date(scheduledDate),
        duration: parseInt(duration),
        location,
        meetingType: meetingType.toUpperCase(),
        meetingLink,
        status: MeetingStatus.PENDING,
        studentId: finalStudentId,
        supervisorId: finalSupervisorId,
      },
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

    return successResponse(meeting, 201)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Create meeting error:", error)
    return errorResponse("Internal server error", 500)
  }
}

