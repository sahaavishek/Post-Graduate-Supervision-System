"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function StudentDocumentsPage() {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // Mock data for documents and weekly submissions
  const supervisorDocuments = [
    {
      id: 1,
      title: "Thesis Information",
      type: "PDF",
      uploadedDate: "2025-01-15",
      url: "#",
    },
    {
      id: 2,
      title: "Research Guidelines",
      type: "PDF",
      uploadedDate: "2025-01-10",
      url: "#",
    },
  ]

  const weeklySubmissions = [
    {
      week: 1,
      title: "Project Area and Faculty Supervisor Expert Briefing",
      description: "Final Year Project 1 Briefing Project Area and Faculty Supervisor Expert Briefing",
      dueDate: "2025-10-30",
      uploadDate: "2025-09-15",
      status: "submitted",
      submittedFile: "Week1_Briefing.pdf",
      comments: "Good start",
      taskStatus: "CLOSED",
    },
    {
      week: 2,
      title: "Project Planning",
      description: "• Project Planning\n• How to complete project proposal form\n• Project Proposal Interview",
      dueDate: "2025-11-06",
      uploadDate: "2025-09-22",
      status: "submitted",
      submittedFile: "Proposal_draft.pdf",
      comments: "Excellent work",
      taskStatus: "CLOSED",
    },
    {
      week: 3,
      title: "Introduction",
      description:
        "• Problem statement\n• Project Objective, Scope, Justification\n• Log Book\n• Project Discussion and Supervisory Meeting starts",
      dueDate: "2025-11-13",
      uploadDate: "2025-09-29",
      status: "pending",
      submittedFile: null,
      comments: null,
      taskStatus: "OPEN",
    },
    {
      week: 4,
      title: "Literature Review",
      description: "• Research methodology\n• Literature review techniques\n• Citation and referencing",
      dueDate: "2025-11-20",
      uploadDate: "2025-10-06",
      status: "pending",
      submittedFile: null,
      comments: null,
      taskStatus: "OPEN",
    },
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  const handleSubmit = (weekNumber: number) => {
    // Handle submission logic here
    console.log(`Submitting for week ${weekNumber}`)
    setSelectedWeek(null)
    setUploadFile(null)
  }

  return (
    <div className="min-h-screen bg-background">
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
              <Link href="/student/documents" className="text-sm font-medium text-foreground">
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
              <AvatarImage src="/diverse-students-studying.png" alt="Student" />
              <AvatarFallback>ST</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Documents</h2>
          <p className="text-muted-foreground">Manage your submissions and supervisor documents</p>
        </div>

        {/* Supervisor Documents Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Supervisor Documents</CardTitle>
            <CardDescription>Documents and resources shared by your supervisor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {supervisorDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-destructive/10 rounded flex items-center justify-center">
                      <FileTextIcon className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">Uploaded: {doc.uploadedDate}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{doc.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Submissions Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Weekly Progress Submissions</h2>

          {weeklySubmissions.map((submission) => (
            <Card key={submission.week} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">Week {submission.week}</CardTitle>
                      <Badge variant={submission.taskStatus === "OPEN" ? "default" : "secondary"}>
                        {submission.taskStatus}
                      </Badge>
                      <Badge variant={submission.status === "submitted" ? "default" : "outline"}>
                        {submission.status === "submitted" ? "Submitted" : "Pending"}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm font-medium text-foreground">
                      {submission.title}
                    </CardDescription>
                  </div>
                  {submission.status === "pending" && (
                    <Dialog
                      open={selectedWeek === submission.week}
                      onOpenChange={(open) => !open && setSelectedWeek(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => setSelectedWeek(submission.week)}
                        >
                          Add Submission
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Submit Work - Week {submission.week}</DialogTitle>
                          <DialogDescription>{submission.title}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Upload Date</p>
                              <p className="font-medium">{submission.uploadDate}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Due Date</p>
                              <p className="font-medium text-destructive">{submission.dueDate}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Task Status</p>
                              <p className="font-medium">{submission.taskStatus}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">File Format</p>
                              <p className="font-medium">PDF, DOCX</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="file-upload">Upload File</Label>
                            <Input
                              id="file-upload"
                              type="file"
                              accept=".pdf,.docx"
                              onChange={handleFileUpload}
                              className="cursor-pointer"
                            />
                            {uploadFile && <p className="text-sm text-muted-foreground">Selected: {uploadFile.name}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="comments">Submission Comments (Optional)</Label>
                            <Textarea id="comments" placeholder="Add any comments about your submission..." rows={3} />
                          </div>

                          <Button
                            className="w-full"
                            onClick={() => handleSubmit(submission.week)}
                            disabled={!uploadFile}
                          >
                            Submit Work
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {/* Description */}
                  <div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{submission.description}</p>
                  </div>

                  {/* Submission Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Upload Date</p>
                      <p className="font-medium">{submission.uploadDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p className="font-medium text-destructive">{submission.dueDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Task Status</p>
                      <p className="font-medium">{submission.taskStatus}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">File Format</p>
                      <p className="font-medium">PDF, DOCX</p>
                    </div>
                  </div>

                  {/* Submission Status */}
                  {submission.status === "submitted" && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold mb-3">Submission Status</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Submission Status:</span>
                          <Badge variant="default">Submitted</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">File Submission:</span>
                          <a href="#" className="text-sm text-destructive hover:underline flex items-center gap-1">
                            <FileTextIcon className="h-4 w-4" />
                            {submission.submittedFile}
                          </a>
                        </div>
                        {submission.comments && (
                          <div className="flex items-start justify-between">
                            <span className="text-sm text-muted-foreground">Submission Comments:</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{submission.comments}</Badge>
                              <Button variant="ghost" size="sm" className="h-7 text-xs">
                                Edit
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pending Submission Alert */}
                  {submission.status === "pending" && (
                    <Alert>
                      <AlertDescription>
                        No submission yet. Please upload your work before the due date: {submission.dueDate}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
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

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  )
}
