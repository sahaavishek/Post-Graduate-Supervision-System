"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { DownloadReportButton } from "@/components/download-report-button"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { documentsAPI, studentsAPI, progressAPI, notificationsAPI, messagesAPI, meetingsAPI, logbookAPI, getUploadUrl } from "@/lib/api"
import { useUser } from "@/lib/user-context"
import { useNotifications } from "@/lib/notifications-context"
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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

const allStudents = [
  {
    id: 1,
    name: "Ahmad Ibrahim",
    program: "PhD Computer Science",
    progress: 68,
    status: "on-track",
    avatar: "/placeholder.svg?key=st01",
    email: "ahmad@utm.my",
    phone: "+60 12-345 6789",
    startDate: "Jan 2024",
    expectedCompletion: "May 2024",
    supervisor: "Dr. Sarah Ahmad",
    weeklyProgress: [
      {
        week: 1,
        topic: "Project Area and Faculty Supervisor Expert Briefing",
        status: "completed",
        dueDate: "Jan 15, 2024",
        submission: "Briefing_Report.pdf",
        submittedDate: "Jan 14, 2024",
      },
      {
        week: 2,
        topic: "Project Planning and Proposal Form Preparation",
        status: "completed",
        dueDate: "Jan 22, 2024",
        submission: "Proposal_Form.pdf",
        submittedDate: "Jan 21, 2024",
      },
      {
        week: 3,
        topic: "Problem Statement and Project Objectives",
        status: "completed",
        dueDate: "Jan 29, 2024",
        submission: "Problem_Statement.pdf",
        submittedDate: "Jan 28, 2024",
      },
      {
        week: 4,
        topic: "Literature Review - Part 1",
        status: "completed",
        dueDate: "Feb 5, 2024",
        submission: "Literature_Review_1.pdf",
        submittedDate: "Feb 4, 2024",
      },
      {
        week: 5,
        topic: "Literature Review - Part 2",
        status: "completed",
        dueDate: "Feb 12, 2024",
        submission: "Literature_Review_2.pdf",
        submittedDate: "Feb 11, 2024",
      },
      {
        week: 6,
        topic: "Research Methodology Design",
        status: "completed",
        dueDate: "Feb 19, 2024",
        submission: "Methodology.pdf",
        submittedDate: "Feb 18, 2024",
      },
      {
        week: 7,
        topic: "Data Collection Planning",
        status: "completed",
        dueDate: "Feb 26, 2024",
        submission: "Data_Plan.pdf",
        submittedDate: "Feb 25, 2024",
      },
      {
        week: 8,
        topic: "Research Tools and Techniques",
        status: "completed",
        dueDate: "Mar 4, 2024",
        submission: "Tools_Report.pdf",
        submittedDate: "Mar 3, 2024",
      },
      {
        week: 9,
        topic: "Preliminary Data Analysis",
        status: "in-progress",
        dueDate: "Mar 11, 2024",
        submission: "Pending",
        submittedDate: "-",
      },
      {
        week: 10,
        topic: "System Design and Architecture",
        status: "pending",
        dueDate: "Mar 18, 2024",
        submission: "Not Started",
        submittedDate: "-",
      },
      {
        week: 11,
        topic: "Implementation Phase 1",
        status: "pending",
        dueDate: "Mar 25, 2024",
        submission: "Not Started",
        submittedDate: "-",
      },
      {
        week: 12,
        topic: "Implementation Phase 2",
        status: "pending",
        dueDate: "Apr 1, 2024",
        submission: "Not Started",
        submittedDate: "-",
      },
      {
        week: 13,
        topic: "Testing and Validation",
        status: "pending",
        dueDate: "Apr 8, 2024",
        submission: "Not Started",
        submittedDate: "-",
      },
      {
        week: 14,
        topic: "Results Analysis and Discussion",
        status: "pending",
        dueDate: "Apr 15, 2024",
        submission: "Not Started",
        submittedDate: "-",
      },
      {
        week: 15,
        topic: "Thesis Writing and Documentation",
        status: "pending",
        dueDate: "Apr 22, 2024",
        submission: "Not Started",
        submittedDate: "-",
      },
      {
        week: 16,
        topic: "Final Review and Submission Preparation",
        status: "pending",
        dueDate: "Apr 29, 2024",
        submission: "Not Started",
        submittedDate: "-",
      },
    ],
    milestones: [
      {
        week: "1-2",
        name: "Project Initiation",
        topics: ["Project briefing", "Proposal preparation"],
        progress: 100,
        status: "completed",
      },
      {
        week: "3-4",
        name: "Problem Definition",
        topics: ["Problem statement", "Objectives", "Literature review"],
        progress: 100,
        status: "completed",
      },
      {
        week: "5-6",
        name: "Research Foundation",
        topics: ["Extended literature review", "Methodology design"],
        progress: 100,
        status: "completed",
      },
      {
        week: "7-8",
        name: "Research Planning",
        topics: ["Data collection planning", "Tools selection"],
        progress: 100,
        status: "completed",
      },
      {
        week: "9-10",
        name: "Data Analysis & Design",
        topics: ["Preliminary analysis", "System architecture"],
        progress: 50,
        status: "in-progress",
      },
      {
        week: "11-12",
        name: "Implementation",
        topics: ["Phase 1 development", "Phase 2 development"],
        progress: 0,
        status: "pending",
      },
      {
        week: "13-14",
        name: "Testing & Analysis",
        topics: ["Testing and validation", "Results analysis"],
        progress: 0,
        status: "pending",
      },
      {
        week: "15-16",
        name: "Finalization",
        topics: ["Thesis writing", "Final review"],
        progress: 0,
        status: "pending",
      },
    ],
    documentsSubmitted: 8,
    pendingReviews: 2,
    meetingsThisMonth: 3,
    lastMeeting: "3 days ago",
    recentActivities: [
      { title: "Preliminary Data Analysis submitted", time: "2 days ago" },
      { title: "Week 8 completed", time: "5 days ago" },
      { title: "Meeting with supervisor", time: "1 week ago" },
    ],
  },
  {
    id: 2,
    name: "Fatimah Hassan",
    program: "Masters Software Engineering",
    progress: 85,
    status: "on-track",
    avatar: "/placeholder.svg?key=st02",
    email: "fatimah@utm.my",
    phone: "+60 13-456 7890",
    startDate: "Sep 2023",
    expectedCompletion: "Aug 2025",
    supervisor: "Dr. Sarah Ahmad",
    weeklyProgress: [
      {
        week: 1,
        topic: "Project Area and Faculty Supervisor Expert Briefing",
        status: "completed",
        dueDate: "Sep 15, 2023",
        submission: "Briefing_Report.pdf",
        submittedDate: "Sep 14, 2023",
      },
      {
        week: 2,
        topic: "Project Planning and Proposal Form Preparation",
        status: "completed",
        dueDate: "Sep 22, 2023",
        submission: "Proposal_Form.pdf",
        submittedDate: "Sep 21, 2023",
      },
      {
        week: 3,
        topic: "Problem Statement and Project Objectives",
        status: "completed",
        dueDate: "Sep 29, 2023",
        submission: "Problem_Statement.pdf",
        submittedDate: "Sep 28, 2023",
      },
      {
        week: 4,
        topic: "Literature Review - Part 1",
        status: "completed",
        dueDate: "Oct 6, 2023",
        submission: "Literature_Review_1.pdf",
        submittedDate: "Oct 5, 2023",
      },
      {
        week: 5,
        topic: "Literature Review - Part 2",
        status: "completed",
        dueDate: "Oct 13, 2023",
        submission: "Literature_Review_2.pdf",
        submittedDate: "Oct 12, 2023",
      },
      {
        week: 6,
        topic: "Research Methodology Design",
        status: "completed",
        dueDate: "Oct 20, 2023",
        submission: "Methodology.pdf",
        submittedDate: "Oct 19, 2023",
      },
      {
        week: 7,
        topic: "Data Collection Planning",
        status: "completed",
        dueDate: "Oct 27, 2023",
        submission: "Data_Plan.pdf",
        submittedDate: "Oct 26, 2023",
      },
      {
        week: 8,
        topic: "Research Tools and Techniques",
        status: "completed",
        dueDate: "Nov 3, 2023",
        submission: "Tools_Report.pdf",
        submittedDate: "Nov 2, 2023",
      },
      {
        week: 9,
        topic: "Preliminary Data Analysis",
        status: "completed",
        dueDate: "Nov 10, 2023",
        submission: "Analysis_Report.pdf",
        submittedDate: "Nov 9, 2023",
      },
      {
        week: 10,
        topic: "System Design and Architecture",
        status: "completed",
        dueDate: "Nov 17, 2023",
        submission: "Design_Doc.pdf",
        submittedDate: "Nov 16, 2023",
      },
      {
        week: 11,
        topic: "Implementation Phase 1",
        status: "completed",
        dueDate: "Nov 24, 2023",
        submission: "Implementation_1.pdf",
        submittedDate: "Nov 23, 2023",
      },
      {
        week: 12,
        topic: "Implementation Phase 2",
        status: "completed",
        dueDate: "Dec 1, 2023",
        submission: "Implementation_2.pdf",
        submittedDate: "Nov 30, 2023",
      },
      {
        week: 13,
        topic: "Testing and Validation",
        status: "completed",
        dueDate: "Dec 8, 2023",
        submission: "Testing_Report.pdf",
        submittedDate: "Dec 7, 2023",
      },
      {
        week: 14,
        topic: "Results Analysis and Discussion",
        status: "in-progress",
        dueDate: "Dec 15, 2023",
        submission: "Pending",
        submittedDate: "-",
      },
      {
        week: 15,
        topic: "Thesis Writing and Documentation",
        status: "pending",
        dueDate: "Dec 22, 2023",
        submission: "Not Started",
        submittedDate: "-",
      },
      {
        week: 16,
        topic: "Final Review and Submission Preparation",
        status: "pending",
        dueDate: "Dec 29, 2023",
        submission: "Not Started",
        submittedDate: "-",
      },
    ],
    milestones: [
      {
        week: "1-2",
        name: "Project Initiation",
        topics: ["Project briefing", "Proposal preparation"],
        progress: 100,
        status: "completed",
      },
      {
        week: "3-4",
        name: "Problem Definition",
        topics: ["Problem statement", "Objectives", "Literature review"],
        progress: 100,
        status: "completed",
      },
      {
        week: "5-6",
        name: "Research Foundation",
        topics: ["Extended literature review", "Methodology design"],
        progress: 100,
        status: "completed",
      },
      {
        week: "7-8",
        name: "Research Planning",
        topics: ["Data collection planning", "Tools selection"],
        progress: 100,
        status: "completed",
      },
      {
        week: "9-10",
        name: "Data Analysis & Design",
        topics: ["Preliminary analysis", "System architecture"],
        progress: 100,
        status: "completed",
      },
      {
        week: "11-12",
        name: "Implementation",
        topics: ["Phase 1 development", "Phase 2 development"],
        progress: 100,
        status: "completed",
      },
      {
        week: "13-14",
        name: "Testing & Analysis",
        topics: ["Testing and validation", "Results analysis"],
        progress: 50,
        status: "in-progress",
      },
      {
        week: "15-16",
        name: "Finalization",
        topics: ["Thesis writing", "Final review"],
        progress: 0,
        status: "pending",
      },
    ],
    documentsSubmitted: 13,
    pendingReviews: 1,
    meetingsThisMonth: 4,
    lastMeeting: "1 week ago",
    recentActivities: [
      { title: "Results Analysis in progress", time: "1 day ago" },
      { title: "Week 13 completed", time: "3 days ago" },
      { title: "Meeting with supervisor", time: "1 week ago" },
    ],
  },
  {
    id: 3,
    name: "Muhammad Ali",
    program: "PhD Artificial Intelligence",
    progress: 45,
    status: "needs-attention",
    avatar: "/placeholder.svg?key=st03",
    email: "muhammad@utm.my",
    phone: "+60 14-567 8901",
    startDate: "Jan 2024",
    expectedCompletion: "Dec 2027",
    supervisor: "Dr. Sarah Ahmad",
    weeklyProgress: [
      {
        week: 1,
        topic: "Project Area and Faculty Supervisor Expert Briefing",
        status: "completed",
        dueDate: "Jan 15, 2024",
        submission: "Briefing_Report.pdf",
        submittedDate: "Jan 14, 2024",
      },
      {
        week: 2,
        topic: "Project Planning and Proposal Form Preparation",
        status: "completed",
        dueDate: "Jan 22, 2024",
        submission: "Proposal_Form.pdf",
        submittedDate: "Jan 21, 2024",
      },
      {
        week: 3,
        topic: "Problem Statement and Project Objectives",
        status: "completed",
        dueDate: "Jan 29, 2024",
        submission: "Problem_Statement.pdf",
        submittedDate: "Jan 30, 2024",
      },
      {
        week: 4,
        topic: "Literature Review - Part 1",
        status: "completed",
        dueDate: "Feb 5, 2024",
        submission: "Literature_Review_1.pdf",
        submittedDate: "Feb 7, 2024",
      },
      {
        week: 5,
        topic: "Literature Review - Part 2",
        status: "completed",
        dueDate: "Feb 12, 2024",
        submission: "Literature_Review_2.pdf",
        submittedDate: "Feb 15, 2024",
      },
      {
        week: 6,
        topic: "Research Methodology Design",
        status: "completed",
        dueDate: "Feb 19, 2024",
        submission: "Methodology.pdf",
        submittedDate: "Feb 22, 2024",
      },
      {
        week: 7,
        topic: "Data Collection Planning",
        status: "completed",
        dueDate: "Feb 26, 2024",
        submission: "Data_Plan.pdf",
        submittedDate: "Feb 28, 2024",
      },
      {
        week: 8,
        topic: "Research Tools and Techniques",
        status: "in-progress",
        dueDate: "Mar 4, 2024",
        submission: "Pending",
        submittedDate: "-",
      },
      {
        week: 9,
        topic: "Preliminary Data Analysis",
        status: "pending",
        dueDate: "Mar 11, 2024",
        submission: "Not Started",
        submittedDate: "-",
      },
      {
        week: 10,
        topic: "System Design and Architecture",
        status: "pending",
        dueDate: "Mar 18, 2024",
        submission: "Not Started",
        submittedDate: "-",
      },
      {
        week: 11,
        topic: "Implementation Phase 1",
        status: "pending",
        dueDate: "Mar 25, 2024",
        submission: "Not Started",
        submittedDate: "-",
      },
      {
        week: 12,
        topic: "Implementation Phase 2",
        status: "pending",
        dueDate: "Apr 1, 2024",
        submission: "Not Started",
        submittedDate: "-",
      },
      {
        week: 13,
        topic: "Testing and Validation",
        status: "pending",
        dueDate: "Apr 8, 2024",
        submission: "Not Started",
        submittedDate: "-",
      },
      {
        week: 14,
        topic: "Results Analysis and Discussion",
        status: "pending",
        dueDate: "Apr 15, 2024",
        submission: "Not Started",
        submittedDate: "-",
      },
      {
        week: 15,
        topic: "Thesis Writing and Documentation",
        status: "pending",
        dueDate: "Apr 22, 2024",
        submission: "Not Started",
        submittedDate: "-",
      },
      {
        week: 16,
        topic: "Final Review and Submission Preparation",
        status: "pending",
        dueDate: "Apr 29, 2024",
        submission: "Not Started",
        submittedDate: "-",
      },
    ],
    milestones: [
      {
        week: "1-2",
        name: "Project Initiation",
        topics: ["Project briefing", "Proposal preparation"],
        progress: 100,
        status: "completed",
      },
      {
        week: "3-4",
        name: "Problem Definition",
        topics: ["Problem statement", "Objectives", "Literature review"],
        progress: 100,
        status: "completed",
      },
      {
        week: "5-6",
        name: "Research Foundation",
        topics: ["Extended literature review", "Methodology design"],
        progress: 100,
        status: "completed",
      },
      {
        week: "7-8",
        name: "Research Planning",
        topics: ["Data collection planning", "Tools selection"],
        progress: 50,
        status: "in-progress",
      },
      {
        week: "9-10",
        name: "Data Analysis & Design",
        topics: ["Preliminary analysis", "System architecture"],
        progress: 0,
        status: "pending",
      },
      {
        week: "11-12",
        name: "Implementation",
        topics: ["Phase 1 development", "Phase 2 development"],
        progress: 0,
        status: "pending",
      },
      {
        week: "13-14",
        name: "Testing & Analysis",
        topics: ["Testing and validation", "Results analysis"],
        progress: 0,
        status: "pending",
      },
      {
        week: "15-16",
        name: "Finalization",
        topics: ["Thesis writing", "Final review"],
        progress: 0,
        status: "pending",
      },
    ],
    documentsSubmitted: 7,
    pendingReviews: 1,
    meetingsThisMonth: 1,
    lastMeeting: "3 weeks ago",
    recentActivities: [
      { title: "Week 7 completed (late)", time: "2 days ago" },
      { title: "Missed deadline for Week 8", time: "5 days ago" },
      { title: "Meeting with supervisor", time: "3 weeks ago" },
    ],
  },
  {
    id: 4,
    name: "Aisha Rahman",
    program: "Masters Data Science",
    progress: 92,
    status: "on-track",
    avatar: "/placeholder.svg?key=st04",
    email: "aisha@utm.my",
    phone: "+60 15-678 9012",
    startDate: "Sep 2023",
    expectedCompletion: "Aug 2025",
    supervisor: "Dr. Sarah Ahmad",
    weeklyProgress: [
      {
        week: 1,
        topic: "Project Area and Faculty Supervisor Expert Briefing",
        status: "completed",
        dueDate: "Sep 15, 2023",
        submission: "Briefing_Report.pdf",
        submittedDate: "Sep 14, 2023",
      },
      {
        week: 2,
        topic: "Project Planning and Proposal Form Preparation",
        status: "completed",
        dueDate: "Sep 22, 2023",
        submission: "Proposal_Form.pdf",
        submittedDate: "Sep 21, 2023",
      },
      {
        week: 3,
        topic: "Problem Statement and Project Objectives",
        status: "completed",
        dueDate: "Sep 29, 2023",
        submission: "Problem_Statement.pdf",
        submittedDate: "Sep 28, 2023",
      },
      {
        week: 4,
        topic: "Literature Review - Part 1",
        status: "completed",
        dueDate: "Oct 6, 2023",
        submission: "Literature_Review_1.pdf",
        submittedDate: "Oct 5, 2023",
      },
      {
        week: 5,
        topic: "Literature Review - Part 2",
        status: "completed",
        dueDate: "Oct 13, 2023",
        submission: "Literature_Review_2.pdf",
        submittedDate: "Oct 12, 2023",
      },
      {
        week: 6,
        topic: "Research Methodology Design",
        status: "completed",
        dueDate: "Oct 20, 2023",
        submission: "Methodology.pdf",
        submittedDate: "Oct 19, 2023",
      },
      {
        week: 7,
        topic: "Data Collection Planning",
        status: "completed",
        dueDate: "Oct 27, 2023",
        submission: "Data_Plan.pdf",
        submittedDate: "Oct 26, 2023",
      },
      {
        week: 8,
        topic: "Research Tools and Techniques",
        status: "completed",
        dueDate: "Nov 3, 2023",
        submission: "Tools_Report.pdf",
        submittedDate: "Nov 2, 2023",
      },
      {
        week: 9,
        topic: "Preliminary Data Analysis",
        status: "completed",
        dueDate: "Nov 10, 2023",
        submission: "Analysis_Report.pdf",
        submittedDate: "Nov 9, 2023",
      },
      {
        week: 10,
        topic: "System Design and Architecture",
        status: "completed",
        dueDate: "Nov 17, 2023",
        submission: "Design_Doc.pdf",
        submittedDate: "Nov 16, 2023",
      },
      {
        week: 11,
        topic: "Implementation Phase 1",
        status: "completed",
        dueDate: "Nov 24, 2023",
        submission: "Implementation_1.pdf",
        submittedDate: "Nov 23, 2023",
      },
      {
        week: 12,
        topic: "Implementation Phase 2",
        status: "completed",
        dueDate: "Dec 1, 2023",
        submission: "Implementation_2.pdf",
        submittedDate: "Nov 30, 2023",
      },
      {
        week: 13,
        topic: "Testing and Validation",
        status: "completed",
        dueDate: "Dec 8, 2023",
        submission: "Testing_Report.pdf",
        submittedDate: "Dec 7, 2023",
      },
      {
        week: 14,
        topic: "Results Analysis and Discussion",
        status: "completed",
        dueDate: "Dec 15, 2023",
        submission: "Results_Analysis.pdf",
        submittedDate: "Dec 14, 2023",
      },
      {
        week: 15,
        topic: "Thesis Writing and Documentation",
        status: "in-progress",
        dueDate: "Dec 22, 2023",
        submission: "Pending",
        submittedDate: "-",
      },
      {
        week: 16,
        topic: "Final Review and Submission Preparation",
        status: "pending",
        dueDate: "Dec 29, 2023",
        submission: "Not Started",
        submittedDate: "-",
      },
    ],
    milestones: [
      {
        week: "1-2",
        name: "Project Initiation",
        topics: ["Project briefing", "Proposal preparation"],
        progress: 100,
        status: "completed",
      },
      {
        week: "3-4",
        name: "Problem Definition",
        topics: ["Problem statement", "Objectives", "Literature review"],
        progress: 100,
        status: "completed",
      },
      {
        week: "5-6",
        name: "Research Foundation",
        topics: ["Extended literature review", "Methodology design"],
        progress: 100,
        status: "completed",
      },
      {
        week: "7-8",
        name: "Research Planning",
        topics: ["Data collection planning", "Tools selection"],
        progress: 100,
        status: "completed",
      },
      {
        week: "9-10",
        name: "Data Analysis & Design",
        topics: ["Preliminary analysis", "System architecture"],
        progress: 100,
        status: "completed",
      },
      {
        week: "11-12",
        name: "Implementation",
        topics: ["Phase 1 development", "Phase 2 development"],
        progress: 100,
        status: "completed",
      },
      {
        week: "13-14",
        name: "Testing & Analysis",
        topics: ["Testing and validation", "Results analysis"],
        progress: 100,
        status: "completed",
      },
      {
        week: "15-16",
        name: "Finalization",
        topics: ["Thesis writing", "Final review"],
        progress: 50,
        status: "in-progress",
      },
    ],
    documentsSubmitted: 14,
    pendingReviews: 1,
    meetingsThisMonth: 5,
    lastMeeting: "Yesterday",
    recentActivities: [
      { title: "Thesis writing in progress", time: "1 hour ago" },
      { title: "Week 14 completed", time: "2 days ago" },
      { title: "Meeting with supervisor", time: "Yesterday" },
    ],
  },
]

export default function StudentProgressPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useUser()
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, clearAll } = useNotifications()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const router = useRouter()
  const [studentData, setStudentData] = useState<any>(null)
  const [weeklySubmissions, setWeeklySubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [weeksCompleted, setWeeksCompleted] = useState(0)
  const [studentUserId, setStudentUserId] = useState<number | null>(null)
  const [sendingReminder, setSendingReminder] = useState<string | null>(null) // Track which reminder is being sent (week number or milestone id)
  const [messages, setMessages] = useState<Array<{ type: string; text: string; time: string }>>([])
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  
  // State for weekly tasks (live data from database)
  const [weeklyTasks, setWeeklyTasks] = useState<any[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [isManageWeeksOpen, setIsManageWeeksOpen] = useState(false)
  const [editingWeek, setEditingWeek] = useState<any>(null)
  const [newWeek, setNewWeek] = useState({ week_number: '', title: '', description: '', due_date: '', upload_date: '' })
  const [logbook, setLogbook] = useState<any>(null)
  const [logbookHistory, setLogbookHistory] = useState<any[]>([])
  const [showLogbookDialog, setShowLogbookDialog] = useState(false)
  const [showLogbookHistory, setShowLogbookHistory] = useState(false)
  const [isLoadingLogbook, setIsLoadingLogbook] = useState(false)

  // State for milestones (live data from database)
  const [milestones, setMilestones] = useState<any[]>([])
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(false)
  const [isManageMilestonesOpen, setIsManageMilestonesOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<any>(null)
  const [newMilestone, setNewMilestone] = useState({ name: '', description: '', deliverables: '', due_date: '' })

  // Fetch milestones from database (LIVE DATA)
  const fetchMilestones = useCallback(async (studentId: number) => {
    try {
      setIsLoadingMilestones(true)
      const response = await progressAPI.getMilestones(studentId)
      const fetchedMilestones = response.milestones || []
      setMilestones(fetchedMilestones)
      
      // Update studentData with milestones
      setStudentData((prev: any) => {
        if (!prev) return prev
        const transformedMilestones = fetchedMilestones.map((m: any) => ({
          id: m.id,
          name: m.name,
          description: m.description || "",
          deliverables: m.deliverables || "",
          progress: m.progress || 0,
          status: m.status || "pending",
          dueDate: m.due_date,
          completedDate: m.completed_date,
          week: m.week || 0,
          topics: m.description ? [m.description] : []
        }))
        return { ...prev, milestones: transformedMilestones }
      })
    } catch (error: any) {
      console.error('Error fetching milestones:', error)
      setMilestones([])
    } finally {
      setIsLoadingMilestones(false)
    }
  }, [])

  // Fetch weekly tasks from database (LIVE DATA)
  const fetchWeeklyTasks = useCallback(async (studentId: number) => {
    try {
      setIsLoadingTasks(true)
      const response = await progressAPI.getWeeklyTasks(studentId)
      const tasks = response.tasks || []
      setWeeklyTasks(tasks)
      console.log('Fetched weekly tasks:', tasks.length)
    } catch (error: any) {
      console.error('Error fetching weekly tasks:', error)
      // If table doesn't exist, use empty array (will fallback to defaults)
      setWeeklyTasks([])
    } finally {
      setIsLoadingTasks(false)
    }
  }, [])

  // Generate weekly progress from submissions and tasks (LIVE DATA)
  // Only shows weeks that supervisor has added - no hardcoded defaults
  const generateWeeklyProgress = useCallback((submissions: any[], completedWeeks: number, tasks?: any[]) => {
    const currentDate = new Date()
    
    // Only use tasks from database - no default weeks
    // Safely handle undefined/null tasks parameter
    const tasksArray = tasks || []
    
    // If no tasks, return empty array (no weeks to show)
    if (tasksArray.length === 0) {
      return []
    }
    
    // Get all unique week numbers from tasks and sort them
    // Filter out any invalid week numbers
    const weekNumbers = [...new Set(tasksArray
      .map((t: any) => t?.week_number)
      .filter((wn: any) => typeof wn === 'number' && !isNaN(wn) && wn > 0)
    )].sort((a, b) => a - b)
    
    // If no valid week numbers, return empty array
    if (weekNumbers.length === 0) {
      return []
    }
    
    // Generate progress for each week that exists in tasks
    return weekNumbers.map((weekNumber) => {
      const submission = submissions.find((sub: any) => sub.week_number === weekNumber)
      const task = tasksArray.find((t: any) => t.week_number === weekNumber)
      const isSubmitted = submission?.status === 'submitted'
      
      // Determine status
      let status = 'pending'
      if (isSubmitted) {
        status = 'completed'
      } else if (task?.due_date && currentDate >= new Date(task.due_date)) {
        status = 'in-progress' // Overdue
      } else if (weekNumber === completedWeeks + 1 || (completedWeeks === 0 && weekNumbers[0] === weekNumber)) {
        status = 'in-progress' // Current week
      }
      
      // Format dates - use task data if available (LIVE DATA)
      const dueDate = submission?.due_date 
        ? new Date(submission.due_date) 
        : (task?.due_date ? new Date(task.due_date) : null)
      const dueDateText = dueDate ? dueDate.toLocaleString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }) : "TBD"
      
      const submittedDate = submission?.submission_date ? new Date(submission.submission_date) : null
      const submittedDateText = submittedDate ? submittedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"
      
      return {
        week: weekNumber,
        topic: task?.title || `Week ${weekNumber}`, // Use task title from database (LIVE DATA)
        status,
        dueDate: dueDateText,
        submission: isSubmitted ? (submission.file_name || "Submitted") : (status === 'in-progress' ? "Pending" : "Not Started"),
        submittedDate: submittedDateText,
        documentId: submission?.document_id || null,
      }
    })
  }, [])

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setIsLoading(true)
        const studentId = typeof params.id === "string" ? Number.parseInt(params.id) : Number.parseInt((params.id?.[0] || "0").toString())
        
        // Fetch student details
        const studentResponse = await studentsAPI.getById(studentId)
        const student = studentResponse.student
        
        if (!student) {
          toast({
            title: "Error",
            description: "Student not found",
            variant: "destructive",
          })
          return
        }
        
        // Fetch weekly submissions
        const submissionsResponse = await progressAPI.getWeeklySubmissions(student.id)
        const submissions = submissionsResponse.submissions || []
        setWeeklySubmissions(submissions)
        
        // Fetch weekly tasks (LIVE DATA) - get the result directly
        const tasksResponse = await progressAPI.getWeeklyTasks(student.id)
        const fetchedTasks = tasksResponse.tasks || []
        setWeeklyTasks(fetchedTasks) // Update state for UI display
        
        // Fetch milestones (LIVE DATA)
        await fetchMilestones(student.id)
        
        // Fetch documents to verify they still exist (documents might have been deleted)
        let existingDocuments: any[] = []
        try {
          const docsResponse = await documentsAPI.getAll({ 
            student_id: student.id,
            type: 'submission'
          })
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
        
        // Filter submissions: only count those with status 'submitted' AND document still exists
        const validSubmissions = submissions.filter((sub: any) => {
          const hasStatus = sub.status === 'submitted'
          const hasDocument = documentsByWeek.has(sub.week_number)
          return hasStatus && hasDocument
        })
        
        // Calculate weeks completed - only count valid submissions
        const submittedWeeks = validSubmissions.length
        setWeeksCompleted(submittedWeeks)
        
        // Calculate progress - only use tasks from database (no default weeks)
        // Use the actual count of weeks, not the maximum week number
        const TOTAL_WEEKS = fetchedTasks.length
        // Always use calculated progress based on live data, not stale database value
        const calculatedProgress = TOTAL_WEEKS > 0 ? Math.round((submittedWeeks / TOTAL_WEEKS) * 100) : 0
        
        // Calculate status: only set status if weekly tasks exist
        let studentStatus: string | null = null
        if (fetchedTasks.length > 0) {
          const currentDate = new Date()
          currentDate.setHours(0, 0, 0, 0)
          
          // Check if any task has a due date that has passed and is not submitted
          const hasOverdueTask = fetchedTasks.some((task: any) => {
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
        
        // Generate weekly progress using tasks (LIVE DATA) - use fetchedTasks directly
        // Use validSubmissions to only show weeks with actual documents
        const weeklyProgress = generateWeeklyProgress(validSubmissions, submittedWeeks, fetchedTasks)
        
        // Format dates
        const startDate = student.start_date 
          ? new Date(student.start_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
          : "N/A"
        const expectedCompletion = student.expected_completion
          ? new Date(student.expected_completion).toLocaleDateString("en-US", { month: "short", year: "numeric" })
          : "N/A"
        
        // Fetch existing feedback for all submitted documents
        const feedbackMap: { [key: string]: Array<{ text: string; date: string; author: string }> } = {}
        try {
          const docsResponse = await documentsAPI.getAll({ 
            student_id: student.id,
            type: 'submission'
          })
          const docs = docsResponse.documents || []
          
          for (const doc of docs) {
            if (doc.id && doc.week_number) {
              try {
                const feedbackResponse = await documentsAPI.getFeedback(doc.id)
                const reviews = feedbackResponse.reviews || []
                if (reviews.length > 0) {
                  const weekKey = `week-${doc.week_number}`
                  feedbackMap[weekKey] = reviews.map((review: any) => ({
                    text: review.feedback,
                    date: review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : new Date(review.created_at).toLocaleString(),
                    author: review.reviewer_name || user?.name || 'Supervisor',
                  }))
                }
              } catch (err) {
                console.error(`Error fetching feedback for document ${doc.id}:`, err)
              }
            }
          }
        } catch (err) {
          console.error('Error fetching documents for feedback:', err)
        }
        
        setComments(feedbackMap)
        
        // Store student's user_id for sending notifications
        setStudentUserId(student.user_id)
        
        setStudentData({
          id: student.id,
          name: student.name,
          program: student.program || "N/A",
          progress: calculatedProgress,
          status: studentStatus,
          avatar: student.avatar || `/placeholder.svg?key=st${String(student.id).padStart(2, "0")}`,
          email: student.email,
          phone: student.phone || "+60 12-345 6789",
          startDate,
          expectedCompletion,
          supervisor: student.supervisor_name || "Unassigned",
          weeklyProgress: weeklyProgress || [], // Ensure it's always an array
          milestones: [], // Will be updated by fetchMilestones
          userId: student.user_id, // Store user_id in studentData as backup
        })

        // Fetch logbook
        try {
          setIsLoadingLogbook(true)
          const logbookResponse = await logbookAPI.get(student.id)
          setLogbook(logbookResponse.logbook)
        } catch (error: any) {
          // Logbook doesn't exist yet, that's okay
          setLogbook(null)
        } finally {
          setIsLoadingLogbook(false)
        }

        // Fetch logbook history
        try {
          const historyResponse = await logbookAPI.getHistory(student.id)
          setLogbookHistory(historyResponse.history || [])
        } catch (error: any) {
          setLogbookHistory([])
        }
      } catch (error: any) {
        console.error('Error fetching student data:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to load student data. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchStudentData()
  }, [params.id, user?.id])

  // Fetch logbook history function
  const fetchLogbookHistory = useCallback(async (studentId: number) => {
    try {
      const historyResponse = await logbookAPI.getHistory(studentId)
      setLogbookHistory(historyResponse.history || [])
    } catch (error: any) {
      console.error('Error fetching logbook history:', error)
      setLogbookHistory([])
    }
  }, [])

  // Poll for milestones updates (live data)
  useEffect(() => {
    if (!studentData?.id) return

    const pollMilestones = () => {
      if (!document.hidden) {
        fetchMilestones(studentData.id)
      }
    }

    const interval = setInterval(pollMilestones, 5000) // Poll every 5 seconds

    // Also poll when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMilestones(studentData.id)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [studentData?.id, fetchMilestones])

  // Auto-open submission modal if week parameter is in URL
  useEffect(() => {
    // Only run if we have the necessary data and week parameter exists
    if (!studentData?.id || !searchParams.get('week')) return
    
    const weekParam = searchParams.get('week')
    if (!weekParam) return
    
    // Only proceed if we have submissions or tasks data
    if (weeklySubmissions.length === 0 && weeklyTasks.length === 0) return
    
    const weekNumber = parseInt(weekParam)
    if (isNaN(weekNumber)) return
    
    // Use a ref to prevent multiple executions
    const weeklyProgress = generateWeeklyProgress(weeklySubmissions, weeksCompleted, weeklyTasks)
    const weekData = weeklyProgress.find((w: any) => w.week === weekNumber)
    
    if (weekData && weekData.status === 'completed') {
      setSelectedSubmission(weekData)
      setSubmissionDialogOpen(true)
      
      // Fetch actual document status from database (LIVE DATA)
      if (studentData.id && weekData.week) {
        documentsAPI.getAll({ 
          student_id: studentData.id,
          type: 'submission'
        }).then(async (docsResponse) => {
          const matchingDocs = docsResponse.documents?.filter((doc: any) => 
            doc.week_number === weekData.week
          ) || []
          
          if (matchingDocs.length > 0) {
            const sortedDocs = matchingDocs.sort((a: any, b: any) => 
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )
            const latestDoc = sortedDocs[0]
            setDocumentStatus(latestDoc.status || null)
            
            // Send notification to student when supervisor clicks to review
            // This triggers when supervisor opens the document review dialog
            if (studentUserId && latestDoc.id) {
              try {
                // Call the GET endpoint which will check preferences and send notification
                await documentsAPI.getById(latestDoc.id)
              } catch (notifError) {
                // Don't fail if notification fails
                console.error('Error triggering review notification:', notifError)
              }
            }
          } else {
            setDocumentStatus(null)
          }
        }).catch((error) => {
          console.error('Error fetching document status:', error)
          setDocumentStatus(null)
        })
      }
      
      // Remove the week parameter from URL after opening
      const url = new URL(window.location.href)
      url.searchParams.delete('week')
      window.history.replaceState({}, '', url.toString())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentData?.id, searchParams.get('week')]) // Only depend on essential values

  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [messageContent, setMessageContent] = useState("")
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false)
  const [meetingData, setMeetingData] = useState({
    title: "",
    date: "",
    time: "",
    duration: "60",
    type: "online",
    location: "",
    meeting_link: "",
    agenda: "",
  })

  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [documentStatus, setDocumentStatus] = useState<string | null>(null) // Track actual document status from DB
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState<{ [key: string]: Array<{ text: string; date: string; author: string }> }>({})

  // Fetch messages with student
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
      
      // Calculate unread count (messages received from this student that are unread)
      const unreadCount = conversationMessages.filter((msg: any) => 
        msg.receiver_id === user.user_id && !msg.is_read
      ).length
      setUnreadMessageCount(unreadCount)
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      setMessages([])
    }
  }

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    if (!studentUserId && !studentData?.userId) {
      toast({
        title: "Error",
        description: "Unable to send message. Student information is missing.",
        variant: "destructive",
      })
      return
    }

    const receiverId = studentUserId || studentData?.userId

    try {
      await messagesAPI.send({
        receiver_id: receiverId,
        content: messageContent.trim(),
      })

      // Refresh messages to show the new one
      await fetchMessages(receiverId)

      setMessageContent("")

      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${studentData.name}`,
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

  // Fetch messages when dialog opens
  useEffect(() => {
    if (messageDialogOpen && (studentUserId || studentData?.userId) && user?.user_id) {
      const userId = studentUserId || studentData?.userId
      if (userId) {
        fetchMessages(userId)
      }
    }
  }, [messageDialogOpen, studentUserId, studentData?.userId, user?.user_id])

  const handleScheduleMeeting = async () => {
    if (!meetingData.title || !meetingData.date || !meetingData.time || !meetingData.agenda) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Title, Date, Time, Agenda)",
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

    // Validate date is valid and not in the past
    const selectedDate = new Date(meetingData.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)

    if (isNaN(selectedDate.getTime())) {
      toast({
        title: "Invalid Date",
        description: "Please enter a valid date (e.g., February only has 28/29 days)",
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

    setIsSubmittingMeeting(true)

    try {
      await meetingsAPI.create({
        student_id: studentData.student_id || studentData.id,
        title: meetingData.title,
        date: meetingData.date,
        time: meetingData.time,
        duration: parseInt(meetingData.duration),
        type: meetingData.type,
        location: meetingData.type === "in-person" ? meetingData.location : undefined,
        meeting_link: meetingData.type === "online" ? meetingData.meeting_link : undefined,
        agenda: meetingData.agenda,
      })

      toast({
        title: "Meeting Scheduled",
        description: `Meeting with ${studentData.name} scheduled for ${meetingData.date} at ${meetingData.time}. The student will be notified.`,
      })

      setScheduleDialogOpen(false)
      setMeetingData({
        title: "",
        date: "",
        time: "",
        duration: "60",
        type: "online",
        location: "",
        meeting_link: "",
        agenda: "",
      })
    } catch (error: any) {
      console.error('Error scheduling meeting:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to schedule meeting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingMeeting(false)
    }
  }

  if (isLoading || !studentData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading student data...</p>
        </div>
      </div>
    )
  }

  const handleViewSubmission = async (week: any) => {
    console.log('Opening submission dialog for week:', week);
    console.log('Week data:', JSON.stringify(week, null, 2));
    if (!week || !week.week) {
      console.error('Invalid week data:', week);
      toast({
        title: "Error",
        description: "Invalid submission data. Please try again.",
        variant: "destructive",
      })
      return
    }
    setSelectedSubmission(week)
    setSubmissionDialogOpen(true)
    
    // Fetch actual document status from database (LIVE DATA)
    if (studentData?.id && week.week) {
      try {
        const docsResponse = await documentsAPI.getAll({ 
          student_id: studentData.id,
          type: 'submission'
        })
        
        const matchingDocs = docsResponse.documents?.filter((doc: any) => 
          doc.week_number === week.week
        ) || []
        
        if (matchingDocs.length > 0) {
          // Get the most recent document
          const sortedDocs = matchingDocs.sort((a: any, b: any) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          )
          const latestDoc = sortedDocs[0]
          setDocumentStatus(latestDoc.status || null)
          console.log('Fetched document status:', latestDoc.status, 'for week', week.week)
          
          // Send notification to student when supervisor clicks to review
          // This triggers when supervisor opens the document review dialog
          if (studentUserId && latestDoc.id) {
            try {
              // Call the GET endpoint which will check preferences and send notification
              await documentsAPI.getById(latestDoc.id)
            } catch (notifError) {
              // Don't fail if notification fails
              console.error('Error triggering review notification:', notifError)
            }
          }
        } else {
          setDocumentStatus(null)
        }
      } catch (error: any) {
        console.error('Error fetching document status:', error)
        setDocumentStatus(null)
      }
    } else {
      setDocumentStatus(null)
    }
    
    console.log('Dialog opened, selectedSubmission set to:', week);
  }

  const handleDownloadSubmission = async (fileName: string, documentId?: number) => {
    // If documentId is provided, use API download
    if (documentId) {
      try {
        await documentsAPI.download(documentId, fileName)
        toast({
          title: "Download Started",
          description: `${fileName} is downloading`,
        })
        return
      } catch (error: any) {
        console.error('Error downloading document:', error)
        toast({
          title: "Download Failed",
          description: error.message || "Failed to download document. Please try again.",
          variant: "destructive",
        })
        return
      }
    }

    // Try to find document by file name
    try {
      const response = await documentsAPI.getAll({ type: 'submission' })
      const doc = response.documents?.find((d: any) => d.file_name === fileName)
      
      if (doc && doc.id) {
        await documentsAPI.download(doc.id, fileName)
        toast({
          title: "Download Started",
          description: `${fileName} is downloading`,
        })
        return
      }
    } catch (error) {
      console.error('Error finding document:', error)
    }

    // Fallback: show message if file not found
    toast({
      title: "Download Failed",
      description: `File "${fileName}" not found in the system.`,
      variant: "destructive",
    })
  }

  const handleSendReminder = async (milestone: any) => {
    if (!milestone) {
      toast({
        title: "Error",
        description: "Invalid milestone data.",
        variant: "destructive",
      })
      return
    }

    // Get studentUserId from state or from studentData if available
    const userId = studentUserId || (studentData && studentData.userId)
    
    if (!userId) {
      toast({
        title: "Error",
        description: "Unable to send reminder. Student user ID not available. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    try {
      setSendingReminder(`milestone-${milestone.id}`)
      
      const dueDateText = milestone.dueDate 
        ? new Date(milestone.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : ""
      
      const reminderMessage = `Reminder: Please complete the milestone "${milestone.name}"${dueDateText ? ` (Due: ${dueDateText})` : ""}.`
      
      await notificationsAPI.create({
        user_id: userId,
        title: "Milestone Reminder",
        message: reminderMessage,
        type: "reminder",
        icon: "🔔",
        link: "/student/progress"
      })

      toast({
        title: "Reminder Sent",
        description: `Reminder sent to ${studentData.name} for ${milestone.name}`,
      })
    } catch (error: any) {
      console.error('Error sending reminder:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSendingReminder(null)
    }
  }

  const handleSendReminderForWeek = async (week: any) => {
    if (!week) {
      toast({
        title: "Error",
        description: "Invalid week data.",
        variant: "destructive",
      })
      return
    }

    // Get studentUserId from state or from studentData if available
    const userId = studentUserId || (studentData && studentData.userId)
    
    if (!userId) {
      toast({
        title: "Error",
        description: "Unable to send reminder. Student user ID not available. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    try {
      setSendingReminder(`week-${week.week}`)
      
      const reminderMessage = `Reminder: Please submit your work for "${week.topic}"${week.dueDate && week.dueDate !== "TBD" ? ` (Due: ${week.dueDate})` : ""}.`
      
      await notificationsAPI.create({
        user_id: userId,
        title: "Submission Reminder",
        message: reminderMessage,
        type: "reminder",
        icon: "🔔",
        link: "/student/documents"
      })

      toast({
        title: "Reminder Sent",
        description: `Reminder sent to ${studentData.name} for ${week.topic}`,
      })
    } catch (error: any) {
      console.error('Error sending reminder:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSendingReminder(null)
    }
  }

  const handleApproveDocument = async () => {
    if (!selectedSubmission || !studentData) return

    try {
      // Find the most recent document for this week
      let documentId = selectedSubmission.documentId || null
      
      if (studentData.id && selectedSubmission.week) {
        try {
          const docsResponse = await documentsAPI.getAll({ 
            student_id: studentData.id,
            type: 'submission'
          })
          
          const matchingDocs = docsResponse.documents?.filter((doc: any) => 
            doc.week_number === selectedSubmission.week
          ) || []
          
          if (matchingDocs.length > 0) {
            const sortedDocs = matchingDocs.sort((a: any, b: any) => 
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )
            documentId = sortedDocs[0].id
          }
        } catch (err: any) {
          console.error('Error fetching documents:', err)
          toast({
            title: "Error",
            description: `Failed to fetch documents: ${err.message}`,
            variant: "destructive",
          })
          return
        }
      }

      if (documentId) {
        // Store feedback text before clearing
        const hasFeedback = newComment.trim()
        
        // Add feedback if provided
        if (hasFeedback) {
          try {
            await documentsAPI.addFeedback(documentId, newComment)
            // Refresh comments after adding feedback
            const feedbackResponse = await documentsAPI.getFeedback(documentId)
            const reviews = feedbackResponse.reviews || []
            if (reviews.length > 0) {
              const submissionKey = `week-${selectedSubmission.week}`
              const updatedComments = reviews.map((review: any) => ({
                text: review.feedback,
                date: review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : new Date(review.created_at).toLocaleString(),
                author: review.reviewer_name || user?.name || 'Supervisor',
              }))
              setComments((prev) => ({
                ...prev,
                [submissionKey]: updatedComments,
              }))
            }
            // Clear comment field after adding
            setNewComment("")
          } catch (feedbackErr: any) {
            console.error('Error adding feedback:', feedbackErr)
            // Continue even if feedback fails
          }
        }
        
        await documentsAPI.approve(documentId)
        
        toast({
          title: "Document Approved",
          description: `Week ${selectedSubmission.week} submission has been approved.${hasFeedback ? ' Feedback has been added.' : ''}`,
        })

        // Update document status in state
        setDocumentStatus('approved')
        
        // Create notification for student
        if (studentUserId) {
          await notificationsAPI.create({
            user_id: studentUserId,
            title: 'Document Approved',
            message: `Your Week ${selectedSubmission.week} submission has been approved! No correction needed.`,
            type: 'document',
            icon: '✅',
            link: '/student/documents'
          })
        }
        
        // Refresh student data to update submission status
        if (params.id) {
          const studentId = typeof params.id === "string" ? Number.parseInt(params.id) : Number.parseInt(params.id[0])
          const submissionsResponse = await progressAPI.getWeeklySubmissions(studentId)
          const submissions = submissionsResponse.submissions || []
          // Update weekly progress - use weeklyTasks from state
          const weeklyProgress = generateWeeklyProgress(submissions, weeksCompleted, weeklyTasks)
          setWeeklySubmissions(weeklyProgress)
        }
      } else {
        toast({
          title: "Error",
          description: "Document not found. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('Error approving document:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to approve document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMarkCorrectionNeeded = async () => {
    if (!selectedSubmission || !studentData) return

    try {
      // Find the most recent document for this week
      let documentId = selectedSubmission.documentId || null
      
      if (studentData.id && selectedSubmission.week) {
        try {
          const docsResponse = await documentsAPI.getAll({ 
            student_id: studentData.id,
            type: 'submission'
          })
          
          const matchingDocs = docsResponse.documents?.filter((doc: any) => 
            doc.week_number === selectedSubmission.week
          ) || []
          
          if (matchingDocs.length > 0) {
            const sortedDocs = matchingDocs.sort((a: any, b: any) => 
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )
            documentId = sortedDocs[0].id
          }
        } catch (err: any) {
          console.error('Error fetching documents:', err)
          toast({
            title: "Error",
            description: `Failed to fetch documents: ${err.message}`,
            variant: "destructive",
          })
          return
        }
      }

      if (documentId) {
        // Store feedback text before clearing
        const hasFeedback = newComment.trim()
        
        // Add feedback if provided
        if (hasFeedback) {
          try {
            await documentsAPI.addFeedback(documentId, newComment)
            // Refresh comments after adding feedback
            const feedbackResponse = await documentsAPI.getFeedback(documentId)
            const reviews = feedbackResponse.reviews || []
            if (reviews.length > 0) {
              const submissionKey = `week-${selectedSubmission.week}`
              const updatedComments = reviews.map((review: any) => ({
                text: review.feedback,
                date: review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : new Date(review.created_at).toLocaleString(),
                author: review.reviewer_name || user?.name || 'Supervisor',
              }))
              setComments((prev) => ({
                ...prev,
                [submissionKey]: updatedComments,
              }))
            }
            // Clear comment field after adding
            setNewComment("")
          } catch (feedbackErr: any) {
            console.error('Error adding feedback:', feedbackErr)
            // Continue even if feedback fails
          }
        }
        
        // Update document status to pending_review (correction needed)
        await documentsAPI.update(documentId, { status: 'pending_review' })
        
        toast({
          title: "Correction Needed",
          description: `Week ${selectedSubmission.week} submission has been marked as needing correction.${hasFeedback ? ' Feedback has been added.' : ''}`,
        })

        // Update document status in state
        setDocumentStatus('pending_review')
        
        // Create notification for student
        if (studentUserId) {
          await notificationsAPI.create({
            user_id: studentUserId,
            title: 'Correction Needed',
            message: `Your Week ${selectedSubmission.week} submission needs correction. Please review and resubmit.`,
            type: 'document',
            icon: '⚠️',
            link: '/student/documents'
          })
        }
        
        // Refresh student data to update submission status
        if (params.id) {
          const studentId = typeof params.id === "string" ? Number.parseInt(params.id) : Number.parseInt(params.id[0])
          const submissionsResponse = await progressAPI.getWeeklySubmissions(studentId)
          const submissions = submissionsResponse.submissions || []
          // Update weekly progress - use weeklyTasks from state
          const weeklyProgress = generateWeeklyProgress(submissions, weeksCompleted, weeklyTasks)
          setWeeklySubmissions(weeklyProgress)
        }
      } else {
        toast({
          title: "Error",
          description: "Document not found. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('Error marking correction needed:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to mark document as needing correction. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive",
      })
      return
    }

    // Better validation - check if objects have required properties
    if (!selectedSubmission || !selectedSubmission.week || Object.keys(selectedSubmission).length === 0) {
      console.error('❌ Invalid selectedSubmission:', selectedSubmission);
      toast({
        title: "Error",
        description: "No submission selected. Please close and reopen the submission dialog.",
        variant: "destructive",
      })
      return
    }

    if (!studentData || !studentData.id || Object.keys(studentData).length === 0) {
      console.error('❌ Invalid studentData:', studentData);
      toast({
        title: "Error",
        description: "Student data not loaded. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    try {
      // Always find document by student_id and week_number to ensure we get the right one
      let documentId = selectedSubmission.documentId || null
      let documentsUpdated = false
      
      // Fetch documents to find the one matching this week
      if (studentData.id && selectedSubmission.week) {
        try {
          const docsResponse = await documentsAPI.getAll({ 
            student_id: studentData.id,
            type: 'submission'
          })
          
          // Find ALL documents for this week (any status, we just need the document)
          const matchingDocs = docsResponse.documents?.filter((doc: any) => 
            doc.week_number === selectedSubmission.week
          ) || []
          
          console.log('Found documents for week', selectedSubmission.week, ':', matchingDocs.length);
          
          if (matchingDocs.length > 0) {
            // Use the most recent document (first one after sorting by created_at DESC)
            const sortedDocs = matchingDocs.sort((a: any, b: any) => 
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )
            documentId = sortedDocs[0].id
            console.log('✅ Found document ID:', documentId);
            
            // Update ALL documents for this week to 'reviewed' status
            for (const doc of matchingDocs) {
              try {
                await documentsAPI.update(doc.id, {
                  status: 'reviewed'
                })
                documentsUpdated = true
                console.log(`Updated document ${doc.id} (Week ${doc.week_number}) to reviewed status`)
              } catch (err: any) {
                console.error(`Failed to update document ${doc.id}:`, err)
                toast({
                  title: "Warning",
                  description: `Failed to update document ${doc.id}: ${err.message}`,
                  variant: "destructive",
                })
              }
            }
          } else if (documentId) {
            // Fallback: use documentId if provided
            try {
              await documentsAPI.update(documentId, {
                status: 'reviewed'
              })
              documentsUpdated = true
              console.log(`Updated document ${documentId} to reviewed status`)
            } catch (err: any) {
              console.error(`Failed to update document ${documentId}:`, err)
              toast({
                title: "Warning",
                description: `Failed to update document: ${err.message}`,
                variant: "destructive",
              })
            }
          } else {
            console.warn('No document found for week', selectedSubmission.week, 'student', studentData.id)
            // Try one more time with a broader search - any document for this student and week
            try {
              const allDocsResponse = await documentsAPI.getAll({ 
                student_id: studentData.id
              })
              const allDocs = allDocsResponse.documents || []
              const weekDoc = allDocs.find((doc: any) => 
                doc.week_number === selectedSubmission.week
              )
              if (weekDoc) {
                documentId = weekDoc.id
                console.log('✅ Found document via broader search:', documentId)
              } else {
                console.error('❌ No document found even with broader search')
                toast({
                  title: "Warning",
                  description: `No document found for Week ${selectedSubmission.week}. Please ensure the student has submitted their work.`,
                  variant: "destructive",
                })
              }
            } catch (searchErr) {
              console.error('Error in broader document search:', searchErr)
            }
          }
        } catch (err: any) {
          console.error('Error fetching documents:', err)
          toast({
            title: "Error",
            description: `Failed to fetch documents: ${err.message}`,
            variant: "destructive",
          })
        }
      }

      // Save feedback to backend if documentId exists
      console.log('=== SUPERVISOR FEEDBACK SAVE ===');
      console.log('DocumentId:', documentId);
      console.log('Week:', selectedSubmission.week);
      console.log('Student ID:', studentData.id);
      console.log('Feedback text:', newComment);
      
      if (documentId) {
        try {
          console.log('✅ DocumentId found, calling API...');
          console.log('API call: documentsAPI.addFeedback(', documentId, ',', newComment.substring(0, 50), ')');
          const feedbackResponse = await documentsAPI.addFeedback(documentId, newComment)
          console.log('✅ Feedback saved successfully:', feedbackResponse)
          
          // Show success message
          toast({
            title: "Feedback Added",
            description: "Your feedback has been added successfully.",
          })
          
          // Refresh comments from database after saving
          try {
            const feedbackResponse = await documentsAPI.getFeedback(documentId)
            const reviews = feedbackResponse.reviews || []
            if (reviews.length > 0) {
              const submissionKey = `week-${selectedSubmission.week}`
              const updatedComments = reviews.map((review: any) => ({
                text: review.feedback,
                date: review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : new Date(review.created_at).toLocaleString(),
                author: review.reviewer_name || user?.name || 'Supervisor',
              }))
              setComments((prev) => ({
                ...prev,
                [submissionKey]: updatedComments,
              }))
            }
            
            // Refresh document status after adding comment
            if (studentData?.id && selectedSubmission.week) {
              try {
                const docsResponse = await documentsAPI.getAll({ 
                  student_id: studentData.id,
                  type: 'submission'
                })
                const matchingDocs = docsResponse.documents?.filter((doc: any) => 
                  doc.week_number === selectedSubmission.week
                ) || []
                if (matchingDocs.length > 0) {
                  const sortedDocs = matchingDocs.sort((a: any, b: any) => 
                    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                  )
                  setDocumentStatus(sortedDocs[0].status || null)
                }
              } catch (statusErr) {
                console.error('Error refreshing document status:', statusErr)
              }
            }
          } catch (refreshErr) {
            console.error('Error refreshing feedback after save:', refreshErr)
          }
        } catch (err: any) {
          console.error('❌ Error saving feedback to backend:', err);
          console.error('Error name:', err.name);
          console.error('Error message:', err.message);
          console.error('Error stack:', err.stack);
          toast({
            title: "Error Saving Feedback",
            description: `Failed to save feedback to backend: ${err.message || 'Unknown error'}. Check console for details.`,
            variant: "destructive",
          })
          // Still save locally even if backend fails
        }
      } else {
        console.error('❌ Cannot save feedback: No documentId found for week', selectedSubmission.week);
        console.error('Selected submission:', selectedSubmission);
        console.error('Student data:', studentData);
        toast({
          title: "Warning",
          description: `No document found for Week ${selectedSubmission.week}. Feedback saved locally only.`,
          variant: "destructive",
        })
      }

      // Only update local comments if backend save failed (we already updated from DB if it succeeded)
      // This prevents duplicate comments
      if (!documentId) {
        const submissionKey = `week-${selectedSubmission.week}`
        const newCommentObj = {
          text: newComment,
          date: new Date().toLocaleString(),
          author: user?.name || "Supervisor",
        }

        setComments((prev) => ({
          ...prev,
          [submissionKey]: [...(prev[submissionKey] || []), newCommentObj],
        }))
      }

      // Create notification for student
      if (studentUserId) {
        await notificationsAPI.create({
          user_id: studentUserId,
          title: 'Feedback Received',
          message: `Your Week ${selectedSubmission.week} submission has received new feedback. Please check your documents.`,
          type: 'document',
          icon: '📝',
          link: '/student/documents'
        })
      }

      // Clear comment field after successful save
      setNewComment("")
      
      // Refresh student data to update submission status
      if (params.id) {
        try {
          const studentId = typeof params.id === "string" ? Number.parseInt(params.id) : Number.parseInt(params.id[0])
          const submissionsResponse = await progressAPI.getWeeklySubmissions(studentId)
          const submissions = submissionsResponse.submissions || []
          // Update weekly progress - use weeklyTasks from state
          const weeklyProgress = generateWeeklyProgress(submissions, weeksCompleted, weeklyTasks)
          setWeeklySubmissions(weeklyProgress)
        } catch (refreshErr) {
          console.error('Error refreshing submissions after feedback:', refreshErr)
        }
      }

      toast({
        title: status === 'approved' ? "Document Approved" : "Correction Needed",
        description: documentsUpdated 
          ? "Your feedback has been saved and the student will be notified. The document status has been updated."
          : "Your feedback has been saved and the student will be notified.",
      })

      setNewComment("")
      
      // Refresh student data to update submission status
      if (params.id) {
        const studentId = typeof params.id === "string" ? Number.parseInt(params.id) : Number.parseInt(params.id[0])
        const submissionsResponse = await progressAPI.getWeeklySubmissions(studentId)
        const submissions = submissionsResponse.submissions || []
        setWeeklySubmissions(submissions)
        const submittedWeeks = submissions.filter((sub: any) => sub.status === 'submitted').length
        setWeeksCompleted(submittedWeeks)
        // Use weeklyTasks from state if available
        const weeklyProgress = generateWeeklyProgress(submissions, submittedWeeks, weeklyTasks)
        setStudentData((prev: any) => ({
          ...prev,
          weeklyProgress
        }))
      }
      
      // Close the modal after successful submission
      setSubmissionDialogOpen(false)
    } catch (error: any) {
      console.error('Error submitting comment:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save feedback. Please try again.",
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
    
    // For document notifications, navigate to current student page with week parameter if applicable
    if ((notif.type === 'document' || notif.type === 'submission') && notif.message && studentData?.id) {
      try {
        // Try to extract week number from message
        const weekMatch = notif.message.match(/week\s+(\d+)/i)
        if (weekMatch && weekMatch[1]) {
          const weekNumber = weekMatch[1]
          router.push(`/supervisor/students/${studentData.id}?week=${weekNumber}`)
          setIsNotificationsOpen(false)
          return
        }
        // If no week found, just navigate to current student page
        router.push(`/supervisor/students/${studentData.id}`)
        setIsNotificationsOpen(false)
        return
      } catch (error) {
        console.error('Error navigating from notification:', error)
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
        // Navigate to current student page if available, otherwise students list
        if (studentData?.id) {
          router.push(`${basePath}/students/${studentData.id}`)
        } else {
          router.push(`${basePath}/students`)
        }
        break
      case 'message':
        if (studentData?.id) {
          router.push(`${basePath}/students/${studentData.id}`)
        } else {
          router.push(`${basePath}/dashboard`)
        }
        break
      case 'progress':
      case 'reminder':
        if (studentData?.id) {
          router.push(`${basePath}/students/${studentData.id}`)
        } else {
          router.push(`${basePath}/students`)
        }
        break
      default:
        if (studentData?.id) {
          router.push(`${basePath}/students/${studentData.id}`)
        } else {
          router.push(`${basePath}/dashboard`)
        }
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
                aria-label="Notifications"
              >
                <BellIcon />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center z-10">
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
                      <Button size="sm" variant="outline" className="flex-1" onClick={markAllAsRead}>
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
              <Avatar className="cursor-pointer hover:opacity-80 transition-all duration-300 ring-2 ring-primary/20 hover:ring-primary/40 shadow-md hover:shadow-lg">
                <AvatarImage src={getUploadUrl(user?.avatar)} alt="Supervisor" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">{user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'SV'}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <Link href="/supervisor/students">
          <Button variant="ghost" className="mb-6">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </Link>

        {/* Student Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={getUploadUrl(studentData.avatar)} alt={studentData.name} />
              <AvatarFallback>
                {studentData.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-foreground">{studentData.name}</h2>
                {studentData.status && (
                  <Badge
                    className={
                      studentData.status === "on-track"
                        ? "bg-green-500/10 text-green-700 dark:text-green-400"
                        : "bg-red-500/10 text-red-700 dark:text-red-400"
                    }
                    variant="secondary"
                  >
                    {studentData.status === "on-track" ? "On Track" : "Needs Attention"}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-3">{studentData.program}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{studentData.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{studentData.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium text-foreground">{studentData.startDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expected Completion</p>
                  <p className="font-medium text-foreground">{studentData.expectedCompletion}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                <Button onClick={() => setMessageDialogOpen(true)} className="relative">
                  <MessageSquareIcon className="mr-2 h-4 w-4" />
                  Send Message
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </Button>
              </Dialog>

              <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                <Button variant="outline" onClick={() => setScheduleDialogOpen(true)}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
              </Dialog>

              <DownloadReportButton studentData={studentData} variant="outline" />
              
              {/* Logbook Section */}
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Logbook</h3>
              </div>
              {logbook ? (
                <>
                  {logbookHistory.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowLogbookHistory(true)
                        fetchLogbookHistory(studentData.id)
                      }}
                    >
                      View History
                    </Button>
                  )}
                  <Dialog open={showLogbookDialog} onOpenChange={setShowLogbookDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <UploadIcon className="mr-2 h-4 w-4" />
                        Upload New Version
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Upload Logbook</DialogTitle>
                        <DialogDescription>
                          Upload a new version of the student's logbook. This will create version {logbook.version + 1}.
                        </DialogDescription>
                      </DialogHeader>
                      <LogbookUploadForm 
                        studentId={studentData.id}
                        onSubmit={async (file: File) => {
                          try {
                            const formData = new FormData()
                            formData.append('file', file)
                            await logbookAPI.upload(studentData.id, formData)
                            
                            // Refresh logbook and history
                            const logbookResponse = await logbookAPI.get(studentData.id)
                            setLogbook(logbookResponse.logbook)
                            const historyResponse = await logbookAPI.getHistory(studentData.id)
                            setLogbookHistory(historyResponse.history || [])
                            
                            toast({
                              title: "Logbook Uploaded",
                              description: "Logbook has been uploaded successfully.",
                            })
                            
                            setShowLogbookDialog(false)
                          } catch (error: any) {
                            toast({
                              title: "Upload Failed",
                              description: error.message || "Failed to upload logbook.",
                              variant: "destructive",
                            })
                          }
                        }}
                        onCancel={() => setShowLogbookDialog(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <Dialog open={showLogbookDialog} onOpenChange={setShowLogbookDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <UploadIcon className="mr-2 h-4 w-4" />
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
                      studentId={studentData.id}
                      onSubmit={async (file: File) => {
                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                            await logbookAPI.upload(studentData.id, formData)
                            
                            // Refresh logbook and history
                            const logbookResponse = await logbookAPI.get(studentData.id)
                            setLogbook(logbookResponse.logbook)
                            const historyResponse = await logbookAPI.getHistory(studentData.id)
                            setLogbookHistory(historyResponse.history || [])
                            
                            toast({
                              title: "Logbook Uploaded",
                              description: "Logbook has been uploaded successfully.",
                            })
                            
                            setShowLogbookDialog(false)
                        } catch (error: any) {
                          toast({
                            title: "Upload Failed",
                            description: error.message || "Failed to upload logbook.",
                            variant: "destructive",
                          })
                        }
                      }}
                      onCancel={() => setShowLogbookDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          
          {/* Logbook Info */}
          {logbook && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-semibold text-foreground">{logbook.file_name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Version {logbook.version} • Uploaded by {logbook.uploaded_by_name} ({logbook.uploaded_by_role === 'student' ? 'Student' : 'You'})
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
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
            </div>
          )}

          {/* Logbook History Dialog */}
          <Dialog open={showLogbookHistory} onOpenChange={setShowLogbookHistory}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Logbook History</DialogTitle>
                <DialogDescription>
                  View all versions of the student's logbook, including uploads and updates.
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
                              await logbookAPI.download(studentData.id, entry.file_name)
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

          {/* Overall Progress */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Overall Progress</span>
              <span className="text-lg font-bold text-foreground">{studentData.progress}%</span>
            </div>
            <Progress value={studentData.progress} className="h-3" aria-label={`Overall progress: ${studentData.progress}%`} />
            <p className="text-xs text-muted-foreground mt-2">
              {(() => {
                if (weeklyTasks.length === 0) {
                  return "No weeks added yet. Use 'Manage Weeks' to add weekly tasks."
                }
                // Use the actual count of weeks, not the maximum week number
                const totalWeeks = weeklyTasks.length
                const remaining = totalWeeks - weeksCompleted
                return `Week ${weeksCompleted} of ${totalWeeks} • ${remaining} weeks remaining`
              })()}
            </p>
          </div>
        </Card>

        {/* Tabs for Milestones and Weekly Progress */}
        <Tabs defaultValue="weekly" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="weekly">
                Weekly Progress ({weeklyTasks.length > 0 ? `Week ${Math.min(...weeklyTasks.map((t: any) => t.week_number))}-${Math.max(...weeklyTasks.map((t: any) => t.week_number))}` : 'No weeks added'})
              </TabsTrigger>
              <TabsTrigger value="milestones">Milestones Overview</TabsTrigger>
            </TabsList>
            <Button 
              onClick={() => setIsManageWeeksOpen(true)}
              variant="outline"
              className="ml-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              <span className="mr-2">➕</span>
              Manage Weeks
            </Button>
          </div>

          {/* Weekly Progress Tab */}
          <TabsContent value="weekly" className="space-y-4">
            {!studentData.weeklyProgress || studentData.weeklyProgress.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">No weekly tasks have been added yet.</p>
                <Button 
                  onClick={() => setIsManageWeeksOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  <span className="mr-2">➕</span>
                  Add Your First Week
                </Button>
              </Card>
            ) : (
            <div className="grid gap-4">
              {(studentData.weeklyProgress || []).map((week: any) => (
                <Card key={week.week} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent font-bold">
                          {week.week}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-lg">{week.topic}</h3>
                          <p className="text-sm text-muted-foreground">Due: {week.dueDate}</p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            week.status === "completed"
                              ? "bg-green-500/10 text-green-700 dark:text-green-400"
                              : week.status === "in-progress"
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                : "bg-gray-500/10 text-gray-700 dark:text-gray-400"
                          }
                        >
                          {week.status === "completed"
                            ? "Completed"
                            : week.status === "in-progress"
                              ? "In Progress"
                              : "Pending"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Submission Status</p>
                          <div className="flex items-center gap-2">
                            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{week.submission}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Submitted Date</p>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{week.submittedDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {week.status === "completed" && (
                        <>
                          <Button size="sm" onClick={() => handleViewSubmission(week)}>
                            View Submission
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDownloadSubmission(week.submission)}>
                            Download
                          </Button>
                        </>
                      )}
                      {week.status === "in-progress" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSendReminderForWeek(week)}
                          disabled={sendingReminder === `week-${week.week}`}
                        >
                          {sendingReminder === `week-${week.week}` ? "Sending..." : "Send Reminder"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button 
                onClick={() => setIsManageMilestonesOpen(true)}
                variant="outline"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              >
                <span className="mr-2">➕</span>
                Manage Milestones
              </Button>
            </div>
            <div className="grid gap-4">
              {studentData.milestones.length > 0 ? (
                studentData.milestones.map((milestone: any, index: number) => {
                  // Parse deliverables from string (newline-separated) to array
                  const deliverablesList = milestone.deliverables 
                    ? milestone.deliverables.split('\n').filter((line: string) => line.trim())
                    : []
                  
                  return (
                    <Card key={milestone.id || index} className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white font-bold">
                              {index + 1}
                            </div>
                            <h3 className="text-lg font-bold text-foreground">{milestone.name}</h3>
                          </div>
                          
                          <div className="space-y-3 text-sm ml-11">
                            {milestone.description && (
                              <div className="text-muted-foreground">
                                <p className="whitespace-pre-wrap">{milestone.description}</p>
                              </div>
                            )}
                            
                            {milestone.dueDate && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <CalendarIcon className="h-4 w-4" />
                                <span className="font-medium">Due:</span>
                                <span>{new Date(milestone.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              </div>
                            )}
                            
                            {deliverablesList.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2">Deliverables:</h4>
                                <ul className="space-y-1">
                                  {deliverablesList.map((item: string, idx: number) => (
                                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })
              ) : (
                <Card className="p-6">
                  <p className="text-center text-muted-foreground">No milestones found for this student.</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Message {studentData.name}</DialogTitle>
          </DialogHeader>
          <MessageDialog
            messages={messages}
            onSendMessage={handleSendMessage}
            messageText={messageContent}
            onMessageChange={setMessageContent}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Meeting with {studentData.name}</DialogTitle>
            <DialogDescription>Schedule a supervision meeting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                  min={new Date().toISOString().split('T')[0]}
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
                  min="08:00"
                  max="17:00"
                />
                <p className="text-xs text-muted-foreground">Available: 8:00 AM - 5:00 PM</p>
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
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!isSubmittingMeeting) {
                  setScheduleDialogOpen(false)
                  setMeetingData({
                    title: "",
                    date: "",
                    time: "",
                    duration: "60",
                    type: "online",
                    location: "",
                    meeting_link: "",
                    agenda: "",
                  })
                }
              }}
              disabled={isSubmittingMeeting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleScheduleMeeting}
              disabled={isSubmittingMeeting}
            >
              {isSubmittingMeeting ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={submissionDialogOpen} onOpenChange={(open) => {
        setSubmissionDialogOpen(open)
        if (!open) {
          // Reset document status when dialog closes
          setDocumentStatus(null)
          setNewComment("")
        }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details - Week {selectedSubmission?.week}</DialogTitle>
            <DialogDescription>{selectedSubmission?.topic}</DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6 py-4">
              {/* Submission Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Student Name</Label>
                    <p className="font-medium text-foreground mt-1">{studentData.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Program</Label>
                    <p className="font-medium text-foreground mt-1">{studentData.program}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Due Date</Label>
                    <p className="font-medium text-foreground mt-1">{selectedSubmission.dueDate}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Submitted Date</Label>
                    <p className="font-medium text-foreground mt-1">{selectedSubmission.submittedDate}</p>
                  </div>
                </div>

                <Separator />

                {/* File Information */}
                <div>
                  <Label className="text-muted-foreground">Submitted File</Label>
                  <div className="mt-2 p-4 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileTextIcon className="h-8 w-8 text-accent" />
                        <div>
                          <p className="font-medium text-foreground">{selectedSubmission.submission}</p>
                          <p className="text-sm text-muted-foreground">PDF Document • 2.4 MB</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadSubmission(selectedSubmission.submission)}
                      >
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Comments Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-foreground font-semibold">Supervisor Feedback</Label>
                    {/* Show approval status badge */}
                    {documentStatus === 'approved' && (
                      <Badge 
                        variant="default" 
                        className="text-xs px-3 py-1 font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-sm"
                      >
                        <CheckIcon className="mr-1.5 h-3 w-3" />
                        Approved - No Correction Needed
                      </Badge>
                    )}
                    {(documentStatus === 'pending_review' || documentStatus === 'reviewed') && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-3 py-1 font-semibold bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                      >
                        Under Review
                      </Badge>
                    )}
                    {documentStatus === 'rejected' && (
                      <Badge 
                        variant="destructive" 
                        className="text-xs px-3 py-1 font-semibold"
                      >
                        Rejected
                      </Badge>
                    )}
                  </div>

                  {/* Existing Comments */}
                  <div className="mt-3 space-y-3">
                    {comments[`week-${selectedSubmission.week}`]?.map((comment, idx) => (
                      <div key={idx} className="p-3 border border-border rounded-lg bg-muted/20">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm text-foreground">{comment.author}</p>
                          <p className="text-xs text-muted-foreground">{comment.date}</p>
                        </div>
                        <p className="text-sm text-foreground">{comment.text}</p>
                      </div>
                    )) || <p className="text-sm text-muted-foreground italic">No feedback yet</p>}
                  </div>

                  {/* Add New Feedback - Always visible */}
                  <div className="mt-4 space-y-2">
                    {documentStatus === 'approved' && (
                      <div className="mb-3 p-3 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                          ✓ This document has been approved. You can still add additional feedback if needed.
                        </p>
                      </div>
                    )}
                    <Label htmlFor="supervisor-comment">Feedback (Optional)</Label>
                    <Textarea
                      id="supervisor-comment"
                      placeholder="Add feedback comments (optional)..."
                      rows={4}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    
                    <div className="space-y-2 mt-4">
                      <Label className="text-foreground font-semibold">Document Status Actions</Label>
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleMarkCorrectionNeeded} 
                          size="sm" 
                          variant="destructive"
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                          disabled={documentStatus === 'pending_review' || documentStatus === 'rejected'}
                        >
                          <AlertTriangleIcon className="mr-2 h-4 w-4" />
                          Correction Needed
                        </Button>
                        <Button 
                          onClick={handleApproveDocument} 
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                          disabled={documentStatus === 'approved'}
                        >
                          <CheckIcon className="mr-2 h-4 w-4" />
                          Approved
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 px-1">
                      💡 <strong>Tip:</strong> Optionally add feedback in the text area above. Click "Correction Needed" or "Approved" to update the document status.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmissionDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Weeks Dialog */}
      <Dialog open={isManageWeeksOpen} onOpenChange={(open) => {
        setIsManageWeeksOpen(open)
        if (!open) {
          // Reset form when dialog closes
          setEditingWeek(null)
          setNewWeek({ week_number: '', title: '', description: '', due_date: '', upload_date: '' })
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Weekly Tasks for {studentData?.name}</DialogTitle>
            <DialogDescription>
              Add, edit, or delete weekly tasks. Changes will be reflected immediately for the student.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Add/Edit Week Form */}
            <Card className="p-6 border border-border/50 shadow-sm bg-card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-foreground">{editingWeek ? `Edit Week ${editingWeek.week_number}` : 'Add New Week'}</h3>
              </div>
              
              <div className="space-y-4">
                {/* First Row: Week Number and Due Date */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="week-number" className="text-sm font-medium text-foreground">Week Number</Label>
                  <Input
                    id="week-number"
                    type="number"
                    min="1"
                    value={editingWeek ? editingWeek.week_number : newWeek.week_number}
                    onChange={(e) => {
                      if (editingWeek) {
                        setEditingWeek({ ...editingWeek, week_number: e.target.value })
                      } else {
                        setNewWeek({ ...newWeek, week_number: e.target.value })
                      }
                    }}
                    className="h-10"
                  />
                </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="due-date" className="text-sm font-medium text-foreground">Due Date & Time</Label>
                  <Input
                    id="due-date"
                      type="datetime-local"
                      value={editingWeek 
                        ? (editingWeek.due_date 
                            ? (() => {
                                // Convert to local datetime format (YYYY-MM-DDTHH:mm)
                                const date = new Date(editingWeek.due_date)
                                // Get local date components
                                const year = date.getFullYear()
                                const month = String(date.getMonth() + 1).padStart(2, '0')
                                const day = String(date.getDate()).padStart(2, '0')
                                const hours = String(date.getHours()).padStart(2, '0')
                                const minutes = String(date.getMinutes()).padStart(2, '0')
                                return `${year}-${month}-${day}T${hours}:${minutes}`
                              })()
                            : '') 
                        : (newWeek.due_date 
                            ? newWeek.due_date.includes('T') 
                              ? newWeek.due_date.slice(0, 16)
                              : newWeek.due_date + 'T00:00'
                            : '')}
                    onChange={(e) => {
                        const value = e.target.value
                      if (editingWeek) {
                          setEditingWeek({ ...editingWeek, due_date: value })
                      } else {
                          setNewWeek({ ...newWeek, due_date: value })
                      }
                    }}
                      className="h-10"
                  />
                </div>
                </div>

                {/* Second Row: Title */}
                <div className="space-y-2">
                  <Label htmlFor="week-title" className="text-sm font-medium text-foreground">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="week-title"
                    value={editingWeek ? editingWeek.title : newWeek.title}
                    onChange={(e) => {
                      if (editingWeek) {
                        setEditingWeek({ ...editingWeek, title: e.target.value })
                      } else {
                        setNewWeek({ ...newWeek, title: e.target.value })
                      }
                    }}
                    placeholder="Enter task title"
                    className="h-10"
                  />
                </div>

                {/* Third Row: Description */}
                <div className="space-y-2">
                  <Label htmlFor="week-description" className="text-sm font-medium text-foreground">Description</Label>
                  <Textarea
                    id="week-description"
                    value={editingWeek ? (editingWeek.description || '') : newWeek.description}
                    onChange={(e) => {
                      if (editingWeek) {
                        setEditingWeek({ ...editingWeek, description: e.target.value })
                      } else {
                        setNewWeek({ ...newWeek, description: e.target.value })
                      }
                    }}
                    placeholder="Add task description (optional)"
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                <Button
                  onClick={async () => {
                    const weekData = editingWeek || newWeek
                    if (!weekData.week_number || !weekData.title || !studentData) {
                      toast({
                        title: "Error",
                        description: "Please fill in week number and title",
                        variant: "destructive",
                      })
                      return
                    }
                    
                    // Check if week number already exists (only when adding new week, not editing)
                    if (!editingWeek) {
                      const weekNumber = parseInt(weekData.week_number)
                      const existingWeek = weeklyTasks.find((task: any) => task.week_number === weekNumber)
                      if (existingWeek) {
                        toast({
                          title: "Error",
                          description: `Week ${weekNumber} already exists. Please use a different week number or edit the existing week.`,
                          variant: "destructive",
                        })
                        return
                      }
                    }
                    
                    try {
                      // If editing and week_number changed, delete the old task first
                      if (editingWeek && editingWeek.original_week_number && 
                          parseInt(editingWeek.original_week_number) !== parseInt(weekData.week_number)) {
                        // Check if the new week number already exists
                        const newWeekNumber = parseInt(weekData.week_number)
                        const existingWeek = weeklyTasks.find((task: any) => 
                          task.week_number === newWeekNumber && 
                          task.week_number !== parseInt(editingWeek.original_week_number)
                        )
                        if (existingWeek) {
                          toast({
                            title: "Error",
                            description: `Week ${newWeekNumber} already exists. Please use a different week number.`,
                            variant: "destructive",
                          })
                          return
                        }
                        // Week number changed - delete old task first
                        await progressAPI.deleteWeeklyTask(studentData.id, parseInt(editingWeek.original_week_number))
                      }
                      
                      // Create or update the task
                      await progressAPI.createWeeklyTask({
                        student_id: studentData.id,
                        week_number: parseInt(weekData.week_number),
                        title: weekData.title,
                        description: weekData.description || undefined,
                        due_date: weekData.due_date || undefined,
                        upload_date: weekData.upload_date || undefined,
                      })
                      toast({
                        title: "Success",
                        description: editingWeek ? "Week updated successfully" : "Week added successfully",
                      })
                      setNewWeek({ week_number: '', title: '', description: '', due_date: '', upload_date: '' })
                      setEditingWeek(null)
                      
                      // Refresh weekly tasks first
                      await fetchWeeklyTasks(studentData.id)
                      
                      // Refresh student data with updated tasks
                      const submissionsResponse = await progressAPI.getWeeklySubmissions(studentData.id)
                      const submissions = submissionsResponse.submissions || []
                      const submittedWeeks = submissions.filter((sub: any) => sub.status === 'submitted').length
                      
                      // Fetch updated tasks to ensure we have the latest
                      const updatedTasksResponse = await progressAPI.getWeeklyTasks(studentData.id)
                      const updatedTasks = updatedTasksResponse.tasks || []
                      
                      // Update weeklyTasks state with the fresh data
                      setWeeklyTasks(updatedTasks)
                      
                                // Calculate progress with updated tasks (no default weeks)
                                // Use the actual count of weeks, not the maximum week number
                                const TOTAL_WEEKS = updatedTasks.length
                                const calculatedProgress = TOTAL_WEEKS > 0 ? Math.round((submittedWeeks / TOTAL_WEEKS) * 100) : 0
                      
                      // Generate weekly progress with updated tasks
                      const weeklyProgress = generateWeeklyProgress(submissions, submittedWeeks, updatedTasks)
                      
                      // Update student data with new progress and weekly progress
                      setStudentData((prev: any) => ({ 
                        ...prev, 
                        weeklyProgress,
                        progress: calculatedProgress
                      }))
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message || (editingWeek ? "Failed to update week" : "Failed to add week"),
                        variant: "destructive",
                      })
                    }
                  }}
                  className="flex-1 h-9 text-sm font-medium"
                >
                  {editingWeek ? 'Update Week' : 'Add Week'}
                </Button>
                {editingWeek && (
                  <Button
                    onClick={() => {
                      setEditingWeek(null)
                      setNewWeek({ week_number: '', title: '', description: '', due_date: '', upload_date: '' })
                    }}
                    variant="outline"
                    className="flex-1 h-9 text-sm"
                  >
                    Cancel
                  </Button>
                )}
                </div>
              </div>
            </Card>

            {/* Existing Weeks List */}
            <div>
              <h3 className="text-base font-semibold mb-3 text-foreground">Existing Weeks ({weeklyTasks.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {weeklyTasks.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">No weeks defined yet. Add your first week above.</p>
                  </div>
                ) : (
                  weeklyTasks
                    .sort((a: any, b: any) => a.week_number - b.week_number)
                    .map((task: any) => (
                      <Card key={task.id} className="p-3.5 border border-border/50 shadow-sm hover:shadow transition-all duration-200 hover:border-primary/20">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 flex-shrink-0">
                              Week {task.week_number}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-foreground truncate">{task.title}</span>
                            </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {task.due_date && (
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">Due:</span>
                                    <span>{new Date(task.due_date).toLocaleString("en-US", { 
                                      month: "short", 
                                      day: "numeric", 
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}</span>
                                  </span>
                              )}
                              {task.created_by_name && (
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">By:</span>
                                    <span>{task.created_by_name}</span>
                                  </span>
                              )}
                            </div>
                          </div>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Store the raw due_date value from database for editing
                                // This preserves the exact datetime value including time
                                // Also store original_week_number to detect if week number changed
                                setEditingWeek({
                                  id: task.id, // Store task ID for reference
                                  original_week_number: task.week_number, // Store original week number
                                  week_number: task.week_number.toString(),
                                  title: task.title,
                                  description: task.description || '',
                                  due_date: task.due_date || '', // Keep raw value from database
                                  upload_date: task.upload_date ? new Date(task.upload_date).toISOString().split('T')[0] : '',
                                })
                                setNewWeek({ week_number: '', title: '', description: '', due_date: '', upload_date: '' })
                              }}
                              className="h-7 px-2.5 text-xs"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                              if (!studentData) return
                              try {
                                await progressAPI.deleteWeeklyTask(studentData.id, task.week_number)
                                toast({
                                  title: "Success",
                                  description: "Week deleted successfully",
                                })
                                // Refresh weekly tasks first
                                await fetchWeeklyTasks(studentData.id)
                                
                                // Refresh student data with updated tasks
                                const submissionsResponse = await progressAPI.getWeeklySubmissions(studentData.id)
                                const submissions = submissionsResponse.submissions || []
                                const submittedWeeks = submissions.filter((sub: any) => sub.status === 'submitted').length
                                
                                // Fetch updated tasks to ensure we have the latest
                                const updatedTasksResponse = await progressAPI.getWeeklyTasks(studentData.id)
                                const updatedTasks = updatedTasksResponse.tasks || []
                                
                                // Update weeklyTasks state with the fresh data
                                setWeeklyTasks(updatedTasks)
                                
                                // Calculate progress with updated tasks (no default weeks)
                                // Use the actual count of weeks, not the maximum week number
                                const TOTAL_WEEKS = updatedTasks.length
                                const calculatedProgress = TOTAL_WEEKS > 0 ? Math.round((submittedWeeks / TOTAL_WEEKS) * 100) : 0
                                
                                // Generate weekly progress with updated tasks
                                const weeklyProgress = generateWeeklyProgress(submissions, submittedWeeks, updatedTasks)
                                
                                // Update student data with new progress and weekly progress
                                setStudentData((prev: any) => ({ 
                                  ...prev, 
                                  weeklyProgress,
                                  progress: calculatedProgress
                                }))
                              } catch (error: any) {
                                toast({
                                  title: "Error",
                                  description: error.message || "Failed to delete week",
                                  variant: "destructive",
                                })
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                        </div>
                      </Card>
                    ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Milestones Dialog */}
      <Dialog open={isManageMilestonesOpen} onOpenChange={(open) => {
        setIsManageMilestonesOpen(open)
        if (!open) {
          // Reset form when dialog closes
          setEditingMilestone(null)
          setNewMilestone({ name: '', description: '', deliverables: '', due_date: '' })
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Milestones for {studentData?.name}</DialogTitle>
            <DialogDescription>
              Add, edit, or delete milestones. Changes will be reflected immediately for the student.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Add/Edit Milestone Form */}
            <Card className="p-6 border border-border/50 shadow-sm bg-card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-foreground">{editingMilestone ? `Edit Milestone` : 'Add New Milestone'}</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="milestone-name" className="text-sm font-medium text-foreground">Milestone Name *</Label>
                  <Input
                    id="milestone-name"
                    type="text"
                    placeholder="e.g., Project Initiation, Literature Review"
                    value={editingMilestone ? editingMilestone.name : newMilestone.name}
                    onChange={(e) => {
                      if (editingMilestone) {
                        setEditingMilestone({ ...editingMilestone, name: e.target.value })
                      } else {
                        setNewMilestone({ ...newMilestone, name: e.target.value })
                      }
                    }}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="milestone-description" className="text-sm font-medium text-foreground">Description</Label>
                  <Textarea
                    id="milestone-description"
                    placeholder="Describe the milestone requirements and objectives..."
                    value={editingMilestone ? (editingMilestone.description || '') : newMilestone.description}
                    onChange={(e) => {
                      if (editingMilestone) {
                        setEditingMilestone({ ...editingMilestone, description: e.target.value })
                      } else {
                        setNewMilestone({ ...newMilestone, description: e.target.value })
                      }
                    }}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="milestone-deliverables" className="text-sm font-medium text-foreground">Deliverables</Label>
                  <Textarea
                    id="milestone-deliverables"
                    placeholder="List the deliverables or requirements (one per line)..."
                    value={editingMilestone ? (editingMilestone.deliverables || '') : newMilestone.deliverables}
                    onChange={(e) => {
                      if (editingMilestone) {
                        setEditingMilestone({ ...editingMilestone, deliverables: e.target.value })
                      } else {
                        setNewMilestone({ ...newMilestone, deliverables: e.target.value })
                      }
                    }}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">Enter each deliverable on a new line</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="milestone-due-date" className="text-sm font-medium text-foreground">Due Date</Label>
                  <Input
                    id="milestone-due-date"
                    type="date"
                    value={editingMilestone 
                      ? (editingMilestone.due_date ? new Date(editingMilestone.due_date).toISOString().split('T')[0] : '') 
                      : (newMilestone.due_date ? newMilestone.due_date.split('T')[0] : '')}
                    onChange={(e) => {
                      const value = e.target.value
                      if (editingMilestone) {
                        setEditingMilestone({ ...editingMilestone, due_date: value })
                      } else {
                        setNewMilestone({ ...newMilestone, due_date: value })
                      }
                    }}
                    className="h-10"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      try {
                        if (editingMilestone) {
                          // Update milestone
                          if (!editingMilestone.name.trim()) {
                            toast({
                              title: "Error",
                              description: "Milestone name is required",
                              variant: "destructive",
                            })
                            return
                          }
                          
                          await progressAPI.updateMilestone(editingMilestone.id, {
                            name: editingMilestone.name,
                            description: editingMilestone.description || null,
                            deliverables: editingMilestone.deliverables || null,
                            due_date: editingMilestone.due_date || null,
                          })
                          
                          toast({
                            title: "Success",
                            description: "Milestone updated successfully",
                          })
                          
                          setEditingMilestone(null)
                        } else {
                          // Create milestone
                          if (!newMilestone.name.trim()) {
                            toast({
                              title: "Error",
                              description: "Milestone name is required",
                              variant: "destructive",
                            })
                            return
                          }
                          
                          if (!studentData?.id) {
                            toast({
                              title: "Error",
                              description: "Student ID not found",
                              variant: "destructive",
                            })
                            return
                          }
                          
                          await progressAPI.createMilestone({
                            student_id: studentData.id,
                            name: newMilestone.name,
                            description: newMilestone.description || undefined,
                            deliverables: newMilestone.deliverables || undefined,
                            due_date: newMilestone.due_date || undefined,
                          })
                          
                          toast({
                            title: "Success",
                            description: "Milestone created successfully",
                          })
                          
                          setNewMilestone({ name: '', description: '', deliverables: '', due_date: '' })
                        }
                        
                        // Refresh milestones
                        if (studentData?.id) {
                          await fetchMilestones(studentData.id)
                        }
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to save milestone",
                          variant: "destructive",
                        })
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    {editingMilestone ? 'Update Milestone' : 'Add Milestone'}
                  </Button>
                  
                  {(editingMilestone || newMilestone.name) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingMilestone(null)
                        setNewMilestone({ name: '', description: '', deliverables: '', due_date: '' })
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* List of Existing Milestones */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Existing Milestones</h3>
              
              <div className="space-y-3">
                {milestones.length === 0 ? (
                  <Card className="p-8 text-center border-dashed border-2 border-muted-foreground/20 bg-muted/10">
                    <p className="text-muted-foreground">No milestones added yet. Add your first milestone above.</p>
                  </Card>
                ) : (
                  milestones
                    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map((milestone: any) => (
                      <Card key={milestone.id} className="p-4 border border-border/50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-foreground">{milestone.name}</h4>
                            </div>
                            
                            {milestone.description && (
                              <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                            )}
                            
                            {milestone.due_date && (
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Due: {new Date(milestone.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingMilestone({
                                  id: milestone.id,
                                  name: milestone.name,
                                  description: milestone.description || '',
                                  deliverables: milestone.deliverables || '',
                                  due_date: milestone.due_date ? new Date(milestone.due_date).toISOString().split('T')[0] : '',
                                })
                                setNewMilestone({ name: '', description: '', deliverables: '', due_date: '' })
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                if (!confirm(`Are you sure you want to delete the milestone "${milestone.name}"?`)) {
                                  return
                                }
                                
                                try {
                                  await progressAPI.deleteMilestone(milestone.id)
                                  toast({
                                    title: "Success",
                                    description: "Milestone deleted successfully",
                                  })
                                  
                                  // Refresh milestones
                                  if (studentData?.id) {
                                    await fetchMilestones(studentData.id)
                                  }
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: error.message || "Failed to delete milestone",
                                    variant: "destructive",
                                  })
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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

function LogbookUploadForm({ studentId, onSubmit, onCancel }: { 
  studentId: number
  onSubmit: (file: File) => void
  onCancel: () => void
}) {
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (uploadFile) {
      onSubmit(uploadFile)
      setUploadFile(null)
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

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!uploadFile}
        >
          Upload
        </Button>
      </DialogFooter>
    </form>
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

function ArrowLeftIcon({ className }: { className?: string }) {
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
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
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
function DownloadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  )
}

