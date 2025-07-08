"use client"

import { ApplicationTracker } from "@/components/application-tracker"
import { JobMatching } from "@/components/job-matching"
import { useAuth } from "@/contexts/auth-context"
import { getUserApplications } from "@/lib/analytics-service"
import { getSavedCVs } from "@/lib/user-data-service"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import type { CVData } from "@/types/cv-types"
import type { ApplicationTracking } from "@/lib/analytics-service"

export default function ApplicationTrackerPage() {
  const { user, isConfigured } = useAuth()
  const [applications, setApplications] = useState<ApplicationTracking[]>([])
  const [savedCVs, setSavedCVs] = useState<Array<{id: string, cv_data: CVData}>>([])

  useEffect(() => {
    if (isConfigured && user) {
      getUserApplications().then(({data, error}) => {
        if (error) {
          console.error('Error loading applications:', error)
          return
        }
        if (data) setApplications(data)
      })
      
      getSavedCVs().then(({data, error}) => {
        if (error) {
          console.error('Error loading saved CVs:', error)
          return
        }
        if (data) setSavedCVs(data)
      })
    }
  }, [isConfigured, user])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Application Tracker</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Application
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ApplicationTracker 
          applications={applications} 
          savedCVs={savedCVs}
          onApplicationAdded={() => {
            getUserApplications().then(({data}) => {
              if (data) setApplications(data)
            })
          }}
          onApplicationUpdated={() => {
            getUserApplications().then(({data}) => {
              if (data) setApplications(data)
            })
          }}
        />
        <JobMatching cvData={savedCVs[0]?.cv_data || null} />
      </div>
    </div>
  )
}