"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Bell, FileText, Upload, Trash2, Users, Download, Loader2 } from "lucide-react"
import { useNotifications } from "@/lib/notifications-context"
import { documentsAPI, studentsAPI, progressAPI, meetingsAPI, logbookAPI, getUploadUrl } from "@/lib/api"
import { useUser } from "@/lib/user-context"

export default function SupervisorDocumentsPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState<string>("general")
  const [documentTitle, setDocumentTitle] = useState<string>("")
  const [documentDescription, setDocumentDescription] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)

  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, clearAll } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)

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
        setShowNotifications(false)
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
          if (student && student.student_id) {
            router.push(`/supervisor/students/${student.student_id}`)
            setShowNotifications(false)
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
    setShowNotifications(false)
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

  const [students, setStudents] = useState<any[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(true)
  const [studentDocuments, setStudentDocuments] = useState<Record<string, any[]>>({})
  const [isLoadingDocuments, setIsLoadingDocuments] = useState<Record<string, boolean>>({})
  const [weeklyTasks, setWeeklyTasks] = useState<Record<string, any[]>>({})
  const [logbooks, setLogbooks] = useState<Record<string, any>>({})
  const [logbookHistory, setLogbookHistory] = useState<Record<string, any[]>>({})
  const [showLogbookDialog, setShowLogbookDialog] = useState<Record<string, boolean>>({})
  const [showLogbookHistory, setShowLogbookHistory] = useState<Record<string, boolean>>({})
  const [isLoadingLogbook, setIsLoadingLogbook] = useState<Record<string, boolean>>({})

  // Fetch supervised students
  const fetchStudents = async () => {
    if (userLoading || !user?.id) return

    try {
      setIsLoadingStudents(true)
      const response = await studentsAPI.getAll()
      const studentsList = response.students || []
      
      // Calculate live progress for each student
      const transformedStudents = await Promise.all(studentsList.map(async (student: any) => {
        let calculatedProgress = 0
        
        try {
          // Fetch weekly tasks for this student
          let weeklyTasksForStudent: any[] = []
          try {
            const tasksResponse = await progressAPI.getWeeklyTasks(student.id)
            weeklyTasksForStudent = tasksResponse.tasks || []
          } catch (error: any) {
            console.log(`No weekly tasks found for student ${student.id}:`, error.message)
            weeklyTasksForStudent = []
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
          const taskCount = weeklyTasksForStudent.length > 0 ? Math.max(...weeklyTasksForStudent.map((t: any) => t.week_number)) : 0
          const TOTAL_WEEKS = taskCount || 1 // Avoid division by zero
          const submittedWeeks = validSubmissions.length
          calculatedProgress = TOTAL_WEEKS > 0 ? Math.round((submittedWeeks / TOTAL_WEEKS) * 100) : 0
        } catch (error: any) {
          console.error(`Error calculating progress for student ${student.id}:`, error)
          // Fallback to database value if calculation fails
          calculatedProgress = student.progress || 0
        }
        
        return {
          id: student.id.toString(),
          name: student.name,
          program: student.program || "N/A",
          avatar: student.avatar || "/diverse-students-studying.png",
          progress: calculatedProgress, // Use calculated progress from live data
          student_id: student.id, // Keep original ID for API calls
        }
      }))
      
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

  // Fetch documents for a specific student
  const fetchStudentDocuments = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    if (!student || !student.student_id) return

    try {
      setIsLoadingDocuments((prev) => ({ ...prev, [studentId]: true }))
      
      // Fetch weekly tasks for this student (LIVE DATA)
      let weeklyTasksForStudent: any[] = []
      try {
        const tasksResponse = await progressAPI.getWeeklyTasks(student.student_id)
        weeklyTasksForStudent = tasksResponse.tasks || []
        setWeeklyTasks((prev) => ({
          ...prev,
          [studentId]: weeklyTasksForStudent,
        }))
      } catch (error: any) {
        console.log(`No weekly tasks found for student ${student.student_id}:`, error.message)
        weeklyTasksForStudent = []
        setWeeklyTasks((prev) => ({
          ...prev,
          [studentId]: [],
        }))
      }
      
      // Fetch documents for this student (type: resource or document, uploaded by supervisor)
      const response = await documentsAPI.getAll({ 
        student_id: student.student_id,
        type: 'resource'
      })
      
      const allDocuments = response.documents || []
      
      // Filter to get supervisor-uploaded documents (not student submissions)
      const supervisorDocs = allDocuments.filter((doc: any) => 
        doc.supervisor_id && doc.student_id === student.student_id
      )
      
      // Transform documents to match expected format
      const transformedDocs = supervisorDocs.map((doc: any) => ({
        id: doc.id,
        title: doc.title || doc.file_name,
        week: doc.week_number ? doc.week_number.toString() : "general",
        type: doc.file_type?.split('/')[1]?.toUpperCase() || "FILE",
        uploadedDate: doc.created_at ? new Date(doc.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        size: doc.file_size ? `${(doc.file_size / (1024 * 1024)).toFixed(2)} MB` : "0 MB",
        description: doc.description || "",
        file_name: doc.file_name,
        documentId: doc.id,
      }))
      
      setStudentDocuments((prev) => ({
        ...prev,
        [studentId]: transformedDocs,
      }))
    } catch (error: any) {
      console.error('Error fetching documents:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load documents. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDocuments((prev) => ({ ...prev, [studentId]: false }))
    }
  }

  // Fetch logbook for a student
  const fetchLogbook = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    if (!student || !student.student_id) return

    try {
      setIsLoadingLogbook((prev) => ({ ...prev, [studentId]: true }))
      const logbookResponse = await logbookAPI.get(student.student_id)
      if (logbookResponse.logbook) {
        setLogbooks((prev) => ({ ...prev, [studentId]: logbookResponse.logbook }))
      } else {
        setLogbooks((prev) => ({ ...prev, [studentId]: null }))
      }
    } catch (error: any) {
      // Logbook doesn't exist yet, that's okay
      setLogbooks((prev) => ({ ...prev, [studentId]: null }))
    } finally {
      setIsLoadingLogbook((prev) => ({ ...prev, [studentId]: false }))
    }
  }

  // Fetch logbook history for a student
  const fetchLogbookHistory = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    if (!student || !student.student_id) return

    try {
      const historyResponse = await logbookAPI.getHistory(student.student_id)
      setLogbookHistory((prev) => ({ ...prev, [studentId]: historyResponse.history || [] }))
    } catch (error: any) {
      console.error('Error fetching logbook history:', error)
      setLogbookHistory((prev) => ({ ...prev, [studentId]: [] }))
    }
  }

  // Initial fetch
  useEffect(() => {
    if (!userLoading && user?.id) {
      fetchStudents()
    }
  }, [user?.id, userLoading])

  // Fetch logbook when student is selected
  useEffect(() => {
    if (selectedStudent && students.length > 0) {
      fetchLogbook(selectedStudent)
      fetchLogbookHistory(selectedStudent)
    }
  }, [selectedStudent, students.length])

  // Fetch documents when student is selected (only fetch for selected student to avoid blinking)
  useEffect(() => {
    if (selectedStudent && students.length > 0) {
      fetchStudentDocuments(selectedStudent)
    }
  }, [selectedStudent, students.length])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  const handleUploadSubmit = async () => {
    if (!uploadFile || !selectedStudent || !documentTitle.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const student = students.find((s) => s.id === selectedStudent)
    if (!student || !student.student_id) {
      toast({
        title: "Error",
        description: "Student not found",
        variant: "destructive",
      })
      return
    }

    // Prevent multiple submissions
    if (isUploading) {
      return
    }

    try {
      setIsUploading(true)
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('title', documentTitle)
      formData.append('description', documentDescription || '')
      formData.append('student_id', student.student_id.toString())
      formData.append('type', 'resource')
      if (selectedWeek !== 'general' && selectedWeek !== 'no-weeks') {
        formData.append('week_number', selectedWeek)
      }

      // Upload document (timeout is handled in the API function)
      await documentsAPI.upload(formData)

      toast({
        title: "Document uploaded",
        description: `${uploadFile.name} has been uploaded successfully for ${student.name}`,
      })

      // Refresh documents for this student
      await fetchStudentDocuments(selectedStudent)

      // Reset form and close dialog
      setUploadFile(null)
      setDocumentTitle("")
      setDocumentDescription("")
      setSelectedWeek("general")
      setIsUploading(false)
      setUploadDialogOpen(false)
    } catch (error: any) {
      console.error('Error uploading document:', error)
      setIsUploading(false)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDocument = async (docId: number) => {
    if (!selectedStudent) return

    try {
      await documentsAPI.delete(docId)
      
      // Refresh documents for this student
      await fetchStudentDocuments(selectedStudent)

      toast({
        title: "Document deleted",
        description: "Document has been removed successfully",
      })
    } catch (error: any) {
      console.error('Error deleting document:', error)
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadDocument = async (doc: any) => {
    // If document has an ID, use API download
    if (doc.id) {
      try {
        await documentsAPI.download(doc.id, doc.file_name || doc.title || `document-${doc.id}.pdf`)
        toast({
          title: "Download Started",
          description: `${doc.title || doc.file_name} is downloading`,
        })
      } catch (error: any) {
        console.error('Error downloading document:', error)
        toast({
          title: "Download Failed",
          description: error.message || "Failed to download document. Please try again.",
          variant: "destructive",
        })
      }
      return
    }

    // Fallback: if doc.file exists (local file object)
    if (doc.file) {
      const url = URL.createObjectURL(doc.file)
      const link = document.createElement("a")
      link.href = url
      link.download = doc.file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Download started",
        description: `${doc.title} is downloading`,
      })
    } else {
      toast({
        title: "Download Failed",
        description: "Document file not available.",
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = (doc: any) => {
    toast({
      title: doc.title,
      description: `Type: ${doc.type} | Size: ${doc.size} | Uploaded: ${doc.uploadedDate}${doc.description ? "\n\n" + doc.description : ""}`,
    })
  }

  const getStudentDocuments = (studentId: string) => {
    return studentDocuments[studentId] || []
  }

  // Handle logbook upload
  const handleLogbookUpload = async (studentId: string, file: File) => {
    const student = students.find((s) => s.id === studentId)
    if (!student || !student.student_id) {
      toast({
        title: "Error",
        description: "Student not found",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoadingLogbook((prev) => ({ ...prev, [studentId]: true }))
      
      const formData = new FormData()
      formData.append('file', file)

      const response = await logbookAPI.upload(student.student_id, formData)
      
      // Update logbook state immediately
      if (response.logbook) {
        setLogbooks((prev) => ({ ...prev, [studentId]: response.logbook }))
      } else {
        // If response doesn't have logbook, fetch it
        await fetchLogbook(studentId)
      }
      
      // Refresh history
      await fetchLogbookHistory(studentId)
      
      toast({
        title: "Logbook Uploaded",
        description: "Logbook has been uploaded successfully.",
      })
      
      // Close dialog
      setShowLogbookDialog((prev) => ({ ...prev, [studentId]: false }))
    } catch (error: any) {
      console.error('Logbook upload error:', error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logbook. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingLogbook((prev) => ({ ...prev, [studentId]: false }))
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
              <Link
                href="/supervisor/meetings"
                className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
              >
                Meetings
              </Link>
              <Link href="/supervisor/documents" className="text-sm font-medium px-4 py-2 rounded-lg text-foreground bg-muted/50 transition-smooth hover:bg-muted">
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
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center z-10">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>

              {showNotifications && (
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
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={markAllAsRead}>
                        Mark All as Read
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-transparent text-destructive hover:text-destructive"
                        onClick={clearAll}
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

      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Document Management</h2>
          <p className="text-muted-foreground">Upload and manage documents for your supervised students</p>
        </div>

        {/* Students List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Selection Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Supervised Students</CardTitle>
                <CardDescription>Select a student to manage their documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoadingStudents ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Loading students...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No students found</p>
                    <p className="text-sm">You don't have any supervised students yet.</p>
                  </div>
                ) : (
                  students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student.id)}
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        selectedStudent === student.id
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getUploadUrl(student.avatar)} alt={student.name} />
                          <AvatarFallback>
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{student.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{student.program}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{student.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-accent h-1.5 rounded-full transition-all"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Management Area */}
          <div className="lg:col-span-2">
            {selectedStudent ? (
              <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Documents for {students.find((s) => s.id === selectedStudent)?.name}</CardTitle>
                      <CardDescription>{students.find((s) => s.id === selectedStudent)?.program}</CardDescription>
                    </div>
                    <Dialog 
                      open={uploadDialogOpen} 
                      onOpenChange={(open) => {
                        // Prevent closing dialog while uploading
                        if (!isUploading) {
                          setUploadDialogOpen(open)
                          if (!open) {
                            // Reset form when dialog closes
                            setUploadFile(null)
                            setDocumentTitle("")
                            setDocumentDescription("")
                            setSelectedWeek("general")
                          }
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button className="bg-accent hover:bg-accent/90">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Upload Document</DialogTitle>
                          <DialogDescription>
                            Upload a document for {students.find((s) => s.id === selectedStudent)?.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="document-title">Document Title *</Label>
                            <Input
                              id="document-title"
                              placeholder="e.g., Research Guidelines, Week 1 Materials"
                              value={documentTitle}
                              onChange={(e) => setDocumentTitle(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="week-select">Assign to Week (Optional)</Label>
                            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                              <SelectTrigger id="week-select">
                                <SelectValue placeholder="Select week" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General Resources</SelectItem>
                                {selectedStudent && weeklyTasks[selectedStudent] && weeklyTasks[selectedStudent].length > 0 ? (
                                  // Show only weeks that exist for this student (LIVE DATA)
                                  weeklyTasks[selectedStudent]
                                    .sort((a: any, b: any) => a.week_number - b.week_number)
                                    .map((task: any) => (
                                      <SelectItem key={task.week_number} value={task.week_number.toString()}>
                                        Week {task.week_number}: {task.title || `Week ${task.week_number}`}
                                      </SelectItem>
                                    ))
                                ) : (
                                  // Fallback: show message if no weeks assigned
                                  <SelectItem value="no-weeks" disabled>
                                    No weeks assigned to this student
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {selectedStudent && (!weeklyTasks[selectedStudent] || weeklyTasks[selectedStudent].length === 0) && (
                              <p className="text-xs text-muted-foreground">
                                No weeks have been assigned to this student yet. Assign weeks in the student's progress page.
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="file-upload">Upload File *</Label>
                            <Input
                              id="file-upload"
                              type="file"
                              onChange={handleFileUpload}
                              className="cursor-pointer"
                            />
                            {uploadFile && <p className="text-sm text-muted-foreground">Selected: {uploadFile.name}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                              id="description"
                              placeholder="Add any notes or instructions about this document..."
                              rows={3}
                              value={documentDescription}
                              onChange={(e) => setDocumentDescription(e.target.value)}
                            />
                          </div>

                          <div className="flex gap-2 justify-end pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (!isUploading) {
                                  setUploadDialogOpen(false)
                                  setUploadFile(null)
                                  setDocumentTitle("")
                                  setDocumentDescription("")
                                  setSelectedWeek("general")
                                }
                              }}
                              disabled={isUploading}
                            >
                              Cancel
                            </Button>
                            <Button
                              className="flex-1"
                              onClick={handleUploadSubmit}
                              disabled={!uploadFile || !documentTitle.trim() || isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                "Upload Document"
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="all">
                        All Documents ({getStudentDocuments(selectedStudent).length})
                      </TabsTrigger>
                      <TabsTrigger value="general">
                        General ({getStudentDocuments(selectedStudent).filter((d) => d.week === "general").length})
                      </TabsTrigger>
                      <TabsTrigger value="weekly">
                        Weekly ({getStudentDocuments(selectedStudent).filter((d) => d.week !== "general").length})
                      </TabsTrigger>
                      <TabsTrigger value="logbook">
                        Logbook
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="space-y-3 mt-4">
                      {isLoadingDocuments[selectedStudent] ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>Loading documents...</p>
                        </div>
                      ) : getStudentDocuments(selectedStudent).length > 0 ? (
                        getStudentDocuments(selectedStudent).map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div
                              className="flex items-center gap-3 flex-1 cursor-pointer"
                              onClick={() => handleViewDetails(doc)}
                            >
                              <div className="w-10 h-10 bg-destructive/10 rounded flex items-center justify-center">
                                <FileText className="h-5 w-5 text-destructive" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{doc.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-muted-foreground">Uploaded: {doc.uploadedDate}</p>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <p className="text-xs text-muted-foreground">{doc.size}</p>
                                  {doc.week !== "general" && (
                                    <>
                                      <span className="text-xs text-muted-foreground">•</span>
                                      <Badge variant="outline" className="text-xs">
                                        Week {doc.week}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{doc.type}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadDocument(doc)}
                                title="Download document"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument(doc.id)}
                                title="Delete document"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No documents uploaded yet</p>
                          <p className="text-sm">Click "Upload Document" to add resources for this student</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="general" className="space-y-3 mt-4">
                      {isLoadingDocuments[selectedStudent] ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>Loading documents...</p>
                        </div>
                      ) : getStudentDocuments(selectedStudent).filter((doc) => doc.week === "general").length > 0 ? (
                        getStudentDocuments(selectedStudent)
                          .filter((doc) => doc.week === "general")
                          .map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div
                                className="flex items-center gap-3 flex-1 cursor-pointer"
                                onClick={() => handleViewDetails(doc)}
                              >
                                <div className="w-10 h-10 bg-destructive/10 rounded flex items-center justify-center">
                                  <FileText className="h-5 w-5 text-destructive" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{doc.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-muted-foreground">Uploaded: {doc.uploadedDate}</p>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <p className="text-xs text-muted-foreground">{doc.size}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{doc.type}</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadDocument(doc)}
                                  title="Download document"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  title="Delete document"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>No general documents uploaded</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="weekly" className="space-y-3 mt-4">
                      {isLoadingDocuments[selectedStudent] ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>Loading documents...</p>
                        </div>
                      ) : getStudentDocuments(selectedStudent).filter((doc) => doc.week !== "general").length > 0 ? (
                        getStudentDocuments(selectedStudent)
                          .filter((doc) => doc.week !== "general")
                          .map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div
                                className="flex items-center gap-3 flex-1 cursor-pointer"
                                onClick={() => handleViewDetails(doc)}
                              >
                                <div className="w-10 h-10 bg-destructive/10 rounded flex items-center justify-center">
                                  <FileText className="h-5 w-5 text-destructive" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{doc.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-muted-foreground">Uploaded: {doc.uploadedDate}</p>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <p className="text-xs text-muted-foreground">{doc.size}</p>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <Badge variant="outline" className="text-xs">
                                      Week {doc.week}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{doc.type}</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadDocument(doc)}
                                  title="Download document"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  title="Delete document"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>No weekly documents uploaded</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="logbook" className="space-y-4 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Logbook</h3>
                          <p className="text-sm text-muted-foreground">Manage student's research logbook</p>
                        </div>
                        {logbookHistory[selectedStudent] && logbookHistory[selectedStudent].length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowLogbookHistory((prev) => ({ ...prev, [selectedStudent]: true }))
                              fetchLogbookHistory(selectedStudent)
                            }}
                          >
                            View History
                          </Button>
                        )}
                      </div>
                      {isLoadingLogbook[selectedStudent] ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Loading logbook...</p>
                        </div>
                      ) : logbooks[selectedStudent] ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{logbooks[selectedStudent].file_name}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Version {logbooks[selectedStudent].version} • Uploaded by {logbooks[selectedStudent].uploaded_by_name} ({logbooks[selectedStudent].uploaded_by_role === 'student' ? 'Student' : 'You'})
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(logbooks[selectedStudent].created_at).toLocaleDateString("en-US", { 
                                  year: "numeric", 
                                  month: "long", 
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const student = students.find((s) => s.id === selectedStudent)
                                if (!student?.student_id) return
                                try {
                                  await logbookAPI.download(student.student_id, logbooks[selectedStudent].file_name)
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
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                          </div>
                          <Dialog 
                            open={showLogbookDialog[selectedStudent] || false} 
                            onOpenChange={(open) => setShowLogbookDialog((prev) => ({ ...prev, [selectedStudent]: open }))}
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full">
                                <Upload className="mr-2 h-4 w-4" />
                                Upload New Version
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Upload Logbook</DialogTitle>
                                <DialogDescription>
                                  Upload a new version of the student's logbook. This will create version {logbooks[selectedStudent] ? logbooks[selectedStudent].version + 1 : 1}.
                                </DialogDescription>
                              </DialogHeader>
                              <LogbookUploadForm 
                                studentId={selectedStudent}
                                onSubmit={async (file: File) => {
                                  await handleLogbookUpload(selectedStudent, file)
                                }}
                                onCancel={() => setShowLogbookDialog((prev) => ({ ...prev, [selectedStudent]: false }))}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-muted-foreground"
                            >
                              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                            </svg>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">No logbook uploaded yet</p>
                          <Dialog 
                            open={showLogbookDialog[selectedStudent] || false} 
                            onOpenChange={(open) => setShowLogbookDialog((prev) => ({ ...prev, [selectedStudent]: open }))}
                          >
                            <DialogTrigger asChild>
                              <Button>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Logbook
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Upload Logbook</DialogTitle>
                                <DialogDescription>
                                  Upload the student's logbook file.
                                </DialogDescription>
                              </DialogHeader>
                              <LogbookUploadForm 
                                studentId={selectedStudent}
                                onSubmit={async (file: File) => {
                                  await handleLogbookUpload(selectedStudent, file)
                                }}
                                onCancel={() => setShowLogbookDialog((prev) => ({ ...prev, [selectedStudent]: false }))}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Logbook History Dialog */}
              <Dialog 
                open={showLogbookHistory[selectedStudent] || false} 
                onOpenChange={(open) => setShowLogbookHistory((prev) => ({ ...prev, [selectedStudent]: open }))}
              >
                <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Logbook History</DialogTitle>
                    <DialogDescription>
                      View all versions of the student's logbook, including uploads and updates.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-4">
                    {!logbookHistory[selectedStudent] || logbookHistory[selectedStudent].length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No history available</p>
                    ) : (
                      logbookHistory[selectedStudent].map((entry: any) => {
                        const student = students.find((s) => s.id === selectedStudent)
                        return (
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
                                  if (!student?.student_id) return
                                  try {
                                    await logbookAPI.download(student.student_id, entry.file_name)
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
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          </Card>
                        )
                      })
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Select a Student</h3>
                  <p className="text-muted-foreground">
                    Choose a student from the list to view and manage their documents
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LogbookUploadForm({ studentId, onSubmit, onCancel }: { 
  studentId: string
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
          disabled={!uploadFile || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload"
          )}
        </Button>
      </div>
    </form>
  )
}
