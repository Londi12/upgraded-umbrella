"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  RefreshCw,
  Rss,
  CheckCircle,
  TrendingUp
} from 'lucide-react'

interface JobSource {
  name: string
  type: string
  count: number
}

interface JobCrawlerStatusProps {
  onJobsRefresh?: () => void
  className?: string
}

export function RSSFeedStatus({ onJobsRefresh, className }: JobCrawlerStatusProps) {
  const [sources, setSources] = useState<JobSource[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<string>('')
  const [totalJobs, setTotalJobs] = useState(0)

  // Fetch job statistics
  const fetchJobStats = async () => {
    try {
      const response = await fetch('/api/rss-jobs')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSources(data.sources || [])
          setTotalJobs(data.totalFound || data.total || 0)
          setLastRefresh(new Date().toLocaleString())
        }
      }
    } catch (error) {
      console.error('Error fetching job stats:', error)
    }
  }

  // Refresh job sources
  const refreshJobs = async () => {
    setIsRefreshing(true)
    try {
      // Clear cache by adding timestamp
      const response = await fetch(`/api/rss-jobs?refresh=${Date.now()}`)

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSources(data.sources || [])
          setTotalJobs(data.totalFound || data.total || 0)
          setLastRefresh(new Date().toLocaleString())
          onJobsRefresh?.()
        }
      }
    } catch (error) {
      console.error('Error refreshing jobs:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Load initial stats
  useEffect(() => {
    fetchJobStats()
  }, [])

  const totalSources = sources.length
  const totalJobsFound = sources.reduce((sum, source) => sum + source.count, 0)

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Rss className="h-5 w-5" />
              Job Sources
            </CardTitle>
            <Button
              onClick={refreshJobs}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalSources}</div>
              <div className="text-sm text-gray-600">Active Sources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalJobsFound}</div>
              <div className="text-sm text-gray-600">Jobs Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{totalJobs}</div>
              <div className="text-sm text-gray-600">Available Now</div>
            </div>
          </div>

          {lastRefresh && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Last updated: {lastRefresh}
              </AlertDescription>
            </Alert>
          )}

          {/* Source Details */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Job Sources:</h4>
            {sources.map(source => (
              <div key={source.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">{source.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {source.type}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  {source.count} jobs
                </Badge>
              </div>
            ))}
          </div>

          {sources.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Rss className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Loading job sources...</p>
            </div>
          )}

          {/* Performance Indicator */}
          {totalJobsFound > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
              <TrendingUp className="h-4 w-4" />
              <span>Job aggregation is working - {totalJobsFound} jobs from {totalSources} sources</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for using RSS job data
export function useRSSJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = async (filters?: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filters?.keywords) params.append('keywords', filters.keywords)
      if (filters?.location) params.append('location', filters.location)
      if (filters?.source) params.append('source', filters.source)
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/rss-jobs?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setJobs(data.jobs)
      } else {
        setError(data.error || 'Failed to fetch jobs')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    refresh: () => fetchJobs()
  }
}
