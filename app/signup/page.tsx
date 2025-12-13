"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Mail, Lock, User, Phone, GraduationCap, Building2, Loader2, UserPlus, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [phone, setPhone] = useState("")
  const [program, setProgram] = useState("")
  const [department, setDepartment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus name field on mount
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

    try {
      const userData: any = {
        email,
        password,
        name,
        role,
      }

      if (phone) userData.phone = phone
      if (role === "student") {
        if (!program) {
          toast({
            title: "Program Required",
            description: "Please select a program for student registration.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
        userData.program = program
      }
      if (role === "supervisor") {
        if (!department) {
          toast({
            title: "Department Required",
            description: "Please select a department for supervisor registration.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
        userData.department = department
      }
      if (role === "administrator" && department) {
        userData.department = department
      }

      const response = await authAPI.register(userData)

      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account before logging in.",
        duration: 6000,
      })

      // Show success message and redirect to login
      // The user needs to verify their email first
      setTimeout(() => {
        router.push("/")
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Optimized gradient background - Reduced layers for performance */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-red-50/15 to-slate-50/40 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(185,28,28,0.04),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(71,85,105,0.03),transparent_60%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(100,116,139,0.06),transparent_60%)]" />
      </div>

      {/* Optimized grid pattern - Simplified */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f008_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Optimized floating orbs - Reduced blur for performance */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-red-600/6 dark:bg-red-700/10 rounded-full blur-2xl" style={{ animation: 'pulse 8s ease-in-out infinite' }} />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-slate-500/4 dark:bg-slate-600/8 rounded-full blur-2xl" style={{ animation: 'pulse 10s ease-in-out infinite 2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/3 dark:bg-blue-600/6 rounded-full blur-3xl" style={{ animation: 'pulse 12s ease-in-out infinite 4s' }} />

      {/* Academic-themed decorative elements */}
      <div className="absolute top-10 right-10 w-32 h-32 opacity-5 dark:opacity-10">
        <svg viewBox="0 0 100 100" className="w-full h-full text-slate-600 dark:text-slate-400">
          <path d="M50 10 L60 40 L90 40 L70 60 L80 90 L50 70 L20 90 L30 60 L10 40 L40 40 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute bottom-10 left-10 w-24 h-24 opacity-5 dark:opacity-10">
        <svg viewBox="0 0 100 100" className="w-full h-full text-red-600 dark:text-red-500">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="50" cy="50" r="10" fill="currentColor" />
        </svg>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        {/* Professional card with sophisticated color grading */}
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.4)] p-8 border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
          {/* Professional multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/60 via-white/40 to-blue-50/30 dark:from-slate-800/40 dark:via-slate-900/60 dark:to-slate-800/30 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(148,163,184,0.08),transparent_60%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(71,85,105,0.12),transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(99,102,241,0.06),transparent_60%)] dark:bg-[radial-gradient(circle_at_100%_100%,rgba(129,140,248,0.1),transparent_60%)] pointer-events-none" />
          
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-1000 ease-out pointer-events-none" />
          
          <div className="relative z-10">
            {/* Logo/Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 dark:from-slate-500 dark:via-slate-400 dark:to-slate-600 mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.25),0_2px_4px_rgba(0,0,0,0.15)] ring-1 ring-slate-300/20 dark:ring-slate-600/30">
                <UserPlus className="h-8 w-8 text-white drop-shadow-sm" />
              </div>
              <h2 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 bg-clip-text text-transparent tracking-tight">
                Create Account
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Join us to get started with your journey
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50/90 via-red-50/70 to-red-50/90 dark:from-red-950/50 dark:via-red-950/40 dark:to-red-950/50 border border-red-200/60 dark:border-red-800/50 rounded-xl flex items-start gap-3 shadow-[0_4px_12px_-2px_rgba(239,68,68,0.15)] dark:shadow-[0_4px_12px_-2px_rgba(220,38,38,0.2)] backdrop-blur-sm animate-in slide-in-from-top duration-200">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-red-500/25 to-red-600/25 dark:from-red-500/35 dark:to-red-600/35 flex items-center justify-center mt-0.5 ring-1 ring-red-300/40 dark:ring-red-700/40">
                  <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 font-medium leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* First Row: Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div className="space-y-2.5">
                  <Label htmlFor="name" className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-slate-700 dark:group-focus-within:text-slate-300 transition-colors duration-200 z-10">
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      ref={nameInputRef}
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={cn(
                        "h-12 pl-11 pr-4 text-base rounded-xl border-2 transition-all duration-200",
                        "bg-gradient-to-br from-white/95 to-slate-50/95 dark:from-slate-800/95 dark:to-slate-900/95 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
                        "focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_4px_12px_-2px_rgba(71,85,105,0.15)] dark:focus:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]",
                        "border-slate-300/70 dark:border-slate-600/70 focus-visible:border-slate-500 dark:focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-500/20 dark:focus-visible:ring-slate-400/20"
                      )}
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-slate-700 dark:group-focus-within:text-slate-300 transition-colors duration-200 z-10">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={cn(
                        "h-12 pl-11 pr-4 text-base rounded-xl border-2 transition-all duration-200",
                        "bg-gradient-to-br from-white/95 to-slate-50/95 dark:from-slate-800/95 dark:to-slate-900/95 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
                        "focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_4px_12px_-2px_rgba(71,85,105,0.15)] dark:focus:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]",
                        "border-slate-300/70 dark:border-slate-600/70 focus-visible:border-slate-500 dark:focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-500/20 dark:focus-visible:ring-slate-400/20"
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Second Row: Password and Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Password Field */}
                <div className="space-y-2.5">
                  <Label htmlFor="password" className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-slate-700 dark:group-focus-within:text-slate-300 transition-colors duration-200 z-10">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className={cn(
                        "h-12 pl-11 pr-4 text-base rounded-xl border-2 transition-all duration-200",
                        "bg-gradient-to-br from-white/95 to-slate-50/95 dark:from-slate-800/95 dark:to-slate-900/95 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
                        "focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_4px_12px_-2px_rgba(71,85,105,0.15)] dark:focus:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]",
                        "border-slate-300/70 dark:border-slate-600/70 focus-visible:border-slate-500 dark:focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-500/20 dark:focus-visible:ring-slate-400/20"
                      )}
                    />
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    Confirm Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-slate-700 dark:group-focus-within:text-slate-300 transition-colors duration-200 z-10">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={cn(
                        "h-12 pl-11 pr-4 text-base rounded-xl border-2 transition-all duration-200",
                        "bg-gradient-to-br from-white/95 to-slate-50/95 dark:from-slate-800/95 dark:to-slate-900/95 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
                        "focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_4px_12px_-2px_rgba(71,85,105,0.15)] dark:focus:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]",
                        "border-slate-300/70 dark:border-slate-600/70 focus-visible:border-slate-500 dark:focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-500/20 dark:focus-visible:ring-slate-400/20"
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Third Row: Role and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role Selection */}
                <div className="space-y-2.5 relative z-10">
                  <Label htmlFor="role" className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    Role <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-slate-700 dark:group-focus-within:text-slate-300 transition-colors duration-200 z-10 pointer-events-none">
                      <User className="h-4 w-4" />
                    </div>
                    <Select value={role} onValueChange={setRole} required>
                      <SelectTrigger 
                        id="role" 
                        className={cn(
                          "h-12 pl-11 rounded-xl border-2 text-base transition-all duration-200",
                          "bg-gradient-to-br from-white/95 to-slate-50/95 dark:from-slate-800/95 dark:to-slate-900/95 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
                          "focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_4px_12px_-2px_rgba(71,85,105,0.15)] dark:focus:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]",
                          "border-slate-300/70 dark:border-slate-600/70 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-2 focus:ring-slate-500/20 dark:focus:ring-slate-400/20"
                        )}
                      >
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl dark:shadow-2xl z-50">
                        <SelectItem 
                          value="student" 
                          className="rounded-lg px-4 py-3 text-base font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-900 dark:data-[highlighted]:text-slate-100"
                        >
                          Student
                        </SelectItem>
                        <SelectItem 
                          value="supervisor" 
                          className="rounded-lg px-4 py-3 text-base font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-900 dark:data-[highlighted]:text-slate-100"
                        >
                          Supervisor
                        </SelectItem>
                        <SelectItem 
                          value="administrator" 
                          className="rounded-lg px-4 py-3 text-base font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-900 dark:data-[highlighted]:text-slate-100"
                        >
                          Administrator
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-2.5">
                  <Label htmlFor="phone" className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    Phone Number
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-slate-700 dark:group-focus-within:text-slate-300 transition-colors duration-200 z-10">
                      <Phone className="h-4 w-4" />
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+60 12-345 6789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={cn(
                        "h-12 pl-11 pr-4 text-base rounded-xl border-2 transition-all duration-200",
                        "bg-gradient-to-br from-white/95 to-slate-50/95 dark:from-slate-800/95 dark:to-slate-900/95 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
                        "focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_4px_12px_-2px_rgba(71,85,105,0.15)] dark:focus:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]",
                        "border-slate-300/70 dark:border-slate-600/70 focus-visible:border-slate-500 dark:focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-500/20 dark:focus-visible:ring-slate-400/20"
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Program Field (for students) */}
              {role === "student" && (
                <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
                  <Label htmlFor="program" className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    Program <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-slate-700 dark:group-focus-within:text-slate-300 transition-colors duration-200 z-10 pointer-events-none">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <Select value={program} onValueChange={setProgram} required>
                      <SelectTrigger 
                        id="program" 
                        className={cn(
                          "h-12 pl-11 rounded-xl border-2 text-base transition-all duration-200",
                          "bg-gradient-to-br from-white/95 to-slate-50/95 dark:from-slate-800/95 dark:to-slate-900/95 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
                          "focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_4px_12px_-2px_rgba(71,85,105,0.15)] dark:focus:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]",
                          "border-slate-300/70 dark:border-slate-600/70 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-2 focus:ring-slate-500/20 dark:focus:ring-slate-400/20"
                        )}
                      >
                        <SelectValue placeholder="Select your program" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl dark:shadow-2xl z-50 max-h-[300px] overflow-y-auto">
                        <SelectItem 
                          value="Doctor of Philosophy (PhD) Field: Computer Science"
                          className="rounded-lg px-4 py-3 text-base font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-900 dark:data-[highlighted]:text-slate-100"
                        >
                          Doctor of Philosophy (PhD) Field: Computer Science
                        </SelectItem>
                        <SelectItem 
                          value="Doctor of Philosophy (PhD) Field: Software Engineering"
                          className="rounded-lg px-4 py-3 text-base font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-900 dark:data-[highlighted]:text-slate-100"
                        >
                          Doctor of Philosophy (PhD) Field: Software Engineering
                        </SelectItem>
                        <SelectItem 
                          value="Doctor of Philosophy (PhD) Field: Informatics Engineering"
                          className="rounded-lg px-4 py-3 text-base font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-900 dark:data-[highlighted]:text-slate-100"
                        >
                          Doctor of Philosophy (PhD) Field: Informatics Engineering
                        </SelectItem>
                        <SelectItem 
                          value="Master of Science (Field: Computer Science)"
                          className="rounded-lg px-4 py-3 text-base font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-900 dark:data-[highlighted]:text-slate-100"
                        >
                          Master of Science (Field: Computer Science)
                        </SelectItem>
                        <SelectItem 
                          value="Master by Research / Master of Philosophy (MPhil) (Field: Computer Science)"
                          className="rounded-lg px-4 py-3 text-base font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-900 dark:data-[highlighted]:text-slate-100"
                        >
                          Master by Research / Master of Philosophy (MPhil) (Field: Computer Science)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Department Field (for supervisors) */}
              {role === "supervisor" && (
                <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
                  <Label htmlFor="department" className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    Department <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-slate-700 dark:group-focus-within:text-slate-300 transition-colors duration-200 z-10 pointer-events-none">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <Select value={department} onValueChange={setDepartment} required>
                      <SelectTrigger 
                        id="department" 
                        className={cn(
                          "h-12 pl-11 rounded-xl border-2 text-base transition-all duration-200",
                          "bg-gradient-to-br from-white/95 to-slate-50/95 dark:from-slate-800/95 dark:to-slate-900/95 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
                          "focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_4px_12px_-2px_rgba(71,85,105,0.15)] dark:focus:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]",
                          "border-slate-300/70 dark:border-slate-600/70 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-2 focus:ring-slate-500/20 dark:focus:ring-slate-400/20"
                        )}
                      >
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl dark:shadow-2xl z-50">
                        <SelectItem 
                          value="Computer Science"
                          className="rounded-lg px-4 py-3 text-base font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-900 dark:data-[highlighted]:text-slate-100"
                        >
                          Computer Science
                        </SelectItem>
                        <SelectItem 
                          value="Software Engineering"
                          className="rounded-lg px-4 py-3 text-base font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-900 dark:data-[highlighted]:text-slate-100"
                        >
                          Software Engineering
                        </SelectItem>
                        <SelectItem 
                          value="Informatics Engineering"
                          className="rounded-lg px-4 py-3 text-base font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800 data-[highlighted]:text-slate-900 dark:data-[highlighted]:text-slate-100"
                        >
                          Informatics Engineering
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Department Field (for administrators - optional text input) */}
              {role === "administrator" && (
                <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="department" className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    Department
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-slate-700 dark:group-focus-within:text-slate-300 transition-colors duration-200 z-10">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <Input
                      id="department"
                      type="text"
                      placeholder="Computer Science"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className={cn(
                        "h-12 pl-11 pr-4 text-base rounded-xl border-2 transition-all duration-200",
                        "bg-gradient-to-br from-white/95 to-slate-50/95 dark:from-slate-800/95 dark:to-slate-900/95 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
                        "focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_4px_12px_-2px_rgba(71,85,105,0.15)] dark:focus:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]",
                        "border-slate-300/70 dark:border-slate-600/70 focus-visible:border-slate-500 dark:focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-500/20 dark:focus-visible:ring-slate-400/20"
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Sign Up Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-800 hover:from-slate-800 hover:via-slate-700 hover:to-slate-900 dark:from-slate-500 dark:via-slate-400 dark:to-slate-600 dark:hover:from-slate-600 dark:hover:via-slate-500 dark:hover:to-slate-700 text-white font-semibold text-base rounded-xl shadow-[0_8px_16px_-4px_rgba(71,85,105,0.4)] dark:shadow-[0_8px_16px_-4px_rgba(148,163,184,0.3)] hover:shadow-[0_12px_24px_-4px_rgba(71,85,105,0.5)] dark:hover:shadow-[0_12px_24px_-4px_rgba(148,163,184,0.4)] ring-1 ring-slate-600/20 dark:ring-slate-400/20 hover:ring-slate-600/30 dark:hover:ring-slate-400/30 transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_8px_16px_-4px_rgba(71,85,105,0.4)] disabled:hover:ring-slate-600/20 group relative overflow-hidden"
                disabled={isLoading}
                aria-busy={isLoading}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-8 pt-6 border-t border-gradient-to-r from-transparent via-slate-200/60 dark:via-slate-700/60 to-transparent">
              <p className="text-center text-sm text-slate-600 dark:text-slate-400 font-medium">
                Already have an account?{" "}
                <Link 
                  href="/" 
                  className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-semibold transition-all duration-200 hover:underline underline-offset-4 inline-flex items-center gap-1.5 group"
                >
                  <span className="bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-300 dark:to-slate-200 bg-clip-text text-transparent group-hover:from-slate-900 group-hover:to-slate-900 dark:group-hover:from-slate-100 dark:group-hover:to-slate-100">Sign in</span>
                  <svg className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-200 text-slate-700 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}










