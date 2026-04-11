"use client"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Save, Send, CheckCircle, X, ArrowLeft } from "lucide-react"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { ATSScoringPanel } from "@/components/cv-ats-scoring"
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
  onAIMatch: (confirmedFamily?: string) => void
  showBackButton?: boolean
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
  onAIMatch,
  showBackButton = true,
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

  const company = job.company || job.source || ""
  const tags = [job.job_type, job.experience_level].filter(Boolean) as string[]

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
            <h2 className="font-semibold text-gray-900 text-base leading-snug">{job.title}</h2>
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
        <div className="flex gap-1.5">
          {(["details", "analysis"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors capitalize ${
                tab === t
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {t === "analysis" && (aiMatchResults.length > 0 || selectedCVId)
                ? `${t} ${aiMatchResults.length > 0 ? `· ${aiMatchResults[0].matchScore}%` : ""}`
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
          <div className="p-5 space-y-5">
            {/* CV selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="cv-select" className="text-sm text-gray-600 whitespace-nowrap">CV:</label>
              <select
                id="cv-select"
                value={selectedCVId}
                onChange={(e) => onCVSelect(e.target.value)}
                className="flex-1 border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
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
                variant="outline"
              >
                {aiMatching ? "Matching..." : "Match"}
              </Button>
            </div>

            {/* Disambiguation */}
            {disambiguationOptions.length > 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-3">Which best describes your role?</p>
                <div className="space-y-2">
                  {disambiguationOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => onAIMatch(opt.id)}
                      className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">{opt.family}</span>
                      <span className="text-xs text-gray-500 ml-2">{opt.tier} level</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CV Classification */}
            {cvClassification && aiMatchResults.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <span>CV: <span className="font-medium text-gray-900">{cvClassification.detectedFamily}</span></span>
                <span className="text-gray-300">·</span>
                <span>{cvClassification.tier}</span>
                <span className="ml-auto px-2 py-0.5 rounded-md border border-gray-200 bg-gray-50 text-gray-700 capitalize">
                  {cvClassification.confidence}
                </span>
              </div>
            )}

            {/* Match results */}
            {aiMatchResults.length > 0 && (
              <div className="space-y-3">
                {aiMatchResults.slice(0, 5).map(match => (
                  <div
                    key={match.jobId}
                    className={`rounded-lg border bg-white p-3 ${
                      match.dealBreakers.length > 0
                        ? "border-gray-300 border-l-4 border-l-gray-800"
                        : "border-gray-200 border-l-4 border-l-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge variant="outline" className="rounded-md text-xs font-medium border-gray-300 text-gray-800 bg-gray-50">
                        {match.matchScore}% · {match.recommendation}
                      </Badge>
                      <span className="text-xs text-gray-400 capitalize">{match.confidence}</span>
                    </div>
                    <p className="text-xs text-gray-700 mb-2 leading-relaxed">{match.reasoning}</p>
                    {match.dealBreakers.length > 0 && (
                      <p className="text-xs text-gray-800 bg-gray-100 rounded-md px-2 py-1.5 mb-1 border border-gray-200">
                        {match.dealBreakers[0]}
                      </p>
                    )}
                    {match.strengths.length > 0 && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium text-gray-800">Strengths: </span>
                        {match.strengths.slice(0, 2).join(" · ")}
                      </p>
                    )}
                    {match.gaps.length > 0 && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        <span className="font-medium text-gray-800">Gaps: </span>
                        {match.gaps.slice(0, 2).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {aiMatchError && (
              <p className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3">{aiMatchError}</p>
            )}

            {/* ATS Panel */}
            {selectedCVId && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">ATS analysis</p>
                <ATSScoringPanel
                  cvData={savedCVs.find(cv => cv.id === selectedCVId)?.cv_data}
                  currentSection="job-matching"
                  jobDescription={job.description || job.snippet || ''}
                />
              </div>
            )}

            {!selectedCVId && !aiMatchResults.length && (
              <p className="text-sm text-gray-400 text-center py-8">Select a CV above to run job match and ATS analysis</p>
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
