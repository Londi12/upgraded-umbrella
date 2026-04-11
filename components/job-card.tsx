"use client"
import { formatJobCardDate } from "@/lib/date-formatter"

export interface JobResult {
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
}

export function JobCard({ job, isSelected, onClick }: JobCardProps) {
  const company = job.company || job.source
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
      <p className="font-semibold text-gray-900 text-sm leading-snug mb-0.5 truncate">{job.title}</p>
      <p className="text-sm text-gray-500 mb-1.5 truncate">{company}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {tags.slice(0, 2).map(tag => (
          <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">
            {tag}
          </span>
        ))}
        <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
          {job.location?.split(",")[0] || "South Africa"} · {formatJobCardDate(job.posted_date)}
        </span>
      </div>
    </button>
  )
}
