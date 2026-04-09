"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  id: number
  type: string
  title: string
  message: string
  timestamp: string
  unread: boolean
  icon: string
  link?: string
}

interface NotificationsDropdownProps {
  unreadCount: number
  notifications: Notification[]
  onMarkAsRead: (id: number) => void
  onDelete: (id: number) => void
  onClearAll: () => void
  onMarkAllAsRead?: () => void
}

export function NotificationsDropdown({
  unreadCount,
  notifications,
  onMarkAsRead,
  onDelete,
  onClearAll,
  onMarkAllAsRead,
}: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleNotificationClick = (notif: Notification) => {
    // Mark as read when clicked
    if (notif.unread) {
      onMarkAsRead(notif.id)
    }
    
    // Navigate based on notification link first (from live API data)
    if (notif.link && notif.link.trim() !== '') {
      try {
        router.push(notif.link)
        setIsOpen(false)
        return
      } catch (error) {
        console.error('Error navigating to notification link:', error)
      }
    }
    
    // Default navigation based on type
    // Try to determine role from current path
    const currentPath = window.location.pathname
    let basePath = '/student'
    if (currentPath.includes('/supervisor')) {
      basePath = '/supervisor'
    } else if (currentPath.includes('/admin')) {
      basePath = '/admin'
    }
    
    switch (notif.type) {
      case 'meeting':
        router.push(`${basePath}/meetings`)
        break
      case 'document':
      case 'submission':
        if (basePath === '/supervisor') {
          router.push(`${basePath}/students`)
        } else {
          router.push(`${basePath}/documents`)
        }
        break
      case 'message':
        router.push(`${basePath}/dashboard`)
        break
      case 'progress':
      case 'reminder':
        if (basePath === '/student') {
          router.push(`${basePath}/progress`)
        } else if (basePath === '/supervisor') {
          router.push(`${basePath}/students`)
        } else {
          router.push(`${basePath}/dashboard`)
        }
        break
      default:
        router.push(`${basePath}/dashboard`)
    }
    setIsOpen(false)
  }

  const handleMarkAsRead = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    onMarkAsRead(id)
  }

  const handleDelete = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const notif = notifications.find((n) => n.id === id)
    if (notif?.unread) {
      onDelete(id)
    } else {
      onDelete(id)
    }
    toast({
      title: "Notification Deleted",
      description: "The notification has been removed.",
    })
  }

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead()
      toast({
        title: "All Notifications Marked as Read",
        description: `${notifications.filter((n) => n.unread).length} notifications marked as read.`,
      })
    }
  }

  const handleClearAll = () => {
    onClearAll()
    toast({
      title: "All Notifications Cleared",
      description: "All notifications have been deleted.",
    })
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setIsOpen(!isOpen)}>
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center z-10">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-red-500/10 text-red-700">
                {unreadCount} Unread
              </Badge>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${notif.unread ? "bg-muted/30" : ""}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex gap-3">
                      <div className="text-2xl">{notif.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-foreground">{notif.title}</h4>
                          {notif.unread && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mb-2">{notif.timestamp}</p>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {notif.unread && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs"
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                            >
                              Mark as Read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs text-destructive hover:text-destructive"
                            onClick={(e) => handleDelete(notif.id, e)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-border flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={handleMarkAllAsRead}>
                Mark All as Read
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-destructive hover:text-destructive"
                onClick={handleClearAll}
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}
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
