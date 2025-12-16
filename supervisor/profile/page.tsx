"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Phone, Briefcase, Users, BookOpen, Edit2, Save, X, LogOut, Camera, Bell } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/lib/notifications-context"
import { useUser } from "@/lib/user-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function SupervisorProfile() {
  const { toast } = useToast()
  const router = useRouter()
  const { user, loading, updateUser, updateSupervisor, refreshUser } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState("/placeholder.svg")

  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, clearAll } = useNotifications()

  // Transform user data to profile format
  const profileData = user ? {
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    department: user.department || "",
    position: user.position || "",
    officeLocation: user.office || "",
    currentStudents: user.current_students || 0,
    maxCapacity: user.capacity || 0,
    researchInterests: user.research_interests || "",
    qualifications: user.qualifications || "",
  } : {
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    officeLocation: "",
    currentStudents: 0,
    maxCapacity: 0,
    researchInterests: "",
    qualifications: "",
  }

  const [editedData, setEditedData] = useState(profileData)

  // Update editedData when user data changes
  useEffect(() => {
    if (user) {
      const updatedProfileData = {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        department: user.department || "",
        position: user.position || "",
        officeLocation: user.office || "",
        currentStudents: user.current_students || 0,
        maxCapacity: user.capacity || 0,
        researchInterests: user.research_interests || "",
        qualifications: user.qualifications || "",
      }
      setEditedData(updatedProfileData)
      setProfileImage(user.avatar || "/placeholder.svg")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const [settings, setSettings] = useState({
    emailNotifications: true,
    studentUpdates: true,
    meetingReminders: true,
    documentReviews: true,
  })

  const handleEdit = () => {
    setIsEditing(true)
    setEditedData(profileData)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData(profileData)
  }

  const handleSave = async () => {
    try {
      // Update user fields (name, phone)
      const userUpdates: { name?: string; phone?: string } = {}
      if (editedData.name !== profileData.name) userUpdates.name = editedData.name
      if (editedData.phone !== profileData.phone) userUpdates.phone = editedData.phone
      
      if (Object.keys(userUpdates).length > 0) {
        await updateUser(userUpdates)
      }

      // Update supervisor-specific fields
      const supervisorUpdates: {
        department?: string
        office?: string
        office_hours?: string
        research_interests?: string
      } = {}
      
      if (editedData.department !== profileData.department) {
        supervisorUpdates.department = editedData.department
      }
      if (editedData.officeLocation !== profileData.officeLocation) {
        supervisorUpdates.office = editedData.officeLocation
      }
      if (editedData.researchInterests !== profileData.researchInterests) {
        supervisorUpdates.research_interests = editedData.researchInterests
      }
      
      if (Object.keys(supervisorUpdates).length > 0) {
        await updateSupervisor(supervisorUpdates)
      }

      setIsEditing(false)
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setEditedData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result as string)
        toast({
          title: "Photo Updated",
          description: "Your profile photo has been successfully updated.",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSettingChange = (setting: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [setting]: value }))
    toast({
      title: "Settings Updated",
      description: "Your notification preferences have been updated.",
    })
  }

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    })
    setTimeout(() => {
      router.push("/")
    }, 1000)
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
              <Link
                href="/supervisor/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/supervisor/students"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
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
              <Link href="/supervisor/profile" className="text-sm font-medium text-foreground">
                Profile
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold">Notifications ({unreadCount})</h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                      Mark all read
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearAll}>
                      Clear all
                    </Button>
                  </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No notifications</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b hover:bg-muted/50 cursor-pointer ${notif.unread ? "bg-muted/30" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span>{notif.icon}</span>
                              <p className="font-medium text-sm">{notif.title}</p>
                              {notif.unread && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notif.timestamp}</p>
                          </div>
                          <div className="flex gap-1">
                            {notif.unread && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notif.id)
                                }}
                              >
                                ✓
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notif.id)
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Link href="/supervisor/profile">
              <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={profileImage || "/placeholder.svg"} alt="Supervisor" />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Profile & Settings</h2>
          <p className="text-muted-foreground">Manage your professional information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={profileImage || "/placeholder.svg"} alt={profileData.name} />
                    <AvatarFallback className="text-3xl">
                      {profileData.name.split(" ").slice(-1)[0].charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-accent text-white rounded-full p-2 hover:bg-accent/90 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">{profileData.name}</h3>
                <p className="text-muted-foreground mb-2">{profileData.position}</p>
                <Badge className="mb-4">{profileData.department}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profileData.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profileData.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profileData.officeLocation}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {profileData.currentStudents}/{profileData.maxCapacity} Students
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <Button variant="destructive" size="sm" className="w-full" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your professional and contact details</CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={handleEdit} size="sm">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input id="name" value={editedData.name} onChange={(e) => handleChange("name", e.target.value)} />
                    ) : (
                      <p className="text-foreground py-2">{profileData.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editedData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground py-2">{profileData.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editedData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground py-2">{profileData.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="officeLocation">Office Location</Label>
                    {isEditing ? (
                      <Input
                        id="officeLocation"
                        value={editedData.officeLocation}
                        onChange={(e) => handleChange("officeLocation", e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground py-2">{profileData.officeLocation}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Professional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    {isEditing ? (
                      <Input
                        id="department"
                        value={editedData.department}
                        onChange={(e) => handleChange("department", e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground py-2">{profileData.department}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    {isEditing ? (
                      <Input
                        id="position"
                        value={editedData.position}
                        onChange={(e) => handleChange("position", e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground py-2">{profileData.position}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxCapacity">Maximum Student Capacity</Label>
                    {isEditing ? (
                      <Input
                        id="maxCapacity"
                        type="number"
                        value={editedData.maxCapacity}
                        onChange={(e) => handleChange("maxCapacity", Number.parseInt(e.target.value))}
                      />
                    ) : (
                      <p className="text-foreground py-2">{profileData.maxCapacity}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentStudents">Current Students</Label>
                    <p className="text-muted-foreground py-2">{profileData.currentStudents}</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="qualifications">Qualifications</Label>
                    {isEditing ? (
                      <Input
                        id="qualifications"
                        value={editedData.qualifications}
                        onChange={(e) => handleChange("qualifications", e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground py-2">{profileData.qualifications}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Research Information */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Research Information
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="researchInterests">Research Interests</Label>
                  {isEditing ? (
                    <Textarea
                      id="researchInterests"
                      value={editedData.researchInterests}
                      onChange={(e) => handleChange("researchInterests", e.target.value)}
                      rows={4}
                    />
                  ) : (
                    <p className="text-foreground py-2">{profileData.researchInterests}</p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive email updates about student activities</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="studentUpdates">Student Progress Updates</Label>
                      <p className="text-sm text-muted-foreground">Get notified when students update their progress</p>
                    </div>
                    <Switch
                      id="studentUpdates"
                      checked={settings.studentUpdates}
                      onCheckedChange={(checked) => handleSettingChange("studentUpdates", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="meetingReminders">Meeting Reminders</Label>
                      <p className="text-sm text-muted-foreground">Get notified before scheduled meetings</p>
                    </div>
                    <Switch
                      id="meetingReminders"
                      checked={settings.meetingReminders}
                      onCheckedChange={(checked) => handleSettingChange("meetingReminders", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="documentReviews">Document Submission Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified when students submit documents</p>
                    </div>
                    <Switch
                      id="documentReviews"
                      checked={settings.documentReviews}
                      onCheckedChange={(checked) => handleSettingChange("documentReviews", checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Security</h3>
                <Button variant="outline">Change Password</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
