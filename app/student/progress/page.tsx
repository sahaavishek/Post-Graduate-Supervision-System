"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function StudentProgressPage() {
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
              <Link href="/student/progress" className="text-sm font-medium text-foreground">
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
            <h2 className="text-3xl font-bold text-foreground mb-2">Research Progress</h2>
            <p className="text-muted-foreground">Track your milestones and research timeline</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <PlusIcon className="mr-2 h-4 w-4" />
                Log Progress
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Log Progress Update</DialogTitle>
              </DialogHeader>
              <ProgressLogForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* Overall Progress */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Overall Progress</h3>
              <p className="text-muted-foreground">PhD Thesis - 16 Week Progress Tracking</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-accent mb-1">56%</p>
              <p className="text-sm text-muted-foreground">Week 9 of 16</p>
            </div>
          </div>
          <Progress value={56} className="h-3 mb-4" />
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">9/16</p>
              <p className="text-sm text-muted-foreground">Weeks Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">12</p>
              <p className="text-sm text-muted-foreground">Documents</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">18</p>
              <p className="text-sm text-muted-foreground">Meetings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">7</p>
              <p className="text-sm text-muted-foreground">Submissions</p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="logs">Progress Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-6">16-Week Research Timeline</h3>
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

                {/* Timeline Items */}
                <div className="space-y-8">
                  <TimelineItem
                    week="Weeks 1-4"
                    period="Month 1"
                    status="completed"
                    items={[
                      { title: "Week 1: Project Briefing & Literature Review", status: "completed", date: "Week 1" },
                      { title: "Week 2: Research Proposal Draft", status: "completed", date: "Week 2" },
                      { title: "Week 3: Methodology Planning", status: "completed", date: "Week 3" },
                      { title: "Week 4: Ethics Application", status: "completed", date: "Week 4" },
                    ]}
                  />
                  <TimelineItem
                    week="Weeks 5-8"
                    period="Month 2"
                    status="completed"
                    items={[
                      { title: "Week 5: Data Collection Setup", status: "completed", date: "Week 5" },
                      { title: "Week 6: Preliminary Data Analysis", status: "completed", date: "Week 6" },
                      { title: "Week 7: Model Development", status: "completed", date: "Week 7" },
                      { title: "Week 8: Mid-Progress Review", status: "completed", date: "Week 8" },
                    ]}
                  />
                  <TimelineItem
                    week="Weeks 9-12"
                    period="Month 3"
                    status="in-progress"
                    items={[
                      { title: "Week 9: Experiments & Testing", status: "in-progress", date: "Week 9" },
                      { title: "Week 10: Results Analysis", status: "pending", date: "Week 10" },
                      { title: "Week 11: Draft Chapter Writing", status: "pending", date: "Week 11" },
                      { title: "Week 12: Supervisor Review", status: "pending", date: "Week 12" },
                    ]}
                  />
                  <TimelineItem
                    week="Weeks 13-16"
                    period="Month 4"
                    status="pending"
                    items={[
                      { title: "Week 13: Thesis Compilation", status: "pending", date: "Week 13" },
                      { title: "Week 14: Revisions & Editing", status: "pending", date: "Week 14" },
                      { title: "Week 15: Final Review", status: "pending", date: "Week 15" },
                      { title: "Week 16: Submission & Presentation", status: "pending", date: "Week 16" },
                    ]}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="mt-6">
            <div className="grid gap-4">
              <DetailedMilestoneCard
                title="Week 1-2: Literature Review & Proposal"
                status="completed"
                progress={100}
                startDate="Week 1"
                endDate="Week 2"
                description="Complete literature review and draft initial research proposal"
                deliverables={["Literature review document", "Research proposal draft", "Annotated bibliography"]}
                feedback="Excellent start. Literature review is comprehensive and well-structured."
              />
              <DetailedMilestoneCard
                title="Week 3-4: Methodology & Ethics"
                status="completed"
                progress={100}
                startDate="Week 3"
                endDate="Week 4"
                description="Finalize research methodology and submit ethics application"
                deliverables={["Methodology document", "Ethics application", "Data collection plan"]}
                feedback="Methodology is sound. Ethics application approved."
              />
              <DetailedMilestoneCard
                title="Week 5-6: Data Collection"
                status="completed"
                progress={100}
                startDate="Week 5"
                endDate="Week 6"
                description="Set up data collection infrastructure and begin preliminary analysis"
                deliverables={["Data collection setup", "Preliminary dataset", "Quality assurance report"]}
                feedback="Good progress on data collection. Ensure data quality is maintained."
              />
              <DetailedMilestoneCard
                title="Week 7-8: Model Development"
                status="completed"
                progress={100}
                startDate="Week 7"
                endDate="Week 8"
                description="Develop initial models and conduct mid-progress review"
                deliverables={["Model architecture", "Initial results", "Mid-progress presentation"]}
                feedback="Strong model development. Ready to proceed with experiments."
              />
              <DetailedMilestoneCard
                title="Week 9-10: Experiments & Analysis"
                status="in-progress"
                progress={45}
                startDate="Week 9"
                endDate="Week 10"
                description="Conduct comprehensive experiments and analyze results"
                deliverables={["Experiment results", "Statistical analysis", "Performance metrics"]}
                feedback="Continue with systematic testing. Document all findings thoroughly."
              />
              <DetailedMilestoneCard
                title="Week 11-12: Writing & Review"
                status="pending"
                progress={0}
                startDate="Week 11"
                endDate="Week 12"
                description="Draft thesis chapters and submit for supervisor review"
                deliverables={["Draft chapters", "Figures and tables", "References list"]}
                feedback=""
              />
              <DetailedMilestoneCard
                title="Week 13-14: Compilation & Revision"
                status="pending"
                progress={0}
                startDate="Week 13"
                endDate="Week 14"
                description="Compile complete thesis and incorporate feedback"
                deliverables={["Complete thesis draft", "Revised chapters", "Abstract and summary"]}
                feedback=""
              />
              <DetailedMilestoneCard
                title="Week 15-16: Final Submission"
                status="pending"
                progress={0}
                startDate="Week 15"
                endDate="Week 16"
                description="Final review, formatting, and thesis submission"
                deliverables={["Final thesis document", "Presentation slides", "Submission confirmation"]}
                feedback=""
              />
            </div>
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <div className="space-y-4">
              <ProgressLogCard
                date="Oct 25, 2025"
                title="Data Collection Progress"
                category="Data Collection"
                description="Completed data collection from Hospital A. Total of 2,500 medical images collected and preprocessed. Quality checks passed. Moving to Hospital B next week."
                attachments={["data_summary.pdf", "quality_report.xlsx"]}
              />
              <ProgressLogCard
                date="Oct 18, 2025"
                title="Methodology Refinement"
                category="Research"
                description="Refined data preprocessing pipeline based on supervisor feedback. Implemented additional normalization steps and validation checks."
                attachments={["pipeline_v2.py"]}
              />
              <ProgressLogCard
                date="Oct 11, 2025"
                title="Conference Paper Submission"
                category="Publication"
                description="Submitted paper to ICML 2026. Title: 'Deep Learning Approaches for Medical Image Diagnosis'. Awaiting review."
                attachments={["icml_paper.pdf"]}
              />
              <ProgressLogCard
                date="Oct 4, 2025"
                title="Literature Update"
                category="Literature Review"
                description="Added 15 new papers to literature review covering recent advances in transformer models for medical imaging."
                attachments={["literature_update.docx"]}
              />
              <ProgressLogCard
                date="Sep 27, 2025"
                title="Model Training Experiments"
                category="Data Analysis"
                description="Conducted initial experiments with baseline CNN models. Achieved 82% accuracy on validation set. Planning to try transformer-based architectures next."
                attachments={["experiment_results.pdf", "training_logs.txt"]}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function ProgressLogForm() {
  return (
    <form className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="log-title">Title</Label>
        <Input id="log-title" placeholder="Brief description of progress" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="log-category">Category</Label>
        <Select>
          <SelectTrigger id="log-category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="research">Research</SelectItem>
            <SelectItem value="data-collection">Data Collection</SelectItem>
            <SelectItem value="data-analysis">Data Analysis</SelectItem>
            <SelectItem value="writing">Writing</SelectItem>
            <SelectItem value="publication">Publication</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="log-description">Description</Label>
        <Textarea id="log-description" placeholder="Detailed description of your progress..." rows={5} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="log-attachments">Attachments (Optional)</Label>
        <Input id="log-attachments" type="file" multiple />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
          Save Progress
        </Button>
      </div>
    </form>
  )
}

function TimelineItem({
  week,
  period,
  status,
  items,
}: {
  week: string
  period: string
  status: string
  items: Array<{ title: string; status: string; date: string }>
}) {
  const statusColors = {
    completed: "bg-green-500",
    "in-progress": "bg-blue-500",
    pending: "bg-gray-300",
  }

  const weekDisplay = week.includes("-") ? week.split(" ")[1] : week.split(" ")[1]

  return (
    <div className="relative pl-16">
      {/* Week Badge */}
      <div
        className={`absolute left-0 w-16 h-16 rounded-full ${statusColors[status as keyof typeof statusColors]} flex items-center justify-center text-white font-bold shadow-lg text-xs`}
      >
        {weekDisplay}
      </div>

      {/* Content */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-bold text-foreground">{week}</h4>
            <p className="text-sm text-muted-foreground">{period}</p>
          </div>
          <Badge
            className={
              status === "completed"
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : status === "in-progress"
                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                  : "bg-gray-500/10 text-gray-700 dark:text-gray-400"
            }
            variant="secondary"
          >
            {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
              <div className="flex items-center gap-3">
                {item.status === "completed" ? (
                  <CheckCircleIcon className="text-green-500" />
                ) : item.status === "in-progress" ? (
                  <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-sm font-medium text-foreground">{item.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">{item.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DetailedMilestoneCard({
  title,
  status,
  progress,
  startDate,
  endDate,
  description,
  deliverables,
  feedback,
}: {
  title: string
  status: string
  progress: number
  startDate: string
  endDate: string
  description: string
  deliverables: string[]
  feedback: string
}) {
  const statusConfig = {
    completed: { label: "Completed", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
    "in-progress": { label: "In Progress", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
    pending: { label: "Pending", color: "bg-gray-500/10 text-gray-700 dark:text-gray-400" },
  }

  const config = statusConfig[status as keyof typeof statusConfig]

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
            <Badge className={config.color} variant="secondary">
              {config.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {startDate} - {endDate}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-accent">{progress}%</p>
        </div>
      </div>

      <Progress value={progress} className="h-2 mb-4" />

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Deliverables</h4>
          <ul className="space-y-1">
            {deliverables.map((item, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        {feedback && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Supervisor Feedback</h4>
            <p className="text-sm text-muted-foreground italic">{feedback}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="bg-transparent">
          View Details
        </Button>
        {status === "in-progress" && (
          <Button variant="outline" size="sm" className="bg-transparent">
            Update Progress
          </Button>
        )}
      </div>
    </Card>
  )
}

function ProgressLogCard({
  date,
  title,
  category,
  description,
  attachments,
}: {
  date: string
  title: string
  category: string
  description: string
  attachments: string[]
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <Badge variant="secondary" className="bg-accent/10 text-accent">
              {category}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{date}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Attachments</p>
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-xs text-foreground"
              >
                <FileIcon className="h-3 w-3" />
                {file}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
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

function FileIcon({ className }: { className?: string }) {
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
    </svg>
  )
}
