"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Plus, Download, Edit3, Trash2, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSavedCVs, getSavedCoverLetters, deleteCV, deleteCoverLetter } from "@/lib/user-data-service"
import type { SavedCV, SavedCoverLetter } from "@/lib/user-data-service"

// Mock data for saved CVs - in a real app, this would come from Supabase
// const mockSavedCVs = [
//   {
//     id: 1,
//     name: "Software Developer CV",
//     template: "Modern Minimalist",
//     lastModified: "2024-01-15",
//     status: "Complete",
//   },
//   {
//     id: 2,
//     name: "Marketing Manager CV",
//     template: "Professional",
//     lastModified: "2024-01-10",
//     status: "Draft",
//   },
// ]

export default function DashboardPage() {
  const { user, loading, isConfigured } = useAuth()
  const router = useRouter()
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([])
  const [savedCoverLetters, setSavedCoverLetters] = useState<SavedCoverLetter[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)

  useEffect(() => {
    // Only redirect if auth is configured and user is not logged in
    if (!loading && isConfigured && !user) {
      router.push("/login?redirect=dashboard&message=Please sign in to access your dashboard")
    }
  }, [user, loading, router, isConfigured])

  // Check for unsaved draft CVs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const draftCV = localStorage.getItem('cv-draft')
      setHasDraft(!!draftCV)
    }
  }, [])

  // Load user's saved CVs and cover letters
  useEffect(() => {
    const loadUserData = async () => {
      if (!isConfigured || !user) return

      setIsLoading(true)
      const [cvsResult, coverLettersResult] = await Promise.all([getSavedCVs(), getSavedCoverLetters()])

      if (cvsResult.data) setSavedCVs(cvsResult.data)
      if (coverLettersResult.data) setSavedCoverLetters(coverLettersResult.data)
      setIsLoading(false)
    }

    loadUserData()
  }, [user, isConfigured])

  const handleDeleteCV = async (id: string) => {
    if (!confirm("Are you sure you want to delete this CV?")) return

    const { error } = await deleteCV(id)
    if (!error) {
      setSavedCVs(savedCVs.filter((cv) => cv.id !== id))
    }
  }

  const handleDeleteCoverLetter = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cover letter?")) return

    const { error } = await deleteCoverLetter(id)
    if (!error) {
      setSavedCoverLetters(savedCoverLetters.filter((cl) => cl.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (isConfigured && !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Demo Mode Alert */}
        {!isConfigured && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Demo Mode:</strong> You're viewing a demonstration of the dashboard. In a real environment, this
              would show your actual saved CVs and account data.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isConfigured ? "Welcome back!" : "Welcome to CVKonnekt!"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isConfigured
              ? "Manage your CVs and continue building your professional story."
              : "Explore the dashboard and CV builder features in demo mode."}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/create">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-emerald-200">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-lg">Create New CV</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>Start building a new CV from scratch with our professional templates.</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/cv-templates">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Browse Templates</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>Explore our collection of professionally designed CV templates.</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/create-cover-letter">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg">Create Cover Letter</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>Write a compelling cover letter to accompany your CV.</CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Unsaved Draft CV */}
        {hasDraft && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-amber-700">Unsaved Draft CV</h2>
            </div>
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                  <div className="mb-4 md:mb-0">
                    <p className="font-medium text-amber-800 mb-1">You have an unsaved CV draft</p>
                    <p className="text-sm text-amber-700">Your last CV was automatically saved while you were working on it.</p>
                  </div>
                  <div className="flex space-x-2">
                    <Link href="/create">
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                        <Edit3 className="h-4 w-4 mr-1" />
                        Continue Editing
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-amber-600 border-amber-300"
                      onClick={() => {
                        localStorage.removeItem('cv-draft');
                        setHasDraft(false);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Discard Draft
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Saved CVs */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{isConfigured ? "Your CVs" : "Demo CVs"}</h2>
            <Link href="/create">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                New CV
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your CVs...</p>
            </div>
          ) : savedCVs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedCVs.map((cv) => (
                <Card key={cv.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{cv.name}</CardTitle>
                        <CardDescription>{cv.template_name}</CardDescription>
                      </div>
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Saved
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Last modified: {new Date(cv.updated_at || cv.created_at || "").toLocaleDateString()}
                    </p>
                    <div className="flex space-x-2">
                      <Link href={`/create?cv=${cv.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteCV(cv.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No CVs yet</h3>
              <p className="text-gray-600 mb-4">Create your first CV to get started</p>
              <Link href="/create">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First CV
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Account Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isConfigured && user ? (
                <>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {user.email}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Member since:</span>{" "}
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Saved CVs:</span> {savedCVs.length}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Saved Cover Letters:</span> {savedCoverLetters.length}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="destructive" size="sm" onClick={() => setShowDeleteAccount(true)}>
                      Delete Account
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> demo@cvkonnekt.com
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Account Type:</span> Demo Account
                  </p>
                  <p className="text-sm text-gray-600">
                    To save your CVs and access all features, please set up authentication.
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delete Account Modal */}
        {showDeleteAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-2 text-red-600">Delete Account</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete your account? This action cannot be undone and will permanently delete:
              </p>
              <ul className="text-sm text-gray-600 mb-4 list-disc list-inside">
                <li>Your profile information</li>
                <li>All saved CVs ({savedCVs.length})</li>
                <li>All saved cover letters ({savedCoverLetters.length})</li>
                <li>Your account data</li>
              </ul>
              <div className="flex gap-2">
                <Button onClick={() => setShowDeleteAccount(false)} variant="outline" size="sm" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    // In a real implementation, you'd call deleteUserAccount() here
                    // For now, just close the modal
                    setShowDeleteAccount(false)
                    alert("Account deletion would happen here in a real implementation")
                  }}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
