import { NextResponse } from "next/server"

function generateProgressReport(studentData: any): string {
  const {
    name,
    program,
    startDate,
    expectedCompletion,
    progress,
    milestones = [],
    lastMeeting,
    meetingsThisMonth,
    documentsSubmitted,
    pendingReviews,
  } = studentData

  const completedMilestones = milestones.filter((m: any) => m.progress === 100).length
  const totalMilestones = milestones.length

  const report = `
STUDENT PROGRESS REPORT
Generated: ${new Date().toLocaleString()}

STUDENT INFORMATION
Name: ${name}
Program: ${program || "N/A"}
Start Date: ${startDate || "N/A"}
Expected Completion: ${expectedCompletion || "N/A"}
Overall Progress: ${progress}%

PROGRESS SUMMARY
${name} has completed ${progress}% of their postgraduate program with ${completedMilestones} out of ${totalMilestones} milestones completed.

Status: ${progress >= 75 ? "Excellent Progress" : progress >= 50 ? "Good Progress" : progress >= 25 ? "Early Stage" : "Getting Started"}

MILESTONES
${
  milestones.length > 0
    ? milestones
        .map((m: any) => {
          const status = m.progress === 100 ? "Completed" : m.progress > 0 ? "In Progress" : "Not Started"
          return `${m.name} - ${m.progress}% - ${status}`
        })
        .join("\n")
    : "No milestones available"
}

SUPERVISION ACTIVITY
Last Meeting: ${lastMeeting || "N/A"}
Meetings This Month: ${meetingsThisMonth || 0}
Documents Submitted: ${documentsSubmitted || 0}
Pending Reviews: ${pendingReviews || 0}

RECOMMENDATIONS
${
  progress >= 75
    ? "Continue excellent work and maintain current momentum."
    : progress >= 50
      ? "Maintain steady progress and focus on completing remaining milestones."
      : "Establish clear goals and increase engagement with supervisors."
}
${meetingsThisMonth && meetingsThisMonth < 2 ? "\nSchedule more regular meetings with supervisor." : ""}
${pendingReviews && pendingReviews > 0 ? `\nFollow up on ${pendingReviews} pending review(s).` : ""}
`

  return report.trim()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentData } = body

    if (!studentData) {
      return NextResponse.json({ error: "Student data is required" }, { status: 400 })
    }

    const report = generateProgressReport(studentData)

    return NextResponse.json({
      report,
      generatedAt: new Date().toISOString(),
      studentName: studentData.name,
    })
  } catch (error) {
    console.error("[v0] Error generating report:", error)
    return NextResponse.json(
      {
        error: "Failed to generate report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
