"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PageHeader } from "@/components/ui/page-header"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { CheckCircle, AlertCircle } from "lucide-react"

export default function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    jobTitle: "",
    bio: "",
  })

  // Load profile from Supabase on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) { setLoading(false); return }

      // Start with auth metadata
      setFormData({
        fullName: user.user_metadata?.full_name || "",
        email: user.email || "",
        phone: "",
        location: "",
        jobTitle: "",
        bio: "",
      })

      // Load extended profile from user_profiles table
      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (data?.personal_info) {
        setFormData({
          fullName: data.personal_info.fullName || user.user_metadata?.full_name || "",
          email: user.email || "",
          phone: data.personal_info.phone || "",
          location: data.personal_info.location || "",
          jobTitle: data.personal_info.jobTitle || "",
          bio: data.summary || "",
        })
      }

      setLoading(false)
    }

    loadProfile()
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)

    // Update Supabase auth metadata (full name)
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: formData.fullName }
    })

    if (authError) {
      setError(authError.message)
      setSaving(false)
      return
    }

    // Upsert user_profiles table
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        user_id: user.id,
        personal_info: {
          fullName: formData.fullName,
          phone: formData.phone,
          location: formData.location,
          jobTitle: formData.jobTitle,
        },
        summary: formData.bio,
      }, { onConflict: "user_id" })

    if (profileError) {
      setError(profileError.message)
    } else {
      setSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    }

    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="My Profile"
        description="Manage your personal information and preferences"
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">Profile saved successfully.</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)} disabled={loading}>
                Edit Profile
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="+27 11 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      disabled={!isEditing}
                      placeholder="City, Province"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      disabled={!isEditing}
                      placeholder="e.g. Software Developer"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Tell us about your professional background..."
                    rows={4}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-right">
          <Link href="/profile/password" className="text-sm text-blue-600 hover:text-blue-500">
            Change password →
          </Link>
        </div>
      </div>
    </div>
  )
}
