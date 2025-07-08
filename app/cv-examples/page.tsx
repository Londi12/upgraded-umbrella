"use client"

import { ArrowRight, Search } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CVPreview } from "@/components/cv-preview"

export default function CVExamplesPage() {
  // Industry categories
  const industries = [
    "All Industries",
    "Information Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Marketing",
    "Engineering",
    "South African Templates",
  ]

  // Example CVs data
  const examples = [
    {
      id: 1,
      title: "Software Developer",
      industry: "Information Technology",
      experience: "Mid-level",
      template: "modern" as const,
    },
    {
      id: 2,
      title: "Financial Analyst",
      industry: "Finance",
      experience: "Senior",
      template: "professional" as const,
    },
    {
      id: 3,
      title: "Registered Nurse",
      industry: "Healthcare",
      experience: "Entry-level",
      template: "simple" as const,
    },
    {
      id: 4,
      title: "High School Teacher",
      industry: "Education",
      experience: "Mid-level",
      template: "professional" as const,
    },
    {
      id: 5,
      title: "Digital Marketing Specialist",
      industry: "Marketing",
      experience: "Mid-level",
      template: "creative" as const,
    },
    {
      id: 6,
      title: "Civil Engineer",
      industry: "Engineering",
      experience: "Senior",
      template: "technical" as const,
    },
    {
      id: 7,
      title: "Data Scientist",
      industry: "Information Technology",
      experience: "Senior",
      template: "modern" as const,
    },
    {
      id: 8,
      title: "Primary School Teacher",
      industry: "Education",
      experience: "Entry-level",
      template: "graduate" as const,
    },
    {
      id: 9,
      title: "Chartered Accountant",
      industry: "Finance",
      experience: "Senior",
      template: "sa-professional" as const,
      southAfrican: true,
    },
    {
      id: 10,
      title: "IT Project Manager",
      industry: "Information Technology",
      experience: "Senior",
      template: "sa-executive" as const,
      southAfrican: true,
    },
    {
      id: 11,
      title: "Marketing Coordinator",
      industry: "Marketing",
      experience: "Mid-level",
      template: "sa-modern" as const,
      southAfrican: true,
    },
    {
      id: 12,
      title: "Mechanical Engineer",
      industry: "Engineering",
      experience: "Mid-level",
      template: "sa-professional" as const,
      southAfrican: true,
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header component would be here */}

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-16 bg-emerald-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center text-center space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">CV Examples</h1>
              <p className="max-w-[700px] text-gray-600 md:text-xl">
                Browse through our collection of professionally written CV examples for various industries and
                experience levels in South Africa.
              </p>
              <div className="inline-flex items-center px-3 py-1 mt-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <span className="mr-1.5">🇿🇦</span> New South African Templates Available!
              </div>
              <div className="w-full max-w-md">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input className="pl-8" placeholder="Search by job title or industry..." type="search" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Examples Section */}
        <section className="w-full py-12">
          <div className="container px-4 md:px-6 mx-auto">
            <Tabs defaultValue="All Industries" className="w-full">
              <TabsList className="flex flex-wrap justify-center mb-8 overflow-x-auto">
                {industries.map((industry) => (
                  <TabsTrigger key={industry} value={industry} className="px-4 py-2">
                    {industry}
                  </TabsTrigger>
                ))}
              </TabsList>

              {industries.map((industry) => (
                <TabsContent key={industry} value={industry} className="mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {examples
                      .filter((example) => {
                        if (industry === "All Industries") return true;
                        if (industry === "South African Templates") return example.southAfrican === true;
                        return example.industry === industry;
                      })
                      .map((example) => (
                        <Card
                          key={example.id}
                          className="overflow-hidden border border-gray-200 transition-all hover:shadow-md"
                        >
                          <div className="h-[300px] p-4">
                            <CVPreview template={example.template} className="h-full" />
                          </div>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <h3 className="font-medium">{example.title}</h3>
                              <div className="flex items-center text-sm text-gray-600 space-x-2">
                                <span>{example.industry}</span>
                                <span>•</span>
                                <span>{example.experience}</span>
                              </div>
                              <div className="pt-2">
                                <Link href={`/cv-examples/${example.id}`}>
                                  <Button variant="outline" size="sm" className="w-full">
                                    View Example
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center text-center space-y-4">
              <h2 className="text-2xl font-bold">Ready to create your own professional South African CV?</h2>
              <p className="text-gray-600 max-w-[600px]">
                Get inspired by our examples and create your own standout CV with our South African templates for free.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <Link href="/create">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    Create my CV
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  onClick={() => {
                    const saTab = document.querySelector('[value="South African Templates"]');
                    if (saTab) {
                      (saTab as HTMLElement).click();
                      saTab.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  View South African Templates
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer component would be here */}
    </div>
  )
}
