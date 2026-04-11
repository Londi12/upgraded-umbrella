"use client"

import { useState, useMemo } from 'react'
import { BarChart, Check, AlertCircle, ChevronDown, ChevronUp, Lightbulb, TrendingUp, Star, Wrench } from 'lucide-react'
import type { CVData } from '@/types/cv-types'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  calculateATSScores,
  calculateJobMatch,
  getSectionKey,
  isValidAtsSectionKey,
  aggregateAtsFeedback,
  atsSectionTitle,
  type ATSScore,
  type AtsSectionKey,
  type SectionScore,
} from '@/lib/cv-ats-heuristics'

export interface ATSScoringPanelProps {
  cvData: CVData | null | undefined
  currentSection: string
  jobDescription?: string
}

export function ATSScoringPanel({ cvData, currentSection, jobDescription: externalJobDescription }: ATSScoringPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [internalJD, setInternalJD] = useState('')
  const jobDescription = externalJobDescription || internalJD

  const scores = useMemo(() => (cvData ? calculateATSScores(cvData) : null), [cvData])
  const jobMatch = useMemo(() => {
    if (!cvData || !jobDescription.trim()) return null
    return calculateJobMatch(cvData, jobDescription)
  }, [cvData, jobDescription])

  const sectionKey = getSectionKey(currentSection)
  const currentScore: SectionScore = useMemo(() => {
    if (!scores) return { score: 0, feedback: [], suggestions: [] }
    if (!isValidAtsSectionKey(sectionKey)) return { score: 0, feedback: [], suggestions: [] }
    return scores.sections[sectionKey]
  }, [scores, sectionKey])

  const aggregatedFeedback = useMemo(() => (scores ? aggregateAtsFeedback(scores) : []), [scores])
  const showPerSectionFeedback = isValidAtsSectionKey(sectionKey)

  const color = (s: number) => (s >= 75 ? 'text-green-600' : s >= 55 ? 'text-emerald-600' : s >= 35 ? 'text-amber-600' : 'text-red-600')
  const bar = (s: number) => (s >= 75 ? 'bg-green-500' : s >= 55 ? 'bg-emerald-500' : s >= 35 ? 'bg-amber-500' : 'bg-red-500')
  const verdictColor = (v: string) =>
    v === 'Strong Match' ? 'bg-green-100 text-green-800' :
    v === 'Good Match' ? 'bg-emerald-100 text-emerald-800' :
    v === 'Partial Match' ? 'bg-amber-100 text-amber-800' :
    'bg-red-100 text-red-800'

  const ScoreBar = ({ score, label }: { score: number; label: string }) => (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-600">{label}</span>
        <span className={`font-medium ${color(score)}`}>{score}%</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${bar(score)} transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )

  if (!cvData || !scores) {
    return (
      <p className="text-xs text-gray-500 mt-2">
        CV data is not available for analysis.
      </p>
    )
  }

  const collapsedSummary = (
    <span className="text-sm font-medium flex items-center gap-1 flex-wrap">
      <BarChart className="h-4 w-4 text-emerald-600" />
      CV quality: <span className={color(scores.overallScore)}>{scores.overallScore}%</span>
      {jobMatch && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${verdictColor(jobMatch.verdict)}`}>{jobMatch.verdict}</span>
      )}
    </span>
  )

  if (collapsed) {
    return (
      <div className="mt-4 bg-white rounded-lg border p-3 flex justify-between items-center cursor-pointer" onClick={() => setCollapsed(false)}>
        {collapsedSummary}
        <ChevronUp className="h-4 w-4 shrink-0" />
      </div>
    )
  }

  return (
    <div className="mt-4">
      <Card className="border rounded-lg overflow-hidden">
        <div className="bg-white p-3 flex justify-between items-center cursor-pointer border-b" onClick={() => setCollapsed(true)}>
          <div className="min-w-0">
            <span className="text-sm font-medium flex items-center gap-1 flex-wrap">
              <BarChart className="h-4 w-4 text-emerald-600 shrink-0" />
              CV &amp; job match
              {jobMatch && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${verdictColor(jobMatch.verdict)}`}>
                  {jobMatch.verdict} — {jobMatch.overallScore}%
                </span>
              )}
            </span>
            <p className="text-[11px] text-gray-500 mt-1 leading-snug">
              CV quality uses your full CV. Overlap scores use role taxonomies and curated job terms — not every word in the posting.
            </p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </div>

        <div className="p-4 space-y-4">

          {jobMatch ? (
            <div className="space-y-3">
              {externalJobDescription && (
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <Star className="h-3 w-3 shrink-0" /> Compared to this job description
                </p>
              )}

              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="text-[11px] text-gray-500 mb-2">Heuristic overlap (not a guarantee of shortlisting)</p>
                <ScoreBar score={jobMatch.skillsScore} label="Focus areas &amp; terms" />
                <ScoreBar score={jobMatch.experienceScore} label="Experience vs stated years" />
                <ScoreBar score={jobMatch.educationScore} label="Education signals" />
                <ScoreBar score={jobMatch.titleScore} label="Role line vs your CV" />
              </div>

              {jobMatch.yearsRequired !== null && (
                <div className="text-xs text-gray-600 bg-blue-50 rounded p-2">
                  <span className="font-medium">Experience: </span>
                  Job requires {jobMatch.yearsRequired} years — you have ~{jobMatch.yearsCandidate} years
                  {jobMatch.yearsCandidate >= jobMatch.yearsRequired
                    ? <span className="text-green-600 ml-1">✓ Meets requirement</span>
                    : <span className="text-amber-600 ml-1">⚠ Below requirement</span>}
                </div>
              )}

              {jobMatch.matchedSkills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Wrench className="h-3 w-3 text-green-600 shrink-0" /> Matched focus areas / terms
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {jobMatch.matchedSkills.map((s, i) => (
                      <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {jobMatch.missingSkills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" /> Not clearly on your CV
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {jobMatch.missingSkills.map((s, i) => (
                      <span key={i} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {jobMatch.missingKeywords.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Frequent words in posting missing from CV</p>
                  <div className="flex flex-wrap gap-1">
                    {jobMatch.missingKeywords.map((k, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {jobMatch.tips.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-800 mb-1 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3 shrink-0" /> Suggestions
                  </p>
                  <ul className="space-y-1">
                    {jobMatch.tips.map((t, i) => <li key={i} className="text-xs text-blue-700">• {t}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            !externalJobDescription && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-blue-500 shrink-0" /> Paste a job description to compare
                </p>
                <Textarea
                  placeholder="Paste job description here..."
                  value={internalJD}
                  onChange={e => setInternalJD(e.target.value)}
                  className="text-xs min-h-[80px]"
                />
              </div>
            )
          )}

          <CvQualityBlock
            scores={scores}
            showPerSectionFeedback={showPerSectionFeedback}
            sectionKey={sectionKey}
            currentScore={currentScore}
            aggregatedFeedback={aggregatedFeedback}
            color={color}
          />

        </div>
      </Card>
    </div>
  )
}

function CvQualityBlock({
  scores,
  showPerSectionFeedback,
  sectionKey,
  currentScore,
  aggregatedFeedback,
  color,
}: {
  scores: ATSScore
  showPerSectionFeedback: boolean
  sectionKey: string
  currentScore: SectionScore
  aggregatedFeedback: string[]
  color: (s: number) => string
}) {
  return (
    <div className="border-t pt-3">
      <p className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
        <BarChart className="h-3 w-3 text-emerald-600 shrink-0" /> CV quality score
      </p>
      <p className="text-[11px] text-gray-500 mb-2">
        Weighted across personal details, summary, experience, education, and skills ({scores.overallScore}% overall).
      </p>
      <p className={`text-sm font-semibold mb-2 ${color(scores.overallScore)}`}>{scores.overallScore}%</p>

      {showPerSectionFeedback ? (
        <>
          <p className="text-xs font-medium text-gray-600 mb-1">{atsSectionTitle(sectionKey as AtsSectionKey)} — this step</p>
          {currentScore.feedback.length > 0 ? (
            <ul className="space-y-1">
              {currentScore.feedback.map((f, i) => (
                <li key={i} className="text-xs flex items-start gap-1 text-amber-700">
                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />{f}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3 shrink-0" /> No issues flagged for this section.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-xs font-medium text-gray-600 mb-1">All sections — quick check</p>
          {aggregatedFeedback.length > 0 ? (
            <ul className="space-y-1">
              {aggregatedFeedback.map((f, i) => (
                <li key={i} className="text-xs flex items-start gap-1 text-amber-700">
                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />{f}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <Check className="h-3 w-3 shrink-0 text-gray-500" /> No common structural issues flagged across your CV sections.
            </p>
          )}
        </>
      )}
    </div>
  )
}
