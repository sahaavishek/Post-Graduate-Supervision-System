"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  GraduationCap,
  UserCheck,
  TrendingUp,
  Search,
  MoreVertical,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  Settings,
  BarChart3,
  AlertCircle,
  Bell,
  Target,
  BookOpen,
  MessageSquare,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { DownloadReportButton } from "@/components/download-report-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useNotifications } from "@/lib/notifications-context"

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, clearAll } = useNotifications()

  const [selectedStudent, setSelectedStudent] = useState("")
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [selectedStudentData, setSelectedStudentData] = useState(null)
  const [viewProgressOpen, setViewProgressOpen] = useState(false)
  const [progressStudentData, setProgressStudentData] = useState(null)
  const [sendMessageOpen, setSendMessageOpen] = useState(false)
  const [messageRecipient, setMessageRecipient] = useState(null)
  const [messageContent, setMessageContent] = useState("")
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [selectedSupervisor, setSelectedSupervisor] = useState(null)
  const [editProfileData, setEditProfileData] = useState({
    name: "",
    email: "",
    department: "",
    capacity: 10,
  })
  const [viewStudentsOpen, setViewStudentsOpen] = useState(false)
  const [supervisorStudents, setSupervisorStudents] = useState([])
  const [adjustCapacityOpen, setAdjustCapacityOpen] = useState(false)
  const [newCapacity, setNewCapacity] = useState(10)
  const { toast } = useToast()
  const [users, setUsers] = useState([]) // Combined users state for real-time updates
  const [isAddUserOpen, setIsAddUserOpen] = useState(false) // Added state for add user dialog
  const [newUserData, setNewUserData] = useState({
    role: "",
    name: "",
    email: "",
    phone: "",
    program: "",
    department: "",
  }) // Added new user form state

  // Mock data for students
  const students = [
    {
      id: 1,
      name: "Sarah Chen",
      email: "sarah.chen@utm.my",
      supervisor: "Dr. Ahmad Rahman",
      program: "PhD Computer Science",
      progress: 75,
      status: "active",
      enrollmentDate: "Jan 2023",
      startDate: "Jan 2023",
      expectedCompletion: "Jan 2027",
      milestones: [
        { name: "Research Proposal", progress: 100, status: "completed" },
        { name: "Literature Review", progress: 100, status: "completed" },
        { name: "Data Collection", progress: 75, status: "in-progress" },
        { name: "Analysis", progress: 0, status: "pending" },
      ],
      documentsSubmitted: 15,
      pendingReviews: 2,
      meetingsThisMonth: 3,
      lastMeeting: "3 days ago",
    },
    {
      id: 2,
      name: "Michael Tan",
      email: "michael.tan@utm.my",
      supervisor: "Prof. Lisa Wong",
      program: "PhD Engineering",
      progress: 45,
      status: "active",
      enrollmentDate: "Sep 2023",
      startDate: "Sep 2023",
      expectedCompletion: "Sep 2027",
      milestones: [
        { name: "Research Proposal", progress: 100, status: "completed" },
        { name: "Literature Review", progress: 60, status: "in-progress" },
        { name: "Methodology", progress: 20, status: "in-progress" },
      ],
      documentsSubmitted: 8,
      pendingReviews: 1,
      meetingsThisMonth: 2,
      lastMeeting: "1 week ago",
    },
    {
      id: 3,
      name: "Aisha Ibrahim",
      email: "aisha.ibrahim@utm.my",
      supervisor: "Dr. Ahmad Rahman",
      program: "PhD Data Science",
      progress: 30,
      status: "warning",
      enrollmentDate: "Jan 2024",
      startDate: "Jan 2024",
      expectedCompletion: "Jan 2028",
      milestones: [
        { name: "Topic Selection", progress: 100, status: "completed" },
        { name: "Literature Review", progress: 40, status: "in-progress" },
        { name: "Research Proposal", progress: 10, status: "in-progress" },
      ],
      documentsSubmitted: 5,
      pendingReviews: 3,
      meetingsThisMonth: 1,
      lastMeeting: "2 weeks ago",
    },
    {
      id: 4,
      name: "David Lee",
      email: "david.lee@utm.my",
      supervisor: "Dr. Siti Aminah",
      program: "PhD AI & ML",
      progress: 90,
      status: "active",
      enrollmentDate: "Sep 2022",
      startDate: "Sep 2022",
      expectedCompletion: "Sep 2026",
      milestones: [
        { name: "Research Proposal", progress: 100, status: "completed" },
        { name: "Literature Review", progress: 100, status: "completed" },
        { name: "Implementation", progress: 100, status: "completed" },
        { name: "Thesis Writing", progress: 90, status: "in-progress" },
      ],
      documentsSubmitted: 25,
      pendingReviews: 1,
      meetingsThisMonth: 4,
      lastMeeting: "Yesterday",
    },
  ]

  // Mock data for supervisors
  const supervisors = [
    {
      id: 1,
      name: "Dr. Ahmad Rahman",
      email: "ahmad.rahman@utm.my",
      department: "Computer Science",
      students: 8,
      capacity: 10,
      status: "active",
    },
    {
      id: 2,
      name: "Prof. Lisa Wong",
      email: "lisa.wong@utm.my",
      department: "Engineering",
      students: 10,
      capacity: 10,
      status: "full",
    },
    {
      id: 3,
      name: "Dr. Siti Aminah",
      email: "siti.aminah@utm.my",
      department: "Data Science",
      students: 5,
      capacity: 8,
      status: "active",
    },
  ]

  // Mock data for system statistics
  const stats = [
    { label: "Total Students", value: "156", change: "+12", icon: GraduationCap, color: "text-blue-600" },
    { label: "Active Supervisors", value: "24", change: "+2", icon: UserCheck, color: "text-green-600" },
    { label: "Pending Reviews", value: "38", change: "-5", icon: FileText, color: "text-orange-600" },
    { label: "Completion Rate", value: "87%", change: "+3%", icon: TrendingUp, color: "text-purple-600" },
  ]

  // Mock data for recent activities
  const recentActivities = [
    {
      id: 1,
      type: "registration",
      message: "New student registration: Emily Zhang",
      time: "2 hours ago",
      icon: Users,
    },
    {
      id: 2,
      type: "milestone",
      message: "David Lee completed thesis defense milestone",
      time: "5 hours ago",
      icon: CheckCircle2,
    },
    {
      id: 3,
      type: "alert",
      message: "3 students behind schedule - requires attention",
      time: "1 day ago",
      icon: AlertCircle,
    },
    {
      id: 4,
      type: "meeting",
      message: "15 supervision meetings scheduled this week",
      time: "1 day ago",
      icon: Calendar,
    },
  ]

  // removed local notifications state and unreadCount
  // const unreadCount = notifications.filter((n) => !n.read).length

  const handleViewDetails = (student) => {
    setSelectedStudentData(student)
    setViewDetailsOpen(true)
  }

  const handleMarkNotificationAsRead = (id) => {
    markAsRead(id)
    toast({
      title: "Notification marked as read",
    })
  }

  const handleDeleteNotification = (id) => {
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

  const handleDeactivateUser = (name) => {
    toast({
      title: "User Deactivated",
      description: `${name} has been deactivated.`,
      variant: "destructive",
    })
  }

  const handleViewProgress = (student) => {
    setProgressStudentData(student)
    setViewProgressOpen(true)
  }

  const handleSendMessage = (user) => {
    setMessageRecipient(user)
    setSendMessageOpen(true)
  }

  const handleSendMessageSubmit = () => {
    if (!messageContent.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Message Sent",
      description: `Message sent to ${typeof messageRecipient === "string" ? messageRecipient : messageRecipient.name}`,
    })

    setSendMessageOpen(false)
    setMessageContent("")
    setMessageRecipient(null)
  }

  const handleEditProfile = (supervisor) => {
    setSelectedSupervisor(supervisor)
    setEditProfileData({
      name: supervisor.name,
      email: supervisor.email,
      department: supervisor.department,
      capacity: supervisor.capacity,
    })
    setEditProfileOpen(true)
  }

  const handleViewStudents = (supervisor) => {
    const assignedStudents = students.filter((student) => student.supervisor === supervisor.name)
    setSupervisorStudents(assignedStudents)
    setSelectedSupervisor(supervisor)
    setViewStudentsOpen(true)
  }

  const handleAdjustCapacity = (supervisor) => {
    setSelectedSupervisor(supervisor)
    setNewCapacity(supervisor.capacity)
    setAdjustCapacityOpen(true)
  }

  const handleSaveProfile = () => {
    if (!editProfileData.name || !editProfileData.email || !editProfileData.department) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSupervisorsState(
      supervisorsState.map((s) =>
        s.id === selectedSupervisor.id
          ? {
              ...s,
              name: editProfileData.name,
              email: editProfileData.email,
              department: editProfileData.department,
              capacity: editProfileData.capacity,
            }
          : s,
      ),
    )

    toast({
      title: "Profile Updated",
      description: `${editProfileData.name}'s profile has been updated successfully.`,
    })

    setEditProfileOpen(false)
    setSelectedSupervisor(null)
  }

  const handleSaveCapacity = () => {
    if (newCapacity < selectedSupervisor.students) {
      toast({
        title: "Invalid Capacity",
        description: `Capacity cannot be less than current student count (${selectedSupervisor.students})`,
        variant: "destructive",
      })
      return
    }

    setSupervisorsState(
      supervisorsState.map((s) =>
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
  }

  const [supervisorsState, setSupervisorsState] = useState(supervisors)

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.program.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.supervisor.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredSupervisors = supervisorsState.filter(
    (supervisor) =>
      supervisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supervisor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supervisor.department.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddUser = () => {
    if (!newUserData.role || !newUserData.name || !newUserData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const newUser = {
      id: Date.now(),
      name: newUserData.name,
      email: newUserData.email,
      phone: newUserData.phone || "+60 12-000 0000",
      status: "active",
      enrollmentDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    }

    if (newUserData.role === "student") {
      const newStudent = {
        ...newUser,
        supervisor: "Unassigned",
        program: newUserData.program || "PhD Computer Science",
        progress: 0,
        expectedCompletion: "TBD",
      }
      // For now, directly mutate students array, consider using a state setter for true reactivity
      students.unshift(newStudent)
    } else if (newUserData.role === "supervisor") {
      const newSupervisor = {
        ...newUser,
        department: newUserData.department || "Computer Science",
        students: 0,
        capacity: 10,
      }
      // For now, directly mutate supervisors array, consider using a state setter for true reactivity
      supervisors.unshift(newSupervisor)
      // Update supervisorsState as well
      setSupervisorsState([newSupervisor, ...supervisorsState])
    }

    toast({
      title: "User Added Successfully",
      description: `${newUserData.name} has been added to the system.`,
    })

    setIsAddUserOpen(false)
    setNewUserData({ role: "", name: "", email: "", phone: "", program: "", department: "" })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-foreground">
              <span className="text-accent">UTM</span>Gradient
            </h1>
            <nav className="hidden md:flex gap-6">
              <Link href="/admin/dashboard" className="text-sm font-medium text-foreground">
                Dashboard
              </Link>
              <Link href="/admin/users" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Users
              </Link>
              <Link href="/admin/reports" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Reports
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center p-0">
                      {unreadCount}
                    </Badge>
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
                      <div key={notif.id} className="p-3 border-b hover:bg-muted/50 flex gap-3 justify-between">
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
                            onClick={() => handleMarkNotificationAsRead(notif.id)}
                            className="h-6 w-6 p-0"
                          >
                            ✓
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotification(notif.id)}
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
              <Avatar className="cursor-pointer">
                <AvatarImage src="/placeholder.svg?key=admin01" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, Admin</h2>
          <p className="text-muted-foreground">Monitor system performance and manage users</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-green-600 mt-1">{stat.change} this month</p>
                  </div>
                  <div className={`h-12 w-12 rounded-full bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Management Tabs */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage students and supervisors in the system</CardDescription>
                  </div>
                  <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>Create a new user account in the system</DialogDescription>
                      </DialogHeader>
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
                              <SelectItem value="supervisor">Supervisor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
                            <label className="text-sm font-medium">Program</label>
                            <Input
                              placeholder="PhD Computer Science"
                              value={newUserData.program}
                              onChange={(e) => setNewUserData({ ...newUserData, program: e.target.value })}
                            />
                          </div>
                        )}
                        {newUserData.role === "supervisor" && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Department</label>
                            <Input
                              placeholder="Computer Science"
                              value={newUserData.department}
                              onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddUser}>Add User</Button>
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
                    <TabsTrigger value="supervisors">Supervisors ({supervisorsState.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="students" className="space-y-4">
                    {filteredStudents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No students found</div>
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
                                <Badge
                                  variant={student.status === "active" ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {student.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <p className="text-xs text-muted-foreground">{student.program}</p>
                                <p className="text-xs text-muted-foreground">Supervisor: {student.supervisor}</p>
                                <p className="text-xs text-muted-foreground">Enrolled: {student.enrollmentDate}</p>
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center gap-2">
                                  <Progress value={student.progress} className="h-2 flex-1" />
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
                                <DropdownMenuItem onClick={() => handleEditProfile(student.name)}>
                                  Edit Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewProgress(student)}>
                                  View Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendMessage(student)}>
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeactivateUser(student.name)}
                                >
                                  Deactivate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="supervisors" className="space-y-4">
                    {filteredSupervisors.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No supervisors found</div>
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
                              <DropdownMenuItem onClick={() => handleSendMessage(supervisor.name)}>
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeactivateUser(supervisor.name)}
                              >
                                Deactivate
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

            {/* System Reports */}
            <Card>
              <CardHeader>
                <CardTitle>System Reports</CardTitle>
                <CardDescription>Generate and view system-wide reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start bg-transparent"
                    onClick={() => {
                      toast({
                        title: "Generating Report",
                        description: "Progress Analytics report is being generated...",
                      })
                    }}
                  >
                    <BarChart3 className="h-5 w-5 mb-2 text-primary" />
                    <p className="font-semibold text-foreground">Progress Analytics</p>
                    <p className="text-xs text-muted-foreground">View completion rates and trends</p>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start bg-transparent"
                    onClick={() => {
                      toast({ title: "Generating Report", description: "User Statistics report is being generated..." })
                    }}
                  >
                    <Users className="h-5 w-5 mb-2 text-primary" />
                    <p className="font-semibold text-foreground">User Statistics</p>
                    <p className="text-xs text-muted-foreground">Enrollment and activity data</p>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start bg-transparent"
                    onClick={() => {
                      toast({ title: "Generating Report", description: "Meeting Reports are being generated..." })
                    }}
                  >
                    <Calendar className="h-5 w-5 mb-2 text-primary" />
                    <p className="font-semibold text-foreground">Meeting Reports</p>
                    <p className="text-xs text-muted-foreground">Supervision meeting analytics</p>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start bg-transparent"
                    onClick={() => {
                      toast({
                        title: "Generating Report",
                        description: "Document Reviews report is being generated...",
                      })
                    }}
                  >
                    <FileText className="h-5 w-5 mb-2 text-primary" />
                    <p className="font-semibold text-foreground">Document Reviews</p>
                    <p className="text-xs text-muted-foreground">Submission and review metrics</p>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and updates</CardDescription>
              </CardHeader>
              <CardContent>
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
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setIsAddUserOpen(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Add New User
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => {
                    toast({ title: "Generating Report", description: "System report is being generated..." })
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Link href="/admin/profile" className="w-full">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Settings className="h-4 w-4 mr-2" />
                    Profile & Settings
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => {
                    toast({ title: "View Alerts", description: "Showing system alerts and warnings..." })
                  }}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  View Alerts
                </Button>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Database</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-foreground">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Services</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-foreground">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Storage</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-foreground">78% Used</span>
                  </div>
                </div>
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
                    <Badge variant={selectedStudentData.status === "active" ? "default" : "destructive"}>
                      {selectedStudentData.status}
                    </Badge>
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
                  <Badge
                    variant={progressStudentData.status === "active" ? "default" : "destructive"}
                    className="text-sm"
                  >
                    {progressStudentData.status}
                  </Badge>
                </div>

                {/* Overall Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Overall Progress</h4>
                    <span className="text-2xl font-bold text-primary">{progressStudentData.progress}%</span>
                  </div>
                  <Progress value={progressStudentData.progress} className="h-3" />
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
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => handleSendMessage(progressStudentData)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <DownloadReportButton studentData={progressStudentData} variant="outline" className="flex-1" />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Send Message Dialog */}
        <Dialog open={sendMessageOpen} onOpenChange={setSendMessageOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a message to {typeof messageRecipient === "string" ? messageRecipient : messageRecipient?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Type your message here..."
                  value={messageContent || ""}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSendMessageOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessageSubmit}>Send Message</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Supervisor Profile</DialogTitle>
              <DialogDescription>Update supervisor information and settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  placeholder="Enter full name"
                  value={editProfileData.name || ""}
                  onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="supervisor@utm.my"
                  value={editProfileData.email || ""}
                  onChange={(e) => setEditProfileData({ ...editProfileData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department *</label>
                <Input
                  placeholder="Computer Science"
                  value={editProfileData.department || ""}
                  onChange={(e) => setEditProfileData({ ...editProfileData, department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Student Capacity</label>
                <Input
                  type="number"
                  min="0"
                  value={editProfileData.capacity || 0}
                  onChange={(e) =>
                    setEditProfileData({ ...editProfileData, capacity: Number.parseInt(e.target.value) || 0 })
                  }
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
                          <Progress value={student.progress} className="h-1.5 w-24" />
                          <span className="text-xs text-muted-foreground">{student.progress}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewProgress(student)}>
                        View Progress
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleSendMessage(student)}>
                        Message
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
    </div>
  )
}
