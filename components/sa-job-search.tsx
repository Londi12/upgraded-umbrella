"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { useState } from "react"
import { JobCard } from "@/components/job-card"
import { JobDetailPanel } from "@/components/job-detail-panel"
import { useJobSearch } from "@/hooks/use-job-search"

const QUICK_FILTERS = [
  { label: "Remote", value: "remote" },
  { label: "No experience", value: "no experience" },
  { label: "Matric only", value: "matric" },
  { label: "Learnership", value: "learnership" },
]

export default function SAJobSearch() {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const {
    filters,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    filteredResults,
    totalCount,
    loading,
    error,
    selectedJob,
    setSelectedJob,
    savedCVs,
    selectedCVId,
    setSelectedCVId,
    aiMatching,
    aiMatchResults,
    aiMatchError,
    disambiguationOptions,
    cvClassification,
    search,
    updateFilter,
    toggleQuickFilter,
    resetFilters,
    handleQueryChange,
    handleAIMatch,
  } = useJobSearch()

  const selectJob = (job: typeof selectedJob) => {
    setSelectedJob(job)
    if (window.innerWidth < 1024) setIsMobileSheetOpen(true)
  }

  const clearJob = () => {
    setSelectedJob(null)
    setIsMobileSheetOpen(false)
  }

  const hasActiveFilters = filters.jobType || filters.experience || filters.datePosted !== "7" || filters.quickFilters.length > 0

  const detailPanelProps = selectedJob ? {
    job: selectedJob,
    savedCVs,
    selectedCVId,
    onCVSelect: setSelectedCVId,
    onClose: clearJob,
    aiMatching,
    aiMatchResults,
    aiMatchError,
    disambiguationOptions,
    cvClassification,
    onAIMatch: handleAIMatch,
  } : null

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">

      {/* Search bar */}
      <div className="border-b bg-white px-4 py-3 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Job title, skill, or keyword"
              value={filters.query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => filters.query.length > 1 && setShowSuggestions(suggestions.length > 0)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              className="pl-9 h-9 text-sm"
            />
            {showSuggestions && (
              <div className="absolute z-20 top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                {suggestions.map(s => (
                  <button key={s} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    onMouseDown={() => { updateFilter('query', s); setShowSuggestions(false) }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            className="h-9 px-3 border rounded-md text-sm min-w-[130px]"
          >
            <option value="">All locations</option>
            <option value="johannesburg">Johannesburg</option>
            <option value="cape town">Cape Town</option>
            <option value="durban">Durban</option>
            <option value="pretoria">Pretoria</option>
            <option value="port elizabeth">Gqeberha</option>
          </select>

          <Button onClick={() => search()} disabled={loading} size="sm" className="h-9">
            {loading ? "..." : "Search"}
          </Button>

          <button
            onClick={() => setShowFilters(f => !f)}
            className={`h-9 px-3 border rounded-md text-sm flex items-center gap-1.5 transition-colors ${
              hasActiveFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </button>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="max-w-7xl mx-auto mt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => toggleQuickFilter(value)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    filters.quickFilters.includes(value)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={filters.jobType} onChange={(e) => updateFilter('jobType', e.target.value)} className="h-8 px-3 border rounded-md text-xs">
                <option value="">Job type</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="learnership">Learnership</option>
              </select>
              <select value={filters.experience} onChange={(e) => updateFilter('experience', e.target.value)} className="h-8 px-3 border rounded-md text-xs">
                <option value="">Experience</option>
                <option value="entry">Entry (0–2 yrs)</option>
                <option value="mid">Mid (2–5 yrs)</option>
                <option value="senior">Senior (5+ yrs)</option>
              </select>
              <select value={filters.datePosted} onChange={(e) => updateFilter('datePosted', e.target.value)} className="h-8 px-3 border rounded-md text-xs">
                <option value="1">Today</option>
                <option value="3">Last 3 days</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="">Any time</option>
              </select>
              <select value={filters.sortBy} onChange={(e) => updateFilter('sortBy', e.target.value)} className="h-8 px-3 border rounded-md text-xs">
                <option value="relevant">Most relevant</option>
                <option value="newest">Newest first</option>
              </select>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="h-8 px-3 text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-md">
                  Reset
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-600 flex-shrink-0">
          {error}
        </div>
      )}

      {/* Desktop: master-detail */}
      <div className="hidden lg:flex flex-1 min-h-0 max-w-7xl mx-auto w-full">

        {/* Job list */}
        <div className="w-80 xl:w-96 flex-shrink-0 border-r flex flex-col min-h-0">
          <div className="px-4 py-2 border-b bg-gray-50 flex-shrink-0">
            <span className="text-xs text-gray-500">
              {loading ? "Searching..." : `${filteredResults.length} jobs`}
              {totalCount > filteredResults.length && ` of ${totalCount}`}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredResults.map((job, idx) => (
              <JobCard
                key={idx}
                job={job}
                isSelected={selectedJob?.url === job.url}
                onClick={() => selectJob(job)}
              />
            ))}
            {filteredResults.length === 0 && !loading && (
              <div className="p-8 text-center text-sm text-gray-400">
                <p>No jobs found.</p>
                <p className="mt-1">Try different keywords or reset filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 min-h-0 min-w-0">
          {selectedJob && detailPanelProps ? (
            <JobDetailPanel {...detailPanelProps} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-sm">Select a job to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: list */}
      <div className="lg:hidden flex-1 overflow-y-auto">
        {filteredResults.map((job, idx) => (
          <JobCard
            key={idx}
            job={job}
            isSelected={selectedJob?.url === job.url}
            onClick={() => selectJob(job)}
          />
        ))}
        {filteredResults.length === 0 && !loading && (
          <div className="p-8 text-center text-sm text-gray-400">
            <p>No jobs found.</p>
            <p className="mt-1">Try different keywords or reset filters.</p>
          </div>
        )}
      </div>

      {/* Mobile sheet */}
      <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
        <SheetContent side="bottom" className="h-[92vh] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-sm font-medium">Job Details</SheetTitle>
              <button onClick={clearJob} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </SheetHeader>
          <div className="flex-1 min-h-0">
            {selectedJob && detailPanelProps && (
              <JobDetailPanel {...detailPanelProps} showBackButton={false} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
