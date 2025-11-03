"use client"

import { useState } from "react"
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

export default function SupervisorMeetingsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  const generateWebexMeetingUrl = (meetingId: string) => {
    return `https://utmgradient.webex.com/meet/${meetingId}`
  }

  const handleJoinMeeting = (meetingId: string) => {
    const webexUrl = generateWebexMeetingUrl(meetingId)
    window.open(webexUrl, "_blank")
  }

  const handleStartMeeting = (title?: string, studentId?: string) => {
    const meetingId = `supervisor-${Date.now()}`
    const webexUrl = generateWebexMeetingUrl(meetingId)
    window.open(webexUrl, "_blank")
  }

  // Mock student data for selection
  const students = [
    { id: "1", name: "Ahmad Ibrahim", avatar: "/placeholder.svg?key=st01" },
    { id: "2", name: "Fatimah Hassan", avatar: "/placeholder.svg?key=st02" },
    { id: "3", name: "Muhammad Ali", avatar: "/placeholder.svg?key=st03" },
    { id: "4", name: "Aisha Rahman", avatar: "/placeholder.svg?key=st04" },
  ]

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
              <Link href="/supervisor/meetings" className="text-sm font-medium text-foreground">
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

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Meetings</h2>
            <p className="text-muted-foreground">Manage your supervision meetings and schedule</p>
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
                  <DialogTitle>Join Student Meeting</DialogTitle>
                </DialogHeader>
                <JoinMeetingForm onJoin={handleJoinMeeting} students={students} />
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <PlayIcon className="mr-2 h-4 w-4" />
                  Start Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Start Instant Meeting</DialogTitle>
                </DialogHeader>
                <StartMeetingForm onStart={handleStartMeeting} students={students} />
              </DialogContent>
            </Dialog>

            <Dialog>
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
                <ScheduleMeetingForm students={students} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="requests">Requests (3)</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4 mt-6">
                <SupervisorMeetingCard
                  student="Ahmad Ibrahim"
                  title="Progress Review Meeting"
                  date="Today, Oct 28"
                  time="3:00 PM - 4:00 PM"
                  location="Room 3.14, Faculty of Computing"
                  status="confirmed"
                  agenda="Discuss data collection progress and methodology refinements"
                  avatar="/placeholder.svg?key=st01"
                />
                <SupervisorMeetingCard
                  student="Fatimah Hassan"
                  title="Methodology Discussion"
                  date="Tomorrow, Oct 29"
                  time="10:00 AM - 10:45 AM"
                  location="Online (Google Meet)"
                  status="confirmed"
                  agenda="Review methodology section and address concerns"
                  avatar="/placeholder.svg?key=st02"
                />
                <SupervisorMeetingCard
                  student="Muhammad Ali"
                  title="Catch-up Meeting"
                  date="Oct 30, 2025"
                  time="2:00 PM - 3:00 PM"
                  location="Room 2.08, Faculty of Computing"
                  status="confirmed"
                  agenda="Address delays and create action plan"
                  avatar="/placeholder.svg?key=st03"
                />
                <SupervisorMeetingCard
                  student="Aisha Rahman"
                  title="Final Defense Preparation"
                  date="Nov 2, 2025"
                  time="11:00 AM - 12:30 PM"
                  location="Room 3.14, Faculty of Computing"
                  status="confirmed"
                  agenda="Review final thesis and prepare for defense"
                  avatar="/placeholder.svg?key=st04"
                />
              </TabsContent>

              <TabsContent value="requests" className="space-y-4 mt-6">
                <MeetingRequestCard
                  student="Ahmad Ibrahim"
                  title="Urgent: Data Analysis Help"
                  requestedDate="Nov 1, 2025"
                  requestedTime="2:00 PM"
                  duration="1 hour"
                  reason="Need guidance on statistical analysis methods for research data"
                  avatar="/placeholder.svg?key=st01"
                />
                <MeetingRequestCard
                  student="Fatimah Hassan"
                  title="Chapter Review"
                  requestedDate="Nov 3, 2025"
                  requestedTime="10:00 AM"
                  duration="45 minutes"
                  reason="Discuss feedback on Chapter 4 and next steps"
                  avatar="/placeholder.svg?key=st02"
                />
                <MeetingRequestCard
                  student="Muhammad Ali"
                  title="Research Direction Discussion"
                  requestedDate="Nov 5, 2025"
                  requestedTime="3:00 PM"
                  duration="1 hour"
                  reason="Need to discuss potential pivot in research direction"
                  avatar="/placeholder.svg?key=st03"
                />
              </TabsContent>

              <TabsContent value="past" className="space-y-4 mt-6">
                <PastSupervisorMeetingCard
                  student="Ahmad Ibrahim"
                  title="Weekly Progress Check"
                  date="Oct 21, 2025"
                  time="2:00 PM - 2:45 PM"
                  notes="Student making good progress on data collection. Discussed timeline adjustments."
                  avatar="/placeholder.svg?key=st01"
                />
                <PastSupervisorMeetingCard
                  student="Aisha Rahman"
                  title="Thesis Chapter Review"
                  date="Oct 20, 2025"
                  time="11:00 AM - 12:00 PM"
                  notes="Reviewed Chapter 5. Minor revisions needed. Approved for final defense preparation."
                  avatar="/placeholder.svg?key=st04"
                />
                <PastSupervisorMeetingCard
                  student="Fatimah Hassan"
                  title="Methodology Consultation"
                  date="Oct 15, 2025"
                  time="10:00 AM - 11:00 AM"
                  notes="Discussed research methodology. Suggested additional literature sources."
                  avatar="/placeholder.svg?key=st02"
                />
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

            {/* Today's Schedule */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Today's Schedule</h3>
              <div className="space-y-3">
                <ScheduleItem time="3:00 PM" student="Ahmad Ibrahim" type="Progress Review" />
                <ScheduleItem time="4:30 PM" student="Office Hours" type="Available" />
              </div>
            </Card>

            {/* Meeting Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">This Week</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Meetings</span>
                  <span className="text-2xl font-bold text-foreground">6</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending Requests</span>
                  <span className="text-2xl font-bold text-foreground">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hours Scheduled</span>
                  <span className="text-2xl font-bold text-foreground">7.5</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function JoinMeetingForm({
  onJoin,
  students,
}: {
  onJoin: (meetingId: string) => void
  students: Array<{ id: string; name: string; avatar: string }>
}) {
  const [selectedStudent, setSelectedStudent] = useState("")
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)

  const handleJoin = () => {
    const meetingId = "active-meeting-" + selectedStudent
    onJoin(meetingId)
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Join Active Meeting</h4>
        <p className="text-sm text-green-700 dark:text-green-300">
          Select a student to join their active Webex meeting.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="student-select">Select Student</Label>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger id="student-select">
            <SelectValue placeholder="Choose a student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="camera"
            className="rounded"
            checked={cameraEnabled}
            onChange={(e) => setCameraEnabled(e.target.checked)}
          />
          <Label htmlFor="camera" className="text-sm">
            Enable camera
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="microphone"
            className="rounded"
            checked={micEnabled}
            onChange={(e) => setMicEnabled(e.target.checked)}
          />
          <Label htmlFor="microphone" className="text-sm">
            Enable microphone
          </Label>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button
          type="button"
          className="bg-green-600 text-white hover:bg-green-700"
          onClick={handleJoin}
          disabled={!selectedStudent}
        >
          <VideoIcon className="mr-2 h-4 w-4" />
          Join on Webex
        </Button>
      </div>
    </div>
  )
}

function StartMeetingForm({
  onStart,
  students,
}: {
  onStart: (title?: string, studentId?: string) => void
  students: Array<{ id: string; name: string; avatar: string }>
}) {
  const [selectedStudent, setSelectedStudent] = useState("")
  const [title, setTitle] = useState("")
  const [purpose, setPurpose] = useState("")
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)
  const [recordingEnabled, setRecordingEnabled] = useState(false)

  const handleStart = () => {
    onStart(title || "Instant Meeting", selectedStudent)
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Start Instant Meeting</h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Create an instant Webex meeting with a student. They will receive a notification to join.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="student-select-start">Select Student</Label>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger id="student-select-start">
            <SelectValue placeholder="Choose a student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instant-title">Meeting Title (Optional)</Label>
        <Input
          id="instant-title"
          placeholder="e.g., Quick Discussion"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instant-purpose">Purpose (Optional)</Label>
        <Textarea
          id="instant-purpose"
          placeholder="Brief description of what you'd like to discuss"
          rows={3}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="instant-camera"
            className="rounded"
            checked={cameraEnabled}
            onChange={(e) => setCameraEnabled(e.target.checked)}
          />
          <Label htmlFor="instant-camera" className="text-sm">
            Enable camera
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="instant-microphone"
            className="rounded"
            checked={micEnabled}
            onChange={(e) => setMicEnabled(e.target.checked)}
          />
          <Label htmlFor="instant-microphone" className="text-sm">
            Enable microphone
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="instant-recording"
            className="rounded"
            checked={recordingEnabled}
            onChange={(e) => setRecordingEnabled(e.target.checked)}
          />
          <Label htmlFor="instant-recording" className="text-sm">
            Record meeting
          </Label>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button
          type="button"
          className="bg-blue-600 text-white hover:bg-blue-700"
          onClick={handleStart}
          disabled={!selectedStudent}
        >
          <PlayIcon className="mr-2 h-4 w-4" />
          Start on Webex
        </Button>
      </div>
    </div>
  )
}

function ScheduleMeetingForm({ students }: { students: Array<{ id: string; name: string; avatar: string }> }) {
  const [selectedStudent, setSelectedStudent] = useState("")

  return (
    <form className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="student-select-schedule">Select Student *</Label>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger id="student-select-schedule">
            <SelectValue placeholder="Choose a student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meeting-title">Meeting Title *</Label>
        <Input id="meeting-title" placeholder="e.g., Progress Review" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="meeting-date">Date *</Label>
          <Input id="meeting-date" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meeting-time">Time *</Label>
          <Input id="meeting-time" type="time" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meeting-duration">Duration *</Label>
        <Select>
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
        <Select>
          <SelectTrigger id="meeting-type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in-person">In-Person</SelectItem>
            <SelectItem value="online">Online (Webex)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meeting-location">Location</Label>
        <Input id="meeting-location" placeholder="e.g., Room 3.14 or leave blank for Webex" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="meeting-agenda">Agenda / Purpose *</Label>
        <Textarea id="meeting-agenda" placeholder="What would you like to discuss?" rows={4} required />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={!selectedStudent}
        >
          Schedule Meeting
        </Button>
      </div>
    </form>
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

function MessageSquareIcon({ className }: { className?: string }) {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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

function CheckIcon({ className }: { className?: string }) {
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function SupervisorMeetingCard({
  student,
  title,
  date,
  time,
  location,
  status,
  agenda,
  avatar,
}: {
  student: string
  title: string
  date: string
  time: string
  location: string
  status: string
  agenda: string
  avatar: string
}) {
  return (
    <Card className="p-5 border-l-4 border-l-accent">
      <div className="flex items-start gap-4 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar || "/placeholder.svg"} alt={student} />
          <AvatarFallback>
            {student
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground">{student}</h4>
            <Badge className="bg-green-500/10 text-green-700 dark:text-green-400" variant="secondary">
              Confirmed
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
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
          </div>
        </div>
      </div>
      <div className="bg-muted/50 rounded-lg p-3 mb-3">
        <p className="text-sm text-foreground">
          <span className="font-medium">Agenda:</span> {agenda}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
          View Details
        </Button>
        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
          Reschedule
        </Button>
        <Button variant="outline" size="sm">
          <MessageSquareIcon className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

function MeetingRequestCard({
  student,
  title,
  requestedDate,
  requestedTime,
  duration,
  reason,
  avatar,
}: {
  student: string
  title: string
  requestedDate: string
  requestedTime: string
  duration: string
  reason: string
  avatar: string
}) {
  return (
    <Card className="p-5 border-l-4 border-l-yellow-500">
      <div className="flex items-start gap-4 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar || "/placeholder.svg"} alt={student} />
          <AvatarFallback>
            {student
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground">{student}</h4>
            <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" variant="secondary">
              Pending
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>Requested: {requestedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              <span>
                {requestedTime} ({duration})
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-muted/50 rounded-lg p-3 mb-3">
        <p className="text-sm text-foreground">
          <span className="font-medium">Reason:</span> {reason}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
          <CheckIcon className="mr-1 h-4 w-4" />
          Approve
        </Button>
        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
          Suggest Time
        </Button>
        <Button variant="outline" size="sm">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

function PastSupervisorMeetingCard({
  student,
  title,
  date,
  time,
  notes,
  avatar,
}: {
  student: string
  title: string
  date: string
  time: string
  notes: string
  avatar: string
}) {
  return (
    <Card className="p-5 opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex items-start gap-4 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar || "/placeholder.svg"} alt={student} />
          <AvatarFallback>
            {student
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-1">{student}</h4>
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              <span>{time}</span>
            </div>
          </div>
        </div>
        <CheckCircleIcon className="text-green-500" />
      </div>
      <div className="bg-muted/50 rounded-lg p-3 mb-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Notes:</span> {notes}
        </p>
      </div>
      <Button variant="outline" size="sm" className="w-full bg-transparent">
        View Full Notes
      </Button>
    </Card>
  )
}

function ScheduleItem({ time, student, type }: { time: string; student: string; type: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
      <div className="text-sm font-semibold text-accent">{time}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{student}</p>
        <p className="text-xs text-muted-foreground">{type}</p>
      </div>
    </div>
  )
}
