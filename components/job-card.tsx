"use client"
import { formatJobCardDate } from "@/lib/date-formatter"
import { cleanJobCompany, cleanJobLocation, cleanJobTitle } from "@/lib/job-display"

export interface JobResult {
  id?: string
  title: string
  snippet: string
  url: string
  source: string
  posted_date?: string
  company?: string
  location?: string
  description?: string
  job_type?: string
  experience_level?: string
}

interface JobCardProps {
  job: JobResult
  isSelected: boolean
  onClick: () => void
  matchScore?: number
}

export function JobCard({ job, isSelected, onClick, matchScore }: JobCardProps) {
  const title = cleanJobTitle(job.title)
  const company = cleanJobCompany(job.company || job.source)
  const location = cleanJobLocation(job.location)
  const tags = [job.job_type, job.experience_level].filter(Boolean) as string[]

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b transition-colors ${
        isSelected
          ? "bg-blue-50 border-l-2 border-l-blue-500"
          : "hover:bg-gray-50 border-l-2 border-l-transparent"
      }`}
    >
      <p className="font-semibold text-gray-900 text-sm leading-snug mb-0.5 truncate">{title}</p>
      {typeof matchScore === "number" && (
        <span className="inline-flex mb-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          {matchScore}% suited
        </span>
      )}
      <p className="text-sm text-gray-500 mb-1.5 truncate">{company}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {tags.slice(0, 2).map(tag => (
          <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">
            {tag}
          </span>
        ))}
        <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
          {location} · {formatJobCardDate(job.posted_date)}
        </span>
      </div>
    </button>
  )
}
