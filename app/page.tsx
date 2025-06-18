"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <main className="container px-4 mx-auto">
        {/* Hero - Clean and focused */}
        <div className="flex flex-col items-center text-center pt-20 pb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-[800px] mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-500">
            Build a solid CV. For free. For South Africa.
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-[600px] mb-8">
            Whether you're starting out or starting over — create a clean, professional CV that speaks to local employers.
          </p>
          <Link href="/create" className="group">
            <Button size="lg" 
              className="bg-emerald-600 hover:bg-emerald-700 transform transition-all hover:scale-105 shadow-lg hover:shadow-emerald-200">
              Create My CV 
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Features - Grid layout with hover effects */}
        <div className="py-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold mb-2">What You Get</h2>
            <p className="text-gray-600">
              No jargon, no cost, no nonsense.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="group hover:shadow-lg transition-all duration-300 border-transparent hover:border-emerald-100">
              <CardHeader className="p-6">
                <CardTitle className="text-xl mb-2">SA-Ready Templates</CardTitle>
                <CardDescription className="text-gray-600 group-hover:text-gray-700">
                  Designed with South African hiring practices in mind. No weird layouts, just formats that work.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-transparent hover:border-emerald-100">
              <CardHeader className="p-6">
                <CardTitle className="text-xl mb-2">Cover Letters Too</CardTitle>
                <CardDescription className="text-gray-600 group-hover:text-gray-700">
                  Need a quick cover letter? We've got examples and templates to match your CV.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-transparent hover:border-emerald-100">
              <CardHeader className="p-6">
                <CardTitle className="text-xl mb-2">Instant Downloads</CardTitle>
                <CardDescription className="text-gray-600 group-hover:text-gray-700">
                  Download your CV in PDF or Word anytime. No hoops to jump through.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* CTA - Simple and focused */}
        <div className="py-16 text-center">
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of South Africans who are getting noticed by employers.
          </p>
          <Link href="/create" className="group inline-block">
            <Button size="lg" 
              className="bg-emerald-600 hover:bg-emerald-700 transform transition-all hover:scale-105 shadow-lg hover:shadow-emerald-200">
              Get started
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
