"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import jsPDF from "jspdf"

interface StudentData {
  name: string
  program: string
  progress: number
  startDate?: string
  expectedCompletion?: string
  milestones?: Array<{
    name: string
    progress: number
    status: string
  }>
  recentActivities?: Array<{
    title: string
    time: string
  }>
  weeklyProgress?: Array<{
    week: number
    task: string
    status: string
    submission: string
  }>
  lastMeeting?: string
  meetingsThisMonth?: number
  documentsSubmitted?: number
  pendingReviews?: number
}

interface DownloadReportButtonProps {
  studentData: StudentData
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function DownloadReportButton({
  studentData,
  variant = "default",
  size = "default",
  className = "",
}: DownloadReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleDownloadReport = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate report")
      }

      const data = await response.json()

      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - 2 * margin
      let yPosition = margin

      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 30) {
          pdf.addPage()
          yPosition = margin
          return true
        }
        return false
      }

      // Header
      pdf.setFillColor(37, 99, 235)
      pdf.rect(0, 0, pageWidth, 45, "F")
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(22)
      pdf.setFont("helvetica", "bold")
      pdf.text("Student Progress Report", pageWidth / 2, 20, { align: "center" })
      pdf.setFontSize(11)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Generated: ${new Date(data.generatedAt).toLocaleString()}`, pageWidth / 2, 32, { align: "center" })

      yPosition = 60
      pdf.setTextColor(0, 0, 0)

      // Student info box
      pdf.setFillColor(248, 250, 252)
      pdf.roundedRect(margin, yPosition, maxWidth, 30, 3, 3, "F")
      yPosition += 10
      pdf.setFontSize(13)
      pdf.setFont("helvetica", "bold")
      pdf.text(`${data.studentName}`, margin + 5, yPosition)
      yPosition += 8
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(10)
      pdf.text(`${studentData.program} | Progress: ${studentData.progress}%`, margin + 5, yPosition)
      yPosition += 20

      // Parse report content
      const reportLines = data.report.split("\n")

      for (const line of reportLines) {
        if (line.trim() === "" || line.includes("STUDENT PROGRESS REPORT") || line.includes("Generated:")) {
          continue
        }

        // Section headers (all caps lines)
        if (line.trim() === line.trim().toUpperCase() && line.trim().length > 3 && line.trim().length < 40) {
          checkPageBreak(18)
          yPosition += 8
          pdf.setFillColor(37, 99, 235)
          pdf.rect(margin, yPosition - 5, maxWidth, 10, "F")
          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(11)
          pdf.setFont("helvetica", "bold")
          pdf.text(line.trim(), margin + 5, yPosition)
          pdf.setTextColor(0, 0, 0)
          yPosition += 10
          continue
        }

        // Key-value pairs
        if (line.includes(":") && line.trim().length < 100) {
          checkPageBreak(10)
          pdf.setFontSize(10)
          pdf.setFont("helvetica", "normal")
          const text = pdf.splitTextToSize(line.trim(), maxWidth)
          pdf.text(text, margin, yPosition)
          yPosition += text.length * 5
          continue
        }

        // Regular text
        if (line.trim().length > 0) {
          checkPageBreak(10)
          pdf.setFontSize(10)
          pdf.setFont("helvetica", "normal")
          const text = pdf.splitTextToSize(line.trim(), maxWidth)
          pdf.text(text, margin, yPosition)
          yPosition += text.length * 5 + 2
        }
      }

      // Footer
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(9)
        pdf.setTextColor(100, 100, 100)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" })
      }

      const fileName = `${studentData.name.replace(/\s+/g, "_")}_Report_${new Date().toISOString().split("T")[0]}.pdf`
      pdf.save(fileName)

      toast({
        title: "Report Generated",
        description: "Progress report downloaded successfully.",
      })
    } catch (error) {
      console.error("[v0] Error downloading report:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={handleDownloadReport} disabled={isGenerating} variant={variant} size={size} className={className}>
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download AI Report
        </>
      )}
    </Button>
  )
}
