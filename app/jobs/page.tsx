"use client"

import SAJobSearch from "@/components/sa-job-search"
import TrialBanner from "@/components/trial-banner"
import { PageHeader } from "@/components/ui/page-header"

export default function JobsPage() {

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="South African Job Search"
        description="Find your next opportunity in South Africa"
      />
      <div className="container mx-auto px-4 py-8">
        <TrialBanner />
        <SAJobSearch />
      </div>
    </div>
  )
}