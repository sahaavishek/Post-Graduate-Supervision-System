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

export default function StudentMeetingsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  const generateWebexMeetingUrl = (meetingId: string) => {
    return `https://utmgradient.webex.com/meet/${meetingId}`
  }

  const handleJoinMeeting = (meetingId: string) => {
    const webexUrl = generateWebexMeetingUrl(meetingId)
    window.open(webexUrl, "_blank")
  }

  const handleStartMeeting = (title?: string) => {
    // Generate unique meeting ID
    const meetingId = `instant-${Date.now()}`
    const webexUrl = generateWebexMeetingUrl(meetingId)
    window.open(webexUrl, "_blank")
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
              <Link href="/student/meetings" className="text-sm font-medium text-foreground">
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
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <BellIcon />
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder.svg?key=yuxu3" alt="Student" />
              <AvatarFallback>ST</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
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
                <StartMeetingForm onStart={handleStartMeeting} />
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
                <MeetingRequestForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upcoming">Upcoming Meetings</TabsTrigger>
                <TabsTrigger value="history">Meeting History</TabsTrigger>
              </TabsList>

              {/* Upcoming Meetings Tab */}
              <TabsContent value="upcoming" className="mt-6">
                <div className="space-y-4">
                  <MeetingCard
                    title="Progress Review Meeting"
                    date="Tomorrow, Oct 29"
                    time="2:00 PM - 3:00 PM"
                    location="Room 3.14, Faculty of Computing"
                    supervisor="Dr. Sarah Johnson"
                    status="confirmed"
                    agenda="Discuss data collection progress and methodology refinements"
                    meetingLink="https://utmgradient.webex.com/meet/progress-review-oct29"
                    isToday={true}
                  />
                  <MeetingCard
                    title="Thesis Chapter Discussion"
                    date="Nov 5, 2025"
                    time="10:00 AM - 11:00 AM"
                    location="Online (Webex)"
                    supervisor="Dr. Sarah Johnson"
                    status="confirmed"
                    agenda="Review Chapter 3 draft and discuss feedback"
                    meetingLink="https://utmgradient.webex.com/meet/chapter-discussion-nov5"
                  />
                  <MeetingCard
                    title="Research Methodology Review"
                    date="Nov 12, 2025"
                    time="3:00 PM - 4:00 PM"
                    location="Room 2.08, Faculty of Computing"
                    supervisor="Dr. Sarah Johnson"
                    status="pending"
                    agenda="Finalize research methodology and timeline"
                  />
                </div>
              </TabsContent>

              {/* Meeting History Tab */}
              <TabsContent value="history" className="mt-6">
                <div className="space-y-4">
                  <PastMeetingCard
                    title="Weekly Progress Check"
                    date="Oct 21, 2025"
                    time="2:00 PM - 2:45 PM"
                    duration="45 min"
                    supervisor="Dr. Sarah Johnson"
                    notes="Discussed literature review progress. Action items: Complete Chapter 2 by next week."
                    recordingUrl="https://utmgradient.webex.com/recordingservice/sites/utmgradient/recording/playback/rec001"
                    hasRecording={true}
                  />
                  <PastMeetingCard
                    title="Proposal Defense Preparation"
                    date="Oct 14, 2025"
                    time="10:00 AM - 11:30 AM"
                    duration="1h 30min"
                    supervisor="Dr. Sarah Johnson"
                    notes="Reviewed presentation slides and practiced defense. Approved to proceed with defense."
                    recordingUrl="https://utmgradient.webex.com/recordingservice/sites/utmgradient/recording/playback/rec002"
                    hasRecording={true}
                  />
                  <PastMeetingCard
                    title="Initial Consultation"
                    date="Oct 7, 2025"
                    time="3:00 PM - 4:00 PM"
                    duration="1h"
                    supervisor="Dr. Sarah Johnson"
                    notes="Discussed research direction and potential topics. Agreed on AI in healthcare focus."
                    hasRecording={false}
                  />
                  <PastMeetingCard
                    title="Research Topic Discussion"
                    date="Sep 30, 2025"
                    time="2:00 PM - 3:00 PM"
                    duration="1h"
                    supervisor="Dr. Sarah Johnson"
                    notes="Explored various research areas. Narrowed down to three potential topics."
                    recordingUrl="https://utmgradient.webex.com/recordingservice/sites/utmgradient/recording/playback/rec003"
                    hasRecording={true}
                  />
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">This Month</span>
                  <span className="text-2xl font-bold text-foreground">4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Meetings</span>
                  <span className="text-2xl font-bold text-foreground">18</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Duration</span>
                  <span className="text-2xl font-bold text-foreground">52m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Recordings</span>
                  <span className="text-2xl font-bold text-foreground">15</span>
                </div>
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
      </main>
    </div>
  )
}

function JoinMeetingForm({ onJoin }: { onJoin: (meetingId: string) => void }) {
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)

  const handleJoin = () => {
    // Meeting ID for the active meeting
    const meetingId = "progress-review-oct29"
    onJoin(meetingId)
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Active Meeting Available</h4>
        <p className="text-sm text-green-700 dark:text-green-300 mb-3">
          Your supervisor has started a meeting. Click below to join via Webex.
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Meeting:</span>
            <span className="font-medium">Progress Review Meeting</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Supervisor:</span>
            <span className="font-medium">Dr. Sarah Johnson</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Started:</span>
            <span className="font-medium">5 minutes ago</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Platform:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">Cisco Webex</span>
          </div>
        </div>
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
        <Button type="button" className="bg-green-600 text-white hover:bg-green-700" onClick={handleJoin}>
          <VideoIcon className="mr-2 h-4 w-4" />
          Join on Webex
        </Button>
      </div>
    </div>
  )
}

function StartMeetingForm({ onStart }: { onStart: (title?: string) => void }) {
  const [title, setTitle] = useState("")
  const [purpose, setPurpose] = useState("")
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)
  const [recordingEnabled, setRecordingEnabled] = useState(false)

  const handleStart = () => {
    onStart(title || "Instant Meeting")
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Start Instant Meeting</h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Create an instant Webex meeting with your supervisor. They will receive a notification to join.
        </p>
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
        <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleStart}>
          <PlayIcon className="mr-2 h-4 w-4" />
          Start on Webex
        </Button>
      </div>
    </div>
  )
}

function MeetingRequestForm() {
  return (
    <form className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="meeting-title">Meeting Title</Label>
        <Input id="meeting-title" placeholder="e.g., Progress Review" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="meeting-date">Preferred Date</Label>
          <Input id="meeting-date" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meeting-time">Preferred Time</Label>
          <Input id="meeting-time" type="time" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meeting-duration">Duration</Label>
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
        <Label htmlFor="meeting-type">Meeting Type</Label>
        <Select>
          <SelectTrigger id="meeting-type">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in-person">In-Person</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meeting-agenda">Agenda / Purpose</Label>
        <Textarea id="meeting-agenda" placeholder="What would you like to discuss?" rows={4} />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
          Send Request
        </Button>
      </div>
    </form>
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
        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
          View Details
        </Button>
        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
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
  notes,
  hasRecording = false,
  recordingUrl,
}: {
  title: string
  date: string
  time: string
  duration: string
  supervisor: string
  notes: string
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
      <div className="bg-muted/50 rounded-lg p-3 mb-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Notes:</span> {notes}
        </p>
      </div>
      <div className="flex gap-2">
        {hasRecording && recordingUrl ? (
          <>
            <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={handleWatchRecording}>
              <PlayIcon className="mr-2 h-4 w-4" />
              Watch Recording
            </Button>
            <Button variant="outline" size="sm" className="flex-1 bg-transparent">
              <FileTextIcon className="mr-2 h-4 w-4" />
              View Notes
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" className="w-full bg-transparent">
            <FileTextIcon className="mr-2 h-4 w-4" />
            View Full Notes
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
