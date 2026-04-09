"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  GraduationCap,
  UserCheck,
  Search,
  MoreVertical,
  Plus,
  Filter,
  Download,
  Mail,
  Phone,
  Shield,
  Bell,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useNotifications } from "@/lib/notifications-context"
import { studentsAPI, supervisorsAPI, usersAPI, progressAPI, documentsAPI, notificationsAPI, getUploadUrl } from "@/lib/api"
import { useUser } from "@/lib/user-context"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function AdminUsersPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, clearAll } = useNotifications()

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
    supervisor_id: ""
  })
  const { toast } = useToast()

  // Real-time data states
  const [studentsState, setStudentsState] = useState<any[]>([])
  const [supervisorsState, setSupervisorsState] = useState<any[]>([])
  const [adminsState, setAdminsState] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingUser, setIsAddingUser] = useState(false)

  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false)
  const [isViewProgressOpen, setIsViewProgressOpen] = useState(false)
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false)
  const [isManageSupervisorOpen, setIsManageSupervisorOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<any>({})
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("")
  const [isManagingSupervisor, setIsManagingSupervisor] = useState(false)
  const [adjustCapacityOpen, setAdjustCapacityOpen] = useState(false)
  const [newCapacity, setNewCapacity] = useState(0)
  const [selectedSupervisorForCapacity, setSelectedSupervisorForCapacity] = useState<any>(null)

  // Fetch all users data
  const fetchAllUsers = useCallback(async (showLoading = false) => {
    if (userLoading || !user?.id) return

    try {
      if (showLoading) {
        setIsLoading(true)
      }

      // Fetch students
      const studentsResponse = await studentsAPI.getAll()
      const studentsList = studentsResponse.students || []
      
      // Calculate status based on weekly tasks and overdue dates
      const transformedStudents = await Promise.all(studentsList.map(async (student: any) => {
        let calculatedProgress = 0
        let progressStatus: string | null = null
        
        // Only calculate progress and status for active students
        if (student.user_status === "active") {
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
        }
        
        return {
          id: student.id,
          user_id: student.user_id,
          name: student.name || "N/A",
          email: student.email || "",
          phone: student.phone || "",
          supervisor: student.supervisor_name || "Unassigned",
          supervisor_id: student.supervisor_id || null,
          program: student.program || "N/A",
          progress: calculatedProgress,
          status: student.user_status === "active" ? "active" : "inactive",
          progressStatus, // Store separately for badge display (null if no weekly tasks, "on-track" or "needs-attention" if tasks exist)
          enrollmentDate: student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A",
          expectedCompletion: student.expected_completion ? new Date(student.expected_completion).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "TBD",
        }
      }))
      setStudentsState(transformedStudents)

      // Fetch supervisors
      const supervisorsResponse = await supervisorsAPI.getAll()
      const supervisorsList = supervisorsResponse.supervisors || []
      const transformedSupervisors = supervisorsList.map((supervisor: any) => ({
        id: supervisor.id,
        user_id: supervisor.user_id,
        name: supervisor.name || "N/A",
        email: supervisor.email || "",
        phone: supervisor.phone || "",
        department: supervisor.department || "N/A",
        students: supervisor.current_students || 0,
        capacity: supervisor.capacity || 10,
        status: supervisor.user_status === "active" ? (supervisor.current_students >= supervisor.capacity ? "full" : "active") : "inactive",
        joinedDate: "N/A", // Can be added if we track this in the database
      }))
      setSupervisorsState(transformedSupervisors)

      // Fetch admins
      const adminsResponse = await usersAPI.getAll({ role: "administrator" })
      const adminsList = adminsResponse.users || []
      const transformedAdmins = adminsList.map((admin: any) => ({
        id: admin.id,
        name: admin.name || "N/A",
        email: admin.email || "",
        phone: admin.phone || "",
        role: "System Administrator",
        status: admin.status || "active",
        joinedDate: admin.created_at ? new Date(admin.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A",
      }))
      setAdminsState(transformedAdmins)

    } catch (error: any) {
      console.error('Error fetching users:', error)
      if (showLoading) {
        toast({
          title: "Error",
          description: error.message || "Failed to load users. Please refresh the page.",
          variant: "destructive",
        })
      }
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [user?.id, userLoading, toast])

  useEffect(() => {
    if (!userLoading && user?.id) {
      // Initial load with loading state
      fetchAllUsers(true)
      
      // Poll for updates every 5 seconds without showing loading state
      const interval = setInterval(() => {
        fetchAllUsers(false)
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [user?.id, userLoading, fetchAllUsers])

  const filteredStudents = studentsState.filter(
    (student) =>
      (filterStatus === "all" || student.status === filterStatus) &&
      (student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.program.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.supervisor.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const filteredSupervisors = supervisorsState.filter(
    (supervisor) =>
      (filterStatus === "all" || supervisor.status === filterStatus) &&
      (supervisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supervisor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supervisor.department.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const filteredAdmins = adminsState.filter(
    (admin) =>
      (filterStatus === "all" || admin.status === filterStatus) &&
      (admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.role.toLowerCase().includes(searchQuery.toLowerCase())),
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

        await usersAPI.createUser({
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
          description: `${newUserData.name} has been created. A verification email has been sent to ${newUserData.email}. The user must verify their email before logging in.`,
          duration: 6000,
        })

        setIsAddUserOpen(false)
        setNewUserData({ role: "", name: "", email: "", password: "", confirmPassword: "", phone: "", program: "", department: "", supervisor_id: "" })
        
        // Refresh data without showing loading state
        await fetchAllUsers(false)
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
        
        // Refresh data without showing loading state
        await fetchAllUsers(false)
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
      
      // Refresh data without showing loading state
      await fetchAllUsers(false)
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
      
      // Refresh data without showing loading state
      await fetchAllUsers(false)
    } catch (error: any) {
      console.error('Error activating user:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to activate user.",
        variant: "destructive",
      })
    }
  }

  const handleExportUsers = () => {
    try {
      // Create PDF document
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      
      // Header
      doc.setFillColor(79, 70, 229) // Primary color
      doc.rect(0, 0, pageWidth, 40, 'F')
      
      // Title
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('UTMGradient', 14, 20)
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text('User Management Report', 14, 30)
      
      // Date
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, pageWidth - 14, 30, { align: 'right' })
      
      // Summary Section
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Summary', 14, 55)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total Students: ${studentsState.length}`, 14, 65)
      doc.text(`Total Supervisors: ${supervisorsState.length}`, 14, 72)
      doc.text(`Total Administrators: ${adminsState.length}`, 14, 79)
      doc.text(`Total Users: ${studentsState.length + supervisorsState.length + adminsState.length}`, 14, 86)
      
      let yPosition = 100
      
      // Students Table
      if (studentsState.length > 0) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(79, 70, 229)
        doc.text(`Students (${studentsState.length})`, 14, yPosition)
        
        const studentData = studentsState.map((student) => [
          student.name || '-',
          student.email || '-',
          student.program ? (student.program.length > 30 ? student.program.substring(0, 30) + '...' : student.program) : '-',
          student.supervisor || 'Unassigned',
          `${student.progress || 0}%`,
          student.status === 'active' ? 'Active' : 'Inactive',
        ])
        
        autoTable(doc, {
          startY: yPosition + 5,
          head: [['Name', 'Email', 'Program', 'Supervisor', 'Progress', 'Status']],
          body: studentData,
          theme: 'striped',
          headStyles: { 
            fillColor: [79, 70, 229],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8
          },
          bodyStyles: { fontSize: 7 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 45 },
            2: { cellWidth: 40 },
            3: { cellWidth: 30 },
            4: { cellWidth: 18 },
            5: { cellWidth: 18 },
          },
          margin: { left: 14, right: 14 },
        })
        
        yPosition = (doc as any).lastAutoTable.finalY + 15
      }
      
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }
      
      // Supervisors Table
      if (supervisorsState.length > 0) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(79, 70, 229)
        doc.text(`Supervisors (${supervisorsState.length})`, 14, yPosition)
        
        const supervisorData = supervisorsState.map((supervisor) => [
          supervisor.name || '-',
          supervisor.email || '-',
          supervisor.department || '-',
          supervisor.phone || '-',
          supervisor.status === 'active' ? 'Active' : 'Inactive',
        ])
        
        autoTable(doc, {
          startY: yPosition + 5,
          head: [['Name', 'Email', 'Department', 'Phone', 'Status']],
          body: supervisorData,
          theme: 'striped',
          headStyles: { 
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8
          },
          bodyStyles: { fontSize: 8 },
          margin: { left: 14, right: 14 },
        })
        
        yPosition = (doc as any).lastAutoTable.finalY + 15
      }
      
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }
      
      // Administrators Table
      if (adminsState.length > 0) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(79, 70, 229)
        doc.text(`Administrators (${adminsState.length})`, 14, yPosition)
        
        const adminData = adminsState.map((admin) => [
          admin.name || '-',
          admin.email || '-',
          admin.department || '-',
          admin.phone || '-',
          admin.status === 'active' ? 'Active' : 'Inactive',
        ])
        
        autoTable(doc, {
          startY: yPosition + 5,
          head: [['Name', 'Email', 'Department', 'Phone', 'Status']],
          body: adminData,
          theme: 'striped',
          headStyles: { 
            fillColor: [245, 158, 11],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8
          },
          bodyStyles: { fontSize: 8 },
          margin: { left: 14, right: 14 },
        })
      }
      
      // Footer on all pages
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(
          `Page ${i} of ${totalPages} | UTMGradient User Report`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }
      
      // Save PDF
      doc.save(`UTMGradient_Users_Report_${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast({
        title: "Export Successful",
        description: `Exported ${studentsState.length + supervisorsState.length + adminsState.length} users to PDF report.`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export user data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewProfile = (user: any) => {
    setSelectedUser(user)
    setIsViewProfileOpen(true)
  }

  const handleEditDetails = (user: any) => {
    setSelectedUser(user)
    setEditFormData(user)
    setIsEditDetailsOpen(true)
  }

  const handleViewProgress = (user: any) => {
    setSelectedUser(user)
    setIsViewProgressOpen(true)
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

  const handleSaveEditDetails = async () => {
    if (!editFormData.name || !editFormData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const userId = selectedUser.user_id || selectedUser.id
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
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
      })

      toast({
        title: "Details Updated",
        description: `${editFormData.name}'s details have been updated successfully`,
      })
      setIsEditDetailsOpen(false)
      
      // Refresh data without showing loading state
      await fetchAllUsers(false)
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update user details.",
        variant: "destructive",
      })
    }
  }

  const handleManageSupervisor = (student: any) => {
    setSelectedUser(student)
    // Use supervisor_id if available, otherwise find by name
    if (student.supervisor_id) {
      setSelectedSupervisorId(student.supervisor_id.toString())
    } else {
      const currentSupervisor = supervisorsState.find((s: any) => s.name === student.supervisor)
      setSelectedSupervisorId(currentSupervisor ? currentSupervisor.id.toString() : "unassigned")
    }
    setIsManageSupervisorOpen(true)
  }

  const handleSaveSupervisor = async () => {
    if (!selectedUser) return

    try {
      setIsManagingSupervisor(true)
      const studentId = selectedUser.id

      if (selectedSupervisorId === "unassigned") {
        // Remove supervisor
        await studentsAPI.removeSupervisor(studentId)
        toast({
          title: "Supervisor Removed",
          description: `Supervisor has been removed from ${selectedUser.name}`,
        })
      } else {
        // Check if student already has a supervisor
        const hasSupervisor = selectedUser.supervisor && selectedUser.supervisor !== "Unassigned"
        
        // Check capacity before making API call (only for new assignments, not changes)
        if (!hasSupervisor) {
          const selectedSupervisor = supervisorsState.find((s: any) => s.id.toString() === selectedSupervisorId)
          if (selectedSupervisor && selectedSupervisor.students >= selectedSupervisor.capacity) {
            toast({
              title: "Capacity Error",
              description: `Cannot assign supervisor: ${selectedSupervisor.name} has reached their maximum capacity (${selectedSupervisor.capacity} students). Please increase their capacity first or select another supervisor.`,
              variant: "destructive",
            })
            setIsManagingSupervisor(false)
            return
          }
        }
        
        if (hasSupervisor) {
          // Change supervisor
          await studentsAPI.changeSupervisor(studentId, parseInt(selectedSupervisorId))
          toast({
            title: "Supervisor Changed",
            description: `Supervisor has been changed for ${selectedUser.name}`,
          })
        } else {
          // Assign new supervisor
          await studentsAPI.assignSupervisor(studentId, parseInt(selectedSupervisorId))
          toast({
            title: "Supervisor Assigned",
            description: `Supervisor has been assigned to ${selectedUser.name}`,
          })
        }
      }

      setIsManageSupervisorOpen(false)
      setSelectedSupervisorId("")
      
      // Refresh data immediately to show live changes
      await fetchAllUsers(false)
    } catch (error: any) {
      // Show user-friendly error message in toast
      const errorMessage = error.message || "Failed to manage supervisor."
      toast({
        title: "Error",
        description: errorMessage.includes("capacity") 
          ? `Cannot assign supervisor: ${errorMessage}. Please increase the supervisor's capacity first or select another supervisor.`
          : errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsManagingSupervisor(false)
    }
  }

  const handleAdjustCapacity = (supervisor: any) => {
    setSelectedSupervisorForCapacity(supervisor)
    setNewCapacity(supervisor.capacity)
    setAdjustCapacityOpen(true)
  }

  const handleSaveCapacity = async () => {
    if (newCapacity < selectedSupervisorForCapacity.students) {
      toast({
        title: "Invalid Capacity",
        description: `Capacity cannot be less than current student count (${selectedSupervisorForCapacity.students})`,
        variant: "destructive",
      })
      return
    }

    try {
      // Call API to update capacity
      await supervisorsAPI.update(selectedSupervisorForCapacity.id, { capacity: newCapacity })
      
      toast({
        title: "Capacity Updated",
        description: `${selectedSupervisorForCapacity.name}'s capacity has been updated to ${newCapacity} students.`,
      })

      setAdjustCapacityOpen(false)
      setSelectedSupervisorForCapacity(null)
      
      // Refresh data to show updated capacity
      await fetchAllUsers(false)
    } catch (error: any) {
      console.error('Error updating capacity:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update capacity. Please try again.",
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <Link href="/admin/dashboard" className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/admin/users" className="text-sm font-medium px-4 py-2 rounded-lg text-foreground bg-muted/50 transition-smooth hover:bg-muted">
                Users
              </Link>
              <Link href="/admin/reports" className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground">
                Reports
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Notifications Dropdown */}
            <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center p-0">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-3 border-b">
                  <h3 className="font-semibold text-sm">Notifications ({notifications.length})</h3>
                  {notifications.length > 0 && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={handleMarkAllAsRead}>
                        Mark all read
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
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
              <Avatar>
                <AvatarImage src={getUploadUrl(user?.avatar)} alt="Admin" />
                <AvatarFallback>{user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'AD'}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">User Management</h2>
          <p className="text-muted-foreground">Manage all users in the UTMGradient system</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-foreground">{studentsState.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <GraduationCap className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Supervisors</p>
                  <p className="text-3xl font-bold text-foreground">{supervisorsState.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <UserCheck className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">System Admins</p>
                  <p className="text-3xl font-bold text-foreground">{adminsState.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Shield className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View and manage all system users</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportUsers}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>Create a new user account or add an existing user to the system</DialogDescription>
                    </DialogHeader>
                    
                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-4">
                      <Button
                        type="button"
                        variant={addUserMode === "new" ? "default" : "outline"}
                        onClick={() => {
                          setAddUserMode("new")
                          setNewUserData({ ...newUserData, role: "" })
                        }}
                        className="flex-1"
                      >
                        Create New Account
                      </Button>
                      <Button
                        type="button"
                        variant={addUserMode === "existing" ? "default" : "outline"}
                        onClick={() => {
                          setAddUserMode("existing")
                          setNewUserData({ ...newUserData, role: "" })
                        }}
                        className="flex-1"
                      >
                        Add Existing User
                      </Button>
                    </div>

                    {/* Mode Description */}
                    <div className={`p-3 rounded-lg text-sm mb-4 ${addUserMode === "new" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                      {addUserMode === "new" ? (
                        <>
                          <strong>Create New Account:</strong> Create a new account. A verification email will be sent and the user must verify before logging in.
                        </>
                      ) : (
                        <>
                          <strong>Add Existing User:</strong> Add a student who already registered through the login page. Only students can be added as existing users.
                        </>
                      )}
                    </div>

                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="role">User Role *</Label>
                        <Select
                          value={newUserData.role}
                          onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}
                        >
                          <SelectTrigger id="role">
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
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                              id="name"
                              placeholder="Enter full name"
                              value={newUserData.name}
                              onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="user@utm.my"
                              value={newUserData.email}
                              onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="password">Password *</Label>
                              <Input
                                id="password"
                                type="password"
                                placeholder="Min. 6 characters"
                                value={newUserData.password}
                                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword">Confirm Password *</Label>
                              <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm password"
                                value={newUserData.confirmPassword}
                                onChange={(e) => setNewUserData({ ...newUserData, confirmPassword: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              placeholder="+60 12-345 6789"
                              value={newUserData.phone}
                              onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                            />
                          </div>
                          {newUserData.role === "student" && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="program">Program *</Label>
                                <Select
                                  value={newUserData.program}
                                  onValueChange={(value) => setNewUserData({ ...newUserData, program: value })}
                                >
                                  <SelectTrigger id="program">
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
                              <div className="space-y-2">
                                <Label htmlFor="supervisor">Assign Supervisor (Optional)</Label>
                                <Select
                                  value={newUserData.supervisor_id}
                                  onValueChange={(value) => setNewUserData({ ...newUserData, supervisor_id: value })}
                                >
                                  <SelectTrigger id="supervisor">
                                    <SelectValue placeholder="Select supervisor (optional)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {supervisorsState
                                      .filter((s: any) => s.status === "active" || s.status === "full")
                                      .map((supervisor: any) => {
                                        const isFull = supervisor.students >= supervisor.capacity
                                        return (
                                          <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                                            {supervisor.name} ({supervisor.department}) {isFull ? "(Full)" : ""}
                                          </SelectItem>
                                        )
                                      })}
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  You can assign a supervisor now or later.
                                </p>
                              </div>
                            </>
                          )}
                          {newUserData.role === "supervisor" && (
                            <div className="space-y-2">
                              <Label htmlFor="department">Department *</Label>
                              <Select
                                value={newUserData.department}
                                onValueChange={(value) => setNewUserData({ ...newUserData, department: value })}
                              >
                                <SelectTrigger id="department">
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
                              <Label htmlFor="department">Department</Label>
                              <Input
                                id="department"
                                placeholder="e.g., Computer Science"
                                value={newUserData.department}
                                onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="user@utm.my"
                              value={newUserData.email}
                              onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value, phone: "" })}
                              disabled={!newUserData.role}
                            />
                          </div>
                          <div className="relative flex items-center my-2">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink mx-3 text-xs text-muted-foreground">OR</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              placeholder="+60 12-345 6789"
                              value={newUserData.phone}
                              onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value, email: "" })}
                              disabled={!newUserData.role || !!newUserData.email}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Search for the user by their registered email or phone number.
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
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
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Bar */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or program..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="students" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="students">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Students ({filteredStudents.length})
                </TabsTrigger>
                <TabsTrigger value="supervisors">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Supervisors ({filteredSupervisors.length})
                </TabsTrigger>
                <TabsTrigger value="admins">
                  <Shield className="h-4 w-4 mr-2" />
                  Admins ({filteredAdmins.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="students" className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Loading students...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No students found matching your search</p>
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">{student.name}</p>
                            {student.status === "active" && student.progressStatus && (
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
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {student.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {student.phone}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{student.program}</span>
                            <span>Supervisor: {student.supervisor}</span>
                            <span>Enrolled: {student.enrollmentDate}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Progress value={student.progress} className="h-2 flex-1 max-w-xs" aria-label={`${student.name} progress: ${student.progress}%`} />
                            <span className="text-xs text-muted-foreground">{student.progress}%</span>
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
                          <DropdownMenuItem onClick={() => handleViewProfile(student)}>View Profile</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditDetails(student)}>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageSupervisor(student)}>Manage Supervisor</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewProgress(student)}>View Progress</DropdownMenuItem>
                          {student.status === "active" && student.progressStatus === "needs-attention" && (
                            <DropdownMenuItem onClick={() => handleSendWarning(student)}>
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Send Warning
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="supervisors" className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Loading supervisors...</p>
                  </div>
                ) : filteredSupervisors.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No supervisors found matching your search</p>
                  </div>
                ) : (
                  filteredSupervisors.map((supervisor) => (
                    <div
                      key={supervisor.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                            {supervisor.name
                              ? supervisor.name
                                  .split(" ")
                                  .map((word: string) => word.charAt(0))
                                  .join("")
                                  .substring(0, 2)
                                  .toUpperCase()
                              : "SV"}
                          </AvatarFallback>
                        </Avatar>
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
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {supervisor.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {supervisor.phone}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{supervisor.department}</span>
                            <span>
                              Students: {supervisor.students}/{supervisor.capacity}
                            </span>
                            <span>Joined: {supervisor.joinedDate}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Progress
                              value={(supervisor.students / supervisor.capacity) * 100}
                              className="h-2 flex-1 max-w-xs"
                              aria-label={`${supervisor.name} capacity: ${supervisor.students} of ${supervisor.capacity} students`}
                            />
                            <span className="text-xs text-muted-foreground">
                              {Math.round((supervisor.students / supervisor.capacity) * 100)}% capacity
                            </span>
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
                          <DropdownMenuItem onClick={() => handleViewProfile(supervisor)}>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditDetails(supervisor)}>
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAdjustCapacity(supervisor)}>
                            Adjust Capacity
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {supervisor.status === "active" || supervisor.status === "full" ? (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeactivateUser(supervisor)}
                            >
                              Deactivate Account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() => handleActivateUser(supervisor)}
                            >
                              Activate Account
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="admins" className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Loading admins...</p>
                  </div>
                ) : filteredAdmins.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No admins found matching your search</p>
                  </div>
                ) : (
                  filteredAdmins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                            {admin.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">{admin.name}</p>
                            <Badge variant="default" className="text-xs">
                              {admin.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {admin.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {admin.phone}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{admin.role}</span>
                            <span>Joined: {admin.joinedDate}</span>
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
                          <DropdownMenuItem onClick={() => handleViewProfile(admin)}>View Profile</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditDetails(admin)}>Edit Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {admin.status === "active" ? (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeactivateUser(admin)}
                            >
                              Deactivate Account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() => handleActivateUser(admin)}
                            >
                              Activate Account
                            </DropdownMenuItem>
                          )}
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

      <Dialog open={isViewProfileOpen} onOpenChange={setIsViewProfileOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>Detailed information about the user</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl font-semibold">{selectedUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">
                    {selectedUser.program || selectedUser.department || selectedUser.role}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedUser.role === "student" && selectedUser.status === "active" && selectedUser.progressStatus && (
                      <Badge
                        className={
                          selectedUser.progressStatus === "on-track"
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : "bg-red-500/10 text-red-700 dark:text-red-400"
                        }
                        variant="secondary"
                      >
                        {selectedUser.progressStatus === "on-track" ? "On Track" : "Needs Attention"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedUser.phone}</p>
                </div>
                {selectedUser.supervisor && (
                  <div>
                    <Label className="text-muted-foreground">Supervisor</Label>
                    <p className="font-medium">{selectedUser.supervisor}</p>
                  </div>
                )}
                {selectedUser.department && (
                  <div>
                    <Label className="text-muted-foreground">Department</Label>
                    <p className="font-medium">{selectedUser.department}</p>
                  </div>
                )}
                {selectedUser.enrollmentDate && (
                  <div>
                    <Label className="text-muted-foreground">Enrollment Date</Label>
                    <p className="font-medium">{selectedUser.enrollmentDate}</p>
                  </div>
                )}
                {selectedUser.expectedCompletion && (
                  <div>
                    <Label className="text-muted-foreground">Expected Completion</Label>
                    <p className="font-medium">{selectedUser.expectedCompletion}</p>
                  </div>
                )}
                {selectedUser.students !== undefined && (
                  <div>
                    <Label className="text-muted-foreground">Student Capacity</Label>
                    <p className="font-medium">
                      {selectedUser.students}/{selectedUser.capacity}
                    </p>
                  </div>
                )}
                {selectedUser.joinedDate && (
                  <div>
                    <Label className="text-muted-foreground">Joined Date</Label>
                    <p className="font-medium">{selectedUser.joinedDate}</p>
                  </div>
                )}
              </div>

              {selectedUser.progress !== undefined && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Overall Progress</Label>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedUser.progress} className="flex-1" />
                    <span className="font-medium">{selectedUser.progress}%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isViewProgressOpen} onOpenChange={setIsViewProgressOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Student Progress</DialogTitle>
            <DialogDescription>Detailed progress information for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.program}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">Overall Progress</Label>
                <div className="flex items-center gap-2">
                  <Progress value={selectedUser.progress || 0} className="flex-1" aria-label={`Overall progress: ${selectedUser.progress || 0}%`} />
                  <span className="font-medium">{selectedUser.progress || 0}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Enrollment Date</p>
                    <p className="text-lg font-semibold">{selectedUser.enrollmentDate || "N/A"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Expected Completion</p>
                    <p className="text-lg font-semibold">{selectedUser.expectedCompletion || "N/A"}</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Milestones</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Literature Review</p>
                      <p className="text-sm text-muted-foreground">Completed on Jan 15, 2024</p>
                    </div>
                    <Badge>Completed</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Research Proposal</p>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                    </div>
                    <Badge variant="secondary">In Progress</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Data Collection</p>
                      <p className="text-sm text-muted-foreground">Not Started</p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={adjustCapacityOpen} onOpenChange={setAdjustCapacityOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Student Capacity</DialogTitle>
            <DialogDescription>Set the maximum number of students for {selectedSupervisorForCapacity?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Students:</span>
                <span className="font-semibold text-foreground">{selectedSupervisorForCapacity?.students}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Capacity:</span>
                <span className="font-semibold text-foreground">{selectedSupervisorForCapacity?.capacity}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Capacity *</Label>
              <Input
                type="number"
                min={selectedSupervisorForCapacity?.students || 0}
                value={newCapacity || 0}
                onChange={(e) => setNewCapacity(Number.parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Minimum capacity must be at least {selectedSupervisorForCapacity?.students} (current student count)
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

      <Dialog open={isEditDetailsOpen} onOpenChange={setIsEditDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>Update information for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editFormData.email || ""}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={editFormData.phone || ""}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDetailsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditDetails}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isManageSupervisorOpen} onOpenChange={setIsManageSupervisorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Supervisor</DialogTitle>
            <DialogDescription>
              Change, assign, or remove supervisor for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Supervisor</Label>
              <Input
                value={selectedUser?.supervisor || "Unassigned"}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Select Supervisor</Label>
              <Select
                value={selectedSupervisorId}
                onValueChange={setSelectedSupervisorId}
                disabled={isManagingSupervisor}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned (Remove Supervisor)</SelectItem>
                  {supervisorsState
                    .filter((s: any) => s.status === "active" || s.status === "full")
                    .map((supervisor: any) => {
                      const isFull = supervisor.students >= supervisor.capacity
                      return (
                        <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                          {supervisor.name} ({supervisor.department}) - {supervisor.students}/{supervisor.capacity} students {isFull ? "(Full)" : ""}
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedSupervisorId === "unassigned"
                  ? "This will remove the current supervisor from the student."
                  : selectedSupervisorId && supervisorsState.find((s: any) => s.id.toString() === selectedSupervisorId)?.students >= supervisorsState.find((s: any) => s.id.toString() === selectedSupervisorId)?.capacity
                  ? "⚠️ This supervisor has reached capacity."
                  : "Select a supervisor to assign or change the current supervisor."}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsManageSupervisorOpen(false)
                setSelectedSupervisorId("")
              }}
              disabled={isManagingSupervisor}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSupervisor} disabled={isManagingSupervisor}>
              {isManagingSupervisor ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : selectedSupervisorId === "unassigned" ? (
                "Remove Supervisor"
              ) : selectedUser?.supervisor && selectedUser.supervisor !== "Unassigned" ? (
                "Change Supervisor"
              ) : (
                "Assign Supervisor"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
