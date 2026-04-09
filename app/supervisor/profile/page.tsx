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
import { User, Mail, Phone, Briefcase, Users, BookOpen, Edit2, Save, X, LogOut, Camera, Bell, Moon, Sun, CheckCircle2, AlertCircle, Award } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/lib/notifications-context"
import { useUser } from "@/lib/user-context"
import { studentsAPI, authAPI, usersAPI, removeToken, getUploadUrl, notificationPreferencesAPI } from "@/lib/api"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ImageCropper } from "@/components/image-cropper"
import { ProfilePicturePreview } from "@/components/profile-picture-preview"

export default function SupervisorProfile() {
  const { toast } = useToast()
  const router = useRouter()
  const { user, loading, updateUser, updateSupervisor, refreshUser } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState("/placeholder.svg")
  const [realStudentCount, setRealStudentCount] = useState(0)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>("")
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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
    
    // For document notifications, try to extract student name from message and find student
    if ((notif.type === 'document' || notif.type === 'submission') && notif.message) {
      try {
        // Extract student name from message (format: "StudentName has submitted...")
        const match = notif.message.match(/^([^ ]+(?: [^ ]+)*) has submitted/)
        if (match && match[1]) {
          const studentName = match[1].trim()
          // Try to get students from API to find the student
          try {
            const response = await studentsAPI.getAll()
            const studentsList = response.students || []
            const student = studentsList.find((s: any) => 
              (s.name || '').toLowerCase() === studentName.toLowerCase()
            )
            if (student && student.id) {
              router.push(`/supervisor/students/${student.id}`)
              return
            }
          } catch (error) {
            console.error('Error fetching students:', error)
          }
        }
      } catch (error) {
        console.error('Error finding student from notification:', error)
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
        // Navigate to students page (not documents page) for document notifications
        router.push(`${basePath}/students`)
        break
      case 'message':
        router.push(`${basePath}/dashboard`)
        break
      case 'progress':
      case 'reminder':
        router.push(`${basePath}/students`)
        break
      default:
        router.push(`${basePath}/dashboard`)
    }
  }

  // Fetch real-time student count and refresh user data (including capacity)
  useEffect(() => {
    const fetchStudentCount = async () => {
      if (user?.id) {
        try {
          const response = await studentsAPI.getAll()
          const students = response.students || []
          setRealStudentCount(students.length)
        } catch (error: any) {
          console.error('Error fetching student count:', error)
        }
      }
    }
    
    const refreshData = async () => {
      if (user?.id) {
        // Refresh user data to get latest capacity and other updates
        await refreshUser()
        // Also refresh student count
        await fetchStudentCount()
      }
    }
    
    // Initial fetch
    refreshData()
    
    // Poll for updates every 5 seconds (same interval as student count)
    // Only poll when tab is visible to save resources
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        refreshData()
      }
    }, 5000)
    
    // Handle page visibility changes - refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        refreshData()
      }
    }
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
    
    return () => {
      clearInterval(interval)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [user?.id, refreshUser])

  // Fetch notification preferences from API
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user?.id) return
      setIsLoadingSettings(true)
      try {
        const response = await notificationPreferencesAPI.get()
        if (response.preferences) {
          // Map API response to supervisor settings (excluding emailNotifications)
          setSettings({
            meetingReminders: response.preferences.meetingReminders ?? true,
            documentReviews: response.preferences.documentReviews ?? true,
          })
        }
      } catch (error) {
        console.error('Error fetching notification preferences:', error)
        toast({
          title: "Error",
          description: "Failed to load notification preferences.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingSettings(false)
      }
    }
    fetchPreferences()
  }, [user?.id, toast])

  // Transform user data to profile format
  const profileData = user ? {
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    department: user.department || "",
    position: user.position || "",
    officeLocation: user.office || "",
    currentStudents: realStudentCount || user.current_students || 0, // Use real-time count
    maxCapacity: user.capacity || 0,
    researchInterests: user.research_interests || "",
    qualifications: user.qualifications || "",
    biography: user.biography || "",
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
    biography: "",
  }

  const [editedData, setEditedData] = useState(profileData)
  const [capacityInput, setCapacityInput] = useState<string>(profileData.maxCapacity.toString())

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
        currentStudents: realStudentCount || user.current_students || 0, // Use real-time count
        maxCapacity: user.capacity || 0,
        researchInterests: user.research_interests || "",
        qualifications: user.qualifications || "",
        biography: user.biography || "",
      }
      setEditedData(updatedProfileData)
      setProfileImage(getUploadUrl(user.avatar))
      // Update capacity input when user data changes
      if (!isEditing) {
        setCapacityInput((user.capacity || 0).toString())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, realStudentCount])

  const [settings, setSettings] = useState({
    meetingReminders: true,
    documentReviews: true,
  })
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)

  const handleEdit = () => {
    setIsEditing(true)
    setEditedData(profileData)
    setCapacityInput(profileData.maxCapacity.toString())
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData(profileData)
    setCapacityInput(profileData.maxCapacity.toString())
  }

  const handleSave = async () => {
    try {
      // Update user fields (name, phone only - email can only be changed by admin)
      const userUpdates: { name?: string; phone?: string } = {}
      if (editedData.name !== profileData.name) userUpdates.name = editedData.name
      if (editedData.phone !== profileData.phone) userUpdates.phone = editedData.phone
      // Email cannot be changed by supervisor - only admin can change it
      
      if (Object.keys(userUpdates).length > 0) {
        await updateUser(userUpdates)
      }

      // Update supervisor-specific fields
      const supervisorUpdates: {
        office?: string
        office_hours?: string
        research_interests?: string
        position?: string
        qualifications?: string
        capacity?: number
      } = {}
      
      // Department cannot be changed by supervisor - only admin can change it
      
      if (editedData.officeLocation !== profileData.officeLocation) {
        supervisorUpdates.office = editedData.officeLocation
      }
      if (editedData.researchInterests !== profileData.researchInterests) {
        supervisorUpdates.research_interests = editedData.researchInterests
      }
      if (editedData.position !== profileData.position) {
        supervisorUpdates.position = editedData.position
      }
      if (editedData.qualifications !== profileData.qualifications) {
        supervisorUpdates.qualifications = editedData.qualifications
      }
      if (editedData.biography !== profileData.biography) {
        supervisorUpdates.biography = editedData.biography
      }
      // Parse capacity from input string
      const capacityValue = capacityInput === "" ? 0 : Number.parseInt(capacityInput, 10)
      if (!isNaN(capacityValue) && capacityValue >= 0 && capacityValue !== profileData.maxCapacity) {
        // Validate capacity is not less than current students
        if (capacityValue < profileData.currentStudents) {
          toast({
            title: "Invalid Capacity",
            description: `Capacity cannot be less than current student count (${profileData.currentStudents})`,
            variant: "destructive",
          })
          return
        }
        supervisorUpdates.capacity = capacityValue
      } else if (isNaN(capacityValue) || capacityValue < 0) {
        toast({
          title: "Invalid Capacity",
          description: "Please enter a valid number for capacity.",
          variant: "destructive",
        })
        return
      }
      
      if (Object.keys(supervisorUpdates).length > 0) {
        await updateSupervisor(supervisorUpdates)
      }

      // Explicitly refresh user data to ensure dashboard updates immediately
      await refreshUser()

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
    // Don't allow changing studentUpdates (it's removed from supervisor profile)
    if (setting === 'studentUpdates') {
      return
    }
    
    const updatedSettings = { ...settings, [setting]: value }
    setSettings(updatedSettings) // Optimistic update

    try {
      // Map supervisor settings to API format (excluding emailNotifications)
      const apiSettings = {
        emailNotifications: false, // Email notifications removed from UI
        meetingReminders: updatedSettings.meetingReminders,
        documentReviews: updatedSettings.documentReviews,
        deadlineReminders: true, // Not used by supervisor, but required by API
      }
      
      await notificationPreferencesAPI.update(apiSettings)
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      })
    } catch (error: any) {
      // Revert on error
      setSettings(settings)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update notification preferences.",
        variant: "destructive",
      })
    }
  }

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    if (!user) return { percentage: 0, missingFields: [] }
    
    const fields = [
      { key: 'name', label: 'Full Name', value: user.name },
      { key: 'email', label: 'Email', value: user.email },
      { key: 'phone', label: 'Phone Number', value: user.phone },
      { key: 'avatar', label: 'Profile Photo', value: user.avatar },
      { key: 'department', label: 'Department', value: user.department },
      { key: 'position', label: 'Position', value: user.position },
      { key: 'office', label: 'Office Location', value: user.office },
      { key: 'research_interests', label: 'Research Interests', value: user.research_interests },
      { key: 'qualifications', label: 'Qualifications', value: user.qualifications },
      { key: 'biography', label: 'Biography', value: user.biography },
    ]
    
    const filled = fields.filter(f => f.value && f.value !== '').length
    const missing = fields.filter(f => !f.value || f.value === '')
    
    return {
      percentage: Math.round((filled / fields.length) * 100),
      missingFields: missing.map(f => f.label)
    }
  }

  const profileCompletion = calculateProfileCompletion()

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
              <Link
                href="/supervisor/students"
                className="text-sm font-medium px-4 py-2 rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
              >
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
              <Link href="/supervisor/profile" className="text-sm font-medium px-4 py-2 rounded-lg text-foreground bg-muted/50 transition-smooth hover:bg-muted">
                Profile
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Popover>
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
            <CardContent className="pt-6 px-6">
              <div className="flex flex-col items-center text-center w-full">
                <div className="relative mb-4 group">
                  <Avatar 
                    className="h-32 w-32 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setShowPreview(true)}
                  >
                    <AvatarImage src={profileImage || "/placeholder.svg"} alt={profileData.name} />
                    <AvatarFallback className="text-3xl">
                      {profileData.name.split(" ").slice(-1)[0].charAt(0)}
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
                <p className="text-muted-foreground mb-2">{profileData.position}</p>
                <div className="w-full mb-4 px-2">
                  <Badge className="w-full break-words whitespace-normal text-center px-3 py-1.5 inline-block">{profileData.department}</Badge>
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
                    <Camera className="h-4 w-4 mr-2" />
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
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-foreground break-words">{profileData.officeLocation || "Not provided"}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-foreground break-words">
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
                      <div className="space-y-1">
                        <Input
                          id="department"
                          value={editedData.department}
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">Department can only be changed by administrator</p>
                      </div>
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
                        value={capacityInput}
                        onChange={(e) => {
                          // Allow any value while typing, including empty string
                          setCapacityInput(e.target.value)
                        }}
                        onBlur={(e) => {
                          // Validate and normalize on blur
                          const value = e.target.value
                          if (value === "") {
                            setCapacityInput("0")
                          } else {
                            const numValue = Number.parseInt(value, 10)
                            if (isNaN(numValue) || numValue < 0) {
                              // Reset to current value if invalid
                              setCapacityInput(profileData.maxCapacity.toString())
                            } else {
                              setCapacityInput(numValue.toString())
                            }
                          }
                        }}
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
                      rows={8}
                      placeholder="Enter your research interests (use bullet points or new lines for each item)..."
                    />
                  ) : (
                    <p className="text-foreground py-2 whitespace-pre-wrap">{profileData.researchInterests}</p>
                  )}
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="biography">Biography</Label>
                  {isEditing ? (
                    <Textarea
                      id="biography"
                      value={editedData.biography}
                      onChange={(e) => handleChange("biography", e.target.value)}
                      rows={8}
                      placeholder="Write your biography (use bullet points or new lines for each item)..."
                    />
                  ) : (
                    <p className="text-foreground py-2 whitespace-pre-wrap">{profileData.biography || "No biography provided"}</p>
                  )}
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
                      <Label htmlFor="documentReviews">Document Submission Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified when students submit documents</p>
                    </div>
                    <Switch
                      id="documentReviews"
                      checked={settings.documentReviews}
                      onCheckedChange={(checked) => handleSettingChange("documentReviews", checked)}
                      disabled={isLoadingSettings}
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
        fallback={profileData.name.split(" ").slice(-1)[0].charAt(0)}
      />
    </div>
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
          placeholder="Enter new password (min 6 characters)"
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
