"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import SAJobSearch from "@/components/sa-job-search"

export default function JobsPage() {
  return (
    <Suspense fallback={<SAJobSearch />}>
      <JobsPageContent />
    </Suspense>
  )
}

function JobsPageContent() {
  const searchParams = useSearchParams()
  const expired = searchParams.get("expired") === "1"
  return <SAJobSearch expiredNotice={expired} />
}
