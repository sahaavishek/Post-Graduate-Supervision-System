import type React from "react"
import { NotificationsProvider } from "@/lib/notifications-context"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <NotificationsProvider role="admin">{children}</NotificationsProvider>
}
