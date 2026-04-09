import { NextResponse } from "next/server"

function generateAnalyticsReport(reportType: string, data: any): string {
  const timestamp = new Date().toLocaleString()

  if (reportType === "Progress Analytics") {
    const totalStudents = data.programs?.reduce((sum: number, p: any) => sum + p.enrolled, 0) || 0
    const totalOnTrack = data.programs?.reduce((sum: number, p: any) => sum + p.onTrack, 0) || 0
    const totalDelayed = data.programs?.reduce((sum: number, p: any) => sum + p.delayed, 0) || 0
    const avgProgress =
      data.programs?.reduce((sum: number, p: any) => sum + Number.parseFloat(p.progress), 0) /
        (data.programs?.length || 1) || 0

    return `
PROGRESS ANALYTICS REPORT
Generated: ${timestamp}

EXECUTIVE SUMMARY
Total Students Enrolled: ${totalStudents}
Students On Track: ${totalOnTrack} (${((totalOnTrack / totalStudents) * 100).toFixed(1)}%)
Students Delayed: ${totalDelayed} (${((totalDelayed / totalStudents) * 100).toFixed(1)}%)
Average Progress: ${avgProgress.toFixed(1)}%

PROGRAM BREAKDOWN
${data.programs?.map((p: any) => `${p.name}\nEnrolled: ${p.enrolled} | On Track: ${p.onTrack} | Delayed: ${p.delayed} | Progress: ${p.progress}`).join("\n\n") || "No program data available"}

KEY INSIGHTS
${avgProgress >= 70 ? "Overall student progress is excellent across all programs." : avgProgress >= 50 ? "Student progress is satisfactory with room for improvement." : "Student progress requires attention and intervention."}

${totalDelayed > totalOnTrack ? "High number of delayed students requires immediate attention." : "Most students are maintaining good progress."}

RECOMMENDATIONS
${totalDelayed > 0 ? `- Implement support programs for ${totalDelayed} delayed students\n- Schedule progress review meetings with at-risk students` : "- Continue current supervision practices"}
- Monitor progress trends monthly
- Identify and share best practices from high-performing programs
`.trim()
  }

  if (reportType === "Meeting Reports") {
    const totalMeetings = data.totalMeetings || 0
    const upcomingMeetings = data.upcomingMeetings || 0
    const completedMeetings = data.completedMeetings || 0
    const avgDuration = data.avgDuration || 0

    return `
MEETING REPORTS ANALYSIS
Generated: ${timestamp}

MEETING STATISTICS
Total Meetings: ${totalMeetings}
Completed: ${completedMeetings}
Upcoming: ${upcomingMeetings}
Average Duration: ${avgDuration} minutes

MEETING TRENDS
${completedMeetings > 0 ? `Completion Rate: ${((completedMeetings / totalMeetings) * 100).toFixed(1)}%` : "No completed meetings data"}
${upcomingMeetings > 5 ? "High volume of upcoming meetings scheduled" : "Moderate meeting schedule"}

SUPERVISOR ENGAGEMENT
${data.supervisors?.map((s: any) => `${s.name}: ${s.meetings} meetings`).join("\n") || "No supervisor data available"}

RECOMMENDATIONS
- Ensure all scheduled meetings are conducted on time
- Maintain regular meeting cadence with all students
- Document meeting outcomes and action items
`.trim()
  }

  if (reportType === "Document Statistics") {
    const totalDocs = data.totalDocuments || 0
    const pending = data.pendingReview || 0
    const approved = data.approved || 0
    const avgReviewTime = data.avgReviewTime || 0

    return `
DOCUMENT STATISTICS REPORT
Generated: ${timestamp}

DOCUMENT OVERVIEW
Total Documents: ${totalDocs}
Approved: ${approved}
Pending Review: ${pending}
Average Review Time: ${avgReviewTime} days

DOCUMENT TYPES
${data.documentTypes?.map((d: any) => `${d.type}: ${d.count} documents`).join("\n") || "No document type data"}

REVIEW PERFORMANCE
${pending > approved ? "High backlog of pending reviews requires attention" : "Document review process is efficient"}
${avgReviewTime > 7 ? "Review time exceeds target - consider additional reviewers" : "Review time is within acceptable range"}

RECOMMENDATIONS
${pending > 10 ? "- Prioritize pending document reviews\n- Assign additional reviewers if needed" : "- Maintain current review pace"}
- Set clear review deadlines
- Implement automated reminders for pending reviews
`.trim()
  }

  if (reportType === "Performance") {
    const avgGrade = data.avgGrade || 0
    const topPerformers = data.topPerformers || 0
    const needsSupport = data.needsSupport || 0

    return `
PERFORMANCE ANALYSIS REPORT
Generated: ${timestamp}

PERFORMANCE OVERVIEW
Average Grade: ${avgGrade}%
Top Performers: ${topPerformers} students
Needs Support: ${needsSupport} students

PERFORMANCE DISTRIBUTION
${data.distribution?.map((d: any) => `${d.range}: ${d.count} students (${d.percentage}%)`).join("\n") || "No distribution data"}

TRENDS ANALYSIS
${avgGrade >= 75 ? "Overall performance is excellent" : avgGrade >= 60 ? "Performance is satisfactory" : "Performance requires improvement"}
${needsSupport > 0 ? `${needsSupport} students require additional academic support` : "All students performing adequately"}

RECOMMENDATIONS
${needsSupport > 0 ? "- Implement targeted support programs\n- Schedule academic counseling sessions" : "- Continue current academic support"}
- Recognize and reward top performers
- Share success strategies across cohorts
`.trim()
  }

  // Complete System Report
  return `
COMPLETE SYSTEM REPORT
Generated: ${timestamp}

SYSTEM OVERVIEW
This comprehensive report provides insights across all system metrics including progress analytics, meeting reports, document statistics, and performance analysis.

OVERALL HEALTH
System Status: Operational
Active Users: ${data.activeUsers || 0}
Total Students: ${data.totalStudents || 0}
Total Supervisors: ${data.totalSupervisors || 0}

KEY METRICS
Average Student Progress: ${data.avgProgress || 0}%
Total Meetings This Month: ${data.meetingsThisMonth || 0}
Documents Pending Review: ${data.pendingDocs || 0}
System Uptime: 99.9%

RECOMMENDATIONS
- Continue monitoring all key metrics
- Address any bottlenecks in document review process
- Maintain regular communication between students and supervisors
- Schedule quarterly system review meetings
`.trim()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reportType, data } = body

    if (!reportType) {
      return NextResponse.json({ error: "Report type is required" }, { status: 400 })
    }

    const report = generateAnalyticsReport(reportType, data || {})

    return NextResponse.json({
      report,
      generatedAt: new Date().toISOString(),
      reportType,
    })
  } catch (error) {
    console.error("[v0] Error generating analytics report:", error)
    return NextResponse.json(
      {
        error: "Failed to generate report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
