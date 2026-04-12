"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { getSavedCVs } from "@/lib/user-data-service"
import { getJobMatches, type JobMatchResult, type DisambiguationOption } from "@/lib/ai-job-service"
import { useAuth } from "@/contexts/auth-context"
import type { JobResult } from "@/components/job-card"

export interface SearchFilters {
  query: string
  location: string
  jobType: string
  experience: string
  datePosted: string
  sortBy: string
  quickFilters: string[]
}

const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  location: "",
  jobType: "",
  experience: "",
  datePosted: "7",
  sortBy: "relevant",
  quickFilters: [],
}

const JOB_SUGGESTIONS = [
  "Account Manager", "Software Developer", "Data Analyst", "Project Manager",
  "Supply Chain", "Customer Support", "Financial Analyst", "HR Manager",
  "Sales Representative", "Logistics Coordinator", "Civil Engineer", "Nurse",
  "Teacher", "Marketing Manager", "Business Analyst", "Accountant",
  "CRM", "Python", "SQL", "Retail", "Call Centre", "Learnership",
]

export function useJobSearch() {
  const { user } = useAuth()
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [results, setResults] = useState<JobResult[]>([])
  const [filteredResults, setFilteredResults] = useState<JobResult[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedJob, setSelectedJob] = useState<JobResult | null>(null)
  const [savedCVs, setSavedCVs] = useState<any[]>([])
  const [selectedCVId, setSelectedCVId] = useState("")
  const [aiMatching, setAiMatching] = useState(false)
  const [aiMatchResults, setAiMatchResults] = useState<JobMatchResult[]>([])
  const [aiMatchError, setAiMatchError] = useState("")
  const [disambiguationOptions, setDisambiguationOptions] = useState<DisambiguationOption[]>([])
  const [cvClassification, setCvClassification] = useState<{ detectedFamily: string; confidence: string; tier: string } | null>(null)

  // Clear stale match state when user picks a different CV or a different job
  useEffect(() => {
    setAiMatchResults([])
    setAiMatchError("")
    setDisambiguationOptions([])
    setCvClassification(null)
  }, [selectedCVId])

  useEffect(() => {
    setAiMatchResults([])
    setAiMatchError("")
    setDisambiguationOptions([])
    setCvClassification(null)
  }, [selectedJob?.url])

  useEffect(() => {
    if (user) {
      getSavedCVs().then(({ data, error }) => {
        if (!error) setSavedCVs(data)
      })
    }
  }, [user])

  const buildSearchUrl = useCallback((overrides: Partial<SearchFilters> = {}) => {
    // Always read from ref to avoid stale closure
    const f = { ...filtersRef.current, ...overrides }
    const params = new URLSearchParams()
    params.set('q', f.query || 'jobs')
    if (f.location) params.set('location', f.location)
    if (f.jobType) params.set('jobType', f.jobType)
    if (f.experience) params.set('experience', f.experience)
    if (f.datePosted) params.set('datePosted', f.datePosted)
    params.set('sortBy', f.sortBy)
    return `/api/sa-jobs?${params.toString()}`
  }, [])

  const applyClientFilters = useCallback((jobs: JobResult[], quickFilters: string[], sortBy: string) => {
    let filtered = [...jobs]
    if (quickFilters.length > 0) {
      filtered = filtered.filter(job =>
        quickFilters.every(f =>
          (job.snippet + job.title + (job.location || "")).toLowerCase().includes(f)
        )
      )
    }
    if (sortBy === "newest") {
      filtered.sort((a, b) =>
        new Date(b.posted_date || 0).getTime() - new Date(a.posted_date || 0).getTime()
      )
    }
    setFilteredResults(filtered)
  }, [])

  const search = useCallback(async (overrides: Partial<SearchFilters> = {}) => {
    setLoading(true)
    setError("")
    setResults([])
    setFilteredResults([])
    setSelectedJob(null)
    try {
      const res = await fetch(buildSearchUrl(overrides))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data?.results) {
        setResults(data.results)
        setTotalCount(data.total)
        const f = filtersRef.current
        applyClientFilters(data.results, overrides.quickFilters ?? f.quickFilters, overrides.sortBy ?? f.sortBy)
      } else {
        setError("No results returned")
      }
    } catch {
      setError("Search failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [buildSearchUrl, applyClientFilters])

  // Client-side filter changes (no API call needed)
  useEffect(() => {
    applyClientFilters(results, filters.quickFilters, filters.sortBy)
  }, [filters.quickFilters, filters.sortBy])

  // Server-side filter changes — single effect, skip on mount (initial search handles that)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      search()
      return
    }
    search()
  }, [filters.jobType, filters.experience, filters.datePosted, filters.location])

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleQuickFilter = (value: string) => {
    setFilters(prev => ({
      ...prev,
      quickFilters: prev.quickFilters.includes(value)
        ? prev.quickFilters.filter(f => f !== value)
        : [...prev.quickFilters, value],
    }))
  }

  const resetFilters = () => setFilters(DEFAULT_FILTERS)

  const handleQueryChange = (val: string) => {
    updateFilter('query', val)
    if (val.length > 1) {
      const filtered = JOB_SUGGESTIONS.filter(s => s.toLowerCase().includes(val.toLowerCase()))
      setSuggestions(filtered.slice(0, 6))
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleAIMatch = async (confirmedFamily?: string) => {
    if (!user || !selectedCVId || !selectedJob) return
    setAiMatching(true)
    setAiMatchError("")
    setAiMatchResults([])
    setDisambiguationOptions([])
    try {
      const selectedCV = savedCVs.find(cv => cv.id === selectedCVId)
      if (!selectedCV) throw new Error("Selected CV not found")

      let jobsToMatch: any[] = []
      try {
        const res = await fetch(`/api/sa-jobs?q=${encodeURIComponent(selectedJob.title || 'jobs')}&limit=10`)
        if (res.ok) { const d = await res.json(); jobsToMatch = d.results || [] }
      } catch { /* use selected job only */ }

      if (!jobsToMatch.some((j: any) => j.url === selectedJob.url)) jobsToMatch.unshift(selectedJob)
      if (jobsToMatch.length === 0) {
        jobsToMatch = [{ id: selectedJob.url, title: selectedJob.title, company: selectedJob.company || selectedJob.source, description: selectedJob.description || selectedJob.snippet, requirements: [] }]
      }

      const result = await getJobMatches(selectedCV.cv_data, jobsToMatch, confirmedFamily)
      if ('needsDisambiguation' in result) {
        setDisambiguationOptions(result.topMatches)
      } else {
        setAiMatchResults(result.matches)
        setCvClassification(result.cvClassification)
        if (result.matches.length === 0) setAiMatchError("No job matches found. Try selecting a different CV or job.")
      }
    } catch (error) {
      setAiMatchError(error instanceof Error ? error.message : "Job matching failed. Please try again.")
    } finally {
      setAiMatching(false)
    }
  }

  return {
    filters,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    results,
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
    JOB_SUGGESTIONS,
  }
}
