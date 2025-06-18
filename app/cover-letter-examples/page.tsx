import { ArrowRight, Search } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CoverLetterPreview } from "@/components/cover-letter-preview"

export default function CoverLetterExamplesPage() {
  // Industry categories
  const industries = [
    "All Industries",
    "Information Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Marketing",
    "Engineering",
  ]

  // Example cover letters data
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
      template: "simple" as const,
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-16 bg-emerald-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center text-center space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Cover Letter Examples</h1>
              <p className="max-w-[700px] text-gray-600 md:text-xl">
                Browse through our collection of professionally written cover letter examples for various industries and
                experience levels in South Africa.
              </p>
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
                      .filter((example) => industry === "All Industries" || example.industry === industry)
                      .map((example) => (
                        <Card
                          key={example.id}
                          className="overflow-hidden border border-gray-200 transition-all hover:shadow-md"
                        >
                          <div className="h-[300px] p-4">
                            <CoverLetterPreview template={example.template} className="h-full" />
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
                                <Link href={`/cover-letter-examples/${example.id}`}>
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

        {/* Tips Section */}
        <section className="w-full py-12 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <h2 className="text-2xl font-bold">Cover Letter Writing Tips</h2>
              <p className="text-gray-600 max-w-[700px]">
                Learn from our examples and apply these proven strategies to make your cover letter stand out.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-2">Research the Company</h3>
                  <p className="text-gray-600">
                    Show that you've done your homework by mentioning specific company values, recent news, or projects.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-2">Quantify Your Achievements</h3>
                  <p className="text-gray-600">
                    Use specific numbers and metrics to demonstrate your impact in previous roles.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-2">End with a Strong Call-to-Action</h3>
                  <p className="text-gray-600">
                    Express enthusiasm for next steps and suggest a specific action, like scheduling an interview.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center text-center space-y-4">
              <h2 className="text-2xl font-bold">Ready to create your own professional cover letter?</h2>
              <p className="text-gray-600 max-w-[600px]">
                Get inspired by our examples and create your own compelling cover letter for free.
              </p>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Create my cover letter
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
