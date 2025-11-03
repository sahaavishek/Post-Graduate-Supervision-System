import type React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { DownloadReportButton } from "@/components/download-report-button"

export default function StudentDashboard() {
  const studentData = {
    name: "Ahmad",
    program: "PhD Computer Science",
    progress: 68,
    startDate: "Jan 2023",
    expectedCompletion: "Dec 2026",
    milestones: [
      { name: "Literature Review", progress: 100, status: "completed" },
      { name: "Research Proposal", progress: 100, status: "completed" },
      { name: "Data Collection", progress: 75, status: "in-progress" },
      { name: "Data Analysis", progress: 0, status: "pending" },
      { name: "Thesis Writing", progress: 0, status: "pending" },
    ],
    recentActivities: [
      { title: "Chapter 3 Draft submitted", time: "2 hours ago" },
      { title: "New feedback received", time: "1 day ago" },
      { title: "Meeting scheduled", time: "2 days ago" },
      { title: "Milestone completed", time: "1 week ago" },
    ],
    meetingsThisMonth: 4,
    documentsSubmitted: 12,
    pendingReviews: 3,
    lastMeeting: "2 days ago",
  }

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
              <Link href="/student/dashboard" className="text-sm font-medium text-foreground">
                Dashboard
              </Link>
              <Link
                href="/student/meetings"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Meetings
              </Link>
              <Link
                href="/student/documents"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Documents
              </Link>
              <Link
                href="/student/progress"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Progress
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <BellIcon />
            </Button>
            <Link href="/student/profile">
              <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src="/diverse-students-studying.png" alt="Student" />
                <AvatarFallback>ST</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, Ahmad</h2>
          <p className="text-muted-foreground">Here's your research progress overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
              <TrendingUpIcon className="text-accent" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-2">68%</p>
            <Progress value={68} className="h-2" />
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Meetings This Month</p>
              <CalendarIcon className="text-accent" />
            </div>
            <p className="text-3xl font-bold text-foreground">4</p>
            <p className="text-sm text-muted-foreground mt-2">Next: Tomorrow, 2:00 PM</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Documents Submitted</p>
              <FileTextIcon className="text-accent" />
            </div>
            <p className="text-3xl font-bold text-foreground">12</p>
            <p className="text-sm text-muted-foreground mt-2">3 pending review</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Time to Completion</p>
              <ClockIcon className="text-accent" />
            </div>
            <p className="text-3xl font-bold text-foreground">18</p>
            <p className="text-sm text-muted-foreground mt-2">months remaining</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Research Milestones */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Research Milestones</h3>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                <MilestoneItem title="Literature Review" status="completed" date="Completed: Jan 2025" progress={100} />
                <MilestoneItem title="Research Proposal" status="completed" date="Completed: Mar 2025" progress={100} />
                <MilestoneItem title="Data Collection" status="in-progress" date="Due: Dec 2025" progress={75} />
                <MilestoneItem title="Data Analysis" status="pending" date="Due: Mar 2026" progress={0} />
                <MilestoneItem title="Thesis Writing" status="pending" date="Due: Aug 2026" progress={0} />
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-6">Recent Activity</h3>
              <div className="space-y-4">
                <ActivityItem
                  icon={<FileTextIcon />}
                  title="Chapter 3 Draft submitted"
                  description="Your supervisor has been notified"
                  time="2 hours ago"
                />
                <ActivityItem
                  icon={<MessageSquareIcon />}
                  title="New feedback received"
                  description="Dr. Sarah commented on your methodology"
                  time="1 day ago"
                />
                <ActivityItem
                  icon={<CalendarIcon />}
                  title="Meeting scheduled"
                  description="Progress review meeting on Oct 29"
                  time="2 days ago"
                />
                <ActivityItem
                  icon={<CheckCircleIcon />}
                  title="Milestone completed"
                  description="Research Proposal approved"
                  time="1 week ago"
                />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Supervisor Info */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Your Supervisor</h3>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/diverse-professor-lecturing.png" alt="Supervisor" />
                  <AvatarFallback>DS</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">Dr. Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">Computer Science</p>
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full bg-transparent" size="sm">
                  <MessageSquareIcon className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
                <Button variant="outline" className="w-full bg-transparent" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
              </div>
            </Card>

            {/* Upcoming Deadlines */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Upcoming Deadlines</h3>
              <div className="space-y-3">
                <DeadlineItem title="Progress Report" date="Nov 5, 2025" priority="high" />
                <DeadlineItem title="Ethics Approval" date="Nov 15, 2025" priority="medium" />
                <DeadlineItem title="Conference Paper" date="Dec 1, 2025" priority="low" />
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Log Progress
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <BookOpenIcon className="mr-2 h-4 w-4" />
                  View Resources
                </Button>
                <DownloadReportButton
                  studentData={studentData}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start bg-transparent"
                />
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function MilestoneItem({
  title,
  status,
  date,
  progress,
}: { title: string; status: string; date: string; progress: number }) {
  const statusColors = {
    completed: "bg-green-500/10 text-green-700 dark:text-green-400",
    "in-progress": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    pending: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-semibold text-foreground">{title}</h4>
          <Badge className={statusColors[status as keyof typeof statusColors]} variant="secondary">
            {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{date}</p>
        <Progress value={progress} className="h-2" />
      </div>
      <div className="text-sm font-semibold text-muted-foreground">{progress}%</div>
    </div>
  )
}

function ActivityItem({
  icon,
  title,
  description,
  time,
}: { icon: React.ReactNode; title: string; description: string; time: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  )
}

function DeadlineItem({ title, date, priority }: { title: string; date: string; priority: string }) {
  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
      <div className={`w-2 h-2 rounded-full ${priorityColors[priority as keyof typeof priorityColors]}`} />
      <div className="flex-1">
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
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

function TrendingUpIcon({ className }: { className?: string }) {
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
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
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

function ClockIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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

function CheckCircleIcon({ className }: { className?: string }) {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}
