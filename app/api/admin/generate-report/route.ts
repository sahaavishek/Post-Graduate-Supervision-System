import { streamText } from "ai"

export async function POST(req: Request) {
  try {
    const { reportType, data } = await req.json()

    // Create a comprehensive prompt based on the report type and data
    const prompt = createReportPrompt(reportType, data)

    const result = streamText({
      model: "openai/gpt-4o-mini",
      prompt,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("[v0] Error generating report:", error)
    return new Response(JSON.stringify({ error: "Failed to generate report" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

function createReportPrompt(reportType: string, data: any): string {
  const basePrompt = `You are an expert academic analytics report generator. Generate a comprehensive, professional report in markdown format.`

  switch (reportType) {
    case "Progress Analytics":
      return `${basePrompt}

Report Type: Progress Analytics Report
Data: ${JSON.stringify(data, null, 2)}

Generate a detailed progress analytics report that includes:
1. Executive Summary - Key findings and overall trends
2. Program-by-Program Analysis - Detailed breakdown of each program's performance
3. Student Progress Trends - Identify patterns in student progress rates
4. Risk Assessment - Highlight programs or areas requiring attention
5. Recommendations - Actionable insights for improving student outcomes
6. Statistical Analysis - Key metrics and comparisons

Format the report professionally with clear sections, bullet points, and data-driven insights. Include specific numbers and percentages from the data.`

    case "Meeting Reports":
      return `${basePrompt}

Report Type: Meeting Reports Analysis
Data: ${JSON.stringify(data, null, 2)}

Generate a comprehensive meeting analytics report that includes:
1. Executive Summary - Overall meeting statistics and trends
2. Monthly Breakdown - Detailed analysis of each month's performance
3. Success Rate Analysis - Factors contributing to meeting completion
4. Cancellation Patterns - Identify reasons and trends for cancelled meetings
5. Recommendations - Strategies to improve meeting attendance and effectiveness
6. Comparative Analysis - Month-over-month trends

Use the data provided to create specific, actionable insights.`

    case "Document Statistics":
      return `${basePrompt}

Report Type: Document Statistics Report
Data: ${JSON.stringify(data, null, 2)}

Generate a detailed document submission and review report that includes:
1. Executive Summary - Overview of document submission trends
2. Document Type Analysis - Breakdown by document category
3. Review Efficiency - Analysis of pending vs approved documents
4. Bottleneck Identification - Areas where reviews are delayed
5. Recommendations - Strategies to improve document processing
6. Trend Analysis - Submission and approval patterns

Provide specific insights based on the data provided.`

    case "Performance":
      return `${basePrompt}

Report Type: Student Performance Report
Data: ${JSON.stringify(data, null, 2)}

Generate a comprehensive performance analysis report that includes:
1. Executive Summary - Key performance insights
2. Top Performers Analysis - What makes these students successful
3. At-Risk Students Assessment - Detailed analysis of challenges
4. Intervention Strategies - Specific recommendations for at-risk students
5. Success Factors - Common patterns among high performers
6. Action Plan - Prioritized steps for improving overall performance

Use the data to provide specific, actionable recommendations.`

    case "Complete System":
      return `${basePrompt}

Report Type: Complete System Analytics Report
Data: ${JSON.stringify(data, null, 2)}

Generate a comprehensive system-wide report that includes:
1. Executive Summary - High-level overview of all metrics
2. Progress Analytics - Student progress across all programs
3. Meeting Statistics - Supervision meeting trends
4. Document Processing - Submission and review analysis
5. Performance Overview - Top performers and at-risk students
6. System Health Assessment - Overall system effectiveness
7. Strategic Recommendations - Priority actions for improvement
8. Future Outlook - Predictions and trends

Create a thorough, data-driven report suitable for executive review.`

    default:
      return `${basePrompt}

Generate a general analytics report based on the following data:
${JSON.stringify(data, null, 2)}

Include key insights, trends, and recommendations.`
  }
}
