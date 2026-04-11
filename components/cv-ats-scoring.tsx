"use client"

import { useState, useMemo } from 'react'
import { BarChart, Check, AlertCircle, ChevronDown, ChevronUp, Lightbulb, TrendingUp, Star, Wrench } from 'lucide-react'
import type { CVData } from '@/types/cv-types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface ATSScoringPanelProps {
  cvData: CVData
  currentSection: string
  jobDescription?: string
}

interface SectionScore {
  score: number
  feedback: string[]
  suggestions: string[]
}

interface ATSScore {
  overallScore: number
  sections: Record<string, SectionScore>
}

interface JobMatchResult {
  overallScore: number
  skillsScore: number
  titleScore: number
  experienceScore: number
  educationScore: number
  matchedSkills: string[]
  missingSkills: string[]
  matchedKeywords: string[]
  missingKeywords: string[]
  yearsRequired: number | null
  yearsCandidate: number
  verdict: 'Strong Match' | 'Good Match' | 'Partial Match' | 'Weak Match'
  tips: string[]
}

// ─── Stopwords ───────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'the','and','a','an','in','on','at','to','for','with','as','by','of','about',
  'you','will','have','be','are','our','we','is','from','that','this','who','or',
  'not','can','your','their','has','they','would','could','should','than','then',
  'all','more','other','new','some','what','when','which','been','were','was',
  'job','work','role','position','candidate','applicant','application','company',
  'please','looking','required','must','need','wants','desired','ability','able',
  'years','experience','including','following','responsibilities','duties','skills',
  'knowledge','understanding','strong','excellent','good','great','team','working',
  'ensure','provide','support','manage','within','across','between','through'
])

// ─── Skill taxonomy ──────────────────────────────────────────────────────────
const SKILL_GROUPS: Record<string, string[]> = {
  // Tech
  javascript: ['javascript','js','node','nodejs','react','vue','angular','typescript','ts'],
  python: ['python','django','flask','fastapi','pandas','numpy','scipy'],
  java: ['java','spring','springboot','maven','gradle'],
  sql: ['sql','mysql','postgresql','postgres','oracle','mssql','sqlite','database'],
  cloud: ['aws','azure','gcp','cloud','s3','ec2','lambda','kubernetes','docker','devops'],
  data: ['data analysis','analytics','power bi','tableau','excel','reporting','dashboards'],
  // Finance
  accounting: ['accounting','bookkeeping','ifrs','gaap','financial statements','balance sheet'],
  finance: ['financial analysis','budgeting','forecasting','financial modelling','treasury'],
  // HR
  hr: ['recruitment','talent acquisition','onboarding','payroll','performance management','hris'],
  // Management
  management: ['project management','agile','scrum','pmp','prince2','stakeholder management'],
  // Soft skills
  communication: ['communication','presentation','report writing','stakeholder engagement'],
  leadership: ['leadership','team management','mentoring','coaching','people management'],
}

function normaliseText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractYearsRequired(text: string): number | null {
  const match = text.match(/(\d+)\+?\s*(?:to\s*\d+\s*)?years?\s*(?:of\s*)?(?:relevant\s*)?experience/i)
  return match ? parseInt(match[1]) : null
}

function estimateCandidateYears(cvData: CVData): number {
  if (!cvData.experience?.length) return 0
  let total = 0
  cvData.experience.forEach(exp => {
    if (exp.startDate) {
      const start = new Date(exp.startDate).getFullYear() || parseInt(exp.startDate)
      const end = exp.endDate?.toLowerCase().includes('present')
        ? new Date().getFullYear()
        : (new Date(exp.endDate || '').getFullYear() || parseInt(exp.endDate || '') || new Date().getFullYear())
      if (!isNaN(start) && !isNaN(end) && end >= start) total += end - start
    }
  })
  return Math.min(total, 40)
}

function extractSkillsFromText(text: string): string[] {
  const norm = normaliseText(text)
  const found: string[] = []
  for (const [group, variants] of Object.entries(SKILL_GROUPS)) {
    if (variants.some(v => norm.includes(v))) found.push(group)
  }
  // Also extract individual words that look like skills (capitalised or technical)
  const words = norm.split(' ').filter(w => w.length > 3 && !STOP_WORDS.has(w))
  return [...new Set([...found, ...words])]
}

function extractKeywordsFromJob(jobText: string): string[] {
  const norm = normaliseText(jobText)
  const freq = new Map<string, number>()
  norm.split(' ').filter(w => w.length > 3 && !STOP_WORDS.has(w)).forEach(w => {
    freq.set(w, (freq.get(w) || 0) + 1)
  })
  return Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 40).map(e => e[0])
}

function getCVText(cvData: CVData): string {
  return [
    cvData.personalInfo?.jobTitle || '',
    cvData.summary || '',
    ...(cvData.experience?.map(e => `${e.title} ${e.company} ${e.description}`) || []),
    ...(cvData.education?.map(e => `${e.degree} ${e.institution}`) || []),
    typeof cvData.skills === 'string' ? cvData.skills : '',
  ].join(' ')
}

function calculateJobMatch(cvData: CVData, jobDescription: string): JobMatchResult {
  const jobNorm = normaliseText(jobDescription)
  const cvText = getCVText(cvData)
  const cvNorm = normaliseText(cvText)

  // 1. Skills match
  const jobSkills = extractSkillsFromText(jobDescription)
  const cvSkills = extractSkillsFromText(cvText)
  const matchedSkills = jobSkills.filter(s => cvSkills.includes(s))
  const missingSkills = jobSkills.filter(s => !cvSkills.includes(s)).slice(0, 8)
  const skillsScore = jobSkills.length ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 50

  // 2. Title match
  const jobTitle = jobDescription.split('\n')[0].toLowerCase()
  const cvTitle = (cvData.personalInfo?.jobTitle || '').toLowerCase()
  const titleWords = jobTitle.split(' ').filter(w => w.length > 3 && !STOP_WORDS.has(w))
  const titleMatches = titleWords.filter(w => cvTitle.includes(w) || cvNorm.includes(w))
  const titleScore = titleWords.length ? Math.round((titleMatches.length / titleWords.length) * 100) : 50

  // 3. Experience years
  const yearsRequired = extractYearsRequired(jobDescription)
  const yearsCandidate = estimateCandidateYears(cvData)
  let experienceScore = 70
  if (yearsRequired !== null) {
    if (yearsCandidate >= yearsRequired) experienceScore = 100
    else if (yearsCandidate >= yearsRequired * 0.7) experienceScore = 70
    else if (yearsCandidate >= yearsRequired * 0.5) experienceScore = 50
    else experienceScore = 30
  }

  // 4. Education match
  const degreeKeywords = ['degree','diploma','certificate','bachelor','honours','masters','phd','bcom','bsc','beng','btech','matric','grade 12','nqf']
  const jobNeedsQual = degreeKeywords.some(d => jobNorm.includes(d))
  const cvHasQual = cvData.education?.some(e => e.degree || e.institution)
  const educationScore = !jobNeedsQual ? 80 : cvHasQual ? 90 : 30

  // 5. Keyword overlap
  const jobKeywords = extractKeywordsFromJob(jobDescription)
  const matchedKeywords = jobKeywords.filter(k => cvNorm.includes(k))
  const missingKeywords = jobKeywords.filter(k => !cvNorm.includes(k)).slice(0, 10)

  // Weighted overall
  const overallScore = Math.round(
    skillsScore * 0.35 +
    titleScore * 0.15 +
    experienceScore * 0.25 +
    educationScore * 0.15 +
    (matchedKeywords.length / Math.max(jobKeywords.length, 1)) * 100 * 0.10
  )

  // Verdict
  const verdict: JobMatchResult['verdict'] =
    overallScore >= 75 ? 'Strong Match' :
    overallScore >= 55 ? 'Good Match' :
    overallScore >= 35 ? 'Partial Match' : 'Weak Match'

  // Actionable tips
  const tips: string[] = []
  if (missingSkills.length) tips.push(`Add these skills to your CV: ${missingSkills.slice(0, 4).join(', ')}`)
  if (yearsRequired && yearsCandidate < yearsRequired) tips.push(`Job requires ${yearsRequired} years — highlight all relevant experience`)
  if (!cvHasQual && jobNeedsQual) tips.push('Add your qualifications — this role requires a formal degree/diploma')
  if (missingKeywords.length) tips.push(`Include these keywords: ${missingKeywords.slice(0, 4).join(', ')}`)
  if (!(cvData.summary)) tips.push('Add a professional summary tailored to this role')

  return {
    overallScore,
    skillsScore,
    titleScore,
    experienceScore,
    educationScore,
    matchedSkills: matchedSkills.slice(0, 10),
    missingSkills,
    matchedKeywords: matchedKeywords.slice(0, 10),
    missingKeywords,
    yearsRequired,
    yearsCandidate,
    verdict,
    tips,
  }
}

// ─── ATS CV scoring (unchanged logic) ────────────────────────────────────────
function getSectionKey(section: string): string {
  return section.includes('-') ? section.split('-')[0] : section
}

function calculatePersonalScore(cvData: CVData): SectionScore {
  const feedback: string[] = [], suggestions: string[] = []
  let score = 100
  const p = cvData.personalInfo
  if (!p.fullName) { feedback.push('Missing full name'); score -= 20 }
  if (!p.jobTitle) { feedback.push('Missing job title'); score -= 20 }
  if (!p.email) { feedback.push('Missing email'); score -= 20 }
  if (!p.phone) { feedback.push('Missing phone number'); score -= 20 }
  if (!p.location) { feedback.push('Missing location'); score -= 20 }
  return { score: Math.max(0, score), feedback, suggestions }
}

function calculateSummaryScore(cvData: CVData): SectionScore {
  const feedback: string[] = [], suggestions: string[] = []
  let score = 100
  if (!cvData.summary) { return { score: 0, feedback: ['Missing professional summary'], suggestions: ['Add a professional summary'] } }
  const wc = cvData.summary.split(/\s+/).length
  if (wc < 30) { feedback.push('Summary too short'); score -= 50 }
  if (!/\d+/.test(cvData.summary)) { feedback.push('No quantifiable achievements'); score -= 30 }
  return { score: Math.max(0, score), feedback, suggestions }
}

function calculateExperienceScore(cvData: CVData): SectionScore {
  const feedback: string[] = [], suggestions: string[] = []
  let score = 100
  if (!cvData.experience?.length) return { score: 0, feedback: ['No work experience'], suggestions: ['Add work experience'] }
  cvData.experience.forEach(exp => {
    if (!exp.description) { feedback.push('Missing job description'); score -= 20 }
    if (!exp.startDate) { feedback.push('Missing dates'); score -= 10 }
  })
  return { score: Math.max(0, score), feedback, suggestions }
}

function calculateEducationScore(cvData: CVData): SectionScore {
  const feedback: string[] = [], suggestions: string[] = []
  let score = 100
  if (!cvData.education?.length) return { score: 0, feedback: ['No education listed'], suggestions: ['Add education'] }
  cvData.education.forEach(edu => {
    if (!edu.degree) { feedback.push('Missing degree'); score -= 20 }
    if (!edu.institution) { feedback.push('Missing institution'); score -= 20 }
  })
  return { score: Math.max(0, score), feedback, suggestions }
}

function calculateSkillsScore(cvData: CVData): SectionScore {
  const feedback: string[] = [], suggestions: string[] = []
  let score = 100
  const s = typeof cvData.skills === 'string' ? cvData.skills : ''
  if (!s.trim()) return { score: 0, feedback: ['No skills listed'], suggestions: ['Add skills'] }
  const list = s.split(/,|\n/).filter(x => x.trim())
  if (list.length < 5) { feedback.push('Less than 5 skills listed'); score -= 50 }
  return { score: Math.max(0, score), feedback, suggestions }
}

function calculateATSScores(cvData: CVData): ATSScore {
  const personal = calculatePersonalScore(cvData)
  const summary = calculateSummaryScore(cvData)
  const experience = calculateExperienceScore(cvData)
  const education = calculateEducationScore(cvData)
  const skills = calculateSkillsScore(cvData)
  return {
    overallScore: Math.round(personal.score * 0.15 + summary.score * 0.2 + experience.score * 0.3 + education.score * 0.15 + skills.score * 0.2),
    sections: { personal, summary, experience, education, skills }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ATSScoringPanel({ cvData, currentSection, jobDescription: externalJobDescription }: ATSScoringPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [internalJD, setInternalJD] = useState('')
  const jobDescription = externalJobDescription || internalJD

  const scores = useMemo(() => calculateATSScores(cvData), [cvData])
  const jobMatch = useMemo(() => jobDescription.trim() ? calculateJobMatch(cvData, jobDescription) : null, [cvData, jobDescription])
  const currentScore = useMemo(() => scores.sections[getSectionKey(currentSection)] || { score: 0, feedback: [], suggestions: [] }, [scores, currentSection])

  const scoreTone = (s: number) => (s >= 55 ? "text-gray-900" : "text-gray-600")
  const barFill = (s: number) => (s >= 55 ? "bg-gray-700" : "bg-gray-400")
  const verdictStyle = (v: string) =>
    v === "Strong Match" || v === "Good Match"
      ? "border-gray-300 bg-gray-50 text-gray-800"
      : "border-gray-200 bg-white text-gray-700"

  const ScoreBar = ({ score, label }: { score: number; label: string }) => (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-600">{label}</span>
        <span className={`font-medium tabular-nums ${scoreTone(score)}`}>{score}%</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${barFill(score)} transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )

  if (collapsed) return (
    <div className="mt-4 bg-white rounded-lg border border-gray-200 p-3 flex justify-between items-center cursor-pointer" onClick={() => setCollapsed(false)}>
      <span className="text-sm font-medium flex items-center gap-2 flex-wrap">
        <BarChart className="h-4 w-4 text-gray-500" />
        <span className="text-gray-700">CV analysis</span>
        <span className={`tabular-nums ${scoreTone(scores.overallScore)}`}>{scores.overallScore}%</span>
        {jobMatch && (
          <span className={`text-xs px-2 py-0.5 rounded-md border ${verdictStyle(jobMatch.verdict)}`}>{jobMatch.verdict}</span>
        )}
      </span>
      <ChevronUp className="h-4 w-4 text-gray-400" />
    </div>
  )

  return (
    <div className="mt-4">
      <Card className="border border-gray-200 rounded-lg overflow-hidden shadow-none">
        <div className="bg-white p-3 flex justify-between items-center cursor-pointer border-b border-gray-100" onClick={() => setCollapsed(true)}>
          <span className="text-sm font-medium flex items-center gap-2 flex-wrap">
            <BarChart className="h-4 w-4 text-gray-500" />
            <span className="text-gray-800">CV analysis</span>
            {jobMatch && (
              <span className={`text-xs px-2 py-0.5 rounded-md border ${verdictStyle(jobMatch.verdict)}`}>
                {jobMatch.verdict} · <span className="tabular-nums">{jobMatch.overallScore}%</span>
              </span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>

        <div className="p-4 space-y-4">

          {/* Job Match — shown first when available */}
          {jobMatch ? (
            <div className="space-y-3">
              {externalJobDescription && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Star className="h-3 w-3 text-gray-400 shrink-0" /> Matched to this job description
                </p>
              )}

              {/* Dimension scores */}
              <div className="bg-gray-50/80 rounded-lg border border-gray-100 p-3 space-y-1">
                <ScoreBar score={jobMatch.skillsScore} label="Skills Match" />
                <ScoreBar score={jobMatch.experienceScore} label="Experience Match" />
                <ScoreBar score={jobMatch.educationScore} label="Education Match" />
                <ScoreBar score={jobMatch.titleScore} label="Role Alignment" />
              </div>

              {/* Years */}
              {jobMatch.yearsRequired !== null && (
                <div className="text-xs text-gray-700 bg-white rounded-md border border-gray-200 p-2.5">
                  <span className="font-medium text-gray-900">Experience: </span>
                  Job requires {jobMatch.yearsRequired} years — you have ~{jobMatch.yearsCandidate} years
                  <span className="text-gray-500 ml-1">
                    ({jobMatch.yearsCandidate >= jobMatch.yearsRequired ? "meets requirement" : "below stated requirement"})
                  </span>
                </div>
              )}

              {/* Matched skills */}
              {jobMatch.matchedSkills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1"><Wrench className="h-3 w-3 text-gray-400" /> Matched skills</p>
                  <div className="flex flex-wrap gap-1">
                    {jobMatch.matchedSkills.map((s, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md border border-gray-200">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing skills */}
              {jobMatch.missingSkills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1"><AlertCircle className="h-3 w-3 text-gray-400" /> Skills to add</p>
                  <div className="flex flex-wrap gap-1">
                    {jobMatch.missingSkills.map((s, i) => (
                      <span key={i} className="text-xs bg-white text-gray-700 px-2 py-0.5 rounded-md border border-dashed border-gray-300">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing keywords */}
              {jobMatch.missingKeywords.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1.5">Keywords to consider</p>
                  <div className="flex flex-wrap gap-1">
                    {jobMatch.missingKeywords.map((k, i) => (
                      <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {jobMatch.tips.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-800 mb-1.5 flex items-center gap-1"><Lightbulb className="h-3 w-3 text-gray-500" /> How to improve your match</p>
                  <ul className="space-y-1">
                    {jobMatch.tips.map((t, i) => <li key={i} className="text-xs text-gray-600 leading-relaxed pl-0.5">· {t}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* No job selected — show textarea */
            !externalJobDescription && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-gray-400" /> Paste a job description to match
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

          {/* CV ATS score */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
              <BarChart className="h-3 w-3 text-gray-400" /> CV quality: <span className={`tabular-nums ${scoreTone(scores.overallScore)}`}>{scores.overallScore}%</span>
            </p>
            {currentScore.feedback.length > 0 ? (
              <ul className="space-y-1">
                {currentScore.feedback.map((f, i) => (
                  <li key={i} className="text-xs flex items-start gap-1 text-gray-700">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0 text-gray-400" />{f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-600 flex items-center gap-1"><Check className="h-3 w-3 text-gray-500" /> This section looks good.</p>
            )}
          </div>

        </div>
      </Card>
    </div>
  )
}
