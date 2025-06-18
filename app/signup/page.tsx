"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, FileText, CheckCircle, Info } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { signUp, isConfigured } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!isConfigured) {
      setError("Authentication is not configured. This is a demo environment.")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  const handleDemoSignup = () => {
    // Simulate successful signup for demo purposes
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>{isConfigured ? "Check your email" : "Demo Account Created"}</CardTitle>
              <CardDescription>
                {isConfigured
                  ? `We've sent you a confirmation link at ${email}`
                  : "Your demo account has been created successfully"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center mb-4">
                {isConfigured
                  ? "Click the link in the email to verify your account and complete your registration."
                  : "You can now explore the dashboard and CV builder features."}
              </p>
              <Link href={isConfigured ? "/login" : "/dashboard"}>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {isConfigured ? "Back to Sign In" : "Go to Dashboard"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">CVKonnekt</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">Join thousands of South Africans building professional CVs</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Create your free account to save and manage your CVs</CardDescription>
          </CardHeader>
          <CardContent>
            {!isConfigured && (
              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Demo Mode:</strong> Authentication is not configured in this environment. Click "Demo Sign Up"
                  to explore the features.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={!isConfigured}
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={!isConfigured}
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={!isConfigured}
                />
              </div>

              {isConfigured ? (
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              ) : (
                <Button type="button" onClick={handleDemoSignup} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Demo Sign Up
                </Button>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-emerald-600 hover:text-emerald-500 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
