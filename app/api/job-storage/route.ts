import { NextRequest, NextResponse } from 'next/server'
import { JobStorageService } from '@/lib/services/job-storage-service'
import { DataRetentionService } from '@/lib/services/data-retention-service'

/**
 * GET /api/job-storage
 * Get job storage statistics and information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'stats'
    
    const jobStorage = new JobStorageService()
    const retentionService = new DataRetentionService()

    switch (action) {
      case 'stats':
        const stats = await jobStorage.getStorageStats()
        const retentionStats = await retentionService.getRetentionStats()
        
        return NextResponse.json({
          success: true,
          data: {
            storage: stats,
            retention: retentionStats,
            timestamp: new Date().toISOString()
          }
        })

      case 'sources':
        // Get job source information
        const { data: sources, error: sourcesError } = await jobStorage['supabase']
          .from('job_sources')
          .select('*')
          .order('name')

        if (sourcesError) throw sourcesError

        return NextResponse.json({
          success: true,
          data: sources || []
        })

      case 'sessions':
        // Get recent crawl sessions
        const limit = parseInt(searchParams.get('limit') || '10')
        const { data: sessions, error: sessionsError } = await jobStorage['supabase']
          .from('crawl_sessions')
          .select('*')
          .order('session_start', { ascending: false })
          .limit(limit)

        if (sessionsError) throw sessionsError

        return NextResponse.json({
          success: true,
          data: sessions || []
        })

      case 'health':
        const healthStats = await jobStorage.getStorageStats()
        const policy = await retentionService.getActivePolicy()
        
        const health = {
          status: healthStats.totalJobs > 0 ? 'healthy' : 'warning',
          totalJobs: healthStats.totalJobs,
          activeJobs: healthStats.activeJobs,
          recentActivity: healthStats.recentlyAdded > 0,
          retentionPolicyActive: policy?.is_active || false,
          lastCleanup: policy?.last_cleanup_run,
          nextCleanup: policy?.next_cleanup_due,
          issues: []
        }

        if (healthStats.totalJobs === 0) {
          health.issues.push('No jobs in storage')
        }
        if (healthStats.recentlyAdded === 0) {
          health.issues.push('No recent job additions')
        }
        if (!policy?.is_active) {
          health.issues.push('No active retention policy')
        }

        return NextResponse.json({
          success: true,
          data: health
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: stats, sources, sessions, or health'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in job storage API:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve job storage information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/job-storage
 * Manage job storage operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    const jobStorage = new JobStorageService()
    const retentionService = new DataRetentionService()

    switch (action) {
      case 'cleanup':
        // Run data retention cleanup
        const cleanupReport = await retentionService.runIntelligentCleanup()
        
        return NextResponse.json({
          success: true,
          message: 'Data cleanup completed',
          data: cleanupReport
        })

      case 'force-crawl':
        // Force crawl of specific sources
        const { sources } = params
        if (!sources || !Array.isArray(sources)) {
          return NextResponse.json({
            success: false,
            error: 'Sources array is required'
          }, { status: 400 })
        }

        // Update source last crawl time to force recrawl
        for (const sourceName of sources) {
          const { error } = await jobStorage['supabase']
            .from('job_sources')
            .update({ 
              last_successful_crawl: new Date(0).toISOString() // Set to epoch to force crawl
            })
            .eq('name', sourceName)

          if (error) {
            console.error(`Error updating source ${sourceName}:`, error)
          }
        }

        return NextResponse.json({
          success: true,
          message: `Forced crawl scheduled for ${sources.length} sources`,
          data: { sources }
        })

      case 'update-retention-policy':
        // Update retention policy
        const { policy } = params
        if (!policy) {
          return NextResponse.json({
            success: false,
            error: 'Policy object is required'
          }, { status: 400 })
        }

        const updatedPolicy = await retentionService.updateRetentionPolicy(policy)
        
        return NextResponse.json({
          success: true,
          message: 'Retention policy updated',
          data: updatedPolicy
        })

      case 'search-jobs':
        // Search stored jobs
        const searchResults = await jobStorage.searchJobs({
          keywords: params.keywords,
          location: params.location,
          industry: params.industry,
          experience_level: params.experience_level,
          job_type: params.job_type,
          source: params.source,
          posted_within_days: params.posted_within_days,
          limit: params.limit || 50,
          offset: params.offset || 0,
          only_active: params.only_active !== false
        })

        return NextResponse.json({
          success: true,
          data: searchResults
        })

      case 'get-tracked-jobs':
        // Get jobs that users are tracking
        const { userId } = params
        const trackedJobs = await jobStorage.getTrackedJobs(userId)
        
        return NextResponse.json({
          success: true,
          data: trackedJobs
        })

      case 'mark-job-inactive':
        // Mark specific job as inactive
        const { jobId } = params
        if (!jobId) {
          return NextResponse.json({
            success: false,
            error: 'Job ID is required'
          }, { status: 400 })
        }

        const { error: markError } = await jobStorage['supabase']
          .from('job_listings')
          .update({ 
            is_active: false,
            last_updated_at: new Date().toISOString()
          })
          .eq('id', jobId)

        if (markError) throw markError

        return NextResponse.json({
          success: true,
          message: 'Job marked as inactive'
        })

      case 'export-data':
        // Export job data for compliance
        const { domain, format = 'json' } = params
        const exportData = await jobStorage['cacheManager']?.exportData(domain) || []
        
        if (format === 'csv') {
          // Convert to CSV format
          const csv = [
            'URL,Domain,Timestamp,Expires,Size',
            ...exportData.map(item => 
              `"${item.url}","${item.domain}","${item.timestamp}","${item.expires}","${item.size}"`
            )
          ].join('\n')

          return new NextResponse(csv, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="job-data-export.csv"'
            }
          })
        }

        return NextResponse.json({
          success: true,
          data: exportData
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in job storage management:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process job storage operation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/job-storage
 * Delete job storage data (with safety checks)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const confirm = searchParams.get('confirm') === 'true'

    if (!confirm) {
      return NextResponse.json({
        success: false,
        error: 'Confirmation required for delete operations'
      }, { status: 400 })
    }

    const jobStorage = new JobStorageService()

    switch (action) {
      case 'inactive-jobs':
        // Delete inactive jobs (preserving tracked ones)
        const { count } = await jobStorage['supabase']
          .from('job_listings')
          .delete({ count: 'exact' })
          .eq('is_active', false)
          .not('id', 'in', `(SELECT DISTINCT job_listing_id FROM job_applications WHERE job_listing_id IS NOT NULL)`)

        return NextResponse.json({
          success: true,
          message: `Deleted ${count || 0} inactive jobs`,
          data: { deleted: count || 0 }
        })

      case 'old-sessions':
        // Delete old crawl sessions
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { count: sessionCount } = await jobStorage['supabase']
          .from('crawl_sessions')
          .delete({ count: 'exact' })
          .lt('session_start', thirtyDaysAgo.toISOString())

        return NextResponse.json({
          success: true,
          message: `Deleted ${sessionCount || 0} old crawl sessions`,
          data: { deleted: sessionCount || 0 }
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid delete action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in job storage deletion:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete job storage data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
