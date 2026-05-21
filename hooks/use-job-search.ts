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
  datePosted: "",
  sortBy: "newest",
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
  const [recommendedFamilies, setRecommendedFamilies] = useState<string[]>([])
  const [bestFitMode, setBestFitMode] = useState(false)
  const [bestFitLoading, setBestFitLoading] = useState(false)
  const [bestFitError, setBestFitError] = useState("")
  const [bestFitJobs, setBestFitJobs] = useState<JobResult[]>([])
  const [bestFitScores, setBestFitScores] = useState<Record<string, number>>({})
  const selectedJobKey = selectedJob ? (selectedJob.url || selectedJob.title || String((selectedJob as any).id || '')) : ''

  // Clear stale match state when user picks a different CV or a different job
  useEffect(() => {
    setAiMatchResults([])
    setAiMatchError("")
    setDisambiguationOptions([])
    setCvClassification(null)
    setRecommendedFamilies([])
  }, [selectedCVId])

  useEffect(() => {
    setBestFitMode(false)
    setBestFitJobs([])
    setBestFitScores({})
    setBestFitError("")
  }, [selectedCVId])

  useEffect(() => {
    setAiMatchResults([])
    setAiMatchError("")
    setDisambiguationOptions([])
    setCvClassification(null)
    setRecommendedFamilies([])
  }, [selectedJobKey])

  useEffect(() => {
    setBestFitMode(false)
    setBestFitJobs([])
    setBestFitScores({})
    setBestFitError("")
  }, [filteredResults])

  useEffect(() => {
    if (user) {
      getSavedCVs(user.id).then(({ data, error }) => {
        if (!error) setSavedCVs(data)
      })
    }
  }, [user])

  // Auto-select the first job when results load and no job is currently selected
  useEffect(() => {
    if (filteredResults.length > 0 && !selectedJob) {
      setSelectedJob(filteredResults[0])
    }
  }, [filteredResults, selectedJob])

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
      const primaryUrl = buildSearchUrl(overrides)
      let res = await fetch(primaryUrl)
      let data: any = null

      if (!res.ok) {
        // Fallback to alternate provider route when SA jobs endpoint is unavailable.
        const f = { ...filtersRef.current, ...overrides }
        const fallbackParams = new URLSearchParams()
        fallbackParams.set('q', f.query || 'jobs')
        if (f.location) fallbackParams.set('location', f.location)
        if (f.jobType) fallbackParams.set('jobType', f.jobType)
        if (f.datePosted) fallbackParams.set('datePosted', f.datePosted)
        const fallbackUrl = `/api/indeed-jobs?${fallbackParams.toString()}`
        const fallbackRes = await fetch(fallbackUrl)
        if (fallbackRes.ok) {
          res = fallbackRes
          data = await fallbackRes.json()
        } else {
          let message = `Search failed (${res.status})`
          try {
            const errBody = await res.json()
            if (errBody?.error) message = String(errBody.error)
          } catch {
            // Keep default message when response body is not JSON.
          }
          throw new Error(message)
        }
      } else {
        data = await res.json()
      }

      if (data?.results) {
        setResults(data.results)
        setTotalCount(data.total)
        const f = filtersRef.current
        applyClientFilters(data.results, overrides.quickFilters ?? f.quickFilters, overrides.sortBy ?? f.sortBy)
      } else {
        setError("No results returned")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed. Please try again."
      setError(message)
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

      // Score selected job plus a limited set of nearby results to power reliable
      // "better matches" recommendations without overloading the API.
      const selectedId = selectedJob.url || selectedJob.title
      const candidateJobs = filteredResults
        .filter(j => (j.url || j.title) !== selectedId)
        .slice(0, 24)

      const jobsToMatch = [selectedJob, ...candidateJobs].map(j => ({
        id: j.url || j.title,
        url: j.url,
        title: j.title,
        company: j.company || j.source,
        description: j.description || j.snippet || '',
        location: j.location,
        requirements: [],
      }))

      const result = await getJobMatches(selectedCV.cv_data, jobsToMatch, confirmedFamily)
      if ('needsDisambiguation' in result) {
        setDisambiguationOptions(result.topMatches)
      } else {
        setAiMatchResults(result.matches)
        setCvClassification(result.cvClassification)
        setRecommendedFamilies(result.recommendedFamilies || [])
        if (result.matches.length === 0) setAiMatchError("No job matches found. Try selecting a different CV or job.")
      }
    } catch (error) {
      setAiMatchError(error instanceof Error ? error.message : "Job matching failed. Please try again.")
    } finally {
      setAiMatching(false)
    }
  }

  const rankBestFitJobs = async (confirmedFamily?: string) => {
    if (!user) {
      setBestFitError("Please sign in to rank jobs for your profile.")
      return
    }
    if (!selectedCVId) {
      setBestFitError("Select a saved CV first.")
      return
    }
    if (!filteredResults.length) {
      setBestFitError("No jobs available to rank yet.")
      return
    }

    setBestFitLoading(true)
    setBestFitError("")
    setDisambiguationOptions([])

    try {
      const selectedCV = savedCVs.find(cv => cv.id === selectedCVId)
      if (!selectedCV) throw new Error("Selected CV not found")

      // Keep payload bounded while still giving enough data for useful ranking.
      const jobsToMatch = filteredResults.slice(0, 60).map(j => ({
        id: j.url || j.title,
        url: j.url,
        title: j.title,
        company: j.company || j.source,
        description: j.description || j.snippet || '',
        location: j.location,
        requirements: [],
      }))

      const result = await getJobMatches(selectedCV.cv_data, jobsToMatch, confirmedFamily)
      if ('needsDisambiguation' in result) {
        setDisambiguationOptions(result.topMatches)
        setBestFitMode(false)
        return
      }

      const scoreById: Record<string, number> = {}
      result.matches.forEach(m => {
        scoreById[m.jobId] = m.matchScore
      })

      const ranked = [...filteredResults].sort((a, b) => {
        const aId = a.url || a.title
        const bId = b.url || b.title
        const scoreDelta = (scoreById[bId] || 0) - (scoreById[aId] || 0)
        if (scoreDelta !== 0) return scoreDelta
        return new Date(b.posted_date || 0).getTime() - new Date(a.posted_date || 0).getTime()
      })

      setCvClassification(result.cvClassification)
      setRecommendedFamilies(result.recommendedFamilies || [])
      setBestFitScores(scoreById)
      setBestFitJobs(ranked)
      setBestFitMode(true)
      if (ranked.length > 0) {
        setSelectedJob(ranked[0])
      }
    } catch (error) {
      setBestFitError(error instanceof Error ? error.message : "Unable to rank jobs right now.")
      setBestFitMode(false)
    } finally {
      setBestFitLoading(false)
    }
  }

  const displayedResults = bestFitMode ? bestFitJobs : filteredResults

  return {
    filters,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    results,
    filteredResults,
    displayedResults,
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
    recommendedFamilies,
    bestFitMode,
    setBestFitMode,
    bestFitLoading,
    bestFitError,
    bestFitScores,
    search,
    updateFilter,
    toggleQuickFilter,
    resetFilters,
    handleQueryChange,
    handleAIMatch,
    rankBestFitJobs,
    JOB_SUGGESTIONS,
  }
}
