"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Shield, 
  Clock, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Globe,
  BarChart3
} from 'lucide-react'

interface CrawlerStats {
  initialized: boolean
  complianceInfo?: {
    ethicalCrawlingEnabled: boolean
    robotsTxtRespected: boolean
    rateLimitingEnabled: boolean
    dataRetentionDays: number
    complianceMode: boolean
  }
  crawlerStats?: {
    totalRequests: number
    successfulRequests: number
    cachedResponses: number
    blockedRequests: number
    errors: number
  }
  sources?: Array<{
    name: string
    type: string
    active: boolean
    complianceNotes?: string
  }>
  lastCrawlStats?: Array<{
    source: string
    timestamp: number
    success: boolean
    jobCount: number
  }>
}

export function CrawlerDashboard() {
  const [stats, setStats] = useState<CrawlerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/crawler-stats?type=stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
        setLastUpdated(new Date())
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch stats')
      }
    } catch (err) {
      setError('Network error fetching crawler stats')
      console.error('Error fetching crawler stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const runComplianceCheck = async () => {
    try {
      const response = await fetch('/api/crawler-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'compliance-check' })
      })
      
      const data = await response.json()
      if (data.success) {
        await fetchStats() // Refresh stats after compliance check
      }
    } catch (err) {
      console.error('Error running compliance check:', err)
    }
  }

  useEffect(() => {
    fetchStats()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Crawler Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading crawler statistics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Crawler Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchStats} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isHealthy = stats?.initialized && (stats?.crawlerStats?.totalRequests || 0) > 0
  const successRate = stats?.crawlerStats ? 
    Math.round((stats.crawlerStats.successfulRequests / stats.crawlerStats.totalRequests) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {isHealthy ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={isHealthy ? "default" : "destructive"}>
                {isHealthy ? "Operational" : "Error"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.crawlerStats?.totalRequests || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.crawlerStats?.cachedResponses || 0} from cache
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.crawlerStats?.errors || 0} errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.sources?.filter(s => s.active).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.sources?.length || 0} total configured
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Status
          </CardTitle>
          <CardDescription>
            Ethical crawling and legal compliance monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span>Robots.txt Respected</span>
              <Badge variant={stats?.complianceInfo?.robotsTxtRespected ? "default" : "destructive"}>
                {stats?.complianceInfo?.robotsTxtRespected ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Rate Limiting</span>
              <Badge variant={stats?.complianceInfo?.rateLimitingEnabled ? "default" : "destructive"}>
                {stats?.complianceInfo?.rateLimitingEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Compliance Mode</span>
              <Badge variant={stats?.complianceInfo?.complianceMode ? "default" : "secondary"}>
                {stats?.complianceInfo?.complianceMode ? "Strict" : "Standard"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Data Retention</span>
              <Badge variant="outline">
                {stats?.complianceInfo?.dataRetentionDays || 30} days
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Blocked Requests</span>
              <Badge variant="outline">
                {stats?.crawlerStats?.blockedRequests || 0}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button onClick={runComplianceCheck} variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              Run Compliance Check
            </Button>
            <Button onClick={fetchStats} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sources Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Job Sources
          </CardTitle>
          <CardDescription>
            Status of configured job board sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.sources?.map((source, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{source.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Type: {source.type}
                    {source.complianceNotes && (
                      <span className="ml-2">• {source.complianceNotes}</span>
                    )}
                  </div>
                </div>
                <Badge variant={source.active ? "default" : "secondary"}>
                  {source.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        <Clock className="h-4 w-4 inline mr-1" />
        Last updated: {lastUpdated?.toLocaleString() || 'Never'}
      </div>
    </div>
  )
}
