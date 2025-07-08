import { ArrowRight, Filter, Search } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CVPreview } from "@/components/cv-preview"
import { StructuredData } from "@/components/structured-data"
import { PageHeader } from "@/components/ui/page-header"
import {
  generateMetadata as generateSEOMetadata,
  seoConfigs,
  generateProductStructuredData,
  generateBreadcrumbStructuredData
} from "@/lib/utils"

export const metadata = generateSEOMetadata(seoConfigs.cvTemplates)

export default function CVTemplatesPage() {
  // Template categories
  const categories = ["All", "Professional", "Modern", "Creative", "Simple", "Executive", "South African"]

  // Breadcrumb structured data
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'CV Templates', url: '/cv-templates' }
  ]

  // Template data
  const templates = [
    {
      id: 1,
      name: "Corporate Professional",
      category: "Professional",
      template: "professional" as const,
      popular: true,
    },
    {
      id: 2,
      name: "Modern Minimalist",
      category: "Modern",
      template: "modern" as const,
      popular: false,
    },
    {
      id: 3,
      name: "Creative Design",
      category: "Creative",
      template: "creative" as const,
      popular: true,
    },
    {
      id: 4,
      name: "Simple Clean",
      category: "Simple",
      template: "simple" as const,
      popular: false,
    },
    {
      id: 5,
      name: "Executive Elite",
      category: "Executive",
      template: "executive" as const,
      popular: true,
    },
    {
      id: 6,
      name: "Technical Expert",
      category: "Professional",
      template: "technical" as const,
      popular: false,
    },
    {
      id: 7,
      name: "Graduate Entry",
      category: "Simple",
      template: "graduate" as const,
      popular: false,
    },
    {
      id: 8,
      name: "Digital Portfolio",
      category: "Creative",
      template: "digital" as const,
      popular: true,
    },
    {
      id: 9,
      name: "SA Professional",
      category: "South African",
      template: "sa-professional" as const,
      popular: true,
    },
    {
      id: 10,
      name: "SA Modern",
      category: "South African",
      template: "sa-modern" as const,
      popular: true,
    },
    {
      id: 11,
      name: "SA Executive",
      category: "South African",
      template: "sa-executive" as const,
      popular: false,
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <StructuredData data={generateBreadcrumbStructuredData(breadcrumbs)} />
      <main className="flex-1">
        <PageHeader 
          title="CV Templates"
          description="Professional, customizable CV templates designed for South African job seekers. Choose from our collection and create your perfect CV in minutes."
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
                      .filter((template) => category === "All" || template.category === category)
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
                              <CVPreview template={template.template} className="h-full w-full" />
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div>
                                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                <p className="text-sm text-gray-500">{template.category}</p>
                              </div>
                              <Link href={`/create?template=${template.id}`}>
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
              <h2 className="text-3xl md:text-4xl font-bold">Ready to create your professional CV?</h2>
              <p className="text-blue-100 max-w-[600px] text-lg">
                Choose a template and start building your CV in minutes. It's completely free and easy to use.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/create">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4">
                    Create my CV
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
