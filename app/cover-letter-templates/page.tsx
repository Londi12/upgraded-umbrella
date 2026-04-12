import { ArrowRight, Filter, Search } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CoverLetterPreview } from "@/components/cover-letter-preview"
import { PageHeader } from "@/components/ui/page-header"
import {
  generateMetadata as generateSEOMetadata,
  seoConfigs,
} from "@/lib/utils"

export const metadata = generateSEOMetadata(seoConfigs.coverLetterTemplates)

export default function CoverLetterTemplatesPage() {
  const categories = ["All", "Professional", "Modern", "Creative", "Simple", "Executive", "South African"]

  const templates = [
    { id: 1, name: "Professional Business", template: "professional" as const, category: "Professional", popular: true },
    { id: 2, name: "Modern Creative", template: "modern" as const, category: "Modern", popular: false },
    { id: 3, name: "Executive Premium", template: "executive" as const, category: "Executive", popular: true },
    { id: 4, name: "Simple Clean", template: "simple" as const, category: "Simple", popular: false },
    { id: 5, name: "SA Professional", template: "sa-professional" as const, category: "South African", popular: true },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <PageHeader
          title="Cover Letter Templates"
          description="Professional, customizable cover letter templates designed to complement your CV and make a strong first impression."
        >
          <div className="w-full max-w-md flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500" placeholder="Search templates..." type="search" />
            </div>
            <Button variant="outline" size="icon" className="h-12 w-12 border-gray-300 hover:bg-blue-50">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filter</span>
            </Button>
          </div>
        </PageHeader>

        {/* Templates Section */}
        <section className="w-full py-12">
          <div className="container px-4 md:px-6 mx-auto">
            <Tabs defaultValue="All" className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1 mb-8 h-auto bg-gray-100 p-1">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="px-3 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category} className="mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {templates
                      .filter((t) => category === "All" || t.category === category)
                      .map((template) => (
                        <Card
                          key={template.id}
                          className="overflow-hidden border border-gray-200 transition-all hover:shadow-lg hover:scale-105 duration-200 bg-white"
                        >
                          <div className="relative">
                            {template.popular && (
                              <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs px-3 py-1 rounded-full z-10 font-medium shadow-sm">
                                Popular
                              </div>
                            )}
                            <div className="h-[280px] md:h-[320px] p-4 bg-gray-50">
                              <CoverLetterPreview template={template.template} className="h-full w-full" />
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div>
                                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                <p className="text-sm text-gray-500">{template.category}</p>
                              </div>
                              <Link href={`/create-cover-letter?template=${template.id}`}>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 w-full sm:w-auto">
                                  Use Template
                                </Button>
                              </Link>
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
        <section className="w-full py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Ready to write a winning cover letter?</h2>
              <p className="text-blue-100 max-w-[600px] text-lg">
                Choose a template and craft your cover letter in minutes. It's completely free and easy to use.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/create-cover-letter">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4">
                    Create my Cover Letter
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}