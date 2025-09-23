"use client"

import ModernSAJobSearchWithMatches from "@/components/modern-sa-job-search-with-matches"
import TrialBanner from "@/components/trial-banner"
import { PageHeader } from "@/components/ui/page-header"

export default function ModernJobsPageWithMatches() {

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="South African Job Search"
        description="Find your next opportunity in South Africa"
      />
      <div className="container mx-auto px-4 py-8">
        <TrialBanner />
        <ModernSAJobSearchWithMatches />
      </div>
    </div>
  )
}
