"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useState, useEffect } from "react"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { useNotifications } from "@/lib/notifications-context"
import { useUser } from "@/lib/user-context"
import { progressAPI, studentsAPI, documentsAPI, meetingsAPI, getUploadUrl } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function StudentProgressPage() {
  const { user, loading: userLoading } = useUser()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [overallProgress, setOverallProgress] = useState(0)
  const [weeksCompleted, setWeeksCompleted] = useState(0)
  const [totalWeeks, setTotalWeeks] = useState(0)
  const [totalDocuments, setTotalDocuments] = useState(0)
  const [totalMeetings, setTotalMeetings] = useState(0)
  const [totalSubmissions, setTotalSubmissions] = useState(0)
  const [studentId, setStudentId] = useState<number | null>(null)
  const [weeklySubmissions, setWeeklySubmissions] = useState<any[]>([])
  const [weeklyTasks, setWeeklyTasks] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null)
  const [isMilestoneDetailsOpen, setIsMilestoneDetailsOpen] = useState(false)

  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, clearAll } = useNotifications()

  // Weekly submission topics mapping
  const weeklyTopics: { [key: number]: { title: string; dueDate: string } } = {
    1: { title: "Project Briefing & Literature Review", dueDate: "2025-10-30" },
    2: { title: "Research Proposal Draft", dueDate: "2025-11-06" },
    3: { title: "Methodology Planning", dueDate: "2025-11-13" },
    4: { title: "Ethics Application", dueDate: "2025-11-20" },
    5: { title: "Data Collection Setup", dueDate: "2025-11-27" },
    6: { title: "Final Presentation", dueDate: "2025-12-04" },
  }

  // Generate timeline items from weekly tasks (LIVE DATA - only show weeks added by supervisor)
  const generateTimelineItems = (submissions: any[], weeklyTasks: any[] = []) => {
    // Only show weeks that exist in weeklyTasks (added by supervisor)
    if (weeklyTasks.length === 0) {
      return [] // No weeks assigned yet
    }
    
    const currentDate = new Date()
    const submittedWeeks = submissions.filter((sub: any) => sub.status === 'submitted').length
    
    // Group tasks into pairs (2 weeks per month)
    const sortedTasks = weeklyTasks.sort((a: any, b: any) => a.week_number - b.week_number)
    const weekPairs: Array<{ weeks: number[], period: string }> = []
    
    for (let i = 0; i < sortedTasks.length; i += 2) {
      const week1 = sortedTasks[i]
      const week2 = sortedTasks[i + 1]
      const monthNum = Math.floor(i / 2) + 1
      weekPairs.push({
        weeks: week2 ? [week1.week_number, week2.week_number] : [week1.week_number],
        period: `Month ${monthNum}`
      })
    }

    return weekPairs.map((pair) => {
      const week1 = pair.weeks[0]
      const week2 = pair.weeks[1]
      const sub1 = submissions.find((sub: any) => sub.week_number === week1)
      const sub2 = week2 ? submissions.find((sub: any) => sub.week_number === week2) : null
      
      const task1 = weeklyTasks.find((t: any) => t.week_number === week1)
      const task2 = week2 ? weeklyTasks.find((t: any) => t.week_number === week2) : null
      
      const week1Submitted = sub1?.status === 'submitted'
      const week2Submitted = sub2?.status === 'submitted'
      
      // Determine overall status for the pair
      let pairStatus = 'pending'
      if (week1Submitted && (week2 ? week2Submitted : true)) {
        pairStatus = 'completed'
      } else if (week1Submitted || (week2 && week2Submitted)) {
        pairStatus = 'in-progress'
      } else {
        // Check if overdue or current
        const dueDate1 = task1?.due_date ? new Date(task1.due_date) : null
        const dueDate2 = task2?.due_date ? new Date(task2.due_date) : null
        
        if ((dueDate1 && currentDate >= dueDate1) || (dueDate2 && currentDate >= dueDate2)) {
          pairStatus = 'in-progress' // Overdue
        } else if (week1 === submittedWeeks + 1 || (submittedWeeks === 0 && week1 === 1)) {
          pairStatus = 'in-progress' // Current week
        }
      }
      
      // Generate items for each week
      const items = [
        {
          title: `Week ${week1}: ${task1?.title || `Week ${week1}`}`,
          status: week1Submitted ? 'completed' : 
                  (task1?.due_date && currentDate >= new Date(task1.due_date)) ? 'in-progress' : 'pending',
          date: week1Submitted && sub1?.submission_date 
                ? `Completed: ${new Date(sub1.submission_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : `Week ${week1}`
        },
      ]
      
      if (week2 && task2) {
        items.push({
          title: `Week ${week2}: ${task2.title || `Week ${week2}`}`,
          status: week2Submitted ? 'completed' : 
                  (task2.due_date && currentDate >= new Date(task2.due_date)) ? 'in-progress' : 'pending',
          date: week2Submitted && sub2?.submission_date 
                ? `Completed: ${new Date(sub2.submission_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : `Week ${week2}`
        })
      }
      
      return {
        week: week2 ? `Weeks ${week1}-${week2}` : `Week ${week1}`,
        period: pair.period,
        status: pairStatus,
        items
      }
    })
  }

  // Fetch progress data
  const fetchProgressData = async () => {
    if (userLoading || !user?.id) return

    try {
      setIsLoading(true)
      
      // Get student ID
      const studentsResponse = await studentsAPI.getAll()
      const students = studentsResponse.students || []
      let currentStudentId: number | null = null
      if (students.length > 0) {
        const student = students[0]
        setStudentId(student.id)
        currentStudentId = student.id
      }

      // Fetch weekly tasks (weeks defined by supervisor) - LIVE DATA
      let fetchedWeeklyTasks: any[] = []
      if (currentStudentId) {
        try {
          const tasksResponse = await progressAPI.getWeeklyTasks(currentStudentId)
          fetchedWeeklyTasks = tasksResponse.tasks || []
          setWeeklyTasks(fetchedWeeklyTasks)
        } catch (error: any) {
          console.log('No weekly tasks found for this student:', error.message)
          fetchedWeeklyTasks = []
          setWeeklyTasks([])
        }
      }
      
      // Fetch weekly submissions - use student_id, not user.id
      let submissions: any[] = []
      if (currentStudentId) {
        try {
          const submissionsResponse = await progressAPI.getWeeklySubmissions(currentStudentId)
          submissions = submissionsResponse.submissions || []
        } catch (error: any) {
          console.log('No weekly submissions found:', error.message)
          submissions = []
        }
      }
      
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
      
      // Filter submissions: only count those with status 'submitted' AND document still exists
      const validSubmissions = submissions.filter((sub: any) => {
        const hasStatus = sub.status === 'submitted'
        const hasDocument = documentsByWeek.has(sub.week_number)
        return hasStatus && hasDocument
      })
      
      setWeeklySubmissions(submissions)
      
      // Count only valid submissions (status='submitted' AND document exists)
      const submittedWeeks = validSubmissions.length
      setWeeksCompleted(submittedWeeks)
      setTotalSubmissions(submittedWeeks)
      
      // Calculate progress based on weekly tasks from database (not hardcoded 6 weeks)
      // Use the actual count of weeks, not the maximum week number
      const TOTAL_WEEKS = fetchedWeeklyTasks.length
      setTotalWeeks(TOTAL_WEEKS)
      
      // Always use calculated progress based on live data, not stale database value
      const calculatedProgress = TOTAL_WEEKS > 0 ? Math.round((submittedWeeks / TOTAL_WEEKS) * 100) : 0
      setOverallProgress(calculatedProgress)

      // Fetch documents count
      const docsResponse = await documentsAPI.getAll({ type: 'submission' })
      setTotalDocuments((docsResponse.documents || []).length)

      // Fetch meetings count - only count actual meetings (approved/confirmed/completed), not pending
      const meetingsResponse = await meetingsAPI.getAll()
      const allMeetings = meetingsResponse.meetings || []
      // Only count actual meetings: approved, confirmed, or completed (not pending or cancelled)
      const actualMeetings = allMeetings.filter((m: any) => 
        m.status === 'approved' || m.status === 'confirmed' || m.status === 'completed'
      )
      setTotalMeetings(actualMeetings.length)

      // Fetch milestones (LIVE DATA)
      if (currentStudentId) {
        try {
          const milestonesResponse = await progressAPI.getMilestones(currentStudentId)
          setMilestones(milestonesResponse.milestones || [])
        } catch (error: any) {
          console.log('No milestones found for this student:', error.message)
          setMilestones([])
        }
      }

    } catch (error: any) {
      console.error('Error fetching progress data:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load progress data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!userLoading && user?.id) {
      fetchProgressData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userLoading])

  // Poll for milestones updates (live data)
  useEffect(() => {
    if (!studentId) return

    const pollMilestones = async () => {
      if (!document.hidden) {
        try {
          const milestonesResponse = await progressAPI.getMilestones(studentId)
          setMilestones(milestonesResponse.milestones || [])
        } catch (error: any) {
          console.log('Error fetching milestones:', error.message)
        }
      }
    }

    const interval = setInterval(pollMilestones, 5000) // Poll every 5 seconds

    // Also poll when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        pollMilestones()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [studentId])

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
              <Link
                href="/student/documents"
                className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
              >
                Documents
              </Link>
              <Link href="/student/progress" className="text-sm font-medium px-4 py-2 rounded-lg text-foreground bg-muted/50 transition-smooth hover:bg-muted">
                Progress
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsDropdown
              unreadCount={unreadCount}
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              onClearAll={clearAll}
              onMarkAllAsRead={markAllAsRead}
            />
            <Link href="/student/profile">
              <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={getUploadUrl(user?.avatar)} alt="Student" />
                <AvatarFallback>{user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'ST'}</AvatarFallback>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Research Progress</h2>
            <p className="text-muted-foreground">Track your milestones and research timeline</p>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Overall Progress</h3>
              <p className="text-muted-foreground">
                PhD Thesis - {totalWeeks > 0 ? `${totalWeeks} Week` : 'No weeks assigned'} Progress Tracking
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-accent mb-1">{overallProgress}%</p>
              <p className="text-sm text-muted-foreground">
                Week {weeksCompleted} of {totalWeeks > 0 ? totalWeeks : 'N/A'}
              </p>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3 mb-4" aria-label={`Overall progress: ${overallProgress}%`} />
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{weeksCompleted}/{totalWeeks > 0 ? totalWeeks : '0'}</p>
              <p className="text-sm text-muted-foreground">Weeks Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{totalDocuments}</p>
              <p className="text-sm text-muted-foreground">Documents</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{totalMeetings}</p>
              <p className="text-sm text-muted-foreground">Meetings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{totalSubmissions}</p>
              <p className="text-sm text-muted-foreground">Submissions</p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-6">Research Timeline</h3>
              {generateTimelineItems(weeklySubmissions, weeklyTasks).length === 0 ? (
                <div className="p-12 text-center border-dashed border-2 border-muted-foreground/20 bg-muted/10 rounded-lg">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">No Timeline Available</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Your supervisor hasn't added any weekly tasks yet. Once they add weekly tasks, your research timeline will appear here.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

                  {/* Timeline Items */}
                  <div className="space-y-8">
                    {generateTimelineItems(weeklySubmissions, weeklyTasks).map((item, index) => (
                      <TimelineItem
                        key={index}
                        week={item.week}
                        period={item.period}
                        status={item.status}
                        items={item.items}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="mt-6">
            {milestones.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 border-muted-foreground/20 bg-muted/10">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">No Milestones Available</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Your supervisor hasn't added any milestones yet. Once they add milestones, they will appear here.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4">
                {milestones.map((milestone: any, index: number) => {
                  // Get deliverables from the deliverables field, or fallback to empty array
                  const deliverablesList = milestone.deliverables 
                    ? milestone.deliverables.split('\n').filter((line: string) => line.trim())
                    : []
                  
                  return (
                    <DetailedMilestoneCard
                      key={milestone.id || index}
                      milestone={milestone}
                      title={milestone.name}
                      startDate={milestone.due_date ? new Date(milestone.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD"}
                      description={milestone.description || "No description provided."}
                      deliverables={deliverablesList.length > 0 ? deliverablesList : ["No deliverables specified"]}
                      onViewDetails={() => {
                        setSelectedMilestone(milestone)
                        setIsMilestoneDetailsOpen(true)
                      }}
                    />
                  )
                })}
              </div>
            )}
          </TabsContent>

        </Tabs>

        {/* Milestone Details Dialog */}
        <Dialog open={isMilestoneDetailsOpen} onOpenChange={setIsMilestoneDetailsOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Milestone Details</DialogTitle>
            </DialogHeader>
            {selectedMilestone && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{selectedMilestone.name}</h3>
                  {selectedMilestone.due_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Due: {new Date(selectedMilestone.due_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                    </div>
                  )}
                </div>

                {selectedMilestone.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedMilestone.description}</p>
                  </div>
                )}

                {selectedMilestone.deliverables && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Deliverables</h4>
                    <ul className="space-y-2">
                      {selectedMilestone.deliverables.split('\n').filter((line: string) => line.trim()).map((item: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}


function TimelineItem({
  week,
  period,
  status,
  items,
}: {
  week: string
  period: string
  status: string
  items: Array<{ title: string; status: string; date: string }>
}) {
  const statusColors = {
    completed: "bg-green-500",
    "in-progress": "bg-blue-500",
    pending: "bg-gray-300",
  }

  const weekDisplay = week.includes("-") ? week.split(" ")[1] : week.split(" ")[1]

  return (
    <div className="relative pl-16">
      {/* Week Badge */}
      <div
        className={`absolute left-0 w-16 h-16 rounded-full ${statusColors[status as keyof typeof statusColors]} flex items-center justify-center text-white font-bold shadow-lg text-xs`}
      >
        {weekDisplay}
      </div>

      {/* Content */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-bold text-foreground">{week}</h4>
            <p className="text-sm text-muted-foreground">{period}</p>
          </div>
          <Badge
            className={
              status === "completed"
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : status === "in-progress"
                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                  : "bg-gray-500/10 text-gray-700 dark:text-gray-400"
            }
            variant="secondary"
          >
            {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
              <div className="flex items-center gap-3">
                {item.status === "completed" ? (
                  <CheckCircleIcon className="text-green-500" />
                ) : item.status === "in-progress" ? (
                  <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-sm font-medium text-foreground">{item.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">{item.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DetailedMilestoneCard({
  milestone,
  title,
  startDate,
  description,
  deliverables,
  onViewDetails,
}: {
  milestone?: any
  title: string
  startDate: string
  description: string
  deliverables: string[]
  onViewDetails?: () => void
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          {startDate && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>{startDate}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-foreground mb-2">Deliverables</h4>
        <ul className="space-y-1">
          {deliverables.map((item, index) => (
            <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-transparent"
          onClick={onViewDetails}
        >
          View Details
        </Button>
      </div>
    </Card>
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

function FileIcon({ className }: { className?: string }) {
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
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  )
}
