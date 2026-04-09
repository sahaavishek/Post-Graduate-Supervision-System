"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  GraduationCap,
  UserCheck,
  FileText,
  Search,
  MoreVertical,
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Bell,
  Settings,
  Clock,
  Target,
  BookOpen,
  BarChart3,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useNotifications } from "@/lib/notifications-context"
import { studentsAPI, supervisorsAPI, usersAPI, progressAPI, meetingsAPI, documentsAPI, notificationsAPI, getUploadUrl } from "@/lib/api"
import { useUser } from "@/lib/user-context"
import { DownloadReportButton } from "@/components/download-report-button"
import { Chatbot } from "@/components/chatbot"

export default function AdminDashboard() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, clearAll } = useNotifications()

  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [realStudents, setRealStudents] = useState<any[]>([])
  const [realSupervisors, setRealSupervisors] = useState<any[]>([])
  const [realStats, setRealStats] = useState({
    totalStudents: 0,
    activeSupervisors: 0,
    pendingReviews: 0,
    completionRate: 0,
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [selectedStudentData, setSelectedStudentData] = useState<any>(null)
  const [viewProgressOpen, setViewProgressOpen] = useState(false)
  const [progressStudentData, setProgressStudentData] = useState<any>(null)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [selectedSupervisor, setSelectedSupervisor] = useState<any>(null)
  const [editProfileData, setEditProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null)
  const [viewStudentsOpen, setViewStudentsOpen] = useState(false)
  const [supervisorStudents, setSupervisorStudents] = useState<any[]>([])
  const [adjustCapacityOpen, setAdjustCapacityOpen] = useState(false)
  const [newCapacity, setNewCapacity] = useState(0)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [addUserMode, setAddUserMode] = useState<"new" | "existing">("new")
  const [newUserData, setNewUserData] = useState({
    role: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    program: "",
    department: "",
    supervisor_id: "",
  })
  const [isAddingUser, setIsAddingUser] = useState(false)

  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return "Just now"
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`
    }
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`
  }

  // Fetch recent activities
  const fetchRecentActivities = useCallback(async (studentsList: any[]) => {
    try {
      const activities: any[] = []
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // 1. Get recent student registrations (last 7 days)
      try {
        const allUsers = await usersAPI.getAll({ role: "student" })
        const recentStudents = (allUsers.users || [])
          .filter((user: any) => {
            if (!user.created_at) return false
            const createdDate = new Date(user.created_at)
            return createdDate >= oneWeekAgo
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(a.created_at || 0)
            const dateB = new Date(b.created_at || 0)
            return dateB.getTime() - dateA.getTime()
          })
          .slice(0, 3) // Get 3 most recent

        recentStudents.forEach((user: any) => {
          activities.push({
            id: `registration-${user.id}`,
            type: "registration",
            message: `New student registration: ${user.name}`,
            time: formatTimeAgo(new Date(user.created_at)),
            icon: Users,
            timestamp: new Date(user.created_at).getTime(),
          })
        })
      } catch (error) {
        console.error("Error fetching recent registrations:", error)
      }

      // 2. Get completed milestones (from all students)
      try {
        const completedMilestones: any[] = []
        for (const student of studentsList.slice(0, 10)) { // Limit to first 10 students to avoid too many API calls
          try {
            const milestonesResponse = await progressAPI.getMilestones(student.id)
            const milestones = milestonesResponse.milestones || []
            const completed = milestones
              .filter((m: any) => m.status === "completed" && m.completed_date)
              .map((m: any) => ({
                ...m,
                studentName: student.name,
                completedDate: new Date(m.completed_date),
              }))
            completedMilestones.push(...completed)
          } catch (error) {
            // Skip if error fetching milestones for this student
            continue
          }
        }

        const recentMilestones = completedMilestones
          .filter((m) => m.completedDate >= oneWeekAgo)
          .sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime())
          .slice(0, 2) // Get 2 most recent

        recentMilestones.forEach((milestone: any) => {
          activities.push({
            id: `milestone-${milestone.id}`,
            type: "milestone",
            message: `${milestone.studentName} completed ${milestone.name} milestone`,
            time: formatTimeAgo(milestone.completedDate),
            icon: CheckCircle2,
            timestamp: milestone.completedDate.getTime(),
          })
        })
      } catch (error) {
        console.error("Error fetching milestones:", error)
      }

      // 3. Check for students behind schedule
      try {
        const behindSchedule = studentsList.filter(
          (s: any) => s.progress < 50 && s.status === "active"
        )
        if (behindSchedule.length > 0) {
          activities.push({
            id: "alert-behind-schedule",
            type: "alert",
            message: `${behindSchedule.length} student${behindSchedule.length === 1 ? "" : "s"} behind schedule - requires attention`,
            time: formatTimeAgo(new Date(now.getTime() - 24 * 60 * 60 * 1000)), // 1 day ago
            icon: AlertCircle,
            timestamp: now.getTime() - 24 * 60 * 60 * 1000,
          })
        }
      } catch (error) {
        console.error("Error checking behind schedule:", error)
      }

      // 4. Get meetings scheduled this week
      try {
        const meetingsResponse = await meetingsAPI.getAll()
        const allMeetings = meetingsResponse.meetings || []
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0)
        
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 7)

        const meetingsThisWeek = allMeetings.filter((meeting: any) => {
          if (!meeting.date) return false
          const meetingDate = new Date(meeting.date)
          return meetingDate >= startOfWeek && meetingDate < endOfWeek
        })

        if (meetingsThisWeek.length > 0) {
          activities.push({
            id: "meetings-this-week",
            type: "meeting",
            message: `${meetingsThisWeek.length} supervision meeting${meetingsThisWeek.length === 1 ? "" : "s"} scheduled this week`,
            time: formatTimeAgo(startOfWeek),
            icon: Calendar,
            timestamp: startOfWeek.getTime(),
          })
        }
      } catch (error) {
        console.error("Error fetching meetings:", error)
      }

      // Sort activities by timestamp (most recent first) and limit to 4
      const sortedActivities = activities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 4)

      setRecentActivities(sortedActivities)
    } catch (error) {
      console.error("Error fetching recent activities:", error)
      // Set empty array on error
      setRecentActivities([])
    }
  }, [])


  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (isBackgroundRefresh = false) => {
    if (userLoading || !user?.id) return

    try {
      // Only show loading state on initial load, not on background refreshes
      if (!isBackgroundRefresh) {
        setIsLoadingData(true)
      }

      // Fetch students (filter to active only for cleaner dashboard view)
      const studentsResponse = await studentsAPI.getAll({ status: 'active' })
      const studentsList = studentsResponse.students || []
      // Double-check: Filter to only active students (in case API doesn't filter properly)
      const activeStudentsList = studentsList.filter((student: any) => {
        const isActive = student.user_status === "active"
        if (!isActive) {
          console.log('Filtered out inactive student:', student.name, student.email, 'Status:', student.user_status)
        }
        return isActive
      })
      
      // Calculate status based on weekly tasks and overdue dates
      const transformedStudents = await Promise.all(activeStudentsList.map(async (student: any) => {
        let calculatedProgress = 0
        let progressStatus: string | null = null
        
        try {
          // Fetch weekly tasks
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
          
          // Calculate progress
          const taskCount = weeklyTasks.length > 0 ? Math.max(...weeklyTasks.map((t: any) => t.week_number)) : 0
          const TOTAL_WEEKS = taskCount || 1
          const submittedWeeks = validSubmissions.length
          calculatedProgress = TOTAL_WEEKS > 0 ? Math.round((submittedWeeks / TOTAL_WEEKS) * 100) : 0
          
          // Calculate status: only set status if weekly tasks exist
          if (weeklyTasks.length > 0) {
            const currentDate = new Date()
            currentDate.setHours(0, 0, 0, 0)
            
            // Check if any task has a due date that has passed and is not submitted
            const hasOverdueTask = weeklyTasks.some((task: any) => {
              if (!task.due_date) return false
              
              const dueDate = new Date(task.due_date)
              dueDate.setHours(0, 0, 0, 0)
              
              if (currentDate > dueDate) {
                const isSubmitted = validSubmissions.some((sub: any) => sub.week_number === task.week_number)
                return !isSubmitted
              }
              return false
            })
            
            progressStatus = hasOverdueTask ? "needs-attention" : "on-track"
          }
        } catch (error: any) {
          console.error(`Error calculating progress for student ${student.id}:`, error)
          calculatedProgress = student.progress || 0
        }
        
        return {
          id: student.id,
          user_id: student.user_id,
          name: student.name || "N/A",
          email: student.email || "",
          supervisor: student.supervisor_name || "Unassigned",
          program: student.program || "N/A",
          progress: calculatedProgress,
          status: "active", // User status is always active (filtered above)
          progressStatus, // Progress-based status for badge display
          enrollmentDate: student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A",
          startDate: student.start_date ? new Date(student.start_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A",
          expectedCompletion: student.expected_completion ? new Date(student.expected_completion).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "TBD",
          milestones: [], // Can be fetched separately if needed
          documentsSubmitted: 0, // Can be calculated from documents API
          pendingReviews: 0, // Can be calculated from documents API
          meetingsThisMonth: 0, // Can be calculated from meetings API
          lastMeeting: "N/A",
        }
      }))
      setRealStudents(transformedStudents)

      // Fetch supervisors (only active for admin dashboard)
      const supervisorsResponse = await supervisorsAPI.getAll({ status: 'active' })
      const supervisorsList = supervisorsResponse.supervisors || []
      // Additional filter to ensure only active supervisors (double-check)
      const activeSupervisorsList = supervisorsList.filter((supervisor: any) => supervisor.user_status === "active")
      const transformedSupervisors = activeSupervisorsList.map((supervisor: any) => ({
        id: supervisor.id,
        user_id: supervisor.user_id,
        name: supervisor.name || "N/A",
        email: supervisor.email || "",
        department: supervisor.department || "N/A",
        students: supervisor.current_students || 0,
        capacity: supervisor.capacity || 10,
        status: supervisor.current_students >= supervisor.capacity ? "full" : "active",
      }))
      setRealSupervisors(transformedSupervisors)

      // Fetch all documents to count pending reviews
      let pendingReviewsCount = 0
      try {
        const documentsResponse = await documentsAPI.getAll()
        const allDocuments = documentsResponse.documents || []
        
        // Count documents with status 'submitted' or 'pending_review' and type 'submission'
        pendingReviewsCount = allDocuments.filter((doc: any) => 
          (doc.status === 'submitted' || doc.status === 'pending_review') &&
          doc.type === 'submission'
        ).length
      } catch (error) {
        console.error('Error fetching documents for pending reviews count:', error)
      }

      // Calculate stats
      const totalStudents = transformedStudents.length
      // Count all supervisors, not just active ones
      const totalSupervisors = transformedSupervisors.length

      setRealStats({
        totalStudents,
        activeSupervisors: totalSupervisors, // Changed to show total supervisors
        pendingReviews: pendingReviewsCount,
        completionRate: 0, // Not used anymore
      })

      // Fetch recent activities
      await fetchRecentActivities(transformedStudents)

      // Mark initial load as complete
      if (isInitialLoad) {
        setIsInitialLoad(false)
      }

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      // Only show error toast on initial load, not on background refreshes
      if (!isBackgroundRefresh) {
        toast({
          title: "Error",
          description: error.message || "Failed to load dashboard data. Please refresh the page.",
          variant: "destructive",
        })
      }
    } finally {
      // Only update loading state if not a background refresh
      if (!isBackgroundRefresh) {
        setIsLoadingData(false)
      }
    }
  }, [user?.id, userLoading, toast, fetchRecentActivities, isInitialLoad])

  useEffect(() => {
    if (!userLoading && user?.id) {
      // Initial load
      fetchDashboardData(false)
      
      // Poll for updates every 30 seconds (reduced frequency to prevent blinking)
      // Pass true to indicate it's a background refresh
      const interval = setInterval(() => {
        fetchDashboardData(true)
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [user?.id, userLoading, fetchDashboardData])

  // Use real data instead of mock
  const students = realStudents
  const supervisors = realSupervisors
  const stats = [
    { label: "Total Students", value: realStats.totalStudents.toString(), change: "", icon: GraduationCap, color: "text-blue-600" },
    { label: "Total Supervisors", value: realStats.activeSupervisors.toString(), change: "", icon: UserCheck, color: "text-green-600" },
    { label: "Pending Reviews", value: realStats.pendingReviews.toString(), change: "", icon: FileText, color: "text-orange-600" },
  ]

  // removed local notifications state and unreadCount
  // const unreadCount = notifications.filter((n) => !n.read).length

  const handleViewDetails = (student: any) => {
    setSelectedStudentData(student)
    setViewDetailsOpen(true)
  }

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
    
    // Default navigation based on type for admin role
    const basePath = '/admin'
    switch (notif.type) {
      case 'meeting':
        router.push(`${basePath}/dashboard`)
        break
      case 'document':
      case 'submission':
        router.push(`${basePath}/dashboard`)
        break
      case 'user':
      case 'registration':
        router.push(`${basePath}/users`)
        break
      case 'message':
        router.push(`${basePath}/dashboard`)
        break
      case 'progress':
      case 'milestone':
      case 'reminder':
        router.push(`${basePath}/dashboard`)
        break
      default:
        router.push(`${basePath}/dashboard`)
    }
    setIsNotificationsOpen(false)
  }

  const handleMarkNotificationAsRead = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    markAsRead(id)
    toast({
      title: "Notification marked as read",
    })
  }

  const handleDeleteNotification = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    deleteNotification(id)
    toast({
      title: "Notification deleted",
    })
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
    toast({
      title: "All notifications marked as read",
    })
  }

  const handleClearAllNotifications = () => {
    clearAll()
    toast({
      title: "All notifications cleared",
    })
  }

  const handleDeactivateUser = async (user: any) => {
    try {
      const userId = user.user_id || user.id
      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not found",
          variant: "destructive",
        })
        return
      }

      await usersAPI.updateStatus(userId, "inactive")
      toast({
        title: "User Deactivated",
        description: `${user.name} has been deactivated.`,
        variant: "destructive",
      })
      
      // Refresh data silently (background refresh)
      await fetchDashboardData(true)
    } catch (error: any) {
      console.error('Error deactivating user:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate user.",
        variant: "destructive",
      })
    }
  }

  const handleActivateUser = async (user: any) => {
    try {
      const userId = user.user_id || user.id
      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not found",
          variant: "destructive",
        })
        return
      }

      await usersAPI.updateStatus(userId, "active")
      toast({
        title: "User Activated",
        description: `${user.name} has been activated.`,
      })
      
      // Refresh data silently (background refresh)
      await fetchDashboardData(true)
    } catch (error: any) {
      console.error('Error activating user:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to activate user.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (user: any) => {
    try {
      const userId = user.user_id || user.id
      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not found",
          variant: "destructive",
        })
        return
      }

      // Determine role from user object
      const role = user.role || (user.supervisor ? 'supervisor' : 'student')
      
      if (!['student', 'supervisor'].includes(role)) {
        toast({
          title: "Error",
          description: "Cannot delete this user type",
          variant: "destructive",
        })
        return
      }

      await usersAPI.removeFromRole(userId, role)
      toast({
        title: "User Removed",
        description: `${user.name} has been removed from ${role} role.`,
        variant: "destructive",
      })
      
      // Refresh data silently (background refresh)
      await fetchDashboardData(true)
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove user from role.",
        variant: "destructive",
      })
    }
  }

  const handleViewProgress = (student) => {
    setProgressStudentData(student)
    setViewProgressOpen(true)
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

    if (!student.progressStatus || student.progressStatus !== "needs-attention") {
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

  const handleEditProfile = (user: any) => {
    setSelectedUserForEdit(user)
    setEditProfileData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    })
    setEditProfileOpen(true)
  }

  const handleViewStudents = async (supervisor: any) => {
    try {
      // Fetch students for this supervisor from API
      const response = await studentsAPI.getAll({ supervisor_id: supervisor.id })
      const supervisorStudentsList = response.students || []
      setSupervisorStudents(supervisorStudentsList)
      setSelectedSupervisor(supervisor)
      setViewStudentsOpen(true)
    } catch (error: any) {
      console.error('Error fetching supervisor students:', error)
      // Fallback to filtering from realStudents
      const assignedStudents = realStudents.filter((student: any) => student.supervisor === supervisor.name)
      setSupervisorStudents(assignedStudents)
      setSelectedSupervisor(supervisor)
      setViewStudentsOpen(true)
    }
  }

  const handleAdjustCapacity = (supervisor) => {
    setSelectedSupervisor(supervisor)
    setNewCapacity(supervisor.capacity)
    setAdjustCapacityOpen(true)
  }

  const handleSaveProfile = async () => {
    if (!editProfileData.name || !editProfileData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const userId = selectedUserForEdit.user_id || selectedUserForEdit.id
      if (!userId) {
        toast({
          title: "Error",
          description: "User ID not found",
          variant: "destructive",
        })
        return
      }

      // Update user details
      await usersAPI.update(userId, {
        name: editProfileData.name,
        email: editProfileData.email,
        phone: editProfileData.phone,
      })

      toast({
        title: "Profile Updated",
        description: `${editProfileData.name}'s profile has been updated successfully.`,
      })
      setEditProfileOpen(false)
      setSelectedUserForEdit(null)
      
      // Refresh dashboard data
      await fetchDashboardData(true)
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update user profile.",
        variant: "destructive",
      })
    }
  }

  const handleSaveCapacity = async () => {
    if (newCapacity < selectedSupervisor.students) {
      toast({
        title: "Invalid Capacity",
        description: `Capacity cannot be less than current student count (${selectedSupervisor.students})`,
        variant: "destructive",
      })
      return
    }

    try {
      // Call API to update capacity
      await supervisorsAPI.update(selectedSupervisor.id, { capacity: newCapacity })
      
      // Update local state optimistically
      setRealSupervisors(
        realSupervisors.map((s) =>
          s.id === selectedSupervisor.id
            ? {
                ...s,
                capacity: newCapacity,
                status: s.students >= newCapacity ? "full" : "active",
              }
            : s,
        ),
      )

      toast({
        title: "Capacity Updated",
        description: `${selectedSupervisor.name}'s capacity has been updated to ${newCapacity} students.`,
      })

      setAdjustCapacityOpen(false)
      setSelectedSupervisor(null)
      
      // Refresh dashboard data to ensure consistency
      fetchDashboardData(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update capacity. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredStudents = realStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.program.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.supervisor.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredSupervisors = realSupervisors.filter(
    (supervisor) =>
      supervisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supervisor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supervisor.department.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddUser = async () => {
    if (addUserMode === "new") {
      // Create new user account
      if (!newUserData.role || !newUserData.name || !newUserData.email || !newUserData.password) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Role, Name, Email, Password)",
          variant: "destructive",
        })
        return
      }

      if (newUserData.password.length < 6) {
        toast({
          title: "Validation Error",
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        })
        return
      }

      if (newUserData.password !== newUserData.confirmPassword) {
        toast({
          title: "Validation Error",
          description: "Passwords do not match",
          variant: "destructive",
        })
        return
      }

      if (newUserData.role === "student" && !newUserData.program) {
        toast({
          title: "Validation Error",
          description: "Please select a program for student registration",
          variant: "destructive",
        })
        return
      }

      if (newUserData.role === "supervisor" && !newUserData.department) {
        toast({
          title: "Validation Error",
          description: "Please select a department for supervisor registration",
          variant: "destructive",
        })
        return
      }

      try {
        setIsAddingUser(true)

        const response = await usersAPI.createUser({
          email: newUserData.email,
          password: newUserData.password,
          name: newUserData.name,
          role: newUserData.role,
          phone: newUserData.phone || undefined,
          program: newUserData.program || undefined,
          department: newUserData.department || undefined,
          supervisor_id: newUserData.supervisor_id && newUserData.supervisor_id !== "unassigned" ? parseInt(newUserData.supervisor_id) : undefined,
        })

        toast({
          title: "User Created Successfully",
          description: `${newUserData.name} has been created and added to the system.`,
        })

        setIsAddUserOpen(false)
        setNewUserData({ role: "", name: "", email: "", password: "", confirmPassword: "", phone: "", program: "", department: "", supervisor_id: "" })
        
        // Refresh dashboard data silently
        await fetchDashboardData(true)
      } catch (error: any) {
        console.error('Error creating user:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to create user. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsAddingUser(false)
      }
    } else {
      // Add existing user (only students can be added)
      if (newUserData.role !== "student") {
        toast({
          title: "Invalid Role",
          description: "Only students can be added as existing users. Please use 'Create New User' to create supervisor or administrator accounts.",
          variant: "destructive",
        })
        return
      }

      if (!newUserData.role || (!newUserData.email && !newUserData.phone)) {
        toast({
          title: "Validation Error",
          description: "Please provide either email or phone number",
          variant: "destructive",
        })
        return
      }

      try {
        setIsAddingUser(true)

        await usersAPI.addStudent({ email: newUserData.email || undefined, phone: newUserData.phone || undefined })
        toast({
          title: "Student Added",
          description: "Student has been successfully added to the system.",
        })

        setIsAddUserOpen(false)
        setNewUserData({ role: "", name: "", email: "", password: "", confirmPassword: "", phone: "", program: "", department: "", supervisor_id: "" })
        
        // Refresh dashboard data silently
        await fetchDashboardData(true)
      } catch (error: any) {
        console.error('Error adding user:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to add user. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsAddingUser(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 border-b-2 border-border/50 bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80 shadow-elevation-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin/dashboard" className="cursor-pointer">
              <h1 className="text-2xl font-bold text-foreground tracking-tight hover:opacity-80 transition-opacity">
                <span className="bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent bg-[length:200%_auto]">UTM</span><span className="ml-1">Gradient</span>
              </h1>
            </Link>
            <nav className="hidden md:flex gap-1">
              <Link href="/admin/dashboard" className="text-sm font-medium px-4 py-2 rounded-lg text-foreground bg-muted/50 transition-smooth hover:bg-muted">
                Dashboard
              </Link>
              <Link href="/admin/users" className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground">
                Users
              </Link>
              <Link href="/admin/reports" className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground">
                Reports
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center z-10">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold">Notifications ({notifications.length})</h3>
                  {notifications.length > 0 && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={handleMarkAllAsRead}>
                        Mark all read
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={handleClearAllNotifications}
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">No notifications</div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className="p-3 border-b hover:bg-muted/50 flex gap-3 justify-between cursor-pointer"
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${notif.unread ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{notif.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notif.timestamp}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleMarkNotificationAsRead(notif.id, e)}
                            className="h-6 w-6 p-0"
                          >
                            ✓
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteNotification(notif.id, e)}
                            className="h-6 w-6 p-0 text-destructive"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Link href="/admin/profile">
              <Avatar className="cursor-pointer hover:opacity-80 transition-all duration-300 ring-2 ring-primary/20 hover:ring-primary/40 shadow-md hover:shadow-lg">
                <AvatarImage src={getUploadUrl(user?.avatar)} alt="Admin" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                  {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'AD'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content with Enhanced Background */}
      <div className="container mx-auto px-6 py-10 max-w-7xl relative">
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
              Welcome back, {user?.name || "Admin"}
            </h2>
            <p className="text-muted-foreground text-lg">Monitor system performance and manage users</p>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 relative z-10">
          {stats.map((stat, index) => (
            <Card key={index} className="group relative overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">{stat.label}</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">{stat.value}</p>
                    {stat.change && (
                      <p className="text-sm text-success flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                        {stat.change}
                      </p>
                    )}
                  </div>
                  <div className={`h-14 w-14 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center ${stat.color} flex-shrink-0 ml-4 group-hover:scale-110 transition-transform shadow-sm`}>
                    <stat.icon className="h-7 w-7" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enhanced User Management Tabs */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="border-b border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold mb-1">User Management</CardTitle>
                    <CardDescription className="text-sm mt-1">Manage students and supervisors in the system</CardDescription>
                  </div>
                  <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                          Create a new user account or add an existing user to the system.
                        </DialogDescription>
                      </DialogHeader>
                      
                      {/* Mode Toggle */}
                      <div className="flex gap-2 mb-4">
                        <Button
                          type="button"
                          variant={addUserMode === "new" ? "default" : "outline"}
                          onClick={() => setAddUserMode("new")}
                          className="flex-1"
                        >
                          Create New User
                        </Button>
                        <Button
                          type="button"
                          variant={addUserMode === "existing" ? "default" : "outline"}
                          onClick={() => setAddUserMode("existing")}
                          className="flex-1"
                        >
                          Add Existing User
                        </Button>
                      </div>

                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">User Role *</label>
                          <Select
                            value={newUserData.role}
                            onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              {addUserMode === "new" && (
                                <>
                                  <SelectItem value="supervisor">Supervisor</SelectItem>
                                  <SelectItem value="administrator">Administrator</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          {addUserMode === "existing" && (
                            <p className="text-xs text-muted-foreground">
                              Only students can be added as existing users. To create supervisor or administrator accounts, use "Create New User".
                            </p>
                          )}
                        </div>

                        {addUserMode === "new" ? (
                          <>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Full Name *</label>
                              <Input
                                placeholder="Enter full name"
                                value={newUserData.name}
                                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Email *</label>
                              <Input
                                type="email"
                                placeholder="user@utm.my"
                                value={newUserData.email}
                                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Password *</label>
                                <Input
                                  type="password"
                                  placeholder="Min. 6 characters"
                                  value={newUserData.password}
                                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Confirm Password *</label>
                                <Input
                                  type="password"
                                  placeholder="Confirm password"
                                  value={newUserData.confirmPassword}
                                  onChange={(e) => setNewUserData({ ...newUserData, confirmPassword: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Phone Number</label>
                              <Input
                                placeholder="+60 12-345 6789"
                                value={newUserData.phone}
                                onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                              />
                            </div>
                            {newUserData.role === "student" && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Program *</label>
                                <Select
                                  value={newUserData.program}
                                  onValueChange={(value) => setNewUserData({ ...newUserData, program: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select program" />
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
                            )}
                            {newUserData.role === "student" && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Assign Supervisor (Optional)</label>
                                <Select
                                  value={newUserData.supervisor_id}
                                  onValueChange={(value) => setNewUserData({ ...newUserData, supervisor_id: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select supervisor (optional)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {realSupervisors.map((supervisor) => (
                                      <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                                        {supervisor.name} ({supervisor.department}) - {supervisor.students}/{supervisor.capacity} students
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  You can assign a supervisor now or later. Supervisors with available capacity are shown.
                                </p>
                              </div>
                            )}
                            {newUserData.role === "supervisor" && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Department *</label>
                                <Select
                                  value={newUserData.department}
                                  onValueChange={(value) => setNewUserData({ ...newUserData, department: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                                    <SelectItem value="Software Engineering">Software Engineering</SelectItem>
                                    <SelectItem value="Informatics Engineering">Informatics Engineering</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {newUserData.role === "administrator" && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Department</label>
                                <Input
                                  placeholder="Computer Science"
                                  value={newUserData.department}
                                  onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Email</label>
                              <Input
                                type="email"
                                placeholder="user@utm.my"
                                value={newUserData.email}
                                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value, phone: "" })}
                              />
                              <p className="text-xs text-muted-foreground">Enter either email or phone number</p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Phone Number</label>
                              <Input
                                placeholder="+60 12-345 6789"
                                value={newUserData.phone}
                                onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value, email: "" })}
                              />
                              <p className="text-xs text-muted-foreground">Enter either email or phone number</p>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsAddUserOpen(false)
                            setAddUserMode("new")
                            setNewUserData({ role: "", name: "", email: "", password: "", confirmPassword: "", phone: "", program: "", department: "", supervisor_id: "" })
                          }}
                          disabled={isAddingUser}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddUser} disabled={isAddingUser}>
                          {isAddingUser ? (addUserMode === "new" ? "Creating..." : "Adding...") : (addUserMode === "new" ? "Create User" : "Add User")}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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
                    {isLoadingData ? (
                      <div className="text-center py-8 text-muted-foreground">Loading students...</div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {realStudents.length === 0 
                          ? "No students in the system yet."
                          : "No students found matching your search."}
                      </div>
                    ) : (
                      filteredStudents.map((student) => (
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
                                {student.progressStatus && (
                                  <Badge
                                    className={
                                      student.progressStatus === "on-track"
                                        ? "bg-green-500/10 text-green-700 dark:text-green-400 text-xs"
                                        : "bg-red-500/10 text-red-700 dark:text-red-400 text-xs"
                                    }
                                    variant="secondary"
                                  >
                                    {student.progressStatus === "on-track" ? "On Track" : "Needs Attention"}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <p className="text-xs text-muted-foreground">{student.program}</p>
                                <p className="text-xs text-muted-foreground">Supervisor: {student.supervisor}</p>
                                <p className="text-xs text-muted-foreground">Enrolled: {student.enrollmentDate}</p>
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center gap-2">
                                  <Progress value={student.progress} className="h-2 flex-1" aria-label={`${student.name} progress: ${student.progress}%`} />
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
                                <DropdownMenuItem onClick={() => handleViewDetails(student)}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditProfile(student)}>
                                  Edit Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewProgress(student)}>
                                  View Progress
                                </DropdownMenuItem>
                                {student.status === "active" && student.progressStatus === "needs-attention" && (
                                  <DropdownMenuItem onClick={() => handleSendWarning(student)}>
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Send Warning
                                  </DropdownMenuItem>
                                )}
                                {student.status === "active" ? (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeactivateUser({ ...student, role: 'student' })}
                                  >
                                    Deactivate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    className="text-green-600"
                                    onClick={() => handleActivateUser({ ...student, role: 'student' })}
                                  >
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteUser({ ...student, role: 'student' })}
                                >
                                  Delete from Role
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="supervisors" className="space-y-4">
                    {isLoadingData ? (
                      <div className="text-center py-8 text-muted-foreground">Loading supervisors...</div>
                    ) : filteredSupervisors.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {realSupervisors.length === 0 
                          ? "No supervisors in the system yet."
                          : "No supervisors found matching your search."}
                      </div>
                    ) : (
                      filteredSupervisors.map((supervisor) => (
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
                              <DropdownMenuItem onClick={() => handleViewDetails(supervisor)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditProfile(supervisor)}>
                                Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewStudents(supervisor)}>
                                View Students
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAdjustCapacity(supervisor)}>
                                Adjust Capacity
                              </DropdownMenuItem>
                              {supervisor.status === "active" || supervisor.status === "full" ? (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeactivateUser({ ...supervisor, role: 'supervisor' })}
                                >
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-green-600"
                                  onClick={() => handleActivateUser({ ...supervisor, role: 'supervisor' })}
                                >
                                  Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteUser({ ...supervisor, role: 'supervisor' })}
                              >
                                Delete from Role
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

          </div>

          <div className="space-y-6">
            {/* Recent Activity */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                <CardDescription className="mt-1">Latest system events and updates</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
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
            <Card className="border border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-6">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setIsAddUserOpen(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Add New User
                </Button>
                <Link href="/admin/reports" className="w-full">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </Link>
                <Link href="/admin/profile" className="w-full">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Settings className="h-4 w-4 mr-2" />
                    Profile & Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* View Details Dialog */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>Complete information about the selected user</DialogDescription>
            </DialogHeader>
            {selectedStudentData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-semibold text-foreground">{selectedStudentData.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-semibold text-foreground">{selectedStudentData.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Program</p>
                    <p className="font-semibold text-foreground">{selectedStudentData.program}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Supervisor</p>
                    <p className="font-semibold text-foreground">{selectedStudentData.supervisor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="font-semibold text-foreground">{selectedStudentData.progress}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    {selectedStudentData.progressStatus ? (
                      <Badge
                        className={
                          selectedStudentData.progressStatus === "on-track"
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : "bg-red-500/10 text-red-700 dark:text-red-400"
                        }
                        variant="secondary"
                      >
                        {selectedStudentData.progressStatus === "on-track" ? "On Track" : "Needs Attention"}
                      </Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Progress Dialog with comprehensive progress information */}
        <Dialog open={viewProgressOpen} onOpenChange={setViewProgressOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Student Progress Overview</DialogTitle>
              <DialogDescription>Detailed progress tracking and milestone completion</DialogDescription>
            </DialogHeader>
            {progressStudentData && (
              <div className="space-y-6">
                {/* Student Info Header */}
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    {progressStudentData.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{progressStudentData.name}</h3>
                    <p className="text-sm text-muted-foreground">{progressStudentData.program}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-muted-foreground">Supervisor: {progressStudentData.supervisor}</p>
                      <p className="text-xs text-muted-foreground">
                        Enrolled: {progressStudentData.startDate} - {progressStudentData.expectedCompletion}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overall Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Overall Progress</h4>
                    <span className="text-2xl font-bold text-primary">{progressStudentData.progress}%</span>
                  </div>
                  <Progress value={progressStudentData.progress} className="h-3" aria-label={`Overall progress: ${progressStudentData.progress}%`} />
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Documents</p>
                          <p className="text-lg font-bold text-foreground">{progressStudentData.documentsSubmitted}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pending Reviews</p>
                          <p className="text-lg font-bold text-foreground">{progressStudentData.pendingReviews}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Meetings</p>
                          <p className="text-lg font-bold text-foreground">{progressStudentData.meetingsThisMonth}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Last Meeting</p>
                          <p className="text-sm font-semibold text-foreground">{progressStudentData.lastMeeting}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Milestones */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Research Milestones
                  </h4>
                  <div className="space-y-3">
                    {progressStudentData.milestones?.map((milestone, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{milestone.name}</span>
                            <Badge
                              variant={
                                milestone.status === "completed"
                                  ? "default"
                                  : milestone.status === "in-progress"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="text-xs"
                            >
                              {milestone.status}
                            </Badge>
                          </div>
                          <span className="text-sm font-semibold text-foreground">{milestone.progress}%</span>
                        </div>
                        <Progress value={milestone.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <DownloadReportButton studentData={progressStudentData} variant="outline" className="flex-1" />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Details</DialogTitle>
              <DialogDescription>Update information for {selectedUserForEdit?.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={editProfileData.name || ""}
                  onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editProfileData.email || ""}
                  onChange={(e) => setEditProfileData({ ...editProfileData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={editProfileData.phone || ""}
                  onChange={(e) => setEditProfileData({ ...editProfileData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditProfileOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={viewStudentsOpen} onOpenChange={setViewStudentsOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Students Supervised by {selectedSupervisor?.name}</DialogTitle>
              <DialogDescription>
                {supervisorStudents.length} student{supervisorStudents.length !== 1 ? "s" : ""} currently assigned
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {supervisorStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No students assigned to this supervisor</div>
              ) : (
                supervisorStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.program}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={student.progress} className="h-1.5 w-24" aria-label={`${student.name} progress: ${student.progress}%`} />
                          <span className="text-xs text-muted-foreground">{student.progress}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewProgress(student)}>
                        View Progress
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={adjustCapacityOpen} onOpenChange={setAdjustCapacityOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adjust Student Capacity</DialogTitle>
              <DialogDescription>Set the maximum number of students for {selectedSupervisor?.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Students:</span>
                  <span className="font-semibold text-foreground">{selectedSupervisor?.students}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Capacity:</span>
                  <span className="font-semibold text-foreground">{selectedSupervisor?.capacity}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Capacity *</label>
                <Input
                  type="number"
                  min={selectedSupervisor?.students || 0}
                  value={newCapacity || 0}
                  onChange={(e) => setNewCapacity(Number.parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum capacity must be at least {selectedSupervisor?.students} (current student count)
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdjustCapacityOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCapacity}>Update Capacity</Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
      <Chatbot role="administrator" />
    </div>
  )
}
