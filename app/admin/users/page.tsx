"use client"

import { useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const { toast } = useToast()

  // Mock data for students
  const students = [
    {
      id: 1,
      name: "Sarah Chen",
      email: "sarah.chen@utm.my",
      phone: "+60 12-345 6789",
      supervisor: "Dr. Ahmad Rahman",
      program: "PhD Computer Science",
      progress: 75,
      status: "active",
      enrollmentDate: "Jan 2023",
      expectedCompletion: "Jan 2027",
    },
    {
      id: 2,
      name: "Michael Tan",
      email: "michael.tan@utm.my",
      phone: "+60 12-456 7890",
      supervisor: "Prof. Lisa Wong",
      program: "PhD Engineering",
      progress: 45,
      status: "active",
      enrollmentDate: "Sep 2023",
      expectedCompletion: "Sep 2027",
    },
    {
      id: 3,
      name: "Aisha Ibrahim",
      email: "aisha.ibrahim@utm.my",
      phone: "+60 12-567 8901",
      supervisor: "Dr. Ahmad Rahman",
      program: "PhD Data Science",
      progress: 30,
      status: "warning",
      enrollmentDate: "Jan 2024",
      expectedCompletion: "Jan 2028",
    },
    {
      id: 4,
      name: "David Lee",
      email: "david.lee@utm.my",
      phone: "+60 12-678 9012",
      supervisor: "Dr. Siti Aminah",
      program: "PhD AI & ML",
      progress: 90,
      status: "active",
      enrollmentDate: "Sep 2022",
      expectedCompletion: "Sep 2026",
    },
  ]

  // Mock data for supervisors
  const supervisors = [
    {
      id: 1,
      name: "Dr. Ahmad Rahman",
      email: "ahmad.rahman@utm.my",
      phone: "+60 13-234 5678",
      department: "Computer Science",
      students: 8,
      capacity: 10,
      status: "active",
      joinedDate: "Jan 2020",
    },
    {
      id: 2,
      name: "Prof. Lisa Wong",
      email: "lisa.wong@utm.my",
      phone: "+60 13-345 6789",
      department: "Engineering",
      students: 10,
      capacity: 10,
      status: "full",
      joinedDate: "Mar 2018",
    },
    {
      id: 3,
      name: "Dr. Siti Aminah",
      email: "siti.aminah@utm.my",
      phone: "+60 13-456 7890",
      department: "Data Science",
      students: 5,
      capacity: 8,
      status: "active",
      joinedDate: "Sep 2021",
    },
  ]

  // Mock data for admins
  const admins = [
    {
      id: 1,
      name: "Admin User",
      email: "admin@utm.my",
      phone: "+60 13-567 8901",
      role: "System Administrator",
      status: "active",
      joinedDate: "Jan 2019",
    },
    {
      id: 2,
      name: "John Smith",
      email: "john.smith@utm.my",
      phone: "+60 13-678 9012",
      role: "Department Admin",
      status: "active",
      joinedDate: "Jun 2020",
    },
  ]

  const handleAddUser = () => {
    toast({
      title: "User Added",
      description: "New user has been successfully added to the system.",
    })
    setIsAddUserOpen(false)
  }

  const handleDeactivateUser = (name: string) => {
    toast({
      title: "User Deactivated",
      description: `${name} has been deactivated.`,
      variant: "destructive",
    })
  }

  const handleExportUsers = () => {
    toast({
      title: "Export Started",
      description: "User data is being exported. Download will start shortly.",
    })
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
              <Link href="/admin/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/admin/users" className="text-sm font-medium text-foreground">
                Users
              </Link>
              <Link href="/admin/reports" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Reports
              </Link>
              <Link href="/admin/settings" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <BellIcon />
            </Button>
            <Link href="/admin/profile">
              <Avatar>
                <AvatarImage src="/placeholder.svg?key=admin01" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
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
                  <p className="text-3xl font-bold text-foreground">{students.length}</p>
                  <p className="text-sm text-green-600 mt-1">+12 this month</p>
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
                  <p className="text-3xl font-bold text-foreground">{supervisors.length}</p>
                  <p className="text-sm text-green-600 mt-1">+2 this month</p>
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
                  <p className="text-3xl font-bold text-foreground">{admins.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">No changes</p>
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
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>Create a new user account in the system</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">User Role</Label>
                        <Select>
                          <SelectTrigger id="role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="Enter full name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="user@utm.my" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" placeholder="+60 12-345 6789" />
                      </div>
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
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="students" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="students">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Students ({students.length})
                </TabsTrigger>
                <TabsTrigger value="supervisors">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Supervisors ({supervisors.length})
                </TabsTrigger>
                <TabsTrigger value="admins">
                  <Shield className="h-4 w-4 mr-2" />
                  Admins ({admins.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="students" className="space-y-4">
                {students.map((student) => (
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
                          <Badge variant={student.status === "active" ? "default" : "destructive"} className="text-xs">
                            {student.status}
                          </Badge>
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
                          <Progress value={student.progress} className="h-2 flex-1 max-w-xs" />
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
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem>View Progress</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeactivateUser(student.name)}
                        >
                          Deactivate Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="supervisors" className="space-y-4">
                {supervisors.map((supervisor) => (
                  <div
                    key={supervisor.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                          {supervisor.name.split(" ")[1].charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground">{supervisor.name}</p>
                          <Badge variant={supervisor.status === "active" ? "default" : "secondary"} className="text-xs">
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
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem>View Students</DropdownMenuItem>
                        <DropdownMenuItem>Adjust Capacity</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeactivateUser(supervisor.name)}
                        >
                          Deactivate Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="admins" className="space-y-4">
                {admins.map((admin) => (
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
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem>Manage Permissions</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeactivateUser(admin.name)}>
                          Deactivate Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// BellIcon component
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
