import type React from "react"
import { NotificationsProvider } from "@/lib/notifications-context"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <NotificationsProvider role="student">{children}</NotificationsProvider>
}

