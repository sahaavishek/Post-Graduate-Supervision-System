"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { useNotifications } from "@/lib/notifications-context"
import { meetingsAPI, progressAPI, documentsAPI, studentsAPI, messagesAPI, logbookAPI, getUploadUrl } from "@/lib/api"
import { useUser } from "@/lib/user-context"
import { Chatbot } from "@/components/chatbot"

export default function StudentDashboard() {
  const { user, loading: userLoading, refreshUser } = useUser()
  const { notifications } = useNotifications()
  const router = useRouter()
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [showSupervisorModal, setShowSupervisorModal] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showResourcesDialog, setShowResourcesDialog] = useState(false)
  const [showLogbookDialog, setShowLogbookDialog] = useState(false)
  const [logbook, setLogbook] = useState<any>(null)
  const [isLoadingLogbook, setIsLoadingLogbook] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [messages, setMessages] = useState<Array<{ type: string; text: string; time: string }>>([])
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [scheduleMeetingSubmitted, setScheduleMeetingSubmitted] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [meetingHistorySearch, setMeetingHistorySearch] = useState("")
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([])
  const [meetingsThisMonth, setMeetingsThisMonth] = useState(0)
  const [nextMeeting, setNextMeeting] = useState<string | null>(null)
  const [isLoadingStudentData, setIsLoadingStudentData] = useState(true)
  const [studentId, setStudentId] = useState<number | null>(null)
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([])

  const [weeklySubmissions, setWeeklySubmissions] = useState<any[]>([])
  const [weeklyTasks, setWeeklyTasks] = useState<any[]>([]) // Store weekly tasks from database
  const [studentData, setStudentData] = useState({
    name: "",
    program: "",
    progress: 0,
    startDate: "",
    expectedCompletion: "",
    milestones: [] as any[],
    recentActivities: [] as any[],
    meetingsThisMonth: 0,
    documentsSubmitted: 0,
    pendingReviews: 0,
    monthsRemaining: 0,
    lastMeeting: "Not scheduled",
    supervisor: {
      name: null as string | null,
      email: null as string | null,
      department: null as string | null,
      user_id: null as number | null,
      avatar: null as string | null,
      phone: null as string | null,
      position: null as string | null,
      office: null as string | null,
      research_interests: null as string | null,
      biography: null as string | null,
    },
  })
  const [meetingHistory, setMeetingHistory] = useState<any[]>([])
  const [supervisorResources, setSupervisorResources] = useState<any[]>([])
  
  // Refs to prevent duplicate calls and track loading state
  const isFetchingRef = useRef(false)
  const lastProgressRef = useRef<number | null>(null)
  const lastMilestonesRef = useRef<any[]>([])
  const isInitialLoadRef = useRef(true)

  // Fetch unread message count
  const fetchUnreadMessageCount = useCallback(async () => {
    if (!user?.user_id) return

    try {
      const response = await messagesAPI.getUnreadCount()
      setUnreadMessageCount(response.unreadCount || 0)
    } catch (error: any) {
      console.error('Error fetching unread message count:', error)
    }
  }, [user?.user_id])


  // Fetch messages with supervisor
  const fetchMessages = useCallback(async () => {
    if (!studentData.supervisor.user_id) return

    try {
      const response = await messagesAPI.getConversation(studentData.supervisor.user_id)
      const conversationMessages = response.messages || []
      
      // Transform messages to match the expected format
      // Note: sender_id and receiver_id in messages table reference users.id, not student.id
      const transformedMessages = conversationMessages.map((msg: any) => ({
        type: msg.sender_id === user?.user_id ? "sent" : "received",
        text: msg.content,
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }))
      
      setMessages(transformedMessages)
      
      // Refresh unread count after fetching messages (they get marked as read by backend)
      if (user?.user_id) {
        try {
          const countResponse = await messagesAPI.getUnreadCount()
          setUnreadMessageCount(countResponse.unreadCount || 0)
        } catch (error: any) {
          console.error('Error fetching unread count:', error)
        }
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error)
    }
  }, [studentData.supervisor.user_id, user?.user_id])

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast({
        title: "Cannot Send Empty Message",
        description: "Please type a message before sending.",
        variant: "destructive",
      })
      return
    }

    if (!studentData.supervisor.user_id) {
      toast({
        title: "Error",
        description: "Supervisor information is not available. Please contact support.",
        variant: "destructive",
      })
      return
    }

    try {
      await messagesAPI.send({
        receiver_id: studentData.supervisor.user_id,
        content: messageText.trim(),
      })

      // Refresh messages to show the new one
      await fetchMessages()

      setMessageText("")

      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${studentData.supervisor.name || 'your supervisor'}.`,
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

  // Fetch upcoming meetings
  const fetchUpcomingMeetings = async () => {
    try {
      const response = await meetingsAPI.getAll()
      const allMeetings = response.meetings || []

      // Get current date to filter upcoming meetings
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()

      // Filter upcoming meetings (only approved/confirmed, not pending, and date >= today)
      const upcoming = allMeetings
        .filter((m: any) => {
          const meetingDate = new Date(m.date)
          meetingDate.setHours(0, 0, 0, 0)
          // Only show approved or confirmed meetings (not pending)
          return (m.status === 'approved' || m.status === 'confirmed') && meetingDate >= today
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.date + ' ' + a.time)
          const dateB = new Date(b.date + ' ' + b.time)
          return dateA.getTime() - dateB.getTime()
        })
        .slice(0, 3) // Get only the next 3 meetings

      // Count meetings this month (only approved, confirmed, or completed - not pending)
      // This represents actual meetings that have happened or are scheduled
      const thisMonthMeetings = allMeetings.filter((m: any) => {
        const meetingDate = new Date(m.date)
        meetingDate.setHours(0, 0, 0, 0)
        const isThisMonth = meetingDate.getMonth() === currentMonth && 
                           meetingDate.getFullYear() === currentYear
        // Only count actual meetings: approved, confirmed, or completed (not pending or cancelled)
        const isActualMeeting = m.status === 'approved' || 
                               m.status === 'confirmed' || 
                               m.status === 'completed'
        return isThisMonth && isActualMeeting
      })

      // Format next meeting (only from approved/confirmed meetings)
      let nextMeetingText = null
      if (upcoming.length > 0) {
        const next = upcoming[0]
        const meetingDate = new Date(next.date)
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        let dateText = ''
        if (meetingDate.toDateString() === today.toDateString()) {
          dateText = 'Today'
        } else if (meetingDate.toDateString() === tomorrow.toDateString()) {
          dateText = 'Tomorrow'
        } else {
          dateText = meetingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
        
        const [hours, minutes] = next.time.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 || 12
        const timeText = `${displayHour}:${minutes.padStart(2, '0')} ${ampm}`
        
        nextMeetingText = `${dateText}, ${timeText}`
      }

      setUpcomingMeetings(upcoming)
      setMeetingsThisMonth(thisMonthMeetings.length)
      setNextMeeting(nextMeetingText)
      
      // Update studentData with meetings count
      setStudentData((prev) => ({
        ...prev,
        meetingsThisMonth: thisMonthMeetings.length,
        lastMeeting: upcoming.length > 0 ? "Upcoming" : "Not scheduled",
      }))
    } catch (error: any) {
      console.error('Error fetching upcoming meetings:', error)
    }
  }

  // Weekly submission topics mapping
  const weeklyTopics: { [key: number]: { title: string; dueDate: string } } = {
    1: { title: "Project Area and Faculty Supervisor Expert Briefing", dueDate: "2025-10-30" },
    2: { title: "Project Planning", dueDate: "2025-11-06" },
    3: { title: "Introduction", dueDate: "2025-11-13" },
    4: { title: "Literature Review", dueDate: "2025-11-20" },
    5: { title: "Methodology and Data Collection", dueDate: "2025-11-27" },
    6: { title: "Data Analysis and Results", dueDate: "2025-12-04" },
  }

  // Generate milestones from weekly tasks (LIVE DATA - only show weeks added by supervisor)
  const generateMilestones = (submissions: any[], weeklyTasks: any[] = []) => {
    // Only generate milestones for weeks that exist in weeklyTasks (added by supervisor)
    if (weeklyTasks.length === 0) {
      return [] // No weeks assigned yet
    }
    
    const submittedWeeks = submissions.filter((sub: any) => sub.status === 'submitted').length
    const currentDate = new Date()
    
    return weeklyTasks.map((task: any) => {
      const week = task.week_number
      const submission = submissions.find((sub: any) => sub.week_number === week)
      const isSubmitted = submission?.status === 'submitted'
      const dueDate = submission?.due_date ? new Date(submission.due_date) : (task.due_date ? new Date(task.due_date) : null)
      
      // Determine status
      let status = 'pending'
      if (isSubmitted) {
        status = 'completed'
      } else if (dueDate && currentDate >= dueDate) {
        status = 'in-progress' // Overdue
      } else if (week === submittedWeeks + 1 || (submittedWeeks === 0 && week === 1)) {
        status = 'in-progress' // Current week (next week to work on)
      }
      
      // Format date
      let dateText = ''
      if (isSubmitted && submission.submission_date) {
        const completedDate = new Date(submission.submission_date)
        dateText = `Completed: ${completedDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
      } else if (dueDate) {
        dateText = `Due: ${dueDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
      } else {
        dateText = `Week ${week}`
      }
      
      return {
        name: task.title || `Week ${week}`,
        progress: isSubmitted ? 100 : 0,
        status: status,
        date: dateText,
      }
    })
  }

  // Fetch student data
  const fetchStudentData = useCallback(async () => {
    if (userLoading || !user?.id || isFetchingRef.current) return

    try {
      isFetchingRef.current = true
      // Only set loading on initial load, not on refreshes
      if (isInitialLoadRef.current) {
        setIsLoadingStudentData(true)
        isInitialLoadRef.current = false
      }
      
      // Fetch student data (will return only current student's data)
      const studentsResponse = await studentsAPI.getAll()
      const students = studentsResponse.students || []
      
      if (students.length > 0) {
        const student = students[0]
        setStudentId(student.id)
        
        // Format dates
        const startDate = student.start_date 
          ? new Date(student.start_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
          : "N/A"
        const expectedCompletion = student.expected_completion
          ? new Date(student.expected_completion).toLocaleDateString("en-US", { month: "short", year: "numeric" })
          : "N/A"
        
        // Combine notifications for recent activities
        const notificationActivities = (allNotifications || []).slice(0, 5).map((notif: any) => ({
          type: 'notification',
          title: notif.title,
          description: notif.message,
          time: new Date(notif.created_at),
          formattedTime: new Date(notif.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          icon: notif.icon || '🔔',
        }))
        
        // Sort by time (most recent first), limit to 6 items
        const allActivities = notificationActivities
          .sort((a, b) => b.time.getTime() - a.time.getTime())
          .slice(0, 6)
          .map((activity: any) => ({
            title: activity.title,
            description: activity.description || '',
            time: activity.formattedTime,
            icon: activity.icon,
          }))
        
        const recentActivities = allActivities
        
        // Fetch weekly submissions to get actual submission count
        const submissionsResponse = await progressAPI.getWeeklySubmissions(student.id)
        const weeklySubmissions = submissionsResponse.submissions || []
        
        // Fetch documents to verify they still exist (documents might have been deleted)
        const docsResponse = await documentsAPI.getAll({ type: 'submission' })
        const allDocuments = docsResponse.documents || []
        
        // Create a map of week_number to document existence
        const documentsByWeek = new Map<number, boolean>()
        allDocuments.forEach((doc: any) => {
          if (doc.week_number) {
            documentsByWeek.set(doc.week_number, true)
          }
        })
        
        // Count actual submitted weekly submissions where document still exists
        const validSubmissions = weeklySubmissions.filter((sub: any) => {
          const hasStatus = sub.status === 'submitted'
          const hasDocument = documentsByWeek.has(sub.week_number)
          return hasStatus && hasDocument
        })
        const documentsSubmitted = validSubmissions.length
        
        // Count documents pending review (status: submitted or pending_review)
        const pendingReviews = allDocuments.filter((doc: any) => 
          doc.status === 'submitted' || doc.status === 'pending_review'
        ).length
        
        // Only update if values actually changed to prevent flickering
        setStudentData((prev) => {
          // Generate default milestones only if we don't have any yet (empty array if no tasks)
          const defaultMilestones = prev.milestones.length > 0 ? prev.milestones : generateMilestones([], [])
          
          // Calculate months remaining
          let monthsRemaining = 0
          if (student.expected_completion) {
            const today = new Date()
            const completionDate = new Date(student.expected_completion)
            const diffTime = completionDate.getTime() - today.getTime()
            const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
            monthsRemaining = Math.max(0, diffMonths)
          }
          
          // Check if we need to update
          const needsUpdate = 
            prev.name !== student.name ||
            prev.program !== student.program ||
            prev.startDate !== startDate ||
            prev.expectedCompletion !== expectedCompletion ||
            prev.documentsSubmitted !== documentsSubmitted ||
            prev.pendingReviews !== pendingReviews ||
            prev.monthsRemaining !== monthsRemaining ||
            prev.supervisor.name !== (student.supervisor_name || null) ||
            prev.supervisor.email !== (student.supervisor_email || null) ||
            prev.supervisor.department !== (student.supervisor_department || null) ||
            prev.supervisor.user_id !== (student.supervisor_user_id || null) ||
            prev.supervisor.avatar !== (student.supervisor_avatar || null) ||
            prev.supervisor.phone !== (student.supervisor_phone || null) ||
            prev.supervisor.position !== (student.supervisor_position || null) ||
            prev.supervisor.office !== (student.supervisor_office || null) ||
            prev.supervisor.research_interests !== (student.supervisor_research_interests || null) ||
            prev.supervisor.biography !== (student.supervisor_biography || null) ||
            JSON.stringify(prev.recentActivities) !== JSON.stringify(recentActivities)
          
          if (!needsUpdate && prev.milestones.length > 0) {
            return prev // No changes, return previous state
          }
          
          return {
            ...prev,
            name: student.name || "",
            program: student.program || "",
            startDate,
            expectedCompletion,
            milestones: defaultMilestones,
            recentActivities,
            documentsSubmitted,
            pendingReviews,
            monthsRemaining,
            supervisor: {
              name: student.supervisor_name || null,
              email: student.supervisor_email || null,
              department: student.supervisor_department || null,
              user_id: student.supervisor_user_id || null,
              avatar: student.supervisor_avatar || null,
              phone: student.supervisor_phone || null,
              position: student.supervisor_position || null,
              office: student.supervisor_office || null,
              research_interests: student.supervisor_research_interests || null,
              biography: student.supervisor_biography || null,
            },
          }
        })
      }
    } catch (error: any) {
      console.error('Error fetching student data:', error)
    } finally {
      setIsLoadingStudentData(false)
      isFetchingRef.current = false
    }
  }, [userLoading, user?.id])

  // Fetch weekly submissions
  const fetchWeeklySubmissions = useCallback(async () => {
    if (!user?.id) return

    try {
      const studentsResponse = await studentsAPI.getAll()
      const students = studentsResponse.students || []
      
      if (students.length > 0) {
        const student = students[0]
        
        // Fetch weekly tasks (weeks defined by supervisor) - LIVE DATA
        let weeklyTasks: any[] = []
        try {
          const tasksResponse = await progressAPI.getWeeklyTasks(student.id)
          weeklyTasks = tasksResponse.tasks || []
        } catch (error: any) {
          console.log('No weekly tasks found for this student:', error.message)
          weeklyTasks = []
        }
        
        const response = await progressAPI.getWeeklySubmissions(student.id)
        const submissions = response.submissions || []
        
        // Fetch documents to verify they still exist (documents might have been deleted)
        let existingDocuments: any[] = []
        try {
          const docsResponse = await documentsAPI.getAll({ type: 'submission' })
          existingDocuments = docsResponse.documents || []
        } catch (error: any) {
          console.log('Error fetching documents:', error.message)
          existingDocuments = []
        }
        
        // Create a map of week_number to document existence
        const documentsByWeek = new Map<number, boolean>()
        existingDocuments.forEach((doc: any) => {
          if (doc.week_number) {
            documentsByWeek.set(doc.week_number, true)
          }
        })
        
        const formattedSubmissions = submissions.map((sub: any) => {
          // Find the task for this week to get due date
          const task = weeklyTasks.find((t: any) => t.week_number === sub.week_number)
          // Only mark as submitted if document exists
          const hasDocument = documentsByWeek.has(sub.week_number)
          const isSubmitted = sub.status === 'submitted' && hasDocument
          return {
            week: sub.week_number,
            status: isSubmitted ? 'submitted' : 'pending',
            file: sub.file_name || null,
            submissionDate: sub.submission_date || null,
            dueDate: sub.due_date || (task?.due_date ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null),
          }
        })
        
        setWeeklySubmissions(formattedSubmissions)
        setWeeklyTasks(weeklyTasks) // Store weekly tasks for use in upload form
        
        // Calculate progress based on weekly tasks from database (not hardcoded 6 weeks)
        // Use the actual count of weeks, not the maximum week number
        const TOTAL_WEEKS = weeklyTasks.length
        // Only count submissions with status 'submitted' AND document still exists
        const validSubmissions = submissions.filter((sub: any) => {
          const hasStatus = sub.status === 'submitted'
          const hasDocument = documentsByWeek.has(sub.week_number)
          return hasStatus && hasDocument
        })
        const submittedWeeks = validSubmissions.length
        const calculatedProgress = TOTAL_WEEKS > 0 ? Math.round((submittedWeeks / TOTAL_WEEKS) * 100) : 0
        
        // Generate upcoming deadlines from weekly tasks (LIVE DATA) based on actual progress
        const currentDate = new Date()
        currentDate.setHours(0, 0, 0, 0)
        
        // Find the next week the student should work on
        // This is the first week that is not submitted, starting from week 1
        // (submittedWeeks is already calculated above)
        const nextWeekToWork = submittedWeeks + 1 // Next week to work on (1-indexed)
        
        // Use weekly tasks from database instead of hardcoded weeklyTopics
        const deadlines = weeklyTasks
          .map((task: any) => {
            const weekNum = task.week_number
            const dueDate = task.due_date ? new Date(task.due_date) : null
            if (!dueDate) return null
            
            dueDate.setHours(0, 0, 0, 0)
            const submission = submissions.find((s: any) => s.week_number === weekNum)
            const isSubmitted = submission?.status === 'submitted'
            
            // Only show deadlines for weeks that are:
            // 1. Not yet submitted
            // 2. Either the next week to work on, or a future week
            // 3. Due date is in the future (or very recent past, within 7 days)
            const daysUntilDue = Math.ceil((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
            const isNextWeek = weekNum === nextWeekToWork
            const isUpcomingWeek = weekNum > submittedWeeks && weekNum <= submittedWeeks + 3 // Show next 3 weeks
            
            if (!isSubmitted && (isNextWeek || (isUpcomingWeek && daysUntilDue >= -7))) {
              let priority = 'low'
              if (daysUntilDue <= 3 && daysUntilDue >= 0) {
                priority = 'high'
              } else if (daysUntilDue <= 7 && daysUntilDue >= 0) {
                priority = 'medium'
              } else if (daysUntilDue < 0) {
                priority = 'high' // Overdue
              }
              
              return {
                title: task.title,
                date: dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                priority,
                week: weekNum,
              }
            }
            return null
          })
          .filter((d): d is NonNullable<typeof d> => d !== null)
          .sort((a, b) => {
            // Sort by week number (next week first), then by date
            if (a.week === nextWeekToWork) return -1
            if (b.week === nextWeekToWork) return 1
            return a.week - b.week
          })
          .slice(0, 3) // Show top 3 upcoming deadlines
        
        setUpcomingDeadlines(deadlines)
        
        // Generate milestones from weekly tasks (LIVE DATA - only show weeks added by supervisor)
        const milestones = generateMilestones(submissions, weeklyTasks)
        
        // Only update if values actually changed to prevent flickering
        const milestonesChanged = JSON.stringify(milestones) !== JSON.stringify(lastMilestonesRef.current)
        const progressChanged = calculatedProgress !== lastProgressRef.current
        
        if (milestonesChanged || progressChanged) {
          lastProgressRef.current = calculatedProgress
          lastMilestonesRef.current = milestones
          
          setStudentData((prev) => ({
            ...prev,
            progress: calculatedProgress,
            milestones: milestones,
          }))
        }
      }
    } catch (error: any) {
      console.error('Error fetching weekly submissions:', error)
      // Even on error, generate empty milestones (no weeks assigned yet)
      const defaultMilestones = generateMilestones([], [])
      const milestonesChanged = JSON.stringify(defaultMilestones) !== JSON.stringify(lastMilestonesRef.current)
      
      if (milestonesChanged) {
        lastMilestonesRef.current = defaultMilestones
        setStudentData((prev) => ({
          ...prev,
          milestones: prev.milestones.length > 0 ? prev.milestones : defaultMilestones,
        }))
      }
    }
  }, [user?.id])

  // Fetch past meetings (meeting history)
  const fetchMeetingHistory = async () => {
    try {
      const response = await meetingsAPI.getAll()
      const allMeetings = response.meetings || []
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Filter past meetings (completed, cancelled, or date < today)
      const pastMeetings = allMeetings
        .filter((m: any) => {
          const meetingDate = new Date(m.date)
          meetingDate.setHours(0, 0, 0, 0)
          return m.status === 'completed' || m.status === 'cancelled' || meetingDate < today
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.date + ' ' + a.time)
          const dateB = new Date(b.date + ' ' + b.time)
          return dateB.getTime() - dateA.getTime() // Most recent first
        })
        .slice(0, 10) // Get last 10 meetings
        .map((m: any) => {
          const meetingDate = new Date(m.date)
          const [hours, minutes] = m.time.split(':')
          const hour = parseInt(hours)
          const ampm = hour >= 12 ? 'PM' : 'AM'
          const displayHour = hour % 12 || 12
          
          return {
            id: m.id,
            title: m.title,
            date: meetingDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            time: `${displayHour}:${minutes.padStart(2, '0')} ${ampm}`,
            duration: `${m.duration || 60} minutes`,
            status: m.status,
            supervisor: m.supervisor_name || "Supervisor",
            notes: m.notes || "",
          }
        })
      
      setMeetingHistory(pastMeetings)
    } catch (error: any) {
      console.error('Error fetching meeting history:', error)
    }
  }

  // Fetch supervisor resources
  const fetchSupervisorResources = async () => {
    try {
      const response = await documentsAPI.getAll({ type: 'resource' })
      const allDocuments = response.documents || []
      
      // Filter supervisor documents (documents uploaded by supervisor)
      // Include documents with supervisor_id and type 'resource' or 'document'
      // Can have student_id if uploaded for specific student, or no student_id for general resources
      const resources = allDocuments
        .filter((doc: any) => 
          doc.supervisor_id && (doc.type === 'resource' || doc.type === 'document')
        )
        .map((doc: any) => ({
          id: doc.id,
          documentId: doc.id, // For downloading
          title: doc.title || doc.file_name,
          fileName: doc.file_name,
          type: doc.file_type?.split('/')[1]?.toUpperCase() || "FILE",
          uploadedDate: doc.created_at ? new Date(doc.created_at).toISOString().split("T")[0] : "",
          url: `#`,
        }))
        .sort((a: any, b: any) => {
          // Sort by most recent first
          return new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime()
        })
      
      setSupervisorResources(resources)
    } catch (error: any) {
      console.error('Error fetching supervisor resources:', error)
    }
  }

  // Handler for message dialog open/close
  const handleMessageDialogChange = useCallback(async (open: boolean) => {
    setShowMessageDialog(open)
    
    if (open && studentData.supervisor.user_id) {
      // Dialog opened - fetch messages (they will be marked as read by backend)
      await fetchMessages()
    } else if (!open) {
      // Dialog closed - refresh unread count to ensure badge updates
      if (user?.user_id) {
        try {
          const countResponse = await messagesAPI.getUnreadCount()
          setUnreadMessageCount(countResponse.unreadCount || 0)
        } catch (error: any) {
          console.error('Error fetching unread count:', error)
        }
      }
    }
  }, [studentData.supervisor.user_id, user?.user_id, fetchMessages])

  // Fetch unread count on mount and when supervisor is available
  useEffect(() => {
    if (user?.user_id && studentData.supervisor.user_id) {
      fetchUnreadMessageCount()
    }
  }, [user?.user_id, studentData.supervisor.user_id, fetchUnreadMessageCount])

  useEffect(() => {
    // Wait for user to be fully loaded before fetching data
    if (!userLoading && user?.id) {
      // Fetch weekly submissions first to generate milestones immediately
      fetchWeeklySubmissions().then(() => {
        // Then fetch other data - only on mount/reload
        fetchStudentData()
        fetchUpcomingMeetings()
        fetchMeetingHistory()
        fetchSupervisorResources()
        fetchUnreadMessageCount()
      })
    }
    // If user is not loaded yet, wait a bit and try to refresh
    else if (!userLoading && !user) {
      // User might be logging in, wait a moment and refresh
      const timeout = setTimeout(() => {
        refreshUser()
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [user?.id, userLoading, fetchWeeklySubmissions, fetchStudentData, fetchUnreadMessageCount])

  const handleScheduleMeetingSuccess = () => {
    // Refresh upcoming meetings immediately
    fetchUpcomingMeetings()
    setScheduleMeetingSubmitted(true)
    setShowScheduleDialog(false)
    setTimeout(() => setScheduleMeetingSubmitted(false), 3000)
  }

  const handleScheduleMeetingCancel = () => {
    setShowScheduleDialog(false)
  }

  // Fetch logbook
  const fetchLogbook = useCallback(async () => {
    if (!studentId) return
    
    try {
      setIsLoadingLogbook(true)
      const response = await logbookAPI.get(studentId)
      setLogbook(response.logbook)
    } catch (error: any) {
      // Logbook doesn't exist yet, that's okay
      setLogbook(null)
    } finally {
      setIsLoadingLogbook(false)
    }
  }, [studentId])

  useEffect(() => {
    if (studentId) {
      fetchLogbook()
    }
  }, [studentId, fetchLogbook])

  // Handle logbook upload
  const handleLogbookUpload = async (file: File) => {
    if (!studentId) {
      toast({
        title: "Error",
        description: "Student data not loaded. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoadingLogbook(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await logbookAPI.upload(studentId, formData)
      
      // Update logbook state immediately with the response
      if (response.logbook) {
        setLogbook(response.logbook)
      } else {
        // If response doesn't have logbook, fetch it
        await fetchLogbook()
      }
      
      toast({
        title: "Logbook Uploaded",
        description: "Your logbook has been uploaded successfully.",
      })
      
      setShowLogbookDialog(false)
    } catch (error: any) {
      console.error('Logbook upload error:', error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logbook. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingLogbook(false)
    }
  }

  const handleDocumentUpload = async (weekNumber: number, file: File) => {
    if (!studentId) {
      toast({
        title: "Error",
        description: "Student data not loaded. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', `Week ${weekNumber} Submission`)
      formData.append('type', 'submission')
      formData.append('week_number', weekNumber.toString())

      const uploadResponse = await documentsAPI.upload(formData)

      // Update weekly submission record (same as documents page)
      await progressAPI.createWeeklySubmission({
        student_id: studentId,
        week_number: weekNumber,
        title: `Week ${weekNumber} Submission`,
        file_path: uploadResponse.document?.file_path || null,
        file_name: file.name,
      })
      
      // Refresh weekly submissions (this will also update progress in the backend)
      await fetchWeeklySubmissions()
      
      // Refresh student data to update document count and progress
      await fetchStudentData()
      
      // Refresh supervisor resources (in case supervisor uploaded something)
      await fetchSupervisorResources()
      
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully and your progress has been updated.",
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


  const { notifications: allNotifications, unreadCount, markAsRead, deleteNotification, clearAll } = useNotifications()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const filteredMeetingHistory = meetingHistory.filter(
    (meeting) =>
      meeting.title.toLowerCase().includes(meetingHistorySearch.toLowerCase()) ||
      meeting.date.toLowerCase().includes(meetingHistorySearch.toLowerCase()) ||
      meeting.supervisor.toLowerCase().includes(meetingHistorySearch.toLowerCase()) ||
      meeting.notes.toLowerCase().includes(meetingHistorySearch.toLowerCase()),
  )

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
    
    // Default navigation based on type for student role
    const basePath = '/student'
    switch (notif.type) {
      case 'meeting':
        router.push(`${basePath}/meetings`)
        break
      case 'document':
      case 'submission':
        router.push(`${basePath}/documents`)
        break
      case 'message':
        router.push(`${basePath}/dashboard`)
        break
      case 'progress':
      case 'reminder':
        router.push(`${basePath}/progress`)
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
    clearAll()
    toast({
      title: "All Notifications Marked as Read",
      description: `${unreadNotifs} notifications marked as read.`,
    })
  }

  // Show loading state while user is being loaded
  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error if user not loaded after loading completes
  if (!userLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load user data. Please try logging in again.</p>
          <Button onClick={() => window.location.href = "/"}>Go to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 border-b-2 border-border/50 bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80 shadow-elevation-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/student/dashboard" className="cursor-pointer">
              <h1 className="text-2xl font-bold text-foreground tracking-tight hover:opacity-80 transition-opacity">
                <span className="bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent bg-[length:200%_auto]">UTM</span><span className="ml-1">Gradient</span>
              </h1>
            </Link>
            <nav className="hidden md:flex gap-1">
              <Link 
                href="/student/dashboard" 
                className="text-sm font-medium px-4 py-2 rounded-lg text-foreground bg-muted/50 transition-smooth hover:bg-muted"
              >
                Dashboard
              </Link>
              <Link
                href="/student/meetings"
                className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
              >
                Meetings
              </Link>
              <Link
                href="/student/documents"
                className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
              >
                Documents
              </Link>
              <Link
                href="/student/progress"
                className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
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
                aria-label="Notifications"
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
                        onClick={() => {
                          notifications.forEach((n) => handleDeleteNotification(n.id))
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
              <Avatar className="cursor-pointer hover:opacity-80 transition-all duration-300 ring-2 ring-primary/20 hover:ring-primary/40 shadow-md hover:shadow-lg">
                <AvatarImage src={getUploadUrl(user?.avatar)} alt="Student" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                  {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'ST'}
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
        {/* Enhanced Success Alerts */}
        {scheduleMeetingSubmitted && (
          <Alert className="mb-6 bg-gradient-to-r from-success/10 to-success/5 border-2 border-success/30 shadow-lg rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <AlertDescription className="text-success font-semibold">
                Meeting request sent successfully to your supervisor!
              </AlertDescription>
            </div>
          </Alert>
        )}
        {uploadSuccess && (
          <Alert className="mb-6 bg-gradient-to-r from-success/10 to-success/5 border-2 border-success/30 shadow-lg rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <AlertDescription className="text-success font-semibold">
                Document uploaded successfully to your weekly submissions!
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Welcome Section with Gradient */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-2xl blur-3xl -z-10"></div>
          <div className="relative">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-3">
              Welcome back, {user?.name || studentData.name || "Student"}
            </h2>
            <p className="text-muted-foreground text-lg">Here's your research progress overview</p>
          </div>
        </div>


        {/* Enhanced Stats Grid with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Card className="group relative overflow-hidden border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Overall Progress</p>
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <TrendingUpIcon className="text-primary h-5 w-5" />
                </div>
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
                {studentData.progress}%
              </p>
              <Progress value={studentData.progress} className="h-3 bg-muted/50" aria-label={`Overall progress: ${studentData.progress}%`} />
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span>On track</span>
              </div>
            </div>
          </Card>

          <Card className="group relative overflow-hidden border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Meetings This Month</p>
                <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <CalendarIcon className="text-accent h-5 w-5" />
                </div>
              </div>
              <p className="text-4xl font-bold text-foreground mb-2">{meetingsThisMonth}</p>
              <div className="flex items-center gap-2 text-sm">
                {nextMeeting ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                    <p className="text-muted-foreground font-medium">Next: <span className="text-foreground">{nextMeeting}</span></p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No upcoming meetings</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="group relative overflow-hidden border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Documents Submitted</p>
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <FileTextIcon className="text-primary h-5 w-5" />
                </div>
              </div>
              <p className="text-4xl font-bold text-foreground mb-2">{studentData.documentsSubmitted}</p>
              <div className="flex items-center gap-2">
                {studentData.pendingReviews > 0 ? (
                  <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                    {studentData.pendingReviews} pending review{studentData.pendingReviews > 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-success mr-1.5"></div>
                    All reviewed
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Research Milestones - Enhanced */}
            <Card className="p-8 border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">Research Milestones</h3>
                  <p className="text-sm text-muted-foreground">Track your academic progress</p>
                </div>
                <Link href="/student/progress">
                  <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {isLoadingStudentData ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                    <p className="text-muted-foreground">Loading milestones...</p>
                  </div>
                ) : studentData.milestones.length > 0 ? (
                  studentData.milestones.map((milestone: any, index: number) => (
                    <MilestoneItem
                      key={index}
                      title={milestone.name}
                      status={milestone.status}
                      date={milestone.date}
                      progress={milestone.progress}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                      <FileTextIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No milestones available</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Activity - Enhanced */}
            <Card className="p-8 border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-1">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">Your latest updates and notifications</p>
              </div>
              <div className="space-y-3">
                {isLoadingStudentData ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading activities...</p>
                  </div>
                ) : studentData.recentActivities.length > 0 ? (
                  studentData.recentActivities.map((activity: any, index: number) => (
                    <ActivityItem
                      key={index}
                      icon={activity.icon ? <span className="text-lg">{activity.icon}</span> : <FileTextIcon />}
                      title={activity.title}
                      description={activity.description || ''}
                      time={activity.time}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                      <ClockIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No recent activities</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-8 border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">Meeting History</h3>
                  <p className="text-sm text-muted-foreground">Past and upcoming meetings</p>
                </div>
                <Link href="/student/meetings">
                  <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow">
                    View All
                  </Button>
                </Link>
              </div>

              {/* Enhanced Search bar */}
              <div className="mb-6 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Input
                  placeholder="Search meetings by title, date, or notes..."
                  value={meetingHistorySearch}
                  onChange={(e) => setMeetingHistorySearch(e.target.value)}
                  className="w-full pl-10 border-2 focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-3">
                {filteredMeetingHistory.length > 0 ? (
                  filteredMeetingHistory.slice(0, 3).map((meeting) => (
                    <div
                      key={meeting.id}
                      className="group p-5 border-2 border-border rounded-xl hover:border-primary/30 hover:shadow-md bg-gradient-to-r from-card to-card/50 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{meeting.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            <span>{meeting.date} at {meeting.time}</span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{meeting.duration}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-success/10 text-success border-success/20 shadow-sm">
                          {meeting.status}
                        </Badge>
                      </div>
                      {meeting.notes && (
                        <p className="text-sm text-muted-foreground mb-2 pl-1 border-l-2 border-primary/20">{meeting.notes}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                        <span>With: {meeting.supervisor}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                      <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No meetings found</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 relative z-10">
            {/* Supervisor Info - Enhanced */}
            <Card className="p-6 border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl -z-0"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                  Your Supervisor
                </h3>
                {studentData.supervisor.name ? (
                  <>
                    <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors">
                      <Avatar className="h-14 w-14 ring-2 ring-primary/20 shadow-md">
                        <AvatarImage src={getUploadUrl(studentData.supervisor.avatar)} alt="Supervisor" />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                          {studentData.supervisor.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="cursor-pointer flex-1 hover:opacity-80 transition-opacity"
                        onClick={() => setShowSupervisorModal(true)}
                      >
                        <p className="font-semibold text-foreground text-base">{studentData.supervisor.name}</p>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
                          {studentData.supervisor.department || "No department"}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Dialog open={showMessageDialog} onOpenChange={handleMessageDialogChange}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full bg-card/80 backdrop-blur-sm border-2 border-border hover:border-primary hover:bg-primary/10 hover:text-primary relative shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer" size="sm">
                            <MessageSquareIcon className="mr-2 h-4 w-4" />
                            Send Message
                            {unreadMessageCount > 0 && (
                              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-bold shadow-lg animate-pulse">
                                {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                              </span>
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] max-h-[600px] flex flex-col">
                          <DialogHeader>
                            <DialogTitle>Message {studentData.supervisor.name}</DialogTitle>
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
                          <Button variant="outline" className="w-full bg-card/80 backdrop-blur-sm border-2 border-border hover:border-primary hover:bg-primary/10 hover:text-primary shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer" size="sm">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            Schedule Meeting
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Schedule a Meeting</DialogTitle>
                          </DialogHeader>
                          <MeetingRequestForm 
                            onSuccess={handleScheduleMeetingSuccess}
                            onCancel={handleScheduleMeetingCancel}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                      <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="text-muted-foreground mb-2 font-medium">No supervisor assigned</p>
                    <p className="text-sm text-muted-foreground">Please wait for a supervisor to add you to their supervision.</p>
                  </div>
                )}
              </div>
            </Card>

            <Dialog open={showSupervisorModal} onOpenChange={setShowSupervisorModal}>
              <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Supervisor Profile
                    </DialogTitle>
                  </DialogHeader>
                  <SupervisorInfoModal onClose={() => setShowSupervisorModal(false)} supervisor={studentData.supervisor} />
              </DialogContent>
            </Dialog>


            {/* Upcoming Deadlines - Enhanced */}
            <Card className="p-6 border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl -z-0"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-accent to-primary rounded-full"></div>
                  Upcoming Deadlines
                </h3>
                <div className="space-y-3">
                  {upcomingDeadlines.length > 0 ? (
                    upcomingDeadlines.map((deadline, index) => (
                      <DeadlineItem 
                        key={index}
                        title={deadline.title} 
                        date={deadline.date} 
                        priority={deadline.priority} 
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                        <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Quick Actions - Enhanced */}
            <Card className="p-6 border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-card/80 backdrop-blur-sm border-2 border-border hover:border-primary hover:bg-primary/10 hover:text-primary shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group" size="sm">
                      <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/25 mr-2 transition-colors duration-200">
                        <UploadIcon className="h-4 w-4 text-primary" />
                      </div>
                      Upload Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Upload Document</DialogTitle>
                    </DialogHeader>
                    <UploadDocumentForm 
                      onSubmit={handleDocumentUpload} 
                      weeklySubmissions={weeklySubmissions}
                      weeklyTasks={weeklyTasks}
                      onCancel={() => {
                        setShowUploadDialog(false)
                      }}
                    />
                  </DialogContent>
                </Dialog>


                <Dialog open={showResourcesDialog} onOpenChange={setShowResourcesDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-card/80 backdrop-blur-sm border-2 border-border hover:border-primary hover:bg-primary/10 hover:text-primary shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group" size="sm">
                      <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/25 mr-2 transition-colors duration-200">
                        <BookOpenIcon className="h-4 w-4 text-primary" />
                      </div>
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
                <div className="space-y-4">
                  {isLoadingLogbook ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Loading logbook...</p>
                    </div>
                  ) : logbook ? (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all duration-200">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                            <BookOpenIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{logbook.file_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Version {logbook.version} • {logbook.uploaded_by_name} ({logbook.uploaded_by_role === 'student' ? 'You' : 'Supervisor'})
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(logbook.created_at).toLocaleDateString("en-US", { 
                                year: "numeric", 
                                month: "long", 
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 flex-shrink-0 ml-2"
                          onClick={async () => {
                            if (!studentId) return
                            try {
                              await logbookAPI.download(studentId, logbook.file_name)
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
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    <Dialog open={showLogbookDialog} onOpenChange={setShowLogbookDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <UploadIcon className="mr-2 h-4 w-4" />
                          Upload New Version
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Upload Logbook</DialogTitle>
                        </DialogHeader>
                        <LogbookUploadForm 
                          onSubmit={handleLogbookUpload}
                          onCancel={() => setShowLogbookDialog(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                      <BookOpenIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">No logbook uploaded yet</p>
                    <Dialog open={showLogbookDialog} onOpenChange={setShowLogbookDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <UploadIcon className="mr-2 h-4 w-4" />
                          Upload Logbook
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Upload Logbook</DialogTitle>
                        </DialogHeader>
                        <LogbookUploadForm 
                          onSubmit={handleLogbookUpload}
                          onCancel={() => setShowLogbookDialog(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
              </div>
            </Card>

          </div>
        </div>
      </main>
      <Chatbot role="student" />
    </div>
  )
}

function SupervisorInfoModal({ 
  onClose,
  supervisor 
}: { 
  onClose: () => void
  supervisor: {
    name: string | null
    email: string | null
    department: string | null
    avatar: string | null
    phone: string | null
    position: string | null
    office: string | null
    research_interests: string | null
    biography: string | null
  }
}) {
  return (
    <div className="max-h-[70vh] overflow-y-auto pr-2 -mr-2">
      {/* Header Card */}
      <div className="flex items-center gap-4 p-4 mb-6 border-b border-border">
        <Avatar className="h-16 w-16">
              <AvatarImage src={getUploadUrl(supervisor.avatar)} alt="Supervisor" />
          <AvatarFallback className="bg-muted text-foreground">
                {supervisor.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'SV'}
              </AvatarFallback>
            </Avatar>
          <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">{supervisor.name || "Unknown Supervisor"}</h3>
          <p className="text-sm text-muted-foreground mb-1">{supervisor.position || "Position not specified"}</p>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded-md">
            <span className="text-xs text-foreground">{supervisor.department || "Department not specified"}</span>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-foreground mb-3">Contact Information</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3 py-2">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm text-foreground">{supervisor.email || "Not provided"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm text-foreground">{supervisor.phone || "Not provided"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Office</p>
              <p className="text-sm text-foreground">{supervisor.office || "Not provided"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Research Interests */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-foreground mb-3">Research Interests</h4>
        <div className="p-3 bg-muted/30 rounded-lg border border-border">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {supervisor.research_interests || "No research interests specified."}
          </p>
        </div>
      </div>

      {/* Biography */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Biography</h4>
        <div className="p-3 bg-muted/30 rounded-lg border border-border">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {supervisor.biography || "No biography available."}
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
        <Button onClick={onSendMessage} className="bg-accent text-accent-foreground hover:bg-accent/90 self-end" aria-label="Send message">
          <SendIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function UploadDocumentForm({
  onSubmit,
  weeklySubmissions,
  weeklyTasks,
  onCancel,
}: { 
  onSubmit: (week: number, file: File) => void
  weeklySubmissions: any[]
  weeklyTasks: any[]
  onCancel: () => void
}) {
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

  const handleCancel = () => {
    setSelectedWeek("")
    setUploadFile(null)
    onCancel()
  }

  // Use weeklyTasks from database (same as documents page) instead of hardcoded weeks
  const availableWeeks = weeklyTasks.length > 0 
    ? weeklyTasks.map((task: any) => task.week_number).sort((a: number, b: number) => a - b)
    : []

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Select Week</label>
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger>
            <SelectValue placeholder="Choose which week to submit" />
          </SelectTrigger>
          <SelectContent>
            {availableWeeks.length > 0 ? (
              availableWeeks.map((week: number) => {
                const submitted = weeklySubmissions.find((s) => s.week === week)
                const task = weeklyTasks.find((t: any) => t.week_number === week)
                return (
                  <SelectItem key={week} value={week.toString()}>
                    Week {week} - {task?.title || 'Submission'} {submitted?.status === 'submitted' ? "(Resubmit)" : ""}
                  </SelectItem>
                )
              })
            ) : (
              <SelectItem value="" disabled>No weeks available. Please contact your supervisor.</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Upload File</label>
        <Input 
          type="file" 
          accept=".pdf,.docx,.doc"
          onChange={(e) => setUploadFile(e.target.files?.[0] || null)} 
          required 
        />
        {uploadFile && <p className="text-sm text-muted-foreground">Selected: {uploadFile.name}</p>}
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={handleCancel}>
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

function MeetingRequestForm({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) {
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [duration, setDuration] = useState("")
  const [meetingType, setMeetingType] = useState("")
  const [meetingLink, setMeetingLink] = useState("")
  const [agenda, setAgenda] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeError, setTimeError] = useState("")
  const { toast } = useToast()

  // Calculate max time based on duration
  const getMaxTime = () => {
    if (!duration) return "17:00"
    const durationMinutes = parseInt(duration)
    const maxEndTime = 1020 // 5:00 PM in minutes
    const maxStartTime = maxEndTime - durationMinutes
    if (maxStartTime < 480) return "08:00" // Can't start before 8 AM
    const maxHour = Math.floor(maxStartTime / 60)
    const maxMin = maxStartTime % 60
    return `${String(maxHour).padStart(2, '0')}:${String(maxMin).padStart(2, '0')}`
  }

  // Validate time when it changes
  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    setTimeError("")
    
    if (!newTime || !duration) return
    
    const [hours, minutes] = newTime.split(':')
    const hour = parseInt(hours)
    const minute = parseInt(minutes)
    const startTimeMinutes = hour * 60 + minute
    const durationMinutes = parseInt(duration)
    const endTimeMinutes = startTimeMinutes + durationMinutes

    // Check if end time exceeds 5:00 PM
    if (endTimeMinutes > 1020) {
      const maxStartTime = 1020 - durationMinutes
      const maxHour = Math.floor(maxStartTime / 60)
      const maxMin = maxStartTime % 60
      const maxTime12Hour = maxHour > 12 ? `${maxHour - 12}:${String(maxMin).padStart(2, '0')} PM` : maxHour === 12 ? `12:${String(maxMin).padStart(2, '0')} PM` : `${maxHour}:${String(maxMin).padStart(2, '0')} AM`
      setTimeError(`Meeting will end after 5:00 PM. Latest start time: ${maxTime12Hour}`)
    }
  }

  // Validate time when duration changes
  const handleDurationChange = (newDuration: string) => {
    setDuration(newDuration)
    setTimeError("")
    
    if (!time || !newDuration) return
    
    // Re-validate time with new duration
    handleTimeChange(time)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check each field individually to provide better error messages
    if (!title) {
      toast({
        title: "Validation Error",
        description: "Please enter a meeting title.",
        variant: "destructive",
      })
      return
    }
    
    if (!date) {
      toast({
        title: "Validation Error",
        description: "Please select a meeting date.",
        variant: "destructive",
      })
      return
    }
    
    if (!time) {
      toast({
        title: "Validation Error",
        description: "Please select a meeting time.",
        variant: "destructive",
      })
      return
    }
    
    if (!duration) {
      toast({
        title: "Validation Error",
        description: "Please select a meeting duration.",
        variant: "destructive",
      })
      return
    }
    
    if (!meetingType) {
      toast({
        title: "Validation Error",
        description: "Please select a meeting type (In-Person or Online).",
        variant: "destructive",
      })
      return
    }
    
    if (!agenda) {
      toast({
        title: "Validation Error",
        description: "Please provide an agenda or purpose for the meeting.",
        variant: "destructive",
      })
      return
    }

    // Validate date is not in the past
    const selectedDate = new Date(date)
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
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const minute = parseInt(minutes)
    const startTimeMinutes = hour * 60 + minute

    // 8:00 AM = 480 minutes, 5:00 PM = 1020 minutes
    if (startTimeMinutes < 480 || startTimeMinutes >= 1020) {
      toast({
        title: "Invalid Time",
        description: "Meetings can only start between 8:00 AM and 5:00 PM.",
        variant: "destructive",
      })
      return
    }

    // Validate that meeting end time doesn't exceed 5:00 PM
    const durationMinutes = parseInt(duration)
    const endTimeMinutes = startTimeMinutes + durationMinutes

    // 5:00 PM = 1020 minutes (17:00)
    if (endTimeMinutes > 1020) {
      const maxStartTime = 1020 - durationMinutes
      const maxHour = Math.floor(maxStartTime / 60)
      const maxMin = maxStartTime % 60
      const maxTime12Hour = maxHour > 12 ? `${maxHour - 12}:${String(maxMin).padStart(2, '0')} PM` : `${maxHour}:${String(maxMin).padStart(2, '0')} AM`
      
      toast({
        title: "Invalid Time",
        description: `With a duration of ${durationMinutes} minutes, the meeting must start by ${maxTime12Hour} to end by 5:00 PM. Please select an earlier start time.`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await meetingsAPI.create({
        title,
        date,
        time,
        duration: parseInt(duration),
        type: meetingType,
        meeting_link: meetingLink || undefined,
        agenda,
      })

      setIsSubmitting(false)

      // Reset form
      setTitle("")
      setDate("")
      setTime("")
      setDuration("")
      setMeetingType("")
      setMeetingLink("")
      setAgenda("")

      toast({
        title: "Meeting Request Sent",
        description: "Your meeting request has been sent to your supervisor.",
      })

      // Close dialog immediately after successful submission
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Form submission error:', error)
      setIsSubmitting(false)
      toast({
        title: "Error",
        description: error.message || "Failed to schedule meeting. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="meeting-title">Meeting Title</Label>
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
          <Label htmlFor="meeting-date">Preferred Date</Label>
          <Input 
            id="meeting-date" 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            min={new Date().toISOString().split('T')[0]}
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meeting-time">Preferred Time</Label>
          <Input 
            id="meeting-time" 
            type="time" 
            value={time} 
            onChange={(e) => handleTimeChange(e.target.value)} 
            min="08:00"
            max={getMaxTime()}
            required 
          />
          <p className="text-xs text-muted-foreground">
            Available: 8:00 AM - 5:00 PM{duration ? ` (Latest start: ${(() => {
              const maxTime = getMaxTime()
              const [h, m] = maxTime.split(':')
              const hour = parseInt(h)
              const min = parseInt(m)
              if (hour === 17 && min === 0) return '5:00 PM'
              const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
              const ampm = hour >= 12 ? 'PM' : 'AM'
              return `${displayHour}:${String(min).padStart(2, '0')} ${ampm}`
            })()})` : ''}
          </p>
          {timeError && (
            <p className="text-xs text-destructive mt-1">{timeError}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meeting-duration">Duration</Label>
        <Select value={duration} onValueChange={handleDurationChange}>
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
        <Label htmlFor="meeting-type">Meeting Type *</Label>
        <Select value={meetingType} onValueChange={setMeetingType}>
          <SelectTrigger id="meeting-type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in-person">In-Person</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {meetingType === "online" && (
        <div className="space-y-2">
          <Label htmlFor="meeting-link">Meeting Link (Optional)</Label>
          <Input
            id="meeting-link"
            type="url"
            placeholder="https://meet.google.com/xxx-xxxx-xxx or https://zoom.us/j/xxxxx"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
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

      <div className="flex gap-2 justify-end pt-4">
        <Button 
          type="button" 
          variant="outline" 
          disabled={isSubmitting}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (onCancel) {
              onCancel()
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-accent text-accent-foreground hover:bg-accent/90" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send Request"}
        </Button>
      </div>
    </form>
  )
}


function ViewResourcesDialog({ resources }: { resources: any[] }) {
  const { toast } = useToast()
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const handleDownload = async (resource: any) => {
    if (!resource.documentId) {
      toast({
        title: "Error",
        description: "Document ID not available.",
        variant: "destructive",
      })
      return
    }

    try {
      setDownloadingId(resource.documentId)
      await documentsAPI.download(resource.documentId, resource.fileName || resource.title)
      toast({
        title: "Download Started",
        description: `${resource.title} is being downloaded.`,
      })
    } catch (error: any) {
      console.error('Error downloading document:', error)
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDownloadingId(null)
    }
  }

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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-accent hover:text-accent/80"
                  onClick={() => handleDownload(resource)}
                  disabled={downloadingId === resource.documentId}
                >
                  {downloadingId === resource.documentId ? "Downloading..." : "Download"}
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-accent hover:text-accent/80"
                  onClick={() => handleDownload(resource)}
                  disabled={downloadingId === resource.documentId}
                >
                  {downloadingId === resource.documentId ? "Downloading..." : "Download"}
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


function MilestoneItem({
  title,
  status,
  date,
  progress,
}: { title: string; status: string; date: string; progress: number }) {
  const statusColors = {
    completed: "bg-success/10 text-success border-success/20 shadow-success/5",
    "in-progress": "bg-info/10 text-info border-info/20 shadow-info/5",
    pending: "bg-muted/50 text-muted-foreground border-border/50",
  }

  const statusIcons = {
    completed: "✓",
    "in-progress": "⟳",
    pending: "○",
  }

  return (
    <div className="group flex items-center gap-4 p-5 rounded-xl border-2 border-border hover:border-primary/30 hover:shadow-md bg-gradient-to-r from-card to-card/50 transition-all duration-300">
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-lg font-bold text-primary group-hover:scale-110 transition-transform">
        {statusIcons[status as keyof typeof statusIcons] || "○"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{title}</h4>
          <Badge className={`${statusColors[status as keyof typeof statusColors]} border shadow-sm`} variant="secondary">
            {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{date}</p>
        </div>
        <div className="space-y-1.5">
          <Progress value={progress} className="h-2.5 bg-muted/50" aria-label={`${title} progress: ${progress}%`} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-sm font-bold text-foreground">{progress}%</span>
          </div>
        </div>
      </div>
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
    <div className="group flex gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-md bg-gradient-to-r from-card/50 to-card transition-all duration-300">
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ClockIcon className="h-3 w-3" />
          <span>{time}</span>
        </div>
      </div>
    </div>
  )
}

function DeadlineItem({ title, date, priority }: { title: string; date: string; priority: string }) {
  const priorityColors = {
    high: "bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/50",
    medium: "bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-yellow-500/50",
    low: "bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/50",
  }

  const priorityBorders = {
    high: "border-red-500/30 hover:border-red-500/50",
    medium: "border-yellow-500/30 hover:border-yellow-500/50",
    low: "border-green-500/30 hover:border-green-500/50",
  }

  return (
    <div className={`group flex items-center gap-4 p-4 rounded-xl border-2 ${priorityBorders[priority as keyof typeof priorityBorders]} hover:shadow-md bg-gradient-to-r from-card to-card/50 transition-all duration-300`}>
      <div className={`relative flex-shrink-0 w-3 h-3 rounded-full ${priorityColors[priority as keyof typeof priorityColors]} shadow-lg animate-pulse`}>
        <div className={`absolute inset-0 rounded-full ${priorityColors[priority as keyof typeof priorityColors]} opacity-75 animate-ping`}></div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">{title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarIcon className="h-3 w-3" />
          <span className="font-medium">{date}</span>
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

function LogbookUploadForm({ onSubmit, onCancel }: { 
  onSubmit: (file: File) => Promise<void>
  onCancel: () => void
}) {
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (uploadFile) {
      setIsUploading(true)
      try {
        await onSubmit(uploadFile)
        setUploadFile(null)
      } catch (error) {
        // Error is handled in parent component
      } finally {
        setIsUploading(false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="logbook-file">Upload Logbook File</Label>
        <Input 
          id="logbook-file"
          type="file" 
          accept=".pdf,.docx,.doc,.xls,.xlsx"
          onChange={(e) => setUploadFile(e.target.files?.[0] || null)} 
          required 
        />
        {uploadFile && (
          <p className="text-sm text-muted-foreground">Selected: {uploadFile.name}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Accepted formats: PDF, DOC, DOCX, XLS, XLSX (Max 10MB)
        </p>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={!uploadFile || isUploading}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </form>
  )
}

function DownloadIcon({ className }: { className?: string }) {
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
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
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
