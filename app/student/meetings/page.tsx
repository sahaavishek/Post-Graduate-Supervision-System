"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useNotifications } from "@/lib/notifications-context"
import { useUser } from "@/lib/user-context"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { useToast } from "@/components/ui/use-toast"
import { meetingsAPI, getUploadUrl } from "@/lib/api"

export default function StudentMeetingsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleMeeting, setRescheduleMeeting] = useState<any>(null)
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "", reason: "" })
  const [searchQuery, setSearchQuery] = useState("")
  const [historySearchQuery, setHistorySearchQuery] = useState("")
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const [meetings, setMeetings] = useState<any[]>([])
  const [pastMeetings, setPastMeetings] = useState<any[]>([])
  const [pendingMeetings, setPendingMeetings] = useState<any[]>([])
  const [allMeetings, setAllMeetings] = useState<any[]>([])

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  // Helper function to format time
  const formatTime = (timeString: string, duration: number) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const mins = parseInt(minutes)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    
    // Calculate end time
    const totalMinutes = hour * 60 + mins + duration
    const endHour = Math.floor(totalMinutes / 60) % 24
    const endMins = totalMinutes % 60
    const endDisplayHour = endHour % 12 || 12
    const endAmpm = endHour >= 12 ? 'PM' : 'AM'
    
    return `${displayHour}:${String(mins).padStart(2, '0')} ${ampm} - ${endDisplayHour}:${String(endMins).padStart(2, '0')} ${endAmpm}`
  }

  // Fetch meetings from API
  const fetchMeetings = async () => {
    try {
      const response = await meetingsAPI.getAll()
      const allMeetings = response.meetings || []

      // Get current date to filter upcoming vs past meetings
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Transform pending meetings (status: pending and date >= today)
      const pendingMeetings = allMeetings
        .filter((m: any) => {
          const meetingDate = new Date(m.date)
          meetingDate.setHours(0, 0, 0, 0)
          return m.status === 'pending' && meetingDate >= today
        })
        .map((m: any) => ({
          id: m.id.toString(),
          title: m.title,
          date: formatDate(m.date),
          time: formatTime(m.time, m.duration || 60),
          location: m.location || (m.type === 'online' ? 'Online' : 'TBA'),
          meetingLink: m.meeting_link || null,
          supervisor: m.supervisor_name || 'Supervisor',
          email: m.supervisor_email || '',
          status: 'pending',
          agenda: m.agenda || '',
          supervisorNotes: m.notes || 'Awaiting confirmation from supervisor.',
        }))

      // Transform upcoming meetings (status: approved, confirmed, and date >= today)
      const upcomingMeetings = allMeetings
        .filter((m: any) => {
          const meetingDate = new Date(m.date)
          meetingDate.setHours(0, 0, 0, 0)
          return (m.status === 'approved' || m.status === 'confirmed') && meetingDate >= today
        })
        .map((m: any) => ({
          id: m.id.toString(),
          title: m.title,
          date: formatDate(m.date),
          time: formatTime(m.time, m.duration || 60),
          location: m.location || (m.type === 'online' ? 'Online' : 'TBA'),
          meetingLink: m.meeting_link || null,
          supervisor: m.supervisor_name || 'Supervisor',
          email: m.supervisor_email || '',
          status: 'confirmed',
          agenda: m.agenda || '',
          supervisorNotes: m.notes || '',
        }))

      // Transform past meetings (status: completed, cancelled, or date < today)
      const pastMeetingsData = allMeetings
        .filter((m: any) => {
          const meetingDate = new Date(m.date)
          meetingDate.setHours(0, 0, 0, 0)
          return m.status === 'completed' || m.status === 'cancelled' || meetingDate < today
        })
        .sort((a: any, b: any) => {
          // Sort by date descending (newest first)
          const dateA = new Date(a.date + ' ' + a.time)
          const dateB = new Date(b.date + ' ' + b.time)
          return dateB.getTime() - dateA.getTime()
        })
        .map((m: any) => ({
          id: `p${m.id}`,
          title: m.title,
          date: formatDate(m.date),
          time: formatTime(m.time, m.duration || 60),
          duration: `${m.duration || 60} ${(m.duration || 60) === 60 ? 'hour' : 'minutes'}`,
          supervisor: m.supervisor_name || 'Supervisor',
          recordingUrl: m.recording_url || null,
          hasRecording: !!m.recording_url,
          notes: m.notes || '',
          status: m.status,
        }))

      setMeetings(upcomingMeetings)
      setPastMeetings(pastMeetingsData)
      setPendingMeetings(pendingMeetings)
      
      // Store all meetings for statistics calculation
      setAllMeetings(allMeetings)
      
      setIsLoading(false)
    } catch (error: any) {
      console.error('Error fetching meetings:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load meetings. Please refresh the page.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Fetch meetings on mount and set up polling
  useEffect(() => {
    fetchMeetings()
    
    // Poll for new meetings every 10 seconds
    const interval = setInterval(() => {
      fetchMeetings()
    }, 10000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { notifications, unreadCount, markAsRead, deleteNotification, clearAll, markAllAsRead } = useNotifications()
  const { user } = useUser()
  
  // Expose fetchMeetings for use in MeetingRequestForm
  const refreshMeetings = () => {
    fetchMeetings()
  }

  const handleJoinMeeting = (meetingLink: string) => {
    if (meetingLink) {
      window.open(meetingLink, "_blank")
    }
  }

  const handleConfirmReschedule = async () => {
    if (!rescheduleData.date || !rescheduleData.time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!rescheduleMeeting) {
      toast({
        title: "Error",
        description: "Meeting not found",
        variant: "destructive",
      })
      return
    }

    try {
      // Find the original meeting in allMeetings to get the raw ID
      const originalMeeting = allMeetings.find((m: any) => m.id.toString() === rescheduleMeeting.id)
      
      if (!originalMeeting) {
        toast({
          title: "Error",
          description: "Could not find meeting details",
          variant: "destructive",
        })
        return
      }

      // Update meeting via API - set status to pending for student reschedule
      await meetingsAPI.update(parseInt(originalMeeting.id), {
        date: rescheduleData.date,
        time: rescheduleData.time,
        status: 'pending', // Set back to pending so supervisor can approve
        agenda: rescheduleData.reason ? `${originalMeeting.agenda || ''}\n\nReschedule reason: ${rescheduleData.reason}` : originalMeeting.agenda,
      })

      // Refresh meetings to get updated data
      await fetchMeetings()

      toast({
        title: "Meeting Rescheduled",
        description: "Your meeting has been rescheduled and is pending supervisor approval. Your supervisor has been notified.",
      })

      setRescheduleOpen(false)
      setRescheduleData({ date: "", time: "", reason: "" })
      setRescheduleMeeting(null)
    } catch (error: any) {
      console.error('Error rescheduling meeting:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule meeting. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsRead = (notificationId: number) => {
    markAsRead(notificationId)
  }

  const handleDeleteNotification = (notificationId: number) => {
    deleteNotification(notificationId)
  }

  const handleClearAll = () => {
    clearAll()
  }

  const filteredMeetings = meetings.filter((meeting) => {
    const query = searchQuery.toLowerCase()
    return (
      meeting.title.toLowerCase().includes(query) ||
      meeting.date.toLowerCase().includes(query) ||
      meeting.status.toLowerCase().includes(query) ||
      meeting.location.toLowerCase().includes(query) ||
      meeting.supervisor.toLowerCase().includes(query) ||
      meeting.time.toLowerCase().includes(query)
    )
  })

  const filteredPendingMeetings = pendingMeetings.filter((meeting) => {
    const query = searchQuery.toLowerCase()
    return (
      meeting.title.toLowerCase().includes(query) ||
      meeting.date.toLowerCase().includes(query) ||
      meeting.status.toLowerCase().includes(query) ||
      meeting.location.toLowerCase().includes(query) ||
      meeting.supervisor.toLowerCase().includes(query) ||
      meeting.time.toLowerCase().includes(query)
    )
  })

  const filteredPastMeetings = pastMeetings.filter((meeting) => {
    const query = historySearchQuery.toLowerCase()
    return (
      meeting.title.toLowerCase().includes(query) ||
      meeting.date.toLowerCase().includes(query) ||
      meeting.supervisor.toLowerCase().includes(query) ||
      meeting.time.toLowerCase().includes(query)
    )
  })

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
              <Link href="/student/meetings" className="text-sm font-medium px-4 py-2 rounded-lg text-foreground bg-muted/50 transition-smooth hover:bg-muted">
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
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsDropdown
              unreadCount={unreadCount}
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
              onClearAll={handleClearAll}
              onMarkAllAsRead={markAllAsRead}
            />
            <Link href="/student/profile" className="cursor-pointer">
              <Avatar>
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
            <h2 className="text-3xl font-bold text-foreground mb-2">Meetings</h2>
            <p className="text-muted-foreground">Schedule and manage your supervision meetings</p>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-green-600 text-white hover:bg-green-700">
                  <VideoIcon className="mr-2 h-4 w-4" />
                  Join Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Join Meeting</DialogTitle>
                </DialogHeader>
                <JoinMeetingForm onJoin={handleJoinMeeting} />
              </DialogContent>
            </Dialog>

            <Dialog open={scheduleMeetingOpen} onOpenChange={setScheduleMeetingOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Schedule a Meeting</DialogTitle>
                </DialogHeader>
                <MeetingRequestForm 
                  onSuccess={() => {
                    setScheduleMeetingOpen(false)
                    refreshMeetings()
                  }}
                  onCancel={() => {
                    setScheduleMeetingOpen(false)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue={pendingMeetings.length > 0 ? "pending" : "upcoming"} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Pending ({pendingMeetings.length})</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming ({meetings.length})</TabsTrigger>
                <TabsTrigger value="history">History ({pastMeetings.length})</TabsTrigger>
              </TabsList>

              {/* Pending Meetings Tab */}
              <TabsContent value="pending" className="mt-6">
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Search by title, date, time, location, or supervisor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-4">
                  {isLoading ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">Loading pending meetings...</p>
                    </Card>
                  ) : filteredPendingMeetings.length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">
                        {searchQuery ? "No pending meetings found matching your search" : "No pending meetings. Meetings you schedule will appear here until your supervisor approves them."}
                      </p>
                    </Card>
                  ) : (
                    <>
                      <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-900 dark:text-yellow-100">
                          <strong>Pending Meetings:</strong> These meetings are waiting for your supervisor's approval. Once approved, they will move to "Upcoming Meetings".
                        </p>
                      </div>
                      {filteredPendingMeetings.map((meeting) => (
                        <MeetingCard
                          key={meeting.id}
                          title={meeting.title}
                          date={meeting.date}
                          time={meeting.time}
                          location={meeting.location}
                          supervisor={meeting.supervisor}
                          status={meeting.status}
                          agenda={meeting.agenda}
                          meetingLink={meeting.meetingLink}
                          isToday={meeting.date === "Today"}
                          onViewDetails={() => {
                            setSelectedMeeting(meeting)
                            setViewDetailsOpen(true)
                          }}
                          onReschedule={() => {
                            // Find original meeting to get raw date/time
                            const originalMeeting = allMeetings.find((m: any) => m.id.toString() === meeting.id)
                            if (originalMeeting) {
                              setRescheduleMeeting(meeting)
                              setRescheduleData({ 
                                date: originalMeeting.date, 
                                time: originalMeeting.time, 
                                reason: "" 
                              })
                              setRescheduleOpen(true)
                            }
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Upcoming Meetings Tab */}
              <TabsContent value="upcoming" className="mt-6">
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Search by title, date, time, location, or supervisor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-4">
                  {isLoading ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">Loading meetings...</p>
                    </Card>
                  ) : filteredMeetings.length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">
                        {searchQuery ? "No meetings found matching your search" : "No upcoming meetings scheduled. Approved meetings will appear here."}
                      </p>
                    </Card>
                  ) : (
                    <>
                      <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-900 dark:text-green-100">
                          <strong>Upcoming Meetings:</strong> These are approved meetings that are scheduled to take place.
                        </p>
                      </div>
                      {filteredMeetings.map((meeting) => (
                        <MeetingCard
                        key={meeting.id}
                        title={meeting.title}
                        date={meeting.date}
                        time={meeting.time}
                        location={meeting.location}
                        supervisor={meeting.supervisor}
                        status={meeting.status}
                        agenda={meeting.agenda}
                        meetingLink={meeting.meetingLink}
                        isToday={meeting.date === "Today"}
                        onViewDetails={() => {
                          setSelectedMeeting(meeting)
                          setViewDetailsOpen(true)
                        }}
                        onReschedule={() => {
                          setRescheduleMeeting(meeting)
                          setRescheduleOpen(true)
                        }}
                      />
                      ))}
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Meeting History Tab */}
              <TabsContent value="history" className="mt-6">
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Search by title, date, supervisor, or time..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-4">
                  {isLoading ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">Loading meeting history...</p>
                    </Card>
                  ) : filteredPastMeetings.length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">
                        {historySearchQuery
                          ? "No past meetings found matching your search"
                          : "No meeting history available"}
                      </p>
                    </Card>
                  ) : (
                    filteredPastMeetings.map((meeting) => (
                      <PastMeetingCard
                        key={meeting.id}
                        title={meeting.title}
                        date={meeting.date}
                        time={meeting.time}
                        duration={meeting.duration}
                        supervisor={meeting.supervisor}
                        recordingUrl={meeting.recordingUrl}
                        hasRecording={meeting.hasRecording}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Calendar */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Calendar</h3>
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
            </Card>

            {/* Meeting Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Meeting Statistics</h3>
              <div className="space-y-4">
                {(() => {
                  const now = new Date()
                  const currentMonth = now.getMonth()
                  const currentYear = now.getFullYear()
                  
                  // Calculate statistics from all meetings
                  const meetingsThisMonth = allMeetings.filter((m: any) => {
                    const meetingDate = new Date(m.date)
                    return meetingDate.getMonth() === currentMonth && meetingDate.getFullYear() === currentYear
                  }).length
                  
                  const totalMeetings = allMeetings.length
                  
                  const totalDuration = allMeetings.reduce((sum: number, m: any) => sum + (m.duration || 60), 0)
                  const avgDuration = totalMeetings > 0 ? Math.round(totalDuration / totalMeetings) : 0
                  
                  const recordings = allMeetings.filter((m: any) => m.recording_url).length
                  
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">This Month</span>
                        <span className="text-2xl font-bold text-foreground">{meetingsThisMonth}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Meetings</span>
                        <span className="text-2xl font-bold text-foreground">{totalMeetings}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Avg. Duration</span>
                        <span className="text-2xl font-bold text-foreground">{avgDuration}m</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Recordings</span>
                        <span className="text-2xl font-bold text-foreground">{recordings}</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </Card>

            {/* Quick Tips */}
            <Card className="p-6 bg-accent/5 border-accent/20">
              <h3 className="text-lg font-bold text-foreground mb-3">Meeting Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span>Prepare agenda items before each meeting</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span>Share documents 24 hours in advance</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span>Take notes during the meeting</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span>Follow up on action items promptly</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>

        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Meeting Details</DialogTitle>
            </DialogHeader>
            {selectedMeeting && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Meeting Title</Label>
                    <p className="font-semibold text-foreground">{selectedMeeting.title}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p className="font-semibold">
                      <Badge
                        className={
                          selectedMeeting.status === "confirmed"
                            ? "bg-green-500/20 text-green-700 dark:text-green-400"
                            : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                        }
                      >
                        {selectedMeeting.status === "confirmed" ? "Confirmed" : "Pending"}
                      </Badge>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="font-semibold text-foreground">{selectedMeeting.date}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Time</Label>
                    <p className="font-semibold text-foreground">{selectedMeeting.time}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-semibold text-foreground">{selectedMeeting.location}</p>
                </div>
                {selectedMeeting.meetingLink && (
                  <div>
                    <Label className="text-muted-foreground">Meeting Link</Label>
                    <p className="font-semibold text-foreground">
                      <a 
                        href={selectedMeeting.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {selectedMeeting.meetingLink}
                      </a>
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Supervisor</Label>
                    <p className="font-semibold text-foreground">{selectedMeeting.supervisor}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-semibold text-foreground text-sm">{selectedMeeting.email}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Agenda</Label>
                  <p className="text-foreground">{selectedMeeting.agenda}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Supervisor's Notes</Label>
                  <p className="text-foreground">{selectedMeeting.supervisorNotes}</p>
                </div>
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setViewDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Reschedule Meeting</DialogTitle>
            </DialogHeader>
            {rescheduleMeeting && (
              <form
                className="space-y-4 mt-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleConfirmReschedule()
                }}
              >
                <div>
                  <Label className="text-muted-foreground">Current Meeting</Label>
                  <p className="font-semibold text-foreground">{rescheduleMeeting.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {rescheduleMeeting.date} at {rescheduleMeeting.time}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4 text-foreground">Select New Date & Time</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reschedule-date">New Date *</Label>
                      <Input
                        id="reschedule-date"
                        type="date"
                        value={rescheduleData.date}
                        onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reschedule-time">New Time *</Label>
                      <Input
                        id="reschedule-time"
                        type="time"
                        value={rescheduleData.time}
                        onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reschedule-reason">Reason for Rescheduling (Optional)</Label>
                  <Textarea
                    id="reschedule-reason"
                    placeholder="Let your supervisor know why you're rescheduling..."
                    rows={3}
                    value={rescheduleData.reason}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setRescheduleOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Confirm Reschedule
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

function JoinMeetingForm({ onJoin }: { onJoin: (meetingLink: string) => void }) {
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null)
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await meetingsAPI.getAll()
        const allMeetings = response.meetings || []
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Get approved/confirmed meetings with links
        const upcoming = allMeetings
          .filter((m: any) => {
            const meetingDate = new Date(m.date)
            meetingDate.setHours(0, 0, 0, 0)
            return (m.status === 'approved' || m.status === 'confirmed') && 
                   meetingDate >= today && 
                   m.meeting_link
          })
          .map((m: any) => ({
            id: m.id.toString(),
            title: m.title,
            date: m.date,
            time: m.time,
            meetingLink: m.meeting_link,
            supervisor: m.supervisor_name || 'Supervisor',
          }))
        
        setUpcomingMeetings(upcoming)
        setIsLoading(false)
      } catch (error: any) {
        console.error('Error fetching meetings:', error)
        setIsLoading(false)
      }
    }
    
    fetchMeetings()
  }, [])

  const handleJoin = () => {
    if (selectedMeeting && selectedMeeting.meetingLink) {
      onJoin(selectedMeeting.meetingLink)
    } else {
      toast({
        title: "No Meeting Selected",
        description: "Please select a meeting to join.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Join Meeting</h4>
        <p className="text-sm text-green-700 dark:text-green-300 mb-3">
          Select a meeting from your upcoming meetings to join.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Loading meetings...</p>
        </div>
      ) : upcomingMeetings.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No upcoming meetings with links available.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="meeting-select">Select Meeting</Label>
          <Select value={selectedMeeting?.id || ""} onValueChange={(value) => {
            const meeting = upcomingMeetings.find(m => m.id === value)
            setSelectedMeeting(meeting || null)
          }}>
            <SelectTrigger id="meeting-select">
              <SelectValue placeholder="Choose a meeting" />
            </SelectTrigger>
            <SelectContent>
              {upcomingMeetings.map((meeting) => (
                <SelectItem key={meeting.id} value={meeting.id}>
                  {meeting.title} - {meeting.supervisor} ({new Date(meeting.date).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedMeeting && (
            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">{selectedMeeting.title}</p>
              <p className="text-xs text-muted-foreground">
                {selectedMeeting.supervisor} • {new Date(selectedMeeting.date).toLocaleDateString()} at {selectedMeeting.time}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button 
          type="button" 
          className="bg-green-600 text-white hover:bg-green-700" 
          onClick={handleJoin}
          disabled={!selectedMeeting}
        >
          <VideoIcon className="mr-2 h-4 w-4" />
          Join Meeting
        </Button>
      </div>
    </div>
  )
}


function MeetingRequestForm({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) {
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [duration, setDuration] = useState("")
  const [meetingType, setMeetingType] = useState("")
  const [meetingLink, setMeetingLink] = useState("")
  const [agenda, setAgenda] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeError, setTimeError] = useState("")
  const { toast } = useToast()

  // Calculate max time based on duration
  const getMaxTime = () => {
    if (!duration) return "17:00"
    const durationMinutes = parseInt(duration)
    const maxEndTime = 1020 // 5:00 PM in minutes
    const maxStartTime = maxEndTime - durationMinutes
    if (maxStartTime < 480) return "08:00" // Can't start before 8 AM
    const maxHour = Math.floor(maxStartTime / 60)
    const maxMin = maxStartTime % 60
    return `${String(maxHour).padStart(2, '0')}:${String(maxMin).padStart(2, '0')}`
  }

  // Validate time when it changes
  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    setTimeError("")
    
    if (!newTime || !duration) return
    
    const [hours, minutes] = newTime.split(':')
    const hour = parseInt(hours)
    const minute = parseInt(minutes)
    const startTimeMinutes = hour * 60 + minute
    const durationMinutes = parseInt(duration)
    const endTimeMinutes = startTimeMinutes + durationMinutes

    // Check if end time exceeds 5:00 PM
    if (endTimeMinutes > 1020) {
      const maxStartTime = 1020 - durationMinutes
      const maxHour = Math.floor(maxStartTime / 60)
      const maxMin = maxStartTime % 60
      const maxTime12Hour = maxHour > 12 ? `${maxHour - 12}:${String(maxMin).padStart(2, '0')} PM` : maxHour === 12 ? `12:${String(maxMin).padStart(2, '0')} PM` : `${maxHour}:${String(maxMin).padStart(2, '0')} AM`
      setTimeError(`Meeting will end after 5:00 PM. Latest start time: ${maxTime12Hour}`)
    }
  }

  // Validate time when duration changes
  const handleDurationChange = (newDuration: string) => {
    setDuration(newDuration)
    setTimeError("")
    
    if (!time || !newDuration) return
    
    // Re-validate time with new duration
    handleTimeChange(time)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('=== Form Submit Handler Called ===')
    console.log('Form values:', { title, date, time, duration, meetingType, meetingLink, agenda })
    
    // Check each field individually to provide better error messages
    if (!title) {
      console.log('Validation failed: Missing title')
      toast({
        title: "Validation Error",
        description: "Please enter a meeting title.",
        variant: "destructive",
      })
      return
    }
    
    if (!date) {
      toast({
        title: "Validation Error",
        description: "Please select a meeting date.",
        variant: "destructive",
      })
      return
    }
    
    if (!time) {
      toast({
        title: "Validation Error",
        description: "Please select a meeting time.",
        variant: "destructive",
      })
      return
    }
    
    if (!duration) {
      toast({
        title: "Validation Error",
        description: "Please select a meeting duration.",
        variant: "destructive",
      })
      return
    }
    
    if (!meetingType) {
      toast({
        title: "Validation Error",
        description: "Please select a meeting type (In-Person or Online).",
        variant: "destructive",
      })
      return
    }
    
    if (!agenda) {
      toast({
        title: "Validation Error",
        description: "Please provide an agenda or purpose for the meeting.",
        variant: "destructive",
      })
      return
    }

    // Validate date is not in the past
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      toast({
        title: "Invalid Date",
        description: "Meeting date cannot be in the past. Please select today or a future date.",
        variant: "destructive",
      })
      return
    }

    // Validate time is between 8:00 AM and 5:00 PM
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const minute = parseInt(minutes)
    const startTimeMinutes = hour * 60 + minute

    // 8:00 AM = 480 minutes, 5:00 PM = 1020 minutes
    if (startTimeMinutes < 480 || startTimeMinutes >= 1020) {
      toast({
        title: "Invalid Time",
        description: "Meetings can only start between 8:00 AM and 5:00 PM.",
        variant: "destructive",
      })
      return
    }

    // Validate that meeting end time doesn't exceed 5:00 PM
    const durationMinutes = parseInt(duration)
    const endTimeMinutes = startTimeMinutes + durationMinutes

    // 5:00 PM = 1020 minutes (17:00)
    if (endTimeMinutes > 1020) {
      const maxStartTime = 1020 - durationMinutes
      const maxHour = Math.floor(maxStartTime / 60)
      const maxMin = maxStartTime % 60
      const maxTimeFormatted = `${maxHour}:${String(maxMin).padStart(2, '0')}`
      const maxTime12Hour = maxHour > 12 ? `${maxHour - 12}:${String(maxMin).padStart(2, '0')} PM` : `${maxHour}:${String(maxMin).padStart(2, '0')} AM`
      
      toast({
        title: "Invalid Time",
        description: `With a duration of ${durationMinutes} minutes, the meeting must start by ${maxTime12Hour} to end by 5:00 PM. Please select an earlier start time.`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log('Form submission started with data:', {
        title,
        date,
        time,
        duration: parseInt(duration),
        type: meetingType,
        meeting_link: meetingLink || undefined,
        agenda,
      })

      const result = await meetingsAPI.create({
        title,
        date,
        time,
        duration: parseInt(duration),
        type: meetingType,
        meeting_link: meetingLink || undefined,
        agenda,
      })

      console.log('API response:', result)
      setIsSubmitting(false)

      // Reset form
      setTitle("")
      setDate("")
      setTime("")
      setDuration("")
      setMeetingType("")
      setMeetingLink("")
      setAgenda("")

      toast({
        title: "Meeting Request Sent",
        description: "Your meeting request has been sent to your supervisor.",
      })

      // Close dialog immediately after successful submission
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Form submission error:', error)
      setIsSubmitting(false)
      toast({
        title: "Error",
        description: error.message || "Failed to schedule meeting. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="meeting-title">Meeting Title</Label>
          <Input
            id="meeting-title"
            placeholder="e.g., Progress Review"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="meeting-date">Preferred Date</Label>
            <Input 
              id="meeting-date" 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              min={new Date().toISOString().split('T')[0]}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting-time">Preferred Time</Label>
            <Input 
              id="meeting-time" 
              type="time" 
              value={time} 
              onChange={(e) => handleTimeChange(e.target.value)} 
              min="08:00"
              max={getMaxTime()}
              required 
            />
            <p className="text-xs text-muted-foreground">
              Available: 8:00 AM - 5:00 PM{duration ? ` (Latest start: ${(() => {
                const maxTime = getMaxTime()
                const [h, m] = maxTime.split(':')
                const hour = parseInt(h)
                const min = parseInt(m)
                if (hour === 17 && min === 0) return '5:00 PM'
                const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
                const ampm = hour >= 12 ? 'PM' : 'AM'
                return `${displayHour}:${String(min).padStart(2, '0')} ${ampm}`
              })()})` : ''}
            </p>
            {timeError && (
              <p className="text-xs text-destructive mt-1">{timeError}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meeting-duration">Duration</Label>
          <Select value={duration} onValueChange={handleDurationChange}>
            <SelectTrigger id="meeting-duration">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meeting-type">Meeting Type *</Label>
          <Select value={meetingType} onValueChange={setMeetingType}>
            <SelectTrigger id="meeting-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-person">In-Person</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {meetingType === "online" && (
          <div className="space-y-2">
            <Label htmlFor="meeting-link">Meeting Link (Optional)</Label>
            <Input
              id="meeting-link"
              type="url"
              placeholder="https://meet.google.com/xxx-xxxx-xxx or https://zoom.us/j/xxxxx"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Provide a link to join the online meeting (Google Meet, Zoom, Teams, etc.)
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="meeting-agenda">Agenda / Purpose *</Label>
          <Textarea
            id="meeting-agenda"
            placeholder="What would you like to discuss?"
            rows={4}
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            required
          />
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button 
            type="button" 
            variant="outline" 
            disabled={isSubmitting}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (onCancel) {
                onCancel()
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-accent text-accent-foreground hover:bg-accent/90" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Request"}
          </Button>
        </div>
      </form>
    </>
  )
}

function MeetingCard({
  title,
  date,
  time,
  location,
  supervisor,
  status,
  agenda,
  meetingLink,
  isToday = false,
  onViewDetails,
  onReschedule,
}: {
  title: string
  date: string
  time: string
  location: string
  supervisor: string
  status: string
  agenda: string
  meetingLink?: string
  isToday?: boolean
  onViewDetails?: () => void
  onReschedule?: () => void
}) {
  const statusConfig = {
    confirmed: { label: "Confirmed", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
    pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
  }

  const config = statusConfig[status as keyof typeof statusConfig]

  return (
    <Card className="p-5 border-l-4 border-l-accent">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <Badge className={config.color} variant="secondary">
              {config.label}
            </Badge>
            {isToday && <Badge className="bg-accent/20 text-accent border-accent/30">Live Soon</Badge>}
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              <span>{time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>{supervisor}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-muted/50 rounded-lg p-3 mb-3">
        <p className="text-sm text-foreground">
          <span className="font-medium">Agenda:</span> {agenda}
        </p>
      </div>
      <div className="flex gap-2">
        {meetingLink && (
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 bg-green-600 text-white hover:bg-green-700"
            onClick={() => window.open(meetingLink, "_blank")}
          >
            <VideoIcon className="mr-2 h-4 w-4" />
            Join Meeting
          </Button>
        )}
        <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={onViewDetails}>
          View Details
        </Button>
        <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={onReschedule}>
          Reschedule
        </Button>
      </div>
    </Card>
  )
}

function PastMeetingCard({
  title,
  date,
  time,
  duration,
  supervisor,
  hasRecording = false,
  recordingUrl,
}: {
  title: string
  date: string
  time: string
  duration: string
  supervisor: string
  hasRecording?: boolean
  recordingUrl?: string
}) {
  const handleWatchRecording = () => {
    if (recordingUrl) {
      window.open(recordingUrl, "_blank")
    }
  }

  return (
    <Card className="p-5 opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-foreground">{title}</h4>
            {hasRecording && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                <RecordingIcon className="mr-1 h-3 w-3" />
                Recorded
              </Badge>
            )}
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              <span>
                {time} ({duration})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>{supervisor}</span>
            </div>
          </div>
        </div>
        <CheckCircleIcon className="text-green-500" />
      </div>
      <div className="flex gap-2">
        {hasRecording && recordingUrl ? (
          <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={handleWatchRecording}>
            <PlayIcon className="mr-2 h-4 w-4" />
            Watch Recording
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="w-full bg-transparent" disabled>
            <FileTextIcon className="mr-2 h-4 w-4" />
            No Recording Available
          </Button>
        )}
      </div>
    </Card>
  )
}

function VideoIcon({ className }: { className?: string }) {
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
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
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
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  )
}

function RecordingIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  )
}

function FileTextIcon({ className }: { className?: string }) {
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
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  )
}

function MoreIcon() {
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
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
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

function ClockIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function MapPinIcon({ className }: { className?: string }) {
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
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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
