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

  const refreshApplications = () =>
    getUserApplications().then(result => { if (result.data) setApplications(result.data) })

  const stats = {
    total: applications.length,
    interviews: applications.filter(a => a.status === 'interview').length,
    offers: applications.filter(a => a.status === 'offered' || a.status === 'hired').length,
    pending: applications.filter(a => a.status === 'applied' || a.status === 'viewed').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (isConfigured && !user) return null

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
            <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50">
              <Briefcase className="h-4 w-4 mr-2" />
              Find Jobs
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="lg:flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <ApplicationTracker
              applications={applications}
              savedCVs={savedCVs}
              onApplicationAdded={refreshApplications}
              onApplicationUpdated={refreshApplications}
            />
          </div>

          <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 sticky top-6 self-start mt-6 lg:mt-0 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-2 border-b border-gray-100">
                <p className="font-semibold text-gray-900 text-sm">Application Stats</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-white p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-xs text-gray-500 mt-1">Total Applied</div>
                </div>
                <div className="rounded-lg border bg-white p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-xs text-gray-500 mt-1">Awaiting</div>
                </div>
                <div className="rounded-lg border bg-white p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.interviews}</div>
                  <div className="text-xs text-gray-500 mt-1">Interviews</div>
                </div>
                <div className="rounded-lg border bg-white p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.offers}</div>
                  <div className="text-xs text-gray-500 mt-1">Offers</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
              <p className="font-semibold text-gray-900 text-sm">Quick Actions</p>
              <Link href="/templates" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New CV
                </Button>
              </Link>
              <Link href="/jobs" className="block">
                <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Browse Jobs
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}