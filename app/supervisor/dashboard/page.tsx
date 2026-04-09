"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useNotifications } from "@/lib/notifications-context"
import { useUser } from "@/lib/user-context"
import { studentsAPI, meetingsAPI, documentsAPI, messagesAPI, progressAPI, supervisorsAPI, logbookAPI, announcementsAPI, notificationsAPI, getUploadUrl } from "@/lib/api"
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
import { Chatbot } from "@/components/chatbot"
import { Loader2 } from "lucide-react"

// Removed hardcoded students - using live API data only

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
  documentId?: number // Actual document ID from backend for deletion
}

export default function SupervisorDashboard() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [addStudentMode, setAddStudentMode] = useState<"existing" | "new">("existing")
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false)
  const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false)
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false)
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isViewAllReviewsOpen, setIsViewAllReviewsOpen] = useState(false)
  const [selectedReportStudent, setSelectedReportStudent] = useState("")
  const [announcementMessage, setAnnouncementMessage] = useState("")
  const [announcementTitle, setAnnouncementTitle] = useState("")
  const [selectedField, setSelectedField] = useState("")
  const [availableFields, setAvailableFields] = useState<Array<{ field: string; studentCount: number }>>([])
  const [isLoadingFields, setIsLoadingFields] = useState(false)
  // Use notifications context
  const { notifications, unreadCount, markAsRead, deleteNotification, clearAll } = useNotifications()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  
  // Real-time data states
  const [realStudents, setRealStudents] = useState<any[]>([])
  const [realMeetings, setRealMeetings] = useState<any[]>([])
  const [realDocuments, setRealDocuments] = useState<any[]>([])
  const [pendingReviews, setPendingReviews] = useState<any[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [pendingMeetings, setPendingMeetings] = useState(0)
  const [documentsShared, setDocumentsShared] = useState(0)
  const [avgProgress, setAvgProgress] = useState(0)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [logbooks, setLogbooks] = useState<Record<number, any>>({})
  const [logbookHistory, setLogbookHistory] = useState<Record<number, any[]>>({})
  const [showLogbookHistory, setShowLogbookHistory] = useState<Record<number, boolean>>({})
  const [selectedLogbookStudent, setSelectedLogbookStudent] = useState<number | null>(null)
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

  const [documents, setDocuments] = useState<Document[]>([])
  const [isUploadingDocument, setIsUploadingDocument] = useState(false)

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
  const [meetingData, setMeetingData] = useState({
    student: "",
    title: "",
    date: "",
    time: "",
    duration: "60",
    type: "online",
    location: "",
    meeting_link: "",
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
    week: "general",
    description: "",
  })
  const [currentUploadFile, setCurrentUploadFile] = useState<File | null>(null)
  const [weeklyTasksForDocument, setWeeklyTasksForDocument] = useState<Record<string, any[]>>({})
  const [isLoadingWeeklyTasks, setIsLoadingWeeklyTasks] = useState(false)

  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [selectedStudentForMessage, setSelectedStudentForMessage] = useState<number | null>(null)
  const [messageContent, setMessageContent] = useState("")
  const [messages, setMessages] = useState<Array<{ type: string; text: string; time: string }>>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({})

  const { toast } = useToast()

  // Fetch real-time data
  const fetchDashboardData = useCallback(async (isInitialLoad = false) => {
    if (userLoading || !user?.id) return

    try {
      // Only show loading state on initial load, not on background refreshes
      if (isInitialLoad) {
        setIsLoadingData(true)
      }
      
      // Fetch students (automatically filtered by supervisor)
      const studentsResponse = await studentsAPI.getAll()
      const students = studentsResponse.students || []
      
      // Calculate live progress for each student
      const transformedStudents = await Promise.all(students.map(async (student: any) => {
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
            
            studentStatus = hasOverdueTask ? 'needs-attention' : 'on-track'
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
          user_id: student.user_id,
          name: student.name || 'Unknown Student',
          program: student.program || 'N/A',
          progress: calculatedProgress, // Use calculated progress from live data
          status: studentStatus, // null if no weekly tasks, otherwise 'on-track' or 'needs-attention'
          lastMeeting: 'Not scheduled', // TODO: Fetch from meetings API
          nextMilestone: 'Project Initiation', // TODO: Fetch from milestones API
          avatar: student.avatar || `/placeholder.svg?key=st${String(student.id).padStart(2, '0')}`,
          email: student.email,
          phone: student.phone,
          startDate: student.start_date ? new Date(student.start_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : 'N/A',
          expectedCompletion: student.expected_completion ? new Date(student.expected_completion).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : 'N/A',
        }
      }))
      
      // Set only real students from database (no dummy data)
      setRealStudents(transformedStudents)
      setTotalStudents(transformedStudents.length)
      
      // Calculate average progress
      if (transformedStudents.length > 0) {
        const totalProgress = transformedStudents.reduce((sum: number, s: any) => sum + (s.progress || 0), 0)
        const average = Math.round(totalProgress / transformedStudents.length)
        setAvgProgress(average)
      } else {
        setAvgProgress(0)
      }
      
      // Fetch meetings
      const meetingsResponse = await meetingsAPI.getAll()
      const allMeetings = meetingsResponse.meetings || []
      setRealMeetings(allMeetings)
      
      // Count pending meetings
      const pending = allMeetings.filter((m: any) => m.status === 'pending').length
      setPendingMeetings(pending)
      
      // Transform meetings for display
      const transformedMeetings = allMeetings
        .filter((m: any) => {
          const meetingDate = new Date(m.date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          meetingDate.setHours(0, 0, 0, 0)
          return (m.status === 'pending' || m.status === 'approved' || m.status === 'confirmed') && meetingDate >= today
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.date + ' ' + a.time)
          const dateB = new Date(b.date + ' ' + b.time)
          return dateA.getTime() - dateB.getTime()
        })
        .slice(0, 3)
        .map((m: any) => ({
          id: m.id.toString(),
          studentId: m.student_id,
          studentName: m.student_name || 'Student',
          date: m.date,
          time: m.time,
          duration: m.duration?.toString() || '60',
          type: m.type || 'online',
          topic: m.title,
          location: m.location || 'Webex',
          status: m.status,
        }))
      setMeetings(transformedMeetings)
      
      // Fetch documents - get all documents (not just resources) to count all supervisor uploads
      const docsResponse = await documentsAPI.getAll()
      const allDocs = docsResponse.documents || []
      // Filter documents uploaded by supervisor (can have student_id if uploaded for specific student)
      // Include both resources and documents uploaded by supervisor
      const supervisorDocs = allDocs.filter((doc: any) => 
        doc.supervisor_id && (doc.type === 'resource' || doc.type === 'document')
      )
      setRealDocuments(supervisorDocs)
      setDocumentsShared(supervisorDocs.length)
      
      // Transform documents for display
      const transformedDocs = supervisorDocs.slice(0, 3).map((doc: any) => ({
        id: doc.id.toString(),
        studentId: doc.student_id || 0,
        title: doc.title || doc.file_name,
        type: doc.file_type?.split('/')[1]?.toUpperCase() || 'FILE',
        uploadedDate: doc.created_at ? new Date(doc.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        size: doc.file_size ? `${(doc.file_size / (1024 * 1024)).toFixed(1)} MB` : 'N/A',
      }))
      setDocuments(transformedDocs)
      
      // Fetch pending reviews - documents submitted by students that need review
      const studentIds = students.map((s: any) => s.id)
      const pendingReviewDocs = allDocs.filter((doc: any) => 
        doc.student_id && 
        studentIds.includes(doc.student_id) &&
        (doc.status === 'submitted' || doc.status === 'pending_review') &&
        doc.type === 'submission'
      )
      
      // Create a map of student IDs to student names
      const studentMap = new Map()
      students.forEach((s: any) => {
        studentMap.set(s.id, {
          name: s.name || 'Student',
          program: s.program || 'N/A'
        })
      })
      
      // Transform pending reviews with student info
      const transformedReviews = pendingReviewDocs
        .sort((a: any, b: any) => {
          const dateA = new Date(a.created_at)
          const dateB = new Date(b.created_at)
          return dateB.getTime() - dateA.getTime() // Most recent first
        })
        .map((doc: any) => {
          const studentInfo = studentMap.get(doc.student_id) || { name: 'Unknown Student', program: 'N/A' }
          const submittedDate = new Date(doc.created_at)
          const now = new Date()
          const diffMs = now.getTime() - submittedDate.getTime()
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
          const diffDays = Math.floor(diffHours / 24)
          
          let submittedAgo = ''
          if (diffHours < 1) {
            submittedAgo = 'just now'
          } else if (diffHours < 24) {
            submittedAgo = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
          } else if (diffDays === 1) {
            submittedAgo = '1 day ago'
          } else if (diffDays < 7) {
            submittedAgo = `${diffDays} days ago`
          } else {
            const weeks = Math.floor(diffDays / 7)
            submittedAgo = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
          }
          
          // Determine priority: high if < 1 day, medium if < 3 days, low if >= 3 days
          let priority = 'low'
          if (diffHours < 24) {
            priority = 'high'
          } else if (diffDays < 3) {
            priority = 'medium'
          }
          
          // Format document title - include week number if available
          let documentTitle = doc.title || doc.file_name
          if (doc.week_number && doc.type === 'submission') {
            // If title doesn't already include week number, add it
            if (!documentTitle.toLowerCase().includes('week')) {
              documentTitle = `Week ${doc.week_number} Submission: ${documentTitle}`
            }
          }
          
          return {
            id: doc.id,
            studentId: doc.student_id,
            studentName: studentInfo.name,
            studentProgram: studentInfo.program,
            documentTitle,
            submittedAgo,
            priority,
            description: doc.description || '',
            createdAt: doc.created_at,
            weekNumber: doc.week_number || null
          }
        })
      
      setPendingReviews(transformedReviews)
      
      // Fetch logbooks for all students
      const logbooksMap: Record<number, any> = {}
      const logbookHistoryMap: Record<number, any[]> = {}
      for (const student of students) {
        try {
          const logbookResponse = await logbookAPI.get(student.id)
          if (logbookResponse.logbook) {
            logbooksMap[student.id] = logbookResponse.logbook
          }
          const historyResponse = await logbookAPI.getHistory(student.id)
          if (historyResponse.history) {
            logbookHistoryMap[student.id] = historyResponse.history
          }
        } catch (error: any) {
          // Logbook doesn't exist yet, that's okay
          console.log(`No logbook found for student ${student.id}`)
        }
      }
      setLogbooks(logbooksMap)
      setLogbookHistory(logbookHistoryMap)
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      // Only show error toast on initial load to avoid spam
      if (isInitialLoad) {
        toast({
          title: "Error",
          description: error.message || "Failed to load dashboard data. Please refresh the page.",
          variant: "destructive",
        })
      }
    } finally {
      // Only update loading state on initial load
      if (isInitialLoad) {
        setIsLoadingData(false)
      }
    }
  }, [user?.id, userLoading, toast])

  useEffect(() => {
    if (!userLoading && user?.id) {
      // Initial load with loading state - only fetch on mount/reload
      fetchDashboardData(true)
    }
  }, [user?.id, userLoading, fetchDashboardData])

  // Fetch unread message counts for all students
  const fetchUnreadCounts = useCallback(async () => {
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
  }, [user?.user_id])

  // Fetch unread counts on mount only
  useEffect(() => {
    if (!user?.user_id) return

    fetchUnreadCounts()
  }, [user?.user_id, fetchUnreadCounts])

  // Refresh when pathname changes back to dashboard (user navigates back)
  useEffect(() => {
    if (pathname === '/supervisor/dashboard' && !userLoading && user?.id) {
      // Small delay to ensure navigation is complete
      const timeout = setTimeout(() => {
        fetchDashboardData(false)
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [pathname, user?.id, userLoading, fetchDashboardData])

  const filteredStudents = realStudents.filter(
    (student: any) =>
      (student.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.program || '').toLowerCase().includes(searchQuery.toLowerCase())
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

  // Fetch all shared documents (resources) from backend
  const fetchSharedDocuments = useCallback(async () => {
    if (userLoading || !user?.id) return

    try {
      // Fetch documents for all students (type: resource, uploaded by supervisor)
      const allDocs: Document[] = []
      
      for (const student of realStudents) {
        try {
          const response = await documentsAPI.getAll({ 
            student_id: student.id,
            type: 'resource'
          })
          
          const studentDocs = response.documents || []
          
          // Filter to get supervisor-uploaded documents
          const supervisorDocs = studentDocs.filter((doc: any) => 
            doc.supervisor_id && doc.student_id === student.id
          )
          
          // Transform to Document format
          const transformedDocs = supervisorDocs.map((doc: any) => ({
            id: doc.id.toString(),
            studentId: student.id,
            title: doc.title || doc.file_name,
            type: doc.file_type?.split('/')[1]?.toUpperCase() || "FILE",
            uploadedDate: doc.created_at ? new Date(doc.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            size: doc.file_size ? `${(doc.file_size / (1024 * 1024)).toFixed(2)} MB` : "0 MB",
            documentId: doc.id, // Store actual document ID for deletion
          }))
          
          allDocs.push(...transformedDocs)
        } catch (error: any) {
          console.error(`Error fetching documents for student ${student.id}:`, error)
        }
      }
      
      // Sort by most recent first
      allDocs.sort((a, b) => new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime())
      
      setDocuments(allDocs)
      setDocumentsShared(allDocs.length)
    } catch (error: any) {
      console.error('Error fetching shared documents:', error)
    }
  }, [user?.id, userLoading, realStudents])

  // Fetch shared documents when students are loaded
  useEffect(() => {
    if (realStudents.length > 0 && fetchSharedDocuments) {
      fetchSharedDocuments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realStudents.length])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCurrentUploadFile(e.target.files[0])
    }
  }

  // Fetch weekly tasks when student is selected for document upload
  useEffect(() => {
    const fetchWeeklyTasksForStudent = async () => {
      if (!newDocument.studentId) {
        setWeeklyTasksForDocument({})
        return
      }

      try {
        setIsLoadingWeeklyTasks(true)
        const studentId = Number(newDocument.studentId)
        const tasksResponse = await progressAPI.getWeeklyTasks(studentId)
        const tasks = tasksResponse.tasks || []
        setWeeklyTasksForDocument((prev) => ({
          ...prev,
          [newDocument.studentId]: tasks,
        }))
      } catch (error: any) {
        console.log(`No weekly tasks found for student ${newDocument.studentId}:`, error.message)
        setWeeklyTasksForDocument((prev) => ({
          ...prev,
          [newDocument.studentId]: [],
        }))
      } finally {
        setIsLoadingWeeklyTasks(false)
      }
    }

    fetchWeeklyTasksForStudent()
  }, [newDocument.studentId])

  const handleAddDocument = async () => {
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

    const student = realStudents.find((s: any) => s.id === Number(newDocument.studentId))
    if (!student || !student.id) {
      toast({
        title: "Error",
        description: "Student not found",
        variant: "destructive",
      })
      return
    }

    // Prevent multiple submissions
    if (isUploadingDocument) {
      return
    }

    try {
      setIsUploadingDocument(true)
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', currentUploadFile)
      formData.append('title', newDocument.title)
      formData.append('description', newDocument.description || '')
      formData.append('student_id', student.id.toString())
      formData.append('type', 'resource')
      // Add week_number if not "general"
      if (newDocument.week && newDocument.week !== 'general') {
        formData.append('week_number', newDocument.week)
      }

      // Upload document
      await documentsAPI.upload(formData)

      toast({
        title: "Document uploaded",
        description: `${currentUploadFile.name} has been uploaded successfully for ${student.name}`,
      })

      // Refresh documents list
      await fetchSharedDocuments()

      // Reset form and close dialog
      setDocumentDialogOpen(false)
      setNewDocument({ title: "", studentId: "", week: "general", description: "" })
      setCurrentUploadFile(null)
    } catch (error: any) {
      console.error('Error uploading document:', error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingDocument(false)
    }
  }

  const handleRemoveDocument = async (documentId: string) => {
    try {
      // Find the document to get the actual document ID
      const doc = documents.find((d) => d.id === documentId)
      if (!doc || !doc.documentId) {
        toast({
          title: "Error",
          description: "Document not found",
          variant: "destructive",
        })
        return
      }

      // Delete from backend
      await documentsAPI.delete(doc.documentId)

      toast({
        title: "Document Removed",
        description: "The document has been deleted.",
      })

      // Refresh documents list
      await fetchSharedDocuments()
    } catch (error: any) {
      console.error('Error deleting document:', error)
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document. Please try again.",
        variant: "destructive",
      })
    }
  }

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
        setIsAddStudentOpen(false)

        // Refresh students list
        await fetchDashboardData()
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
        setIsAddStudentOpen(false)

        // Refresh students list
        await fetchDashboardData()
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

  const handleScheduleMeeting = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    if (!meetingData.student || !meetingData.title || !meetingData.date || !meetingData.time || !meetingData.duration || !meetingData.agenda) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Validate meeting type specific fields
    if (meetingData.type === "in-person" && !meetingData.location) {
      toast({
        title: "Validation Error",
        description: "Please provide a location for in-person meetings",
        variant: "destructive",
      })
      return
    }

    if (meetingData.type === "online" && !meetingData.meeting_link) {
      toast({
        title: "Validation Error",
        description: "Please provide a meeting link for online meetings",
        variant: "destructive",
      })
      return
    }

    // Validate date is not in the past
    const selectedDate = new Date(meetingData.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      toast({
        title: "Invalid Date",
        description: "Meeting date cannot be in the past. Please select today or a future date.",
        variant: "destructive",
      })
      return
    }

    // Validate time is between 8:00 AM and 5:00 PM
    const [hours, minutes] = meetingData.time.split(':')
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

    try {
      setIsSchedulingMeeting(true)
      const student = realStudents.find((s: any) => s.id === Number(meetingData.student))
      
      if (!student) {
        toast({
          title: "Error",
          description: "Student not found",
          variant: "destructive",
        })
        return
      }

      // Create meeting via API
      await meetingsAPI.create({
        student_id: parseInt(meetingData.student),
        title: meetingData.title,
        date: meetingData.date,
        time: meetingData.time,
        duration: parseInt(meetingData.duration),
        type: meetingData.type,
        location: meetingData.type === "in-person" ? meetingData.location : undefined,
        meeting_link: meetingData.type === "online" ? meetingData.meeting_link : undefined,
        agenda: meetingData.agenda,
      })

      // Refresh meetings list
      const meetingsResponse = await meetingsAPI.getAll()
      const allMeetings = meetingsResponse.meetings || []
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const upcoming = allMeetings
        .filter((m: any) => {
          const meetingDate = new Date(m.date)
          meetingDate.setHours(0, 0, 0, 0)
          return (m.status === 'pending' || m.status === 'approved' || m.status === 'confirmed') && meetingDate >= today
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.date + ' ' + a.time)
          const dateB = new Date(b.date + ' ' + b.time)
          return dateA.getTime() - dateB.getTime()
        })
        .slice(0, 5)
      setRealMeetings(upcoming)

      setMeetingData({
        student: "",
        title: "",
        date: "",
        time: "",
        duration: "60",
        type: "online",
        location: "",
        meeting_link: "",
        agenda: "",
      })
      setIsScheduleMeetingOpen(false)

      toast({
        title: "Meeting Scheduled",
        description: "The meeting has been scheduled successfully. The student will be notified.",
      })
    } catch (error: any) {
      console.error('Error scheduling meeting:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to schedule meeting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSchedulingMeeting(false)
    }
  }

  // Fetch live data for report generation
  const [reportData, setReportData] = useState<any>(null)
  const [isLoadingReportData, setIsLoadingReportData] = useState(false)

  const fetchReportData = useCallback(async (studentId: number) => {
    setIsLoadingReportData(true)
    try {
      const student = realStudents.find((s: any) => s.id === studentId)
      if (!student) {
        throw new Error('Student not found')
      }

      // Fetch all live data for the student
      const [weeklyTasksRes, submissionsRes, documentsRes, meetingsRes] = await Promise.all([
        progressAPI.getWeeklyTasks(student.id).catch(() => ({ tasks: [] })),
        progressAPI.getWeeklySubmissions(student.id).catch(() => ({ submissions: [] })),
        documentsAPI.getAll({ student_id: student.id, type: 'submission' }).catch(() => ({ documents: [] })),
        meetingsAPI.getAll({ student_id: student.id }).catch(() => ({ meetings: [] }))
      ])

      const weeklyTasks = weeklyTasksRes.tasks || []
      const submissions = submissionsRes.submissions || []
      const documents = documentsRes.documents || []
      const meetings = meetingsRes.meetings || []

      // Calculate milestones from weekly tasks
      const milestones = weeklyTasks.map((task: any) => {
        const submission = submissions.find((s: any) => s.week_number === task.week_number && s.status === 'submitted')
        const hasDocument = documents.some((d: any) => d.week_number === task.week_number)
        const isCompleted = submission && hasDocument
        return {
          name: task.title || `Week ${task.week_number}`,
          progress: isCompleted ? 100 : 0,
          status: isCompleted ? 'completed' : 'pending'
        }
      })

      // Get enrollment date and calculate expected completion (assuming 3-4 year program)
      const enrollmentDate = student.enrollment_date ? new Date(student.enrollment_date) : new Date()
      const startDate = enrollmentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const expectedCompletion = new Date(enrollmentDate)
      expectedCompletion.setFullYear(expectedCompletion.getFullYear() + 4)
      const expectedCompletionStr = expectedCompletion.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      // Get recent meetings
      const recentMeetings = meetings
        .filter((m: any) => m.status === 'approved' || m.status === 'completed')
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map((m: any) => ({
          title: m.title || 'Meeting',
          time: new Date(`${m.date}T${m.time}`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }))

      // Get weekly progress
      const weeklyProgress = weeklyTasks.map((task: any) => {
        const submission = submissions.find((s: any) => s.week_number === task.week_number)
        return {
          week: task.week_number,
          task: task.title || `Week ${task.week_number}`,
          status: submission?.status || 'pending',
          submission: submission ? new Date(submission.created_at).toLocaleDateString() : 'Not submitted'
        }
      })

      // Get last meeting
      const lastMeeting = meetings.length > 0 
        ? meetings
            .filter((m: any) => m.status === 'approved' || m.status === 'completed')
            .sort((a: any, b: any) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime())[0]
        : null

      // Count meetings this month
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const meetingsThisMonth = meetings.filter((m: any) => {
        const meetingDate = new Date(m.date)
        return meetingDate.getMonth() === currentMonth && meetingDate.getFullYear() === currentYear
      }).length

      // Count pending reviews
      const pendingReviews = documents.filter((d: any) => d.status === 'submitted' || d.status === 'pending').length

      setReportData({
        name: student.name || "",
        program: student.program || "",
        progress: student.progress || 0,
        startDate,
        expectedCompletion: expectedCompletionStr,
        milestones: milestones.slice(0, 10), // Limit to 10 most recent
        recentActivities: recentMeetings,
        weeklyProgress: weeklyProgress.slice(0, 10), // Limit to 10 most recent
        lastMeeting: lastMeeting ? new Date(`${lastMeeting.date}T${lastMeeting.time}`).toLocaleDateString() : 'No meetings yet',
        meetingsThisMonth,
        documentsSubmitted: documents.length,
        pendingReviews
      })
    } catch (error: any) {
      console.error('Error fetching report data:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch student data for report",
        variant: "destructive",
      })
    } finally {
      setIsLoadingReportData(false)
    }
  }, [realStudents, toast])

  // Fetch report data when student is selected
  useEffect(() => {
    if (selectedReportStudent) {
      fetchReportData(Number(selectedReportStudent))
    }
  }, [selectedReportStudent, fetchReportData])

  const handleGenerateReport = () => {
    if (!selectedReportStudent) {
      toast({
        title: "Selection Required",
        description: "Please select a student to generate report",
        variant: "destructive",
      })
      return
    }
    // Report generation is handled by DownloadReportButton component
    // Data is fetched automatically when student is selected
  }

  // Fetch available fields when announcement dialog opens
  useEffect(() => {
    if (isAnnouncementOpen) {
      fetchAvailableFields()
    }
  }, [isAnnouncementOpen])

  const fetchAvailableFields = async () => {
    setIsLoadingFields(true)
    try {
      const response = await announcementsAPI.getFields()
      setAvailableFields(response.fields)
      if (response.fields.length > 0 && !selectedField) {
        setSelectedField(response.fields[0].field)
      }
    } catch (error: any) {
      console.error('Error fetching fields:', error)
      toast({
        title: "Error",
        description: "Failed to load available fields. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingFields(false)
    }
  }

  const handleSendAnnouncement = async () => {
    if (!announcementTitle || !announcementMessage) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and message",
        variant: "destructive",
      })
      return
    }

    if (!selectedField) {
      toast({
        title: "Validation Error",
        description: "Please select a field/program",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await announcementsAPI.create({
        title: announcementTitle,
        message: announcementMessage,
        field: selectedField
      })

      setAnnouncementTitle("")
      setAnnouncementMessage("")
      setSelectedField("")
      setIsAnnouncementOpen(false)

      toast({
        title: "Announcement Sent",
        description: response.message || `Your announcement has been sent to ${response.announcement.recipientsCount} student(s) in ${selectedField}.`,
      })
    } catch (error: any) {
      console.error('Error sending announcement:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send announcement. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewProgress = (studentId: number) => {
    window.location.href = `/supervisor/students/${studentId}`
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

  // Handle notification click to navigate
  const handleNotificationClick = async (notif: any) => {
    // Mark as read when clicked
    if (notif.unread) {
      markAsRead(notif.id)
    }
    
    // If it's a submission notification and we're already on dashboard, refresh data immediately
    if ((notif.type === 'document' || notif.type === 'submission') && pathname === '/supervisor/dashboard') {
      // Force immediate refresh of dashboard data
      await fetchDashboardData(false)
    }
    
    // Navigate based on notification link first (from live API data)
    if (notif.link && notif.link.trim() !== '') {
      try {
        // If link is dashboard and we're already there, just refresh
        if (notif.link === '/supervisor/dashboard' && pathname === '/supervisor/dashboard') {
          await fetchDashboardData(false)
          setIsNotificationsOpen(false)
          return
        }
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
          // Find student by name from realStudents
          const student = realStudents.find((s: any) => 
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

  // Use markAsRead from context
  const handleMarkAsRead = (notificationId: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    // setNotifications(notifications.map((notif) => (notif.id === notificationId ? { ...notif, unread: false } : notif)))
    // setUnreadCount(Math.max(0, unreadCount - 1))
    markAsRead(notificationId)
  }

  // Use deleteNotification from context
  const handleDeleteNotification = (notificationId: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
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

  // Use clearAll from context
  const handleClearAll = () => {
    // const unreadNotifs = notifications.filter((n) => n.unread).length
    // setUnreadCount(0)
    // setNotifications(notifications.map((n) => ({ ...n, unread: false })))
    clearAll()
    toast({
      title: "All Notifications Marked as Read",
      // description: `${unreadNotifs} notifications marked as read.`,
      description: "All notifications have been marked as read.",
    })
  }

  // Fetch messages with selected student
  const fetchMessages = useCallback(async (studentUserId: number) => {
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
  }, [user?.user_id, fetchUnreadCounts])

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    if (!selectedStudentForMessage) {
      toast({
        title: "Error",
        description: "Please select a student",
        variant: "destructive",
      })
      return
    }

    const student = realStudents.find((s: any) => s.id === selectedStudentForMessage)
    if (!student?.user_id) {
      toast({
        title: "Error",
        description: "Unable to send message. Student information is missing.",
        variant: "destructive",
      })
      return
    }

    try {
      await messagesAPI.send({
        receiver_id: student.user_id,
        content: messageContent.trim(),
      })

      // Refresh messages to show the new one
      await fetchMessages(student.user_id)
      
      // Refresh unread counts
      await fetchUnreadCounts()

      setMessageContent("")

      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${student.name}`,
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

  // Handler for message dialog open/close
  const handleMessageDialogChange = useCallback(async (open: boolean) => {
    setMessageDialogOpen(open)
    
    if (!open) {
      // Dialog closed - refresh unread counts to ensure badge updates
      await fetchUnreadCounts()
    }
  }, [fetchUnreadCounts])

  const handleOpenMessageDialog = async (studentId: number) => {
    setSelectedStudentForMessage(studentId)
    setMessageDialogOpen(true)
    
    // Fetch conversation history when dialog opens
    const student = realStudents.find((s: any) => s.id === studentId)
    if (student?.user_id) {
      await fetchMessages(student.user_id)
    }
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
              <Link href="/supervisor/dashboard" className="text-sm font-medium px-4 py-2 rounded-lg text-foreground bg-muted/50 transition-smooth hover:bg-muted">
                Dashboard
              </Link>
              <Link
                href="/supervisor/students"
                className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
              >
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
                aria-label="Notifications"
              >
                <BellIcon />
                {(() => {
                  const count = unreadCount ?? (notifications?.filter((n: any) => n.unread)?.length || 0);
                  return count > 0 ? (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center z-10">
                      {count > 99 ? '99+' : count}
                    </span>
                  ) : null;
                })()}
              </Button>

              {/* Notifications Dropdown Panel */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                    {(() => {
                      const count = unreadCount ?? (notifications?.filter((n: any) => n.unread)?.length || 0);
                      return count > 0 ? (
                        <Badge variant="secondary" className="bg-red-500/10 text-red-700">
                          {count} Unread
                        </Badge>
                      ) : null;
                    })()}
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
                        onClick={async () => {
                          await clearAll()
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
              <Avatar className="cursor-pointer hover:opacity-80 transition-all duration-300 ring-2 ring-primary/20 hover:ring-primary/40 shadow-md hover:shadow-lg">
                <AvatarImage src={getUploadUrl(user?.avatar)} alt="Supervisor" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                  {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'SV'}
                </AvatarFallback>
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

        {/* Welcome Section with Gradient */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-2xl blur-3xl -z-10"></div>
          <div className="relative">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-3">
              Welcome back, {user?.name || "Supervisor"}
            </h2>
            <p className="text-muted-foreground text-lg">Monitor your students' progress and upcoming activities</p>
          </div>
        </div>

        {/* Enhanced Stats Grid with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10">
          <Card className="group relative overflow-hidden border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Students</p>
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <UsersIcon className="text-primary h-5 w-5" />
                </div>
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
                {totalStudents}
              </p>
              <p className="text-sm text-muted-foreground">
                {realStudents.length > 0 
                  ? `${realStudents.filter((s: any) => (s.program || '').toLowerCase().includes('phd')).length} PhD, ${realStudents.filter((s: any) => (s.program || '').toLowerCase().includes('master')).length} Masters`
                  : "Loading..."}
              </p>
            </div>
          </Card>

          <Card className="group relative overflow-hidden border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pending Meetings</p>
                <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <FileTextIcon className="text-accent h-5 w-5" />
                </div>
              </div>
              <p className="text-4xl font-bold text-foreground mb-2">{pendingMeetings}</p>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                <p className="text-muted-foreground font-medium">Awaiting approval</p>
              </div>
            </div>
          </Card>

          <Card className="group relative overflow-hidden border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Documents Shared</p>
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <CalendarIcon className="text-primary h-5 w-5" />
                </div>
              </div>
              <p className="text-4xl font-bold text-foreground mb-2">{documentsShared}</p>
              <p className="text-sm text-muted-foreground">Across all students</p>
            </div>
          </Card>

          <Card className="group relative overflow-hidden border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Avg. Progress</p>
                <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <TrendingUpIcon className="text-accent h-5 w-5" />
                </div>
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-2">
                {avgProgress}%
              </p>
              <p className="text-sm text-muted-foreground">
                {realStudents.length > 0 
                  ? `Average across ${realStudents.length} student${realStudents.length > 1 ? 's' : ''}`
                  : "Loading..."}
              </p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enhanced Students Overview */}
            <Card className="p-8 border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">Students Overview</h3>
                  <p className="text-sm text-muted-foreground">Manage and monitor your students</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <Input
                      placeholder="Search students..."
                      className="w-64 pl-10 border-2 focus:border-primary/50 transition-colors"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Link href="/supervisor/students">
                    <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow">
                      View All
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="space-y-4">
                {filteredStudents.map((student: any) => {
                  // Ensure student has all required fields, especially status
                  const studentWithStatus = {
                    ...student,
                    status: student.status || null, // null if no weekly tasks exist
                    name: student.name || 'Unknown',
                    program: student.program || 'N/A',
                    progress: student.progress || 0,
                    lastMeeting: student.lastMeeting || 'N/A',
                    nextMilestone: student.nextMilestone || 'N/A',
                    avatar: student.avatar || '/placeholder.svg',
                  }
                  
                  return (
                    <StudentCard
                      key={student.id}
                      student={studentWithStatus}
                      onViewProfile={() => handleViewProgress(student.id)}
                      onSendMessage={handleOpenMessageDialog}
                      onSendWarning={handleSendWarning}
                      unreadCount={unreadCounts[student.user_id] || 0}
                    />
                  )
                })}
                {isLoadingData ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading students...</p>
                  </div>
                ) : filteredStudents.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {realStudents.length === 0 
                        ? "You don't have any students yet. Click 'Add Student' to add students to your supervision."
                        : `No students found matching "${searchQuery}"`}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Enhanced Upcoming Meetings */}
            <Card className="p-8 border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-1">Upcoming Meetings</h3>
                <p className="text-sm text-muted-foreground">Review and manage scheduled meetings</p>
              </div>
              <div className="space-y-3">
                {meetings.slice(0, 3).map((meeting) => (
                  <div
                    key={meeting.id}
                    className="group flex items-between p-5 rounded-xl border-2 border-border hover:border-primary/30 hover:shadow-md bg-gradient-to-r from-card to-card/50 transition-all duration-300"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">{meeting.studentName}</p>
                        <Badge variant={meeting.status === "approved" ? "default" : "secondary"} className="shadow-sm">
                          {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{meeting.topic}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>{meeting.date} at {meeting.time}</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{meeting.duration} min</span>
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
                  </DialogHeader>
                  <form id="schedule-meeting-form" onSubmit={handleScheduleMeeting} className="space-y-4 py-4">
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
                          {isLoadingData ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading students...</div>
                          ) : realStudents.length > 0 ? (
                            realStudents.map((student: any) => (
                              <SelectItem key={student.id} value={String(student.id)}>
                                {student.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">No students available. Add students to schedule meetings.</div>
                          )}
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
                        required
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
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meeting-time">Time *</Label>
                        <Input
                          id="meeting-time"
                          type="time"
                          value={meetingData.time}
                          onChange={(e) => setMeetingData({ ...meetingData, time: e.target.value })}
                          min="08:00"
                          max="17:00"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Available: 8:00 AM - 5:00 PM</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meeting-duration">Duration *</Label>
                      <Select
                        value={meetingData.duration}
                        onValueChange={(value) => setMeetingData({ ...meetingData, duration: value })}
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
                          <SelectItem value="online">Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {meetingData.type === "in-person" && (
                      <div className="space-y-2">
                        <Label htmlFor="meeting-location">Location *</Label>
                        <Input
                          id="meeting-location"
                          placeholder="e.g., Room 3.14"
                          value={meetingData.location}
                          onChange={(e) => setMeetingData({ ...meetingData, location: e.target.value })}
                          required
                        />
                      </div>
                    )}

                    {meetingData.type === "online" && (
                      <div className="space-y-2">
                        <Label htmlFor="meeting-link">Meeting Link *</Label>
                        <Input
                          id="meeting-link"
                          type="url"
                          placeholder="https://meet.google.com/xxx-xxxx-xxx or https://zoom.us/j/xxxxx"
                          value={meetingData.meeting_link}
                          onChange={(e) => setMeetingData({ ...meetingData, meeting_link: e.target.value })}
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
                        value={meetingData.agenda}
                        onChange={(e) => setMeetingData({ ...meetingData, agenda: e.target.value })}
                        required
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => setIsScheduleMeetingOpen(false)}
                        disabled={isSchedulingMeeting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                        disabled={!meetingData.student || !meetingData.title || !meetingData.date || !meetingData.time || !meetingData.duration || !meetingData.agenda || (meetingData.type === "in-person" && !meetingData.location) || (meetingData.type === "online" && !meetingData.meeting_link) || isSchedulingMeeting}
                      >
                        {isSchedulingMeeting ? "Scheduling..." : "Schedule Meeting"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </Card>

            {/* Enhanced Documents Section */}
            <Card className="p-8 border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-1">Shared Documents</h3>
                <p className="text-sm text-muted-foreground">Documents shared with students</p>
              </div>
              <div className="space-y-3">
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                      <FileTextIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No documents uploaded yet</p>
                  </div>
                ) : (
                  documents.slice(0, 3).map((doc) => (
                    <div
                      key={doc.id}
                      className="group flex items-center justify-between p-5 rounded-xl border-2 border-border hover:border-primary/30 hover:shadow-md bg-gradient-to-r from-card to-card/50 transition-all duration-300"
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
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveDocument(doc.id)} aria-label={`Remove document ${doc.title}`}>
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
                <DialogContent className="max-w-2xl">
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
                          {isLoadingData ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading students...</div>
                          ) : realStudents.length > 0 ? (
                            realStudents.map((student: any) => (
                              <SelectItem key={student.id} value={String(student.id)}>
                                {student.name} - {student.program || ''}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">No students available. Add students to share documents.</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doc-title">Document Title *</Label>
                      <Input
                        id="doc-title"
                        placeholder="e.g., Research Guidelines, Week 1 Materials"
                        value={newDocument.title}
                        onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="week-select">Assign to Week (Optional)</Label>
                      <Select 
                        value={newDocument.week} 
                        onValueChange={(value) => setNewDocument({ ...newDocument, week: value })}
                        disabled={!newDocument.studentId || isLoadingWeeklyTasks}
                      >
                        <SelectTrigger id="week-select">
                          <SelectValue placeholder="Select week" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Resources</SelectItem>
                          {newDocument.studentId && weeklyTasksForDocument[newDocument.studentId] && weeklyTasksForDocument[newDocument.studentId].length > 0 ? (
                            weeklyTasksForDocument[newDocument.studentId]
                              .sort((a: any, b: any) => a.week_number - b.week_number)
                              .map((task: any) => (
                                <SelectItem key={task.week_number} value={task.week_number.toString()}>
                                  Week {task.week_number}: {task.title || `Week ${task.week_number}`}
                                </SelectItem>
                              ))
                          ) : newDocument.studentId && (!weeklyTasksForDocument[newDocument.studentId] || weeklyTasksForDocument[newDocument.studentId].length === 0) ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">No weeks assigned to this student</div>
                          ) : null}
                        </SelectContent>
                      </Select>
                      {newDocument.studentId && (!weeklyTasksForDocument[newDocument.studentId] || weeklyTasksForDocument[newDocument.studentId].length === 0) && (
                        <p className="text-xs text-muted-foreground">
                          No weeks have been assigned to this student yet. Assign weeks in the student's progress page.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doc-file">Upload File *</Label>
                      <Input id="doc-file" type="file" onChange={handleFileUpload} className="cursor-pointer" />
                      {currentUploadFile && <p className="text-sm text-muted-foreground">Selected: {currentUploadFile.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doc-description">Description (Optional)</Label>
                      <Textarea
                        id="doc-description"
                        placeholder="Add any notes or instructions about this document..."
                        rows={3}
                        value={newDocument.description}
                        onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDocumentDialogOpen(false)
                        setCurrentUploadFile(null)
                        setNewDocument({ title: "", studentId: "", week: "general", description: "" })
                      }}
                      disabled={isUploadingDocument}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddDocument}
                      disabled={isUploadingDocument || !currentUploadFile || !newDocument.title || !newDocument.studentId}
                      className="flex-1"
                    >
                      {isUploadingDocument ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload Document"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6 relative z-10">
            {/* Enhanced Pending Reviews */}
            <Card className="p-6 border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl -z-0"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-accent to-primary rounded-full"></div>
                  Pending Reviews
                </h3>
              <div className="space-y-3">
                {isLoadingData ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">Loading reviews...</div>
                ) : pendingReviews.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">No pending reviews</div>
                ) : (
                  pendingReviews.slice(0, 4).map((review) => (
                    <ReviewItem
                      key={review.id}
                      student={review.studentName}
                      document={review.documentTitle}
                      submitted={review.submittedAgo}
                      priority={review.priority}
                      studentId={review.studentId}
                      weekNumber={review.weekNumber}
                    />
                  ))
                )}
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
                      {isLoadingData ? (
                        <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
                      ) : pendingReviews.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No pending reviews</div>
                      ) : (
                        pendingReviews.map((review) => (
                          <ReviewItemDetailed
                            key={review.id}
                            student={review.studentName}
                            document={review.documentTitle}
                            program={review.studentProgram}
                            submitted={review.submittedAgo}
                            priority={review.priority}
                            description={review.description || "Document submitted for review."}
                            studentId={review.studentId}
                            weekNumber={review.weekNumber}
                            documentId={review.id}
                          />
                        ))
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setIsViewAllReviewsOpen(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>
            </Card>

            {/* Logbook Section */}
            <Card className="p-6 border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl -z-0"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-accent to-primary rounded-full"></div>
                  Logbook
                </h3>
                <div className="space-y-3">
                  {isLoadingData ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">Loading logbooks...</div>
                  ) : Object.keys(logbooks).length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">No logbooks uploaded yet</div>
                  ) : (
                    realStudents
                      .filter((student: any) => logbooks[student.id])
                      .slice(0, 4)
                      .map((student: any) => {
                        const logbook = logbooks[student.id]
                        const history = logbookHistory[student.id] || []
                        return (
                          <div
                            key={student.id}
                            className="group flex items-start justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all duration-200"
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
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
                                  className="text-primary"
                                >
                                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground truncate">{student.name}</p>
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {logbook.file_name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Version {logbook.version} • {logbook.uploaded_by_name} ({logbook.uploaded_by_role === 'student' ? 'Student' : 'You'})
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              {history.length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => {
                                    setSelectedLogbookStudent(student.id)
                                    setShowLogbookHistory((prev) => ({ ...prev, [student.id]: true }))
                                  }}
                                >
                                  View History
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={async () => {
                                  try {
                                    await logbookAPI.download(student.id, logbook.file_name)
                                    toast({
                                      title: "Download Started",
                                      description: "Logbook download has started.",
                                    })
                                  } catch (error: any) {
                                    toast({
                                      title: "Download Failed",
                                      description: error.message || "Failed to download logbook.",
                                      variant: "destructive",
                                    })
                                  }
                                }}
                              >
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
                                >
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
            </Card>

            {/* Enhanced Quick Actions */}
            <Card className="p-6 border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-card/80 backdrop-blur-sm border-2 border-border hover:border-primary hover:bg-primary/10 hover:text-primary shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group" size="sm">
                      <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/25 mr-2 transition-colors duration-200">
                        <PlusIcon className="h-4 w-4 text-primary" />
                      </div>
                      Add New Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
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
                        setIsAddStudentOpen(false)
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

                <Dialog open={isGenerateReportOpen} onOpenChange={setIsGenerateReportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-card/80 backdrop-blur-sm border-2 border-border hover:border-primary hover:bg-primary/10 hover:text-primary shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group" size="sm">
                      <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/25 mr-2 transition-colors duration-200">
                        <FileTextIcon className="h-4 w-4 text-primary" />
                      </div>
                      Generate Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Generate Student Report</DialogTitle>
                      <DialogDescription>Select a student to generate their progress report</DialogDescription>
                    </DialogHeader>
                    {selectedReportStudent ? (
                      <div className="space-y-5 py-4">
                        <div className="p-5 bg-muted/50 border border-border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-2 font-medium">Selected Student</p>
                          <p className="text-lg font-semibold text-foreground mb-1">
                            {realStudents.find((s: any) => s.id === Number(selectedReportStudent))?.name || 'Unknown Student'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {realStudents.find((s: any) => s.id === Number(selectedReportStudent))?.program || 'N/A'}
                          </p>
                        </div>

                        {isLoadingReportData ? (
                          <Button disabled className="w-full">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading student data...
                          </Button>
                        ) : reportData ? (
                          <DownloadReportButton
                            studentData={reportData}
                            variant="default"
                            size="default"
                            className="w-full"
                          />
                        ) : (
                          <Button disabled className="w-full" variant="outline">
                            Select a student to generate report
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setSelectedReportStudent("")
                          }}
                        >
                          Select Different Student
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-5 py-4">
                        <div className="space-y-2">
                          <Select value={selectedReportStudent} onValueChange={setSelectedReportStudent}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a student" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingData ? (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading students...</div>
                              ) : realStudents.length > 0 ? (
                                realStudents.map((student: any) => (
                                  <SelectItem key={student.id} value={String(student.id)}>
                                    {student.name} - {student.program || ''}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">No students available. Add students to generate reports.</div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
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
                    <Button variant="outline" className="w-full justify-start bg-card/80 backdrop-blur-sm border-2 border-border hover:border-accent hover:bg-accent/10 hover:text-accent shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group" size="sm">
                      <div className="p-1.5 rounded-md bg-accent/10 group-hover:bg-accent/25 mr-2 transition-colors duration-200">
                        <MessageSquareIcon className="h-4 w-4 text-accent" />
                      </div>
                      Send Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Send Announcement</DialogTitle>
                      <DialogDescription>Send an announcement to all students in a specific field/program</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="announcement-title">Announcement Title *</Label>
                        <Input
                          id="announcement-title"
                          placeholder="e.g., Important: Deadline Change"
                          value={announcementTitle}
                          onChange={(e) => setAnnouncementTitle(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="announcement-field">Field/Program *</Label>
                        <Select 
                          value={selectedField} 
                          onValueChange={setSelectedField}
                          disabled={isLoadingFields}
                        >
                          <SelectTrigger id="announcement-field" className="w-full">
                            <SelectValue placeholder={isLoadingFields ? "Loading fields..." : "Select field/program"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map((field) => (
                              <SelectItem key={field.field} value={field.field}>
                                {field.field} ({field.studentCount} student{field.studentCount !== 1 ? 's' : ''})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="announcement-message">Message *</Label>
                        <Textarea
                          id="announcement-message"
                          placeholder="Write your announcement message here..."
                          rows={6}
                          value={announcementMessage}
                          onChange={(e) => setAnnouncementMessage(e.target.value)}
                          className="w-full resize-none"
                        />
                      </div>
                      {selectedField && (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-2">
                          <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                            This announcement will be sent to all students in <strong className="font-semibold">{selectedField}</strong>.
                            {availableFields.find(f => f.field === selectedField) && (
                              <span> ({availableFields.find(f => f.field === selectedField)!.studentCount} student{availableFields.find(f => f.field === selectedField)!.studentCount !== 1 ? 's' : ''})</span>
                            )}
                          </p>
                        </div>
                      )}
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

      <Dialog open={messageDialogOpen} onOpenChange={handleMessageDialogChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Message {realStudents.find((s) => s.id === selectedStudentForMessage)?.name || 'Student'}</DialogTitle>
          </DialogHeader>
          <MessageDialog
            messages={messages}
            onSendMessage={handleSendMessage}
            messageText={messageContent}
            onMessageChange={setMessageContent}
          />
        </DialogContent>
      </Dialog>

      <Chatbot role="supervisor" />

      {/* Logbook History Dialog */}
      {selectedLogbookStudent && (
        <Dialog 
          open={showLogbookHistory[selectedLogbookStudent] || false} 
          onOpenChange={(open) => setShowLogbookHistory((prev) => ({ ...prev, [selectedLogbookStudent]: open }))}
        >
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Logbook History for {realStudents.find((s: any) => s.id === selectedLogbookStudent)?.name}</DialogTitle>
              <DialogDescription>
                View all versions of the student's logbook, including uploads and updates.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {!logbookHistory[selectedLogbookStudent] || logbookHistory[selectedLogbookStudent].length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No history available</p>
              ) : (
                logbookHistory[selectedLogbookStudent].map((entry: any) => (
                  <Card key={entry.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Version {entry.version}</Badge>
                          <Badge variant={entry.uploaded_by_role === 'student' ? 'default' : 'secondary'}>
                            {entry.uploaded_by_role === 'student' ? 'Uploaded by Student' : 'Uploaded by You'}
                          </Badge>
                        </div>
                        <p className="font-semibold text-foreground">{entry.file_name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {entry.uploaded_by_name} • {new Date(entry.created_at).toLocaleDateString("en-US", { 
                            year: "numeric", 
                            month: "long", 
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          File size: {(entry.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await logbookAPI.download(selectedLogbookStudent, entry.file_name)
                            toast({
                              title: "Download Started",
                              description: "Logbook download has started.",
                            })
                          } catch (error: any) {
                            toast({
                              title: "Download Failed",
                              description: error.message || "Failed to download logbook.",
                              variant: "destructive",
                            })
                          }
                        }}
                      >
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
                          className="mr-2"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

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
  onSendWarning,
  unreadCount = 0,
}: {
  student: any
  onViewProfile: () => void
  onSendMessage: (studentId: number) => void
  onSendWarning: (student: any) => void
  unreadCount?: number
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

  // Use status from student data (calculated based on overdue tasks)
  // Only show badge if status exists (weekly tasks have been added)
  const studentStatus = student.status
  const config = studentStatus ? statusConfig[studentStatus as keyof typeof statusConfig] : null

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
      <Avatar className="h-12 w-12">
        <AvatarImage src={getUploadUrl(student.avatar)} alt={student.name} />
        <AvatarFallback>
          {student.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-foreground">{student.name}</h4>
          {config && (
            <Badge className={config.color} variant="secondary">
              {config.badge}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-2">{student.program}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
          <span>Last meeting: {student.lastMeeting}</span>
          <span>•</span>
          <span>Next: {student.nextMilestone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={student.progress} className="h-2 flex-1" aria-label={`${student.name} progress: ${student.progress}%`} />
          <span className="text-sm font-semibold text-muted-foreground">{student.progress}%</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" onClick={onViewProfile}>
          View Profile
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onSendMessage(student.id)} className="relative" aria-label={`Send message to ${student.name}`}>
          <MessageSquareIcon className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
        {student.status === "needs-attention" && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSendWarning(student)}
            className="border-yellow-600/50 bg-yellow-100/50 text-yellow-800 hover:bg-yellow-200 hover:border-yellow-700 hover:text-yellow-900 dark:bg-yellow-950/20 dark:text-yellow-400 dark:hover:bg-yellow-950/40 dark:hover:border-yellow-500 dark:hover:text-yellow-300 transition-all duration-200 cursor-pointer hover:shadow-sm"
          >
            <AlertTriangleIcon className="h-4 w-4 mr-1" />
            Send Warning
          </Button>
        )}
      </div>
    </div>
  )
}

function ReviewItem({
  student,
  document,
  submitted,
  priority,
  studentId,
  weekNumber,
}: {
  student: string
  document: string
  submitted: string
  priority: string
  studentId?: number
  weekNumber?: number | null
}) {
  const router = useRouter()
  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  }

  const handleClick = () => {
    if (studentId) {
      // Navigate to student page with week parameter if available
      if (weekNumber) {
        router.push(`/supervisor/students/${studentId}?week=${weekNumber}`)
      } else {
        router.push(`/supervisor/students/${studentId}`)
      }
    }
  }

  return (
    <div 
      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={handleClick}
    >
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
  studentId,
  weekNumber,
  documentId,
}: {
  student: string
  document: string
  program: string
  submitted: string
  priority: string
  description: string
  studentId?: number
  weekNumber?: number | null
  documentId?: number
}) {
  const router = useRouter()
  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  }

  const handleReviewNow = () => {
    if (studentId) {
      // Navigate to student page with week parameter if available
      if (weekNumber) {
        router.push(`/supervisor/students/${studentId}?week=${weekNumber}`)
      } else {
        router.push(`/supervisor/students/${studentId}`)
      }
    }
  }

  return (
    <div 
      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={handleReviewNow}
    >
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
      <Button 
        size="sm" 
        variant="outline" 
        className="w-full mt-3 bg-transparent"
        onClick={(e) => {
          e.stopPropagation() // Prevent triggering parent onClick
          handleReviewNow()
        }}
      >
        Review Now
      </Button>
    </div>
  )
}

// ... existing icons ...
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
        <Button onClick={onSendMessage} className="bg-accent text-accent-foreground hover:bg-accent/90 self-end" aria-label="Send message">
          <SendIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
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
