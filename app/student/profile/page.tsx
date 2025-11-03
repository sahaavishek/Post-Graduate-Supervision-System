"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Phone, GraduationCap, UserCheck, Edit2, Save, X, LogOut, Settings, Camera } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function StudentProfile() {
  const { toast } = useToast()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState("/placeholder.svg")

  // Mock student data
  const [profileData, setProfileData] = useState({
    name: "Ahmad Ibrahim",
    email: "ahmad.ibrahim@utm.my",
    phone: "+60 12-345 6789",
    program: "PhD Computer Science",
    enrollmentDate: "January 2023",
    expectedCompletion: "December 2026",
    supervisor: "Dr. Sarah Johnson",
    studentId: "PHD2023001",
    researchArea: "Artificial Intelligence & Machine Learning",
  })

  const [editedData, setEditedData] = useState(profileData)

  const [settings, setSettings] = useState({
    emailNotifications: true,
    meetingReminders: true,
    progressUpdates: true,
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

  const handleSave = () => {
    setProfileData(editedData)
    setIsEditing(false)
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
    })
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
          <Link href="/student/profile">
            <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src={profileImage || "/placeholder.svg"} alt="Student" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
          </Link>
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
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profileData.supervisor}</span>
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
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Settings
                </h3>
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
                <Button variant="outline">Change Password</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
