"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CVPreview } from "@/components/cv-preview"
import { PageHeader } from "@/components/ui/page-header"

const templates = [
  { id: 1, name: "Corporate Professional", type: "professional" as const, category: "Professional" },
  { id: 2, name: "Modern Minimalist", type: "modern" as const, category: "Modern" },
  { id: 3, name: "Creative Design", type: "creative" as const, category: "Creative" },
  { id: 4, name: "Simple Clean", type: "simple" as const, category: "Simple" },
  { id: 5, name: "Executive Elite", type: "executive" as const, category: "Executive" },
  { id: 6, name: "Technical Expert", type: "technical" as const, category: "Professional" },
  { id: 7, name: "Graduate Entry", type: "graduate" as const, category: "Simple" },
  { id: 8, name: "Digital Portfolio", type: "digital" as const, category: "Creative" },
  { id: 9, name: "SA Professional", type: "sa-professional" as const, category: "South African" },
  { id: 10, name: "SA Modern", type: "sa-modern" as const, category: "South African" },
  { id: 11, name: "SA Executive", type: "sa-executive" as const, category: "South African" },
]

export default function TemplatesPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentTemplate = templates[currentIndex]

  const nextTemplate = () => {
    setCurrentIndex((prev) => (prev + 1) % templates.length)
  }

  const prevTemplate = () => {
    setCurrentIndex((prev) => (prev - 1 + templates.length) % templates.length)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Step 1: Choose Your CV Template"
        description="Select a professional template that matches your style and industry. You can always change it later."
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Template Showcase */}
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {currentTemplate.name}
              </h2>
              <p className="text-lg text-gray-600 mb-4">{currentTemplate.category}</p>
              <div className="flex justify-center gap-3">
                {templates.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentIndex 
                        ? "bg-blue-600 scale-125 shadow-lg" 
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Main Template Display */}
            <div className="flex items-center gap-8">
              <Button
                variant="outline"
                size="icon"
                onClick={prevTemplate}
                className="h-14 w-14 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <div className="flex-1 flex justify-center">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative w-96 h-[600px] bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-white">
                    <CVPreview template={currentTemplate.type} className="w-full h-full scale-90 origin-top" />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <Link href={`/create?template=${currentTemplate.id}`}>
                        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                          Use This Template
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={nextTemplate}
                className="h-14 w-14 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Template Grid Preview */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Browse All Templates
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {templates.map((template, index) => (
                <button
                  key={template.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`group relative p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                    index === currentIndex
                      ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="h-32 bg-white rounded-lg overflow-hidden shadow-sm mb-3 border">
                    <CVPreview template={template.type} className="w-full h-full scale-75 origin-top" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">
                    {template.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {template.category}
                  </p>
                  {index === currentIndex && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}