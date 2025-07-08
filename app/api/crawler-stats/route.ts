import { NextRequest, NextResponse } from 'next/server'
import { getCrawlerStats, getComplianceReport } from '@/lib/job-search-service'

/**
 * GET /api/crawler-stats
 * Returns crawler statistics and compliance information
 * For monitoring and audit purposes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'stats'

    switch (type) {
      case 'stats':
        const stats = getCrawlerStats()
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        })

      case 'compliance':
        const complianceReport = getComplianceReport()
        return NextResponse.json({
          success: true,
          data: complianceReport,
          timestamp: new Date().toISOString()
        })

      case 'health':
        const healthStats = getCrawlerStats()
        const isHealthy = healthStats.initialized && 
                         healthStats.crawlerStats?.totalRequests > 0

        return NextResponse.json({
          success: true,
          data: {
            status: isHealthy ? 'healthy' : 'unhealthy',
            initialized: healthStats.initialized,
            lastCheck: new Date().toISOString(),
            issues: isHealthy ? [] : ['Crawler not properly initialized']
          }
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type parameter. Use: stats, compliance, or health'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error getting crawler stats:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve crawler statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/crawler-stats
 * Trigger manual compliance check or crawler reset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'compliance-check':
        const report = getComplianceReport()
        return NextResponse.json({
          success: true,
          message: 'Compliance check completed',
          data: report
        })

      case 'health-check':
        const stats = getCrawlerStats()
        const health = {
          timestamp: new Date().toISOString(),
          status: stats.initialized ? 'operational' : 'error',
          components: {
            crawler: stats.initialized ? 'up' : 'down',
            rateLimiter: stats.crawlerStats?.rateLimiterStats ? 'up' : 'unknown',
            cache: stats.crawlerStats?.cacheStats ? 'up' : 'unknown'
          },
          metrics: stats.crawlerStats || {}
        }

        return NextResponse.json({
          success: true,
          data: health
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: compliance-check or health-check'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error processing crawler stats request:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
