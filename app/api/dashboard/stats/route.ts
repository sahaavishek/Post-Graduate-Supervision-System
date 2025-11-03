import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request)

    if (authUser.role === UserRole.ADMIN) {
      return await getAdminStats()
    } else if (authUser.role === UserRole.SUPERVISOR) {
      return await getSupervisorStats(authUser)
    } else if (authUser.role === UserRole.STUDENT) {
      return await getStudentStats(authUser)
    }

    return errorResponse("Invalid role", 400)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Get dashboard stats error:", error)
    return errorResponse("Internal server error", 500)
  }
}

async function getAdminStats() {
  const totalStudents = await db.student.count()
  const activeSupervisors = await db.supervisor.count()
  const totalUsers = await db.user.count()

  const pendingReviews = await db.weeklySubmission.count({
    where: {
      submissionStatus: "SUBMITTED",
    },
  })

  // Calculate completion rate (students with >75% progress)
  const studentsWithProgress = await db.student.count({
    where: {
      overallProgress: {
        gte: 75,
      },
    },
  })

  const completionRate =
    totalStudents > 0 ? Math.round((studentsWithProgress / totalStudents) * 100) : 0

  return successResponse({
    totalStudents,
    activeSupervisors,
    totalUsers,
    pendingReviews,
    completionRate,
  })
}

async function getSupervisorStats(authUser: any) {
  const supervisor = await db.supervisor.findFirst({
    where: { userId: authUser.id },
  })

  if (!supervisor) {
    return successResponse({
      totalStudents: 0,
      pendingReviews: 0,
      meetingsThisWeek: 0,
      avgProgress: 0,
    })
  }

  const totalStudents = await db.student.count({
    where: { supervisorId: supervisor.id },
  })

  const pendingReviews = await db.weeklySubmission.count({
    where: {
      student: {
        supervisorId: supervisor.id,
      },
      submissionStatus: "SUBMITTED",
    },
  })

  const now = new Date()
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const meetingsThisWeek = await db.meeting.count({
    where: {
      supervisorId: supervisor.id,
      scheduledDate: {
        gte: weekStart,
        lte: weekEnd,
      },
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
    },
  })

  const students = await db.student.findMany({
    where: { supervisorId: supervisor.id },
    select: { overallProgress: true },
  })

  const avgProgress =
    students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.overallProgress, 0) / students.length)
      : 0

  return successResponse({
    totalStudents,
    pendingReviews,
    meetingsThisWeek,
    avgProgress,
  })
}

async function getStudentStats(authUser: any) {
  const student = await db.student.findFirst({
    where: { userId: authUser.id },
  })

  if (!student) {
    return successResponse({
      overallProgress: 0,
      meetingsThisMonth: 0,
      documentsSubmitted: 0,
      pendingReviews: 0,
    })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const meetingsThisMonth = await db.meeting.count({
    where: {
      studentId: student.id,
      scheduledDate: {
        gte: monthStart,
      },
    },
  })

  const documentsSubmitted = await db.document.count({
    where: {
      uploadedByStudentId: student.id,
    },
  })

  const pendingReviews = await db.weeklySubmission.count({
    where: {
      studentId: student.id,
      submissionStatus: "SUBMITTED",
    },
  })

  return successResponse({
    overallProgress: student.overallProgress,
    meetingsThisMonth,
    documentsSubmitted,
    pendingReviews,
  })
}

