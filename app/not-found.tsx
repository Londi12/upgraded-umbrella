"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Home, Search, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          {/* Funny CV Icon */}
          <div className="relative mb-8">
            <div className="w-32 h-40 bg-white border-4 border-slate-300 rounded-lg mx-auto relative overflow-hidden">
              <div className="absolute top-4 left-4 right-4">
                <div className="h-2 bg-slate-200 rounded mb-2"></div>
                <div className="h-2 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-1 bg-slate-100 rounded mb-1"></div>
                <div className="h-1 bg-slate-100 rounded mb-1"></div>
                <div className="h-1 bg-slate-100 rounded w-2/3 mb-3"></div>
                <div className="h-1 bg-slate-100 rounded mb-1"></div>
                <div className="h-1 bg-slate-100 rounded w-4/5"></div>
              </div>
              {/* Sad face on CV */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="text-2xl">😢</div>
              </div>
            </div>
            {/* Floating question marks */}
            <div className="absolute -top-2 -right-2 text-2xl animate-bounce">❓</div>
            <div className="absolute -bottom-2 -left-2 text-xl animate-pulse">❓</div>
          </div>

          <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Oops! This CV Went Missing
          </h2>
          <p className="text-slate-600 mb-2">
            Looks like this page took a permanent vacation! 🏖️
          </p>
          <p className="text-slate-600 mb-8">
            Don't worry, we'll help you find what you're looking for.
          </p>

          {/* Funny messages */}
          <div className="bg-blue-50 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-800 font-medium mb-2">
              💡 Pro Tip: Unlike this missing page, your CV should always be findable!
            </p>
            <p className="text-xs text-blue-600">
              Create an ATS-optimized CV that recruiters will actually discover.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
            
            <Link href="/templates">
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Create CV
              </Button>
            </Link>
            
            <Link href="/jobs">
              <Button variant="outline" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Find Jobs
              </Button>
            </Link>
          </div>

          {/* Back button */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Easter egg */}
          <div className="mt-6 text-xs text-slate-400">
            Error Code: CV_NOT_FOUND_BUT_YOURS_WILL_BE 🚀
          </div>
        </CardContent>
      </Card>
    </div>
  )
}