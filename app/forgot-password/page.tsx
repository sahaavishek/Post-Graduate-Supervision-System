"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { authAPI } from "@/lib/api"
import Link from "next/link"
import { ArrowLeft, Mail, KeyRound, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import "../auth.css"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "verify" | "reset">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [codeError, setCodeError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const emailInputRef = useRef<HTMLInputElement>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (step === "email") {
      emailInputRef.current?.focus()
    } else if (step === "verify") {
      codeInputRef.current?.focus()
    }
  }, [step])

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
      return "Password must be at least 6 characters long"
    }
    return ""
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    const emailErr = validateEmail(email)
    setEmailError(emailErr)
    
    if (emailErr) {
      toast({
        title: "Invalid Email",
        description: emailErr,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await authAPI.forgotPassword(email)
      toast({
        title: "Code Sent",
        description: response.message || "Verification code has been sent to your email",
        duration: 6000,
      })
      
      // In development, show code in console
      if (response.code) {
        console.log("Verification Code (Development):", response.code)
        toast({
          title: "Development Mode",
          description: `Code: ${response.code} (Check console for details)`,
          duration: 8000,
        })
      }
      
      setStep("verify")
    } catch (error: any) {
      const errorMessage = error.message || "Failed to send verification code. Please try again."
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!code || code.length !== 6) {
      const codeErr = "Please enter the 6-digit verification code"
      setCodeError(codeErr)
      toast({
        title: "Invalid Code",
        description: codeErr,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await authAPI.verifyResetCode(email, code)
      toast({
        title: "Code Verified",
        description: "Verification code is valid. Please enter your new password.",
      })
      setStep("reset")
    } catch (error: any) {
      const errorMessage = error.message || "Invalid or expired verification code. Please try again."
      setCodeError(errorMessage)
      toast({
        title: "Invalid Code",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    const passwordErr = validatePassword(newPassword)
    const confirmErr = newPassword !== confirmPassword ? "Passwords do not match" : ""
    
    setPasswordError(passwordErr)
    setConfirmPasswordError(confirmErr)
    
    if (passwordErr || confirmErr) {
      toast({
        title: "Validation Error",
        description: passwordErr || confirmErr,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await authAPI.resetPassword(email, code, newPassword)
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. Redirecting to login...",
        duration: 3000,
      })
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/"
      }, 2000)
    } catch (error: any) {
      const errorMessage = error.message || "Failed to reset password. Please try again."
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-wrapper" style={{ width: '500px', maxWidth: '100%' }}>
        <div className="auth-form-box login-form-box" style={{ width: '100%', position: 'static' }}>
          <div className="auth-form">
            {/* Header */}
            <div style={{ width: '100%', marginBottom: '30px' }}>
              <Link 
                href="/" 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  color: '#667eea', 
                  textDecoration: 'none',
                  marginBottom: '20px',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#764ba2'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#667eea'}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
              <h1 style={{ marginBottom: '10px' }}>
                {step === "email" && "Reset Password"}
                {step === "verify" && "Verify Code"}
                {step === "reset" && "New Password"}
              </h1>
              <span style={{ fontSize: '14px', color: '#666', marginTop: '0' }}>
                {step === "email" && "Enter your email address to receive a verification code"}
                {step === "verify" && "Enter the 6-digit code sent to your email"}
                {step === "reset" && "Enter your new password"}
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{ 
                padding: '14px 16px', 
                background: '#fef2f2', 
                border: '1px solid #fecaca', 
                borderRadius: '12px', 
                color: '#dc2626',
                fontSize: '14px',
                marginBottom: '20px',
                width: '100%',
                fontWeight: '500',
                textAlign: 'left'
              }}>
                {error}
              </div>
            )}

            {/* Step 1: Email */}
            {step === "email" && (
              <form onSubmit={handleSendCode} style={{ width: '100%' }} noValidate>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Mail 
                    className="h-5 w-5" 
                    style={{ 
                      position: 'absolute', 
                      left: '18px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: '#9ca3af',
                      pointerEvents: 'none',
                      zIndex: 10
                    }} 
                  />
                  <Input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setEmailError("")
                      setError("")
                    }}
                    onBlur={() => setEmailError(validateEmail(email))}
                    required
                    style={{
                      paddingLeft: '50px',
                      borderColor: emailError ? '#fca5a5' : 'transparent'
                    }}
                  />
                </div>
                {emailError && (
                  <span style={{ color: '#dc2626', fontSize: '13px', display: 'block', marginTop: '4px', marginBottom: '8px', fontWeight: '500', textAlign: 'left' }}>
                    {emailError}
                  </span>
                )}
                <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px', marginBottom: '20px', textAlign: 'left' }}>
                  A verification code will be sent to this email address
                </p>
                <button type="submit" disabled={isLoading} style={{ marginTop: '10px', width: '100%' }}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" style={{ display: 'inline-block', marginRight: '8px' }} />
                      Sending...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Verify Code */}
            {step === "verify" && (
              <form onSubmit={handleVerifyCode} style={{ width: '100%' }} noValidate>
                <div style={{ marginBottom: '20px' }}>
                  <Label style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500', marginBottom: '8px', display: 'block', textAlign: 'left' }}>
                    Email Address
                  </Label>
                  <Input
                    id="email-display"
                    type="email"
                    value={email}
                    disabled
                    style={{
                      background: '#f3f4f6',
                      color: '#6b7280',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>
                <div style={{ position: 'relative', width: '100%' }}>
                  <KeyRound 
                    className="h-5 w-5" 
                    style={{ 
                      position: 'absolute', 
                      left: '18px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: '#9ca3af',
                      pointerEvents: 'none',
                      zIndex: 10
                    }} 
                  />
                  <Input
                    ref={codeInputRef}
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                      setCode(value)
                      setCodeError("")
                      setError("")
                    }}
                    required
                    maxLength={6}
                    style={{
                      paddingLeft: '50px',
                      textAlign: 'center',
                      fontSize: '18px',
                      letterSpacing: '8px',
                      fontFamily: 'monospace',
                      borderColor: codeError ? '#fca5a5' : 'transparent'
                    }}
                  />
                </div>
                {codeError && (
                  <span style={{ color: '#dc2626', fontSize: '13px', display: 'block', marginTop: '4px', marginBottom: '8px', fontWeight: '500', textAlign: 'left' }}>
                    {codeError}
                  </span>
                )}
                <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px', marginBottom: '20px', textAlign: 'left' }}>
                  Enter the 6-digit code sent to your email. Code expires in 15 minutes.
                </p>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email")
                      setCode("")
                      setCodeError("")
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: '2px solid #e5e7eb',
                      color: '#4b5563',
                      boxShadow: 'none'
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || code.length !== 6}
                    style={{ flex: 1 }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" style={{ display: 'inline-block', marginRight: '8px' }} />
                        Verifying...
                      </>
                    ) : (
                      "Verify Code"
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: '#667eea',
                    boxShadow: 'none',
                    fontSize: '13px',
                    fontWeight: '500',
                    padding: '10px'
                  }}
                >
                  Resend Code
                </button>
              </form>
            )}

            {/* Step 3: Reset Password */}
            {step === "reset" && (
              <form onSubmit={handleResetPassword} style={{ width: '100%' }} noValidate>
                <div style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
                  <Lock 
                    className="h-5 w-5" 
                    style={{ 
                      position: 'absolute', 
                      left: '18px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: '#9ca3af',
                      pointerEvents: 'none',
                      zIndex: 10
                    }} 
                  />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setPasswordError("")
                      setError("")
                    }}
                    onBlur={() => setPasswordError(validatePassword(newPassword))}
                    required
                    minLength={6}
                    style={{
                      paddingLeft: '50px',
                      paddingRight: '45px',
                      borderColor: passwordError ? '#fca5a5' : 'transparent'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '5px',
                      color: '#666'
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordError && (
                  <span style={{ color: '#dc2626', fontSize: '13px', display: 'block', marginTop: '-15px', marginBottom: '8px', fontWeight: '500', textAlign: 'left' }}>
                    {passwordError}
                  </span>
                )}
                <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '-8px', marginBottom: '20px', textAlign: 'left' }}>
                  Password must be at least 6 characters long
                </p>

                <div style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
                  <Lock 
                    className="h-5 w-5" 
                    style={{ 
                      position: 'absolute', 
                      left: '18px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: '#9ca3af',
                      pointerEvents: 'none',
                      zIndex: 10
                    }} 
                  />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setConfirmPasswordError("")
                      setError("")
                    }}
                    onBlur={() => {
                      if (newPassword !== confirmPassword) {
                        setConfirmPasswordError("Passwords do not match")
                      } else {
                        setConfirmPasswordError("")
                      }
                    }}
                    required
                    minLength={6}
                    style={{
                      paddingLeft: '50px',
                      paddingRight: '45px',
                      borderColor: confirmPasswordError ? '#fca5a5' : 'transparent'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '15px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '5px',
                      color: '#666'
                    }}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {confirmPasswordError && (
                  <span style={{ color: '#dc2626', fontSize: '13px', display: 'block', marginTop: '-15px', marginBottom: '8px', fontWeight: '500', textAlign: 'left' }}>
                    {confirmPasswordError}
                  </span>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("verify")
                      setNewPassword("")
                      setConfirmPassword("")
                      setPasswordError("")
                      setConfirmPasswordError("")
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: '2px solid #e5e7eb',
                      color: '#4b5563',
                      boxShadow: 'none'
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                    style={{ flex: 1 }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" style={{ display: 'inline-block', marginRight: '8px' }} />
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
