"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  GraduationCap,
  UserCheck,
  TrendingUp,
  Search,
  MoreVertical,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  Settings,
  BarChart3,
  AlertCircle,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { DownloadReportButton } from "@/components/download-report-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for students
  const students = [
    {
      id: 1,
      name: "Sarah Chen",
      email: "sarah.chen@utm.my",
      supervisor: "Dr. Ahmad Rahman",
      program: "PhD Computer Science",
      progress: 75,
      status: "active",
      enrollmentDate: "Jan 2023",
      startDate: "Jan 2023",
      expectedCompletion: "Jan 2027",
      milestones: [
        { name: "Research Proposal", progress: 100, status: "completed" },
        { name: "Literature Review", progress: 100, status: "completed" },
        { name: "Data Collection", progress: 75, status: "in-progress" },
        { name: "Analysis", progress: 0, status: "pending" },
      ],
      documentsSubmitted: 15,
      pendingReviews: 2,
      meetingsThisMonth: 3,
      lastMeeting: "3 days ago",
    },
    {
      id: 2,
      name: "Michael Tan",
      email: "michael.tan@utm.my",
      supervisor: "Prof. Lisa Wong",
      program: "PhD Engineering",
      progress: 45,
      status: "active",
      enrollmentDate: "Sep 2023",
      startDate: "Sep 2023",
      expectedCompletion: "Sep 2027",
      milestones: [
        { name: "Research Proposal", progress: 100, status: "completed" },
        { name: "Literature Review", progress: 60, status: "in-progress" },
        { name: "Methodology", progress: 20, status: "in-progress" },
      ],
      documentsSubmitted: 8,
      pendingReviews: 1,
      meetingsThisMonth: 2,
      lastMeeting: "1 week ago",
    },
    {
      id: 3,
      name: "Aisha Ibrahim",
      email: "aisha.ibrahim@utm.my",
      supervisor: "Dr. Ahmad Rahman",
      program: "PhD Data Science",
      progress: 30,
      status: "warning",
      enrollmentDate: "Jan 2024",
      startDate: "Jan 2024",
      expectedCompletion: "Jan 2028",
      milestones: [
        { name: "Topic Selection", progress: 100, status: "completed" },
        { name: "Literature Review", progress: 40, status: "in-progress" },
        { name: "Research Proposal", progress: 10, status: "in-progress" },
      ],
      documentsSubmitted: 5,
      pendingReviews: 3,
      meetingsThisMonth: 1,
      lastMeeting: "2 weeks ago",
    },
    {
      id: 4,
      name: "David Lee",
      email: "david.lee@utm.my",
      supervisor: "Dr. Siti Aminah",
      program: "PhD AI & ML",
      progress: 90,
      status: "active",
      enrollmentDate: "Sep 2022",
      startDate: "Sep 2022",
      expectedCompletion: "Sep 2026",
      milestones: [
        { name: "Research Proposal", progress: 100, status: "completed" },
        { name: "Literature Review", progress: 100, status: "completed" },
        { name: "Implementation", progress: 100, status: "completed" },
        { name: "Thesis Writing", progress: 90, status: "in-progress" },
      ],
      documentsSubmitted: 25,
      pendingReviews: 1,
      meetingsThisMonth: 4,
      lastMeeting: "Yesterday",
    },
  ]

  // Mock data for supervisors
  const supervisors = [
    {
      id: 1,
      name: "Dr. Ahmad Rahman",
      email: "ahmad.rahman@utm.my",
      department: "Computer Science",
      students: 8,
      capacity: 10,
      status: "active",
    },
    {
      id: 2,
      name: "Prof. Lisa Wong",
      email: "lisa.wong@utm.my",
      department: "Engineering",
      students: 10,
      capacity: 10,
      status: "full",
    },
    {
      id: 3,
      name: "Dr. Siti Aminah",
      email: "siti.aminah@utm.my",
      department: "Data Science",
      students: 5,
      capacity: 8,
      status: "active",
    },
  ]

  // Mock data for system statistics
  const stats = [
    { label: "Total Students", value: "156", change: "+12", icon: GraduationCap, color: "text-blue-600" },
    { label: "Active Supervisors", value: "24", change: "+2", icon: UserCheck, color: "text-green-600" },
    { label: "Pending Reviews", value: "38", change: "-5", icon: FileText, color: "text-orange-600" },
    { label: "Completion Rate", value: "87%", change: "+3%", icon: TrendingUp, color: "text-purple-600" },
  ]

  // Mock data for recent activities
  const recentActivities = [
    {
      id: 1,
      type: "registration",
      message: "New student registration: Emily Zhang",
      time: "2 hours ago",
      icon: Users,
    },
    {
      id: 2,
      type: "milestone",
      message: "David Lee completed thesis defense milestone",
      time: "5 hours ago",
      icon: CheckCircle2,
    },
    {
      id: 3,
      type: "alert",
      message: "3 students behind schedule - requires attention",
      time: "1 day ago",
      icon: AlertCircle,
    },
    {
      id: 4,
      type: "meeting",
      message: "15 supervision meetings scheduled this week",
      time: "1 day ago",
      icon: Calendar,
    },
  ]

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
              <Link href="/admin/dashboard" className="text-sm font-medium text-foreground">
                Dashboard
              </Link>
              <Link href="/admin/users" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Users
              </Link>
              <Link href="/admin/reports" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Reports
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <BellIcon />
            </Button>
            <Link href="/admin/profile">
              <Avatar className="cursor-pointer">
                <AvatarImage src="/placeholder.svg?key=admin01" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, Admin</h2>
          <p className="text-muted-foreground">Monitor system performance and manage users</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-green-600 mt-1">{stat.change} this month</p>
                  </div>
                  <div className={`h-12 w-12 rounded-full bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Management Tabs */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage students and supervisors in the system</CardDescription>
                  </div>
                  <Button size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or program..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Tabs defaultValue="students" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
                    <TabsTrigger value="supervisors">Supervisors ({supervisors.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="students" className="space-y-4">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-foreground">{student.name}</p>
                              <Badge
                                variant={student.status === "active" ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {student.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <p className="text-xs text-muted-foreground">{student.program}</p>
                              <p className="text-xs text-muted-foreground">Supervisor: {student.supervisor}</p>
                              <p className="text-xs text-muted-foreground">Enrolled: {student.enrollmentDate}</p>
                            </div>
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <Progress value={student.progress} className="h-2 flex-1" />
                                <span className="text-xs text-muted-foreground">{student.progress}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DownloadReportButton studentData={student} variant="outline" size="sm" />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Edit Profile</DropdownMenuItem>
                              <DropdownMenuItem>View Progress</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="supervisors" className="space-y-4">
                    {supervisors.map((supervisor) => (
                      <div
                        key={supervisor.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
                            {supervisor.name.split(" ")[1].charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-foreground">{supervisor.name}</p>
                              <Badge
                                variant={supervisor.status === "active" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {supervisor.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{supervisor.email}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <p className="text-xs text-muted-foreground">{supervisor.department}</p>
                              <p className="text-xs text-muted-foreground">
                                Students: {supervisor.students}/{supervisor.capacity}
                              </p>
                            </div>
                            <div className="mt-2">
                              <Progress value={(supervisor.students / supervisor.capacity) * 100} className="h-2" />
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Profile</DropdownMenuItem>
                            <DropdownMenuItem>View Students</DropdownMenuItem>
                            <DropdownMenuItem>Adjust Capacity</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* System Reports */}
            <Card>
              <CardHeader>
                <CardTitle>System Reports</CardTitle>
                <CardDescription>Generate and view system-wide reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto py-4 flex-col items-start bg-transparent">
                    <BarChart3 className="h-5 w-5 mb-2 text-primary" />
                    <p className="font-semibold text-foreground">Progress Analytics</p>
                    <p className="text-xs text-muted-foreground">View completion rates and trends</p>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col items-start bg-transparent">
                    <Users className="h-5 w-5 mb-2 text-primary" />
                    <p className="font-semibold text-foreground">User Statistics</p>
                    <p className="text-xs text-muted-foreground">Enrollment and activity data</p>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col items-start bg-transparent">
                    <Calendar className="h-5 w-5 mb-2 text-primary" />
                    <p className="font-semibold text-foreground">Meeting Reports</p>
                    <p className="text-xs text-muted-foreground">Supervision meeting analytics</p>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col items-start bg-transparent">
                    <FileText className="h-5 w-5 mb-2 text-primary" />
                    <p className="font-semibold text-foreground">Document Reviews</p>
                    <p className="text-xs text-muted-foreground">Submission and review metrics</p>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <activity.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground leading-relaxed">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Users className="h-4 w-4 mr-2" />
                  Add New User
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Link href="/admin/profile" className="w-full">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Settings className="h-4 w-4 mr-2" />
                    Profile & Settings
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  View Alerts
                </Button>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Database</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-foreground">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Services</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-foreground">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Storage</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-foreground">78% Used</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// BellIcon component
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
