"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { DownloadReportButton } from "@/components/download-report-button"
import { useToast } from "@/components/ui/use-toast"
import { useNotifications } from "@/lib/notifications-context"
import { meetingsAPI, progressAPI, documentsAPI } from "@/lib/api"

export default function StudentDashboard() {
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [showSupervisorModal, setShowSupervisorModal] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showLogProgressDialog, setShowLogProgressDialog] = useState(false)
  const [showResourcesDialog, setShowResourcesDialog] = useState(false)
  const [showChatbot, setShowChatbot] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [messages, setMessages] = useState<Array<{ type: string; text: string; time: string }>>([])
  const [scheduleMeetingSubmitted, setScheduleMeetingSubmitted] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [logProgressSuccess, setLogProgressSuccess] = useState(false)
  const [meetingHistorySearch, setMeetingHistorySearch] = useState("")

  const [weeklySubmissions, setWeeklySubmissions] = useState([
    { week: 1, status: "submitted", file: "Week1_Briefing.pdf" },
    { week: 2, status: "submitted", file: "Proposal_draft.pdf" },
  ])

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

  const supervisorResources = [
    { id: 1, title: "Thesis Information", type: "PDF", uploadedDate: "2025-01-15", url: "#" },
    { id: 2, title: "Research Guidelines", type: "PDF", uploadedDate: "2025-01-10", url: "#" },
    { id: 3, title: "Citation Standards", type: "DOCX", uploadedDate: "2025-01-08", url: "#" },
    { id: 4, title: "Methodology Template", type: "DOCX", uploadedDate: "2025-01-05", url: "#" },
  ]

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage = {
        type: "sent",
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages([...messages, newMessage])
      setMessageText("")

      // Show success toast
      toast({
        title: "Message Sent",
        description: "Your message has been sent to Dr. Sarah Johnson.",
      })

      // Simulate supervisor response
      setTimeout(() => {
        const response = {
          type: "received",
          text: "Thank you for your message. I'll review and get back to you soon.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
        setMessages((prev) => [...prev, response])
      }, 1000)
    } else {
      toast({
        title: "Cannot Send Empty Message",
        description: "Please type a message before sending.",
        variant: "destructive",
      })
    }
  }

  const handleScheduleMeetingSubmit = async (formData: {
    title: string
    date: string
    time: string
    duration: string
    type: string
    agenda: string
  }) => {
    try {
      await meetingsAPI.create({
        title: formData.title,
        date: formData.date,
        time: formData.time,
        duration: parseInt(formData.duration),
        type: formData.type,
        agenda: formData.agenda,
      })
      
      toast({
        title: "Meeting Request Sent",
        description: "Your meeting request has been sent to your supervisor.",
      })
      
      setScheduleMeetingSubmitted(true)
      setShowScheduleDialog(false)
      setTimeout(() => setScheduleMeetingSubmitted(false), 3000)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule meeting. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDocumentUpload = async (weekNumber: number, file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', `Week ${weekNumber} Submission`)
      formData.append('type', 'submission')
      formData.append('week_number', weekNumber.toString())

      await documentsAPI.upload(formData)
      
      setWeeklySubmissions((prev) => [
        ...prev.filter((s) => s.week !== weekNumber),
        { week: weekNumber, status: "submitted", file: file.name },
      ])
      
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully.",
      })
      
      setUploadSuccess(true)
      setShowUploadDialog(false)
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLogProgress = async (progressData: { title: string; category: string; description: string }) => {
    try {
      // Get current student ID (you'll need to get this from auth context or API)
      // For now, using a placeholder - you should get the actual student_id
      const studentId = 1 // TODO: Get from auth context
      
      await progressAPI.createProgressLog({
        student_id: studentId,
        title: progressData.title,
        category: progressData.category,
        description: progressData.description,
      })
      
      toast({
        title: "Progress Logged",
        description: "Your progress has been logged successfully.",
      })
      
      setLogProgressSuccess(true)
      setShowLogProgressDialog(false)
      setTimeout(() => setLogProgressSuccess(false), 3000)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log progress. Please try again.",
        variant: "destructive",
      })
    }
  }

  const { notifications, unreadCount, markAsRead, deleteNotification, clearAll } = useNotifications()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const [meetingHistory] = useState([
    {
      id: 1,
      title: "Progress Review Meeting",
      date: "Oct 15, 2025",
      time: "2:00 PM",
      duration: "1 hour",
      status: "completed",
      supervisor: "Dr. Sarah Johnson",
      notes: "Discussed data collection progress and methodology refinements",
    },
    {
      id: 2,
      title: "Methodology Discussion",
      date: "Oct 1, 2025",
      time: "10:00 AM",
      duration: "45 minutes",
      status: "completed",
      supervisor: "Dr. Sarah Johnson",
      notes: "Reviewed research methodology and data analysis approach",
    },
    {
      id: 3,
      title: "Literature Review Feedback",
      date: "Sep 20, 2025",
      time: "3:00 PM",
      duration: "1 hour",
      status: "completed",
      supervisor: "Dr. Sarah Johnson",
      notes: "Received feedback on literature review chapter",
    },
    {
      id: 4,
      title: "Proposal Defense",
      date: "Sep 5, 2025",
      time: "9:00 AM",
      duration: "2 hours",
      status: "completed",
      supervisor: "Dr. Sarah Johnson",
      notes: "Successfully defended research proposal",
    },
  ])

  const filteredMeetingHistory = meetingHistory.filter(
    (meeting) =>
      meeting.title.toLowerCase().includes(meetingHistorySearch.toLowerCase()) ||
      meeting.date.toLowerCase().includes(meetingHistorySearch.toLowerCase()) ||
      meeting.supervisor.toLowerCase().includes(meetingHistorySearch.toLowerCase()) ||
      meeting.notes.toLowerCase().includes(meetingHistorySearch.toLowerCase()),
  )

  const { toast } = useToast()

  const handleMarkAsRead = (notificationId: number) => {
    markAsRead(notificationId)
  }

  const handleDeleteNotification = (notificationId: number) => {
    deleteNotification(notificationId)
    toast({
      title: "Notification Deleted",
      description: "The notification has been removed.",
    })
  }

  const handleClearAll = () => {
    const unreadNotifs = notifications.filter((n) => n.unread).length
    clearAll()
    toast({
      title: "All Notifications Marked as Read",
      description: `${unreadNotifs} notifications marked as read.`,
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
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <BellIcon />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full" />}
              </Button>

              {/* Notifications Dropdown Panel */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="bg-red-500/10 text-red-700">
                        {unreadCount} Unread
                      </Badge>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-muted-foreground">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 hover:bg-muted/50 transition-colors ${notif.unread ? "bg-muted/30" : ""}`}
                          >
                            <div className="flex gap-3">
                              <div className="text-2xl">{notif.icon}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4 className="font-semibold text-sm text-foreground">{notif.title}</h4>
                                  {notif.unread && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                                <p className="text-xs text-muted-foreground mb-2">{notif.timestamp}</p>
                                <div className="flex gap-2">
                                  {notif.unread && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 text-xs"
                                      onClick={() => handleMarkAsRead(notif.id)}
                                    >
                                      Mark as Read
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteNotification(notif.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-border flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={handleClearAll}>
                        Mark All as Read
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-transparent text-destructive hover:text-destructive"
                        onClick={() => {
                          // This action is now handled by clearAll() in the context,
                          // but we keep this for direct clear of the UI state if needed
                          // Though ideally, clearAll would manage the context state too.
                          // For simplicity here, we assume clearAll manages context.
                          // If you want a separate "Clear All Visible" without context update:
                          // setNotifications([]); setUnreadCount(0);
                          // But for consistency with context:
                          handleClearAll()
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* End notifications dropdown */}
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
        {/* Success Alerts */}
        {scheduleMeetingSubmitted && (
          <Alert className="mb-6 bg-green-500/10 border-green-500/30">
            <AlertDescription className="text-green-700 dark:text-green-400">
              Meeting request sent successfully to your supervisor!
            </AlertDescription>
          </Alert>
        )}
        {uploadSuccess && (
          <Alert className="mb-6 bg-green-500/10 border-green-500/30">
            <AlertDescription className="text-green-700 dark:text-green-400">
              Document uploaded successfully to your weekly submissions!
            </AlertDescription>
          </Alert>
        )}
        {logProgressSuccess && (
          <Alert className="mb-6 bg-green-500/10 border-green-500/30">
            <AlertDescription className="text-green-700 dark:text-green-400">
              Progress logged successfully!
            </AlertDescription>
          </Alert>
        )}

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
                <Link href="/student/progress">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
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

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Meeting History</h3>
                <Link href="/student/meetings">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {/* Search bar for meeting history */}
              <div className="mb-4">
                <Input
                  placeholder="Search meetings by title, date, or notes..."
                  value={meetingHistorySearch}
                  onChange={(e) => setMeetingHistorySearch(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                {filteredMeetingHistory.length > 0 ? (
                  filteredMeetingHistory.slice(0, 3).map((meeting) => (
                    <div
                      key={meeting.id}
                      className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{meeting.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {meeting.date} at {meeting.time} • {meeting.duration}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                          {meeting.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{meeting.notes}</p>
                      <p className="text-xs text-muted-foreground">With: {meeting.supervisor}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No meetings found</p>
                )}
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
                <div
                  className="cursor-pointer flex-1 hover:opacity-80 transition-opacity"
                  onClick={() => setShowSupervisorModal(true)}
                >
                  <p className="font-semibold text-foreground">Dr. Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">Computer Science</p>
                </div>
              </div>
              <div className="space-y-2">
                <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full bg-transparent" size="sm">
                      <MessageSquareIcon className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] max-h-[600px] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Message Dr. Sarah Johnson</DialogTitle>
                    </DialogHeader>
                    <MessageDialog
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      messageText={messageText}
                      onMessageChange={setMessageText}
                    />
                  </DialogContent>
                </Dialog>

                <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full bg-transparent" size="sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Schedule Meeting
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Schedule Meeting</DialogTitle>
                    </DialogHeader>
                    <ScheduleMeetingForm onSubmit={handleScheduleMeetingSubmit} />
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            <Dialog open={showSupervisorModal} onOpenChange={setShowSupervisorModal}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Supervisor Information</DialogTitle>
                </DialogHeader>
                <SupervisorInfoModal onClose={() => setShowSupervisorModal(false)} />
              </DialogContent>
            </Dialog>

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
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                      <UploadIcon className="mr-2 h-4 w-4" />
                      Upload Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Upload Document</DialogTitle>
                    </DialogHeader>
                    <UploadDocumentForm onSubmit={handleDocumentUpload} weeklySubmissions={weeklySubmissions} />
                  </DialogContent>
                </Dialog>

                <Dialog open={showLogProgressDialog} onOpenChange={setShowLogProgressDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Log Progress
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Log Progress Update</DialogTitle>
                    </DialogHeader>
                    <LogProgressForm onSubmit={handleLogProgress} />
                  </DialogContent>
                </Dialog>

                <Dialog open={showResourcesDialog} onOpenChange={setShowResourcesDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                      <BookOpenIcon className="mr-2 h-4 w-4" />
                      View Resources
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Supervisor Resources</DialogTitle>
                    </DialogHeader>
                    <ViewResourcesDialog resources={supervisorResources} />
                  </DialogContent>
                </Dialog>

                <DownloadReportButton
                  studentData={studentData}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start bg-transparent"
                />
              </div>
            </Card>

            <Button
              onClick={() => setShowChatbot(!showChatbot)}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <ChatbotIcon className="mr-2 h-4 w-4" />
              {showChatbot ? "Close" : "Ask"} AI Assistant
            </Button>

            {showChatbot && <ChatbotComponent />}
          </div>
        </div>
      </main>
    </div>
  )
}

function SupervisorInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-4 pb-4 border-b border-border">
        <Avatar className="h-16 w-16">
          <AvatarImage src="/diverse-professor-lecturing.png" alt="Supervisor" />
          <AvatarFallback>DS</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-bold text-foreground">Dr. Sarah Johnson</h3>
          <p className="text-sm text-muted-foreground">Associate Professor</p>
          <p className="text-sm text-muted-foreground">Department of Computer Science</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Email</p>
          <p className="text-sm text-foreground">sarah.johnson@utm.my</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Office</p>
          <p className="text-sm text-foreground">Room 3.14, Faculty of Computing</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Phone</p>
          <p className="text-sm text-foreground">+60 3-8946 4626</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Office Hours</p>
          <p className="text-sm text-foreground">Monday to Thursday: 2:00 PM - 4:00 PM</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Research Interest</p>
          <p className="text-sm text-foreground">Artificial Intelligence, Machine Learning, Healthcare Analytics</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">Biography</p>
          <p className="text-sm text-foreground text-justify">
            Dr. Sarah Johnson has over 15 years of experience in computer science and has supervised 20+ PhD and Masters
            students. She specializes in AI applications in healthcare.
          </p>
        </div>
      </div>
    </div>
  )
}

function MessageDialog({
  messages,
  onSendMessage,
  messageText,
  onMessageChange,
}: {
  messages: Array<{ type: string; text: string; time: string }>
  onSendMessage: () => void
  messageText: string
  onMessageChange: (text: string) => void
}) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex-1 max-h-[300px] overflow-y-auto bg-muted/30 rounded-lg p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Start a conversation!</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === "sent" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.type === "sent"
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-foreground border border-border"
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.type === "sent" ? "opacity-70" : "text-muted-foreground"}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Textarea
          placeholder="Type your message..."
          value={messageText}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              onSendMessage()
            }
          }}
          rows={3}
          className="resize-none"
        />
        <Button onClick={onSendMessage} className="bg-accent text-accent-foreground hover:bg-accent/90 self-end">
          <SendIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function UploadDocumentForm({
  onSubmit,
  weeklySubmissions,
}: { onSubmit: (week: number, file: File) => void; weeklySubmissions: any[] }) {
  const [selectedWeek, setSelectedWeek] = useState<string>("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedWeek && uploadFile) {
      onSubmit(Number.parseInt(selectedWeek), uploadFile)
      setSelectedWeek("")
      setUploadFile(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Select Week</label>
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger>
            <SelectValue placeholder="Choose which week to submit" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 16 }, (_, i) => i + 1).map((week) => {
              const submitted = weeklySubmissions.find((s) => s.week === week)
              return (
                <SelectItem key={week} value={week.toString()}>
                  Week {week} {submitted ? "- Resubmit" : ""}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Upload File</label>
        <Input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} required />
        {uploadFile && <p className="text-sm text-muted-foreground">Selected: {uploadFile.name}</p>}
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={!selectedWeek || !uploadFile}
        >
          Upload
        </Button>
      </div>
    </form>
  )
}

function ScheduleMeetingForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    duration: "",
    type: "",
    agenda: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && formData.date && formData.time && formData.duration && formData.type && formData.agenda) {
      setIsSubmitting(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onSubmit(formData)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Meeting Title</label>
        <Input
          placeholder="e.g., Progress Review"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Date</label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Time</label>
          <Input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Duration</label>
        <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="45">45 minutes</SelectItem>
            <SelectItem value="60">1 hour</SelectItem>
            <SelectItem value="90">1.5 hours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Meeting Type</label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="online">Online (Webex)</SelectItem>
            <SelectItem value="in-person">In-Person</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Agenda</label>
        <Textarea
          placeholder="What would you like to discuss?"
          value={formData.agenda}
          onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
          rows={4}
          required
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => setFormData({ title: "", date: "", time: "", duration: "", type: "", agenda: "" })}
        >
          Clear
        </Button>
        <Button
          type="submit"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={
            isSubmitting ||
            !formData.title ||
            !formData.date ||
            !formData.time ||
            !formData.duration ||
            !formData.type ||
            !formData.agenda
          }
        >
          {isSubmitting ? "Sending..." : "Send Request"}
        </Button>
      </div>
    </form>
  )
}

function LogProgressForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && formData.category && formData.description) {
      onSubmit(formData)
      setFormData({ title: "", category: "", description: "" })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Title</label>
        <Input
          placeholder="Brief description of progress"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Category</label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="research">Research</SelectItem>
            <SelectItem value="data-collection">Data Collection</SelectItem>
            <SelectItem value="data-analysis">Data Analysis</SelectItem>
            <SelectItem value="writing">Writing</SelectItem>
            <SelectItem value="publication">Publication</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Description</label>
        <Textarea
          placeholder="Detailed description of your progress..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={5}
          required
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
          Save Progress
        </Button>
      </div>
    </form>
  )
}

function ViewResourcesDialog({ resources }: { resources: any[] }) {
  return (
    <div className="space-y-4 mt-4">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {resources.length > 0 ? (
            resources.map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-destructive/10 rounded flex items-center justify-center">
                    <FileTextIcon className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{resource.title}</p>
                    <p className="text-xs text-muted-foreground">Uploaded: {resource.uploadedDate}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80">
                  Download
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No resources available yet</p>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-3 mt-4">
          {resources.slice(0, 2).length > 0 ? (
            resources.slice(0, 2).map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-destructive/10 rounded flex items-center justify-center">
                    <FileTextIcon className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{resource.title}</p>
                    <p className="text-xs text-muted-foreground">Uploaded: {resource.uploadedDate}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80">
                  Download
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No recent resources</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ChatbotComponent() {
  const [chatMessages, setChatMessages] = useState<Array<{ type: string; text: string }>>([])
  const [chatInput, setChatInput] = useState("")

  const chatbotResponses: { [key: string]: string } = {
    "how do i upload":
      "You can upload documents by going to the Documents section and clicking 'Upload Document' button.",
    "how do i schedule": "Click 'Schedule Meeting' button in the sidebar to schedule a meeting with your supervisor.",
    "what is this platform":
      "UTMGradient is a postgraduate supervision platform that helps manage your research progress, meetings, and communications with your supervisor.",
    "how do i submit progress":
      "You can log your progress in the Progress page by clicking 'Log Progress' and filling in the form.",
    "how do i contact my supervisor":
      "You can send a message using the 'Send Message' button in your supervisor's card.",
    "what are deadlines":
      "Check the 'Upcoming Deadlines' section to see your important dates and submission deadlines.",
    "how do i view milestones": "Click 'View All' in the Research Milestones card to see all your project milestones.",
    default:
      "I can help you with: uploading documents, scheduling meetings, submitting progress, viewing milestones, and more. What would you like to know?",
  }

  const handleChatMessage = () => {
    if (chatInput.trim()) {
      const userMsg = { type: "user", text: chatInput }
      setChatMessages([...chatMessages, userMsg])

      // Find matching response
      let response = chatbotResponses["default"]
      const lowerInput = chatInput.toLowerCase()
      for (const [key, value] of Object.entries(chatbotResponses)) {
        if (lowerInput.includes(key)) {
          response = value
          break
        }
      }

      setTimeout(() => {
        const botMsg = { type: "bot", text: response }
        setChatMessages((prev) => [...prev, botMsg])
      }, 500)

      setChatInput("")
    }
  }

  return (
    <Card className="p-4 border-accent/30 bg-accent/5">
      <h4 className="text-sm font-bold text-foreground mb-3">AI Assistant</h4>
      <div className="max-h-[250px] overflow-y-auto bg-background rounded-lg p-3 mb-3 border border-border">
        {chatMessages.length === 0 ? (
          <p className="text-xs text-muted-foreground">Ask me anything about the platform...</p>
        ) : (
          chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-2 py-1 rounded text-xs ${
                  msg.type === "user" ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Ask a question..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleChatMessage()
            }
          }}
          className="text-xs h-8"
        />
        <Button onClick={handleChatMessage} size="sm" className="h-8 px-2">
          <SendIcon className="h-3 w-3" />
        </Button>
      </div>
    </Card>
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

function SendIcon({ className }: { className?: string }) {
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
      <path d="m22 2-7 19-4-9-9-4 20-6z" />
    </svg>
  )
}

function ChatbotIcon({ className }: { className?: string }) {
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
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5l4 4v-4h1c5.52 0 10-4.48 10-10S23.52 2 12 2z" />
      <circle cx="8" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="16" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}
