"use client"

import { Suspense } from "react"
import SAJobSearch from "@/components/sa-job-search"

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100vh-64px)] bg-white" />}>
      <SAJobSearch />
    </Suspense>
  )
}
