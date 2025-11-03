"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useParams } from "next/navigation"
import { DownloadReportButton } from "@/components/download-report-button"

const studentData = {
  id: 1,
  name: "Ahmad Ibrahim",
  program: "PhD Computer Science",
  progress: 68,
  status: "on-track",
  avatar: "/placeholder.svg?key=st01",
  email: "ahmad@utm.my",
  phone: "+60 12-345 6789",
  startDate: "Jan 2024",
  expectedCompletion: "May 2024",
  supervisor: "Dr. Sarah Ahmad",
  weeklyProgress: [
    {
      week: 1,
      topic: "Project Area and Faculty Supervisor Expert Briefing",
      status: "completed",
      dueDate: "Jan 15, 2024",
      submission: "Briefing_Report.pdf",
      submittedDate: "Jan 14, 2024",
    },
    {
      week: 2,
      topic: "Project Planning and Proposal Form Preparation",
      status: "completed",
      dueDate: "Jan 22, 2024",
      submission: "Proposal_Form.pdf",
      submittedDate: "Jan 21, 2024",
    },
    {
      week: 3,
      topic: "Problem Statement and Project Objectives",
      status: "completed",
      dueDate: "Jan 29, 2024",
      submission: "Problem_Statement.pdf",
      submittedDate: "Jan 28, 2024",
    },
    {
      week: 4,
      topic: "Literature Review - Part 1",
      status: "completed",
      dueDate: "Feb 5, 2024",
      submission: "Literature_Review_1.pdf",
      submittedDate: "Feb 4, 2024",
    },
    {
      week: 5,
      topic: "Literature Review - Part 2",
      status: "completed",
      dueDate: "Feb 12, 2024",
      submission: "Literature_Review_2.pdf",
      submittedDate: "Feb 11, 2024",
    },
    {
      week: 6,
      topic: "Research Methodology Design",
      status: "completed",
      dueDate: "Feb 19, 2024",
      submission: "Methodology.pdf",
      submittedDate: "Feb 18, 2024",
    },
    {
      week: 7,
      topic: "Data Collection Planning",
      status: "completed",
      dueDate: "Feb 26, 2024",
      submission: "Data_Plan.pdf",
      submittedDate: "Feb 25, 2024",
    },
    {
      week: 8,
      topic: "Research Tools and Techniques",
      status: "completed",
      dueDate: "Mar 4, 2024",
      submission: "Tools_Report.pdf",
      submittedDate: "Mar 3, 2024",
    },
    {
      week: 9,
      topic: "Preliminary Data Analysis",
      status: "in-progress",
      dueDate: "Mar 11, 2024",
      submission: "Pending",
      submittedDate: "-",
    },
    {
      week: 10,
      topic: "System Design and Architecture",
      status: "pending",
      dueDate: "Mar 18, 2024",
      submission: "Not Started",
      submittedDate: "-",
    },
    {
      week: 11,
      topic: "Implementation Phase 1",
      status: "pending",
      dueDate: "Mar 25, 2024",
      submission: "Not Started",
      submittedDate: "-",
    },
    {
      week: 12,
      topic: "Implementation Phase 2",
      status: "pending",
      dueDate: "Apr 1, 2024",
      submission: "Not Started",
      submittedDate: "-",
    },
    {
      week: 13,
      topic: "Testing and Validation",
      status: "pending",
      dueDate: "Apr 8, 2024",
      submission: "Not Started",
      submittedDate: "-",
    },
    {
      week: 14,
      topic: "Results Analysis and Discussion",
      status: "pending",
      dueDate: "Apr 15, 2024",
      submission: "Not Started",
      submittedDate: "-",
    },
    {
      week: 15,
      topic: "Thesis Writing and Documentation",
      status: "pending",
      dueDate: "Apr 22, 2024",
      submission: "Not Started",
      submittedDate: "-",
    },
    {
      week: 16,
      topic: "Final Review and Submission Preparation",
      status: "pending",
      dueDate: "Apr 29, 2024",
      submission: "Not Started",
      submittedDate: "-",
    },
  ],
  milestones: [
    {
      week: "1-2",
      name: "Project Initiation",
      topics: ["Project briefing", "Proposal preparation"],
      progress: 100,
      status: "completed",
    },
    {
      week: "3-4",
      name: "Problem Definition",
      topics: ["Problem statement", "Objectives", "Literature review"],
      progress: 100,
      status: "completed",
    },
    {
      week: "5-6",
      name: "Research Foundation",
      topics: ["Extended literature review", "Methodology design"],
      progress: 100,
      status: "completed",
    },
    {
      week: "7-8",
      name: "Research Planning",
      topics: ["Data collection planning", "Tools selection"],
      progress: 100,
      status: "completed",
    },
    {
      week: "9-10",
      name: "Data Analysis & Design",
      topics: ["Preliminary analysis", "System architecture"],
      progress: 50,
      status: "in-progress",
    },
    {
      week: "11-12",
      name: "Implementation",
      topics: ["Phase 1 development", "Phase 2 development"],
      progress: 0,
      status: "pending",
    },
    {
      week: "13-14",
      name: "Testing & Analysis",
      topics: ["Testing and validation", "Results analysis"],
      progress: 0,
      status: "pending",
    },
    { week: "15-16", name: "Finalization", topics: ["Thesis writing", "Final review"], progress: 0, status: "pending" },
  ],
  documentsSubmitted: 8,
  pendingReviews: 2,
  meetingsThisMonth: 3,
  lastMeeting: "3 days ago",
  recentActivities: [
    { title: "Preliminary Data Analysis submitted", time: "2 days ago" },
    { title: "Week 8 completed", time: "5 days ago" },
    { title: "Meeting with supervisor", time: "1 week ago" },
  ],
}

export default function StudentProgressPage() {
  const params = useParams()
  const studentId = params.id

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-foreground">
              <span className="text-accent">UTM</span>Gradient
            </h1>
            <nav className="hidden md:flex gap-6">
              <Link
                href="/supervisor/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link href="/supervisor/students" className="text-sm font-medium text-foreground">
                Students
              </Link>
              <Link
                href="/supervisor/meetings"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Meetings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <BellIcon />
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder.svg?key=sup01" alt="Supervisor" />
              <AvatarFallback>DS</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <Link href="/supervisor/students">
          <Button variant="ghost" className="mb-6">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </Link>

        {/* Student Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={studentData.avatar || "/placeholder.svg"} alt={studentData.name} />
              <AvatarFallback>
                {studentData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-foreground">{studentData.name}</h2>
                <Badge
                  className={
                    studentData.status === "on-track"
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-red-500/10 text-red-700 dark:text-red-400"
                  }
                  variant="secondary"
                >
                  {studentData.status === "on-track" ? "On Track" : "Needs Attention"}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-3">{studentData.program}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{studentData.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{studentData.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium text-foreground">{studentData.startDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expected Completion</p>
                  <p className="font-medium text-foreground">{studentData.expectedCompletion}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button>
                <MessageSquareIcon className="mr-2 h-4 w-4" />
                Send Message
              </Button>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
              <DownloadReportButton studentData={studentData} variant="outline" />
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Overall Progress</span>
              <span className="text-lg font-bold text-foreground">{studentData.progress}%</span>
            </div>
            <Progress value={studentData.progress} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">Week 9 of 16 • 7 weeks remaining</p>
          </div>
        </Card>

        {/* Tabs for Milestones and Weekly Progress */}
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="weekly">Weekly Progress (Week 1-16)</TabsTrigger>
            <TabsTrigger value="milestones">Milestones Overview</TabsTrigger>
          </TabsList>

          {/* Weekly Progress Tab */}
          <TabsContent value="weekly" className="space-y-4">
            <div className="grid gap-4">
              {studentData.weeklyProgress.map((week) => (
                <Card key={week.week} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent font-bold">
                          {week.week}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-lg">{week.topic}</h3>
                          <p className="text-sm text-muted-foreground">Due: {week.dueDate}</p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            week.status === "completed"
                              ? "bg-green-500/10 text-green-700 dark:text-green-400"
                              : week.status === "in-progress"
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                : "bg-gray-500/10 text-gray-700 dark:text-gray-400"
                          }
                        >
                          {week.status === "completed"
                            ? "Completed"
                            : week.status === "in-progress"
                              ? "In Progress"
                              : "Pending"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Submission Status</p>
                          <div className="flex items-center gap-2">
                            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{week.submission}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Submitted Date</p>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{week.submittedDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {week.status === "completed" && (
                        <>
                          <Button size="sm">View Submission</Button>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </>
                      )}
                      {week.status === "in-progress" && (
                        <Button variant="outline" size="sm">
                          Send Reminder
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-4">
            <div className="grid gap-4">
              {studentData.milestones.map((milestone, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-foreground">{milestone.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          Week {milestone.week}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={
                            milestone.status === "completed"
                              ? "bg-green-500/10 text-green-700 dark:text-green-400"
                              : milestone.status === "in-progress"
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                : "bg-gray-500/10 text-gray-700 dark:text-gray-400"
                          }
                        >
                          {milestone.status === "completed"
                            ? "Completed"
                            : milestone.status === "in-progress"
                              ? "In Progress"
                              : "Pending"}
                        </Badge>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-2">Topics Covered:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {milestone.topics.map((topic, idx) => (
                            <li key={idx} className="text-sm text-foreground">
                              {topic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-foreground">{milestone.progress}%</span>
                    </div>
                  </div>
                  <Progress value={milestone.progress} className="h-3" />
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  )
}
