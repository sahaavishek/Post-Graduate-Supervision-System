"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useNotifications } from "@/lib/notifications-context"
import { useUser } from "@/lib/user-context"
import { meetingsAPI, getUploadUrl } from "@/lib/api"

interface Meeting {
  id: string
  student: string
  studentId: string
  title: string
  date: string
  time: string
  location: string
  status: "confirmed" | "pending" | "completed"
  agenda: string
  avatar: string
  duration: string
  type: "in-person" | "online"
}

interface MeetingRequest {
  id: string
  student: string
  studentId: string
  title: string
  requestedDate: string
  requestedTime: string
  duration: string
  reason: string
  avatar: string
  type: "in-person" | "online"
  location?: string
  meetingLink?: string
}

// Define Notification interface
interface Notification {
  id: number
  type: "meeting" | "document" | "progress" | "general"
  title: string
  message: string
  timestamp: string
  unread: boolean
  icon: string
}

export default function SupervisorMeetingsPage() {
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)

  const [meetingSearchQuery, setMeetingSearchQuery] = useState("")

  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, clearAll } = useNotifications()
  const { user } = useUser()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Handle notification click to navigate
  const handleNotificationClick = async (notif: any) => {
    // Mark as read when clicked
    if (notif.unread) {
      markAsRead(notif.id)
    }
    
    // Navigate based on notification link first (from live API data)
    if (notif.link && notif.link.trim() !== '') {
      try {
        router.push(notif.link)
        setIsNotificationsOpen(false)
        return
      } catch (error) {
        console.error('Error navigating to notification link:', error)
      }
    }
    
    // For document notifications, try to extract student name from message and find student
    if ((notif.type === 'document' || notif.type === 'submission') && notif.message) {
      try {
        // Extract student name from message (format: "StudentName has submitted...")
        const match = notif.message.match(/^([^ ]+(?: [^ ]+)*) has submitted/)
        if (match && match[1]) {
          const studentName = match[1].trim()
          // Try to get students from API to find the student
          try {
            const { studentsAPI } = await import("@/lib/api")
            const response = await studentsAPI.getAll()
            const studentsList = response.students || []
            const student = studentsList.find((s: any) => 
              (s.name || '').toLowerCase() === studentName.toLowerCase()
            )
            if (student && student.id) {
              router.push(`/supervisor/students/${student.id}`)
              setIsNotificationsOpen(false)
              return
            }
          } catch (error) {
            console.error('Error fetching students:', error)
          }
        }
      } catch (error) {
        console.error('Error finding student from notification:', error)
      }
    }
    
    // Default navigation based on type for supervisor role
    const basePath = '/supervisor'
    switch (notif.type) {
      case 'meeting':
        router.push(`${basePath}/meetings`)
        break
      case 'document':
      case 'submission':
        // Navigate to students page (not documents page) for document notifications
        router.push(`${basePath}/students`)
        break
      case 'message':
        router.push(`${basePath}/dashboard`)
        break
      case 'progress':
      case 'reminder':
        router.push(`${basePath}/students`)
        break
      default:
        router.push(`${basePath}/dashboard`)
    }
    setIsNotificationsOpen(false)
  }

  const handleMarkAsRead = (notificationId: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    markAsRead(notificationId)
  }

  const handleDeleteNotification = (notificationId: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    deleteNotification(notificationId)
    toast({
      title: "Notification Deleted",
      description: "The notification has been removed.",
    })
  }

  const handleClearAll = () => {
    const unreadNotifs = notifications.filter((n) => n.unread).length
    markAllAsRead()
    toast({
      title: "All Notifications Marked as Read",
      description: `${unreadNotifs} notifications marked as read.`,
    })
  }

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([])
  const [pastMeetings, setPastMeetings] = useState<Meeting[]>([])
  const [allMeetings, setAllMeetings] = useState<any[]>([])

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  // Helper function to format time
  const formatTime = (timeString: string, duration: number) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const mins = parseInt(minutes)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    
    // Calculate end time
    const totalMinutes = hour * 60 + mins + duration
    const endHour = Math.floor(totalMinutes / 60) % 24
    const endMins = totalMinutes % 60
    const endDisplayHour = endHour % 12 || 12
    const endAmpm = endHour >= 12 ? 'PM' : 'AM'
    
    return `${displayHour}:${String(mins).padStart(2, '0')} ${ampm} - ${endDisplayHour}:${String(endMins).padStart(2, '0')} ${endAmpm}`
  }

  // Fetch meetings from API
  const fetchMeetings = async () => {
    try {
      const response = await meetingsAPI.getAll({ status: undefined })
      const allMeetings = response.meetings || []

      // Helper to check if meeting date/time has passed
      const isMeetingPast = (meeting: any) => {
        try {
          // Parse date and time - handle different date formats
          const dateStr = meeting.date
          const timeStr = meeting.time
          
          // Create date object from date string (format: YYYY-MM-DD)
          const [year, month, day] = dateStr.split('-').map(Number)
          const [hours, minutes] = timeStr.split(':').map(Number)
          
          const meetingDateTime = new Date(year, month - 1, day, hours, minutes, 0)
          const now = new Date()
          
          return meetingDateTime < now
        } catch (error) {
          console.error('Error parsing meeting date/time:', error)
          return false
        }
      }

      // Transform API data to component format
      // Upcoming meetings: approved/confirmed AND date/time hasn't passed
      const transformedMeetings: Meeting[] = allMeetings
        .filter((m: any) => (m.status === 'approved' || m.status === 'confirmed') && !isMeetingPast(m))
        .map((m: any) => ({
          id: m.id.toString(),
          student: m.student_name || 'Unknown Student',
          studentId: m.student_id.toString(),
          title: m.title,
          date: formatDate(m.date),
          time: formatTime(m.time, m.duration || 60),
          location: m.location || (m.type === 'online' ? 'Online' : 'TBA'),
          meetingLink: m.meeting_link || null,
          status: m.status === 'approved' ? 'confirmed' : (m.status as 'confirmed' | 'pending' | 'completed'),
          agenda: m.agenda || '',
          avatar: `/placeholder.svg?key=st${m.student_id}`,
          duration: (m.duration || 60).toString(),
          type: m.type as 'in-person' | 'online',
        }))

      const transformedRequests: MeetingRequest[] = allMeetings
        .filter((m: any) => m.status === 'pending')
        .map((m: any) => ({
          id: m.id.toString(),
          student: m.student_name || 'Unknown Student',
          studentId: m.student_id.toString(),
          title: m.title,
          requestedDate: formatDate(m.date),
          requestedTime: formatTime(m.time, m.duration || 60).split(' - ')[0],
          duration: `${m.duration || 60} ${(m.duration || 60) === 60 ? 'hour' : 'minutes'}`,
          reason: m.agenda || '',
          avatar: `/placeholder.svg?key=st${m.student_id}`,
          type: m.type as 'in-person' | 'online',
          location: m.location || (m.type === 'online' ? 'Online' : 'TBA'),
          meetingLink: m.meeting_link || null,
        }))

      // Past meetings: only completed meetings where date/time has passed
      const transformedPast: Meeting[] = allMeetings
        .filter((m: any) => m.status === 'completed' && isMeetingPast(m))
        .map((m: any) => ({
          id: m.id.toString(),
          student: m.student_name || 'Unknown Student',
          studentId: m.student_id.toString(),
          title: m.title,
          date: formatDate(m.date),
          time: formatTime(m.time, m.duration || 60),
          location: m.location || (m.type === 'online' ? 'Online' : 'TBA'),
          status: 'completed' as const,
          agenda: m.agenda || m.notes || '',
          avatar: `/placeholder.svg?key=st${m.student_id}`,
          duration: (m.duration || 60).toString(),
          type: m.type as 'in-person' | 'online',
        }))

      setMeetings(transformedMeetings)
      setMeetingRequests(transformedRequests)
      setPastMeetings(transformedPast)
      
      // Store all meetings for statistics calculation
      setAllMeetings(allMeetings)
      
      setIsLoading(false)
    } catch (error: any) {
      console.error('Error fetching meetings:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load meetings. Please refresh the page.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Fetch meetings on mount and set up polling
  useEffect(() => {
    fetchMeetings()
    
    // Poll for new meetings every 10 seconds
    const interval = setInterval(() => {
      fetchMeetings()
    }, 10000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleMeeting, setRescheduleMeeting] = useState<Meeting | null>(null)
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "", location: "" })
  const [suggestTimeOpen, setSuggestTimeOpen] = useState(false)
  const [suggestTimeRequest, setSuggestTimeRequest] = useState<MeetingRequest | null>(null)
  const [suggestTimeData, setSuggestTimeData] = useState({ date: "", time: "", location: "", meetingLink: "", type: "online" as "in-person" | "online" })
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [meetingToDecline, setMeetingToDecline] = useState<{ id: string; studentName: string } | null>(null)
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false)

  const handleViewDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setViewDetailsOpen(true)
  }

  const handleReschedule = (meeting: Meeting) => {
    // Find original meeting to get raw date/time
    const originalMeeting = allMeetings.find((m: any) => m.id.toString() === meeting.id)
    if (originalMeeting) {
      setRescheduleMeeting(meeting)
      setRescheduleData({ 
        date: originalMeeting.date, 
        time: originalMeeting.time, 
        location: originalMeeting.location || "" 
      })
      setRescheduleOpen(true)
    }
  }

  const handleConfirmReschedule = async () => {
    if (!rescheduleMeeting || !rescheduleData.date || !rescheduleData.time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      // Find the original meeting in allMeetings to get the raw ID
      const originalMeeting = allMeetings.find((m: any) => m.id.toString() === rescheduleMeeting.id)
      
      if (!originalMeeting) {
        toast({
          title: "Error",
          description: "Could not find meeting details",
          variant: "destructive",
        })
        return
      }

      // Update meeting via API - supervisor can update directly without status change
      await meetingsAPI.update(parseInt(originalMeeting.id), {
        date: rescheduleData.date,
        time: rescheduleData.time,
        location: rescheduleData.location || originalMeeting.location,
      })

      // Refresh meetings to get updated data
      await fetchMeetings()

      toast({
        title: "Meeting Rescheduled",
        description: `Meeting with ${rescheduleMeeting.student} has been rescheduled to ${rescheduleData.date} at ${rescheduleData.time}. Student has been notified.`,
      })

      setRescheduleOpen(false)
      setRescheduleData({ date: "", time: "", location: "" })
      setRescheduleMeeting(null)
    } catch (error: any) {
      console.error('Error rescheduling meeting:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule meeting. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleApproveMeeting = async (request: MeetingRequest) => {
    try {
      await meetingsAPI.update(parseInt(request.id), { status: 'approved' })
      
      // Refresh meetings to get updated data
      await fetchMeetings()

      toast({
        title: "Meeting Approved",
        description: `${request.student}'s meeting request has been approved.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve meeting. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSuggestTime = (request: MeetingRequest) => {
    // Find original meeting to get raw date/time and type
    const originalMeeting = allMeetings.find((m: any) => m.id.toString() === request.id)
    if (originalMeeting) {
      setSuggestTimeRequest(request)
      setSuggestTimeData({ 
        date: originalMeeting.date, 
        time: originalMeeting.time, 
        location: originalMeeting.location || "",
        meetingLink: originalMeeting.meeting_link || "",
        type: originalMeeting.type as "in-person" | "online"
      })
      setSuggestTimeOpen(true)
    }
  }

  const handleConfirmSuggestedTime = async () => {
    if (!suggestTimeRequest || !suggestTimeData.date || !suggestTimeData.time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Validate meeting type specific fields
    if (suggestTimeData.type === "in-person" && !suggestTimeData.location) {
      toast({
        title: "Validation Error",
        description: "Please provide a location for in-person meetings",
        variant: "destructive",
      })
      return
    }

    if (suggestTimeData.type === "online" && !suggestTimeData.meetingLink) {
      toast({
        title: "Validation Error",
        description: "Please provide a meeting link for online meetings",
        variant: "destructive",
      })
      return
    }

    try {
      // Find the original meeting in allMeetings to get the raw ID
      const originalMeeting = allMeetings.find((m: any) => m.id.toString() === suggestTimeRequest.id)
      
      if (!originalMeeting) {
        toast({
          title: "Error",
          description: "Could not find meeting details",
          variant: "destructive",
        })
        return
      }

      // Update meeting via API with suggested time - approve it so it moves to Upcoming
      await meetingsAPI.update(parseInt(originalMeeting.id), {
        date: suggestTimeData.date,
        time: suggestTimeData.time,
        location: suggestTimeData.type === "in-person" ? suggestTimeData.location : undefined,
        meeting_link: suggestTimeData.type === "online" ? suggestTimeData.meetingLink : undefined,
        status: 'approved', // Approve the meeting so it moves to Upcoming tab
      })

      // Refresh meetings to get updated data
      await fetchMeetings()

      toast({
        title: "Time Suggested",
        description: `Meeting has been updated with suggested time of ${suggestTimeData.date} at ${suggestTimeData.time}. The meeting has been approved and moved to Upcoming. ${suggestTimeRequest.student} has been notified.`,
      })

      setSuggestTimeOpen(false)
      setSuggestTimeData({ date: "", time: "", location: "", meetingLink: "", type: "online" })
      setSuggestTimeRequest(null)
    } catch (error: any) {
      console.error('Error suggesting time:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to suggest time. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeclineMeeting = async (requestId: string, studentName: string) => {
    try {
      // Mark the meeting as cancelled (not delete) so it shows in reports
      await meetingsAPI.update(parseInt(requestId), { status: 'cancelled' })
      
      // Refresh meetings to get updated data
      await fetchMeetings()

      toast({
        title: "Request Declined",
        description: `${studentName}'s meeting request has been declined.`,
      })
      
      // Close dialog if open
      setDeclineDialogOpen(false)
      setMeetingToDecline(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to decline meeting. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openDeclineDialog = (requestId: string, studentName: string) => {
    setMeetingToDecline({ id: requestId, studentName })
    setDeclineDialogOpen(true)
  }

  const handleCompleteMeeting = async (meetingId: string, studentName: string) => {
    try {
      await meetingsAPI.update(parseInt(meetingId), { status: 'completed' })
      
      // Refresh meetings to get updated data
      await fetchMeetings()

      toast({
        title: "Meeting Completed",
        description: `Meeting with ${studentName} has been marked as completed.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete meeting. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleJoinMeeting = (meetingLink: string) => {
    if (meetingLink) {
      window.open(meetingLink, "_blank")
    }
  }

  const filteredUpcomingMeetings = meetings.filter(
    (meeting) =>
      meeting.student.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
      meeting.title.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
      meeting.date.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
      meeting.location.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
      meeting.time.toLowerCase().includes(meetingSearchQuery.toLowerCase()),
  )

  const filteredMeetingRequests = meetingRequests.filter(
    (request) =>
      request.student.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
      request.title.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
      request.requestedDate.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
      request.requestedTime.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
      (request.reason && request.reason.toLowerCase().includes(meetingSearchQuery.toLowerCase())),
  )

  const filteredPastMeetings = pastMeetings.filter(
    (meeting) =>
      meeting.student.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
      meeting.title.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
      meeting.date.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
      meeting.location.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
      meeting.time.toLowerCase().includes(meetingSearchQuery.toLowerCase()),
  )

  // Fetch real students from database (no dummy data)
  const [students, setStudents] = useState<Array<{ id: string; name: string; avatar: string }>>([])
  
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { studentsAPI } = await import("@/lib/api")
        const response = await studentsAPI.getAll()
        const studentsList = response.students || []
        const transformedStudents = studentsList.map((student: any) => ({
          id: student.id.toString(),
          name: student.name,
          avatar: student.avatar || `/placeholder.svg?key=st${student.id}`,
        }))
        setStudents(transformedStudents)
      } catch (error) {
        console.error('Error fetching students:', error)
        setStudents([])
      }
    }
    fetchStudents()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 border-b-2 border-border/50 bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80 shadow-elevation-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/supervisor/dashboard" className="cursor-pointer">
              <h1 className="text-2xl font-bold text-foreground tracking-tight hover:opacity-80 transition-opacity">
                <span className="bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent bg-[length:200%_auto]">UTM</span><span className="ml-1">Gradient</span>
              </h1>
            </Link>
            <nav className="hidden md:flex gap-1">
              <Link
                href="/supervisor/dashboard"
                className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/supervisor/students"
                className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
              >
                Students
              </Link>
              <Link href="/supervisor/meetings" className="text-sm font-medium px-4 py-2 rounded-lg text-foreground bg-muted/50 transition-smooth hover:bg-muted">
                Meetings
              </Link>
              <Link
                href="/supervisor/documents"
                className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
              >
                Documents
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* notifications dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <BellIcon />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>

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
                            className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${notif.unread ? "bg-muted/30" : ""}`}
                            onClick={() => handleNotificationClick(notif)}
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
                                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                                    >
                                      Mark as Read
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs text-destructive hover:text-destructive"
                                    onClick={(e) => handleDeleteNotification(notif.id, e)}
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
                          clearAll()
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
                <AvatarImage src={getUploadUrl(user?.avatar)} alt="Supervisor" />
                <AvatarFallback>{user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'SV'}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Meetings</h2>
            <p className="text-muted-foreground">Manage your supervision meetings and schedule</p>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-green-600 text-white hover:bg-green-700">
                  <VideoIcon className="mr-2 h-4 w-4" />
                  Join Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Join Student Meeting</DialogTitle>
                </DialogHeader>
                <JoinMeetingForm onJoin={handleJoinMeeting} upcomingMeetings={meetings} />
              </DialogContent>
            </Dialog>

            <Dialog open={scheduleMeetingOpen} onOpenChange={setScheduleMeetingOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Schedule a Meeting</DialogTitle>
                </DialogHeader>
                <ScheduleMeetingForm 
                  onSchedule={() => {
                    fetchMeetings()
                    setScheduleMeetingOpen(false)
                  }} 
                  upcomingMeetings={meetings} 
                  students={students} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, date, time, location, or student name..."
                  className="pl-9"
                  value={meetingSearchQuery}
                  onChange={(e) => setMeetingSearchQuery(e.target.value)}
                />
              </div>
              {meetingSearchQuery && (
                <Button variant="ghost" size="sm" onClick={() => setMeetingSearchQuery("")}>
                  Clear
                </Button>
              )}
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upcoming">Upcoming ({filteredUpcomingMeetings.length})</TabsTrigger>
                <TabsTrigger value="requests">Requests ({filteredMeetingRequests.length})</TabsTrigger>
                <TabsTrigger value="past">Past ({filteredPastMeetings.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4 mt-6">
                {isLoading ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Loading meetings...</p>
                  </Card>
                ) : filteredUpcomingMeetings.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      {meetingSearchQuery
                        ? `No meetings found matching "${meetingSearchQuery}"`
                        : "No upcoming meetings scheduled"}
                    </p>
                  </Card>
                ) : (
                  filteredUpcomingMeetings.map((meeting) => (
                    <SupervisorMeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      onViewDetails={handleViewDetails}
                      onReschedule={handleReschedule}
                      onComplete={handleCompleteMeeting}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="requests" className="space-y-4 mt-6">
                {isLoading ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Loading requests...</p>
                  </Card>
                ) : filteredMeetingRequests.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      {meetingSearchQuery
                        ? `No requests found matching "${meetingSearchQuery}"`
                        : "No pending meeting requests"}
                    </p>
                  </Card>
                ) : (
                  filteredMeetingRequests.map((request) => (
                    <MeetingRequestCard
                      key={request.id}
                      request={request}
                      onApprove={handleApproveMeeting}
                      onSuggestTime={handleSuggestTime}
                      onDecline={openDeclineDialog}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4 mt-6">
                {isLoading ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Loading past meetings...</p>
                  </Card>
                ) : filteredPastMeetings.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      {meetingSearchQuery
                        ? `No past meetings found matching "${meetingSearchQuery}"`
                        : "No past meetings"}
                    </p>
                  </Card>
                ) : (
                  filteredPastMeetings.map((meeting) => (
                    <PastSupervisorMeetingCard key={meeting.id} meeting={meeting} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Calendar */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Calendar</h3>
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
            </Card>

            {/* Today's Schedule */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Today's Schedule</h3>
              <div className="space-y-3">
                {(() => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const todayMeetings = allMeetings.filter((m: any) => {
                    const meetingDate = new Date(m.date)
                    meetingDate.setHours(0, 0, 0, 0)
                    return meetingDate.getTime() === today.getTime() && 
                           (m.status === 'approved' || m.status === 'confirmed')
                  }).sort((a: any, b: any) => {
                    const timeA = a.time.split(':').map(Number)
                    const timeB = b.time.split(':').map(Number)
                    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1])
                  })
                  
                  if (todayMeetings.length === 0) {
                    return <p className="text-sm text-muted-foreground text-center py-4">No meetings scheduled for today</p>
                  }
                  
                  return todayMeetings.map((meeting: any) => {
                    const [hours, minutes] = meeting.time.split(':')
                    const hour = parseInt(hours)
                    const mins = parseInt(minutes)
                    const ampm = hour >= 12 ? 'PM' : 'AM'
                    const displayHour = hour % 12 || 12
                    const timeStr = `${displayHour}:${String(mins).padStart(2, '0')} ${ampm}`
                    
                    return (
                      <ScheduleItem 
                        key={meeting.id}
                        time={timeStr}
                        student={meeting.student_name || 'Unknown Student'}
                        type={meeting.title || 'Meeting'}
                      />
                    )
                  })
                })()}
              </div>
            </Card>

            {/* Meeting Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Meeting Statistics</h3>
              <div className="space-y-4">
                {(() => {
                  const now = new Date()
                  const currentMonth = now.getMonth()
                  const currentYear = now.getFullYear()
                  
                  // Calculate statistics from all meetings
                  const meetingsThisMonth = allMeetings.filter((m: any) => {
                    const meetingDate = new Date(m.date)
                    return meetingDate.getMonth() === currentMonth && meetingDate.getFullYear() === currentYear
                  }).length
                  
                  const totalMeetings = allMeetings.length
                  
                  const totalDuration = allMeetings.reduce((sum: number, m: any) => sum + (m.duration || 60), 0)
                  const avgDuration = totalMeetings > 0 ? Math.round(totalDuration / totalMeetings) : 0
                  
                  const recordings = allMeetings.filter((m: any) => m.recording_url).length
                  const pendingRequests = meetingRequests.length
                  
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">This Month</span>
                        <span className="text-2xl font-bold text-foreground">{meetingsThisMonth}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Meetings</span>
                        <span className="text-2xl font-bold text-foreground">{totalMeetings}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Pending Requests</span>
                        <span className="text-2xl font-bold text-foreground">{pendingRequests}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Avg. Duration</span>
                        <span className="text-2xl font-bold text-foreground">{avgDuration}m</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Recordings</span>
                        <span className="text-2xl font-bold text-foreground">{recordings}</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Meeting Details</DialogTitle>
          </DialogHeader>
          {selectedMeeting && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={getUploadUrl(selectedMeeting.avatar)} alt={selectedMeeting.student} />
                  <AvatarFallback>
                    {selectedMeeting.student
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{selectedMeeting.student}</h3>
                  <p className="text-sm text-muted-foreground">{selectedMeeting.title}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedMeeting.date} at {selectedMeeting.time}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                  <p className="text-sm font-medium text-foreground">{selectedMeeting.duration} minutes</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  <p className="text-sm font-medium text-foreground">{selectedMeeting.location}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <p className="text-sm font-medium text-foreground capitalize">{selectedMeeting.type}</p>
                </div>
                {selectedMeeting.meetingLink && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Meeting Link</p>
                    <p className="text-sm font-medium text-foreground">
                      <a 
                        href={selectedMeeting.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {selectedMeeting.meetingLink}
                      </a>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Agenda</p>
                <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg">{selectedMeeting.agenda}</p>
              </div>

              <Button onClick={() => setViewDetailsOpen(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reschedule Meeting</DialogTitle>
          </DialogHeader>
          {rescheduleMeeting && (
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Meeting with {rescheduleMeeting.student}</p>
                <p className="text-sm font-medium text-foreground">{rescheduleMeeting.title}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reschedule-date">New Date *</Label>
                <Input
                  id="reschedule-date"
                  type="date"
                  value={rescheduleData.date}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reschedule-time">New Time *</Label>
                <Input
                  id="reschedule-time"
                  type="time"
                  value={rescheduleData.time}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reschedule-location">Location (Optional)</Label>
                <Input
                  id="reschedule-location"
                  value={rescheduleData.location}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, location: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmReschedule}>Confirm Reschedule</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={suggestTimeOpen} onOpenChange={setSuggestTimeOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Suggest Alternative Time</DialogTitle>
          </DialogHeader>
          {suggestTimeRequest && (
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">For {suggestTimeRequest.student}</p>
                <p className="text-sm font-medium text-foreground">{suggestTimeRequest.title}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggest-date">Suggested Date *</Label>
                <Input
                  id="suggest-date"
                  type="date"
                  value={suggestTimeData.date}
                  onChange={(e) => setSuggestTimeData({ ...suggestTimeData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggest-time">Suggested Time *</Label>
                <Input
                  id="suggest-time"
                  type="time"
                  value={suggestTimeData.time}
                  onChange={(e) => setSuggestTimeData({ ...suggestTimeData, time: e.target.value })}
                  min="08:00"
                  max="17:00"
                  required
                />
                <p className="text-xs text-muted-foreground">Available: 8:00 AM - 5:00 PM</p>
              </div>

              {suggestTimeRequest.type === "in-person" && (
                <div className="space-y-2">
                  <Label htmlFor="suggest-location">Location *</Label>
                  <Input
                    id="suggest-location"
                    value={suggestTimeData.location}
                    onChange={(e) => setSuggestTimeData({ ...suggestTimeData, location: e.target.value })}
                    placeholder="e.g., Room 3.14"
                    required
                  />
                </div>
              )}

              {suggestTimeRequest.type === "online" && (
                <div className="space-y-2">
                  <Label htmlFor="suggest-meeting-link">Meeting Link *</Label>
                  <Input
                    id="suggest-meeting-link"
                    type="url"
                    value={suggestTimeData.meetingLink}
                    onChange={(e) => setSuggestTimeData({ ...suggestTimeData, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx or https://zoom.us/j/xxxxx"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide a link to join the online meeting (Google Meet, Zoom, Teams, etc.)
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setSuggestTimeOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmSuggestedTime} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Suggest Time
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Decline Meeting Confirmation Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Decline Meeting Request</DialogTitle>
          </DialogHeader>
          {meetingToDecline && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-foreground">
                Are you sure you want to decline <span className="font-semibold">{meetingToDecline.studentName}'s</span> meeting request? 
                This action cannot be undone and the request will be removed.
              </p>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => {
                  setDeclineDialogOpen(false)
                  setMeetingToDecline(null)
                }}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleDeclineMeeting(meetingToDecline.id, meetingToDecline.studentName)}
                >
                  Decline Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function JoinMeetingForm({
  onJoin,
  upcomingMeetings,
}: {
  onJoin: (meetingLink: string) => void
  upcomingMeetings: Meeting[]
}) {
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null)
  
  // Filter meetings that have meeting links
  const meetingsWithLinks = upcomingMeetings.filter(m => m.meetingLink)

  return (
    <div className="space-y-4 mt-4">
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Join Active Meeting</h4>
        <p className="text-sm text-green-700 dark:text-green-300">Select a meeting to join.</p>
      </div>

      {meetingsWithLinks.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No upcoming meetings with links available.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="meeting-select">Select Meeting</Label>
          <Select value={selectedMeeting?.id || ""} onValueChange={(value) => {
            const meeting = meetingsWithLinks.find(m => m.id === value)
            setSelectedMeeting(meeting || null)
          }}>
            <SelectTrigger id="meeting-select">
              <SelectValue placeholder="Choose a meeting" />
            </SelectTrigger>
            <SelectContent>
              {meetingsWithLinks.map((meeting) => (
                <SelectItem key={meeting.id} value={meeting.id}>
                  {meeting.student} - {meeting.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedMeeting && (
            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">{selectedMeeting.title}</p>
              <p className="text-xs text-muted-foreground">
                {selectedMeeting.student} • {selectedMeeting.date} at {selectedMeeting.time}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button
          type="button"
          className="bg-green-600 text-white hover:bg-green-700"
          onClick={() => selectedMeeting && selectedMeeting.meetingLink && onJoin(selectedMeeting.meetingLink)}
          disabled={!selectedMeeting || !selectedMeeting.meetingLink}
        >
          <VideoIcon className="mr-2 h-4 w-4" />
          Join Meeting
        </Button>
      </div>
    </div>
  )
}


function ScheduleMeetingForm({
  onSchedule,
  upcomingMeetings,
  students,
}: {
  onSchedule: () => void
  upcomingMeetings: Meeting[]
  students: Array<{ id: string; name: string; avatar: string }>
}) {
  const [selectedStudent, setSelectedStudent] = useState("")
  const [meetingType, setMeetingType] = useState("online")
  const [meetingLink, setMeetingLink] = useState("")
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [duration, setDuration] = useState("60")
  const [location, setLocation] = useState("")
  const [agenda, setAgenda] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedStudent || !title || !date || !time || !duration || !agenda) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Validate meeting type specific fields
    if (meetingType === "in-person" && !location) {
      toast({
        title: "Validation Error",
        description: "Please provide a location for in-person meetings",
        variant: "destructive",
      })
      return
    }

    if (meetingType === "online" && !meetingLink) {
      toast({
        title: "Validation Error",
        description: "Please provide a meeting link for online meetings",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await meetingsAPI.create({
        student_id: parseInt(selectedStudent),
        title,
        date,
        time,
        duration: parseInt(duration),
        type: meetingType,
        location: meetingType === "in-person" ? location : undefined,
        meeting_link: meetingType === "online" ? meetingLink : undefined,
        agenda,
      })

      // Reset form
      setSelectedStudent("")
      setTitle("")
      setDate("")
      setTime("")
      setDuration("60")
      setMeetingType("online")
      setLocation("")
      setMeetingLink("")
      setAgenda("")

      toast({
        title: "Meeting Scheduled",
        description: "The meeting has been scheduled successfully. The student will be notified.",
      })

      // Refresh meetings list and close dialog
      if (onSchedule) {
        onSchedule()
      }
    } catch (error: any) {
      console.error('Error scheduling meeting:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to schedule meeting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className="space-y-4 mt-4"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="student-select-schedule">Select Student *</Label>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger id="student-select-schedule">
            <SelectValue placeholder="Choose a student" />
          </SelectTrigger>
          <SelectContent>
            {students.length > 0 ? (
              students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No students available</div>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meeting-title">Meeting Title *</Label>
        <Input 
          id="meeting-title" 
          placeholder="e.g., Progress Review" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="meeting-date">Date *</Label>
          <Input 
            id="meeting-date" 
            type="date" 
            min={new Date().toISOString().split('T')[0]}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meeting-time">Time *</Label>
          <Input 
            id="meeting-time" 
            type="time" 
            min="08:00"
            max="17:00"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required 
          />
          <p className="text-xs text-muted-foreground">Available: 8:00 AM - 5:00 PM</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meeting-duration">Duration *</Label>
        <Select value={duration} onValueChange={setDuration}>
          <SelectTrigger id="meeting-duration">
            <SelectValue placeholder="Select duration" />
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
        <Label htmlFor="meeting-type-schedule">Meeting Type</Label>
        <Select value={meetingType} onValueChange={setMeetingType}>
          <SelectTrigger id="meeting-type-schedule">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in-person">In-Person</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {meetingType === "in-person" && (
        <div className="space-y-2">
          <Label htmlFor="meeting-location">Location *</Label>
          <Input 
            id="meeting-location" 
            placeholder="e.g., Room 3.14" 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
      )}

      {meetingType === "online" && (
        <div className="space-y-2">
          <Label htmlFor="meeting-link-schedule">Meeting Link *</Label>
          <Input
            id="meeting-link-schedule"
            type="url"
            placeholder="https://meet.google.com/xxx-xxxx-xxx or https://zoom.us/j/xxxxx"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Provide a link to join the online meeting (Google Meet, Zoom, Teams, etc.)
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="meeting-agenda">Agenda / Purpose *</Label>
        <Textarea 
          id="meeting-agenda" 
          placeholder="What would you like to discuss?" 
          rows={4} 
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          required 
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={!selectedStudent || isSubmitting}
        >
          {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
        </Button>
      </div>
    </form>
  )
}

function SupervisorMeetingCard({
  meeting,
  onViewDetails,
  onReschedule,
  onComplete,
}: {
  meeting: Meeting
  onViewDetails: (meeting: Meeting) => void
  onReschedule: (meeting: Meeting) => void
  onComplete: (meetingId: string, studentName: string) => void
}) {
  return (
    <Card className="p-5 border-l-4 border-l-accent">
      <div className="flex items-start gap-4 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={getUploadUrl(meeting.avatar)} alt={meeting.student} />
          <AvatarFallback>
            {meeting.student
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground">{meeting.student}</h4>
            <Badge className="bg-green-500/10 text-green-700 dark:text-green-400" variant="secondary">
              Confirmed
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{meeting.title}</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>{meeting.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              <span>{meeting.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4" />
              <span>{meeting.location}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-muted/50 rounded-lg p-3 mb-3">
        <p className="text-sm text-foreground">
          <span className="font-medium">Agenda:</span> {meeting.agenda}
        </p>
      </div>
      <div className="flex gap-2">
        {meeting.meetingLink && (
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 bg-green-600 text-white hover:bg-green-700"
            onClick={() => window.open(meeting.meetingLink, "_blank")}
          >
            <VideoIcon className="mr-2 h-4 w-4" />
            Join Meeting
          </Button>
        )}
        <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => onViewDetails(meeting)}>
          View Details
        </Button>
        <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => onReschedule(meeting)}>
          Reschedule
        </Button>
        <Button variant="outline" size="sm" onClick={() => onComplete(meeting.id, meeting.student)}>
          <CheckIcon className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

function MeetingRequestCard({
  request,
  onApprove,
  onSuggestTime,
  onDecline,
}: {
  request: MeetingRequest
  onApprove: (request: MeetingRequest) => void
  onSuggestTime: (request: MeetingRequest) => void
  onDecline: (requestId: string, studentName: string) => void
}) {
  return (
    <Card className="p-5 border-l-4 border-l-yellow-500">
      <div className="flex items-start gap-4 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={getUploadUrl(request.avatar)} alt={request.student} />
          <AvatarFallback>
            {request.student
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground">{request.student}</h4>
            <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" variant="secondary">
              Pending
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{request.title}</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>Requested: {request.requestedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              <span>
                {request.requestedTime} ({request.duration})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4" />
              <span>{request.location || (request.type === 'online' ? 'Online' : 'TBA')}</span>
            </div>
            {request.type === 'online' && (
              <div className="flex items-center gap-2">
                <VideoIcon className="h-4 w-4" />
                <span className="capitalize">{request.type} Meeting</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-muted/50 rounded-lg p-3 mb-3">
        <p className="text-sm text-foreground">
          <span className="font-medium">Reason:</span> {request.reason}
        </p>
        {request.meetingLink && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Meeting Link:</p>
            <a 
              href={request.meetingLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
            >
              {request.meetingLink}
            </a>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() => onApprove(request)}
        >
          <CheckIcon className="mr-1 h-4 w-4" />
          Approve
        </Button>
        <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => onSuggestTime(request)}>
          Suggest Time
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDecline(request.id, request.student)}
        >
          <XIcon className="mr-1 h-4 w-4" />
          Decline
        </Button>
      </div>
    </Card>
  )
}

function PastSupervisorMeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <Card className="p-5 opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex items-start gap-4 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={getUploadUrl(meeting.avatar)} alt={meeting.student} />
          <AvatarFallback>
            {meeting.student
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-1">{meeting.student}</h4>
          <p className="text-sm text-muted-foreground mb-2">{meeting.title}</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>{meeting.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              <span>{meeting.time}</span>
            </div>
          </div>
        </div>
        <CheckCircleIcon className="text-green-500" />
      </div>
      <div className="bg-muted/50 rounded-lg p-3 mb-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Notes:</span> {meeting.agenda}
        </p>
      </div>
    </Card>
  )
}

function ScheduleItem({ time, student, type }: { time: string; student: string; type: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
      <div className="text-sm font-semibold text-accent">{time}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{student}</p>
        <p className="text-xs text-muted-foreground">{type}</p>
      </div>
    </div>
  )
}

function VideoIcon({ className }: { className?: string }) {
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
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
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
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
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

function CalendarIcon({ className }: { className?: string }) {
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
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function MapPinIcon({ className }: { className?: string }) {
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
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
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

function CheckIcon({ className }: { className?: string }) {
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
