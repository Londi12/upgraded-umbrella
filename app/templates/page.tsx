"use client"

import { useState, useMemo } from "react"
import { Search, ExternalLink, CheckCircle, Lightbulb, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CVPreview } from "@/components/cv-preview"
import type { TemplateType } from "@/types/cv-types"

interface Template {
  id: number
  name: string
  type: TemplateType
  category: string
  tags: string[]
  bestFor: string
  popular?: boolean
}

const TEMPLATES: Template[] = [
  { id: 1,  name: "Simple Clean",        type: "simple",          category: "Simple",        tags: ["Clean", "ATS-Friendly"],       bestFor: "Corporate, Entry-level, General applications", popular: true },
  { id: 2,  name: "Modern Minimalist",   type: "modern",          category: "Modern",        tags: ["Modern", "ATS-Friendly"],      bestFor: "Tech, Creative, Startups" },
  { id: 3,  name: "Creative Design",     type: "creative",        category: "Creative",      tags: ["Creative", "Visual"],          bestFor: "Design, Marketing, Media" },
  { id: 4,  name: "Corporate Professional", type: "professional", category: "Professional",  tags: ["Professional", "Executive"],   bestFor: "Finance, Law, Consulting", popular: true },
  { id: 5,  name: "Technical Expert",    type: "technical",       category: "Professional",  tags: ["Professional", "Structured"],  bestFor: "Engineering, IT, Data" },
  { id: 6,  name: "Graduate Entry",      type: "graduate",        category: "Simple",        tags: ["Simple", "Entry-Level"],       bestFor: "Graduates, Learnerships, Internships" },
  { id: 7,  name: "Executive Elite",     type: "executive",       category: "Executive",     tags: ["Executive", "Premium"],        bestFor: "C-Suite, Senior Management" },
  { id: 8,  name: "Digital Portfolio",   type: "digital",         category: "Creative",      tags: ["Creative", "Modern"],          bestFor: "Designers, Developers, Freelancers" },
  { id: 9,  name: "SA Modern",           type: "sa-modern",       category: "South African", tags: ["South Africa", "Clean"],       bestFor: "SA market, BEE roles, General", popular: true },
  { id: 10, name: "SA Professional",     type: "sa-professional", category: "South African", tags: ["South Africa", "Professional"],bestFor: "SA corporate, Government, Finance" },
  { id: 11, name: "SA Executive",        type: "sa-executive",    category: "South African", tags: ["South Africa", "Executive"],   bestFor: "SA C-Suite, Senior leadership" },
  { id: 12, name: "Compact One-Page",    type: "compact",         category: "Simple",        tags: ["Compact", "ATS-Friendly"],     bestFor: "Experienced professionals, one-pagers", popular: true },
  { id: 13, name: "Chronological",       type: "chronological",   category: "Professional",  tags: ["Professional", "Structured"],  bestFor: "Traditional industries, Accounting, Law" },
  { id: 14, name: "Functional / Skills-First", type: "functional",category: "Modern",        tags: ["Modern", "Skills-First"],      bestFor: "Career changers, Skills-heavy roles" },
  { id: 15, name: "Sidebar",             type: "sidebar",         category: "Modern",        tags: ["Modern", "Visual"],            bestFor: "HR, Marketing, Creative roles" },
  { id: 16, name: "Matric / School Leaver", type: "matric",       category: "Simple",        tags: ["Simple", "Entry-Level"],       bestFor: "School leavers, First job, Learnerships", popular: true },
]

const CATEGORIES = ["All Templates", "Professional", "Creative", "ATS-Friendly", "Entry-Level", "South African"]
const SORT_OPTIONS = ["Most Popular", "Newest", "A-Z"]
const PAGE_SIZE = 9

export default function TemplatesPage() {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("All Templates")
  const [sortBy, setSortBy] = useState("Most Popular")
  const [selectedId, setSelectedId] = useState(1)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let list = TEMPLATES.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      const matchesCategory =
        activeCategory === "All Templates" ||
        t.category === activeCategory ||
        t.tags.includes(activeCategory)
      return matchesSearch && matchesCategory
    })

    if (sortBy === "Most Popular") list = [...list].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0))
    if (sortBy === "A-Z") list = [...list].sort((a, b) => a.name.localeCompare(b.name))

    return list
  }, [search, activeCategory, sortBy])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selected = TEMPLATES.find(t => t.id === selectedId) ?? TEMPLATES[0]

  const handleSelect = (id: number) => setSelectedId(id)
  const handleCategoryChange = (cat: string) => { setActiveCategory(cat); setPage(1) }
  const handleSearch = (val: string) => { setSearch(val); setPage(1) }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="container mx-auto max-w-7xl flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">Step 1</span>
          <h1 className="text-base font-semibold text-gray-800">Choose Your CV Template</h1>
          <p className="text-sm text-gray-500 hidden sm:block">Select a template — you can change it later.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex gap-6 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 min-w-0">

            {/* Search + Sort row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-9 bg-white border-gray-200"
                  placeholder="Search templates..."
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by</span>
                <select
                  className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Category filter pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Template card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginated.map(template => {
                const isSelected = template.id === selectedId
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template.id)}
                    className={`relative rounded-xl border-2 overflow-hidden text-left transition-all duration-200 bg-white hover:shadow-md ${
                      isSelected
                        ? "border-blue-500 shadow-md"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Selected
                      </div>
                    )}
                    {template.popular && !isSelected && (
                      <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        Popular
                      </div>
                    )}
                    {/* Thumbnail */}
                    <div className="h-56 bg-gray-50 overflow-hidden p-2">
                      <div className="w-full h-full overflow-hidden rounded scale-[0.85] origin-top">
                        <CVPreview template={template.type} className="w-full h-full" />
                      </div>
                    </div>
                    {/* Card footer */}
                    <div className="px-4 py-3 border-t border-gray-100">
                      <p className="font-semibold text-gray-900 text-sm">{template.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{template.tags.join(" • ")}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} templates
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                        n === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN — sticky preview sidebar ── */}
          <div className="w-80 xl:w-96 flex-shrink-0 sticky top-6 self-start">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-2 border-b border-gray-100">
                <p className="font-semibold text-gray-900">Preview</p>
              </div>

              {/* Live preview */}
              <div className="p-3 bg-gray-50 border-b border-gray-100 h-96 overflow-hidden">
                <div className="w-full h-full overflow-hidden rounded scale-[0.9] origin-top">
                  <CVPreview template={selected.type} className="w-full h-full" />
                </div>
              </div>

              {/* Template info */}
              <div className="px-4 py-3 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900">{selected.name}</p>
                  {selected.tags.map(tag => (
                    <span key={tag} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-600">
                  <span className="font-medium text-gray-700">Best for:</span> {selected.bestFor}
                </p>

                {/* CTA buttons */}
                <Link href={`/create?template=${selected.id}`} className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Use This Template
                  </Button>
                </Link>
                <Link href={`/create?template=${selected.id}&preview=true`} className="block">
                  <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview Fullscreen
                  </Button>
                </Link>

                {/* Tip box */}
                <div className="bg-blue-50 rounded-lg p-3 flex gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    You can customise colours, fonts and sections after selecting a template.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
