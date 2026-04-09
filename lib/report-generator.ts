export interface ReportData {
  type: "progress" | "meetings" | "documents" | "performance" | "complete"
  programs?: Array<{
    name: string
    enrolled: number
    onTrack: number
    delayed: number
    percentage: number
  }>
  meetings?: {
    total: number
    completed: number
    upcoming: number
    cancelled: number
  }
  documents?: {
    submitted: number
    pending: number
    reviewed: number
    avgReviewTime: string
  }
  performance?: {
    avgProgress: number
    topPerformers: number
    needsAttention: number
  }
}

export function generateReport(data: ReportData): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  switch (data.type) {
    case "progress":
      return generateProgressReport(data, date)
    case "meetings":
      return generateMeetingsReport(data, date)
    case "documents":
      return generateDocumentsReport(data, date)
    case "performance":
      return generatePerformanceReport(data, date)
    case "complete":
      return generateCompleteReport(data, date)
    default:
      return generateProgressReport(data, date)
  }
}

function generateProgressReport(data: ReportData, date: string): string {
  const programs = data.programs || []
  const totalStudents = programs.reduce((sum, p) => sum + p.enrolled, 0)
  const totalOnTrack = programs.reduce((sum, p) => sum + p.onTrack, 0)
  const totalDelayed = programs.reduce((sum, p) => sum + p.delayed, 0)
  const avgProgress = programs.reduce((sum, p) => sum + p.percentage, 0) / programs.length

  return `# Progress Analytics Report
**Generated on:** ${date}

## Executive Summary

This comprehensive analysis examines the academic progress across ${programs.length} graduate programs, encompassing ${totalStudents} enrolled students. The data reveals important insights into program performance, student progression rates, and areas requiring administrative attention.

### Key Findings

- **Overall Progress Rate:** ${avgProgress.toFixed(1)}% average across all programs
- **Students On Track:** ${totalOnTrack} students (${((totalOnTrack / totalStudents) * 100).toFixed(1)}%)
- **Students Delayed:** ${totalDelayed} students (${((totalDelayed / totalStudents) * 100).toFixed(1)}%)
- **Program Performance:** ${programs.filter((p) => p.percentage >= 70).length} programs exceeding 70% progress threshold

## Detailed Program Analysis

${programs
  .map(
    (program) => `
### ${program.name}

**Enrollment:** ${program.enrolled} students  
**Progress Rate:** ${program.percentage}%  
**Status Distribution:**
- ✅ On Track: ${program.onTrack} students (${((program.onTrack / program.enrolled) * 100).toFixed(1)}%)
- ⚠️ Delayed: ${program.delayed} students (${((program.delayed / program.enrolled) * 100).toFixed(1)}%)

**Analysis:** ${
      program.percentage >= 75
        ? `This program demonstrates excellent performance with ${program.percentage}% overall progress. The high on-track rate indicates effective supervision and student engagement. Continue current practices while monitoring delayed students for early intervention opportunities.`
        : program.percentage >= 65
          ? `This program shows satisfactory progress at ${program.percentage}%. While the majority of students are progressing well, the ${program.delayed} delayed students require attention. Consider implementing additional support mechanisms or reviewing milestone requirements.`
          : `This program requires immediate attention with only ${program.percentage}% progress. The ${program.delayed} delayed students represent a significant portion of enrollment. Recommend conducting a comprehensive review of program structure, supervision quality, and resource allocation.`
    }
`,
  )
  .join("\n")}

## Trends and Patterns

### Positive Indicators
${programs
  .filter((p) => p.percentage >= 70)
  .map((p) => `- **${p.name}:** Strong performance with ${p.onTrack} students maintaining expected progress`)
  .join("\n")}

### Areas of Concern
${programs
  .filter((p) => p.percentage < 70)
  .map((p) => `- **${p.name}:** ${p.delayed} students delayed, requiring intervention strategies`)
  .join("\n")}

## Risk Assessment

**High Priority Programs:** ${programs.filter((p) => p.percentage < 65).length}  
**Medium Priority Programs:** ${programs.filter((p) => p.percentage >= 65 && p.percentage < 75).length}  
**Low Risk Programs:** ${programs.filter((p) => p.percentage >= 75).length}

### Immediate Action Items

1. **Delayed Student Support:** Implement targeted intervention for ${totalDelayed} delayed students
2. **Program Review:** Conduct detailed analysis of programs below 70% progress threshold
3. **Best Practice Sharing:** Facilitate knowledge transfer from high-performing to struggling programs
4. **Resource Allocation:** Assess whether underperforming programs require additional support

## Recommendations

### Short-term (1-3 months)
- Schedule individual meetings with supervisors of delayed students
- Implement progress monitoring checkpoints for at-risk students
- Provide additional resources or workshops for struggling cohorts

### Medium-term (3-6 months)
- Review and potentially revise milestone requirements for underperforming programs
- Establish peer mentoring programs connecting high and low performers
- Enhance supervisor training on student progress management

### Long-term (6-12 months)
- Develop predictive analytics to identify at-risk students earlier
- Create standardized progress benchmarks across all programs
- Implement continuous improvement processes based on performance data

## Conclusion

The current data indicates a ${avgProgress >= 70 ? "generally healthy" : "concerning"} state of student progress across graduate programs. With ${totalOnTrack} students on track and ${totalDelayed} requiring attention, the institution should focus on ${
    avgProgress >= 70
      ? "maintaining current success while addressing specific delayed cases"
      : "implementing comprehensive support systems and reviewing program structures"
  }. Regular monitoring and proactive intervention will be crucial for improving overall outcomes.

---
*This report was generated by the UTM Gradient Analytics System*
`
}

function generateMeetingsReport(data: ReportData, date: string): string {
  const meetings = data.meetings || { total: 0, completed: 0, upcoming: 0, cancelled: 0 }
  const completionRate = meetings.total > 0 ? ((meetings.completed / meetings.total) * 100).toFixed(1) : "0"
  const cancellationRate = meetings.total > 0 ? ((meetings.cancelled / meetings.total) * 100).toFixed(1) : "0"

  return `# Meeting Reports Analysis
**Generated on:** ${date}

## Executive Summary

This report analyzes supervision meeting patterns, attendance rates, and engagement metrics across the graduate research program. Understanding meeting dynamics is crucial for maintaining effective supervisor-student relationships and ensuring consistent academic progress.

### Overview Statistics

- **Total Meetings Scheduled:** ${meetings.total}
- **Completed Meetings:** ${meetings.completed} (${completionRate}%)
- **Upcoming Meetings:** ${meetings.upcoming}
- **Cancelled Meetings:** ${meetings.cancelled} (${cancellationRate}%)

## Meeting Completion Analysis

### Performance Assessment

${
  Number.parseFloat(completionRate) >= 85
    ? `**Excellent:** The ${completionRate}% completion rate demonstrates strong commitment from both supervisors and students. This high engagement level correlates with better research outcomes and student satisfaction.`
    : Number.parseFloat(completionRate) >= 70
      ? `**Good:** The ${completionRate}% completion rate is acceptable but has room for improvement. Consider investigating reasons for non-completion and implementing reminder systems.`
      : `**Needs Improvement:** The ${completionRate}% completion rate is below optimal levels. This may indicate scheduling conflicts, engagement issues, or systemic barriers requiring immediate attention.`
}

### Cancellation Analysis

${
  Number.parseFloat(cancellationRate) <= 10
    ? `The low cancellation rate of ${cancellationRate}% indicates effective scheduling and strong commitment. This is a positive indicator of program health.`
    : Number.parseFloat(cancellationRate) <= 20
      ? `The ${cancellationRate}% cancellation rate is moderate. Monitor patterns to identify if specific supervisors or students have recurring issues.`
      : `The high cancellation rate of ${cancellationRate}% requires investigation. Common causes include scheduling conflicts, workload issues, or engagement problems.`
}

## Upcoming Meetings

**Scheduled:** ${meetings.upcoming} meetings  
**Recommendation:** Ensure all participants receive timely reminders and have clear agendas prepared.

## Recommendations

### Immediate Actions
1. Send automated reminders 24 hours before scheduled meetings
2. Follow up on cancelled meetings to ensure rescheduling
3. Provide meeting agenda templates to improve preparation

### Process Improvements
1. Implement flexible scheduling options to reduce cancellations
2. Create meeting effectiveness surveys for continuous improvement
3. Establish minimum meeting frequency guidelines per program

### Long-term Strategy
1. Develop meeting analytics dashboard for real-time monitoring
2. Integrate meeting outcomes with progress tracking systems
3. Provide supervisor training on effective meeting facilitation

## Conclusion

The meeting data reveals ${Number.parseFloat(completionRate) >= 80 ? "strong" : "moderate"} engagement levels across the program. ${
    Number.parseFloat(completionRate) >= 80
      ? "Maintaining this momentum while addressing the small number of cancellations will ensure continued success."
      : "Focused efforts on improving completion rates and reducing cancellations will significantly enhance program outcomes."
  }

---
*This report was generated by the UTM Gradient Analytics System*
`
}

function generateDocumentsReport(data: ReportData, date: string): string {
  const docs = data.documents || { submitted: 0, pending: 0, reviewed: 0, avgReviewTime: "N/A" }
  const totalDocs = docs.submitted + docs.pending
  const reviewRate = totalDocs > 0 ? ((docs.reviewed / totalDocs) * 100).toFixed(1) : "0"

  return `# Document Statistics Report
**Generated on:** ${date}

## Executive Summary

This analysis examines document submission patterns, review efficiency, and feedback turnaround times. Effective document management is essential for maintaining research momentum and ensuring timely degree completion.

### Key Metrics

- **Total Documents:** ${totalDocs}
- **Submitted & Reviewed:** ${docs.reviewed} (${reviewRate}%)
- **Pending Review:** ${docs.pending}
- **Average Review Time:** ${docs.avgReviewTime}

## Document Flow Analysis

### Submission Patterns

**Total Submissions:** ${docs.submitted}  
${
  docs.submitted >= 50
    ? "High submission volume indicates active research progress across the program."
    : docs.submitted >= 20
      ? "Moderate submission activity suggests steady but not exceptional research output."
      : "Low submission numbers may indicate bottlenecks in research progress or submission processes."
}

### Review Efficiency

**Review Completion Rate:** ${reviewRate}%  
**Pending Documents:** ${docs.pending}

${
  Number.parseFloat(reviewRate) >= 80
    ? `Excellent review efficiency with ${reviewRate}% of documents processed. The ${docs.pending} pending documents are within acceptable limits.`
    : Number.parseFloat(reviewRate) >= 60
      ? `Moderate review efficiency at ${reviewRate}%. The ${docs.pending} pending documents suggest some backlog that should be addressed.`
      : `Review efficiency needs improvement. With ${docs.pending} documents pending and only ${reviewRate}% reviewed, there is a significant backlog requiring immediate attention.`
}

### Turnaround Time Analysis

**Average Review Time:** ${docs.avgReviewTime}

${
  docs.avgReviewTime.includes("day") && Number.parseInt(docs.avgReviewTime) <= 7
    ? "Excellent turnaround time supporting rapid iteration and research progress."
    : docs.avgReviewTime.includes("day") && Number.parseInt(docs.avgReviewTime) <= 14
      ? "Acceptable turnaround time, though faster reviews would benefit student momentum."
      : "Review times are longer than optimal, potentially impacting student progress and motivation."
}

## Impact on Student Progress

### Positive Indicators
- ${docs.reviewed} documents successfully reviewed and returned with feedback
- Active submission culture indicating engaged research activity
- ${Number.parseFloat(reviewRate) >= 70 ? "Efficient review process supporting student momentum" : "Opportunity to improve review efficiency"}

### Areas for Improvement
${docs.pending > 10 ? `- ${docs.pending} pending documents creating potential bottleneck` : ""}
${Number.parseFloat(reviewRate) < 70 ? "- Review completion rate below optimal threshold" : ""}
- Standardize review timelines across all supervisors

## Recommendations

### For Supervisors
1. Prioritize document reviews to maintain ${docs.pending > 5 ? "reduced" : "current"} pending queue
2. Provide detailed, actionable feedback to minimize revision cycles
3. Set clear expectations for review turnaround times

### For Administration
1. Monitor review times and flag delays exceeding 14 days
2. Implement automated reminders for pending reviews
3. Provide supervisor training on efficient feedback methods

### For Students
1. Submit documents with clear objectives and questions
2. Allow adequate time for supervisor review in project planning
3. Follow up on pending reviews after reasonable waiting period

## Conclusion

The document management system is ${Number.parseFloat(reviewRate) >= 70 ? "functioning effectively" : "experiencing challenges"} with ${docs.reviewed} documents reviewed and ${docs.pending} pending. ${
    Number.parseFloat(reviewRate) >= 70
      ? "Maintaining current review efficiency while handling the pending queue will ensure continued research momentum."
      : "Focused efforts on reducing the pending queue and improving review times will significantly enhance student progress and satisfaction."
  }

---
*This report was generated by the UTM Gradient Analytics System*
`
}

function generatePerformanceReport(data: ReportData, date: string): string {
  const perf = data.performance || { avgProgress: 0, topPerformers: 0, needsAttention: 0 }
  const total = perf.topPerformers + perf.needsAttention

  return `# Performance Overview Report
**Generated on:** ${date}

## Executive Summary

This comprehensive performance analysis evaluates student achievement, identifies excellence, and highlights areas requiring intervention across the graduate research program.

### Performance Distribution

- **Average Progress:** ${perf.avgProgress}%
- **Top Performers:** ${perf.topPerformers} students
- **Needs Attention:** ${perf.needsAttention} students
- **Total Analyzed:** ${total} students

## Performance Analysis

### Overall Assessment

${
  perf.avgProgress >= 75
    ? `The ${perf.avgProgress}% average progress indicates strong overall program performance. This reflects effective supervision, adequate resources, and engaged students.`
    : perf.avgProgress >= 60
      ? `The ${perf.avgProgress}% average progress is satisfactory but indicates room for improvement. Strategic interventions could elevate overall performance.`
      : `The ${perf.avgProgress}% average progress requires immediate attention. Comprehensive program review and intervention strategies are necessary.`
}

### Top Performers (${perf.topPerformers} students)

These students demonstrate exceptional progress and should be:
- Recognized for their achievements
- Considered for teaching or mentoring roles
- Showcased as program success stories
- Supported in pursuing competitive opportunities

### Students Needing Attention (${perf.needsAttention} students)

${
  perf.needsAttention > 0
    ? `These ${perf.needsAttention} students require targeted support through:
- Individual progress meetings with supervisors
- Academic skills workshops or resources
- Potential adjustment of research scope or timeline
- Connection with peer support networks`
    : "No students currently flagged for immediate intervention, indicating strong overall program health."
}

## Comparative Analysis

**Success Rate:** ${total > 0 ? ((perf.topPerformers / total) * 100).toFixed(1) : "0"}%  
**Intervention Rate:** ${total > 0 ? ((perf.needsAttention / total) * 100).toFixed(1) : "0"}%

## Strategic Recommendations

### Excellence Cultivation
1. Establish recognition program for top performers
2. Create opportunities for high achievers to contribute to program development
3. Document and share success strategies from top performers

### Support Enhancement
1. Implement early warning system for declining performance
2. Provide targeted resources for struggling students
3. Facilitate peer mentoring between top and struggling students

### Program Development
1. Analyze factors contributing to top performance
2. Identify and address systemic barriers to success
3. Continuously refine support structures based on performance data

## Conclusion

The performance data reveals ${perf.avgProgress >= 70 ? "a healthy program" : "opportunities for improvement"} with ${perf.topPerformers} students excelling and ${perf.needsAttention} requiring support. ${
    perf.avgProgress >= 70
      ? "Maintaining support for all students while celebrating excellence will ensure continued success."
      : "Focused intervention for struggling students combined with recognition of top performers will improve overall outcomes."
  }

---
*This report was generated by the UTM Gradient Analytics System*
`
}

function generateCompleteReport(data: ReportData, date: string): string {
  return `# Complete System Report
**Generated on:** ${date}

## Executive Summary

This comprehensive report integrates data across all system modules to provide a holistic view of the graduate research program's health, performance, and areas for strategic development.

${generateProgressReport(data, date).split("## Executive Summary")[1].split("## Detailed Program Analysis")[0]}

${generateMeetingsReport(data, date).split("## Executive Summary")[1].split("## Meeting Completion Analysis")[0]}

${generateDocumentsReport(data, date).split("## Executive Summary")[1].split("## Document Flow Analysis")[0]}

${generatePerformanceReport(data, date).split("## Executive Summary")[1].split("## Performance Analysis")[0]}

## Integrated Analysis

### System Health Score

Based on comprehensive metrics across all modules, the program demonstrates:
- **Progress Management:** ${data.programs ? "Active tracking across multiple programs" : "Standard monitoring"}
- **Engagement Levels:** ${data.meetings ? "Regular supervisor-student interactions" : "Baseline engagement"}
- **Documentation Flow:** ${data.documents ? "Active submission and review processes" : "Standard documentation"}
- **Performance Tracking:** ${data.performance ? "Comprehensive performance monitoring" : "Basic tracking"}

### Cross-Module Insights

The integration of progress, meeting, document, and performance data reveals important correlations:

1. **Progress-Meeting Correlation:** Regular meetings strongly correlate with better progress outcomes
2. **Document-Performance Link:** Active document submission indicates engaged, progressing students
3. **Holistic Student Health:** Students excelling in one area typically perform well across all metrics

## Strategic Priorities

### Immediate (0-3 months)
1. Address any critical performance issues identified across modules
2. Ensure all pending reviews and meetings are completed
3. Implement quick-win improvements to boost engagement

### Short-term (3-6 months)
1. Develop integrated dashboard for real-time monitoring
2. Establish cross-functional support teams for at-risk students
3. Launch recognition program for high performers

### Long-term (6-12 months)
1. Build predictive analytics for early intervention
2. Create comprehensive best practices guide from top performers
3. Implement continuous improvement cycle based on integrated data

## Conclusion

This complete system analysis provides a comprehensive view of program health and performance. The integrated approach reveals both strengths to celebrate and opportunities for enhancement. By addressing identified priorities and maintaining focus on student success, the program can achieve excellence across all dimensions.

---
*This report was generated by the UTM Gradient Analytics System*
`
}
