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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function SupervisorDocumentsPage() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState<string>("general")

  // Mock data for supervised students
  const students = [
    {
      id: "1",
      name: "Sarah Johnson",
      program: "PhD Computer Science",
      avatar: "/diverse-students-studying.png",
      progress: 65,
    },
    {
      id: "2",
      name: "Michael Chen",
      program: "MSc Data Science",
      avatar: "/diverse-students-studying.png",
      progress: 45,
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      program: "PhD Software Engineering",
      avatar: "/diverse-students-studying.png",
      progress: 80,
    },
    {
      id: "4",
      name: "David Kim",
      program: "MSc Artificial Intelligence",
      avatar: "/diverse-students-studying.png",
      progress: 55,
    },
  ]

  // Mock data for uploaded documents per student
  const studentDocuments: Record<string, any[]> = {
    "1": [
      {
        id: 1,
        title: "Thesis Guidelines",
        week: "general",
        type: "PDF",
        uploadedDate: "2025-01-15",
        size: "2.4 MB",
      },
      {
        id: 2,
        title: "Week 1 - Research Methodology",
        week: "1",
        type: "PDF",
        uploadedDate: "2025-01-20",
        size: "1.8 MB",
      },
    ],
    "2": [
      {
        id: 3,
        title: "Project Guidelines",
        week: "general",
        type: "PDF",
        uploadedDate: "2025-01-12",
        size: "1.5 MB",
      },
    ],
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  const handleUploadSubmit = () => {
    console.log("[v0] Uploading document for student:", selectedStudent)
    setUploadDialogOpen(false)
    setUploadFile(null)
    setSelectedWeek("general")
  }

  const getStudentDocuments = (studentId: string) => {
    return studentDocuments[studentId] || []
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
              <Link href="/supervisor/documents" className="text-sm font-medium text-foreground">
                Documents
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <BellIcon />
            </Button>
            <Avatar>
              <AvatarImage src="/diverse-professor-lecturing.png" alt="Supervisor" />
              <AvatarFallback>SV</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Document Management</h2>
          <p className="text-muted-foreground">Upload and manage documents for your supervised students</p>
        </div>

        {/* Students List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Selection Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Supervised Students</CardTitle>
                <CardDescription>Select a student to manage their documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student.id)}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      selectedStudent === student.id
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                        <AvatarFallback>
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{student.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{student.program}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{student.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-accent h-1.5 rounded-full transition-all"
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Document Management Area */}
          <div className="lg:col-span-2">
            {selectedStudent ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Documents for {students.find((s) => s.id === selectedStudent)?.name}</CardTitle>
                      <CardDescription>{students.find((s) => s.id === selectedStudent)?.program}</CardDescription>
                    </div>
                    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-accent hover:bg-accent/90">
                          <UploadIcon className="h-4 w-4 mr-2" />
                          Upload Document
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Upload Document</DialogTitle>
                          <DialogDescription>
                            Upload a document for {students.find((s) => s.id === selectedStudent)?.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="document-title">Document Title</Label>
                            <Input id="document-title" placeholder="e.g., Research Guidelines, Week 1 Materials" />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="week-select">Assign to Week (Optional)</Label>
                            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                              <SelectTrigger id="week-select">
                                <SelectValue placeholder="Select week" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General Resources</SelectItem>
                                {Array.from({ length: 16 }, (_, i) => i + 1).map((week) => (
                                  <SelectItem key={week} value={week.toString()}>
                                    Week {week}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="file-upload">Upload File</Label>
                            <Input
                              id="file-upload"
                              type="file"
                              accept=".pdf,.docx,.pptx,.xlsx"
                              onChange={handleFileUpload}
                              className="cursor-pointer"
                            />
                            {uploadFile && <p className="text-sm text-muted-foreground">Selected: {uploadFile.name}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                              id="description"
                              placeholder="Add any notes or instructions about this document..."
                              rows={3}
                            />
                          </div>

                          <Button className="w-full" onClick={handleUploadSubmit} disabled={!uploadFile}>
                            Upload Document
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all">All Documents</TabsTrigger>
                      <TabsTrigger value="general">General</TabsTrigger>
                      <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="space-y-3 mt-4">
                      {getStudentDocuments(selectedStudent).length > 0 ? (
                        getStudentDocuments(selectedStudent).map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 bg-destructive/10 rounded flex items-center justify-center">
                                <FileTextIcon className="h-5 w-5 text-destructive" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{doc.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-muted-foreground">Uploaded: {doc.uploadedDate}</p>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <p className="text-xs text-muted-foreground">{doc.size}</p>
                                  {doc.week !== "general" && (
                                    <>
                                      <span className="text-xs text-muted-foreground">•</span>
                                      <Badge variant="outline" className="text-xs">
                                        Week {doc.week}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{doc.type}</Badge>
                              <Button variant="ghost" size="sm">
                                <TrashIcon className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <FileTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No documents uploaded yet</p>
                          <p className="text-sm">Click "Upload Document" to add resources for this student</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="general" className="space-y-3 mt-4">
                      {getStudentDocuments(selectedStudent).filter((doc) => doc.week === "general").length > 0 ? (
                        getStudentDocuments(selectedStudent)
                          .filter((doc) => doc.week === "general")
                          .map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 bg-destructive/10 rounded flex items-center justify-center">
                                  <FileTextIcon className="h-5 w-5 text-destructive" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{doc.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-muted-foreground">Uploaded: {doc.uploadedDate}</p>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <p className="text-xs text-muted-foreground">{doc.size}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{doc.type}</Badge>
                                <Button variant="ghost" size="sm">
                                  <TrashIcon className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>No general documents uploaded</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="weekly" className="space-y-3 mt-4">
                      {getStudentDocuments(selectedStudent).filter((doc) => doc.week !== "general").length > 0 ? (
                        getStudentDocuments(selectedStudent)
                          .filter((doc) => doc.week !== "general")
                          .map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 bg-destructive/10 rounded flex items-center justify-center">
                                  <FileTextIcon className="h-5 w-5 text-destructive" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{doc.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-muted-foreground">Uploaded: {doc.uploadedDate}</p>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <p className="text-xs text-muted-foreground">{doc.size}</p>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <Badge variant="outline" className="text-xs">
                                      Week {doc.week}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{doc.type}</Badge>
                                <Button variant="ghost" size="sm">
                                  <TrashIcon className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>No weekly documents uploaded</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <UsersIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Select a Student</h3>
                  <p className="text-muted-foreground">
                    Choose a student from the list to view and manage their documents
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
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

function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  )
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
