"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, ArrowRight, FileText, Download } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"

const coverLetterTemplates = [
  { id: 1, name: "Professional Business", type: "professional" as const, category: "Professional", description: "Clean and formal design perfect for corporate applications" },
  { id: 2, name: "Modern Creative", type: "modern" as const, category: "Creative", description: "Contemporary layout with subtle design elements" },
  { id: 3, name: "Executive Premium", type: "executive" as const, category: "Executive", description: "Sophisticated template for senior-level positions" },
  { id: 4, name: "Simple Clean", type: "simple" as const, category: "Simple", description: "Minimalist approach focusing on content" },
  { id: 5, name: "SA Professional", type: "sa-professional" as const, category: "South African", description: "Tailored for South African business standards" },
]

export default function CoverLetterTemplatesPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentTemplate = coverLetterTemplates[currentIndex]

  const nextTemplate = () => {
    setCurrentIndex((prev) => (prev + 1) % coverLetterTemplates.length)
  }

  const prevTemplate = () => {
    setCurrentIndex((prev) => (prev - 1 + coverLetterTemplates.length) % coverLetterTemplates.length)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Cover Letter Templates"
        description="Choose from professionally designed cover letter templates that complement your CV and make a strong first impression."
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Template Showcase */}
          <div className="relative bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 shadow-xl mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {currentTemplate.name}
              </h2>
              <p className="text-lg text-gray-600 mb-4">{currentTemplate.description}</p>
              <Badge variant="secondary" className="mb-4 bg-white/80">
                {currentTemplate.category}
              </Badge>
              <div className="flex justify-center gap-3">
                {coverLetterTemplates.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentIndex 
                        ? "bg-green-600 scale-125 shadow-lg" 
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
                  <div className="absolute -inset-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative w-96 h-[500px] bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-white">
                    <div className="p-6 h-full overflow-hidden">
                      <div className="space-y-3 text-sm">
                        <div className="text-right text-gray-600 text-xs">
                          {new Date().toLocaleDateString()}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="font-semibold">Hiring Manager</div>
                          <div>Company Name</div>
                          <div>Company Address</div>
                        </div>
                        <div className="font-semibold text-sm">Dear Hiring Manager,</div>
                        <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
                          <p>I am writing to express my strong interest in the [Position Title] role at [Company Name]. With my background in [relevant field], I am confident that I would be a valuable addition to your team.</p>
                          <p>In my previous role as [Previous Position], I successfully [achievement]. This experience has equipped me with [relevant skills] that directly align with the requirements of this position.</p>
                          <p>I am particularly drawn to [Company Name] because of [specific reason]. I would welcome the opportunity to discuss how my skills can contribute to your team's success.</p>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div>Sincerely,</div>
                          <div className="font-semibold">[Your Name]</div>
                        </div>
                      </div>
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

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Link href={`/create-cover-letter?template=${currentTemplate.id}`}>
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                  <FileText className="mr-2 h-5 w-5" />
                  Use This Template
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="px-8 py-4 bg-white shadow-lg hover:shadow-xl">
                <Download className="mr-2 h-5 w-5" />
                Preview PDF
              </Button>
            </div>
          </div>

          {/* Enhanced Templates Grid */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Browse All Cover Letter Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coverLetterTemplates.map((template, index) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg group ${
                    index === currentIndex ? "ring-2 ring-green-500 shadow-lg scale-105" : "hover:scale-102"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                >
                  <CardHeader>
                    <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border mb-4 p-4 relative overflow-hidden">
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-300 rounded w-1/3 ml-auto"></div>
                        <div className="space-y-1">
                          <div className="h-2 bg-gray-400 rounded w-1/4"></div>
                          <div className="h-2 bg-gray-300 rounded w-1/3"></div>
                          <div className="h-2 bg-gray-300 rounded w-1/4"></div>
                        </div>
                        <div className="h-2 bg-gray-500 rounded w-1/2"></div>
                        <div className="space-y-1">
                          <div className="h-1 bg-gray-200 rounded"></div>
                          <div className="h-1 bg-gray-200 rounded"></div>
                          <div className="h-1 bg-gray-200 rounded w-4/5"></div>
                          <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-1 bg-gray-200 rounded w-5/6"></div>
                        </div>
                        <div className="space-y-1 mt-3">
                          <div className="h-1 bg-gray-300 rounded w-1/4"></div>
                          <div className="h-2 bg-gray-400 rounded w-1/3"></div>
                        </div>
                      </div>
                      {index === currentIndex && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-green-600 transition-colors">{template.name}</CardTitle>
                    <CardDescription className="text-sm">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{template.category}</Badge>
                      <Button size="sm" variant="ghost" className="group-hover:bg-green-50 group-hover:text-green-600">
                        Select
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}