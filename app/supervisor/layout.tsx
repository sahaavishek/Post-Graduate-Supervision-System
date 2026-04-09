import type React from "react"
import { NotificationsProvider } from "@/lib/notifications-context"

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  return <NotificationsProvider role="supervisor">{children}</NotificationsProvider>
}
