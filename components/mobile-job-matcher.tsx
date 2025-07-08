"use client"

import { useState, useEffect } from "react"
import { Search, Filter, MapPin, Building, Wifi, WifiOff, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MobileJobMatch {
  id: string
  title: string
  company: string
  location: string
  matchScore: number
  salary?: string
  isOffline?: boolean
}

export function MobileJobMatcher() {
  const [isOnline, setIsOnline] = useState(true)
  const [jobs, setJobs] = useState<MobileJobMatch[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [offlineJobs, setOfflineJobs] = useState<MobileJobMatch[]>([])

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Load offline jobs from cache
    loadOfflineJobs()
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadOfflineJobs = () => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('offline_jobs')
      if (cached) {
        const cachedJobs = JSON.parse(cached)
        setOfflineJobs(cachedJobs)
        if (!isOnline) {
          setJobs(cachedJobs)
        }
      }
    }
  }

  const cacheJobsForOffline = (jobsToCache: MobileJobMatch[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('offline_jobs', JSON.stringify(jobsToCache))
      localStorage.setItem('jobs_cache_date', new Date().toISOString())
    }
  }

  const syncWhenOnline = async () => {
    if (isOnline) {
      try {
        // Fetch fresh jobs when back online
        const freshJobs = await fetchJobs()
        setJobs(freshJobs)
        cacheJobsForOffline(freshJobs)
      } catch (error) {
        console.error('Failed to sync jobs:', error)
      }
    }
  }

  const fetchJobs = async (): Promise<MobileJobMatch[]> => {
    // Mock API call - replace with actual job fetching
    return [
      {
        id: "1",
        title: "Mobile Developer",
        company: "MTN",
        location: "Cape Town",
        matchScore: 85,
        salary: "R450,000"
      },
      {
        id: "2", 
        title: "Data Analyst",
        company: "Vodacom",
        location: "Johannesburg",
        matchScore: 78,
        salary: "R380,000"
      }
    ]
  }

  const downloadJobsForOffline = async () => {
    try {
      const jobsToDownload = await fetchJobs()
      cacheJobsForOffline(jobsToDownload)
      setOfflineJobs(jobsToDownload)
      
      // Show success message
      alert(`Downloaded ${jobsToDownload.length} jobs for offline viewing`)
    } catch (error) {
      alert('Failed to download jobs. Please try again.')
    }
  }

  const filteredJobs = (isOnline ? jobs : offlineJobs).filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Job Matches</h1>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm text-gray-600">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input 
              className="pl-10" 
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Offline Alert */}
      {!isOnline && (
        <div className="p-4">
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              You're offline. Showing cached jobs from {offlineJobs.length > 0 ? 'your last sync' : 'never'}.
              {offlineJobs.length === 0 && ' Download jobs while online to view them offline.'}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Download for Offline */}
      {isOnline && (
        <div className="p-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={downloadJobsForOffline}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Jobs for Offline
          </Button>
        </div>
      )}

      {/* Job List */}
      <div className="p-4 space-y-4">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="border-l-4 border-l-blue-400">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{job.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <Building className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{job.company}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span>{job.location}</span>
                  </div>
                </div>
                
                <div className="text-right ml-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {job.matchScore}%
                  </div>
                  <Badge 
                    className={
                      job.matchScore >= 80 
                        ? "bg-green-100 text-green-800" 
                        : job.matchScore >= 60 
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {job.matchScore >= 80 ? 'Great' : job.matchScore >= 60 ? 'Good' : 'Fair'} Match
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <Progress value={job.matchScore} className="h-2 mb-3" />
              
              {job.salary && (
                <div className="text-sm text-gray-600 mb-3">
                  Salary: {job.salary}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1 text-sm py-2"
                  disabled={!isOnline}
                >
                  {isOnline ? 'Apply Now' : 'Apply (Online Only)'}
                </Button>
                <Button variant="outline" className="text-sm py-2">
                  Save
                </Button>
              </div>
              
              {!isOnline && (
                <div className="text-xs text-gray-500 mt-2 text-center">
                  Connect to internet to apply for jobs
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {filteredJobs.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              {!isOnline && offlineJobs.length === 0 
                ? 'No offline jobs available. Connect to internet and download jobs.'
                : 'No jobs match your search.'
              }
            </div>
            {isOnline && (
              <Button onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Button variant="ghost" className="flex flex-col items-center py-2 h-auto">
            <Search className="h-4 w-4 mb-1" />
            <span className="text-xs">Search</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center py-2 h-auto">
            <Filter className="h-4 w-4 mb-1" />
            <span className="text-xs">Filter</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center py-2 h-auto">
            <Building className="h-4 w-4 mb-1" />
            <span className="text-xs">Saved</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center py-2 h-auto">
            <MapPin className="h-4 w-4 mb-1" />
            <span className="text-xs">Nearby</span>
          </Button>
        </div>
      </div>
    </div>
  )
}