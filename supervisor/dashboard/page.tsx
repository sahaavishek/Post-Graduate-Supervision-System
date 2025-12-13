"use client"

import type React from "react"

import { useState } from "react"
import { useNotifications } from "@/lib/notifications-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { DownloadReportButton } from "@/components/download-report-button"
import Link from "next/link"

const initialStudents = [
  {
    id: 1,
    name: "Ahmad Ibrahim",
    program: "PhD Computer Science",
    progress: 68,
    status: "on-track",
    lastMeeting: "2 days ago",
    nextMilestone: "Data Collection",
    avatar: "/placeholder.svg?key=st01",
  },
  {
    id: 2,
    name: "Fatimah Hassan",
    program: "Masters Software Engineering",
    progress: 85,
    status: "on-track",
    lastMeeting: "1 week ago",
    nextMilestone: "Thesis Writing",
    avatar: "/placeholder.svg?key=st02",
  },
  {
    id: 3,
    name: "Muhammad Ali",
    program: "PhD Artificial Intelligence",
    progress: 45,
    status: "needs-attention",
    lastMeeting: "3 weeks ago",
    nextMilestone: "Research Proposal",
    avatar: "/placeholder.svg?key=st03",
  },
  {
    id: 4,
    name: "Aisha Rahman",
    program: "Masters Data Science",
    progress: 92,
    status: "on-track",
    lastMeeting: "Yesterday",
    nextMilestone: "Final Defense",
    avatar: "/placeholder.svg?key=st04",
  },
]

interface Meeting {
  id: string
  studentId: number
  studentName: string
  date: string
  time: string
  duration: string
  type: string
  topic: string
  location: string
  status: "pending" | "approved" | "completed"
}

interface Document {
  id: string
  studentId: number
  title: string
  type: string
  uploadedDate: string
  size: string
}

export default function SupervisorDashboard() {
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false)
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false)
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isViewAllReviewsOpen, setIsViewAllReviewsOpen] = useState(false)
  const [selectedReportStudent, setSelectedReportStudent] = useState("")
  const [announcementMessage, setAnnouncementMessage] = useState("")
  const [announcementTitle, setAnnouncementTitle] = useState("")
  // Use notifications context
  const { notifications, unreadCount, markAsRead, deleteNotification, clearAllNotifications } = useNotifications()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  // Remove local notifications state
  // const [notifications, setNotifications] = useState([
  //   {
  //     id: 1,
  //     type: "meeting",
  //     title: "Meeting Request",
  //     message: "Ahmad Ibrahim has requested a meeting for Jan 20",
  //     timestamp: "2 hours ago",
  //     unread: true,
  //     icon: "📅",
  //   },
  //   {
  //     id: 2,
  //     type: "document",
  //     title: "Document Submitted",
  //     message: "Fatimah Hassan submitted Chapter 3 Draft",
  //     timestamp: "4 hours ago",
  //     unread: true,
  //     icon: "📄",
  //   },
  //   {
  //     id: 3,
  //     type: "progress",
  //     title: "Progress Update",
  //     message: "Aisha Rahman reached 92% completion milestone",
  //     timestamp: "1 day ago",
  //     unread: true,
  //     icon: "📈",
  //   },
  //   {
  //     id: 4,
  //     type: "general",
  //     title: "System Update",
  //     message: "New features available in the dashboard",
  //     unread: false,
  //     icon: "⚙️",
  //   },
  //   {
  //     id: 5,
  //     type: "general",
  //     title: "Reminder",
  //     message: "Upcoming deadline for Muhammad Ali review",
  //     unread: false,
  //     icon: "🔔",
  //   },
  // ])

  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: "1",
      studentId: 1,
      studentName: "Ahmad Ibrahim",
      date: "2025-01-20",
      time: "15:00",
      duration: "60",
      type: "online",
      topic: "Progress Review",
      location: "Webex",
      status: "pending",
    },
    {
      id: "2",
      studentId: 2,
      studentName: "Fatimah Hassan",
      date: "2025-01-21",
      time: "10:00",
      duration: "45",
      type: "in-person",
      topic: "Methodology Discussion",
      location: "Room 3.14",
      status: "approved",
    },
  ])

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      studentId: 1,
      title: "Research Guidelines",
      type: "PDF",
      uploadedDate: "2025-01-15",
      size: "2.4 MB",
    },
    {
      id: "2",
      studentId: 2,
      title: "Project Template",
      type: "DOCX",
      uploadedDate: "2025-01-12",
      size: "1.5 MB",
    },
  ])

  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    program: "",
    startDate: "",
    expectedCompletion: "",
  })
  const [meetingData, setMeetingData] = useState({
    student: "",
    title: "",
    date: "",
    time: "",
    duration: "60",
    type: "online",
    location: "",
    agenda: "",
  })

  const [viewMeetingDetails, setViewMeetingDetails] = useState<Meeting | null>(null)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [suggestTimeDialogOpen, setSuggestTimeDialogOpen] = useState(false)
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null)
  const [rescheduledMeeting, setRescheduledMeeting] = useState({ date: "", time: "" })
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>(["09:00", "14:00", "16:00"])
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>({})
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [newDocument, setNewDocument] = useState({
    title: "",
    studentId: "",
  })
  const [currentUploadFile, setCurrentUploadFile] = useState<File | null>(null)

  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [selectedStudentForMessage, setSelectedStudentForMessage] = useState<number | null>(null)
  const [messageContent, setMessageContent] = useState("")

  const { toast } = useToast()

  const filteredStudents = initialStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.program.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleApproveMeeting = (meetingId: string) => {
    setMeetings(meetings.map((m) => (m.id === meetingId ? { ...m, status: "approved" } : m)))
    const meeting = meetings.find((m) => m.id === meetingId)
    toast({
      title: "Meeting Approved",
      description: `Meeting with ${meeting?.studentName} has been approved.`,
    })
  }

  const handleViewMeetingDetails = (meetingId: string) => {
    const meeting = meetings.find((m) => m.id === meetingId)
    setViewMeetingDetails(meeting || null)
  }

  const handleReschedule = (meetingId: string) => {
    setSelectedMeetingId(meetingId)
    setRescheduleDialogOpen(true)
  }

  const handleSuggestTime = (meetingId: string) => {
    setSelectedMeetingId(meetingId)
    setSuggestTimeDialogOpen(true)
  }

  const handleConfirmReschedule = () => {
    if (!selectedMeetingId || !rescheduledMeeting.date || !rescheduledMeeting.time) {
      toast({
        title: "Error",
        description: "Please select both date and time",
        variant: "destructive",
      })
      return
    }

    setMeetings(
      meetings.map((m) =>
        m.id === selectedMeetingId ? { ...m, date: rescheduledMeeting.date, time: rescheduledMeeting.time } : m,
      ),
    )

    const meeting = meetings.find((m) => m.id === selectedMeetingId)
    toast({
      title: "Meeting Rescheduled",
      description: `Meeting with ${meeting?.studentName} has been rescheduled to ${rescheduledMeeting.date} at ${rescheduledMeeting.time}`,
    })

    setRescheduleDialogOpen(false)
    setRescheduledMeeting({ date: "", time: "" })
    setSelectedMeetingId(null)
  }

  const handleSuggestTimeToStudent = (time: string) => {
    const meeting = meetings.find((m) => m.id === selectedMeetingId)
    toast({
      title: "Time Suggestion Sent",
      description: `Suggested ${time} to ${meeting?.studentName}. They will receive a notification to confirm.`,
    })
    setSuggestTimeDialogOpen(false)
    setSelectedMeetingId(null)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCurrentUploadFile(e.target.files[0])
    }
  }

  const handleAddDocument = () => {
    if (!newDocument.title || !newDocument.studentId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!currentUploadFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      studentId: Number(newDocument.studentId),
      title: newDocument.title,
      type: currentUploadFile.name.split(".").pop()?.toUpperCase() || "FILE",
      uploadedDate: new Date().toISOString().split("T")[0],
      size: `${(currentUploadFile.size / (1024 * 1024)).toFixed(1)} MB`,
    }

    setDocuments([newDoc, ...documents])
    setDocumentDialogOpen(false)
    setNewDocument({ title: "", studentId: "" })
    setCurrentUploadFile(null)

    toast({
      title: "Document Added",
      description: `${currentUploadFile.name} has been uploaded successfully for ${initialStudents.find((s) => s.id === Number(newDocument.studentId))?.name}`,
    })
  }

  const handleRemoveDocument = (documentId: string) => {
    setDocuments(documents.filter((d) => d.id !== documentId))
    toast({
      title: "Document Removed",
      description: "The document has been deleted.",
    })
  }

  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.email || !newStudent.program || !newStudent.startDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setNewStudent({
      name: "",
      email: "",
      phone: "",
      program: "",
      startDate: "",
      expectedCompletion: "",
    })
    setIsAddStudentOpen(false)

    toast({
      title: "Student Added Successfully",
      description: `${newStudent.name} has been added to your supervision list.`,
    })
  }

  const handleScheduleMeeting = () => {
    if (!meetingData.student || !meetingData.title || !meetingData.date || !meetingData.time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const student = initialStudents.find((s) => s.id === Number(meetingData.student))

    const newMeeting: Meeting = {
      id: `meeting-${Date.now()}`,
      studentId: Number(meetingData.student),
      studentName: student?.name || "",
      date: meetingData.date,
      time: meetingData.time,
      duration: meetingData.duration,
      type: meetingData.type,
      topic: meetingData.title,
      location: meetingData.location || (meetingData.type === "online" ? "Webex" : "TBA"),
      status: "pending",
    }

    setMeetings([...meetings, newMeeting])

    setMeetingData({
      student: "",
      title: "",
      date: "",
      time: "",
      duration: "60",
      type: "online",
      location: "",
      agenda: "",
    })
    setIsScheduleMeetingOpen(false)

    toast({
      title: "Meeting Scheduled",
      description: `Meeting with ${student?.name} scheduled for ${meetingData.date} at ${meetingData.time}`,
    })
  }

  const handleGenerateReport = () => {
    if (!selectedReportStudent) {
      toast({
        title: "Selection Required",
        description: "Please select a student to generate report",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Report Generated",
      description: `Progress report generated successfully.`,
    })
  }

  const handleSendAnnouncement = () => {
    if (!announcementTitle || !announcementMessage) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and message",
        variant: "destructive",
      })
      return
    }

    setAnnouncementTitle("")
    setAnnouncementMessage("")
    setIsAnnouncementOpen(false)

    toast({
      title: "Announcement Sent",
      description: "Your announcement has been sent to all students.",
    })
  }

  const handleViewProgress = (studentId: number) => {
    window.location.href = `/supervisor/students/${studentId}`
  }

  // Use markAsRead from context
  const handleMarkAsRead = (notificationId: number) => {
    // setNotifications(notifications.map((notif) => (notif.id === notificationId ? { ...notif, unread: false } : notif)))
    // setUnreadCount(Math.max(0, unreadCount - 1))
    markAsRead(notificationId)
  }

  // Use deleteNotification from context
  const handleDeleteNotification = (notificationId: number) => {
    // const notif = notifications.find((n) => n.id === notificationId)
    // if (notif?.unread) {
    //   setUnreadCount(Math.max(0, unreadCount - 1))
    // }
    // setNotifications(notifications.filter((n) => n.id !== notificationId))
    deleteNotification(notificationId)
    toast({
      title: "Notification Deleted",
      description: "The notification has been removed.",
    })
  }

  // Use clearAllNotifications from context
  const handleClearAll = () => {
    // const unreadNotifs = notifications.filter((n) => n.unread).length
    // setUnreadCount(0)
    // setNotifications(notifications.map((n) => ({ ...n, unread: false })))
    clearAllNotifications()
    toast({
      title: "All Notifications Marked as Read",
      // description: `${unreadNotifs} notifications marked as read.`,
      description: "All notifications have been marked as read.",
    })
  }

  const handleSendMessage = () => {
    if (!messageContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    const student = initialStudents.find((s) => s.id === selectedStudentForMessage)
    toast({
      title: "Message Sent",
      description: `Your message has been sent to ${student?.name}`,
    })

    setMessageDialogOpen(false)
    setMessageContent("")
    setSelectedStudentForMessage(null)
  }

  const handleOpenMessageDialog = (studentId: number) => {
    setSelectedStudentForMessage(studentId)
    setMessageDialogOpen(true)
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
                          // setNotifications([])
                          // setUnreadCount(0)
                          clearAllNotifications()
                          toast({
                            title: "All Notifications Cleared",
                            description: "All notifications have been deleted.",
                          })
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

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
              <p className="text-sm font-medium text-muted-foreground">Pending Meetings</p>
              <FileTextIcon className="text-accent" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {meetings.filter((m) => m.status === "pending").length}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Awaiting approval</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Documents Shared</p>
              <CalendarIcon className="text-accent" />
            </div>
            <p className="text-3xl font-bold text-foreground">{documents.length}</p>
            <p className="text-sm text-muted-foreground mt-2">Across all students</p>
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
                  <Input
                    placeholder="Search students..."
                    className="w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Link href="/supervisor/students">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onViewProfile={() => handleViewProgress(student.id)}
                    onSendMessage={handleOpenMessageDialog}
                  />
                ))}
                {filteredStudents.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No students found matching &quot;{searchQuery}&quot;</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Upcoming Meetings */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-6">Upcoming Meetings</h3>
              <div className="space-y-3">
                {meetings.slice(0, 3).map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{meeting.studentName}</p>
                        <Badge variant={meeting.status === "approved" ? "default" : "secondary"}>
                          {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{meeting.topic}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {meeting.date} at {meeting.time}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{meeting.duration} min</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Dialog
                        open={viewMeetingDetails?.id === meeting.id}
                        onOpenChange={(open) => !open && setViewMeetingDetails(null)}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => handleViewMeetingDetails(meeting.id)}>
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Meeting Details</DialogTitle>
                          </DialogHeader>
                          {viewMeetingDetails && (
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Student</p>
                                <p className="font-semibold">{viewMeetingDetails.studentName}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Topic</p>
                                <p className="font-semibold">{viewMeetingDetails.topic}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Date</p>
                                  <p className="font-semibold">{viewMeetingDetails.date}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Time</p>
                                  <p className="font-semibold">{viewMeetingDetails.time}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Duration</p>
                                  <p className="font-semibold">{viewMeetingDetails.duration} minutes</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Type</p>
                                  <p className="font-semibold capitalize">{viewMeetingDetails.type}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Location</p>
                                <p className="font-semibold">{viewMeetingDetails.location}</p>
                              </div>
                              <div className="flex gap-2 pt-4">
                                {viewMeetingDetails.status === "pending" && (
                                  <Button
                                    onClick={() => handleApproveMeeting(viewMeetingDetails.id)}
                                    className="flex-1"
                                  >
                                    Approve
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  className="flex-1 bg-transparent"
                                  onClick={() => handleReschedule(viewMeetingDetails.id)}
                                >
                                  Reschedule
                                </Button>
                                <Button
                                  variant="outline"
                                  className="flex-1 bg-transparent"
                                  onClick={() => handleSuggestTime(viewMeetingDetails.id)}
                                >
                                  Suggest Time
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
              <Dialog open={isScheduleMeetingOpen} onOpenChange={setIsScheduleMeetingOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full mt-4 bg-transparent" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Schedule New Meeting
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Schedule a Meeting</DialogTitle>
                    <DialogDescription>Schedule a meeting with one of your students</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="meeting-student">Select Student *</Label>
                      <Select
                        value={meetingData.student}
                        onValueChange={(value) => setMeetingData({ ...meetingData, student: value })}
                      >
                        <SelectTrigger id="meeting-student">
                          <SelectValue placeholder="Choose a student" />
                        </SelectTrigger>
                        <SelectContent>
                          {initialStudents.map((student) => (
                            <SelectItem key={student.id} value={String(student.id)}>
                              {student.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meeting-title">Meeting Title *</Label>
                      <Input
                        id="meeting-title"
                        placeholder="e.g., Progress Review"
                        value={meetingData.title}
                        onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="meeting-date">Date *</Label>
                        <Input
                          id="meeting-date"
                          type="date"
                          value={meetingData.date}
                          onChange={(e) => setMeetingData({ ...meetingData, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meeting-time">Time *</Label>
                        <Input
                          id="meeting-time"
                          type="time"
                          value={meetingData.time}
                          onChange={(e) => setMeetingData({ ...meetingData, time: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meeting-duration">Duration</Label>
                      <Select
                        value={meetingData.duration}
                        onValueChange={(value) => setMeetingData({ ...meetingData, duration: value })}
                      >
                        <SelectTrigger id="meeting-duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meeting-type">Meeting Type</Label>
                      <Select
                        value={meetingData.type}
                        onValueChange={(value) => setMeetingData({ ...meetingData, type: value })}
                      >
                        <SelectTrigger id="meeting-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in-person">In-Person</SelectItem>
                          <SelectItem value="online">Online (Webex)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meeting-location">Location</Label>
                      <Input
                        id="meeting-location"
                        placeholder="e.g., Room 3.14 or leave blank for Webex"
                        value={meetingData.location}
                        onChange={(e) => setMeetingData({ ...meetingData, location: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meeting-agenda">Agenda / Purpose</Label>
                      <Textarea
                        id="meeting-agenda"
                        placeholder="What would you like to discuss?"
                        rows={4}
                        value={meetingData.agenda}
                        onChange={(e) => setMeetingData({ ...meetingData, agenda: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsScheduleMeetingOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleScheduleMeeting}>Schedule Meeting</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Card>

            {/* Documents Section */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-6">Shared Documents</h3>
              <div className="space-y-3">
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No documents uploaded yet</p>
                  </div>
                ) : (
                  documents.slice(0, 3).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileTextIcon />
                        <div>
                          <p className="font-medium text-sm">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.uploadedDate} • {doc.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{doc.type}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveDocument(doc.id)}>
                          <TrashIcon className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full mt-4 bg-transparent" size="sm">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add Document for Student</DialogTitle>
                    <DialogDescription>Upload and share documents with your students</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="doc-student">Select Student *</Label>
                      <Select
                        value={newDocument.studentId}
                        onValueChange={(value) => setNewDocument({ ...newDocument, studentId: value })}
                      >
                        <SelectTrigger id="doc-student">
                          <SelectValue placeholder="Choose a student" />
                        </SelectTrigger>
                        <SelectContent>
                          {initialStudents.map((student) => (
                            <SelectItem key={student.id} value={String(student.id)}>
                              {student.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doc-title">Document Title *</Label>
                      <Input
                        id="doc-title"
                        placeholder="e.g., Research Guidelines"
                        value={newDocument.title}
                        onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doc-file">Upload File *</Label>
                      <Input id="doc-file" type="file" onChange={handleFileUpload} className="cursor-pointer" />
                      {currentUploadFile && <p className="text-sm text-green-600">✓ {currentUploadFile.name}</p>}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDocumentDialogOpen(false)
                        setCurrentUploadFile(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddDocument}>Add Document</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
              <Dialog open={isViewAllReviewsOpen} onOpenChange={setIsViewAllReviewsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full mt-4 bg-transparent" size="sm">
                    View All Reviews
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>All Pending Reviews</DialogTitle>
                    <DialogDescription>Complete list of all pending student document reviews</DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[500px] overflow-y-auto">
                    <div className="space-y-3">
                      <ReviewItemDetailed
                        student="Ahmad Ibrahim"
                        document="Chapter 3 Draft"
                        program="PhD Computer Science"
                        submitted="2 hours ago"
                        priority="high"
                        description="Chapter 3 includes methodology and initial results. Awaiting your review."
                      />
                      <ReviewItemDetailed
                        student="Fatimah Hassan"
                        document="Methodology Section"
                        program="Masters Software Engineering"
                        submitted="1 day ago"
                        priority="medium"
                        description="Detailed methodology for proposed framework. Ready for feedback."
                      />
                      <ReviewItemDetailed
                        student="Aisha Rahman"
                        document="Final Thesis"
                        program="Masters Data Science"
                        submitted="2 days ago"
                        priority="high"
                        description="Complete thesis ready for final review and approval. Critical deadline approaching."
                      />
                      <ReviewItemDetailed
                        student="Muhammad Ali"
                        document="Literature Review"
                        program="PhD Artificial Intelligence"
                        submitted="1 week ago"
                        priority="low"
                        description="Comprehensive literature review covering recent AI advancements."
                      />
                      <ReviewItemDetailed
                        student="Ahmad Hassan"
                        document="Research Proposal"
                        program="PhD Cybersecurity"
                        submitted="3 days ago"
                        priority="medium"
                        description="Initial research proposal with objectives and timeline."
                      />
                      <ReviewItemDetailed
                        student="Nora Ali"
                        document="Chapter 1 & 2"
                        program="Masters Data Science"
                        submitted="5 days ago"
                        priority="medium"
                        description="Introduction and Literature review chapters for comprehensive feedback."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setIsViewAllReviewsOpen(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Add New Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Student</DialogTitle>
                      <DialogDescription>
                        Add a new student to your supervision list. Fill in the required information below.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">
                          Student Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="e.g., Ahmad Ibrahim"
                          value={newStudent.name}
                          onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">
                          Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="e.g., ahmad@utm.my"
                          value={newStudent.email}
                          onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          placeholder="e.g., +60 12-345 6789"
                          value={newStudent.phone}
                          onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="program">
                          Program <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={newStudent.program}
                          onValueChange={(value) => setNewStudent({ ...newStudent, program: value })}
                        >
                          <SelectTrigger id="program">
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PhD Computer Science">PhD Computer Science</SelectItem>
                            <SelectItem value="PhD Artificial Intelligence">PhD Artificial Intelligence</SelectItem>
                            <SelectItem value="PhD Cybersecurity">PhD Cybersecurity</SelectItem>
                            <SelectItem value="Masters Software Engineering">Masters Software Engineering</SelectItem>
                            <SelectItem value="Masters Data Science">Masters Data Science</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="startDate">
                          Start Date <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="startDate"
                          type="month"
                          value={newStudent.startDate}
                          onChange={(e) => setNewStudent({ ...newStudent, startDate: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="expectedCompletion">Expected Completion (Optional)</Label>
                        <Input
                          id="expectedCompletion"
                          type="month"
                          value={newStudent.expectedCompletion}
                          onChange={(e) => setNewStudent({ ...newStudent, expectedCompletion: e.target.value })}
                          placeholder="Auto-calculated if left empty"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddStudentOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddStudent}>Add Student</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isGenerateReportOpen} onOpenChange={setIsGenerateReportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                      <FileTextIcon className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Generate Student Report</DialogTitle>
                      <DialogDescription>Select a student to generate their progress report</DialogDescription>
                    </DialogHeader>
                    {selectedReportStudent ? (
                      <div className="space-y-4 mt-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Selected Student</p>
                          <p className="text-lg font-semibold text-foreground">
                            {initialStudents.find((s) => s.id === Number(selectedReportStudent))?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {initialStudents.find((s) => s.id === Number(selectedReportStudent))?.program}
                          </p>
                        </div>

                        <DownloadReportButton
                          studentData={{
                            name: initialStudents.find((s) => s.id === Number(selectedReportStudent))?.name || "",
                            program: initialStudents.find((s) => s.id === Number(selectedReportStudent))?.program || "",
                            progress:
                              initialStudents.find((s) => s.id === Number(selectedReportStudent))?.progress || 0,
                            startDate: "Jan 2023",
                            expectedCompletion: "Dec 2026",
                            milestones: [
                              { name: "Literature Review", progress: 100, status: "completed" },
                              { name: "Research Proposal", progress: 100, status: "completed" },
                              { name: "Data Collection", progress: 75, status: "in-progress" },
                            ],
                          }}
                          variant="default"
                          size="default"
                          className="w-full"
                        />

                        <Button
                          variant="outline"
                          className="w-full bg-transparent"
                          onClick={() => {
                            setSelectedReportStudent("")
                          }}
                        >
                          Select Different Student
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 mt-4">
                        <Select value={selectedReportStudent} onValueChange={setSelectedReportStudent}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                          <SelectContent>
                            {initialStudents.map((student) => (
                              <SelectItem key={student.id} value={String(student.id)}>
                                {student.name} - {student.program}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Choose a student from the list above to generate their AI-powered progress report.
                        </p>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsGenerateReportOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleGenerateReport}>Generate Report</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                      <MessageSquareIcon className="mr-2 h-4 w-4" />
                      Send Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Send Announcement</DialogTitle>
                      <DialogDescription>Send an announcement to all your students</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="announcement-title">Announcement Title *</Label>
                        <Input
                          id="announcement-title"
                          placeholder="e.g., Important: Deadline Change"
                          value={announcementTitle}
                          onChange={(e) => setAnnouncementTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="announcement-message">Message *</Label>
                        <Textarea
                          id="announcement-message"
                          placeholder="Write your announcement message here..."
                          rows={6}
                          value={announcementMessage}
                          onChange={(e) => setAnnouncementMessage(e.target.value)}
                        />
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          This announcement will be sent to all 8 students in your supervision list.
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAnnouncementOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSendAnnouncement}>Send Announcement</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Message to Student</DialogTitle>
            <DialogDescription>
              Send a message to {initialStudents.find((s) => s.id === selectedStudentForMessage)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message-content">Message *</Label>
              <Textarea
                id="message-content"
                placeholder="Type your message here..."
                rows={6}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMessageDialogOpen(false)
                setMessageContent("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSendMessage}>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reschedule Meeting</DialogTitle>
            <DialogDescription>Select a new date and time for the meeting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">New Date *</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduledMeeting.date}
                onChange={(e) => setRescheduledMeeting({ ...rescheduledMeeting, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reschedule-time">New Time *</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={rescheduledMeeting.time}
                onChange={(e) => setRescheduledMeeting({ ...rescheduledMeeting, time: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReschedule}>Confirm Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={suggestTimeDialogOpen} onOpenChange={setSuggestTimeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Suggest Alternative Time</DialogTitle>
            <DialogDescription>Select a time to suggest to the student</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground mb-4">Suggested times:</p>
            {suggestedTimes.map((time) => (
              <Button
                key={time}
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => handleSuggestTimeToStudent(time)}
              >
                {time}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuggestTimeDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StudentCard({
  student,
  onViewProfile,
  onSendMessage,
}: {
  student: (typeof initialStudents)[0]
  onViewProfile: () => void
  onSendMessage: (studentId: number) => void // Added onSendMessage prop
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

  const config = statusConfig[student.status as keyof typeof statusConfig]

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
      <Avatar className="h-12 w-12">
        <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
        <AvatarFallback>
          {student.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-foreground">{student.name}</h4>
          <Badge className={config.color} variant="secondary">
            {config.badge}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{student.program}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
          <span>Last meeting: {student.lastMeeting}</span>
          <span>•</span>
          <span>Next: {student.nextMilestone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={student.progress} className="h-2 flex-1" />
          <span className="text-sm font-semibold text-muted-foreground">{student.progress}%</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" onClick={onViewProfile}>
          View Profile
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onSendMessage(student.id)}>
          <MessageSquareIcon className="h-4 w-4" />
        </Button>
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

function ReviewItemDetailed({
  student,
  document,
  program,
  submitted,
  priority,
  description,
}: {
  student: string
  document: string
  program: string
  submitted: string
  priority: string
  description: string
}) {
  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  }

  return (
    <div className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-foreground">{student}</p>
            <Badge
              variant="secondary"
              className={
                priority === "high"
                  ? "bg-red-500/10 text-red-700 dark:text-red-400"
                  : priority === "medium"
                    ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                    : "bg-green-500/10 text-green-700 dark:text-green-400"
              }
            >
              {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{program}</p>
          <p className="font-medium text-sm text-foreground mb-2">{document}</p>
          <p className="text-sm text-muted-foreground mb-2">{description}</p>
          <p className="text-xs text-muted-foreground">Submitted {submitted}</p>
        </div>
      </div>
      <Button size="sm" variant="outline" className="w-full mt-3 bg-transparent">
        Review Now
      </Button>
    </div>
  )
}

// ... existing icons ...
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

function TrashIcon({ className }: { className?: string }) {
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
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}
