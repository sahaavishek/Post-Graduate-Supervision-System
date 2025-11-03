import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { successResponse, errorResponse, notFoundResponse } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// GET /api/documents/[id] - Get document by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuth(request)
    const { id } = params

    const document = await db.document.findUnique({
      where: { id },
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
    })

    if (!document) {
      return notFoundResponse()
    }

    // Check access permissions
    if (authUser.role === UserRole.STUDENT) {
      const student = await db.student.findFirst({
        where: { userId: authUser.id },
      })
      if (student && document.uploadedByStudentId !== student.id) {
        // Check if document was uploaded by their supervisor
        if (document.uploadedBySupervisorId !== student.supervisorId) {
          return errorResponse("Forbidden", 403)
        }
      }
    } else if (authUser.role === UserRole.SUPERVISOR) {
      const supervisor = await db.supervisor.findFirst({
        where: { userId: authUser.id },
      })
      if (supervisor) {
        if (
          document.uploadedBySupervisorId !== supervisor.id &&
          document.student?.supervisorId !== supervisor.id
        ) {
          return errorResponse("Forbidden", 403)
        }
      }
    }

    return successResponse(document)
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return errorResponse(error.message, 401)
    }
    console.error("Get document error:", error)
    return errorResponse("Internal server error", 500)
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await requireAuth(request)
    const { id } = params

    const document = await db.document.findUnique({
      where: { id },
    })

    if (!document) {
      return notFoundResponse()
    }

    // Check permissions
    if (authUser.role === UserRole.STUDENT) {
      const student = await db.student.findFirst({
        where: { userId: authUser.id },
      })
      if (student && document.uploadedByStudentId !== student.id) {
        return errorResponse("Forbidden", 403)
      }
    } else if (authUser.role === UserRole.SUPERVISOR) {
      const supervisor = await db.supervisor.findFirst({
        where: { userId: authUser.id },
      })
      if (supervisor && document.uploadedBySupervisorId !== supervisor.id) {
        return errorResponse("Forbidden", 403)
      }
    } else if (authUser.role !== UserRole.ADMIN) {
      return errorResponse("Forbidden", 403)
    }

    await db.document.delete({
      where: { id },
    })

    return successResponse({ message: "Document deleted successfully" })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return errorResponse(error.message, 401)
    }
    console.error("Delete document error:", error)
    return errorResponse("Internal server error", 500)
  }
}

