"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authAPI, usersAPI, studentsAPI, supervisorsAPI } from './api'

interface UserContextType {
  user: any | null
  loading: boolean
  refreshUser: () => Promise<void>
  updateUser: (data: { name?: string; phone?: string; avatar?: string; email?: string }) => Promise<void>
  updateStudent: (data: {
    program?: string
    start_date?: string
    expected_completion?: string
    progress?: number
    research_area?: string
  }) => Promise<void>
  updateSupervisor: (data: {
    department?: string
    office?: string
    office_hours?: string
    research_interests?: string
    position?: string
    qualifications?: string
    biography?: string
    capacity?: number
  }) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getMe()
      setUser(response.user)
    } catch (error: any) {
      // Silently handle token expiration - user will be redirected to login
      if (error.name === 'TokenExpiredError' || error.isTokenExpired) {
        setUser(null)
        return
      }
      
      // Silently handle "No token provided" - user is not logged in
      if (error.message?.toLowerCase().includes('no token')) {
        setUser(null)
        return
      }
      
      // Silently handle backend connection errors - backend might not be running
      if (error.name === 'ConnectionError' || 
          (error.message && (
            error.message.includes('Failed to connect') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('backend server') ||
            error.message.includes('Backend server not available')
          ))) {
        // Backend is not available - keep existing user data if available
        // Don't log as error, just silently fail
        return
      }
      
      // Silently handle inactive/deactivated account errors - don't log
      if (error.message && (
          error.message.includes('not active') ||
          error.message.includes('deactivated') ||
          error.message.includes('contact an administrator')
        )) {
        // User account is inactive - don't log error, just set user to null
        setUser(null)
        return
      }
      
      // Only log other unexpected errors
      console.error('Error fetching user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const updateUser = async (data: { name?: string; phone?: string; avatar?: string; email?: string }) => {
    if (!user?.user_id) throw new Error('User not loaded')
    
    // user_id is the users table ID, not the student/supervisor record ID
    await usersAPI.update(user.user_id, data)
    await refreshUser()
  }

  const updateStudent = async (data: {
    program?: string
    start_date?: string
    expected_completion?: string
    progress?: number
    research_area?: string
  }) => {
    if (!user?.id) throw new Error('User not loaded')
    
    // The user.id from /auth/me is the student record ID (s.id from students table)
    await studentsAPI.update(user.id, data)
    await refreshUser()
  }

  const updateSupervisor = async (data: {
    department?: string
    office?: string
    office_hours?: string
    research_interests?: string
    position?: string
    qualifications?: string
    biography?: string
    capacity?: number
  }) => {
    if (!user?.id) throw new Error('User not loaded')
    
    // The user.id from /auth/me is the supervisor record ID (s.id from supervisors table)
    await supervisorsAPI.update(user.id, data)
    await refreshUser()
  }

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        updateUser,
        updateStudent,
        updateSupervisor,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

