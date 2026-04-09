"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/lib/user-context"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"

interface LoginFormProps {
  onSwitchToSignUp?: () => void
}

export function LoginForm({ onSwitchToSignUp }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [roleError, setRoleError] = useState("")
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [roleTouched, setRoleTouched] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { refreshUser } = useUser()

  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail")
    const savedRole = localStorage.getItem("rememberedRole")
    const wasRemembered = localStorage.getItem("rememberMe") === "true"
    
    if (wasRemembered && savedEmail) {
      setEmail(savedEmail)
      setRole(savedRole || "")
      setRememberMe(true)
    }
  }, [])

  const validateEmail = (value: string) => {
    if (!value) {
      return "Email is required"
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address"
    }
    return ""
  }

  const validatePassword = (value: string) => {
    if (!value) {
      return "Password is required"
    }
    if (value.length < 6) {
      return "Password must be at least 6 characters"
    }
    return ""
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (emailTouched) {
      setEmailError(validateEmail(value))
    }
    setError("")
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    if (passwordTouched) {
      setPasswordError(validatePassword(value))
    }
    setError("")
  }

  const handleRoleChange = (value: string) => {
    setRole(value)
    if (roleTouched) {
      setRoleError(value ? "" : "Please select your role")
    }
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    setEmailTouched(true)
    setPasswordTouched(true)
    setRoleTouched(true)

    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)
    const roleErr = role ? "" : "Please select your role"

    setEmailError(emailErr)
    setPasswordError(passwordErr)
    setRoleError(roleErr)

    if (emailErr || passwordErr || roleErr) {
      return
    }

    setIsLoading(true)

    try {
      const response = await authAPI.login(email, password, role)
      
      if (response.token && response.user) {
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email)
          localStorage.setItem("rememberedRole", role)
          localStorage.setItem("rememberMe", "true")
        } else {
          localStorage.removeItem("rememberedEmail")
          localStorage.removeItem("rememberedRole")
          localStorage.removeItem("rememberMe")
        }

        await refreshUser()

        if (role === "student") {
          window.location.href = "/student/dashboard"
        } else if (role === "supervisor") {
          window.location.href = "/supervisor/dashboard"
        } else if (role === "administrator") {
          window.location.href = "/admin/dashboard"
        }
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error: any) {
      const errorMessage = error.message || "Invalid credentials. Please check your email, password, and role."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* UTMGradient Logo */}
      <div className="auth-logo-container" style={{ position: 'relative', marginBottom: '30px' }}>
        <div className="auth-logo">
          <span className="logo-utm">UTM</span>
          <span className="logo-gradient">Gradient</span>
        </div>
        <div className="logo-underline"></div>
      </div>

      <p style={{ 
        fontSize: '15px', 
        color: '#6b7280', 
        marginBottom: '32px',
        fontWeight: '400',
        lineHeight: '1.6',
        letterSpacing: '0.2px'
      }}>
        Sign in to continue your academic journey
      </p>

      {error && (
        <div style={{ 
          padding: '16px 20px', 
          background: 'linear-gradient(135deg, rgba(254, 242, 242, 0.95) 0%, rgba(254, 226, 226, 0.95) 100%)', 
          border: '2px solid #fecaca', 
          borderRadius: '16px', 
          color: '#dc2626',
          fontSize: '14px',
          marginBottom: '24px',
          width: '100%',
          fontWeight: '600',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
          backdropFilter: 'blur(10px)'
        }}>
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ width: '100%' }} noValidate>
        <Input
          ref={emailInputRef}
          id="email"
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={handleEmailChange}
          onBlur={() => {
            setEmailTouched(true)
            setEmailError(validateEmail(email))
          }}
          onFocus={() => setError("")}
          required
          style={{
            borderColor: emailError && emailTouched ? '#fecaca' : undefined
          }}
        />
        {emailError && emailTouched && (
          <span style={{ 
            color: '#dc2626', 
            fontSize: '13px', 
            display: 'flex', 
            alignItems: 'center',
            gap: '6px',
            marginTop: '6px', 
            marginBottom: '8px', 
            fontWeight: '600', 
            textAlign: 'left',
            paddingLeft: '4px'
          }}>
            <AlertCircle className="h-4 w-4" />
            {emailError}
          </span>
        )}

        <div style={{ position: 'relative', width: '100%' }}>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => {
              setPasswordTouched(true)
              setPasswordError(validatePassword(password))
            }}
            onFocus={() => setError("")}
            required
            style={{
              borderColor: passwordError && passwordTouched ? '#fecaca' : undefined,
              paddingRight: '48px'
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: '#6b7280',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139, 0, 35, 0.08)'
              e.currentTarget.style.color = '#8b0023'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#6b7280'
            }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {passwordError && passwordTouched && (
          <span style={{ 
            color: '#dc2626', 
            fontSize: '13px', 
            display: 'flex', 
            alignItems: 'center',
            gap: '6px',
            marginTop: '6px', 
            marginBottom: '8px', 
            fontWeight: '600', 
            textAlign: 'left',
            paddingLeft: '4px'
          }}>
            <AlertCircle className="h-4 w-4" />
            {passwordError}
          </span>
        )}

        <Select value={role} onValueChange={handleRoleChange} required>
          <SelectTrigger 
            id="role" 
            style={{
              width: '100%',
              background: '#f3f4f6',
              border: '2px solid transparent',
              borderRadius: '12px',
              padding: '14px 18px'
            }}
            onBlur={() => setRoleTouched(true)}
          >
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
            <SelectItem value="administrator">Administrator</SelectItem>
          </SelectContent>
        </Select>
        {roleError && roleTouched && (
          <span style={{ 
            color: '#dc2626', 
            fontSize: '13px', 
            display: 'flex', 
            alignItems: 'center',
            gap: '6px',
            marginTop: '6px', 
            marginBottom: '8px', 
            fontWeight: '600', 
            textAlign: 'left',
            paddingLeft: '4px'
          }}>
            <AlertCircle className="h-4 w-4" />
            {roleError}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px', width: '100%', justifyContent: 'flex-start' }}>
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            aria-label="Remember me on this device"
            className="auth-checkbox"
            style={{
              width: '16px',
              height: '16px',
              minWidth: '16px',
              minHeight: '16px'
            }}
          />
          <Label 
            htmlFor="remember" 
            style={{ fontSize: '14px', color: '#4b5563', cursor: 'pointer', fontWeight: '500', userSelect: 'none', margin: 0 }}
          >
            Remember me
          </Label>
        </div>

        <Link 
          href="/forgot-password" 
          style={{ fontSize: '13px', color: '#8b0023', marginTop: '12px', display: 'block', fontWeight: '500', transition: 'color 0.2s ease' }}
        >
          Forgot your password?
        </Link>

        <button 
          type="submit" 
          disabled={isLoading} 
          style={{ 
            marginTop: '28px', 
            width: '160px',
            height: '48px',
            padding: '0',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #8b0023 0%, #a02040 50%, #8b0023 100%)',
            backgroundSize: '200% 200%',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(139, 0, 35, 0.4)',
            fontFamily: "'Poppins', sans-serif",
            opacity: isLoading ? 0.7 : 1,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 0, 35, 0.5)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 0, 35, 0.4)'
            }
          }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#FFFFFF' }}>
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#FFFFFF' }} />
              <span style={{ color: '#FFFFFF' }}>Signing in...</span>
            </span>
          ) : (
            <span style={{ position: 'relative', zIndex: 1, color: '#FFFFFF', fontWeight: '700' }}>SIGN IN</span>
          )}
        </button>
      </form>
    </>
  )
}
