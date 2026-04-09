"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Separator } from "@/components/ui/separator"
import { useNotifications } from "@/lib/notifications-context"
import { useUser } from "@/lib/user-context"
import { documentsAPI, progressAPI, studentsAPI, logbookAPI, getUploadUrl } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { DownloadIcon, Trash2, Eye, Pencil, Save, Loader2, Upload, BookOpen as BookOpenIcon } from "lucide-react"

interface Submission {
  week: number
  title: string
  description: string
  dueDate: string
  dueDateRaw?: string | null // Raw date string for overdue calculation
  uploadDate: string
  status: "submitted" | "pending"
  submittedFile: string | null
  fileData: string | null
  studentComments: string | null
  documentId?: number | null
  documentStatus?: string | null // Document status: 'submitted', 'pending_review', 'reviewed', 'approved', 'rejected'
  supervisorFeedback: Array<{
    text: string
    date: string
    author: string
  }>
  studentReplies: Array<{
    text: string
    date: string
    replyTo: number
  }>
  taskStatus: "OPEN" | "CLOSED"
  isOverdue?: boolean // Flag to indicate if submission is overdue
}

// Default submissions template (moved outside component to prevent recreation on each render)
// Note: taskStatus will be determined dynamically based on student progress
const defaultSubmissions: Submission[] = [
    {
      week: 1,
      title: "Project Area and Faculty Supervisor Expert Briefing",
      description: "Final Year Project 1 Briefing Project Area and Faculty Supervisor Expert Briefing",
      dueDate: "2025-10-30",
      uploadDate: "2025-09-15",
      status: "pending",
      submittedFile: null,
      fileData: null,
      studentComments: null,
      supervisorFeedback: [],
      studentReplies: [],
      taskStatus: "OPEN", // Changed to OPEN for new students
    },
    {
      week: 2,
      title: "Project Planning",
      description: "• Project Planning\n• How to complete project proposal form\n• Project Proposal Interview",
      dueDate: "2025-11-06",
      uploadDate: "2025-09-22",
      status: "pending",
      submittedFile: null,
      fileData: null,
      studentComments: null,
      supervisorFeedback: [],
      studentReplies: [],
      taskStatus: "OPEN", // Changed to OPEN for new students
    },
    {
      week: 3,
      title: "Introduction",
      description:
        "• Problem statement\n• Project Objective, Scope, Justification\n• Log Book\n• Project Discussion and Supervisory Meeting starts",
      dueDate: "2025-11-13",
      uploadDate: "2025-09-29",
      status: "pending",
      submittedFile: null,
      fileData: null,
      studentComments: null,
      supervisorFeedback: [],
      studentReplies: [],
      taskStatus: "OPEN",
    },
    {
      week: 4,
      title: "Literature Review",
      description: "• Research methodology\n• Literature review techniques\n• Citation and referencing",
      dueDate: "2025-11-20",
      uploadDate: "2025-10-06",
      status: "pending",
      submittedFile: null,
      fileData: null,
      studentComments: null,
      supervisorFeedback: [],
      studentReplies: [],
      taskStatus: "OPEN",
    },
    {
      week: 5,
      title: "Methodology and Data Collection",
      description: "• Research methodology design\n• Data collection methods\n• Sampling techniques\n• Ethical considerations",
      dueDate: "2025-11-27",
      uploadDate: "2025-10-13",
      status: "pending",
      submittedFile: null,
      fileData: null,
      studentComments: null,
      supervisorFeedback: [],
      studentReplies: [],
      taskStatus: "OPEN",
    },
    {
      week: 6,
      title: "Data Analysis and Results",
      description: "• Data analysis techniques\n• Results interpretation\n• Statistical analysis\n• Findings presentation",
      dueDate: "2025-12-04",
      uploadDate: "2025-10-20",
      status: "pending",
      submittedFile: null,
      fileData: null,
      studentComments: null,
      supervisorFeedback: [],
      studentReplies: [],
      taskStatus: "OPEN",
    },
  ]

export default function StudentDocumentsPage() {
  const { user, loading: userLoading } = useUser()
  const { toast } = useToast()
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingWeek, setEditingWeek] = useState<number | null>(null)
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null)
  const [deletingWeek, setDeletingWeek] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [submissions, setSubmissions] = useState<Submission[]>([]) // Start with empty array - only show weeks added by supervisor
  const [supervisorDocuments, setSupervisorDocuments] = useState<any[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [logbook, setLogbook] = useState<any>(null)
  const [logbookHistory, setLogbookHistory] = useState<any[]>([])
  const [showLogbookDialog, setShowLogbookDialog] = useState(false)
  const [showLogbookHistory, setShowLogbookHistory] = useState(false)
  const [isLoadingLogbook, setIsLoadingLogbook] = useState(false)
  const [studentId, setStudentId] = useState<number | null>(null)

  const { notifications, unreadCount, markAsRead, deleteNotification, clearAll, markAllAsRead } = useNotifications()

  // Refs to track previous data and prevent unnecessary updates
  const prevSubmissionsRef = useRef<string>("")
  const prevSupervisorDocsRef = useRef<string>("")
  const isInitialLoadRef = useRef(true)
  const isFetchingRef = useRef(false)

  // Ref to track viewing submission week for updates
  const viewingSubmissionWeekRef = useRef<number | null>(null)
  
  // Update ref when viewingSubmission changes
  useEffect(() => {
    viewingSubmissionWeekRef.current = viewingSubmission?.week || null
  }, [viewingSubmission])

  // Fetch submissions from API
  const fetchSubmissions = useCallback(async () => {
    if (!user?.id || isFetchingRef.current) return

    try {
      isFetchingRef.current = true
      // Only show loading on initial load
      if (isInitialLoadRef.current) {
        setIsLoading(true)
      }

      // Get student ID first
      const studentsResponse = await studentsAPI.getAll()
      const students = studentsResponse.students || []
      if (students.length === 0) {
        throw new Error("Student record not found")
      }
      const studentId = students[0].id
      setStudentId(studentId) // Store studentId for logbook

      // Fetch weekly tasks (weeks defined by supervisor) - LIVE DATA
      // Only show weeks that supervisor has added for this specific student
      let weeklyTasks: any[] = []
      try {
        const tasksResponse = await progressAPI.getWeeklyTasks(studentId)
        weeklyTasks = tasksResponse.tasks || []
        console.log('Fetched weekly tasks from database:', weeklyTasks.length)
      } catch (error: any) {
        // If no tasks exist, student will see no weeks (empty array)
        console.log('No weekly tasks found for this student:', error.message)
        weeklyTasks = []
      }

      const response = await progressAPI.getWeeklySubmissions(user.id)
      const apiSubmissions = response.submissions || []

      // Also fetch documents to get document IDs, status, and feedback
      // IMPORTANT: Get the MOST RECENT document for each week (in case student re-submitted)
      let documentsMap: { [key: number]: number } = {}
      let documentStatusMap: { [key: number]: string } = {}
      let feedbackMap: { [key: number]: Array<{ text: string; date: string; author: string }> } = {}
      try {
        const docsResponse = await documentsAPI.getAll({ type: 'submission' })
        const docs = docsResponse.documents || []
        
        // Group documents by week_number and get the most recent one for each week
        const docsByWeek: { [key: number]: any[] } = {}
        docs.forEach((doc: any) => {
          if (doc.week_number) {
            if (!docsByWeek[doc.week_number]) {
              docsByWeek[doc.week_number] = []
            }
            docsByWeek[doc.week_number].push(doc)
          }
        })
        
        // For each week, get the most recent document (sorted by created_at DESC)
        Object.keys(docsByWeek).forEach((weekStr) => {
          const week = parseInt(weekStr)
          const weekDocs = docsByWeek[week]
          // Sort by created_at descending to get most recent first
          const sortedDocs = weekDocs.sort((a: any, b: any) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          )
          const mostRecentDoc = sortedDocs[0]
          documentsMap[week] = mostRecentDoc.id
          documentStatusMap[week] = mostRecentDoc.status || 'submitted'
        })

        // Fetch feedback for the MOST RECENT document of each week only
        // This ensures we get feedback for the latest submission, not old ones
        for (const week in documentsMap) {
          const documentId = documentsMap[parseInt(week)]
          if (documentId) {
            try {
              const feedbackResponse = await documentsAPI.getFeedback(documentId)
              const reviews = feedbackResponse.reviews || []
              if (reviews.length > 0) {
                feedbackMap[parseInt(week)] = reviews.map((review: any) => ({
                  text: review.feedback,
                  date: review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : new Date(review.created_at).toLocaleString(),
                  author: review.reviewer_name || 'Supervisor',
                }))
                console.log(`Found ${reviews.length} feedback(s) for Week ${week}, document ${documentId}`)
              }
            } catch (error: any) {
              // Only log non-connection errors
              if (error.name !== 'ConnectionError' && !error.message?.includes('Backend server not available')) {
                console.error(`Error fetching feedback for document ${documentId} (Week ${week}):`, error)
              }
            }
          }
        }
      } catch (error: any) {
        // Silently handle connection errors
        if (error.name !== 'ConnectionError' && !error.message?.includes('Backend server not available')) {
          console.error('Error fetching documents for mapping:', error)
        }
      }

      // Determine task status dynamically based on progress
      // A week is OPEN if:
      // 1. It's week 1 (always open for new students)
      // 2. Previous week is submitted OR it's the next week after submitted weeks
      const submittedWeeks = apiSubmissions.filter((s: any) => s.status === 'submitted').length

      // Only use weekly tasks from database (added by supervisor)
      // If no tasks exist, student will see no weeks
      const baseSubmissions = weeklyTasks.map((task: any) => ({
        week: task.week_number,
        title: task.title,
        description: task.description || '',
        dueDate: task.due_date ? new Date(task.due_date).toLocaleString("en-US", { 
          month: "short", 
          day: "numeric", 
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }) : "TBD",
        dueDateRaw: task.due_date || null, // Store raw date for overdue calculation
        uploadDate: task.upload_date ? new Date(task.upload_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        status: "pending" as const,
        submittedFile: null,
        fileData: null,
        studentComments: null,
        supervisorFeedback: [],
        studentReplies: [],
        taskStatus: "OPEN" as const,
      }))

      // Merge API data with base submissions (from tasks or defaults)
      const currentDate = new Date()
      currentDate.setHours(0, 0, 0, 0)
      
      const mergedSubmissions = baseSubmissions.map((baseSub) => {
        const apiSub = apiSubmissions.find((s: any) => s.week_number === baseSub.week)
        
        // Determine if this week should be OPEN or CLOSED
        let taskStatus: "OPEN" | "CLOSED" = "OPEN"
        if (baseSub.week === 1) {
          // Week 1 is always OPEN
          taskStatus = "OPEN"
        } else {
          // For other weeks, check if previous week is submitted
          const prevWeek = baseSub.week - 1
          const prevWeekSubmitted = apiSubmissions.some((s: any) => s.week_number === prevWeek && s.status === 'submitted')
          
          // Week is OPEN if:
          // - Previous week is submitted, OR
          // - This is the next week after all submitted weeks (for new students starting late)
          if (prevWeekSubmitted || baseSub.week === submittedWeeks + 1) {
            taskStatus = "OPEN"
          } else if (baseSub.week > submittedWeeks + 1) {
            // Future weeks that haven't been unlocked yet are CLOSED
            taskStatus = "CLOSED"
          } else {
            // Weeks before the current progress are CLOSED (unless they're submitted)
            taskStatus = "CLOSED"
          }
        }
        
        // Check if submission is overdue (due date has passed and not submitted)
        const isOverdue = (() => {
          if (baseSub.status === 'submitted') return false // Can't be overdue if already submitted
          if (!baseSub.dueDateRaw) return false // No due date = not overdue
          
          try {
            const dueDate = new Date(baseSub.dueDateRaw)
            dueDate.setHours(0, 0, 0, 0)
            return currentDate > dueDate
          } catch {
            return false
          }
        })()
        
        if (apiSub) {
          return {
            ...baseSub,
            status: (apiSub.status === 'submitted' ? 'submitted' : 'pending') as "submitted" | "pending",
            submittedFile: apiSub.file_name || null,
            studentComments: apiSub.student_comments || null,
            uploadDate: apiSub.submission_date || baseSub.uploadDate,
            documentId: documentsMap[baseSub.week] || apiSub.document_id || null,
            supervisorFeedback: feedbackMap[baseSub.week] || [],
            documentStatus: documentStatusMap[baseSub.week] || 'submitted', // Document status from database
            taskStatus: taskStatus, // Use dynamically determined status
            isOverdue: isOverdue, // Add overdue flag
          }
        }
        return {
          ...baseSub,
          supervisorFeedback: feedbackMap[baseSub.week] || [],
          documentStatus: null, // No submission yet, so no document status
          taskStatus: taskStatus, // Use dynamically determined status
          isOverdue: isOverdue, // Add overdue flag
        }
      })

      // Always update state to ensure latest feedback is shown
      const submissionsString = JSON.stringify(mergedSubmissions)
      const hasChanged = submissionsString !== prevSubmissionsRef.current
      if (hasChanged) {
        prevSubmissionsRef.current = submissionsString
        setSubmissions(mergedSubmissions)
        
        // If viewing a submission, update it with latest data
        if (viewingSubmissionWeekRef.current) {
          const updated = mergedSubmissions.find(s => s.week === viewingSubmissionWeekRef.current)
          if (updated) {
            setViewingSubmission(updated)
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching submissions:', error)
      // Only show toast on initial load, not on polling errors
      if (isInitialLoadRef.current) {
        toast({
          title: "Error",
          description: error.message || "Failed to load submissions. Please refresh the page.",
          variant: "destructive",
        })
      }
    } finally {
      if (isInitialLoadRef.current) {
        setIsLoading(false)
        isInitialLoadRef.current = false
      }
      isFetchingRef.current = false
    }
  }, [user?.id, toast])

  // Fetch supervisor documents from API
  const fetchSupervisorDocuments = useCallback(async () => {
    if (!user?.id) return

    try {
      // Only show loading on initial load
      if (isInitialLoadRef.current) {
        setIsLoadingDocuments(true)
      }

      // Get student ID first to filter documents correctly
      const studentsResponse = await studentsAPI.getAll()
      const students = studentsResponse.students || []
      if (students.length === 0) {
        throw new Error("Student record not found")
      }
      const studentId = students[0].id

      // Fetch documents uploaded by supervisor (type: 'resource')
      // Pass student_id to ensure we only get documents for this specific student
      const response = await documentsAPI.getAll({ 
        student_id: studentId,
        type: 'resource' 
      })
      const allDocuments = response.documents || []
      
      // Filter to get supervisor documents (documents uploaded by supervisor)
      // Only include documents where:
      // 1. supervisor_id exists (uploaded by supervisor)
      // 2. student_id matches this student OR is null/undefined (general resources for this student)
      // 3. type is 'resource' or 'document'
      const supervisorDocs = allDocuments.filter((doc: any) => 
        doc.supervisor_id && 
        (doc.type === 'resource' || doc.type === 'document') &&
        (doc.student_id === studentId || doc.student_id === null || doc.student_id === undefined)
      )
      
      // Only update state if data actually changed
      const docsString = JSON.stringify(supervisorDocs.map((d: any) => ({
        id: d.id,
        file_name: d.file_name,
        created_at: d.created_at
      })))
      if (docsString !== prevSupervisorDocsRef.current) {
        prevSupervisorDocsRef.current = docsString
        setSupervisorDocuments(supervisorDocs)
      }
    } catch (error: any) {
      // Silently handle connection errors
      if (error.name !== 'ConnectionError' && !error.message?.includes('Backend server not available')) {
        console.error('Error fetching supervisor documents:', error)
        // Only show error on initial load for non-connection errors
        if (isInitialLoadRef.current) {
          toast({
            title: "Error",
            description: "Failed to load supervisor documents.",
            variant: "destructive",
          })
        }
      }
    } finally {
      if (isInitialLoadRef.current) {
        setIsLoadingDocuments(false)
      }
    }
  }, [user?.id, toast])

  useEffect(() => {
    if (user?.id && !userLoading) {
      // Only fetch on mount/reload, not continuously
      fetchSubmissions()
      fetchSupervisorDocuments()
    }
  }, [user?.id, userLoading, fetchSubmissions, fetchSupervisorDocuments])

  // Fetch logbook
  const fetchLogbook = useCallback(async () => {
    if (!studentId) return
    
    try {
      setIsLoadingLogbook(true)
      const response = await logbookAPI.get(studentId)
      setLogbook(response.logbook)
    } catch (error: any) {
      setLogbook(null)
    } finally {
      setIsLoadingLogbook(false)
    }
  }, [studentId])

  // Fetch logbook history
  const fetchLogbookHistory = useCallback(async () => {
    if (!studentId) return
    
    try {
      const response = await logbookAPI.getHistory(studentId)
      setLogbookHistory(response.history || [])
    } catch (error: any) {
      setLogbookHistory([])
    }
  }, [studentId])

  useEffect(() => {
    if (studentId) {
      fetchLogbook()
      fetchLogbookHistory()
    }
  }, [studentId, fetchLogbook, fetchLogbookHistory])

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
      
      // Update logbook state immediately
      if (response.logbook) {
        setLogbook(response.logbook)
      } else {
        await fetchLogbook()
      }
      
      // Refresh history
      if (studentId) {
        const historyResponse = await logbookAPI.getHistory(studentId)
        setLogbookHistory(historyResponse.history || [])
      }
      
      toast({
        title: "Logbook Uploaded",
        description: "Your logbook has been uploaded successfully.",
      })
      
      setShowLogbookDialog(false)
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logbook. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingLogbook(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  // Download document by ID
  const handleDownloadDocument = async (documentId: number, fileName: string) => {
    try {
      await documentsAPI.download(documentId, fileName)
      toast({
        title: "Download Started",
        description: `${fileName} is downloading`,
      })
    } catch (error: any) {
      console.error('Error downloading document:', error)
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download document. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Download submission file
  const handleViewPDF = async (submission: Submission) => {
    // First, try using documentId if available
    if (submission.documentId) {
      await handleDownloadDocument(submission.documentId, submission.submittedFile || `week-${submission.week}.pdf`)
      return
    }

    // Try to find the document ID from the API
    try {
      const allDocs = await documentsAPI.getAll({ type: 'submission' })
      const doc = allDocs.documents?.find((d: any) => 
        d.file_name === submission.submittedFile || 
        d.week_number === submission.week
      )
      
      if (doc && doc.id) {
        await handleDownloadDocument(doc.id, submission.submittedFile || `week-${submission.week}.pdf`)
        return
      }
    } catch (error) {
      console.error('Error finding document:', error)
    }

    // Fallback: if fileData exists, use the old method
    if (submission.fileData && submission.submittedFile) {
      const byteCharacters = atob(submission.fileData)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "application/pdf" })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = submission.submittedFile
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } else {
      toast({
        title: "File Not Available",
        description: "File data not available. Please contact your supervisor.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (weekNumber: number) => {
    if (!uploadFile || !user?.id) return

    setIsSubmitting(true)

    try {
      // Get student ID first
      const studentsResponse = await studentsAPI.getAll()
      const students = studentsResponse.students || []
      if (students.length === 0) {
        throw new Error("Student record not found")
      }
      const studentId = students[0].id

      // Upload file first (this will automatically create/update weekly submission and update progress)
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('title', `Week ${weekNumber} Submission`)
      formData.append('type', 'submission')
      formData.append('week_number', weekNumber.toString())

      const uploadResponse = await documentsAPI.upload(formData)

      // Update weekly submission record (students can only submit documents, no comments)
      const submission = submissions.find((s) => s.week === weekNumber)
      await progressAPI.createWeeklySubmission({
        student_id: studentId,
        week_number: weekNumber,
        title: submission?.title || `Week ${weekNumber} Submission`,
        description: submission?.description || undefined,
        student_comments: undefined, // Students cannot add comments
        file_path: uploadResponse.document?.file_path || null,
        file_name: uploadFile.name,
      })

      // Refresh submissions (this will also update progress in the backend)
      // Reset ref to force update after submission
      prevSubmissionsRef.current = ""
      await fetchSubmissions()

      setSuccessMessage(`Week ${weekNumber} submission uploaded successfully!`)
      setSelectedWeek(null)
      setUploadFile(null)
      setIsSubmitting(false)

      toast({
        title: "Submission Uploaded",
        description: "Your submission has been uploaded successfully and your progress has been updated.",
      })

      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      console.error("Error uploading submission:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload submission. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  const handleEditSubmission = async (weekNumber: number, newFile?: File) => {
    if (!user?.id) return

    setIsSubmitting(true)

    try {
      let filePath: string | null = null
      let fileName: string | null = null

      // Upload new file if provided
      if (newFile) {
        const formData = new FormData()
        formData.append('file', newFile)
        formData.append('title', `Week ${weekNumber} Submission`)
        formData.append('type', 'submission')
        formData.append('week_number', weekNumber.toString())

        const uploadResponse = await documentsAPI.upload(formData)
        filePath = uploadResponse.document?.file_path || uploadResponse.file_path || null
        fileName = newFile.name
      }

      // Update weekly submission (without comments - students can only submit documents)
      const submission = submissions.find((s) => s.week === weekNumber)
      await progressAPI.createWeeklySubmission({
        student_id: user.id,
        week_number: weekNumber,
        title: submission?.title || `Week ${weekNumber} Submission`,
        description: submission?.description || undefined,
        student_comments: undefined, // Students cannot add comments
        file_path: filePath || null,
        file_name: fileName || null,
      })

      // Refresh submissions
      // Reset ref to force update after edit
      prevSubmissionsRef.current = ""
      await fetchSubmissions()

      setSuccessMessage(`Week ${weekNumber} submission updated successfully!`)
      setEditingWeek(null)
      setUploadFile(null)
      setIsSubmitting(false)

      toast({
        title: "Submission Updated",
        description: "Your submission has been updated successfully.",
      })

      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      console.error("Error updating submission:", error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update submission. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  const handleDeleteSubmission = async (weekNumber: number) => {
    if (!user?.id) return

    setIsDeleting(true)

    try {
      const submission = submissions.find((s) => s.week === weekNumber)
      
      // Get student ID first
      const studentsResponse = await studentsAPI.getAll()
      const students = studentsResponse.students || []
      if (students.length === 0) {
        throw new Error("Student record not found")
      }
      const studentId = students[0].id

      // Delete the document if documentId exists
      if (submission?.documentId) {
        try {
          await documentsAPI.delete(submission.documentId)
        } catch (error: any) {
          console.error('Error deleting document:', error)
          // Continue even if document deletion fails (document might already be deleted)
        }
      }

      // Delete the weekly submission record
      await progressAPI.deleteWeeklySubmission(studentId, weekNumber)

      // Refresh submissions
      prevSubmissionsRef.current = ""
      await fetchSubmissions()

      setDeletingWeek(null)
      setIsDeleting(false)

      toast({
        title: "Submission Deleted",
        description: `Week ${weekNumber} submission has been deleted successfully.`,
      })
    } catch (error: any) {
      console.error("Error deleting submission:", error)
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete submission. Please try again.",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }


  const handleMarkAsRead = (notificationId: number) => {
    markAsRead(notificationId)
  }

  const handleDeleteNotification = (notificationId: number) => {
    deleteNotification(notificationId)
  }

  const handleClearAll = () => {
    clearAll()
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
                className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/student/meetings"
                className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
              >
                Meetings
              </Link>
              <Link href="/student/documents" className="text-sm font-medium px-4 py-2 rounded-lg text-foreground bg-muted/50 transition-smooth hover:bg-muted">
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
            <NotificationsDropdown
              unreadCount={unreadCount}
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
              onClearAll={handleClearAll}
              onMarkAllAsRead={markAllAsRead}
            />
            <Link href="/student/profile" className="cursor-pointer">
              <Avatar>
                <AvatarImage src={getUploadUrl(user?.avatar)} alt="Student" />
                <AvatarFallback>{user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'ST'}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Documents</h2>
          <p className="text-muted-foreground">Manage your submissions and supervisor documents</p>
        </div>

        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Supervisor Documents Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Supervisor Documents</CardTitle>
            <CardDescription>Documents and resources shared by your supervisor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoadingDocuments ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading documents...</p>
              ) : supervisorDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No supervisor documents available</p>
              ) : (
                supervisorDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-destructive/10 rounded flex items-center justify-center">
                        <FileTextIcon className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{doc.title || doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded: {doc.uploadedDate || (doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A')}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadDocument(doc.id, doc.file_name || doc.title || `document-${doc.id}.pdf`)}
                    >
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Logbook Section */}
        <Card className="p-6 border-0 shadow-elevation-lg hover:shadow-elevation-xl transition-all duration-300 bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl -z-0"></div>
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-accent to-primary rounded-full"></div>
                  Logbook
                </CardTitle>
                <CardDescription>Upload and manage your research logbook</CardDescription>
              </div>
              {logbookHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowLogbookHistory(true)
                    fetchLogbookHistory()
                  }}
                >
                  View History
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
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
                      <Upload className="mr-2 h-4 w-4" />
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
                <Dialog open={showLogbookDialog} onOpenChange={setShowLogbookDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
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
          </CardContent>
        </Card>

        {/* Logbook History Dialog */}
        <Dialog open={showLogbookHistory} onOpenChange={setShowLogbookHistory}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Logbook History</DialogTitle>
              <DialogDescription>
                View all versions of your logbook, including uploads and supervisor updates.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {logbookHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No history available</p>
              ) : (
                logbookHistory.map((entry) => (
                  <Card key={entry.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Version {entry.version}</Badge>
                          <Badge variant={entry.uploaded_by_role === 'student' ? 'default' : 'secondary'}>
                            {entry.uploaded_by_role === 'student' ? 'Uploaded by You' : 'Received from Supervisor'}
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
                          if (!studentId) return
                          try {
                            await logbookAPI.download(studentId, entry.file_name)
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
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Weekly Progress Submissions Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Weekly Progress Submissions</h2>

          {submissions.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2 border-muted-foreground/20 bg-muted/10">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">No Weekly Submissions Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Your supervisor hasn't added any weekly tasks yet. Once they add weekly tasks, you'll be able to submit your work here.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            submissions.map((submission) => (
            <Card key={submission.week} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <CardTitle className="text-lg font-semibold">Week {submission.week}</CardTitle>
                      <Badge 
                        variant={submission.taskStatus === "OPEN" ? "default" : "secondary"}
                        className="px-2.5 py-0.5 text-xs font-medium"
                      >
                        {submission.taskStatus}
                      </Badge>
                      <Badge 
                        variant={submission.status === "submitted" ? "default" : "outline"}
                        className={`px-2.5 py-0.5 text-xs font-medium ${
                          submission.status === "submitted" 
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" 
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {submission.status === "submitted" ? "✓ Submitted" : "Pending"}
                      </Badge>
                      {/* Show "OVERDUE" badge when due date has passed and not submitted */}
                      {submission.isOverdue && submission.status !== "submitted" && (
                        <Badge 
                          variant="outline" 
                          className="px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800"
                        >
                          Overdue
                        </Badge>
                      )}
                      {/* Show "Correction Needed" badge when document status is pending_review or rejected AND there's a submission */}
                      {submission.status === 'submitted' && (submission.documentStatus === 'pending_review' || submission.documentStatus === 'rejected') && (
                        <Badge 
                          variant="destructive" 
                          className="px-3 py-1 text-xs font-semibold bg-red-500 text-white border-0 shadow-sm animate-pulse"
                        >
                          <span className="mr-1.5">⚠️</span>
                          Correction Needed
                        </Badge>
                      )}
                      {/* Show "Approved" badge when document is approved AND there's a submission */}
                      {submission.status === 'submitted' && submission.documentStatus === 'approved' && (
                        <Badge 
                          variant="default" 
                          className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-sm hover:from-green-600 hover:to-green-700 transition-all"
                        >
                          <span className="mr-1.5">✓</span>
                          Approved
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm font-medium text-foreground">
                      {submission.title}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {submission.status === "pending" && (
                      <Dialog
                        open={selectedWeek === submission.week}
                        onOpenChange={(open) => !open && setSelectedWeek(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium px-4"
                            onClick={() => setSelectedWeek(submission.week)}
                          >
                            <span className="mr-1.5">+</span>
                            Add Submission
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Submit Work - Week {submission.week}</DialogTitle>
                            <DialogDescription>{submission.title}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Upload Date</p>
                                <p className="font-medium">{submission.uploadDate}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Due Date</p>
                                <p className="font-medium text-destructive">{submission.dueDate}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Task Status</p>
                                <p className="font-medium">{submission.taskStatus}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">File Format</p>
                                <p className="font-medium">PDF, DOCX</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="file-upload">Upload File</Label>
                              <Input
                                id="file-upload"
                                type="file"
                                accept=".pdf,.docx"
                                onChange={handleFileUpload}
                                className="cursor-pointer"
                              />
                              {uploadFile && (
                                <p className="text-sm text-muted-foreground">Selected: {uploadFile.name}</p>
                              )}
                            </div>

                            <Button
                              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold py-2.5"
                              onClick={() => handleSubmit(submission.week)}
                              disabled={!uploadFile || isSubmitting}
                            >
                              {isSubmitting ? (
                                <span className="flex items-center justify-center">
                                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                  Submitting...
                                </span>
                              ) : (
                                <span className="flex items-center justify-center">
                                  <Upload className="mr-2 h-4 w-4" />
                                  Submit Work
                                </span>
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    {submission.status === "submitted" && (
                      <>
                        <Button 
                          size="sm" 
                          variant="default" 
                          onClick={() => setViewingSubmission(submission)}
                          className="bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium px-4"
                        >
                          <Eye className="mr-1.5 h-4 w-4" />
                          View Submission
                        </Button>
                        <Dialog
                          open={editingWeek === submission.week}
                          onOpenChange={(open) => !open && setEditingWeek(null)}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingWeek(submission.week)}
                              className="border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 dark:border-primary/30 dark:text-primary dark:hover:bg-primary/20 shadow-sm hover:shadow-md transition-all duration-200 font-medium px-4"
                            >
                              <Pencil className="mr-1.5 h-4 w-4" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Submission - Week {submission.week}</DialogTitle>
                              <DialogDescription>{submission.title}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Upload Date</p>
                                  <p className="font-medium">{submission.uploadDate}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Due Date</p>
                                  <p className="font-medium text-destructive">{submission.dueDate}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Task Status</p>
                                  <p className="font-medium">{submission.taskStatus}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">File Format</p>
                                  <p className="font-medium">PDF, DOCX</p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="edit-file-upload">Replace File</Label>
                                <Input
                                  id="edit-file-upload"
                                  type="file"
                                  accept=".pdf,.docx"
                                  onChange={handleFileUpload}
                                  className="cursor-pointer"
                                />
                                {uploadFile && (
                                  <p className="text-sm text-muted-foreground">Selected: {uploadFile.name}</p>
                                )}
                                {!uploadFile && (
                                  <p className="text-sm text-muted-foreground">Current: {submission.submittedFile}</p>
                                )}
                              </div>

                              <Button
                                className="w-full bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold py-2.5"
                                onClick={() =>
                                  handleEditSubmission(
                                    submission.week,
                                    uploadFile || undefined,
                                  )
                                }
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? (
                                  <span className="flex items-center justify-center">
                                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                    Updating...
                                  </span>
                                ) : (
                                  <span className="flex items-center justify-center">
                                    <Save className="mr-2 h-4 w-4" />
                                    Update Submission
                                  </span>
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Dialog
                          open={deletingWeek === submission.week}
                          onOpenChange={(open) => !open && setDeletingWeek(null)}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => setDeletingWeek(submission.week)}
                              className="bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium px-4"
                            >
                              <Trash2 className="h-4 w-4 mr-1.5" />
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Delete Submission</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete your Week {submission.week} submission? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex gap-3 justify-end mt-6">
                              <Button
                                variant="outline"
                                onClick={() => setDeletingWeek(null)}
                                disabled={isDeleting}
                                className="px-6 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDeleteSubmission(submission.week)}
                                disabled={isDeleting}
                                className="px-6 bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                              >
                                {isDeleting ? (
                                  <span className="flex items-center">
                                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                    Deleting...
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Submission
                                  </span>
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{submission.description}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Upload Date</p>
                      <p className="font-medium">{submission.uploadDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p className="font-medium text-destructive">{submission.dueDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Task Status</p>
                      <p className="font-medium">{submission.taskStatus}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">File Format</p>
                      <p className="font-medium">PDF, DOCX</p>
                    </div>
                  </div>

                  {submission.status === "submitted" && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold mb-3">Submission Status</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Submission Status:</span>
                          <Badge variant="default">Submitted</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">File Submission:</span>
                          <button
                            onClick={() => handleViewPDF(submission)}
                            className="text-sm text-destructive hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <FileTextIcon className="h-4 w-4" />
                            {submission.submittedFile} (Download)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {submission.status === "pending" && (
                    <Alert>
                      <AlertDescription>
                        No submission yet. Please upload your work before the due date: {submission.dueDate}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={viewingSubmission !== null} onOpenChange={(open) => !open && setViewingSubmission(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details - Week {viewingSubmission?.week}</DialogTitle>
            <DialogDescription>{viewingSubmission?.title}</DialogDescription>
          </DialogHeader>

          {viewingSubmission && (
            <SubmissionDetailsView 
              submission={viewingSubmission}
              onRefresh={async () => {
                // Refresh submissions to get latest feedback
                prevSubmissionsRef.current = ""
                await fetchSubmissions()
                // Use a callback to get the latest submissions state
                setSubmissions((prevSubs) => {
                  const updated = prevSubs.find(s => s.week === viewingSubmission.week)
                  if (updated) {
                    // Update viewingSubmission with latest feedback
                    setViewingSubmission(updated)
                  }
                  return prevSubs
                })
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SubmissionDetailsView({ 
  submission, 
  onRefresh 
}: { 
  submission: Submission
  onRefresh: () => void
}) {
  const [currentFeedback, setCurrentFeedback] = useState(submission.supervisorFeedback)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Refresh feedback when submission changes or periodically
  useEffect(() => {
    // Update current feedback when submission prop changes
    setCurrentFeedback(submission.supervisorFeedback)
    
    // Refresh feedback every 3 seconds if document has an ID (faster updates)
    if (submission.documentId) {
      // Initial fetch
      const fetchFeedback = async () => {
        try {
          setIsRefreshing(true)
          const feedbackResponse = await documentsAPI.getFeedback(submission.documentId!)
          const reviews = feedbackResponse.reviews || []
          const formattedFeedback = reviews.length > 0 ? reviews.map((review: any) => ({
            text: review.feedback,
            date: review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : new Date(review.created_at).toLocaleString(),
            author: review.reviewer_name || 'Supervisor',
          })) : []
          
          // Also fetch document to get latest status (in case student re-submitted and new document was created)
          let statusChanged = false
          try {
            const docResponse = await documentsAPI.getAll({ type: 'submission' })
            const docs = docResponse.documents || []
            const weekDocs = docs.filter((d: any) => d.week_number === submission.week)
            if (weekDocs.length > 0) {
              // Get most recent document for this week
              const sortedDocs = weekDocs.sort((a: any, b: any) => 
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
              )
              const latestDoc = sortedDocs[0]
              
              // If document status changed, trigger refresh
              if (latestDoc.status !== submission.documentStatus) {
                statusChanged = true
              }
            }
          } catch (docError) {
            // Silently fail - not critical
          }
          
          // Always update feedback state (React will handle re-renders efficiently)
          setCurrentFeedback(formattedFeedback)
          
          // Check if feedback changed by comparing with submission prop
          const submissionFeedbackStr = JSON.stringify(submission.supervisorFeedback)
          const newFeedbackStr = JSON.stringify(formattedFeedback)
          
          // Trigger parent refresh if feedback changed OR document status changed
          if (submissionFeedbackStr !== newFeedbackStr || statusChanged) {
            // Trigger parent refresh to update the submission list
            onRefresh()
          }
        } catch (error: any) {
          // Only log non-connection errors
          if (error.name !== 'ConnectionError' && !error.message?.includes('Backend server not available')) {
            console.error('Error refreshing feedback:', error)
          }
        } finally {
          setIsRefreshing(false)
        }
      }

      // Fetch immediately on mount only
      fetchFeedback()
    } else {
      // If no documentId, try to fetch it from the API
      const fetchDocumentId = async () => {
        try {
          const docsResponse = await documentsAPI.getAll({ type: 'submission' })
          const docs = docsResponse.documents || []
          const doc = docs.find((d: any) => d.week_number === submission.week)
          if (doc?.id) {
            // Document found, trigger refresh to update submission with documentId
            onRefresh()
          }
        } catch (error) {
          // Silently fail
        }
      }
      fetchDocumentId()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission.documentId, submission.week])

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground text-sm">Due Date</Label>
            <p className="font-medium text-foreground mt-1">{submission.dueDate}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Status</Label>
            <div className="mt-1">
                      <Badge 
                        variant={submission.status === "submitted" ? "default" : "outline"}
                        className={`px-2.5 py-0.5 text-xs font-medium ${
                          submission.status === "submitted" 
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" 
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {submission.status === "submitted" ? "✓ Submitted" : "Pending"}
                      </Badge>
                      {/* Show "OVERDUE" badge when due date has passed and not submitted */}
                      {submission.isOverdue && submission.status !== "submitted" && (
                        <Badge 
                          variant="outline" 
                          className="ml-2 px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800"
                        >
                          Overdue
                        </Badge>
                      )}
                      {/* Show "Correction Needed" badge when document status is pending_review or rejected AND there's a submission */}
                      {submission.status === 'submitted' && (submission.documentStatus === 'pending_review' || submission.documentStatus === 'rejected') && (
                        <Badge 
                          variant="destructive" 
                          className="ml-2 px-3 py-1 text-xs font-semibold bg-red-500 text-white border-0 shadow-sm animate-pulse"
                        >
                          <span className="mr-1.5">⚠️</span>
                          Correction Needed
                        </Badge>
                      )}
                      {/* Show "Approved" badge when document is approved AND there's a submission */}
                      {submission.status === 'submitted' && submission.documentStatus === 'approved' && (
                        <Badge 
                          variant="default" 
                          className="ml-2 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-sm hover:from-green-600 hover:to-green-700 transition-all"
                        >
                          <span className="mr-1.5">✓</span>
                          Approved
                        </Badge>
                      )}
                    </div>
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-foreground font-semibold">Submitted File</Label>
          <div className="mt-2 p-4 border border-border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileTextIcon className="h-8 w-8 text-accent" />
                <div>
                  <p className="font-medium text-foreground">{submission.submittedFile}</p>
                  <p className="text-sm text-muted-foreground">PDF Document</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={async () => {
                  if (submission.documentId) {
                    try {
                      await documentsAPI.download(submission.documentId, submission.submittedFile || `week-${submission.week}.pdf`)
                    } catch (error) {
                      console.error('Error downloading:', error)
                    }
                  }
                }}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Label className="text-foreground font-semibold text-base">Supervisor Feedback</Label>
              {/* Show correction needed alert if status is pending_review or rejected AND there's a submission */}
              {submission.status === 'submitted' && (submission.documentStatus === 'pending_review' || submission.documentStatus === 'rejected') && (
                <Badge 
                  variant="destructive" 
                  className="text-xs px-3 py-1 font-semibold bg-red-500 text-white border-0 shadow-sm animate-pulse"
                >
                  <span className="mr-1.5">⚠️</span>
                  Correction Needed
                </Badge>
              )}
              {/* Show approved badge if document is approved AND there's a submission */}
              {submission.status === 'submitted' && submission.documentStatus === 'approved' && (
                <Badge 
                  variant="default" 
                  className="text-xs px-3 py-1 font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-sm hover:from-green-600 hover:to-green-700 transition-all"
                >
                  <span className="mr-1.5">✓</span>
                  Approved - No Correction Needed
                </Badge>
              )}
            </div>
            {isRefreshing && (
              <span className="text-xs text-muted-foreground animate-pulse">🔄 Refreshing...</span>
            )}
          </div>

          {currentFeedback.length > 0 ? (
            <div className="mt-3 space-y-4">
              {currentFeedback.map((feedback, idx) => (
                <div key={idx} className="p-4 border border-blue-200 rounded-lg bg-blue-50/50">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/supervisor-avatar.png" alt="Supervisor" />
                      <AvatarFallback className="bg-blue-600 text-white text-xs">SV</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm text-blue-900">{feedback.author}</p>
                        <p className="text-xs text-blue-700">{feedback.date}</p>
                      </div>
                      <p className="text-sm text-blue-800">{feedback.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic mt-2">No supervisor feedback yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
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

