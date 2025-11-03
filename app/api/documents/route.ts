import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// GET /api/documents - Get documents
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const supervisorId = searchParams.get("supervisorId")
    const weeklySubmissionId = searchParams.get("weeklySubmissionId")

    const where: any = {}

    if (authUser.role === UserRole.STUDENT) {
      const student = await db.student.findFirst({
        where: { userId: authUser.id },
      })
      if (student) {
        where.OR = [
          { uploadedByStudentId: student.id },
          { uploadedBySupervisorId: student.supervisorId },
        ]
      }
    } else if (authUser.role === UserRole.SUPERVISOR) {
      const supervisor = await db.supervisor.findFirst({
        where: { userId: authUser.id },
      })
      if (supervisor) {
        where.OR = [
          { uploadedBySupervisorId: supervisor.id },
          {
            student: {
              supervisorId: supervisor.id,
            },
          },
        ]
        if (studentId) {
          const student = await db.student.findUnique({
            where: { id: studentId },
          })
          if (student && student.supervisorId === supervisor.id) {
            where.OR = [{ uploadedByStudentId: studentId }, { uploadedBySupervisorId: supervisor.id }]
          }
        }
      }
    } else if (authUser.role === UserRole.ADMIN) {
      // Admin can see all documents
      if (studentId) {
        where.uploadedByStudentId = studentId
      }
      if (supervisorId) {
        where.uploadedBySupervisorId = supervisorId
      }
    }

    if (weeklySubmissionId) {
      where.weeklySubmissionId = weeklySubmissionId
    }

    const documents = await db.document.findMany({
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
        weeklySubmission: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return successResponse(documents)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Get documents error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// POST /api/documents - Upload a document
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request)
    const formData = await request.formData()

    const title = formData.get("title") as string
    const description = formData.get("description") as string | null
    const fileUrl = formData.get("fileUrl") as string
    const fileName = formData.get("fileName") as string
    const fileSize = formData.get("fileSize") as string
    const fileType = formData.get("fileType") as string
    const studentId = formData.get("studentId") as string | null
    const supervisorId = formData.get("supervisorId") as string | null
    const weeklySubmissionId = formData.get("weeklySubmissionId") as string | null

    if (!title || !fileUrl || !fileName || !fileType) {
      return errorResponse("Title, file URL, file name, and file type are required", 400)
    }

    let uploadedByStudentId = null
    let uploadedBySupervisorId = null

    if (authUser.role === UserRole.STUDENT) {
      const student = await db.student.findFirst({
        where: { userId: authUser.id },
      })
      if (!student) {
        return errorResponse("Student profile not found", 404)
      }
      uploadedByStudentId = student.id
    } else if (authUser.role === UserRole.SUPERVISOR) {
      const supervisor = await db.supervisor.findFirst({
        where: { userId: authUser.id },
      })
      if (!supervisor) {
        return errorResponse("Supervisor profile not found", 404)
      }
      uploadedBySupervisorId = supervisor.id
    }

    if (studentId) {
      uploadedByStudentId = studentId
    }
    if (supervisorId) {
      uploadedBySupervisorId = supervisorId
    }

    const document = await db.document.create({
      data: {
        title,
        description,
        fileUrl,
        fileName,
        fileSize: parseInt(fileSize || "0"),
        fileType: fileType.toUpperCase(),
        uploadedByStudentId,
        uploadedBySupervisorId,
        weeklySubmissionId: weeklySubmissionId || null,
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

    return successResponse(document, 201)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401)
    }
    console.error("Create document error:", error)
    return errorResponse("Internal server error", 500)
  }
}

