"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  TrendingUp,
  GraduationCap,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Bell,
  Loader2,
  Download,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useNotifications } from "@/lib/notifications-context"
import { studentsAPI, meetingsAPI, documentsAPI, progressAPI, getUploadUrl } from "@/lib/api"
import { useUser } from "@/lib/user-context"

export default function AdminReportsPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, clearAll } = useNotifications()
  const { toast } = useToast()

  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  
  // Real-time data states
  const [progressAnalytics, setProgressAnalytics] = useState<any[]>([])
  const [meetingStats, setMeetingStats] = useState<Array<{
    month: string;
    year: number;
    scheduled: number;
    completed: number;
    cancelled: number;
  }>>([])
  const [documentStats, setDocumentStats] = useState<any[]>([])
  const [topPerformers, setTopPerformers] = useState<any[]>([])
  const [atRiskStudents, setAtRiskStudents] = useState<any[]>([])
  const [keyMetrics, setKeyMetrics] = useState({
    totalStudents: 0,
    avgProgress: 0,
    meetingsThisMonth: 0,
    pendingReviews: 0,
  })

  // Define actual program names from UTM
  const programNames: Record<string, string> = {
    "PhD Computer Science": "Doctor of Philosophy (PhD) Field: Computer Science",
    "PhD Software Engineering": "Doctor of Philosophy (PhD) Field: Software Engineering",
    "PhD Informatics Engineering": "Doctor of Philosophy (PhD) Field: Informatics Engineering",
    "Masters Computer Science": "Master of Science (Field: Computer Science)",
    "Masters Data Science": "Data Science",
    "Masters Cyber Security": "Cyber Security",
    "Masters Software Engineering": "Software Engineering",
    "Masters Informatics Engineering": "Informatics Engineering",
    "MPhil Computer Science": "Master by Research / Master of Philosophy (MPhil) (Field: Computer Science)",
  }

  // Fetch all reports data
  const fetchReportsData = useCallback(async (showLoading = false) => {
    if (userLoading || !user?.id) return

    try {
      if (showLoading) {
        setIsLoadingData(true)
      }

      // Fetch all students (filter to active only)
      const studentsResponse = await studentsAPI.getAll()
      const allStudents = studentsResponse.students || []
      const studentsList = allStudents.filter((student: any) => student.user_status === "active")

      // Fetch all meetings
      const meetingsResponse = await meetingsAPI.getAll()
      const meetingsList = meetingsResponse.meetings || []

      // Fetch all documents
      const documentsResponse = await documentsAPI.getAll()
      const documentsList = documentsResponse.documents || []

      // Calculate LIVE progress for each student using SAME logic as student dashboard
      // Progress = (submitted weeks with documents / total assigned weeks) * 100
      const studentsWithLiveProgress = await Promise.all(
        studentsList.map(async (student: any) => {
          try {
            // Fetch weekly tasks and submissions - same as student dashboard
            const [tasksResponse, submissionsResponse, docsResponse] = await Promise.all([
              progressAPI.getWeeklyTasks(student.id),
              progressAPI.getWeeklySubmissions(student.id),
              documentsAPI.getAll({ student_id: student.id })
            ])
            
            const weeklyTasks = tasksResponse.tasks || []
            const submissions = submissionsResponse.submissions || []
            const studentDocs = docsResponse.documents || []
            
            // Build set of weeks that have documents (same as student dashboard)
            const documentsByWeek = new Set<number>()
            studentDocs.forEach((doc: any) => {
              if (doc.week_number) {
                documentsByWeek.add(doc.week_number)
              }
            })
            
            // Calculate total weeks from assigned tasks (same as student dashboard)
            const TOTAL_WEEKS = weeklyTasks.length > 0 
              ? Math.max(...weeklyTasks.map((t: any) => t.week_number)) 
              : 0
            
            // Only count submissions with status 'submitted' AND document exists (same as student dashboard)
            const validSubmissions = submissions.filter((sub: any) => {
              const hasStatus = sub.status === 'submitted'
              const hasDocument = documentsByWeek.has(sub.week_number)
              return hasStatus && hasDocument
            })
            const submittedWeeks = validSubmissions.length
            
            // Calculate progress same as student dashboard
            const liveProgress = TOTAL_WEEKS > 0 
              ? Math.round((submittedWeeks / TOTAL_WEEKS) * 100) 
              : 0
            
            return {
              ...student,
              progress: liveProgress
            }
          } catch (error) {
            // If error fetching data, return 0 progress
            return {
              ...student,
              progress: 0
            }
          }
        })
      )

      // Group students by program and calculate statistics
      const programMap: Record<string, { students: any[] }> = {}
      
      studentsWithLiveProgress.forEach((student: any) => {
        const program = student.program || "Unknown"
        if (!programMap[program]) {
          programMap[program] = { students: [] }
        }
        programMap[program].students.push(student)
      })

      // Calculate progress analytics by program (LIVE DATA from milestones)
      const analytics = Object.entries(programMap).map(([program, data]) => {
        const students = data.students
        const totalStudents = students.length
        
        // Calculate average progress from live milestone data
        const totalProgress = students.reduce((sum: number, s: any) => sum + (s.progress || 0), 0)
        const avgProgress = totalStudents > 0 ? Math.round(totalProgress / totalStudents) : 0
        
        // Determine on-track (>= 50% progress) and delayed (< 50% progress)
        const onTrack = students.filter((s: any) => (s.progress || 0) >= 50).length
        const delayed = students.filter((s: any) => (s.progress || 0) < 50).length

        // Map to actual program name
        const actualProgramName = programNames[program] || program

        return {
          program: actualProgramName,
          students: totalStudents,
          avgProgress,
          onTrack,
          delayed,
        }
      })
      // Sort by program name for consistent display
      .sort((a, b) => a.program.localeCompare(b.program))

      setProgressAnalytics(analytics)

      // Calculate meeting statistics by month (LIVE DATA from meetings API)
      // Only count meetings that are approved (upcoming), completed, or cancelled
      // Do NOT count pending meetings (waiting for supervisor approval)
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      const monthlyStats: Record<string, { scheduled: number; completed: number; cancelled: number; year: number }> = {}
      
      // Process only approved/completed/cancelled meetings (NOT pending)
      meetingsList.forEach((meeting: any) => {
        if (!meeting.date) return
        
        // Skip pending meetings - only count approved, completed, or cancelled
        if (meeting.status === 'pending') return
        
        try {
          const meetingDate = new Date(meeting.date)
          if (isNaN(meetingDate.getTime())) return // Skip invalid dates
          
          const monthName = meetingDate.toLocaleString('default', { month: 'short' })
          const year = meetingDate.getFullYear()
          const monthKey = `${monthName} ${year}`
          
          if (!monthlyStats[monthKey]) {
            monthlyStats[monthKey] = { scheduled: 0, completed: 0, cancelled: 0, year }
          }
          
          // Check meeting status (LIVE DATA from database)
          if (meeting.status === 'completed') {
            monthlyStats[monthKey].scheduled++ // Count in total scheduled
            monthlyStats[monthKey].completed++
          } else if (meeting.status === 'cancelled') {
            monthlyStats[monthKey].scheduled++ // Count in total scheduled
            monthlyStats[monthKey].cancelled++
          } else if (meeting.status === 'approved') {
            monthlyStats[monthKey].scheduled++ // Count approved as scheduled/upcoming
            // Check if approved meeting date/time has passed (should be considered completed)
            try {
              const meetingDateTime = new Date(`${meeting.date}T${meeting.time || '00:00:00'}`)
              if (meetingDateTime < now) {
                // Meeting date has passed, count as completed
                monthlyStats[monthKey].completed++
              }
              // If not passed yet, it's upcoming (only counted in scheduled)
            } catch (error) {
              // If date parsing fails, just count as scheduled
            }
          }
        } catch (error) {
          console.error('Error processing meeting date:', error)
        }
      })

      // Sort by date (most recent first) and take last 6 months for better visibility
      const meetingStatsArray = Object.entries(monthlyStats)
        .sort((a, b) => {
          // Sort by year and month
          const dateA = new Date(a[0])
          const dateB = new Date(b[0])
          return dateB.getTime() - dateA.getTime()
        })
        .slice(0, 6) // Last 6 months
        .map(([monthKey, stats]) => {
          const [monthName, year] = monthKey.split(' ')
          return {
            month: monthName,
            year: parseInt(year),
            scheduled: stats.scheduled,
            completed: stats.completed,
            cancelled: stats.cancelled,
          }
        })
        .reverse() // Reverse to show oldest first

      setMeetingStats(meetingStatsArray)

      // Calculate document statistics
      const docTypeMap: Record<string, { submitted: number; pending: number; approved: number }> = {}
      
      documentsList.forEach((doc: any) => {
        const type = doc.type || 'Other'
        if (!docTypeMap[type]) {
          docTypeMap[type] = { submitted: 0, pending: 0, approved: 0 }
        }
        docTypeMap[type].submitted++
        // Assuming status field exists, otherwise default to pending
        if (doc.status === 'approved' || doc.status === 'reviewed') {
          docTypeMap[type].approved++
        } else {
          docTypeMap[type].pending++
        }
      })

      const documentStatsArray = Object.entries(docTypeMap).map(([type, stats]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        submitted: stats.submitted,
        pending: stats.pending,
        approved: stats.approved,
      }))

      setDocumentStats(documentStatsArray)

      // Calculate top performers (students with highest progress) - using live progress
      const sortedByProgress = [...studentsWithLiveProgress]
        .filter((s: any) => s.progress > 0)
        .sort((a: any, b: any) => b.progress - a.progress)
        .slice(0, 5)
        .map((student: any) => ({
          name: student.name || "N/A",
          program: programNames[student.program] || student.program || "N/A",
          progress: student.progress,
          supervisor: student.supervisor_name || "Unassigned",
        }))

      setTopPerformers(sortedByProgress)

      // Calculate at-risk students (students with low progress) - using live progress
      const atRisk = [...studentsWithLiveProgress]
        .filter((s: any) => s.progress < 50)
        .sort((a: any, b: any) => a.progress - b.progress)
        .slice(0, 5)
        .map((student: any) => ({
          name: student.name || "N/A",
          program: programNames[student.program] || student.program || "N/A",
          progress: student.progress,
          issue: student.progress === 0 ? "No progress yet" : "Low progress rate",
        }))

      setAtRiskStudents(atRisk)

      // Calculate key metrics - using live progress
      const totalStudents = studentsWithLiveProgress.length
      const totalProgressSum = studentsWithLiveProgress.reduce((sum: number, s: any) => sum + (s.progress || 0), 0)
      const avgProgress = totalStudents > 0 ? Math.round(totalProgressSum / totalStudents) : 0
      
      // Only count approved/upcoming meetings this month (not pending)
      const thisMonthMeetings = meetingsList.filter((m: any) => {
        if (!m.date) return false
        // Only count approved, completed, or cancelled meetings (not pending)
        if (m.status === 'pending') return false
        const meetingDate = new Date(m.date)
        return meetingDate.getMonth() === currentMonth && meetingDate.getFullYear() === currentYear
      }).length

      const pendingDocs = documentsList.filter((d: any) => 
        d.status !== 'approved' && d.status !== 'reviewed'
      ).length

      setKeyMetrics({
        totalStudents,
        avgProgress,
        meetingsThisMonth: thisMonthMeetings,
        pendingReviews: pendingDocs,
      })

    } catch (error: any) {
      console.error('Error fetching reports data:', error)
      if (showLoading) {
        toast({
          title: "Error",
          description: error.message || "Failed to load reports data. Please refresh the page.",
          variant: "destructive",
        })
      }
    } finally {
      if (showLoading) {
        setIsLoadingData(false)
      }
    }
  }, [user?.id, userLoading, toast])

  useEffect(() => {
    if (!userLoading && user?.id) {
      // Initial load with loading state
      fetchReportsData(true)
      
      // Poll for updates every 5 seconds for real-time data
      const interval = setInterval(() => {
        fetchReportsData(false)
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [user?.id, userLoading, fetchReportsData])

  const handleGenerateAIReport = async (reportType: string) => {
    setIsGeneratingReport(true)

    try {
      // Create PDF document
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 14
      
      // Helper to get current Y position after autoTable
      const getTableEndY = (): number => {
        return (doc as any).lastAutoTable?.finalY || 50
      }

      // Header with gradient-like effect
      doc.setFillColor(37, 99, 235)
      doc.rect(0, 0, pageWidth, 45, 'F')
      
      // Title
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('UTMGradient', margin, 20)
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`${reportType} Report`, margin, 32)
      
      // Date
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, pageWidth - margin, 32, { align: 'right' })
      
      let yPosition = 55
      doc.setTextColor(0, 0, 0)

      switch (reportType) {
        case "Progress Analytics": {
          // Summary Cards
          doc.setFillColor(248, 250, 252)
          doc.roundedRect(margin, yPosition, 85, 25, 2, 2, 'F')
          doc.roundedRect(margin + 90, yPosition, 85, 25, 2, 2, 'F')
          
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(100, 100, 100)
          doc.text('Total Students', margin + 5, yPosition + 8)
          doc.text('Average Progress', margin + 95, yPosition + 8)
          
          doc.setFontSize(16)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(37, 99, 235)
          doc.text(keyMetrics.totalStudents.toString(), margin + 5, yPosition + 20)
          doc.text(`${keyMetrics.avgProgress}%`, margin + 95, yPosition + 20)
          
          yPosition += 35
          doc.setTextColor(0, 0, 0)
          
          // Progress by Program Table
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.text('Progress by Program', margin, yPosition)
          yPosition += 5
          
          const progressData = progressAnalytics.map(p => [
            p.program || 'N/A',
            p.students?.toString() || '0',
            p.onTrack?.toString() || '0',
            p.delayed?.toString() || '0',
            `${p.avgProgress || 0}%`
          ])
          
          autoTable(doc, {
            startY: yPosition,
            head: [['Program', 'Students', 'On Track', 'Delayed', 'Avg Progress']],
            body: progressData.length > 0 ? progressData : [['No data available', '-', '-', '-', '-']],
            theme: 'striped',
            headStyles: { 
              fillColor: [37, 99, 235],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9
            },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
              0: { cellWidth: 70 },
              1: { cellWidth: 25, halign: 'center' },
              2: { cellWidth: 25, halign: 'center' },
              3: { cellWidth: 25, halign: 'center' },
              4: { cellWidth: 30, halign: 'center' },
            },
            margin: { left: margin, right: margin },
          })
          break
        }
        
        case "Meeting Reports": {
          // Summary Cards
          const totalMeetings = meetingStats.reduce((sum, m) => sum + m.scheduled, 0)
          const completedMeetings = meetingStats.reduce((sum, m) => sum + m.completed, 0)
          const cancelledMeetings = meetingStats.reduce((sum, m) => sum + m.cancelled, 0)
          const completionRate = totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 0
          
          doc.setFillColor(248, 250, 252)
          doc.roundedRect(margin, yPosition, 42, 25, 2, 2, 'F')
          doc.roundedRect(margin + 46, yPosition, 42, 25, 2, 2, 'F')
          doc.roundedRect(margin + 92, yPosition, 42, 25, 2, 2, 'F')
          doc.roundedRect(margin + 138, yPosition, 42, 25, 2, 2, 'F')
          
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(100, 100, 100)
          doc.text('Total', margin + 5, yPosition + 8)
          doc.text('Completed', margin + 51, yPosition + 8)
          doc.text('Cancelled', margin + 97, yPosition + 8)
          doc.text('Completion %', margin + 143, yPosition + 8)
          
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(37, 99, 235)
          doc.text(totalMeetings.toString(), margin + 5, yPosition + 20)
          doc.setTextColor(16, 185, 129)
          doc.text(completedMeetings.toString(), margin + 51, yPosition + 20)
          doc.setTextColor(239, 68, 68)
          doc.text(cancelledMeetings.toString(), margin + 97, yPosition + 20)
          doc.setTextColor(37, 99, 235)
          doc.text(`${completionRate}%`, margin + 143, yPosition + 20)
          
          yPosition += 35
          doc.setTextColor(0, 0, 0)
          
          // Monthly Stats Table
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.text('Monthly Meeting Statistics', margin, yPosition)
          yPosition += 5
          
          const meetingData = meetingStats.map(m => [
            `${m.month} ${m.year}`,
            m.scheduled.toString(),
            m.completed.toString(),
            m.cancelled.toString(),
            m.scheduled > 0 ? `${Math.round((m.completed / m.scheduled) * 100)}%` : '0%'
          ])
          
          autoTable(doc, {
            startY: yPosition,
            head: [['Month', 'Scheduled', 'Completed', 'Cancelled', 'Rate']],
            body: meetingData.length > 0 ? meetingData : [['No data available', '-', '-', '-', '-']],
            theme: 'striped',
            headStyles: { 
              fillColor: [16, 185, 129],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9
            },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
              0: { cellWidth: 40 },
              1: { cellWidth: 35, halign: 'center' },
              2: { cellWidth: 35, halign: 'center' },
              3: { cellWidth: 35, halign: 'center' },
              4: { cellWidth: 30, halign: 'center' },
            },
            margin: { left: margin, right: margin },
          })
          break
        }
        
        case "Document Statistics": {
          // Summary Cards
          const totalDocs = documentStats.reduce((sum, d) => sum + d.submitted, 0)
          const pendingDocs = documentStats.reduce((sum, d) => sum + d.pending, 0)
          const approvedDocs = documentStats.reduce((sum, d) => sum + d.approved, 0)
          const approvalRate = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0
          
          doc.setFillColor(248, 250, 252)
          doc.roundedRect(margin, yPosition, 42, 25, 2, 2, 'F')
          doc.roundedRect(margin + 46, yPosition, 42, 25, 2, 2, 'F')
          doc.roundedRect(margin + 92, yPosition, 42, 25, 2, 2, 'F')
          doc.roundedRect(margin + 138, yPosition, 42, 25, 2, 2, 'F')
          
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(100, 100, 100)
          doc.text('Total', margin + 5, yPosition + 8)
          doc.text('Pending', margin + 51, yPosition + 8)
          doc.text('Approved', margin + 97, yPosition + 8)
          doc.text('Approval %', margin + 143, yPosition + 8)
          
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(37, 99, 235)
          doc.text(totalDocs.toString(), margin + 5, yPosition + 20)
          doc.setTextColor(245, 158, 11)
          doc.text(pendingDocs.toString(), margin + 51, yPosition + 20)
          doc.setTextColor(16, 185, 129)
          doc.text(approvedDocs.toString(), margin + 97, yPosition + 20)
          doc.setTextColor(37, 99, 235)
          doc.text(`${approvalRate}%`, margin + 143, yPosition + 20)
          
          yPosition += 35
          doc.setTextColor(0, 0, 0)
          
          // Document Types Table
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.text('Documents by Type', margin, yPosition)
          yPosition += 5
          
          const docData = documentStats.map(d => [
            d.type || 'Unknown',
            d.submitted.toString(),
            d.pending.toString(),
            d.approved.toString(),
            d.submitted > 0 ? `${Math.round((d.approved / d.submitted) * 100)}%` : '0%'
          ])
          
          autoTable(doc, {
            startY: yPosition,
            head: [['Document Type', 'Submitted', 'Pending', 'Approved', 'Rate']],
            body: docData.length > 0 ? docData : [['No data available', '-', '-', '-', '-']],
            theme: 'striped',
            headStyles: { 
              fillColor: [245, 158, 11],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9
            },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
              0: { cellWidth: 55 },
              1: { cellWidth: 30, halign: 'center' },
              2: { cellWidth: 30, halign: 'center' },
              3: { cellWidth: 30, halign: 'center' },
              4: { cellWidth: 30, halign: 'center' },
            },
            margin: { left: margin, right: margin },
          })
          break
        }
        
        case "Complete System": {
          // Key Metrics Summary Cards
          doc.setFillColor(248, 250, 252)
          doc.roundedRect(margin, yPosition, 42, 25, 2, 2, 'F')
          doc.roundedRect(margin + 46, yPosition, 42, 25, 2, 2, 'F')
          doc.roundedRect(margin + 92, yPosition, 42, 25, 2, 2, 'F')
          doc.roundedRect(margin + 138, yPosition, 42, 25, 2, 2, 'F')
          
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(100, 100, 100)
          doc.text('Students', margin + 5, yPosition + 8)
          doc.text('Avg Progress', margin + 51, yPosition + 8)
          doc.text('Meetings', margin + 97, yPosition + 8)
          doc.text('Pending Docs', margin + 143, yPosition + 8)
          
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(37, 99, 235)
          doc.text(keyMetrics.totalStudents.toString(), margin + 5, yPosition + 20)
          doc.text(`${keyMetrics.avgProgress}%`, margin + 51, yPosition + 20)
          doc.setTextColor(16, 185, 129)
          doc.text(keyMetrics.meetingsThisMonth.toString(), margin + 97, yPosition + 20)
          doc.setTextColor(245, 158, 11)
          doc.text(keyMetrics.pendingReviews.toString(), margin + 143, yPosition + 20)
          
          yPosition += 35
          doc.setTextColor(0, 0, 0)
          
          // Progress by Program Table
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(37, 99, 235)
          doc.text('Progress by Program', margin, yPosition)
          yPosition += 5
          
          const progressData = progressAnalytics.map(p => [
            p.program || 'N/A',
            p.students?.toString() || '0',
            p.onTrack?.toString() || '0',
            p.delayed?.toString() || '0',
            `${p.avgProgress || 0}%`
          ])
          
          autoTable(doc, {
            startY: yPosition,
            head: [['Program', 'Students', 'On Track', 'Delayed', 'Progress']],
            body: progressData.length > 0 ? progressData : [['No data available', '-', '-', '-', '-']],
            theme: 'striped',
            headStyles: { 
              fillColor: [37, 99, 235],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 8
            },
            bodyStyles: { fontSize: 7 },
            columnStyles: {
              0: { cellWidth: 65 },
              1: { cellWidth: 22, halign: 'center' },
              2: { cellWidth: 22, halign: 'center' },
              3: { cellWidth: 22, halign: 'center' },
              4: { cellWidth: 25, halign: 'center' },
            },
            margin: { left: margin, right: margin },
          })
          
          yPosition = getTableEndY() + 10
          
          // Check for page break
          if (yPosition > pageHeight - 80) {
            doc.addPage()
            yPosition = 20
          }
          
          // Top Performers Table
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(16, 185, 129)
          doc.text('Top Performers', margin, yPosition)
          yPosition += 5
          
          const topData = topPerformers.map(s => [
            s.name || 'N/A',
            s.program || 'N/A',
            s.supervisor || 'Unassigned',
            `${s.progress || 0}%`
          ])
          
          autoTable(doc, {
            startY: yPosition,
            head: [['Student Name', 'Program', 'Supervisor', 'Progress']],
            body: topData.length > 0 ? topData : [['No data available', '-', '-', '-']],
            theme: 'striped',
            headStyles: { 
              fillColor: [16, 185, 129],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 8
            },
            bodyStyles: { fontSize: 7 },
            margin: { left: margin, right: margin },
          })
          
          yPosition = getTableEndY() + 10
          
          // Check for page break
          if (yPosition > pageHeight - 80) {
            doc.addPage()
            yPosition = 20
          }
          
          // At-Risk Students Table
          if (atRiskStudents.length > 0) {
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(239, 68, 68)
            doc.text('Students Needing Attention', margin, yPosition)
            yPosition += 5
            
            const atRiskData = atRiskStudents.map(s => [
              s.name || 'N/A',
              s.program || 'N/A',
              `${s.progress || 0}%`,
              s.issue || 'Low progress'
            ])
            
            autoTable(doc, {
              startY: yPosition,
              head: [['Student Name', 'Program', 'Progress', 'Issue']],
              body: atRiskData,
              theme: 'striped',
              headStyles: { 
                fillColor: [239, 68, 68],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8
              },
              bodyStyles: { fontSize: 7 },
              margin: { left: margin, right: margin },
            })
          }
          break
        }
        
        case "Performance": {
          // Summary Cards
          doc.setFillColor(248, 250, 252)
          doc.roundedRect(margin, yPosition, 55, 25, 2, 2, 'F')
          doc.roundedRect(margin + 60, yPosition, 55, 25, 2, 2, 'F')
          doc.roundedRect(margin + 120, yPosition, 55, 25, 2, 2, 'F')
          
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(100, 100, 100)
          doc.text('Avg Progress', margin + 5, yPosition + 8)
          doc.text('Top Performers', margin + 65, yPosition + 8)
          doc.text('Need Attention', margin + 125, yPosition + 8)
          
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(37, 99, 235)
          doc.text(`${keyMetrics.avgProgress}%`, margin + 5, yPosition + 20)
          doc.setTextColor(16, 185, 129)
          doc.text(topPerformers.length.toString(), margin + 65, yPosition + 20)
          doc.setTextColor(239, 68, 68)
          doc.text(atRiskStudents.length.toString(), margin + 125, yPosition + 20)
          
          yPosition += 35
          doc.setTextColor(0, 0, 0)
          
          // Top Performers Table
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(16, 185, 129)
          doc.text('Top Performers', margin, yPosition)
          yPosition += 5
          
          const topData = topPerformers.map(s => [
            s.name || 'N/A',
            s.program || 'N/A',
            s.supervisor || 'Unassigned',
            `${s.progress || 0}%`
          ])
          
          autoTable(doc, {
            startY: yPosition,
            head: [['Student Name', 'Program', 'Supervisor', 'Progress']],
            body: topData.length > 0 ? topData : [['No data available', '-', '-', '-']],
            theme: 'striped',
            headStyles: { 
              fillColor: [16, 185, 129],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9
            },
            bodyStyles: { fontSize: 8 },
            margin: { left: margin, right: margin },
          })
          
          yPosition = getTableEndY() + 10
          
          // At-Risk Students Table
          if (atRiskStudents.length > 0) {
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(239, 68, 68)
            doc.text('Students Needing Attention', margin, yPosition)
            yPosition += 5
            
            const atRiskData = atRiskStudents.map(s => [
              s.name || 'N/A',
              s.program || 'N/A',
              `${s.progress || 0}%`,
              s.issue || 'Low progress'
            ])
            
            autoTable(doc, {
              startY: yPosition,
              head: [['Student Name', 'Program', 'Progress', 'Issue']],
              body: atRiskData,
              theme: 'striped',
              headStyles: { 
                fillColor: [239, 68, 68],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9
              },
              bodyStyles: { fontSize: 8 },
              margin: { left: margin, right: margin },
            })
          }
          break
        }
        
        default: {
          doc.setFontSize(12)
          doc.text('No data available for this report type.', margin, yPosition)
        }
      }
      
      // Footer on all pages
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(
          `Page ${i} of ${totalPages} | UTMGradient Analytics Report`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
      }
      
      // Save PDF
      const fileName = `${reportType.replace(/\s+/g, "_")}_Report_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)

      toast({
        title: "Report Generated",
        description: `${reportType} report downloaded successfully.`,
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingReport(false)
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
              <Link href="/admin/users" className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground">
                Users
              </Link>
              <Link href="/admin/reports" className="text-sm font-medium px-4 py-2 rounded-lg text-foreground bg-muted/50 transition-smooth hover:bg-muted">
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">System Reports & Analytics</h2>
            <p className="text-muted-foreground">Comprehensive insights into system performance and user activity</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleGenerateAIReport("Complete System")} disabled={isGeneratingReport}>
              {isGeneratingReport ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download report
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{isLoadingData ? "..." : keyMetrics.totalStudents}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{isLoadingData ? "..." : `${keyMetrics.avgProgress}%`}</p>
              <p className="text-sm text-muted-foreground">Avg Progress Rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{isLoadingData ? "..." : keyMetrics.meetingsThisMonth}</p>
              <p className="text-sm text-muted-foreground">Meetings This Month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{isLoadingData ? "..." : keyMetrics.pendingReviews}</p>
              <p className="text-sm text-muted-foreground">Pending Reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Reports */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList>
            <TabsTrigger value="progress">
              <BarChart3 className="h-4 w-4 mr-2" />
              Progress Analytics
            </TabsTrigger>
            <TabsTrigger value="meetings">
              <Calendar className="h-4 w-4 mr-2" />
              Meeting Reports
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Document Statistics
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Progress by Program</CardTitle>
                    <CardDescription>Student progress breakdown across different programs</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateAIReport("Progress Analytics")}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download report
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Loading progress data...</p>
                  </div>
                ) : progressAnalytics.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No program data available</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {progressAnalytics.map((program, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{program.program}</p>
                            <p className="text-sm text-muted-foreground">{program.students} students enrolled</p>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-muted-foreground">{program.onTrack} on track</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                              <span className="text-muted-foreground">{program.delayed} delayed</span>
                            </div>
                            <span className="font-semibold text-foreground">{program.avgProgress}%</span>
                          </div>
                        </div>
                        <Progress value={program.avgProgress} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meetings" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Meeting Statistics</CardTitle>
                    <CardDescription>Supervision meeting trends and completion rates</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateAIReport("Meeting Reports")}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download report
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Loading meeting data...</p>
                  </div>
                ) : meetingStats.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No meeting data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {meetingStats.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{stat.month} {stat.year}</p>
                            <p className="text-sm text-muted-foreground">{stat.scheduled} meetings scheduled</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{stat.completed}</p>
                            <p className="text-xs text-muted-foreground">Completed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{stat.cancelled}</p>
                            <p className="text-xs text-muted-foreground">Cancelled</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-foreground">
                              {stat.scheduled > 0 ? Math.round((stat.completed / stat.scheduled) * 100) : 0}%
                            </p>
                            <p className="text-xs text-muted-foreground">Success Rate</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Document Submission & Review</CardTitle>
                    <CardDescription>Track document submissions and approval status</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateAIReport("Document Statistics")}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download report
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Loading document data...</p>
                  </div>
                ) : documentStats.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No document data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documentStats.map((doc, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <p className="font-semibold text-foreground">{doc.type}</p>
                          </div>
                          <Badge variant="secondary">{doc.submitted} total</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-foreground">{doc.submitted}</p>
                            <p className="text-xs text-muted-foreground">Submitted</p>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <p className="text-2xl font-bold text-orange-600">{doc.pending}</p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{doc.approved}</p>
                            <p className="text-xs text-muted-foreground">Approved</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateAIReport("Performance")}
                disabled={isGeneratingReport}
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Performance Report
                  </>
                )}
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Students with highest progress rates</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Loading performance data...</p>
                    </div>
                  ) : topPerformers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No top performers data available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topPerformers.map((student, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.program}</p>
                            <p className="text-xs text-muted-foreground">Supervisor: {student.supervisor}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">{student.progress}%</p>
                            <p className="text-xs text-muted-foreground">Progress</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>At-Risk Students</CardTitle>
                  <CardDescription>Students requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Loading at-risk students data...</p>
                    </div>
                  ) : atRiskStudents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No at-risk students found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {atRiskStudents.map((student, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-3 border border-destructive/20 rounded-lg bg-destructive/5"
                        >
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.program}</p>
                            <p className="text-xs text-red-600">{student.issue}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-red-600">{student.progress}%</p>
                            <p className="text-xs text-muted-foreground">Progress</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

