import type React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function SupervisorDashboard() {
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
              <Link href="/supervisor/dashboard" className="text-sm font-medium text-foreground">
                Dashboard
              </Link>
              <Link
                href="/supervisor/students"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Students
              </Link>
              <Link
                href="/supervisor/meetings"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Meetings
              </Link>
              <Link
                href="/supervisor/documents"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Documents
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <BellIcon />
            </Button>
            <Link href="/supervisor/profile">
              <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src="/placeholder.svg?key=sup01" alt="Supervisor" />
                <AvatarFallback>DS</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, Dr. Sarah</h2>
          <p className="text-muted-foreground">Monitor your students' progress and upcoming activities</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Students</p>
              <UsersIcon className="text-accent" />
            </div>
            <p className="text-3xl font-bold text-foreground">8</p>
            <p className="text-sm text-muted-foreground mt-2">3 PhD, 5 Masters</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
              <FileTextIcon className="text-accent" />
            </div>
            <p className="text-3xl font-bold text-foreground">12</p>
            <p className="text-sm text-muted-foreground mt-2">5 urgent</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Meetings This Week</p>
              <CalendarIcon className="text-accent" />
            </div>
            <p className="text-3xl font-bold text-foreground">6</p>
            <p className="text-sm text-muted-foreground mt-2">Next: Today, 3:00 PM</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Avg. Progress</p>
              <TrendingUpIcon className="text-accent" />
            </div>
            <p className="text-3xl font-bold text-foreground">72%</p>
            <p className="text-sm text-muted-foreground mt-2">+5% from last month</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Students Overview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Students Overview</h3>
                <div className="flex items-center gap-2">
                  <Input placeholder="Search students..." className="w-64" />
                  <Link href="/supervisor/students">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="space-y-4">
                <StudentCard
                  name="Ahmad Ibrahim"
                  program="PhD Computer Science"
                  progress={68}
                  status="on-track"
                  lastMeeting="2 days ago"
                  nextMilestone="Data Collection"
                  avatar="/placeholder.svg?key=st01"
                />
                <StudentCard
                  name="Fatimah Hassan"
                  program="Masters Software Engineering"
                  progress={85}
                  status="on-track"
                  lastMeeting="1 week ago"
                  nextMilestone="Thesis Writing"
                  avatar="/placeholder.svg?key=st02"
                />
                <StudentCard
                  name="Muhammad Ali"
                  program="PhD Artificial Intelligence"
                  progress={45}
                  status="needs-attention"
                  lastMeeting="3 weeks ago"
                  nextMilestone="Research Proposal"
                  avatar="/placeholder.svg?key=st03"
                />
                <StudentCard
                  name="Aisha Rahman"
                  program="Masters Data Science"
                  progress={92}
                  status="on-track"
                  lastMeeting="Yesterday"
                  nextMilestone="Final Defense"
                  avatar="/placeholder.svg?key=st04"
                />
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-6">Recent Activity</h3>
              <div className="space-y-4">
                <ActivityItem
                  icon={<FileTextIcon />}
                  title="Ahmad Ibrahim submitted Chapter 3"
                  description="Awaiting your review"
                  time="2 hours ago"
                  actionRequired
                />
                <ActivityItem
                  icon={<MessageSquareIcon />}
                  title="Fatimah Hassan sent a message"
                  description="Question about methodology"
                  time="5 hours ago"
                  actionRequired
                />
                <ActivityItem
                  icon={<CalendarIcon />}
                  title="Meeting completed with Aisha Rahman"
                  description="Progress review meeting"
                  time="1 day ago"
                  actionRequired={false}
                />
                <ActivityItem
                  icon={<AlertCircleIcon />}
                  title="Muhammad Ali missed deadline"
                  description="Progress report was due yesterday"
                  time="1 day ago"
                  actionRequired
                />
                <ActivityItem
                  icon={<CheckCircleIcon />}
                  title="Approved milestone for Fatimah Hassan"
                  description="Literature Review completed"
                  time="3 days ago"
                  actionRequired={false}
                />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Reviews */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Pending Reviews</h3>
              <div className="space-y-3">
                <ReviewItem
                  student="Ahmad Ibrahim"
                  document="Chapter 3 Draft"
                  submitted="2 hours ago"
                  priority="high"
                />
                <ReviewItem
                  student="Fatimah Hassan"
                  document="Methodology Section"
                  submitted="1 day ago"
                  priority="medium"
                />
                <ReviewItem student="Aisha Rahman" document="Final Thesis" submitted="2 days ago" priority="high" />
                <ReviewItem student="Muhammad Ali" document="Literature Review" submitted="1 week ago" priority="low" />
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent" size="sm">
                View All Reviews
              </Button>
            </Card>

            {/* Upcoming Meetings */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Upcoming Meetings</h3>
              <div className="space-y-3">
                <MeetingItem student="Ahmad Ibrahim" time="Today, 3:00 PM" topic="Progress Review" duration="1 hour" />
                <MeetingItem
                  student="Fatimah Hassan"
                  time="Tomorrow, 10:00 AM"
                  topic="Methodology Discussion"
                  duration="45 min"
                />
                <MeetingItem student="Muhammad Ali" time="Oct 30, 2:00 PM" topic="Catch-up Meeting" duration="1 hour" />
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Schedule New Meeting
              </Button>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add New Student
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <FileTextIcon className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <MessageSquareIcon className="mr-2 h-4 w-4" />
                  Send Announcement
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function StudentCard({
  name,
  program,
  progress,
  status,
  lastMeeting,
  nextMilestone,
  avatar,
}: {
  name: string
  program: string
  progress: number
  status: string
  lastMeeting: string
  nextMilestone: string
  avatar: string
}) {
  const statusConfig = {
    "on-track": {
      badge: "On Track",
      color: "bg-green-500/10 text-green-700 dark:text-green-400",
    },
    "needs-attention": {
      badge: "Needs Attention",
      color: "bg-red-500/10 text-red-700 dark:text-red-400",
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig]

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
      <Avatar className="h-12 w-12">
        <AvatarImage src={avatar || "/placeholder.svg"} alt={name} />
        <AvatarFallback>
          {name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-foreground">{name}</h4>
          <Badge className={config.color} variant="secondary">
            {config.badge}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{program}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
          <span>Last meeting: {lastMeeting}</span>
          <span>•</span>
          <span>Next: {nextMilestone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-sm font-semibold text-muted-foreground">{progress}%</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm">
          View Profile
        </Button>
        <Button variant="ghost" size="sm">
          <MessageSquareIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ActivityItem({
  icon,
  title,
  description,
  time,
  actionRequired,
}: {
  icon: React.ReactNode
  title: string
  description: string
  time: string
  actionRequired: boolean
}) {
  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground text-sm">{title}</p>
          {actionRequired && (
            <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-400">
              Action Required
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{time}</p>
      </div>
    </div>
  )
}

function ReviewItem({
  student,
  document,
  submitted,
  priority,
}: {
  student: string
  document: string
  submitted: string
  priority: string
}) {
  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
      <div className={`w-2 h-2 rounded-full mt-2 ${priorityColors[priority as keyof typeof priorityColors]}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm">{student}</p>
        <p className="text-sm text-muted-foreground">{document}</p>
        <p className="text-xs text-muted-foreground mt-1">Submitted {submitted}</p>
      </div>
    </div>
  )
}

function MeetingItem({
  student,
  time,
  topic,
  duration,
}: {
  student: string
  time: string
  topic: string
  duration: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
        <CalendarIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm">{student}</p>
        <p className="text-sm text-muted-foreground">{topic}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">{time}</p>
          <span className="text-xs text-muted-foreground">•</span>
          <p className="text-xs text-muted-foreground">{duration}</p>
        </div>
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

function UsersIcon({ className }: { className?: string }) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

function AlertCircleIcon({ className }: { className?: string }) {
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
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
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
