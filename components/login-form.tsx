"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Login attempt:", { email, password, role, rememberMe })

    // Simulate login and redirect based on role
    if (role === "student") {
      router.push("/student/dashboard")
    } else if (role === "supervisor") {
      router.push("/supervisor/dashboard")
    } else if (role === "administrator") {
      router.push("/admin/dashboard")
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-card rounded-xl shadow-lg p-8 border border-border">
        <h2 className="text-2xl font-bold mb-6 text-card-foreground">Sign in</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-card-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-card-foreground">
                Password
              </Label>
              <Link href="/forgot-password" className="text-sm text-accent hover:underline">
                Forgot your password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium text-card-foreground">
              Role
            </Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger id="role" className="h-11">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="administrator">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
              Remember me
            </Label>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            Sign in
          </Button>
        </form>

        {/* Sign Up Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {"Don't have an account? "}
          <Link href="/signup" className="text-accent hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
