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
import { User, Mail, Phone, GraduationCap, UserCheck, Edit2, Save, X, LogOut, Camera, Bell, CheckCircle2, AlertCircle, Award } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/lib/notifications-context"
import { useUser } from "@/lib/user-context"
import { messagesAPI, studentsAPI, usersAPI, removeToken, getUploadUrl, progressAPI, documentsAPI, notificationPreferencesAPI } from "@/lib/api"
import { DownloadReportButton } from "@/components/download-report-button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ImageCropper } from "@/components/image-cropper"
import { ProfilePicturePreview } from "@/components/profile-picture-preview"

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
    if (!formData.title || !formData.date || !formData.time || !formData.duration || !formData.type || !formData.agenda) {
      return
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      alert("Meeting date cannot be in the past. Please select today or a future date.")
      return
    }

    // Validate time is between 8:00 AM and 5:00 PM
    const [hours, minutes] = formData.time.split(':')
    const hour = parseInt(hours)
    const minute = parseInt(minutes)
    const totalMinutes = hour * 60 + minute

    // 8:00 AM = 480 minutes, 5:00 PM = 1020 minutes
    if (totalMinutes < 480 || totalMinutes >= 1020) {
      alert("Meetings can only be scheduled between 8:00 AM and 5:00 PM.")
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onSubmit(formData)
    setIsSubmitting(false)
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
            min={new Date().toISOString().split('T')[0]}
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
            min="08:00"
            max="17:00"
            required
          />
          <p className="text-xs text-muted-foreground">Available: 8:00 AM - 5:00 PM</p>
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
  const [showCropper, setShowCropper] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>("")
  const [messageText, setMessageText] = useState("")
  const [messages, setMessages] = useState<Array<{ type: string; text: string; time: string }>>([])
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [settings, setSettings] = useState({
    meetingReminders: true,
    documentReviews: true,
    deadlineReminders: true,
  })
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  
  const [studentData, setStudentData] = useState({
    name: "",
    program: "",
    progress: 0,
    startDate: "",
    expectedCompletion: "",
    milestones: [] as any[],
    recentActivities: [] as any[],
    meetingsThisMonth: 0,
    documentsSubmitted: 0,
    pendingReviews: 0,
    monthsRemaining: 0,
    lastMeeting: "Not scheduled",
  })
  
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, clearAll } = useNotifications()

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
        return
      } catch (error) {
        console.error('Error navigating to notification link:', error)
      }
    }
    
    // Default navigation based on type for student role
    const basePath = '/student'
    switch (notif.type) {
      case 'meeting':
        router.push(`${basePath}/meetings`)
        break
      case 'document':
      case 'submission':
        router.push(`${basePath}/documents`)
        break
      case 'message':
        router.push(`${basePath}/dashboard`)
        break
      case 'progress':
      case 'reminder':
        router.push(`${basePath}/progress`)
        break
      default:
        router.push(`${basePath}/dashboard`)
    }
  }

  // State for supervisor name (fetched from API)
  const [supervisorName, setSupervisorName] = useState<string>("Not assigned")

  // Transform user data to profile format
  const profileData = user ? {
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    program: user.program || "",
    supervisor: supervisorName,
    studentId: `PHD${String(user.id).padStart(6, '0')}`,
    researchArea: user.research_area || "",
  } : {
    name: "",
    email: "",
    phone: "",
    program: "",
    supervisor: "",
    studentId: "",
    researchArea: "",
  }

  const [editedData, setEditedData] = useState(profileData)

  // Fetch student data for report
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.id) return
      try {
        const studentsResponse = await studentsAPI.getAll()
        const students = studentsResponse.students || []
        
        if (students.length > 0) {
          const student = students[0]
          
          // Fetch progress data
          const submissionsResponse = await progressAPI.getWeeklySubmissions(student.id)
          const submissions = submissionsResponse.submissions || []
          
          // Fetch documents
          const docsResponse = await documentsAPI.getAll({ type: 'submission' })
          const allDocuments = docsResponse.documents || []
          
          // Count submitted documents
          const documentsSubmitted = submissions.filter((s: any) => s.status === 'submitted').length
          const pendingReviews = allDocuments.filter((doc: any) => 
            doc.status === 'submitted' || doc.status === 'pending_review'
          ).length
          
          // Calculate progress
          let weeklyTasks: any[] = []
          try {
            const weeklyTasksResponse = await progressAPI.getWeeklyTasks(student.id)
            weeklyTasks = weeklyTasksResponse.tasks || []
          } catch (error) {
            // Silently handle if no tasks exist
          }
          
          // Use the actual count of weeks, not the maximum week number
          const TOTAL_WEEKS = weeklyTasks.length
          const calculatedProgress = TOTAL_WEEKS > 0 ? Math.round((documentsSubmitted / TOTAL_WEEKS) * 100) : 0
          
          // Format dates
          const startDate = student.start_date 
            ? new Date(student.start_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
            : "N/A"
          const expectedCompletion = student.expected_completion
            ? new Date(student.expected_completion).toLocaleDateString("en-US", { month: "short", year: "numeric" })
            : "N/A"
          
          // Calculate months remaining
          let monthsRemaining = 0
          if (student.expected_completion) {
            const today = new Date()
            const completionDate = new Date(student.expected_completion)
            const diffTime = completionDate.getTime() - today.getTime()
            const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
            monthsRemaining = Math.max(0, diffMonths)
          }
          
          setStudentData({
            name: student.name || user.name || "",
            program: student.program || "",
            progress: calculatedProgress,
            startDate,
            expectedCompletion,
            milestones: [],
            recentActivities: [],
            meetingsThisMonth: 0,
            documentsSubmitted,
            pendingReviews,
            monthsRemaining,
            lastMeeting: "Not scheduled",
          })
        }
      } catch (error) {
        console.error('Error fetching student data:', error)
      }
    }
    
    fetchStudentData()
  }, [user?.id])

  // Fetch supervisor name from API
  useEffect(() => {
    const fetchSupervisor = async () => {
      if (!user?.id) return
      try {
        const response = await studentsAPI.getAll()
        const students = response.students || []
        if (students.length > 0 && students[0].supervisor_name) {
          setSupervisorName(students[0].supervisor_name)
        } else {
          setSupervisorName("Not assigned")
        }
      } catch (error) {
        console.error("Error fetching supervisor:", error)
        setSupervisorName("Not assigned")
      }
    }
    fetchSupervisor()
  }, [user?.id])

  // Fetch notification preferences from API
  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      if (!user?.id) return
      try {
        setIsLoadingSettings(true)
        const response = await notificationPreferencesAPI.get()
        if (response.preferences) {
          // Exclude progressUpdates and emailNotifications from settings
          const { progressUpdates, emailNotifications, ...preferencesWithoutProgress } = response.preferences
          setSettings(preferencesWithoutProgress)
        }
      } catch (error) {
        console.error("Error fetching notification preferences:", error)
        // Keep default values on error
      } finally {
        setIsLoadingSettings(false)
      }
    }
    fetchNotificationPreferences()
  }, [user?.id])

  // Update editedData when user data changes
  useEffect(() => {
    if (user) {
      const updatedProfileData = {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        program: user.program || "",
        supervisor: supervisorName,
        studentId: `PHD${String(user.id).padStart(6, '0')}`,
        researchArea: user.research_area || "",
      }
      setEditedData(updatedProfileData)
      setProfileImage(getUploadUrl(user.avatar))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, supervisorName])

  // Fetch messages when dialog opens
  useEffect(() => {
    if (showMessageDialog) {
      fetchMessages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMessageDialog])

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    if (!user) return { percentage: 0, missingFields: [] }
    
    const fields = [
      { key: 'name', label: 'Full Name', value: user.name },
      { key: 'email', label: 'Email', value: user.email },
      { key: 'phone', label: 'Phone Number', value: user.phone },
      { key: 'avatar', label: 'Profile Photo', value: user.avatar },
      { key: 'program', label: 'Program', value: user.program },
      { key: 'research_area', label: 'Research Area', value: user.research_area },
    ]
    
    const filled = fields.filter(f => f.value && f.value !== '' && f.value !== 'Not assigned').length
    const missing = fields.filter(f => !f.value || f.value === '' || f.value === 'Not assigned')
    
    return {
      percentage: Math.round((filled / fields.length) * 100),
      missingFields: missing.map(f => f.label)
    }
  }

  const profileCompletion = calculateProfileCompletion()

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
      // Update user fields (name, phone only - email can only be changed by admin)
      const userUpdates: { name?: string; phone?: string } = {}
      if (editedData.name !== profileData.name) userUpdates.name = editedData.name
      if (editedData.phone !== profileData.phone) userUpdates.phone = editedData.phone
      // Email cannot be changed by student - only admin can change it
      
      if (Object.keys(userUpdates).length > 0) {
        await updateUser(userUpdates)
      }

      // Update student-specific fields
      const studentUpdates: {
        research_area?: string
      } = {}
      
      // Program cannot be changed by student - only admin can change it
      
      if (editedData.researchArea !== profileData.researchArea) {
        studentUpdates.research_area = editedData.researchArea
      }
      
      if (Object.keys(studentUpdates).length > 0) {
        await updateStudent(studentUpdates)
      }

      // Explicitly refresh user data to ensure dashboard updates immediately
      await refreshUser()
      
      // Refresh supervisor name after update
      try {
        const response = await studentsAPI.getAll()
        const students = response.students || []
        if (students.length > 0 && students[0].supervisor_name) {
          setSupervisorName(students[0].supervisor_name)
        }
      } catch (error) {
        console.error("Error refreshing supervisor:", error)
      }

      setIsEditing(false)
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      })
    } catch (error: any) {
      console.error("Profile update error:", error)
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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file.",
          variant: "destructive",
        })
        return
      }

      // Read file and show cropper
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
        setShowCropper(true)
      }
      reader.readAsDataURL(file)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    try {
      // Create a File from the Blob
      const file = new File([croppedImageBlob], 'profile-picture.jpg', { type: 'image/jpeg' })
      
      // Upload to server
      const response = await usersAPI.uploadAvatar(file)
      
      // Refresh user data to get the new avatar URL
      await refreshUser()
      
      toast({
        title: "Photo Updated",
        description: "Your profile photo has been successfully updated.",
      })
    } catch (error: any) {
      console.error("Avatar upload error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSettingChange = async (setting: string, value: boolean) => {
    // Don't allow changing progressUpdates or emailNotifications (they're removed from student profile)
    if (setting === 'progressUpdates' || setting === 'emailNotifications') {
      return
    }
    
    const updatedSettings = { ...settings, [setting]: value }
    setSettings(updatedSettings)
    
    try {
      // Exclude progressUpdates and emailNotifications when saving
      await notificationPreferencesAPI.update(updatedSettings)
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      })
    } catch (error: any) {
      // Revert on error
      setSettings(settings)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update notification preferences. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    // Clear authentication token from sessionStorage (tab-specific)
    removeToken()
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    })
    setTimeout(() => {
      router.push("/")
    }, 1000)
  }

  // Fetch messages with supervisor
  const fetchMessages = async () => {
    try {
      // Get supervisor_user_id from students API
      const studentsResponse = await studentsAPI.getAll()
      const students = studentsResponse.students || []
      if (students.length === 0 || !students[0].supervisor_user_id) {
        return
      }

      const supervisorUserId = students[0].supervisor_user_id
      const response = await messagesAPI.getConversation(supervisorUserId)
      const conversationMessages = response.messages || []
      
      // Transform messages to match the expected format
      // Note: sender_id and receiver_id in messages table reference users.id, not student.id
      const transformedMessages = conversationMessages.map((msg: any) => ({
        type: msg.sender_id === user?.user_id ? "sent" : "received",
        text: msg.content,
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }))
      
      setMessages(transformedMessages)
    } catch (error: any) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast({
        title: "Cannot Send Empty Message",
        description: "Please type a message before sending.",
        variant: "destructive",
      })
      return
    }

    try {
      // Get supervisor_user_id from students API
      const studentsResponse = await studentsAPI.getAll()
      const students = studentsResponse.students || []
      
      if (students.length === 0 || !students[0].supervisor_user_id) {
        toast({
          title: "Error",
          description: "Supervisor information is not available. Please contact support.",
          variant: "destructive",
        })
        return
      }

      const supervisorUserId = students[0].supervisor_user_id
      await messagesAPI.send({
        receiver_id: supervisorUserId,
        content: messageText.trim(),
      })

      // Refresh messages to show the new one
      await fetchMessages()

      setMessageText("")

      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${user?.supervisor_name || 'your supervisor'}.`,
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

  const handleChangePassword = async () => {
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

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    try {
      const { authAPI } = await import('@/lib/api')
      await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword)
      
      setShowPasswordDialog(false)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      })
    }
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
              <Link
                href="/student/progress"
                className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
              >
                Progress
              </Link>
              <Link href="/student/profile" className="text-sm font-medium px-4 py-2 rounded-lg text-foreground bg-muted/50 transition-smooth hover:bg-muted">
                Profile
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Unified notification popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="bg-red-500/10 text-red-700 mt-2">
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
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      markAsRead(notif.id)
                                    }}
                                  >
                                    Mark as Read
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNotification(notif.id)
                                  }}
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

      {/* Main Content with Enhanced Background */}
      <main className="container mx-auto px-6 py-10 max-w-7xl relative">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        </div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Profile & Settings</h2>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6 px-6">
              <div className="flex flex-col items-center text-center w-full">
                <div className="relative mb-4 group">
                  <Avatar 
                    className="h-32 w-32 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setShowPreview(true)}
                  >
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
                    title="Change photo"
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
                <h3 className="text-2xl font-bold text-foreground mb-1 break-words">{profileData.name}</h3>
                <p className="text-muted-foreground mb-2">{profileData.studentId}</p>
                <div className="w-full mb-4 px-2">
                  <Badge className="w-full break-words whitespace-normal text-center px-3 py-1.5 inline-block">{profileData.program}</Badge>
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => setShowPreview(true)}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Change Photo
                  </Button>
                </div>
              </div>

              {/* Profile Completion Indicator */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-accent" />
                      <h4 className="font-semibold text-foreground">Profile Completion</h4>
                    </div>
                    <span className={`text-2xl font-bold ${
                      profileCompletion.percentage === 100 
                        ? 'text-green-600 dark:text-green-400' 
                        : profileCompletion.percentage >= 75 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : profileCompletion.percentage >= 50 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {profileCompletion.percentage}%
                    </span>
                  </div>
                  <Progress value={profileCompletion.percentage} className="h-3" />
                  {profileCompletion.percentage < 100 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Missing Information:
                      </p>
                      <ul className="space-y-1.5">
                        {profileCompletion.missingFields.slice(0, 3).map((field, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"></span>
                            {field}
                          </li>
                        ))}
                        {profileCompletion.missingFields.length > 3 && (
                          <li className="text-xs text-muted-foreground">
                            +{profileCompletion.missingFields.length - 3} more
                          </li>
                        )}
                      </ul>
                      {!isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3 text-xs"
                          onClick={handleEdit}
                        >
                          <Edit2 className="h-3 w-3 mr-1.5" />
                          Complete Profile
                        </Button>
                      )}
                    </div>
                  )}
                  {profileCompletion.percentage === 100 && (
                    <div className="mt-3 flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <p className="text-xs font-medium">Profile Complete!</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-foreground break-words">{profileData.email}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-foreground break-words">{profileData.phone || "Not provided"}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <UserCheck className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-foreground break-words">{profileData.supervisor || "Not assigned"}</span>
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
                      <div className="space-y-1">
                        <Input
                          id="email"
                          type="email"
                          value={editedData.email}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">Email can only be changed by administrator</p>
                      </div>
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
                      <div className="space-y-1">
                        <Input
                          id="program"
                          value={editedData.program}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">Program can only be changed by administrator</p>
                      </div>
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
                        placeholder="Enter your research area"
                      />
                    ) : (
                      <p className="text-foreground py-2">{profileData.researchArea || "Not specified"}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="supervisor">Supervisor</Label>
                    <p className="text-foreground py-2">{profileData.supervisor}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="meetingReminders">Meeting Reminders</Label>
                      <p className="text-sm text-muted-foreground">Get notified before scheduled meetings</p>
                    </div>
                    <Switch
                      id="meetingReminders"
                      checked={settings.meetingReminders}
                      onCheckedChange={(checked) => handleSettingChange("meetingReminders", checked)}
                      disabled={isLoadingSettings}
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
                      disabled={isLoadingSettings}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="deadlineReminders">Deadline Reminders</Label>
                      <p className="text-sm text-muted-foreground">Notify 1 day before submission deadline</p>
                    </div>
                    <Switch
                      id="deadlineReminders"
                      checked={settings.deadlineReminders}
                      onCheckedChange={(checked) => handleSettingChange("deadlineReminders", checked)}
                      disabled={isLoadingSettings}
                    />
                  </div>
                </div>
              </div>

              {/* Reports & Analytics Section */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Reports & Analytics
                </h3>
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-4">
                      Download your comprehensive progress report with detailed analytics and insights.
                    </p>
                    <DownloadReportButton
                      studentData={studentData}
                      variant="outline"
                      size="default"
                      className="w-full justify-center bg-card/80 backdrop-blur-sm border-2 hover:border-primary/50 hover:bg-primary/5 shadow-sm hover:shadow-md transition-all"
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

      {/* Image Cropper Dialog */}
      <ImageCropper
        open={showCropper}
        onOpenChange={setShowCropper}
        imageSrc={selectedImage}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
      />

      {/* Profile Picture Preview Dialog */}
      <ProfilePicturePreview
        open={showPreview}
        onOpenChange={setShowPreview}
        imageSrc={profileImage}
        name={profileData.name}
        fallback={profileData.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()}
      />
    </div>
  )
}
