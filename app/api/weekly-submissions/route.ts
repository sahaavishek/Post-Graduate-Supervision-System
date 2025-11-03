import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/utils/api"
import { UserRole, SubmissionStatus } from "@prisma/client"

// GET /api/weekly-submissions - Get weekly submissions
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const week = searchParams.get("week")

    const where: any = {}

    if (authUser.role === UserRole.STUDENT) {
      const student = await db.student.findFirst({
        where: { userId: authUser.id },
      })
      if (student) {
        where.studentId = student.id
      }
    } else if (studentId) {
      where.studentId = studentId
    }

    if (week) {
      where.week = parseInt(week)
    }

    const submissions = await db.weeklySubmission.findMany({
      where,
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
      orderBy: {
        week: "desc",
      },
    })

    return successResponse(submissions)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Get weekly submissions error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/weekly-submissions - Create weekly submission
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request)
    const body = await request.json()

    const { studentId, week, title, description, uploadDate, dueDate, fileUrl, fileName, comments } =
      body

    if (!studentId || !week || !title || !description) {
      return errorResponse("Student ID, week, title, and description are required", 400)
    }

    let finalStudentId = studentId
    if (authUser.role === UserRole.STUDENT) {
      const student = await db.student.findFirst({
        where: { userId: authUser.id },
      })
      if (student) {
        finalStudentId = student.id
      }
    }

    const submission = await db.weeklySubmission.create({
      data: {
        studentId: finalStudentId,
        week: parseInt(week),
        title,
        description,
        uploadDate: uploadDate ? new Date(uploadDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        submissionStatus: fileUrl ? SubmissionStatus.SUBMITTED : SubmissionStatus.PENDING,
        submittedFile: fileName || null,
        comments: comments || null,
      },
    })

    // Create document if file was uploaded
    if (fileUrl && fileName) {
      await db.document.create({
        data: {
          title: fileName,
          fileUrl,
          fileName,
          fileType: fileName.endsWith(".pdf") ? "PDF" : "DOCX",
          uploadedByStudentId: finalStudentId,
          weeklySubmissionId: submission.id,
        },
      })
    }

    return successResponse(submission, 201)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Create weekly submission error:", error)
    return errorResponse("Internal server error", 500)
  }
}

