"use client"
import { useState, useMemo } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Send, CheckCircle, X, ArrowLeft, Check, AlertCircle, Lightbulb, ChevronDown, ChevronUp, Briefcase, ChevronRight, Share2 } from "lucide-react"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { calculateJobMatch as calculateHeuristicMatch, calculateATSScores, aggregateAtsFeedback } from "@/lib/cv-ats-heuristics"
import { formatJobCardDate } from "@/lib/date-formatter"
import { saveJob } from "@/lib/user-data-service"
import type { JobResult } from "@/components/job-card"
import type { JobMatchResult, DisambiguationOption } from "@/lib/ai-job-service"

type Tab = "details" | "analysis"

interface TrackForm {
  cv_id: string
  cover_letter: string
  job_title: string
  company_name: string
  job_board: string
  application_date: string
  status: 'applied' | 'viewed' | 'interview' | 'offered' | 'hired' | 'rejected'
  notes: string
  job_description: string
  job_url: string
}

interface JobDetailPanelProps {
  job: JobResult
  savedCVs: any[]
  selectedCVId: string
  onCVSelect: (id: string) => void
  onClose: () => void
  aiMatching: boolean
  aiMatchResults: JobMatchResult[]
  aiMatchError: string
  disambiguationOptions: DisambiguationOption[]
  cvClassification: { detectedFamily: string; confidence: string; tier: string } | null
  recommendedFamilies?: string[]
  onAIMatch: (confirmedFamily?: string) => void
  showBackButton?: boolean
  allJobs?: JobResult[]
  onSelectJob?: (job: JobResult) => void
}

export function JobDetailPanel({
  job,
  savedCVs,
  selectedCVId,
  onCVSelect,
  onClose,
  aiMatching,
  aiMatchResults,
  aiMatchError,
  disambiguationOptions,
  cvClassification,
  recommendedFamilies = [],
  onAIMatch,
  showBackButton = true,
  allJobs,
  onSelectJob,
}: JobDetailPanelProps) {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>("details")
  const [trackDialogOpen, setTrackDialogOpen] = useState(false)
  const [trackForm, setTrackForm] = useState<TrackForm>({
    cv_id: '',
    cover_letter: '',
    job_title: job.title,
    company_name: job.company || job.source || '',
    job_board: 'CVKonnekt',
    application_date: new Date().toISOString().split('T')[0],
    status: 'applied',
    notes: '',
    job_description: job.description || job.snippet || '',
    job_url: job.url,
  })
  const [trackSaving, setTrackSaving] = useState(false)
  const [trackSuccess, setTrackSuccess] = useState(false)
  const [applyToast, setApplyToast] = useState(false)
  const [shareToast, setShareToast] = useState("")

  const company = job.company || job.source || ""
  const tags = [job.job_type, job.experience_level].filter(Boolean) as string[]
  const selectedCvData = selectedCVId ? savedCVs.find(cv => cv.id === selectedCVId)?.cv_data : undefined
  const jobDescription = job.description || job.snippet || ''
  const publicJobId = (job as { id?: string | number }).id
  const publicJobPath = publicJobId ? `/jobs/${publicJobId}` : null
  const canShareJob = Boolean(publicJobPath || job.url)

  const resolveShareUrl = async () => {
    if (typeof window === 'undefined') return ''

    if (publicJobPath) {
      return new URL(publicJobPath, window.location.origin).toString()
    }

    if (!job.url) return ''

    try {
      const params = new URLSearchParams({ url: job.url })
      const response = await fetch(`/api/jobs/share-link?${params.toString()}`)
      if (!response.ok) return ''
      const data = await response.json()
      if (!data?.path) return ''
      return new URL(data.path, window.location.origin).toString()
    } catch {
      return ''
    }
  }

  // Heuristic ATS data — auto-updates when CV changes, no button needed
  const atsScores = useMemo(() => selectedCvData ? calculateATSScores(selectedCvData) : null, [selectedCvData])
  const atsJobMatch = useMemo(() => selectedCvData && jobDescription ? calculateHeuristicMatch(selectedCvData, jobDescription) : null, [selectedCvData, jobDescription])
  const atsIssues = useMemo(() => atsScores ? aggregateAtsFeedback(atsScores) : [], [atsScores])

  // Score helpers
  const scoreColor = (n: number) => n >= 70 ? 'text-green-600' : n >= 50 ? 'text-amber-600' : 'text-slate-500'
  const scoreBorder = (n: number) => n >= 70 ? 'border-green-400' : n >= 50 ? 'border-amber-400' : 'border-slate-300'
  const scoreBarColor = (n: number) => n >= 70 ? 'bg-green-500' : n >= 50 ? 'bg-amber-400' : 'bg-red-400'

  const selectedJobId = useMemo(
    () => job.url || job.title || (job as any).id || '',
    [job.url, job.title, job]
  )

  // Only use the exact match for the currently selected job.
  const currentJobMatch = useMemo(() =>
    aiMatchResults.find(m => m.jobId === selectedJobId) ?? null,
    [aiMatchResults, selectedJobId]
  )
  // otherMatches unused now (we only score 1 job); kept for SimilarRoles component
  const otherMatches = useMemo(() =>
    currentJobMatch ? aiMatchResults.filter(m => m.jobId !== currentJobMatch.jobId).slice(0, 4) : [],
    [aiMatchResults, currentJobMatch]
  )

  // Pre-compute low-match content — structured role gap + skill reasons
  const lowMatchData = useMemo(() => {
    if (!currentJobMatch || currentJobMatch.matchScore >= 50) return { roleGap: null as null | { cvFamily: string; jobFamily: string }, reasons: [] as string[] }
    let roleGap: { cvFamily: string; jobFamily: string } | null = null
    const reasons: string[] = []
    if (
      currentJobMatch.detectedCVFamily &&
      currentJobMatch.detectedJobFamily &&
      currentJobMatch.detectedJobFamily !== 'unknown' &&
      currentJobMatch.detectedCVFamily.toLowerCase() !== currentJobMatch.detectedJobFamily.toLowerCase()
    ) {
      roleGap = { cvFamily: currentJobMatch.detectedCVFamily, jobFamily: currentJobMatch.detectedJobFamily }
    }
    const toolGaps = currentJobMatch.skillsGap.filter(s => s.length > 1).slice(0, 3)
    if (toolGaps.length > 0) reasons.push(`Missing required skills: ${toolGaps.join(', ')}`)
    const humanGap = currentJobMatch.dealBreakers[0] ||
      currentJobMatch.gaps.find(g => !g.toLowerCase().includes('nqf') && !g.toLowerCase().includes('registration'))
    if (humanGap) reasons.push(humanGap)
    if (reasons.length < 1 && !roleGap) reasons.push('Experience level does not match job requirements')
    return { roleGap, reasons }
  }, [currentJobMatch])

  const betterRoles = useMemo(() => {
    if (recommendedFamilies.length > 0) return recommendedFamilies
    if (currentJobMatch?.detectedCVFamily) {
      return [`${currentJobMatch.detectedCVFamily} roles`, 'Related industry positions']
    }
    return []
  }, [recommendedFamilies, currentJobMatch])

  // Find up to 2 real jobs from the list that better match the user's CV family
  const suggestedJobs = useMemo(() => {
    if (!currentJobMatch || currentJobMatch.matchScore >= 50 || !allJobs?.length) return []

    const minBetterScore = Math.max(55, currentJobMatch.matchScore + 10)
    const scoredAlternatives = aiMatchResults
      .filter(m => m.jobId !== selectedJobId && m.matchScore >= minBetterScore)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 2)

    if (scoredAlternatives.length > 0) {
      const allJobsById = new Map(allJobs.map(j => [j.url || j.title || (j as any).id || '', j]))
      const mapped = scoredAlternatives
        .map(m => allJobsById.get(m.jobId))
        .filter((j): j is JobResult => Boolean(j))
      if (mapped.length > 0) return mapped
    }

    const cvFamily = (currentJobMatch.detectedCVFamily || '').toLowerCase()
    if (!cvFamily) return []
    const familyWords = cvFamily.split(/[\s\/&\-]+/).filter((w: string) => w.length > 3)
    if (!familyWords.length) return []
    return allJobs
      .filter(j => {
        const jId = j.url || j.title || (j as any).id || ''
        if (jId === selectedJobId) return false
        const text = `${j.title} ${j.description || j.snippet || ''}`.toLowerCase()
        return familyWords.some((w: string) => text.includes(w))
      })
      .slice(0, 2)
  }, [allJobs, currentJobMatch, selectedJobId])

  const openTrackDialog = () => {
    setTrackForm(f => ({ ...f, cv_id: selectedCVId || '' }))
    setTrackSuccess(false)
    setTrackDialogOpen(true)
  }

  const handleTrackSave = async () => {
    if (!user) return
    setTrackSaving(true)
    try {
      await saveJob({
        job_title: trackForm.job_title,
        company_name: trackForm.company_name,
        job_url: trackForm.job_url,
        job_description: trackForm.job_description,
        location: job.location || '',
        posted_date: job.posted_date || '',
        source: trackForm.job_board,
      })
      await fetch('/api/track-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cv_id: trackForm.cv_id || null,
          job_title: trackForm.job_title,
          company_name: trackForm.company_name,
          job_board: trackForm.job_board,
          application_date: trackForm.application_date,
          status: trackForm.status,
          ats_score_at_application: 0,
          job_description: trackForm.job_description,
          notes: trackForm.notes + (trackForm.cover_letter ? `\n\nCover Letter: ${trackForm.cover_letter}` : ''),
        }),
      })
      setTrackSuccess(true)
    } catch (e) {
      console.error(e)
    }
    setTrackSaving(false)
  }

  const handleApply = async () => {
    try {
      await fetch('/api/track-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cv_id: selectedCVId || null,
          job_title: job.title,
          company_name: company,
          job_board: 'SA Job Search',
          application_date: new Date().toISOString().split('T')[0],
          status: 'applied',
          ats_score_at_application: 0,
          job_description: job.description || job.snippet,
          notes: `Applied via SA Job Search: ${job.url}`,
        }),
      })
      setApplyToast(true)
      setTimeout(() => setApplyToast(false), 5000)
    } catch (error) {
      console.error('Error tracking application:', error)
    }
    window.open(job.url, '_blank')
  }

  const handleShare = async () => {
    const targetUrl = await resolveShareUrl()
    if (!targetUrl) {
      setShareToast('Unable to create a shareable job page yet.')
      window.setTimeout(() => setShareToast(''), 3000)
      return
    }
    if (typeof window === 'undefined') return

    const browserNavigator = window.navigator

    try {
      if (typeof browserNavigator.share === 'function') {
        await browserNavigator.share({
          title: `${job.title} | CVKonnekt`,
          text: `${job.title} at ${company}`,
          url: targetUrl,
        })
        return
      }

      if (browserNavigator.clipboard?.writeText) {
        await browserNavigator.clipboard.writeText(targetUrl)
      } else {
        setShareToast('Sharing is not supported on this browser.')
        window.setTimeout(() => setShareToast(''), 3000)
        return
      }

      setShareToast(publicJobPath ? 'Share link copied.' : 'Job link copied.')
      window.setTimeout(() => setShareToast(''), 3000)
    } catch (error) {
      console.error('Failed to copy job link:', error)
      setShareToast('Could not copy link.')
      window.setTimeout(() => setShareToast(''), 3000)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b flex-shrink-0">
        <div className="flex items-start gap-2 mb-3">
          {showBackButton && (
            <button onClick={onClose} className="mt-0.5 text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <h2 className="flex-1 font-semibold text-gray-900 text-base leading-snug">{job.title}</h2>
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="flex-none"
                disabled={!canShareJob}
              >
                <Share2 className="w-3.5 h-3.5 mr-1" /> Share
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{company}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">{tag}</span>
              ))}
              <span className="text-xs text-gray-400">
                {job.location?.split(",")[0] || "South Africa"} · {formatJobCardDate(job.posted_date)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(["details", "analysis"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize ${
                tab === t
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t === "analysis" && (currentJobMatch || selectedCVId)
                ? `${t} ${currentJobMatch ? `· ${currentJobMatch.matchScore}%` : ""}`
                : t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {tab === "details" && (
          <div className="p-5">
            <MarkdownRenderer
              content={job.description || job.snippet || "No description available."}
              className="text-sm text-gray-700 leading-relaxed"
            />
          </div>
        )}

        {tab === "analysis" && (
          <div className="p-5 space-y-4">

            {/* CV selector row */}
            <div className="flex items-center gap-2">
              <label htmlFor="cv-select" className="text-sm text-slate-600 whitespace-nowrap">CV:</label>
              <select
                id="cv-select"
                value={selectedCVId}
                onChange={(e) => onCVSelect(e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">
                  {user ? (savedCVs.length ? "Select CV" : "Create a CV first") : "Sign in to use"}
                </option>
                {user && savedCVs.map(cv => (
                  <option key={cv.id} value={cv.id}>{cv.name}</option>
                ))}
              </select>
              <Button
                onClick={() => onAIMatch()}
                disabled={!user || !selectedCVId || aiMatching}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
              >
                {aiMatching ? "Matching..." : "Match"}
              </Button>
            </div>

            {/* Disambiguation */}
            {disambiguationOptions.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-sm font-medium text-blue-900 mb-3">Which best describes your role?</p>
                <div className="space-y-2">
                  {disambiguationOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => onAIMatch(opt.id)}
                      className="w-full text-left px-3 py-2 bg-white border border-blue-200 rounded-lg hover:border-blue-500 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-900">{opt.family}</span>
                      <span className="text-xs text-slate-500 ml-2">{opt.tier} level</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── AFTER MATCH: low fit ── */}
            {currentJobMatch && currentJobMatch.matchScore < 50 && (
              <div className="space-y-5">

                {/* Score header */}
                <div className="flex items-start gap-4 px-4 py-4 bg-white border border-red-100 rounded-xl">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full border-[3px] border-red-300 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-red-500 leading-none">{currentJobMatch.matchScore}%</span>
                    <span className="text-[9px] text-red-400 font-semibold uppercase tracking-wide mt-0.5">Match</span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-base font-bold text-slate-800 leading-snug">Low match — here&apos;s the gap</p>
                    <p className="text-sm text-slate-500 mt-0.5">Consider highlighting transferable skills or exploring a closer role.</p>
                  </div>
                </div>

                {/* Role alignment — structured two-row display */}
                {lowMatchData.roleGap && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Role Alignment</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 flex-shrink-0">Your background</span>
                        <span className="text-sm font-semibold text-slate-800 text-right">{lowMatchData.roleGap.cvFamily}</span>
                      </div>
                      <div className="border-t border-slate-100" />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 flex-shrink-0">This role focuses on</span>
                        <span className="text-sm font-semibold text-slate-800 text-right">{lowMatchData.roleGap.jobFamily}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skill gaps */}
                {lowMatchData.reasons.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Skill Gaps</p>
                    <div className="space-y-2">
                      {lowMatchData.reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <hr className="border-slate-100" />

                {/* What to do next — dynamic tips */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">What to do next</p>
                  <div className="space-y-2">
                    {[
                      lowMatchData.roleGap
                        ? `Look for ${lowMatchData.roleGap.cvFamily} roles — they align with your background`
                        : 'Apply to roles closer to your background',
                      lowMatchData.roleGap
                        ? `If you have any ${lowMatchData.roleGap.jobFamily} experience, add it to your CV`
                        : 'Update your CV to highlight any transferable skills',
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Lightbulb className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Better matches for you — real jobs first, role labels as fallback */}
                {(suggestedJobs.length > 0 || betterRoles.length > 0) && (
                  <>
                    <hr className="border-slate-100" />
                    <div className="space-y-2.5">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Better matches for you</p>
                      {suggestedJobs.length > 0 ? (
                        <div className="space-y-2">
                          {suggestedJobs.map((j, i) => (
                            <button
                              key={i}
                              onClick={() => onSelectJob?.(j)}
                              className="w-full text-left flex items-center gap-3 px-3 py-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                                <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-800 truncate">{j.title}</p>
                                <p className="text-xs text-slate-500 truncate">{j.company || j.source || 'View job'}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {betterRoles.map((role, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                              </div>
                              <span className="text-sm font-medium text-slate-700">{role}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── AFTER MATCH: good fit ── */}
            {currentJobMatch && currentJobMatch.matchScore >= 50 && (
              <div className="space-y-5">

                    {/* Score header — good fit */}
                    <div className="flex items-center gap-4 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <div className={`flex-shrink-0 w-14 h-14 rounded-full border-[3px] flex items-center justify-center ${scoreBorder(currentJobMatch.matchScore)}`}>
                        <span className={`text-lg font-bold ${scoreColor(currentJobMatch.matchScore)}`}>{currentJobMatch.matchScore}%</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={`text-sm font-semibold ${scoreColor(currentJobMatch.matchScore)}`}>{currentJobMatch.recommendation}</span>
                        {currentJobMatch.dealBreakers.length > 0 && (
                          <p className="text-xs text-red-600 mt-1">⚠ {currentJobMatch.dealBreakers[0]}</p>
                        )}
                      </div>
                    </div>

                    {/* What you bring */}
                    {(currentJobMatch.strengths.length > 0 || currentJobMatch.skillsMatch.length > 0) && (
                      <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                        <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5" /> What you bring
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {currentJobMatch.strengths.filter(s => !s.toLowerCase().startsWith('skill:')).slice(0, 3).map((s, i) => (
                            <span key={i} className="text-xs bg-white border border-green-200 text-green-800 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                          {currentJobMatch.skillsMatch.slice(0, 5).map((s, i) => (
                            <span key={`sm-${i}`} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gaps — no NQF jargon */}
                    {(currentJobMatch.gaps.filter(g => !g.toLowerCase().includes('nqf')).length > 0 || currentJobMatch.skillsGap.length > 0) && (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                        <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" /> Gaps to address
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {currentJobMatch.gaps.filter(g => !g.toLowerCase().includes('nqf')).slice(0, 3).map((g, i) => (
                            <span key={i} className="text-xs bg-white border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full">{g}</span>
                          ))}
                          {currentJobMatch.skillsGap.slice(0, 3).map((s, i) => (
                            <span key={`sg-${i}`} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CV quality — compact bar */}
                    {atsScores && (
                      <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-slate-600">CV quality</span>
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${scoreBarColor(atsScores.overallScore)}`} style={{ width: `${atsScores.overallScore}%` }} />
                          </div>
                          <span className={`text-xs font-semibold flex-shrink-0 ${scoreColor(atsScores.overallScore)}`}>{atsScores.overallScore}%</span>
                        </div>
                        {atsIssues.length > 0 && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {atsIssues.slice(0, 3).map((issue, i) => (
                              <span key={i} className="text-xs text-slate-500 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />{issue}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Similar roles — only good matches */}
                    {otherMatches.filter(m => m.matchScore >= 50).length > 0 && (
                      <SimilarRoles matches={otherMatches.filter(m => m.matchScore >= 50)} />
                    )}
                  </div>
            )}

            {aiMatchError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{aiMatchError}</p>
            )}

            {/* ── BEFORE MATCH: preview state ── */}
            {selectedCVId && !currentJobMatch && !aiMatching && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                {atsScores && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-600">CV quality</span>
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${scoreBarColor(atsScores.overallScore)}`} style={{ width: `${atsScores.overallScore}%` }} />
                    </div>
                    <span className={`text-xs font-semibold flex-shrink-0 ${scoreColor(atsScores.overallScore)}`}>{atsScores.overallScore}%</span>
                  </div>
                )}
                {atsJobMatch && (atsJobMatch.matchedSkills.length > 0 || atsJobMatch.missingSkills.length > 0) && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Keyword overlap with this job</p>
                    <div className="flex flex-wrap gap-1.5">
                      {atsJobMatch.matchedSkills.slice(0, 5).map((s, i) => (
                        <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                      {atsJobMatch.missingSkills.slice(0, 3).map((s, i) => (
                        <span key={`m${i}`} className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {atsIssues.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {atsIssues.slice(0, 4).map((issue, i) => (
                      <span key={i} className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />{issue}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 text-center pt-1">Click Match above for a full role-fit analysis</p>
              </div>
            )}

            {!selectedCVId && (
              <p className="text-sm text-slate-400 text-center py-10">Select a CV to see your fit for this role</p>
            )}
          </div>
        )}
      </div>

      {/* Actions — always visible at bottom */}
      <div className="flex-shrink-0 border-t px-5 py-3 bg-white space-y-2">
        {applyToast && (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="flex-1 text-green-800">Application tracked!</span>
            <a href="/dashboard" className="text-green-700 underline text-xs whitespace-nowrap">View →</a>
          </div>
        )}
        {shareToast && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="flex-1 text-blue-800">{shareToast}</span>
            {publicJobPath ? <Link href={publicJobPath} className="text-blue-700 underline text-xs whitespace-nowrap">Open →</Link> : null}
          </div>
        )}
        <div className="flex gap-2">
          <Button onClick={openTrackDialog} disabled={!user} variant="outline" size="sm" className="flex-none">
            <Save className="w-3.5 h-3.5 mr-1" /> Save
          </Button>
          <Button onClick={handleApply} size="sm" className="flex-1">
            <Send className="w-3.5 h-3.5 mr-1.5" /> Apply Now
          </Button>
        </div>
      </div>

      {/* Track Dialog */}
      <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Save & Track Application</DialogTitle>
          </DialogHeader>
          {trackSuccess ? (
            <div className="py-6 text-center">
              <div className="text-green-600 text-4xl mb-2">✓</div>
              <p className="font-medium text-gray-900">Saved to your Application Tracker</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" onClick={() => setTrackDialogOpen(false)}>Done</Button>
                <a href="/dashboard"><Button className="bg-blue-600 hover:bg-blue-700">View Tracker →</Button></a>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="t-title">Job Title</Label>
                  <Input id="t-title" value={trackForm.job_title} onChange={e => setTrackForm(p => ({ ...p, job_title: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="t-company">Company</Label>
                  <Input id="t-company" value={trackForm.company_name} onChange={e => setTrackForm(p => ({ ...p, company_name: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="t-date">Date Applied</Label>
                  <Input id="t-date" type="date" value={trackForm.application_date} onChange={e => setTrackForm(p => ({ ...p, application_date: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="t-status">Status</Label>
                  <Select value={trackForm.status} onValueChange={v => setTrackForm(p => ({ ...p, status: v as TrackForm['status'] }))}>
                    <SelectTrigger id="t-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="viewed">Viewed</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="t-cv">CV Used</Label>
                <Select value={trackForm.cv_id || 'none'} onValueChange={v => setTrackForm(p => ({ ...p, cv_id: v === 'none' ? '' : v }))}>
                  <SelectTrigger id="t-cv"><SelectValue placeholder="Select CV (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific CV</SelectItem>
                    {savedCVs.map(cv => <SelectItem key={cv.id} value={cv.id}>{cv.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="t-notes">Notes</Label>
                <Textarea id="t-notes" rows={3} placeholder="Interview date, recruiter name, follow-up reminders..." value={trackForm.notes} onChange={e => setTrackForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setTrackDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleTrackSave} disabled={trackSaving} className="bg-blue-600 hover:bg-blue-700">
                  {trackSaving ? 'Saving...' : 'Save & Track'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SimilarRoles({ matches }: { matches: JobMatchResult[] }) {
  const [open, setOpen] = useState(false)
  const scoreColor = (n: number) => n >= 70 ? 'text-green-600' : n >= 50 ? 'text-amber-600' : 'text-slate-500'
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-medium text-slate-600"
      >
        <span>Similar roles you also match ({matches.length})</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="divide-y divide-slate-100">
          {matches.map((m, i) => (
            <div key={i} className="px-4 py-2.5 flex items-center gap-3 bg-white">
              <span className={`text-sm font-bold w-9 flex-shrink-0 ${scoreColor(m.matchScore)}`}>{m.matchScore}%</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700">{m.detectedJobFamily || 'Similar role'}</p>
                <p className="text-xs text-slate-400">{m.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
