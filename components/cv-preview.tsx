import type { CVData, TemplateType } from "@/types/cv-types"
import type { CSSProperties } from "react"

interface CVPreviewProps {
  template: TemplateType
  className?: string
  userData?: Partial<CVData>
  style?: CSSProperties
  noId?: boolean
}

type Theme = {
  accent: string
  accentSoft: string
  headerBg: string
  headerText: string
  sectionTitle: string
  tagBg: string
  tagText: string
  sidebarBg?: string
  sidebarText?: string
}

const HARVARD_TEMPLATES: TemplateType[] = ["professional", "simple", "chronological", "functional"]
const SA_CLEAN_TEMPLATES: TemplateType[] = ["sa-modern", "sa-executive", "sa-professional"]

const DEFAULT_EXPERIENCE = [
  {
    title: "Senior Role",
    company: "ABC Company",
    location: "Johannesburg",
    startDate: "2021",
    endDate: "Present",
    description: "Led key initiatives, improved processes, and delivered measurable business impact.",
  },
  {
    title: "Mid-Level Role",
    company: "XYZ Group",
    location: "Cape Town",
    startDate: "2018",
    endDate: "2021",
    description: "Owned day-to-day execution and collaborated with cross-functional teams.",
  },
]

const DEFAULT_EDUCATION = [
  {
    degree: "Bachelor Degree",
    institution: "University",
    location: "South Africa",
    graduationDate: "2018",
  },
]

const DEFAULT_SKILLS = ["Communication", "Leadership", "Problem Solving", "Project Delivery", "Stakeholder Management", "Data Analysis"]

const TEMPLATE_THEME: Record<TemplateType, Theme> = {
  professional: {
    accent: "border-slate-800",
    accentSoft: "bg-slate-100",
    headerBg: "bg-white",
    headerText: "text-slate-900",
    sectionTitle: "text-slate-900",
    tagBg: "bg-slate-100",
    tagText: "text-slate-700",
  },
  modern: {
    accent: "border-slate-400",
    accentSoft: "bg-slate-50",
    headerBg: "bg-white",
    headerText: "text-slate-900",
    sectionTitle: "text-slate-900",
    tagBg: "bg-slate-100",
    tagText: "text-slate-700",
  },
  creative: {
    accent: "border-zinc-400",
    accentSoft: "bg-zinc-50",
    headerBg: "bg-white",
    headerText: "text-slate-900",
    sectionTitle: "text-slate-900",
    tagBg: "bg-zinc-100",
    tagText: "text-zinc-700",
  },
  simple: {
    accent: "border-zinc-500",
    accentSoft: "bg-zinc-50",
    headerBg: "bg-white",
    headerText: "text-zinc-900",
    sectionTitle: "text-zinc-800",
    tagBg: "bg-zinc-100",
    tagText: "text-zinc-700",
  },
  executive: {
    accent: "border-slate-900",
    accentSoft: "bg-slate-100",
    headerBg: "bg-slate-900",
    headerText: "text-white",
    sectionTitle: "text-slate-900",
    tagBg: "bg-slate-100",
    tagText: "text-slate-700",
  },
  technical: {
    accent: "border-cyan-700",
    accentSoft: "bg-cyan-50",
    headerBg: "bg-white",
    headerText: "text-slate-900",
    sectionTitle: "text-cyan-700",
    tagBg: "bg-cyan-50",
    tagText: "text-cyan-800",
  },
  graduate: {
    accent: "border-slate-400",
    accentSoft: "bg-slate-50",
    headerBg: "bg-white",
    headerText: "text-slate-900",
    sectionTitle: "text-slate-900",
    tagBg: "bg-slate-100",
    tagText: "text-slate-700",
  },
  digital: {
    accent: "border-indigo-600",
    accentSoft: "bg-indigo-50",
    headerBg: "bg-gradient-to-r from-indigo-700 to-sky-600",
    headerText: "text-white",
    sectionTitle: "text-indigo-700",
    tagBg: "bg-indigo-50",
    tagText: "text-indigo-700",
  },
  "sa-professional": {
    accent: "border-slate-500",
    accentSoft: "bg-slate-50",
    headerBg: "bg-white",
    headerText: "text-slate-900",
    sectionTitle: "text-slate-900",
    tagBg: "bg-slate-100",
    tagText: "text-slate-700",
  },
  "sa-modern": {
    accent: "border-slate-500",
    accentSoft: "bg-slate-50",
    headerBg: "bg-white",
    headerText: "text-slate-900",
    sectionTitle: "text-slate-900",
    tagBg: "bg-slate-100",
    tagText: "text-slate-700",
  },
  "sa-executive": {
    accent: "border-slate-500",
    accentSoft: "bg-slate-100",
    headerBg: "bg-white",
    headerText: "text-slate-900",
    sectionTitle: "text-slate-900",
    tagBg: "bg-slate-100",
    tagText: "text-slate-700",
  },
  compact: {
    accent: "border-slate-700",
    accentSoft: "bg-slate-50",
    headerBg: "bg-white",
    headerText: "text-slate-900",
    sectionTitle: "text-slate-800",
    tagBg: "bg-slate-100",
    tagText: "text-slate-700",
  },
  chronological: {
    accent: "border-slate-800",
    accentSoft: "bg-slate-50",
    headerBg: "bg-white",
    headerText: "text-slate-900",
    sectionTitle: "text-slate-900",
    tagBg: "bg-slate-100",
    tagText: "text-slate-700",
  },
  functional: {
    accent: "border-violet-700",
    accentSoft: "bg-violet-50",
    headerBg: "bg-white",
    headerText: "text-slate-900",
    sectionTitle: "text-violet-700",
    tagBg: "bg-violet-50",
    tagText: "text-violet-700",
  },
  sidebar: {
    accent: "border-slate-800",
    accentSoft: "bg-slate-50",
    headerBg: "bg-white",
    headerText: "text-slate-900",
    sectionTitle: "text-slate-900",
    tagBg: "bg-slate-200",
    tagText: "text-slate-800",
    sidebarBg: "bg-slate-900",
    sidebarText: "text-slate-100",
  },
  matric: {
    accent: "border-slate-500",
    accentSoft: "bg-slate-50",
    headerBg: "bg-white",
    headerText: "text-slate-900",
    sectionTitle: "text-slate-900",
    tagBg: "bg-slate-100",
    tagText: "text-slate-700",
  },
}

export function CVPreview({ template, className = "", userData, style, noId }: CVPreviewProps) {
  const normalizeSkills = (skills: CVData["skills"] | undefined): string[] => {
    if (!skills) return []

    if (Array.isArray(skills)) {
      return skills
        .map((skill) => (typeof skill === "string" ? skill : skill.name))
        .map((skill) => skill.trim())
        .filter(Boolean)
    }

    const trimmed = skills.trim()
    if (!trimmed) return []

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed
            .map((skill) => {
              if (typeof skill === "string") return skill
              if (skill && typeof skill === "object" && "name" in skill) return String(skill.name)
              return ""
            })
            .map((skill) => skill.trim())
            .filter(Boolean)
        }
      } catch {
        // Fall back to comma split.
      }
    }

    return trimmed
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)
  }

  const isA4Preview = className.includes("a4-preview")
  const theme = TEMPLATE_THEME[template]
  const isHarvardStyle = HARVARD_TEMPLATES.includes(template)
  const isSAClean = SA_CLEAN_TEMPLATES.includes(template)

  const typeScale = {
    name: isA4Preview ? "text-[29px]" : "text-lg",
    title: isA4Preview ? "text-[15px]" : "text-sm",
    section: isA4Preview ? "text-[11px]" : "text-[10px]",
    body: isA4Preview ? "text-[11px]" : "text-xs",
    fine: isA4Preview ? "text-[10px]" : "text-[11px]",
    pad: isA4Preview ? "p-8" : "p-4",
    gap: isA4Preview ? "space-y-5" : "space-y-3",
  }

  const fullName = userData?.personalInfo?.fullName || "John Smith"
  const jobTitle = userData?.personalInfo?.jobTitle || "Professional Role"
  const email = userData?.personalInfo?.email || "john.smith@email.com"
  const phone = userData?.personalInfo?.phone || "+27 11 123 4567"
  const location = userData?.personalInfo?.location || "Johannesburg, South Africa"
  const linkedIn = userData?.personalInfo?.linkedIn
  const summary =
    userData?.summary ||
    "Results-driven professional with proven experience delivering measurable outcomes, leading cross-functional collaboration, and improving business performance."

  const experience = userData?.experience?.length ? userData.experience : DEFAULT_EXPERIENCE
  const education = userData?.education?.length ? userData.education : DEFAULT_EDUCATION
  const skills = normalizeSkills(userData?.skills).length ? normalizeSkills(userData?.skills) : DEFAULT_SKILLS

  const dateRange = (start?: string, end?: string) => {
    const s = start && start !== "Start Date" && start !== "Start" ? start : ""
    const e = end && end !== "End Date" && end !== "End" ? end : ""
    if (!s && !e) return ""
    return `${s}${s && e ? " - " : ""}${e}`
  }

  const sectionHeading = (title: string) => (
    <h2 className={`${typeScale.section} font-bold uppercase ${isHarvardStyle || isSAClean ? "tracking-[0.08em]" : "tracking-[0.13em]"} ${theme.sectionTitle} border-b border-slate-200 pb-1`}>
      {title}
    </h2>
  )

  const renderSkillsGrid = (max = 12) => (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      {skills.slice(0, max).map((skill) => (
        <div key={skill} className="flex items-start gap-2">
          <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${theme.tagText.replace("text", "bg")}`} />
          <span className={`${typeScale.body} text-slate-700`}>{skill}</span>
        </div>
      ))}
    </div>
  )

  const renderExperience = (max = 3) => (
    <div className="space-y-3">
      {experience.slice(0, max).map((exp, index) => (
        <div key={`${exp.title}-${index}`} className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`${typeScale.body} font-semibold text-slate-900`}>{exp.title}</h3>
            <span className={`${typeScale.fine} text-slate-500 whitespace-nowrap`}>{dateRange(exp.startDate, exp.endDate)}</span>
          </div>
          <p className={`${typeScale.fine} text-slate-600`}>{[exp.company, exp.location].filter(Boolean).join(" | ")}</p>
          {exp.description ? (
            <ul className="list-disc pl-4 space-y-1">
              {exp.description
                .split("\n")
                .filter(Boolean)
                .slice(0, isA4Preview ? 4 : 2)
                .map((line, i) => (
                  <li key={i} className={`${typeScale.fine} text-slate-700`}>{line}</li>
                ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  )

  const renderEducation = (max = 2) => (
    <div className="space-y-2">
      {education.slice(0, max).map((edu, index) => (
        <div key={`${edu.degree}-${index}`}>
          <div className="flex items-start justify-between gap-2">
            <h3 className={`${typeScale.body} font-semibold text-slate-900`}>{edu.degree}</h3>
            <span className={`${typeScale.fine} text-slate-500 whitespace-nowrap`}>{edu.graduationDate}</span>
          </div>
          <p className={`${typeScale.fine} text-slate-600`}>{[edu.institution, edu.location].filter(Boolean).join(" | ")}</p>
          {edu.nqfLevel ? <p className={`${typeScale.fine} text-slate-500`}>NQF {edu.nqfLevel}</p> : null}
        </div>
      ))}
    </div>
  )

  const renderCustomSections = () =>
    userData?.customSections?.map((section) => {
      if (!section.title) return null
      return (
        <div key={section.id} className="space-y-1.5">
          {sectionHeading(section.title)}
          <p className={`${typeScale.fine} whitespace-pre-line text-slate-700`}>{section.content}</p>
        </div>
      )
    })

  const flagStripe =
    template === "sa-professional" || template === "sa-executive" ? (
      <div className="flex gap-0.5">
        <span className="h-1 w-8 bg-red-600" />
        <span className="h-1 w-8 bg-blue-600" />
        <span className="h-1 w-8 bg-green-600" />
        <span className="h-1 w-8 bg-yellow-500" />
        <span className="h-1 w-8 bg-black" />
      </div>
    ) : null

  const renderClassic = () => (
    <div className={`${theme.headerBg} ${isA4Preview ? "min-h-full" : "h-full"}`}>
      <div className={`${typeScale.pad} ${typeScale.gap}`}>
        <header className={`${isHarvardStyle || isSAClean ? "border-b border-slate-300 pb-3 space-y-2" : `border-l-4 ${theme.accent} pl-4 space-y-2`}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className={`${typeScale.name} font-bold tracking-tight ${theme.headerText}`}>{fullName}</h1>
              <p className={`${typeScale.title} font-medium ${theme.headerText === "text-white" ? "text-white/90" : "text-slate-700"}`}>{jobTitle}</p>
            </div>
            {isSAClean ? flagStripe : null}
          </div>
          <div className={`flex flex-wrap gap-x-4 gap-y-1 ${typeScale.fine} ${theme.headerText === "text-white" ? "text-white/90" : "text-slate-600"}`}>
            <span>{email}</span>
            <span>{phone}</span>
            <span>{location}</span>
            {linkedIn ? <span>{linkedIn}</span> : null}
          </div>
        </header>

        <section className="space-y-1.5">
          {sectionHeading(template === "simple" ? "Objective" : "Professional Summary")}
          <p className={`${typeScale.body} text-slate-700 leading-relaxed`}>{summary}</p>
        </section>

        {template === "functional" ? (
          <div className="grid grid-cols-2 gap-6">
            <section className="space-y-2">
              {sectionHeading("Core Competencies")}
              {renderSkillsGrid(14)}
            </section>
            <section className="space-y-2">
              {sectionHeading("Relevant Experience")}
              {renderExperience(2)}
            </section>
          </div>
        ) : (
          <>
            <section className="space-y-2">
              {sectionHeading(template === "chronological" ? "Work Experience" : "Professional Experience")}
              {renderExperience(template === "compact" ? 2 : 3)}
            </section>
            <section className="space-y-2">
              {sectionHeading("Education")}
              {renderEducation(template === "matric" ? 1 : 2)}
            </section>
            <section className="space-y-2">
              {sectionHeading(template === "technical" ? "Technical Skills" : "Skills")}
              {renderSkillsGrid(template === "matric" ? 8 : 12)}
            </section>
          </>
        )}

        {renderCustomSections()}
      </div>
    </div>
  )

  const renderSidebar = () => (
    <div className={`${isA4Preview ? "min-h-full" : "h-full"} bg-white`}>
      <div className="flex h-full">
        <aside className={`w-[34%] ${theme.sidebarBg || "bg-slate-900"} ${theme.sidebarText || "text-slate-100"} ${isA4Preview ? "p-6" : "p-3"} space-y-4`}>
          <div>
            <h1 className={`${isA4Preview ? "text-[20px]" : "text-sm"} font-bold leading-tight`}>{fullName}</h1>
            <p className={`${typeScale.fine} opacity-90 mt-1`}>{jobTitle}</p>
          </div>
          <div className="space-y-1">
            <p className={`${typeScale.section} uppercase tracking-[0.11em] opacity-80`}>Contact</p>
            <p className={`${typeScale.fine} break-all`}>{email}</p>
            <p className={typeScale.fine}>{phone}</p>
            <p className={typeScale.fine}>{location}</p>
            {linkedIn ? <p className={`${typeScale.fine} break-all`}>{linkedIn}</p> : null}
          </div>
          <div className="space-y-1">
            <p className={`${typeScale.section} uppercase tracking-[0.11em] opacity-80`}>Skills</p>
            {skills.slice(0, 12).map((skill) => (
              <p key={skill} className={typeScale.fine}>- {skill}</p>
            ))}
          </div>
          {userData?.personalInfo?.languages?.length ? (
            <div className="space-y-1">
              <p className={`${typeScale.section} uppercase tracking-[0.11em] opacity-80`}>Languages</p>
              {userData.personalInfo.languages.map((language) => (
                <p key={language} className={typeScale.fine}>- {language}</p>
              ))}
            </div>
          ) : null}
        </aside>

        <main className={`${isA4Preview ? "p-7" : "p-3"} flex-1 space-y-4`}>
          <section className="space-y-1.5">
            {sectionHeading("Summary")}
            <p className={`${typeScale.body} text-slate-700 leading-relaxed`}>{summary}</p>
          </section>
          <section className="space-y-2">
            {sectionHeading("Experience")}
            {renderExperience(3)}
          </section>
          <section className="space-y-2">
            {sectionHeading("Education")}
            {renderEducation(2)}
          </section>
          {renderCustomSections()}
        </main>
      </div>
    </div>
  )

  const renderCompact = () => (
    <div className={`${isA4Preview ? "min-h-full" : "h-full"} bg-white`}>
      <div className={`${isA4Preview ? "p-7" : "p-3"} space-y-4`}>
        <header className="flex items-start justify-between border-b border-slate-300 pb-3">
          <div>
            <h1 className={`${isA4Preview ? "text-[24px]" : "text-base"} font-bold text-slate-900`}>{fullName}</h1>
            <p className={`${typeScale.body} text-slate-700 mt-0.5`}>{jobTitle}</p>
          </div>
          <div className={`${typeScale.fine} text-slate-600 text-right`}>
            <p>{email}</p>
            <p>{phone}</p>
            <p>{location}</p>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            <section className="space-y-1.5">
              {sectionHeading("Summary")}
              <p className={`${typeScale.body} text-slate-700`}>{summary}</p>
            </section>
            <section className="space-y-2">
              {sectionHeading("Experience")}
              {renderExperience(3)}
            </section>
            <section className="space-y-2">
              {sectionHeading("Education")}
              {renderEducation(2)}
            </section>
          </div>
          <div className="space-y-2">
            {sectionHeading("Skills")}
            <div className="space-y-1.5">
              {skills.slice(0, 12).map((skill) => (
                <span key={skill} className={`inline-block w-full px-2 py-1 rounded ${theme.tagBg} ${theme.tagText} ${typeScale.fine}`}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
        {renderCustomSections()}
      </div>
    </div>
  )

  const renderModernMinimal = () => (
    <div className={`${isA4Preview ? "min-h-full" : "h-full"} bg-white`}>
      <div className={`${isA4Preview ? "p-7" : "p-3"} space-y-4`}>
        <header className="border-b border-slate-300 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className={`${isA4Preview ? "text-[26px]" : "text-base"} font-semibold text-slate-900`}>{fullName}</h1>
              <p className={`${typeScale.body} text-slate-700 mt-0.5`}>{jobTitle}</p>
            </div>
            <div className={`${typeScale.fine} text-right text-slate-600`}>
              <p>{email}</p>
              <p>{phone}</p>
              <p>{location}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-5">
          <section className="col-span-2 space-y-4">
            <div className="space-y-1.5">
              {sectionHeading("Profile")}
              <p className={`${typeScale.body} text-slate-700`}>{summary}</p>
            </div>
            <div className="space-y-2">
              {sectionHeading("Experience")}
              {renderExperience(3)}
            </div>
            <div className="space-y-2">
              {sectionHeading("Education")}
              {renderEducation(2)}
            </div>
          </section>
          <aside className="space-y-2">
            {sectionHeading("Core Skills")}
            <div className="space-y-1">
              {skills.slice(0, 10).map((skill) => (
                <p key={skill} className={`${typeScale.fine} text-slate-700`}>{skill}</p>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )

  const renderCreativeClean = () => (
    <div className={`${isA4Preview ? "min-h-full" : "h-full"} bg-white`}>
      <div className={`${isA4Preview ? "p-8" : "p-4"} space-y-4`}>
        <header className="pb-3 border-b border-slate-300">
          <h1 className={`${isA4Preview ? "text-[27px]" : "text-base"} font-semibold text-slate-900`}>{fullName}</h1>
          <p className={`${typeScale.body} text-slate-700 mt-1`}>{jobTitle}</p>
          <p className={`${typeScale.fine} text-slate-600 mt-1`}>{email} | {phone} | {location}</p>
        </header>

        <section className="space-y-1.5">
          {sectionHeading("Profile")}
          <p className={`${typeScale.body} text-slate-700`}>{summary}</p>
        </section>

        <div className="grid grid-cols-2 gap-5">
          <section className="space-y-2">
            {sectionHeading("Experience")}
            {renderExperience(2)}
          </section>
          <section className="space-y-2">
            {sectionHeading("Skills")}
            {renderSkillsGrid(12)}
          </section>
        </div>

        <section className="space-y-2">
          {sectionHeading("Education")}
          {renderEducation(2)}
        </section>
      </div>
    </div>
  )

  const renderEntryLevel = () => (
    <div className={`${isA4Preview ? "min-h-full" : "h-full"} bg-white`}>
      <div className={`${isA4Preview ? "p-8" : "p-4"} space-y-4`}>
        <header className="text-center border-b border-slate-300 pb-3">
          <h1 className={`${isA4Preview ? "text-[25px]" : "text-base"} font-semibold text-slate-900`}>{fullName}</h1>
          <p className={`${typeScale.body} text-slate-700`}>{jobTitle}</p>
          <p className={`${typeScale.fine} text-slate-600 mt-1`}>{email} | {phone} | {location}</p>
        </header>

        <section className="space-y-1.5">
          {sectionHeading(template === "matric" ? "Objective" : "Profile")}
          <p className={`${typeScale.body} text-slate-700`}>{summary}</p>
        </section>

        <section className="space-y-2">
          {sectionHeading("Education")}
          {renderEducation(template === "matric" ? 1 : 2)}
        </section>

        <section className="space-y-2">
          {sectionHeading("Experience")}
          {renderExperience(2)}
        </section>

        <section className="space-y-2">
          {sectionHeading("Skills")}
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 10).map((skill) => (
              <span key={skill} className={`${typeScale.fine} bg-slate-100 text-slate-700 px-2 py-0.5 rounded`}>
                {skill}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  )

  const content =
    template === "modern"
      ? renderModernMinimal()
      : template === "creative"
      ? renderCreativeClean()
      : template === "graduate" || template === "matric"
      ? renderEntryLevel()
      : template === "sidebar"
      ? renderSidebar()
      : template === "compact"
      ? renderCompact()
      : renderClassic()

  return (
    <div id={noId ? undefined : "cv-preview-container"} className={`relative h-full w-full bg-white overflow-hidden ${className}`} style={style}>
      {content}
    </div>
  )
}
