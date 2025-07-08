"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Plus, Briefcase } from "lucide-react"
import { getSavedCVs } from "@/lib/user-data-service"
import { getUserApplications } from "@/lib/analytics-service"
import { ApplicationTracker } from "@/components/application-tracker"
import { PageHeader } from "@/components/ui/page-header"
import type { SavedCV } from "@/lib/user-data-service"

export default function DashboardPage() {
  const { user, loading, isConfigured } = useAuth()
  const router = useRouter()
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!loading && isConfigured && !user) {
      router.push("/login?redirect=dashboard&message=Please sign in to access your dashboard")
    }
  }, [user, loading, router, isConfigured])

  useEffect(() => {
    const loadUserData = async () => {
      if (!isConfigured || !user) return

      setIsLoading(true)
      const [cvsResult, applicationsResult] = await Promise.all([
        getSavedCVs(),
        getUserApplications()
      ])

      if (cvsResult.data) setSavedCVs(cvsResult.data)
      if (applicationsResult.data) setApplications(applicationsResult.data)
      setIsLoading(false)
    }

    loadUserData()
  }, [user, isConfigured])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (isConfigured && !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Application Tracker"
        description="Track your job applications and manage your CV versions in one place."
      >
        <div className="flex gap-4">
          <Link href="/templates">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create CV
            </Button>
          </Link>
          <Link href="/jobs">
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Briefcase className="h-4 w-4 mr-2" />
              Find Jobs
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="container mx-auto px-4 py-8">
        <ApplicationTracker
          applications={applications}
          savedCVs={savedCVs}
          onApplicationAdded={() => {
            getUserApplications().then(result => {
              if (result.data) setApplications(result.data)
            })
          }}
          onApplicationUpdated={() => {
            getUserApplications().then(result => {
              if (result.data) setApplications(result.data)
            })
          }}
        />
      </div>
    </div>
  )
}