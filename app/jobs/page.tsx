"use client"

import { useSearchParams } from "next/navigation"
import SAJobSearch from "@/components/sa-job-search"

export default function JobsPage() {
  const searchParams = useSearchParams()
  const expired = searchParams.get("expired")
  return (
    <>
      {expired && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-700 text-center">
          That job listing has expired or been removed. Here are the latest jobs.
        </div>
      )}
      <SAJobSearch />
    </>
  )
}
