"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Phone, GraduationCap, UserCheck, Edit2, Save, X, LogOut, Camera, Bell } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/lib/notifications-context"
import { useUser } from "@/lib/user-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
          <Mail className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ScheduleMeetingForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    duration: "",
    type: "",
    agenda: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && formData.date && formData.time && formData.duration && formData.type && formData.agenda) {
      setIsSubmitting(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onSubmit(formData)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="title">Meeting Title</Label>
        <Input
          id="title"
          placeholder="e.g., Progress Review"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration</Label>
        <Input
          id="duration"
          placeholder="e.g., 1 hour"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Meeting Type</Label>
        <Select
          id="type"
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
          defaultValue="Online"
          required
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select meeting type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Online">Online</SelectItem>
            <SelectItem value="In-Person">In-Person</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agenda">Agenda</Label>
        <Textarea
          id="agenda"
          placeholder="What would you like to discuss?"
          value={formData.agenda}
          onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
          rows={4}
          required
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => setFormData({ title: "", date: "", time: "", duration: "", type: "", agenda: "" })}
        >
          Clear
        </Button>
        <Button
          type="submit"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={
            isSubmitting ||
            !formData.title ||
            !formData.date ||
            !formData.time ||
            !formData.duration ||
            !formData.type ||
            !formData.agenda
          }
        >
          {isSubmitting ? "Sending..." : "Send Request"}
        </Button>
      </div>
    </form>
  )
}

function ChangePasswordForm({
  passwordData,
  onPasswordChange,
  onSubmit,
  onCancel,
}: {
  passwordData: { currentPassword: string; newPassword: string; confirmPassword: string }
  onPasswordChange: (data: any) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input
          id="currentPassword"
          type="password"
          value={passwordData.currentPassword}
          onChange={(e) => onPasswordChange({ ...passwordData, currentPassword: e.target.value })}
          placeholder="Enter current password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          value={passwordData.newPassword}
          onChange={(e) => onPasswordChange({ ...passwordData, newPassword: e.target.value })}
          placeholder="Enter new password (min 8 characters)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={passwordData.confirmPassword}
          onChange={(e) => onPasswordChange({ ...passwordData, confirmPassword: e.target.value })}
          placeholder="Confirm new password"
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={onSubmit}>
          Change Password
        </Button>
      </div>
    </div>
  )
}

export default function StudentProfile() {
  const { toast } = useToast()
  const router = useRouter()
  const { user, loading, updateUser, updateStudent, refreshUser } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState("/placeholder.svg")
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [messages, setMessages] = useState<Array<{ type: string; text: string; time: string }>>([])
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [settings, setSettings] = useState({
    emailNotifications: true,
    meetingReminders: true,
    progressUpdates: true,
    documentReviews: true,
  })
  
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, clearAll } = useNotifications()

  // Transform user data to profile format
  const profileData = user ? {
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    program: user.program || "",
    enrollmentDate: user.start_date ? new Date(user.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "",
    expectedCompletion: user.expected_completion ? new Date(user.expected_completion).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "",
    supervisor: user.supervisor_name || "Not assigned",
    studentId: `PHD${String(user.id).padStart(6, '0')}`,
    researchArea: user.research_area || "",
  } : {
    name: "",
    email: "",
    phone: "",
    program: "",
    enrollmentDate: "",
    expectedCompletion: "",
    supervisor: "",
    studentId: "",
    researchArea: "",
  }

  const [editedData, setEditedData] = useState(profileData)

  // Update editedData when user data changes
  useEffect(() => {
    if (user) {
      const updatedProfileData = {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        program: user.program || "",
        enrollmentDate: user.start_date ? new Date(user.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "",
        expectedCompletion: user.expected_completion ? new Date(user.expected_completion).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "",
        supervisor: user.supervisor_name || "Not assigned",
        studentId: `PHD${String(user.id).padStart(6, '0')}`,
        researchArea: user.research_area || "",
      }
      setEditedData(updatedProfileData)
      setProfileImage(user.avatar || "/placeholder.svg")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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

      // Update student-specific fields
      const studentUpdates: {
        program?: string
        start_date?: string
        expected_completion?: string
      } = {}
      
      if (editedData.program !== profileData.program) {
        studentUpdates.program = editedData.program
      }
      
      // Convert enrollment date back to ISO format if changed
      if (editedData.enrollmentDate !== profileData.enrollmentDate) {
        try {
          const date = new Date(editedData.enrollmentDate)
          studentUpdates.start_date = date.toISOString().split('T')[0]
        } catch (e) {
          // Invalid date, skip
        }
      }
      
      // Convert expected completion back to ISO format if changed
      if (editedData.expectedCompletion !== profileData.expectedCompletion) {
        try {
          const date = new Date(editedData.expectedCompletion)
          studentUpdates.expected_completion = date.toISOString().split('T')[0]
        } catch (e) {
          // Invalid date, skip
        }
      }
      
      if (Object.keys(studentUpdates).length > 0) {
        await updateStudent(studentUpdates)
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

  const handleChange = (field: string, value: string) => {
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

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage = {
        type: "sent",
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages([...messages, newMessage])
      setMessageText("")

      toast({
        title: "Message Sent",
        description: "Your message has been sent to Dr. Sarah Johnson.",
      })

      // Simulate supervisor response
      setTimeout(() => {
        const response = {
          type: "received",
          text: "Thank you for your message. I'll review and get back to you soon.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
        setMessages((prev) => [...prev, response])
      }, 1000)
    } else {
      toast({
        title: "Cannot Send Empty Message",
        description: "Please type a message before sending.",
        variant: "destructive",
      })
    }
  }

  const handleScheduleMeeting = (formData: {
    title: string
    date: string
    time: string
    duration: string
    type: string
    agenda: string
  }) => {
    console.log("[v0] Meeting request submitted:", formData)
    setShowScheduleDialog(false)
    toast({
      title: "Meeting Request Sent",
      description: "Your meeting request has been sent to Dr. Sarah Johnson.",
    })
  }

  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields.",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation password must match.",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    // Simulate password change
    setShowPasswordDialog(false)
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    toast({
      title: "Password Changed",
      description: "Your password has been successfully updated.",
    })
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }
  
  // Show error if user not loaded
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load profile. Please try refreshing the page.</p>
          <Button onClick={() => router.push("/")}>Go to Login</Button>
        </div>
      </div>
    )
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
                href="/student/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/student/meetings"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Meetings
              </Link>
              <Link
                href="/student/documents"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Documents
              </Link>
              <Link
                href="/student/progress"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Progress
              </Link>
              <Link href="/student/profile" className="text-sm font-medium text-foreground">
                Profile
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Unified notification popover */}
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
            <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src={profileImage || "/placeholder.svg"} alt={profileData.name || "Student"} />
              <AvatarFallback>
                {profileData.name
                  ? profileData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "ST"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Profile & Settings</h2>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
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
                      {profileData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
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
                <p className="text-muted-foreground mb-2">{profileData.studentId}</p>
                <Badge className="mb-4">{profileData.program}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="mr-2 h-4 w-4" />
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
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profileData.supervisor}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border space-y-2">
                <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full bg-transparent" size="sm">
                      <Mail className="mr-2 h-4 w-4" />
                      Message Supervisor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] max-h-[600px] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Message Dr. Sarah Johnson</DialogTitle>
                    </DialogHeader>
                    <MessageDialog
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      messageText={messageText}
                      onMessageChange={setMessageText}
                    />
                  </DialogContent>
                </Dialog>

                <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full bg-transparent" size="sm">
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Schedule Meeting
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Schedule Meeting</DialogTitle>
                    </DialogHeader>
                    <ScheduleMeetingForm onSubmit={handleScheduleMeeting} />
                  </DialogContent>
                </Dialog>
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
                  <CardDescription>Update your personal and academic details</CardDescription>
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
                    <Label htmlFor="studentId">Student ID</Label>
                    <p className="text-muted-foreground py-2">{profileData.studentId}</p>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Academic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="program">Program</Label>
                    {isEditing ? (
                      <Input
                        id="program"
                        value={editedData.program}
                        onChange={(e) => handleChange("program", e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground py-2">{profileData.program}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="researchArea">Research Area</Label>
                    {isEditing ? (
                      <Input
                        id="researchArea"
                        value={editedData.researchArea}
                        onChange={(e) => handleChange("researchArea", e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground py-2">{profileData.researchArea}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enrollmentDate">Enrollment Date</Label>
                    <p className="text-muted-foreground py-2">{profileData.enrollmentDate}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedCompletion">Expected Completion</Label>
                    <p className="text-muted-foreground py-2">{profileData.expectedCompletion}</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="supervisor">Supervisor</Label>
                    <p className="text-muted-foreground py-2">{profileData.supervisor}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive email updates about your progress</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
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
                      <Label htmlFor="progressUpdates">Progress Updates</Label>
                      <p className="text-sm text-muted-foreground">Receive weekly progress summaries</p>
                    </div>
                    <Switch
                      id="progressUpdates"
                      checked={settings.progressUpdates}
                      onCheckedChange={(checked) => handleSettingChange("progressUpdates", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="documentReviews">Document Review Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get notified when documents are reviewed</p>
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
                <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Change Password</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <ChangePasswordForm
                      passwordData={passwordData}
                      onPasswordChange={setPasswordData}
                      onSubmit={handleChangePassword}
                      onCancel={() => setShowPasswordDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
