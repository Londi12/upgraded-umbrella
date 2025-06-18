import { ArrowRight, Filter, Search } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CVPreview } from "@/components/cv-preview"

export default function CVTemplatesPage() {
  // Template categories
  const categories = ["All", "Professional", "Modern", "Creative", "Simple", "Executive"]

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
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-16 bg-emerald-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center text-center space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">CV Templates</h1>
              <p className="max-w-[700px] text-gray-600 md:text-xl">
                Professional, customizable CV templates designed for South African job seekers. Choose from our
                collection and create your perfect CV.
              </p>
              <div className="w-full max-w-md flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input className="pl-8" placeholder="Search templates..." type="search" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                  <span className="sr-only">Filter</span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Templates Section */}
        <section className="w-full py-12">
          <div className="container px-4 md:px-6 mx-auto">
            <Tabs defaultValue="All" className="w-full">
              <TabsList className="flex flex-wrap justify-center mb-8">
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category} className="px-4 py-2">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category} className="mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {templates
                      .filter((template) => category === "All" || template.category === category)
                      .map((template) => (
                        <Card
                          key={template.id}
                          className="overflow-hidden border border-gray-200 transition-all hover:shadow-md"
                        >
                          <div className="relative">
                            {template.popular && (
                              <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full z-10">
                                Popular
                              </div>
                            )}
                            <div className="h-[300px] p-4">
                              <CVPreview template={template.template} className="h-full" />
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{template.name}</h3>
                              <Link href={`/create?template=${template.id}`}>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                  Use
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
        <section className="w-full py-12 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center text-center space-y-4">
              <h2 className="text-2xl font-bold">Ready to create your professional CV?</h2>
              <p className="text-gray-600 max-w-[600px]">
                Choose a template and start building your CV in minutes. It's free and easy to use.
              </p>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Create my CV
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
