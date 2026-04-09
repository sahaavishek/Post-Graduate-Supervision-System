"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, Send, X, Minimize2, Maximize2, ExternalLink } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { chatbotAPI } from "@/lib/api"

interface ChatbotProps {
  role: "student" | "supervisor" | "administrator"
  className?: string
}

interface Message {
  type: "user" | "bot"
  text: string
  timestamp: Date
  links?: Array<{ text: string; url: string }>
}

// Map queries to page URLs based on role
const getPageLinks = (role: string, query: string): Array<{ text: string; url: string }> => {
  const lowerQuery = query.toLowerCase()
  const links: Array<{ text: string; url: string }> = []
  
  if (role === "student") {
    // Documents related
    if (lowerQuery.includes("upload") || lowerQuery.includes("submit") || lowerQuery.includes("document") || 
        lowerQuery.includes("download") || lowerQuery.includes("file") || lowerQuery.includes("weekly") || 
        lowerQuery.includes("submission")) {
      links.push({ text: "📄 Go to Documents Page", url: "/student/documents" })
    }
    
    // Meetings related
    if (lowerQuery.includes("meeting") || lowerQuery.includes("schedule") || lowerQuery.includes("book")) {
      links.push({ text: "📅 Go to Meetings Page", url: "/student/meetings" })
    }
    
    // Progress related
    if (lowerQuery.includes("progress") || lowerQuery.includes("milestone") || lowerQuery.includes("log progress") || 
        lowerQuery.includes("update progress") || lowerQuery.includes("view progress")) {
      links.push({ text: "📊 Go to Progress Page", url: "/student/progress" })
    }
    
    // Messages/Supervisor contact
    if (lowerQuery.includes("message") || lowerQuery.includes("contact") || lowerQuery.includes("supervisor")) {
      links.push({ text: "💬 Go to Dashboard (Messages)", url: "/student/dashboard" })
    }
    
    // Dashboard/Home
    if (lowerQuery.includes("dashboard") || lowerQuery.includes("home") || lowerQuery.includes("deadline") || 
        lowerQuery.includes("notification")) {
      links.push({ text: "🏠 Go to Dashboard", url: "/student/dashboard" })
    }
    
    // Profile/Settings
    if (lowerQuery.includes("profile") || lowerQuery.includes("settings") || lowerQuery.includes("password")) {
      links.push({ text: "⚙️ Go to Profile", url: "/student/profile" })
    }
  } else if (role === "supervisor") {
    // Students management
    if (lowerQuery.includes("student") || lowerQuery.includes("view student") || lowerQuery.includes("add student") || 
        lowerQuery.includes("my students") || lowerQuery.includes("assign student")) {
      links.push({ text: "👥 Go to Students Page", url: "/supervisor/students" })
    }
    
    // Documents/Review
    if (lowerQuery.includes("upload") || lowerQuery.includes("document") || lowerQuery.includes("review") || 
        lowerQuery.includes("submission") || lowerQuery.includes("approve") || lowerQuery.includes("feedback") || 
        lowerQuery.includes("resource")) {
      links.push({ text: "📄 Go to Documents Page", url: "/supervisor/documents" })
    }
    
    // Meetings
    if (lowerQuery.includes("meeting") || lowerQuery.includes("schedule")) {
      links.push({ text: "📅 Go to Meetings Page", url: "/supervisor/meetings" })
    }
    
    // Progress tracking
    if (lowerQuery.includes("progress") || lowerQuery.includes("view progress") || lowerQuery.includes("student progress")) {
      links.push({ text: "📊 View Student Progress", url: "/supervisor/students" })
    }
    
    // Messages
    if (lowerQuery.includes("message") || lowerQuery.includes("contact")) {
      links.push({ text: "💬 Go to Students Page (Messages)", url: "/supervisor/students" })
    }
    
    // Dashboard
    if (lowerQuery.includes("dashboard") || lowerQuery.includes("announcement")) {
      links.push({ text: "🏠 Go to Dashboard", url: "/supervisor/dashboard" })
    }
  } else if (role === "administrator") {
    // Users management
    if (lowerQuery.includes("user") || lowerQuery.includes("add user") || lowerQuery.includes("create user") || 
        lowerQuery.includes("deactivate") || lowerQuery.includes("activate") || lowerQuery.includes("suspend") || 
        lowerQuery.includes("view users") || lowerQuery.includes("all users")) {
      links.push({ text: "👥 Go to Users Page", url: "/admin/users" })
    }
    
    // Reports/Analytics
    if (lowerQuery.includes("report") || lowerQuery.includes("analytics") || lowerQuery.includes("statistics") || 
        lowerQuery.includes("generate report") || lowerQuery.includes("view reports")) {
      links.push({ text: "📊 Go to Reports Page", url: "/admin/reports" })
    }
    
    // Dashboard/System management
    if (lowerQuery.includes("dashboard") || lowerQuery.includes("manage") || lowerQuery.includes("system")) {
      links.push({ text: "🏠 Go to Dashboard", url: "/admin/dashboard" })
    }
  }
  
  // If no specific links found but query seems actionable, provide dashboard link
  if (links.length === 0 && (lowerQuery.includes("how") || lowerQuery.includes("where") || lowerQuery.includes("can i"))) {
    if (role === "student") {
      links.push({ text: "🏠 Go to Dashboard", url: "/student/dashboard" })
    } else if (role === "supervisor") {
      links.push({ text: "🏠 Go to Dashboard", url: "/supervisor/dashboard" })
    } else {
      links.push({ text: "🏠 Go to Dashboard", url: "/admin/dashboard" })
    }
  }
  
  return links
}

// Role-specific FAQ responses with comprehensive keyword matching
const getFAQResponses = (role: string) => {
  const commonResponses: { [key: string]: string } = {
    "hello": "Hello! How can I help you today?",
    "hi": "Hi there! What would you like to know about UTMGradient Portal?",
    "hey": "Hey! How can I assist you?",
    "help": "I can help you with questions about using the platform. Try asking about uploading documents, scheduling meetings, or viewing your progress.",
    "thanks": "You're welcome! Is there anything else I can help you with?",
    "thank you": "You're welcome! Feel free to ask if you need anything else.",
    "bye": "Goodbye! Feel free to come back if you need any help.",
    "goodbye": "See you later! Don't hesitate to ask if you have questions.",
  }

  if (role === "student") {
    return {
      ...commonResponses,
      // Upload related
      "upload": "To upload a document, navigate to the Documents section from the sidebar, then click the 'Upload Document' button. Fill in the required information (title, description, week number for weekly submissions) and select your file.",
      "how do i upload": "You can upload documents by going to the 'Documents' page in the sidebar and clicking the 'Upload Document' button. Select your file, add a title and description, and choose the week number if it's a weekly submission.",
      "how to upload": "Go to the Documents page and click 'Upload Document'. You can upload PDFs, Word documents, and other file types. Make sure to select the correct week number for weekly submissions.",
      "upload document": "Navigate to Documents page → Click 'Upload Document' → Select file → Add title and description → Choose week number (if applicable) → Submit.",
      "upload file": "Go to the Documents page, click 'Upload Document', select your file, fill in the details, and submit. Your supervisor will be notified.",
      "submit document": "To submit a document, go to the Documents page, click 'Upload Document', select your file, add details, and submit.",
      "how to submit": "You can submit documents through the Documents page. Click 'Upload Document', select your file, add a title and description, and submit.",
      
      // Download related
      "download": "To download documents, go to the Documents page. You'll see a 'Download PDF' button next to each document. Click it to download the file to your device.",
      "how do i download": "Go to the Documents page, find the document you want, and click the 'Download PDF' button. The file will be downloaded to your device.",
      "how to download": "In the Documents page, locate the document you need and click the 'Download PDF' button next to it.",
      "download file": "Navigate to Documents page → Find your document → Click 'Download PDF' button → File will download automatically.",
      "download document": "Go to the Documents page, find the document you want, and click the 'Download PDF' button. The file will be saved to your device.",
      "downloading files": "To download files, go to the Documents page. You'll see a 'Download PDF' button next to each document. Click it to download the file to your device.",
      "get file": "You can download files from the Documents page by clicking the 'Download PDF' button next to any document.",
      
      // Meeting related
      "meeting": "To schedule a meeting, click 'Schedule Meeting' in your dashboard or go to the Meetings page. Select a date and time, add an agenda, and submit. Your supervisor will receive a notification.",
      "schedule": "Click the 'Schedule Meeting' button in your dashboard or go to the Meetings page. Fill in the meeting details including date, time, duration, and agenda. Your supervisor will be notified.",
      "how do i schedule": "Click the 'Schedule Meeting' button in your dashboard or go to the Meetings page. Fill in the meeting details including date, time, duration, and agenda.",
      "schedule meeting": "Go to your dashboard and click 'Schedule Meeting', or navigate to the Meetings page. Fill in date, time, duration, type (online/in-person/hybrid), location, and agenda.",
      "book meeting": "To book a meeting, go to the Meetings page or click 'Schedule Meeting' on your dashboard. Fill in all the details and submit.",
      "create meeting": "Navigate to Meetings page → Click 'Schedule Meeting' → Select date and time → Add agenda → Submit.",
      "how to meet": "You can schedule meetings with your supervisor through the Meetings page. Click 'Schedule Meeting' and fill in the details.",
      
      // Progress related
      "progress": "Your overall progress is calculated based on your weekly submissions. You can view your progress percentage on the dashboard and see detailed progress logs in the Progress page.",
      "how do i submit progress": "You can log your progress in two ways: 1) Use the 'Log Progress' button in your dashboard, or 2) Go to the Progress page and click 'Log Progress'. Fill in the details about what you've accomplished.",
      "submit progress": "Go to the Progress page or use the 'Log Progress' button in your dashboard. Enter a title, category, and description of your progress, then submit.",
      "log progress": "Navigate to Progress page → Click 'Log Progress' → Enter title, category, and description → Submit.",
      "update progress": "You can update your progress by going to the Progress page and clicking 'Log Progress'. Add details about your recent accomplishments.",
      "view progress": "Your progress is displayed on the dashboard as a percentage. For detailed logs, go to the Progress page.",
      
      // Supervisor contact
      "supervisor": "You can contact your supervisor by clicking 'Send Message' in the supervisor card on your dashboard, or go to the Messages section to start a conversation.",
      "contact supervisor": "Click 'Send Message' in your supervisor's card on the dashboard, or go to the Messages section to start a conversation.",
      "how do i contact my supervisor": "You can send a message to your supervisor by clicking the 'Send Message' button in the supervisor card on your dashboard. You can also view your message history there.",
      "message supervisor": "Go to your dashboard, find the supervisor card, and click 'Send Message'. You can also use the Messages page.",
      "contact": "To contact your supervisor, click 'Send Message' in the supervisor card on your dashboard or go to the Messages page.",
      
      // Deadlines
      "deadline": "Your deadlines are displayed in the 'Upcoming Deadlines' section on your dashboard. Make sure to check them regularly to stay on track.",
      "deadlines": "Check the 'Upcoming Deadlines' section on your dashboard to see important dates and submission deadlines. You can also view deadlines in the Progress page.",
      "what are deadlines": "Check the 'Upcoming Deadlines' section on your dashboard to see important dates and submission deadlines. You can also view deadlines in the Progress page.",
      "due date": "Due dates are shown in the 'Upcoming Deadlines' section on your dashboard. Check regularly to stay on track.",
      
      // Milestones
      "milestone": "Your research milestones are displayed on your dashboard in the 'Research Milestones' card. Click 'View All' to see detailed information about each milestone.",
      "milestones": "Milestones are shown on your dashboard. They are automatically generated based on your weekly submissions and progress.",
      "how do i view milestones": "Your research milestones are displayed on your dashboard in the 'Research Milestones' card. Click 'View All' to see detailed information about each milestone.",
      "view milestones": "Go to your dashboard and look at the 'Research Milestones' section. Click 'View All' for more details.",
      
      // Weekly submissions
      "weekly": "Weekly submissions can be made through the Documents page. When uploading, make sure to select the correct week number. You can also go to the Progress page to see your weekly submission history.",
      "weekly submission": "To submit weekly work, go to Documents page, click 'Upload Document', select your file, and make sure to enter the correct week number.",
      "week": "For weekly submissions, go to the Documents page, upload your file, and specify the week number. You can track all weekly submissions in the Progress page.",
      
      // Documents
      "document": "You can view all your documents in the Documents page. You can upload new documents, download existing ones, and see their status (submitted, pending review, reviewed, approved, rejected).",
      "documents": "Go to the Documents page to see all your submitted documents, download files, and check their review status.",
      "my documents": "All your documents are available in the Documents page. You can upload, download, and track their status there.",
      "submission": "To make a submission, go to the Documents page and click 'Upload Document'. Fill in all required information and submit your file.",
      
      // Messages
      "message": "You can send and receive messages through the Messages section. Go to your dashboard and click 'Send Message' in the supervisor card, or navigate to the Messages page.",
      "messages": "View all your messages in the Messages section. You can send messages to your supervisor from the dashboard or Messages page.",
      
      // Platform info
      "what is this platform": "UTMGradient is a postgraduate supervision platform that helps you manage your research progress, meetings with your supervisor, document submissions, and communications all in one place.",
      "what is utmgradient": "UTMGradient is a comprehensive platform for postgraduate students to manage their research, communicate with supervisors, submit documents, track progress, and schedule meetings.",
      "platform": "UTMGradient helps you manage your postgraduate research journey, including document submissions, meeting scheduling, progress tracking, and supervisor communication.",
      
      // Profile/Settings
      "profile": "To update your profile, go to the top right corner and click on your avatar/name. You can update your name, phone number, and avatar there.",
      "settings": "Profile settings can be accessed by clicking on your name/avatar in the top right corner of the dashboard.",
      "change password": "You can change your password from your profile settings. Click on your name/avatar in the top right corner.",
      
      // Notifications
      "notification": "Notifications appear in the bell icon at the top right of your dashboard. Click it to see all your notifications.",
      "notifications": "Check the bell icon in the top right corner of your dashboard to see all notifications about meetings, document reviews, messages, and deadlines.",
      
      // Default
      "default": "I can help you with: uploading documents, downloading files, scheduling meetings, submitting progress, viewing milestones, contacting your supervisor, checking deadlines, and more. What would you like to know?",
    }
  } else if (role === "supervisor") {
    return {
      ...commonResponses,
      // Upload resources
      "upload": "To upload a document or resource, go to the Documents page and click 'Upload Document'. Select a student (or leave blank for all students), choose the document type, and upload your file.",
      "how do i upload": "You can upload resources for your students by going to the 'Documents' page and clicking 'Upload Document'. Select a student (or leave blank for all students), choose the document type, and upload your file.",
      "upload document": "Go to the Documents page, click 'Upload Document', select a student (optional), choose the document type (resource or document), and upload your file. All your supervised students will be notified.",
      "upload resource": "Navigate to Documents page → Click 'Upload Document' → Select student (optional) → Choose type 'resource' → Upload file.",
      
      // Students management
      "student": "Go to the 'Students' page in the sidebar to see all your supervised students. You can click on any student to view their detailed profile, progress, and submissions.",
      "students": "Navigate to the Students page from the sidebar. There you'll see a list of all students under your supervision with their progress and status.",
      "how do i view students": "Go to the 'Students' page in the sidebar to see all your supervised students. You can click on any student to view their detailed profile, progress, and submissions.",
      "view students": "Navigate to the Students page from the sidebar. There you'll see a list of all students under your supervision with their progress and status.",
      "my students": "All your supervised students are listed in the Students page. Click on any student to see their details, progress, and submissions.",
      
      // Add student
      "add student": "In the Students page, click 'Add New Student' and provide the student's email or phone number. They must already be registered in the system.",
      "how do i add student": "To add a student, go to the Students page and click 'Add New Student'. Enter the student's email or phone number. The system will check if they're registered and add them to your supervision.",
      "assign student": "Go to Students page → Click 'Add New Student' → Enter email or phone → System will add them if registered.",
      
      // Review submissions
      "review": "To review student submissions, go to the Documents page and select a student. You'll see all their submissions with options to review, approve, or provide feedback.",
      "how do i review": "To review student submissions, go to the Documents page and select a student. You'll see all their submissions with options to review, approve, or provide feedback.",
      "review submission": "Navigate to the Documents page, select a student, and you'll see their submissions. Click on any submission to review it and provide feedback.",
      "approve": "To approve a submission, go to Documents page, select the student, find the submission, and click 'Approve' or provide feedback.",
      "feedback": "You can provide feedback on student submissions through the Documents page. Select a student, find their submission, and add your feedback.",
      
      // Meetings
      "meeting": "You can schedule meetings from the Meetings page. Click 'Schedule Meeting', select a student, choose date and time, and add meeting details. The student will be notified.",
      "schedule": "You can schedule meetings from the Meetings page. Click 'Schedule Meeting', select a student, choose date and time, and add meeting details.",
      "schedule meeting": "Go to the Meetings page and click 'Schedule Meeting'. Select the student, date, time, and add an agenda. The student will receive a notification.",
      "how do i schedule": "Navigate to Meetings page → Click 'Schedule Meeting' → Select student → Choose date/time → Add agenda → Submit.",
      
      // Messages
      "message": "You can send messages to students by going to the Students page, selecting a student, and using the messaging feature. You can also reply to messages from your dashboard.",
      "message student": "In the Students page, select a student and use the messaging feature. You can also view and reply to messages from your dashboard.",
      "how do i message": "Go to Students page → Select a student → Use messaging feature, or reply to messages from your dashboard.",
      
      // Progress tracking
      "progress": "Student progress is displayed in the Students page. Click on any student to see their detailed progress, milestones, and weekly submissions.",
      "view progress": "To view a student's progress, go to the Students page and click on a student. You'll see their overall progress, milestones, and submission history.",
      "student progress": "Go to Students page → Click on a student → View their progress percentage, milestones, and weekly submissions.",
      
      // Documents
      "document": "View all student documents in the Documents page. You can filter by student, review submissions, approve/reject, and provide feedback.",
      "documents": "Go to Documents page to see all student submissions. You can review, approve, reject, or provide feedback on each document.",
      "submission": "Student submissions are available in the Documents page. Select a student to see all their submissions and review them.",
      
      // Announcements
      "announcement": "You can create announcements for your students. Go to your dashboard or the appropriate section to post announcements that will be visible to all or specific students.",
      "announce": "Create announcements for your students through the dashboard or announcements section. You can target all students or specific ones.",
      
      // Platform info
      "what is this platform": "UTMGradient is a postgraduate supervision platform that helps you manage your students, review their work, schedule meetings, and communicate effectively.",
      "platform": "UTMGradient is a comprehensive platform for supervisors to manage students, review submissions, schedule meetings, track progress, and communicate.",
      
      // Default
      "default": "I can help you with: uploading resources, viewing and managing students, reviewing submissions, scheduling meetings, messaging students, viewing student progress, and more. What would you like to know?",
    }
  } else {
    return {
      ...commonResponses,
      // Users management
      "user": "Go to the 'Users' page in the sidebar to see all users (students, supervisors, and admins). You can filter by role, status, or search by name/email.",
      "users": "Navigate to the Users page from the sidebar. There you'll see all registered users with options to view details, activate/deactivate accounts, and manage user information.",
      "how do i view users": "Go to the 'Users' page in the sidebar to see all users (students, supervisors, and admins). You can filter by role, status, or search by name/email.",
      "view users": "Navigate to the Users page from the sidebar. There you'll see all registered users with options to view details, activate/deactivate accounts, and manage user information.",
      "all users": "All system users are listed in the Users page. You can filter by role (student/supervisor/admin), status (active/inactive/suspended), or search by name/email.",
      
      // Add user
      "add user": "In the Users page, select the role tab (Students/Supervisors/Admins), click 'Add New User', and provide the email or phone number. The user must be registered first.",
      "how do i add user": "To add a user, go to the Users page, select the appropriate tab (Students, Supervisors, or Admins), and click 'Add New User'. Enter their email or phone number. They must already be registered in the system.",
      "create user": "Go to Users page → Select role tab → Click 'Add New User' → Enter email or phone → Add to system.",
      
      // Deactivate/Activate
      "deactivate": "To deactivate a user account, go to the Users page, find the user, click the three-dot menu, and select 'Deactivate Account'. Deactivated users cannot log in.",
      "deactivate account": "In the Users page, click the menu icon next to a user and select 'Deactivate Account'. You can reactivate it later using 'Activate Account'.",
      "activate": "To activate a deactivated account, go to Users page, find the user, click the menu, and select 'Activate Account'.",
      "suspend": "You can suspend user accounts from the Users page. Click the menu icon next to a user and select 'Suspend Account'.",
      
      // Reports
      "report": "Go to the 'Reports' page in the sidebar to view analytics and generate reports. You can see student progress, meeting statistics, document statistics, and generate AI-powered reports.",
      "reports": "Navigate to the Reports page to see comprehensive analytics including student progress by program, meeting statistics, document statistics, and top performers.",
      "how do i view reports": "Go to the 'Reports' page in the sidebar to view analytics and generate reports. You can see student progress, meeting statistics, document statistics, and generate AI-powered reports.",
      "view reports": "Navigate to the Reports page to see comprehensive analytics including student progress by program, meeting statistics, document statistics, and top performers.",
      "generate report": "In the Reports page, click 'Generate AI Report' to create a comprehensive PDF report with all analytics and insights.",
      "analytics": "View system analytics in the Reports page. You'll see statistics on student progress, meetings, documents, and more.",
      "statistics": "Comprehensive statistics are available in the Reports page, including student progress by program, meeting counts, document submissions, and top performers.",
      
      // System management
      "manage": "As an administrator, you can manage users (add, edit, deactivate), view reports and analytics, and oversee the entire system. Use the Users and Reports pages for these functions.",
      "manage system": "You can manage the system through the Users page (user management) and Reports page (analytics). You have full access to all system features.",
      "system": "As an administrator, you have access to all system features including user management, reports, analytics, and system oversight.",
      
      // Platform info
      "what is this platform": "UTMGradient is a postgraduate supervision platform. As an administrator, you oversee all users, generate reports, and manage the system.",
      "platform": "UTMGradient is a comprehensive postgraduate supervision platform. As admin, you manage users, view analytics, generate reports, and oversee system operations.",
      
      // Default
      "default": "I can help you with: managing users (add, edit, activate/deactivate), viewing reports and analytics, generating reports, and understanding system features. What would you like to know?",
    }
  }
}

export function Chatbot({ role, className }: ChatbotProps) {
  const { user } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const faqResponses = getFAQResponses(role)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      setMessages([{
        type: "bot",
        text: "Hello! I'm your UTMGradient assistant. I can help you with questions about using the platform, guide you through features, and answer any questions you have. What would you like to know?",
        timestamp: new Date(),
        links: []
      }])
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const findResponse = (userInput: string): { text: string; links: Array<{ text: string; url: string }> } => {
    const lowerInput = userInput.toLowerCase().trim()
    
    // Split input into words for better matching
    const inputWords = lowerInput.split(/\s+/)
    
    // Score-based matching: find the best match
    let bestMatch: { key: string; score: number } | null = null
    
    for (const [key, value] of Object.entries(faqResponses)) {
      if (key === "default") continue
      
      const keyWords = key.toLowerCase().split(/\s+/)
      let score = 0
      
      // Exact phrase match (highest priority)
      if (lowerInput.includes(key)) {
        score = 100 + key.length // Longer keys get slightly higher score
      } else {
        // Word-based matching
        let matchedWords = 0
        for (const keyWord of keyWords) {
          if (inputWords.some(word => word.includes(keyWord) || keyWord.includes(word))) {
            matchedWords++
          }
        }
        // Calculate score based on matched words
        if (matchedWords > 0) {
          score = (matchedWords / keyWords.length) * 50
        }
      }
      
      // Boost score for exact word matches
      for (const word of inputWords) {
        if (keyWords.includes(word)) {
          score += 20
        }
      }
      
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { key, score }
      }
    }
    
    // Get response text
    const responseText = (bestMatch && bestMatch.score >= 20) 
      ? (faqResponses[bestMatch.key as keyof typeof faqResponses] || faqResponses["default"])
      : (faqResponses["default"] || "I'm here to help! Try asking about uploading documents, scheduling meetings, or viewing your progress.")
    
    // Get relevant links based on the query
    const links = getPageLinks(role, userInput)
    
    return { text: responseText, links }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    
    // Add user message to UI immediately
    const newUserMessage = {
      type: "user" as const,
      text: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newUserMessage])

    setIsLoading(true)

    try {
      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map(msg => ({
        type: msg.type,
        text: msg.text
      }))

      // Call OpenAI API through backend
      const response = await chatbotAPI.sendMessage(userMessage, role, conversationHistory)
      
      // Get relevant links based on the query (keep link suggestions)
      const botLinks = getPageLinks(role, userMessage)

      // Add bot response from OpenAI
      const newBotMessage: Message = {
        type: "bot",
        text: response.response,
        timestamp: new Date(),
        links: botLinks
      }
      setMessages(prev => [...prev, newBotMessage])

    } catch (error: any) {
      console.error("Chatbot error:", error)
      
      // Fallback to FAQ if OpenAI fails
      const faqResponse = findResponse(userMessage)
      const botLinks = faqResponse.links.length > 0 
        ? faqResponse.links 
        : getPageLinks(role, userMessage)

      toast({
        title: "Using fallback response",
        description: error.message || "OpenAI API unavailable, using fallback responses.",
        variant: "default"
      })
      
      // Add fallback FAQ response
      const fallbackMessage: Message = {
        type: "bot",
        text: faqResponse.text,
        timestamp: new Date(),
        links: botLinks
      }
      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 ${className}`}
        size="lg"
        aria-label="Open chatbot"
      >
        <Bot className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 w-96 z-50 ${className}`}>
      <Card className="shadow-2xl border-2">
        <div className="bg-primary text-primary-foreground p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h3 className="font-semibold">UTMGradient Assistant</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsMinimized(!isMinimized)}
              aria-label={isMinimized ? "Maximize chatbot" : "Minimize chatbot"}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => {
                setIsOpen(false)
                setIsMinimized(false)
              }}
              aria-label="Close chatbot"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="h-80 overflow-y-auto p-4 bg-background space-y-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    {msg.links && msg.links.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.links.map((link, linkIdx) => (
                          <Link
                            key={linkIdx}
                            href={link.url}
                            onClick={() => {
                              setIsOpen(false)
                              setIsMinimized(false)
                            }}
                            className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-md transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {link.text}
                          </Link>
                        ))}
                      </div>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask a question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Try: "how do I upload", "download files", "schedule meeting", "view progress"
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

