"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { authAPI } from "@/lib/api"
import Link from "next/link"
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      setStatus("error")
      setMessage("Invalid verification link. No token provided.")
      return
    }

    // Verify email with token
    const verifyEmail = async () => {
      try {
        const response = await authAPI.verifyEmail(token)
        setStatus("success")
        setMessage(response.message || "Email verified successfully!")
        
        toast({
          title: "Email Verified",
          description: "Your email has been verified. You can now log in.",
        })

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/")
        }, 3000)
      } catch (error: any) {
        setStatus("error")
        setMessage(error.message || "Failed to verify email. The link may be invalid or expired.")
        
        toast({
          title: "Verification Failed",
          description: error.message || "Failed to verify email. Please try again.",
          variant: "destructive",
        })
      }
    }

    verifyEmail()
  }, [searchParams, router, toast])

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to resend the verification email.",
        variant: "destructive",
      })
      return
    }

    try {
      await authAPI.resendVerification(email)
      toast({
        title: "Verification Email Sent",
        description: "A new verification email has been sent to your inbox.",
      })
    } catch (error: any) {
      toast({
        title: "Failed to Resend",
        description: error.message || "Failed to resend verification email. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "verifying" && (
              <Loader2 className="h-16 w-16 text-purple-600 animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            )}
            {status === "error" && (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "verifying" && "Verifying Your Email"}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription>
            {status === "verifying" && "Please wait while we verify your email address..."}
            {status === "success" && "Your email has been successfully verified."}
            {status === "error" && "We couldn't verify your email address."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            {message}
          </p>

          {status === "success" && (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Redirecting you to the login page...
              </p>
              <Button asChild className="w-full">
                <Link href="/">Go to Login</Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Need help?</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• The verification link may have expired (links expire after 24 hours)</li>
                  <li>• The link may have already been used</li>
                  <li>• Check your email for a new verification link</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Resend Verification Email
                </label>
                <div className="flex gap-2">
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button
                    onClick={handleResendVerification}
                    variant="outline"
                    className="shrink-0"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Resend
                  </Button>
                </div>
              </div>

              <Button asChild className="w-full" variant="outline">
                <Link href="/">Back to Login</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

