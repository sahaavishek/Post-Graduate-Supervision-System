"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

const allStudents = [
  {
    id: 1,
    name: "Ahmad Ibrahim",
    program: "PhD Computer Science",
    progress: 68,
    status: "on-track",
    lastMeeting: "2 days ago",
    nextMilestone: "Data Collection",
    avatar: "/placeholder.svg?key=st01",
    email: "ahmad@utm.my",
    phone: "+60 12-345 6789",
    startDate: "Jan 2023",
    expectedCompletion: "Dec 2026",
    weeklyProgress: [
      { week: 1, task: "Literature Review", status: "completed", submission: "Chapter 1 Draft" },
      { week: 2, task: "Research Methodology", status: "completed", submission: "Methodology Document" },
      { week: 3, task: "Data Collection Planning", status: "in-progress", submission: "Pending" },
    ],
    milestones: [
      { name: "Research Proposal", progress: 100, status: "completed" },
      { name: "Literature Review", progress: 100, status: "completed" },
      { name: "Data Collection", progress: 45, status: "in-progress" },
      { name: "Analysis", progress: 0, status: "pending" },
      { name: "Thesis Writing", progress: 0, status: "pending" },
    ],
  },
  {
    id: 2,
    name: "Fatimah Hassan",
    program: "Masters Software Engineering",
    progress: 85,
    status: "on-track",
    lastMeeting: "1 week ago",
    nextMilestone: "Thesis Writing",
    avatar: "/placeholder.svg?key=st02",
    email: "fatimah@utm.my",
    phone: "+60 12-345 6790",
    startDate: "Sep 2023",
    expectedCompletion: "Sep 2025",
    weeklyProgress: [
      { week: 1, task: "Project Setup", status: "completed", submission: "Setup Document" },
      { week: 2, task: "Implementation Phase 1", status: "completed", submission: "Code + Report" },
      { week: 3, task: "Implementation Phase 2", status: "completed", submission: "Code + Report" },
    ],
    milestones: [
      { name: "Proposal Defense", progress: 100, status: "completed" },
      { name: "Implementation", progress: 100, status: "completed" },
      { name: "Testing", progress: 90, status: "in-progress" },
      { name: "Thesis Writing", progress: 60, status: "in-progress" },
      { name: "Final Defense", progress: 0, status: "pending" },
    ],
  },
  {
    id: 3,
    name: "Muhammad Ali",
    program: "PhD Artificial Intelligence",
    progress: 45,
    status: "needs-attention",
    lastMeeting: "3 weeks ago",
    nextMilestone: "Research Proposal",
    avatar: "/placeholder.svg?key=st03",
    email: "muhammad@utm.my",
    phone: "+60 12-345 6791",
    startDate: "Jan 2024",
    expectedCompletion: "Jan 2028",
    weeklyProgress: [
      { week: 1, task: "Topic Selection", status: "completed", submission: "Topic Proposal" },
      { week: 2, task: "Literature Review", status: "in-progress", submission: "Pending" },
      { week: 3, task: "Research Gap Analysis", status: "overdue", submission: "Not Submitted" },
    ],
    milestones: [
      { name: "Topic Selection", progress: 100, status: "completed" },
      { name: "Literature Review", progress: 40, status: "in-progress" },
      { name: "Research Proposal", progress: 20, status: "in-progress" },
      { name: "Data Collection", progress: 0, status: "pending" },
      { name: "Analysis", progress: 0, status: "pending" },
    ],
  },
  {
    id: 4,
    name: "Aisha Rahman",
    program: "Masters Data Science",
    progress: 92,
    status: "on-track",
    lastMeeting: "Yesterday",
    nextMilestone: "Final Defense",
    avatar: "/placeholder.svg?key=st04",
    email: "aisha@utm.my",
    phone: "+60 12-345 6792",
    startDate: "Sep 2023",
    expectedCompletion: "Sep 2025",
    weeklyProgress: [
      { week: 1, task: "Final Revisions", status: "completed", submission: "Revised Thesis" },
      { week: 2, task: "Defense Preparation", status: "completed", submission: "Presentation Slides" },
      { week: 3, task: "Mock Defense", status: "completed", submission: "Practice Session" },
    ],
    milestones: [
      { name: "Proposal Defense", progress: 100, status: "completed" },
      { name: "Data Analysis", progress: 100, status: "completed" },
      { name: "Thesis Writing", progress: 100, status: "completed" },
      { name: "Final Review", progress: 95, status: "in-progress" },
      { name: "Final Defense", progress: 80, status: "in-progress" },
    ],
  },
  {
    id: 5,
    name: "Omar Abdullah",
    program: "PhD Cybersecurity",
    progress: 55,
    status: "on-track",
    lastMeeting: "5 days ago",
    nextMilestone: "Prototype Development",
    avatar: "/placeholder.svg?key=st05",
    email: "omar@utm.my",
    phone: "+60 12-345 6793",
    startDate: "Sep 2022",
    expectedCompletion: "Sep 2026",
    weeklyProgress: [
      { week: 1, task: "Security Analysis", status: "completed", submission: "Analysis Report" },
      { week: 2, task: "Algorithm Design", status: "completed", submission: "Design Document" },
      { week: 3, task: "Prototype Planning", status: "in-progress", submission: "Pending" },
    ],
    milestones: [
      { name: "Research Proposal", progress: 100, status: "completed" },
      { name: "Literature Review", progress: 100, status: "completed" },
      { name: "Prototype Development", progress: 35, status: "in-progress" },
      { name: "Testing & Validation", progress: 0, status: "pending" },
      { name: "Thesis Writing", progress: 0, status: "pending" },
    ],
  },
  {
    id: 6,
    name: "Zainab Yusof",
    program: "Masters Machine Learning",
    progress: 78,
    status: "on-track",
    lastMeeting: "3 days ago",
    nextMilestone: "Model Evaluation",
    avatar: "/placeholder.svg?key=st06",
    email: "zainab@utm.my",
    phone: "+60 12-345 6794",
    startDate: "Jan 2024",
    expectedCompletion: "Jan 2026",
    weeklyProgress: [
      { week: 1, task: "Dataset Preparation", status: "completed", submission: "Dataset Report" },
      { week: 2, task: "Model Training", status: "completed", submission: "Training Results" },
      { week: 3, task: "Model Optimization", status: "in-progress", submission: "Pending" },
    ],
    milestones: [
      { name: "Proposal Defense", progress: 100, status: "completed" },
      { name: "Data Collection", progress: 100, status: "completed" },
      { name: "Model Development", progress: 85, status: "in-progress" },
      { name: "Evaluation", progress: 40, status: "in-progress" },
      { name: "Thesis Writing", progress: 20, status: "in-progress" },
    ],
  },
  {
    id: 7,
    name: "Hassan Karim",
    program: "PhD Network Engineering",
    progress: 62,
    status: "on-track",
    lastMeeting: "1 week ago",
    nextMilestone: "Simulation Testing",
    avatar: "/placeholder.svg?key=st07",
    email: "hassan@utm.my",
    phone: "+60 12-345 6795",
    startDate: "Jan 2023",
    expectedCompletion: "Jan 2027",
    weeklyProgress: [
      { week: 1, task: "Network Design", status: "completed", submission: "Design Specifications" },
      { week: 2, task: "Simulation Setup", status: "completed", submission: "Setup Documentation" },
      { week: 3, task: "Initial Testing", status: "in-progress", submission: "Pending" },
    ],
    milestones: [
      { name: "Research Proposal", progress: 100, status: "completed" },
      { name: "Literature Review", progress: 100, status: "completed" },
      { name: "Network Design", progress: 80, status: "in-progress" },
      { name: "Simulation & Testing", progress: 30, status: "in-progress" },
      { name: "Analysis", progress: 0, status: "pending" },
    ],
  },
  {
    id: 8,
    name: "Nadia Ismail",
    program: "Masters Information Systems",
    progress: 70,
    status: "on-track",
    lastMeeting: "4 days ago",
    nextMilestone: "System Implementation",
    avatar: "/placeholder.svg?key=st08",
    email: "nadia@utm.my",
    phone: "+60 12-345 6796",
    startDate: "Sep 2023",
    expectedCompletion: "Sep 2025",
    weeklyProgress: [
      { week: 1, task: "Requirements Analysis", status: "completed", submission: "Requirements Doc" },
      { week: 2, task: "System Design", status: "completed", submission: "Design Document" },
      { week: 3, task: "Database Design", status: "completed", submission: "DB Schema" },
    ],
    milestones: [
      { name: "Proposal Defense", progress: 100, status: "completed" },
      { name: "System Analysis", progress: 100, status: "completed" },
      { name: "System Design", progress: 100, status: "completed" },
      { name: "Implementation", progress: 50, status: "in-progress" },
      { name: "Testing & Documentation", progress: 0, status: "pending" },
    ],
  },
]

export default function SupervisorStudentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [students, setStudents] = useState(allStudents)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    program: "",
    startDate: "",
    expectedCompletion: "",
  })
  const { toast } = useToast()

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.program.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === "all" || student.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.email || !newStudent.program || !newStudent.startDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Email, Program, Start Date)",
        variant: "destructive",
      })
      return
    }

    if (students.length >= 15) {
      toast({
        title: "Capacity Reached",
        description: "You have reached your maximum student capacity. Please contact admin to increase capacity.",
        variant: "destructive",
      })
      return
    }

    const newStudentData = {
      id: students.length + 1,
      name: newStudent.name,
      email: newStudent.email,
      phone: newStudent.phone || "+60 12-345 6789",
      program: newStudent.program,
      progress: 0,
      status: "on-track" as const,
      lastMeeting: "Not scheduled",
      nextMilestone: "Project Initiation",
      avatar: `/placeholder.svg?key=st${String(students.length + 1).padStart(2, "0")}`,
      startDate: newStudent.startDate,
      expectedCompletion:
        newStudent.expectedCompletion || calculateExpectedCompletion(newStudent.startDate, newStudent.program),
      weeklyProgress: [],
      milestones: [
        { name: "Research Proposal", progress: 0, status: "pending" },
        { name: "Literature Review", progress: 0, status: "pending" },
        { name: "Data Collection", progress: 0, status: "pending" },
        { name: "Analysis", progress: 0, status: "pending" },
        { name: "Thesis Writing", progress: 0, status: "pending" },
      ],
    }

    setStudents([...students, newStudentData])

    setNewStudent({
      name: "",
      email: "",
      phone: "",
      program: "",
      startDate: "",
      expectedCompletion: "",
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Student Added Successfully",
      description: `${newStudent.name} has been added to your supervision list.`,
    })
  }

  const calculateExpectedCompletion = (startDate: string, program: string) => {
    const isPHD = program.toLowerCase().includes("phd")
    const duration = isPHD ? 4 : 2
    const start = new Date(startDate)
    start.setFullYear(start.getFullYear() + duration)
    return start.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  }

  const handleViewProgress = (student: (typeof students)[0]) => {
    window.location.href = `/supervisor/students/${student.id}`
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-foreground">
              <span className="text-accent">UTM</span>Gradient
            </h1>
            <nav className="hidden md:flex gap-6">
              <Link
                href="/supervisor/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link href="/supervisor/students" className="text-sm font-medium text-foreground">
                Students
              </Link>
              <Link
                href="/supervisor/meetings"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Meetings
              </Link>
              <Link
                href="/supervisor/documents"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Documents
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <BellIcon />
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder.svg?key=sup01" alt="Supervisor" />
              <AvatarFallback>DS</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
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
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Add a new student to your supervision list. Fill in the required information below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Student Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Ahmad Ibrahim"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g., ahmad@utm.my"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="e.g., +60 12-345 6789"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="program">
                    Program <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={newStudent.program}
                    onValueChange={(value) => setNewStudent({ ...newStudent, program: value })}
                  >
                    <SelectTrigger id="program">
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PhD Computer Science">PhD Computer Science</SelectItem>
                      <SelectItem value="PhD Artificial Intelligence">PhD Artificial Intelligence</SelectItem>
                      <SelectItem value="PhD Cybersecurity">PhD Cybersecurity</SelectItem>
                      <SelectItem value="PhD Network Engineering">PhD Network Engineering</SelectItem>
                      <SelectItem value="PhD Data Science">PhD Data Science</SelectItem>
                      <SelectItem value="Masters Software Engineering">Masters Software Engineering</SelectItem>
                      <SelectItem value="Masters Data Science">Masters Data Science</SelectItem>
                      <SelectItem value="Masters Machine Learning">Masters Machine Learning</SelectItem>
                      <SelectItem value="Masters Information Systems">Masters Information Systems</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startDate">
                    Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="month"
                    value={newStudent.startDate}
                    onChange={(e) => setNewStudent({ ...newStudent, startDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expectedCompletion">Expected Completion (Optional)</Label>
                  <Input
                    id="expectedCompletion"
                    type="month"
                    value={newStudent.expectedCompletion}
                    onChange={(e) => setNewStudent({ ...newStudent, expectedCompletion: e.target.value })}
                    placeholder="Auto-calculated if left empty"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStudent}>Add Student</Button>
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

        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
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
                  <Button variant="outline" size="sm">
                    <MessageSquareIcon className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No students found matching your criteria</p>
          </Card>
        )}
      </main>
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
