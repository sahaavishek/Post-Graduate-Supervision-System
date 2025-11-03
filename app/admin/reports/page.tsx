"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  TrendingUp,
  GraduationCap,
  Calendar,
  FileText,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function AdminReportsPage() {
  const [timeRange, setTimeRange] = useState("month")
  const { toast } = useToast()

  // Mock analytics data
  const progressAnalytics = [
    { program: "PhD Computer Science", students: 45, avgProgress: 68, onTrack: 38, delayed: 7 },
    { program: "PhD Engineering", students: 38, avgProgress: 72, onTrack: 32, delayed: 6 },
    { program: "PhD Data Science", students: 32, avgProgress: 65, onTrack: 26, delayed: 6 },
    { program: "PhD AI & ML", students: 28, avgProgress: 75, onTrack: 24, delayed: 4 },
    { program: "Masters CS", students: 13, avgProgress: 80, onTrack: 11, delayed: 2 },
  ]

  const meetingStats = [
    { month: "Jan", scheduled: 145, completed: 138, cancelled: 7 },
    { month: "Feb", scheduled: 152, completed: 145, cancelled: 7 },
    { month: "Mar", scheduled: 168, completed: 160, cancelled: 8 },
    { month: "Apr", scheduled: 175, completed: 168, cancelled: 7 },
  ]

  const documentStats = [
    { type: "Research Proposals", submitted: 45, pending: 8, approved: 37 },
    { type: "Progress Reports", submitted: 156, pending: 23, approved: 133 },
    { type: "Literature Reviews", submitted: 89, pending: 12, approved: 77 },
    { type: "Thesis Chapters", submitted: 34, pending: 6, approved: 28 },
  ]

  const topPerformers = [
    { name: "David Lee", program: "PhD AI & ML", progress: 90, supervisor: "Dr. Siti Aminah" },
    { name: "Sarah Chen", program: "PhD CS", progress: 85, supervisor: "Dr. Ahmad Rahman" },
    { name: "Emily Zhang", program: "Masters CS", progress: 82, supervisor: "Prof. Lisa Wong" },
  ]

  const atRiskStudents = [
    { name: "Aisha Ibrahim", program: "PhD Data Science", progress: 30, issue: "Low progress rate" },
    { name: "John Doe", program: "PhD Engineering", progress: 25, issue: "Missed meetings" },
    { name: "Jane Smith", program: "PhD CS", progress: 35, issue: "Delayed milestones" },
  ]

  const handleExportReport = (reportType: string) => {
    toast({
      title: "Export Started",
      description: `${reportType} report is being generated. Download will start shortly.`,
    })
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
              <Link href="/admin/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/admin/users" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Users
              </Link>
              <Link href="/admin/reports" className="text-sm font-medium text-foreground">
                Reports
              </Link>
              <Link href="/admin/settings" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <BellIcon />
            </Button>
            <Link href="/admin/profile">
              <Avatar>
                <AvatarImage src="/placeholder.svg?key=admin01" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">System Reports & Analytics</h2>
            <p className="text-muted-foreground">Comprehensive insights into system performance and user activity</p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => handleExportReport("Complete System")}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  12%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">156</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  5%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">72%</p>
              <p className="text-sm text-muted-foreground">Avg Progress Rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  8%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">640</p>
              <p className="text-sm text-muted-foreground">Meetings This Month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <FileText className="h-5 w-5" />
                </div>
                <Badge variant="default" className="bg-red-100 text-red-700">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  3%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">49</p>
              <p className="text-sm text-muted-foreground">Pending Reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Reports */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList>
            <TabsTrigger value="progress">
              <BarChart3 className="h-4 w-4 mr-2" />
              Progress Analytics
            </TabsTrigger>
            <TabsTrigger value="meetings">
              <Calendar className="h-4 w-4 mr-2" />
              Meeting Reports
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Document Statistics
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Progress by Program</CardTitle>
                    <CardDescription>Student progress breakdown across different programs</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleExportReport("Progress Analytics")}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {progressAnalytics.map((program, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{program.program}</p>
                          <p className="text-sm text-muted-foreground">{program.students} students enrolled</p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-muted-foreground">{program.onTrack} on track</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <span className="text-muted-foreground">{program.delayed} delayed</span>
                          </div>
                          <span className="font-semibold text-foreground">{program.avgProgress}%</span>
                        </div>
                      </div>
                      <Progress value={program.avgProgress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meetings" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Meeting Statistics</CardTitle>
                    <CardDescription>Supervision meeting trends and completion rates</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleExportReport("Meeting Reports")}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {meetingStats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{stat.month} 2024</p>
                          <p className="text-sm text-muted-foreground">{stat.scheduled} meetings scheduled</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{stat.completed}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">{stat.cancelled}</p>
                          <p className="text-xs text-muted-foreground">Cancelled</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">
                            {Math.round((stat.completed / stat.scheduled) * 100)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Success Rate</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Document Submission & Review</CardTitle>
                    <CardDescription>Track document submissions and approval status</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleExportReport("Document Statistics")}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentStats.map((doc, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <p className="font-semibold text-foreground">{doc.type}</p>
                        </div>
                        <Badge variant="secondary">{doc.submitted} total</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-foreground">{doc.submitted}</p>
                          <p className="text-xs text-muted-foreground">Submitted</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">{doc.pending}</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{doc.approved}</p>
                          <p className="text-xs text-muted-foreground">Approved</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Students with highest progress rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformers.map((student, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.program}</p>
                          <p className="text-xs text-muted-foreground">Supervisor: {student.supervisor}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{student.progress}%</p>
                          <p className="text-xs text-muted-foreground">Progress</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>At-Risk Students</CardTitle>
                  <CardDescription>Students requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {atRiskStudents.map((student, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 border border-destructive/20 rounded-lg bg-destructive/5"
                      >
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.program}</p>
                          <p className="text-xs text-red-600">{student.issue}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">{student.progress}%</p>
                          <p className="text-xs text-muted-foreground">Progress</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
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
