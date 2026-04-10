"use client"

import { ApplicationTracker } from "@/components/application-tracker"
import { useAuth } from "@/contexts/auth-context"
import { getUserApplications } from "@/lib/analytics-service"
import { getSavedCVs } from "@/lib/user-data-service"
import { useEffect, useState } from "react"
import type { CVData } from "@/types/cv-types"
import type { ApplicationTracking } from "@/lib/analytics-service"

export default function ApplicationTrackerPage() {
  const { user, isConfigured } = useAuth()
  const [applications, setApplications] = useState<ApplicationTracking[]>([])
  const [savedCVs, setSavedCVs] = useState<Array<{id: string, cv_data: CVData}>>([])

  useEffect(() => {
    if (isConfigured && user) {
      getUserApplications().then(({ data }) => { if (data) setApplications(data) })
      getSavedCVs().then(({ data }) => { if (data) setSavedCVs(data) })
    }
  }, [isConfigured, user])

  return (
    <div className="container mx-auto px-4 py-8">
      <ApplicationTracker
        applications={applications}
        savedCVs={savedCVs}
        onApplicationAdded={() => getUserApplications().then(({ data }) => { if (data) setApplications(data) })}
        onApplicationUpdated={() => getUserApplications().then(({ data }) => { if (data) setApplications(data) })}
      />
    </div>
  )
}
