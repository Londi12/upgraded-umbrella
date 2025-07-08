"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  Clock, 
  HardDrive,
  Shield,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface StorageStats {
  storage: {
    totalJobs: number
    activeJobs: number
    inactiveJobs: number
    jobsBySource: Record<string, number>
    recentlyAdded: number
    recentlyUpdated: number
    trackedJobs: number
  }
  retention: {
    total_jobs: number
    active_jobs: number
    inactive_jobs: number
    tracked_jobs: number
    applied_jobs: number
    jobs_due_for_cleanup: number
    storage_usage_mb: number
    last_cleanup: string | null
    next_cleanup: string | null
  }
}

export function JobStorageDashboard() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cleanupLoading, setCleanupLoading] = useState(false)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/job-storage?action=stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch storage stats')
      }
    } catch (err) {
      setError('Network error fetching storage stats')
      console.error('Error fetching storage stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const runCleanup = async () => {
    try {
      setCleanupLoading(true)
      const response = await fetch('/api/job-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' })
      })
      
      const data = await response.json()
      if (data.success) {
        await fetchStats() // Refresh stats after cleanup
        alert(`Cleanup completed: ${data.data.jobs_marked_inactive} jobs marked inactive, ${data.data.search_analytics_deleted} old searches deleted`)
      } else {
        alert('Cleanup failed: ' + data.error)
      }
    } catch (err) {
      console.error('Error running cleanup:', err)
      alert('Cleanup failed')
    } finally {
      setCleanupLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Job Storage Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading storage statistics...</span>
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
            Storage Error
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

  const storageUsagePercent = stats?.retention.storage_usage_mb ? 
    Math.min((stats.retention.storage_usage_mb / 1000) * 100, 100) : 0

  const cleanupDue = stats?.retention.next_cleanup ? 
    new Date(stats.retention.next_cleanup) < new Date() : false

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.storage.totalJobs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.storage.activeJobs || 0} active, {stats?.storage.inactiveJobs || 0} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.storage.recentlyAdded || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.storage.recentlyUpdated || 0} updated in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Tracked</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.storage.trackedJobs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Protected from cleanup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.retention.storage_usage_mb || 0} MB</div>
            <Progress value={storageUsagePercent} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Data Retention Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Retention Status
          </CardTitle>
          <CardDescription>
            Intelligent data lifecycle management with user preference preservation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span>Jobs Due for Cleanup</span>
              <Badge variant={stats?.retention.jobs_due_for_cleanup ? "destructive" : "default"}>
                {stats?.retention.jobs_due_for_cleanup || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Last Cleanup</span>
              <Badge variant="outline">
                {stats?.retention.last_cleanup ? 
                  new Date(stats.retention.last_cleanup).toLocaleDateString() : 
                  'Never'
                }
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Next Cleanup</span>
              <Badge variant={cleanupDue ? "destructive" : "default"}>
                {stats?.retention.next_cleanup ? 
                  new Date(stats.retention.next_cleanup).toLocaleDateString() : 
                  'Not scheduled'
                }
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={runCleanup} 
              variant="outline" 
              size="sm"
              disabled={cleanupLoading}
            >
              {cleanupLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Run Cleanup Now
            </Button>
            <Button onClick={fetchStats} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Sources Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Jobs by Source
          </CardTitle>
          <CardDescription>
            Distribution of stored jobs across different job boards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.storage.jobsBySource && Object.entries(stats.storage.jobsBySource).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="font-medium">{source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{count} jobs</span>
                  <Badge variant="outline">
                    {Math.round((count / (stats.storage.totalJobs || 1)) * 100)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {cleanupDue && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Data cleanup is overdue. Consider running cleanup to maintain optimal performance.
          </AlertDescription>
        </Alert>
      )}

      {stats?.retention.jobs_due_for_cleanup && stats.retention.jobs_due_for_cleanup > 100 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stats.retention.jobs_due_for_cleanup} jobs are due for cleanup. This may impact search performance.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
