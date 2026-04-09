"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { notificationsAPI } from "./api"

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

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id">) => void
  markAsRead: (id: number) => void
  deleteNotification: (id: number) => void
  clearAll: () => void
  markAllAsRead: () => void
  refreshNotifications: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({
  children,
  role = "student",
}: { children: ReactNode; role?: "student" | "admin" | "supervisor" }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Format timestamp relative to now
  const formatTimestamp = (createdAt: string): string => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffMs = now.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return created.toLocaleDateString()
  }

  // Fetch notifications from API
  const refreshNotifications = useCallback(async () => {
    // Check if user is authenticated before fetching notifications (use sessionStorage for tab-specific auth)
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
    if (!token) {
      // User is not logged in, don't fetch notifications
      setIsLoading(false)
      return
    }

    try {
      const response = await notificationsAPI.getAll()
      const apiNotifications = response.notifications || []
      
      // Transform API notifications to match our interface
      const transformedNotifications: Notification[] = apiNotifications.map((notif: any) => ({
        id: notif.id,
        type: notif.type || 'general',
        title: notif.title,
        message: notif.message,
        timestamp: formatTimestamp(notif.created_at),
        unread: notif.unread === 1 || notif.unread === true,
        icon: notif.icon || '📢',
        link: notif.link || undefined,
      }))
      
      setNotifications(transformedNotifications)
      setUnreadCount(response.unreadCount || 0)
    } catch (error: any) {
      // Silently handle token expiration - user will be redirected to login
      if (error.name === 'TokenExpiredError' || error.isTokenExpired) {
        return
      }
      
      // Silently handle backend connection errors - backend might not be running
      if (error.name === 'ConnectionError' || 
          (error.message && (
            error.message.includes('Failed to connect') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('backend server') ||
            error.message.includes('Backend server not available') ||
            error.message.includes('not active') ||
            error.message.includes('deactivated') ||
            error.message.includes('contact an administrator')
          ))) {
        // Backend is not available or user is inactive - this is expected
        // Don't log as error, just silently fail
        return
      }
      // Only log other errors that aren't authentication-related
      if (error.message && !error.message.includes('token') && !error.message.includes('401')) {
        console.error('Error fetching notifications:', error)
      }
      // Don't set empty array on error, keep existing notifications
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch notifications on mount and set up polling for live updates
  useEffect(() => {
    // Check if user is authenticated before fetching (use sessionStorage for tab-specific auth)
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
    if (!token) {
      setIsLoading(false)
      return
    }

    // Fetch notifications immediately on mount
    refreshNotifications()

    // Set up polling to fetch notifications every 5 seconds for live updates
    const pollInterval = setInterval(() => {
      // Check if tab is visible before polling (saves resources)
      if (typeof document !== 'undefined' && !document.hidden) {
        const currentToken = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
        if (currentToken) {
          refreshNotifications()
        }
      }
    }, 5000) // Poll every 5 seconds

    // Handle page visibility changes - pause polling when tab is hidden
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, refresh immediately
        const currentToken = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null
        if (currentToken) {
          refreshNotifications()
        }
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    // Cleanup: clear interval and remove event listener
    return () => {
      clearInterval(pollInterval)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [refreshNotifications])

  const addNotification = (notification: Omit<Notification, "id">) => {
    const newNotification = {
      ...notification,
      id: Math.max(...notifications.map((n) => n.id), 0) + 1,
    }
    setNotifications([newNotification, ...notifications])
    if (newNotification.unread) {
      setUnreadCount(prev => prev + 1)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id)
      setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, unread: false } : notif)))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
      // Update UI anyway
      setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, unread: false } : notif)))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      await notificationsAPI.delete(id)
      const notification = notifications.find(n => n.id === id)
      setNotifications(notifications.filter((n) => n.id !== id))
      if (notification?.unread) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error: any) {
      // Handle NotFoundError gracefully - notification already deleted or doesn't exist
      if (error.name === 'NotFoundError' || error.status === 404) {
        // Notification already deleted - just update UI
        const notification = notifications.find(n => n.id === id)
        setNotifications(notifications.filter((n) => n.id !== id))
        if (notification?.unread) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
        return
      }
      console.error('Error deleting notification:', error)
      // Update UI anyway for other errors
      const notification = notifications.find(n => n.id === id)
      setNotifications(notifications.filter((n) => n.id !== id))
      if (notification?.unread) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(notifications.map((n) => ({ ...n, unread: false })))
      setUnreadCount(0)
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error)
      // Update UI anyway
      setNotifications(notifications.map((n) => ({ ...n, unread: false })))
      setUnreadCount(0)
    }
  }

  const clearAll = async () => {
    try {
      await notificationsAPI.deleteAll()
      setNotifications([])
      setUnreadCount(0)
    } catch (error: any) {
      // Handle NotFoundError gracefully - if notifications are not found, they're already cleared
      if (error.name === 'NotFoundError' || error.status === 404) {
        // Notifications already deleted or don't exist - this is fine
        setNotifications([])
        setUnreadCount(0)
        return
      }
      console.error('Error clearing all notifications:', error)
      // Update UI anyway for other errors
      setNotifications([])
      setUnreadCount(0)
    }
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        deleteNotification,
        clearAll,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}
