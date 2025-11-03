"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Phone, Shield, Settings, Edit2, Save, X, Calendar, LogOut, Camera } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AdminProfile() {
  const { toast } = useToast()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState("/placeholder.svg")

  // Mock admin data
  const [profileData, setProfileData] = useState({
    name: "Admin User",
    email: "admin@utm.my",
    phone: "+60 12-111 2222",
    role: "System Administrator",
    department: "IT Services",
    accountCreated: "January 2020",
    lastLogin: "Today, 9:30 AM",
    permissions: ["User Management", "System Settings", "Reports", "Database Access"],
  })

  const [editedData, setEditedData] = useState(profileData)

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
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
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
              <Button variant="ghost" size="icon">
                <BellIcon />
              </Button>
              <Link href="/admin/profile">
                <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={profileImage || "/placeholder.svg"} alt="Admin" />
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Profile & Settings</h2>
          <p className="text-muted-foreground">Manage your administrator account and system settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={profileImage || "/placeholder.svg"} alt={profileData.name} />
                    <AvatarFallback className="text-3xl">A</AvatarFallback>
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
                <p className="text-muted-foreground mb-2">{profileData.role}</p>
                <Badge className="mb-4 bg-primary">{profileData.department}</Badge>
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
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">Last login: {profileData.lastLogin}</span>
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
                  <CardDescription>Update your account and contact details</CardDescription>
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
                </div>
              </div>

              {/* Account Information */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <p className="text-muted-foreground py-2">{profileData.role}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountCreated">Account Created</Label>
                    <p className="text-muted-foreground py-2">{profileData.accountCreated}</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="lastLogin">Last Login</Label>
                    <p className="text-muted-foreground py-2">{profileData.lastLogin}</p>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">System Permissions</h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.permissions.map((permission, index) => (
                    <Badge key={index} variant="secondary">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Security Section */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Security</h3>
                <div className="flex gap-2">
                  <Button variant="outline">Change Password</Button>
                  <Button variant="outline">Two-Factor Authentication</Button>
                </div>
              </div>

              {/* System Settings Section */}
              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive system alerts and updates</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">System Maintenance</p>
                      <p className="text-sm text-muted-foreground">Schedule maintenance windows</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Backup Settings</p>
                      <p className="text-sm text-muted-foreground">Configure automatic backups</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">User Access Control</p>
                      <p className="text-sm text-muted-foreground">Manage user permissions and roles</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
