"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { supervisorsAPI, studentsAPI, messagesAPI, progressAPI, documentsAPI, getUploadUrl } from "@/lib/api"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useUser } from "@/lib/user-context"
import { useNotifications } from "@/lib/notifications-context"

export default function SupervisorStudentsPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [students, setStudents] = useState<any[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [addStudentMode, setAddStudentMode] = useState<"existing" | "new">("existing")
  const [newStudent, setNewStudent] = useState({
    email: "",
    phone: "",
  })
  const [newStudentAccount, setNewStudentAccount] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    program: "",
  })
  // Use notifications context instead of local state
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, clearAll } = useNotifications()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<(typeof students)[0] | null>(null)
  const [messageContent, setMessageContent] = useState("")
  const [messages, setMessages] = useState<Array<{ type: string; text: string; time: string }>>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({})
  const [isRemovingStudent, setIsRemovingStudent] = useState(false)
  const [studentToRemove, setStudentToRemove] = useState<number | null>(null)
  const [meetingDetails, setMeetingDetails] = useState({
    title: "",
    date: "",
    time: "",
    duration: "",
    location: "",
    agenda: "",
  })

  const { toast } = useToast()

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
          // Find student by name
          const student = students.find((s: any) => 
            (s.name || '').toLowerCase() === studentName.toLowerCase()
          )
          if (student && student.id) {
            router.push(`/supervisor/students/${student.id}`)
            setIsNotificationsOpen(false)
            return
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
    const unreadNotifs = notifications.filter((n: any) => n.unread).length
    markAllAsRead()
    toast({
      title: "All Notifications Marked as Read",
      description: `${unreadNotifs} notifications marked as read.`,
    })
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.program.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === "all" || student.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // Fetch students from API (only supervisor's students)
  const fetchStudents = async () => {
    if (userLoading || !user?.id) return

    setIsLoadingStudents(true)
    try {
      // The API automatically filters by supervisor when user role is supervisor
      const response = await studentsAPI.getAll()
      const studentsList = response.students || []
      
      // Calculate live progress for each student
      const transformedStudents = await Promise.all(studentsList.map(async (student: any) => {
        let calculatedProgress = 0
        let studentStatus: string | null = null
        
        try {
          // Fetch weekly tasks for this student
          let weeklyTasks: any[] = []
          try {
            const tasksResponse = await progressAPI.getWeeklyTasks(student.id)
            weeklyTasks = tasksResponse.tasks || []
          } catch (error: any) {
            console.log(`No weekly tasks found for student ${student.id}:`, error.message)
            weeklyTasks = []
          }
          
          // Fetch weekly submissions
          let submissions: any[] = []
          try {
            const submissionsResponse = await progressAPI.getWeeklySubmissions(student.id)
            submissions = submissionsResponse.submissions || []
          } catch (error: any) {
            console.log(`No weekly submissions found for student ${student.id}:`, error.message)
            submissions = []
          }
          
          // Fetch documents to verify they still exist
          let existingDocuments: any[] = []
          try {
            const docsResponse = await documentsAPI.getAll({ 
              student_id: student.id,
              type: 'submission'
            })
            existingDocuments = docsResponse.documents || []
          } catch (error: any) {
            console.log(`Error fetching documents for student ${student.id}:`, error.message)
            existingDocuments = []
          }
          
          // Create a map of week_number to document existence
          const documentsByWeek = new Map<number, boolean>()
          existingDocuments.forEach((doc: any) => {
            if (doc.week_number) {
              documentsByWeek.set(doc.week_number, true)
            }
          })
          
          // Filter submissions: only count those with status 'submitted' AND document still exists
          const validSubmissions = submissions.filter((sub: any) => {
            const hasStatus = sub.status === 'submitted'
            const hasDocument = documentsByWeek.has(sub.week_number)
            return hasStatus && hasDocument
          })
          
          // Calculate progress based on weekly tasks from database
          const taskCount = weeklyTasks.length > 0 ? Math.max(...weeklyTasks.map((t: any) => t.week_number)) : 0
          const TOTAL_WEEKS = taskCount || 1 // Avoid division by zero
          const submittedWeeks = validSubmissions.length
          calculatedProgress = TOTAL_WEEKS > 0 ? Math.round((submittedWeeks / TOTAL_WEEKS) * 100) : 0
          
          // Only set status if weekly tasks exist
          if (weeklyTasks.length > 0) {
            const currentDate = new Date()
            currentDate.setHours(0, 0, 0, 0)
            
            // Check if any task has a due date that has passed and is not submitted
            const hasOverdueTask = weeklyTasks.some((task: any) => {
              if (!task.due_date) return false // Skip tasks without due dates
              
              const dueDate = new Date(task.due_date)
              dueDate.setHours(0, 0, 0, 0)
              
              // Check if due date has passed
              if (currentDate > dueDate) {
                // Check if this task is not submitted
                const isSubmitted = validSubmissions.some((sub: any) => sub.week_number === task.week_number)
                return !isSubmitted
              }
              return false
            })
            
            studentStatus = hasOverdueTask ? "needs-attention" : "on-track"
          }
          // If no weekly tasks, studentStatus remains null (no badge will be shown)
        } catch (error: any) {
          console.error(`Error calculating progress for student ${student.id}:`, error)
          // Fallback to database value if calculation fails
          calculatedProgress = student.progress || 0
          studentStatus = null
        }
        
        return {
          id: student.id,
          user_id: student.user_id, // Store user_id for messaging
          name: student.name,
          program: student.program || "N/A",
          progress: calculatedProgress, // Use calculated progress from live data
          status: studentStatus, // null if no weekly tasks, otherwise "on-track" or "needs-attention"
          lastMeeting: "Not scheduled", // TODO: Fetch from meetings API
          nextMilestone: "Project Initiation", // TODO: Fetch from milestones API
          avatar: student.avatar || `/placeholder.svg?key=st${String(student.id).padStart(2, "0")}`,
          email: student.email,
          phone: student.phone || "+60 12-345 6789",
          startDate: student.start_date ? new Date(student.start_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A",
          expectedCompletion: student.expected_completion ? new Date(student.expected_completion).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A",
          weeklyProgress: [],
          milestones: [],
        }
      }))
      
      // Set only real students from database (no dummy data)
      setStudents(transformedStudents)
    } catch (error: any) {
      console.error('Error fetching students:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load students. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingStudents(false)
    }
  }

  useEffect(() => {
    if (!userLoading && user?.id) {
      fetchStudents()
      fetchUnreadCounts()
    }
  }, [user?.id, userLoading])

  // Poll for unread messages every 5 seconds
  useEffect(() => {
    if (!user?.user_id) return

    const interval = setInterval(() => {
      fetchUnreadCounts()
    }, 5000)

    return () => clearInterval(interval)
  }, [user?.user_id])

  const handleAddStudent = async () => {
    if (addStudentMode === "existing") {
      // Add existing student
      if (!newStudent.email && !newStudent.phone) {
        toast({
          title: "Validation Error",
          description: "Please enter either email or phone number",
          variant: "destructive",
        })
        return
      }

      try {
        setIsAddingStudent(true)

        const response = await supervisorsAPI.addStudent({
          email: newStudent.email || undefined,
          phone: newStudent.phone || undefined,
        })

        toast({
          title: "Student Added Successfully",
          description: `${response.student.name} has been added to your supervision list.`,
        })

        // Reset form
        setNewStudent({
          email: "",
          phone: "",
        })
        setIsAddDialogOpen(false)

        // Refresh students list
        await fetchStudents()
      } catch (error: any) {
        // Prevent error from bubbling up to Next.js error boundary
        const errorMessage = error.message || "Failed to add student. Please try again."
        
        // Handle specific error cases with user-friendly messages
        if (errorMessage.includes("already under your supervision")) {
          toast({
            title: "Student Already Added",
            description: "This student is already under your supervision.",
            variant: "default",
          })
        } else if (errorMessage.includes("not found") || errorMessage.includes("not registered")) {
          toast({
            title: "Student Not Found",
            description: "The student is not registered in the system. Please use 'Create New Student' to register them first.",
            variant: "destructive",
          })
        } else if (errorMessage.includes("capacity")) {
          toast({
            title: "Capacity Reached",
            description: errorMessage,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error Adding Student",
            description: errorMessage,
            variant: "destructive",
          })
        }
      } finally {
        setIsAddingStudent(false)
      }
    } else {
      // Create new student account
      if (!newStudentAccount.name || !newStudentAccount.email || !newStudentAccount.password) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Name, Email, Password)",
          variant: "destructive",
        })
        return
      }

      if (newStudentAccount.password.length < 6) {
        toast({
          title: "Validation Error",
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        })
        return
      }

      if (newStudentAccount.password !== newStudentAccount.confirmPassword) {
        toast({
          title: "Validation Error",
          description: "Passwords do not match",
          variant: "destructive",
        })
        return
      }

      try {
        setIsAddingStudent(true)

        const response = await supervisorsAPI.createStudent({
          name: newStudentAccount.name,
          email: newStudentAccount.email,
          password: newStudentAccount.password,
          phone: newStudentAccount.phone || undefined,
          program: newStudentAccount.program || undefined,
        })

        toast({
          title: "Student Account Created",
          description: `${response.student.name} has been created. A verification email has been sent to ${response.student.email}. The student must verify their email before logging in.`,
          duration: 6000,
        })

        // Reset form
        setNewStudentAccount({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: "",
          program: "",
        })
        setIsAddDialogOpen(false)

        // Refresh students list
        await fetchStudents()
      } catch (error: any) {
        const errorMessage = error.message || "Failed to create student account. Please try again."
        
        if (errorMessage.includes("already under your supervision")) {
          toast({
            title: "Student Already Added",
            description: "This student is already under your supervision.",
            variant: "default",
          })
        } else if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
          toast({
            title: "Account Exists",
            description: "A student with this email already exists in the system.",
            variant: "default",
          })
        } else {
          console.error('Error creating student:', error)
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
        }
      } finally {
        setIsAddingStudent(false)
      }
    }
  }

  const calculateExpectedCompletion = (startDate: string, program: string) => {
    const isPHD = program.toLowerCase().includes("phd")
    const duration = isPHD ? 4 : 2
    const start = new Date(startDate)
    start.setFullYear(start.getFullYear() + duration)
    return start.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  }

  const handleRemoveStudent = async (studentId: number) => {
    try {
      setIsRemovingStudent(true)
      await supervisorsAPI.removeStudent(studentId)
      
      toast({
        title: "Student Removed",
        description: "Student has been removed from your supervision successfully.",
      })
      
      // Refresh students list
      await fetchStudents()
      setStudentToRemove(null)
    } catch (error: any) {
      console.error("Error removing student:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove student. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRemovingStudent(false)
    }
  }

  const handleViewProgress = (student: (typeof students)[0]) => {
    window.location.href = `/supervisor/students/${student.id}`
  }

  // Send warning notification to student
  const handleSendWarning = async (student: any) => {
    if (!student.user_id) {
      toast({
        title: "Error",
        description: "Cannot send warning: Student information is incomplete.",
        variant: "destructive",
      })
      return
    }

    if (!student.status || student.status !== "needs-attention") {
      toast({
        title: "No Warning Needed",
        description: `Student "${student.name}" is currently on track. Warnings are only sent to students who need attention.`,
      })
      return
    }

    try {
      await notificationsAPI.create({
        user_id: student.user_id,
        title: "Progress Warning",
        message: "Warning: Your progress is behind schedule. Please review your timeline and catch up with your submissions. Contact your supervisor if you need assistance.",
        type: "warning",
        icon: "⚠️",
        link: "/student/progress"
      })

      toast({
        title: "Warning Sent",
        description: `Warning notification has been sent to ${student.name}`,
      })
    } catch (error: any) {
      console.error('Error sending warning:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send warning. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fetch messages with selected student
  const fetchMessages = async (studentUserId: number) => {
    if (!studentUserId || !user?.user_id) return

    try {
      const response = await messagesAPI.getConversation(studentUserId)
      const conversationMessages = response.messages || []
      
      // Transform messages to match the expected format
      const transformedMessages = conversationMessages.map((msg: any) => ({
        type: msg.sender_id === user.user_id ? "sent" : "received",
        text: msg.content,
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }))
      
      setMessages(transformedMessages)
      
      // Refresh unread counts after fetching messages (they get marked as read by backend)
      await fetchUnreadCounts()
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      setMessages([])
    }
  }

  // Fetch unread message counts for all students
  const fetchUnreadCounts = async () => {
    if (!user?.user_id) return

    try {
      // Get all messages to calculate unread counts per student
      const response = await messagesAPI.getAll()
      const allMessages = response.messages || []
      
      // Calculate unread counts per student (user_id)
      const counts: Record<number, number> = {}
      allMessages.forEach((msg: any) => {
        // If message is received (receiver is current user) and unread
        if (msg.receiver_id === user.user_id && !msg.is_read) {
          const senderId = msg.sender_id
          counts[senderId] = (counts[senderId] || 0) + 1
        }
      })
      
      setUnreadCounts(counts)
    } catch (error: any) {
      console.error('Error fetching unread counts:', error)
    }
  }

  // Handler for message dialog open/close
  const handleMessageDialogChange = async (open: boolean) => {
    setIsMessageDialogOpen(open)
    
    if (!open) {
      // Dialog closed - refresh unread counts to ensure badge updates
      await fetchUnreadCounts()
    }
  }

  const handleOpenMessageDialog = async (student: (typeof students)[0]) => {
    setSelectedStudent(student)
    setMessageContent("")
    setIsMessageDialogOpen(true)
    
    // Fetch conversation history when dialog opens
    if (student.user_id) {
      await fetchMessages(student.user_id)
    }
  }

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    if (!selectedStudent?.user_id) {
      toast({
        title: "Error",
        description: "Unable to send message. Student information is missing.",
        variant: "destructive",
      })
      return
    }

    try {
      await messagesAPI.send({
        receiver_id: selectedStudent.user_id,
        content: messageContent.trim(),
      })

      // Refresh messages to show the new one
      await fetchMessages(selectedStudent.user_id)
      
      // Refresh unread counts
      await fetchUnreadCounts()

      setMessageContent("")

      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${selectedStudent.name}`,
      })
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleOpenScheduleDialog = (student: (typeof students)[0]) => {
    setSelectedStudent(student)
    setMeetingDetails({
      title: "",
      date: "",
      time: "",
      duration: "",
      location: "",
      agenda: "",
    })
    setIsScheduleDialogOpen(true)
  }

  const handleScheduleMeeting = () => {
    if (!meetingDetails.title || !meetingDetails.date || !meetingDetails.time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Title, Date, Time)",
        variant: "destructive",
      })
      return
    }

    // Validate date is valid and not in the past
    const selectedDate = new Date(meetingDetails.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)

    if (isNaN(selectedDate.getTime())) {
      toast({
        title: "Invalid Date",
        description: "Please enter a valid date",
        variant: "destructive",
      })
      return
    }

    if (selectedDate < today) {
      toast({
        title: "Invalid Date",
        description: "Meeting date cannot be in the past. Please select today or a future date.",
        variant: "destructive",
      })
      return
    }

    // Validate time is between 8:00 AM and 5:00 PM
    const [hours, minutes] = meetingDetails.time.split(':')
    const hour = parseInt(hours)
    const minute = parseInt(minutes)
    const totalMinutes = hour * 60 + minute

    // 8:00 AM = 480 minutes, 5:00 PM = 1020 minutes
    if (totalMinutes < 480 || totalMinutes >= 1020) {
      toast({
        title: "Invalid Time",
        description: "Meetings can only be scheduled between 8:00 AM and 5:00 PM.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Meeting Scheduled",
      description: `Meeting with ${selectedStudent?.name} has been scheduled for ${meetingDetails.date} at ${meetingDetails.time}`,
    })

    setMeetingDetails({
      title: "",
      date: "",
      time: "",
      duration: "",
      location: "",
      agenda: "",
    })
    setIsScheduleDialogOpen(false)
    setSelectedStudent(null)
  }

  return (
    <div className="min-h-screen bg-background">
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
              <Link href="/supervisor/students" className="text-sm font-medium px-4 py-2 rounded-lg text-foreground bg-muted/50 transition-smooth hover:bg-muted">
                Students
              </Link>
              <Link
                href="/supervisor/meetings"
                className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
              >
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
                        {notifications.map((notif: any) => (
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
                                  {notif.unread && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                                <p className="text-xs text-muted-foreground mb-2">{notif.timestamp}</p>
                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
                      <Button size="sm" variant="outline" className="flex-1" onClick={handleClearAll}>
                        Mark All as Read
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-destructive hover:text-destructive"
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

      {/* Main Content with Enhanced Background */}
      <main className="container mx-auto px-6 py-10 max-w-7xl relative">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        </div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">All Students</h2>
            <p className="text-muted-foreground">Manage and monitor all supervised students</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Student to Supervision</DialogTitle>
                <DialogDescription>
                  Add an existing student or create a new student account to add to your supervision.
                </DialogDescription>
              </DialogHeader>
              
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={addStudentMode === "existing" ? "default" : "outline"}
                  onClick={() => setAddStudentMode("existing")}
                  className="flex-1"
                >
                  Add Existing Student
                </Button>
                <Button
                  type="button"
                  variant={addStudentMode === "new" ? "default" : "outline"}
                  onClick={() => setAddStudentMode("new")}
                  className="flex-1"
                >
                  Create New Student
                </Button>
              </div>

              {addStudentMode === "existing" ? (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g., ahmad@utm.my"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value, phone: "" })}
                    />
                    <p className="text-xs text-muted-foreground">Enter either email or phone number</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="e.g., +60 12-345 6789"
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value, email: "" })}
                    />
                    <p className="text-xs text-muted-foreground">Enter either email or phone number</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-name">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="new-name"
                      type="text"
                      placeholder="e.g., Ahmad Ibrahim"
                      value={newStudentAccount.name}
                      onChange={(e) => setNewStudentAccount({ ...newStudentAccount, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="e.g., ahmad@utm.my"
                      value={newStudentAccount.email}
                      onChange={(e) => setNewStudentAccount({ ...newStudentAccount, email: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="new-password">
                        Password <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={newStudentAccount.password}
                        onChange={(e) => setNewStudentAccount({ ...newStudentAccount, password: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-confirm-password">
                        Confirm Password <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="new-confirm-password"
                        type="password"
                        placeholder="Confirm password"
                        value={newStudentAccount.confirmPassword}
                        onChange={(e) => setNewStudentAccount({ ...newStudentAccount, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-phone">Phone Number</Label>
                    <Input
                      id="new-phone"
                      type="tel"
                      placeholder="e.g., +60 12-345 6789"
                      value={newStudentAccount.phone}
                      onChange={(e) => setNewStudentAccount({ ...newStudentAccount, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-program">Program</Label>
                    <Select value={newStudentAccount.program} onValueChange={(value) => setNewStudentAccount({ ...newStudentAccount, program: value })}>
                      <SelectTrigger id="new-program">
                        <SelectValue placeholder="Select program (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Doctor of Philosophy (PhD) Field: Computer Science">
                          Doctor of Philosophy (PhD) Field: Computer Science
                        </SelectItem>
                        <SelectItem value="Doctor of Philosophy (PhD) Field: Software Engineering">
                          Doctor of Philosophy (PhD) Field: Software Engineering
                        </SelectItem>
                        <SelectItem value="Doctor of Philosophy (PhD) Field: Informatics Engineering">
                          Doctor of Philosophy (PhD) Field: Informatics Engineering
                        </SelectItem>
                        <SelectItem value="Master of Science (Field: Computer Science)">
                          Master of Science (Field: Computer Science)
                        </SelectItem>
                        <SelectItem value="Master by Research / Master of Philosophy (MPhil) (Field: Computer Science)">
                          Master by Research / Master of Philosophy (MPhil) (Field: Computer Science)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsAddDialogOpen(false)
                  setAddStudentMode("existing")
                  setNewStudent({ email: "", phone: "" })
                  setNewStudentAccount({ name: "", email: "", password: "", confirmPassword: "", phone: "", program: "" })
                }} disabled={isAddingStudent}>
                  Cancel
                </Button>
                <Button onClick={handleAddStudent} disabled={isAddingStudent}>
                  {isAddingStudent ? (addStudentMode === "existing" ? "Adding..." : "Creating...") : (addStudentMode === "existing" ? "Add Student" : "Create & Add Student")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <Input
                placeholder="Search by name or program..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All ({students.length})
              </Button>
              <Button
                variant={filterStatus === "on-track" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("on-track")}
              >
                On Track ({students.filter((s) => s.status === "on-track").length})
              </Button>
              <Button
                variant={filterStatus === "needs-attention" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("needs-attention")}
              >
                Needs Attention ({students.filter((s) => s.status === "needs-attention").length})
              </Button>
            </div>
          </div>
        </Card>

        {isLoadingStudents ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Loading students...</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map((student) => (
            <Card key={student.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={getUploadUrl(student.avatar)} alt={student.name} />
                  <AvatarFallback>
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-foreground">{student.name}</h3>
                    {student.status && (
                      <Badge
                        className={
                          student.status === "on-track"
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : "bg-red-500/10 text-red-700 dark:text-red-400"
                        }
                        variant="secondary"
                      >
                        {student.status === "on-track" ? "On Track" : "Needs Attention"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{student.program}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Last Meeting</p>
                      <p className="text-sm font-medium text-foreground">{student.lastMeeting}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Next Milestone</p>
                      <p className="text-sm font-medium text-foreground">{student.nextMilestone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground">{student.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Overall Progress</span>
                        <span className="text-sm font-semibold text-foreground">{student.progress}%</span>
                      </div>
                      <Progress value={student.progress} className="h-2" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={() => handleViewProgress(student)} size="sm">
                    View Progress
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenMessageDialog(student)} className="relative">
                    <MessageSquareIcon className="mr-2 h-4 w-4" />
                    Message
                    {unreadCounts[student.user_id] > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                        {unreadCounts[student.user_id] > 9 ? '9+' : unreadCounts[student.user_id]}
                      </span>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenScheduleDialog(student)}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => setStudentToRemove(student.id)}
                        disabled={isRemovingStudent}
                      >
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Student from Supervision</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {student.name} from your supervision? This action cannot be undone. The student will no longer appear in your student list.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setStudentToRemove(null)}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveStudent(student.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={isRemovingStudent}
                        >
                          {isRemovingStudent ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
            ))}
          </div>
        )}

        {!isLoadingStudents && filteredStudents.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              {students.length === 0 
                ? "You don't have any students yet. Click 'Add Student' to add students to your supervision."
                : "No students found matching your criteria"}
            </p>
          </Card>
        )}
      </main>

      <Dialog open={isMessageDialogOpen} onOpenChange={handleMessageDialogChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Message {selectedStudent?.name}</DialogTitle>
          </DialogHeader>
          <MessageDialog
            messages={messages}
            onSendMessage={handleSendMessage}
            messageText={messageContent}
            onMessageChange={setMessageContent}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Meeting with {selectedStudent?.name}</DialogTitle>
            <DialogDescription>Schedule a supervision meeting with your student</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="meeting-title">
                Meeting Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="meeting-title"
                placeholder="e.g., Progress Review Meeting"
                value={meetingDetails.title}
                onChange={(e) => setMeetingDetails({ ...meetingDetails, title: e.target.value })}
              />
            </div>
              <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="meeting-date">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="meeting-date"
                  type="date"
                  value={meetingDetails.date}
                  onChange={(e) => setMeetingDetails({ ...meetingDetails, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="meeting-time">
                  Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="meeting-time"
                  type="time"
                  value={meetingDetails.time}
                  onChange={(e) => setMeetingDetails({ ...meetingDetails, time: e.target.value })}
                  min="08:00"
                  max="17:00"
                />
                <p className="text-xs text-muted-foreground">Available: 8:00 AM - 5:00 PM</p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meeting-duration">Duration</Label>
              <Select
                value={meetingDetails.duration}
                onValueChange={(value) => setMeetingDetails({ ...meetingDetails, duration: value })}
              >
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
            <div className="grid gap-2">
              <Label htmlFor="meeting-location">Location</Label>
              <Input
                id="meeting-location"
                placeholder="e.g., Room 3.14 or Google Meet"
                value={meetingDetails.location}
                onChange={(e) => setMeetingDetails({ ...meetingDetails, location: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meeting-agenda">Agenda</Label>
              <Textarea
                id="meeting-agenda"
                placeholder="Meeting agenda and topics to discuss..."
                value={meetingDetails.agenda}
                onChange={(e) => setMeetingDetails({ ...meetingDetails, agenda: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleMeeting}>Schedule Meeting</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BellIcon({ className }: { className?: string }) {
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
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

function AlertTriangleIcon({ className }: { className?: string }) {
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
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
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
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
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

function PlusIcon({ className }: { className?: string }) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
