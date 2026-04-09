"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { authAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2, AlertCircle } from "lucide-react"

interface SignupFormProps {
  onBackToLogin: () => void
}

export function SignupForm({ onBackToLogin }: SignupFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [role] = useState("student") // Fixed to student only
  const [phone, setPhone] = useState("")
  const [program, setProgram] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.")
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Validate program is required for student registration
    if (!program) {
      toast({
        title: "Program Required",
        description: "Please select a program for student registration.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const userData: any = {
        email,
        password,
        name,
        role: "student", // Only students can register
        program,
      }

      if (phone) userData.phone = phone

      const response = await authAPI.register(userData)

      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account before logging in.",
        duration: 6000,
      })

      setTimeout(() => {
        onBackToLogin()
      }, 2000)
    } catch (error: any) {
      const errorMessage = error.message || "Failed to create account. Please try again."
      setError(errorMessage)
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <h1 style={{
        fontWeight: '900',
        margin: '0 0 24px 0',
        fontSize: '42px',
        color: '#1a1a1a',
        letterSpacing: '-1px',
        textShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
      }}>Create Account</h1>
      <p style={{ 
        fontSize: '16px', 
        color: '#6b7280', 
        marginBottom: '36px',
        fontWeight: '500',
        lineHeight: '1.7',
        letterSpacing: '0.3px'
      }}>
        Join us today and start your journey
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

      <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }} noValidate>
        <Input
          ref={nameInputRef}
          id="name"
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          id="email"
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <Input
          id="phone"
          type="tel"
          placeholder="Phone Number (Optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Select value={program} onValueChange={setProgram} required>
          <SelectTrigger 
            id="program" 
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
              border: '2px solid rgba(102, 126, 234, 0.1)',
              borderRadius: '16px',
              padding: '16px 20px',
              fontSize: '15px',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
            }}
          >
            <SelectValue placeholder="Select your program" />
          </SelectTrigger>
          <SelectContent style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <SelectItem value="Doctor of Philosophy (PhD) Field: Computer Science">
              Doctor of Philosophy (PhD) Field: Computer Science
            </SelectItem>
            <SelectItem value="Doctor of Philosophy (PhD) Field: Software Engineering">
              Doctor of Philosophy (PhD) Field: Software Engineering
            </SelectItem>
            <SelectItem value="Doctor of Philosophy (PhD) Field: Informatics Engineering">
              Doctor of Philosophy (PhD) Field: Informatics Engineering
            </SelectItem>
            <SelectItem value="Master of Science (Field: Computer Science)">
              Master of Science (Field: Computer Science)
            </SelectItem>
            <SelectItem value="Master by Research / Master of Philosophy (MPhil) (Field: Computer Science)">
              Master by Research / Master of Philosophy (MPhil) (Field: Computer Science)
            </SelectItem>
          </SelectContent>
        </Select>

        <button 
          type="submit" 
          disabled={isLoading} 
          style={{ 
            marginTop: '24px', 
            width: '160px',
            height: '45px',
            padding: '0',
            borderRadius: '50px',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            backgroundSize: '200% 200%',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: '600',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
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
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
            }
          }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#FFFFFF' }}>
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#FFFFFF' }} />
              <span style={{ color: '#FFFFFF' }}>Creating Account...</span>
            </span>
          ) : (
            <span style={{ position: 'relative', zIndex: 1, color: '#FFFFFF', fontWeight: '600' }}>SIGN UP</span>
          )}
        </button>
      </form>
    </>
  )
}

