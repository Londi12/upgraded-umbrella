"use client"

import { useState } from "react"
import { Crown, Clock, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSubscription } from "@/hooks/use-subscription"

export function SubscriptionStatus() {
  const { 
    subscription, 
    loading, 
    canUseJobMatching, 
    canDownloadCV, 
    canCreateCoverLetter,
    isTrialExpired,
    getTrialDaysRemaining
  } = useSubscription()
  
  const [showUpgrade, setShowUpgrade] = useState(false)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) return null

  const jobMatching = canUseJobMatching()
  const cvDownload = canDownloadCV()
  const coverLetter = canCreateCoverLetter()
  const trialDays = getTrialDaysRemaining()
  const isExpired = isTrialExpired()

  const getPlanIcon = () => {
    switch (subscription.planType) {
      case 'pro': return <Crown className="h-5 w-5 text-yellow-500" />
      case 'premium': return <Crown className="h-5 w-5 text-blue-500" />
      case 'base': return <CheckCircle className="h-5 w-5 text-green-500" />
      default: return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getPlanColor = () => {
    switch (subscription.planType) {
      case 'pro': return 'bg-gradient-to-r from-yellow-400 to-orange-500'
      case 'premium': return 'bg-gradient-to-r from-blue-500 to-purple-600'
      case 'base': return 'bg-gradient-to-r from-green-500 to-teal-600'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-4">
      {/* Trial Warning */}
      {subscription.status === 'trial' && trialDays <= 3 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {trialDays > 0 
              ? `Your free trial expires in ${trialDays} day${trialDays !== 1 ? 's' : ''}. Upgrade to continue using premium features.`
              : 'Your free trial has expired. Upgrade now to continue using CVKonnekt.'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Subscription Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getPlanIcon()}
              <div>
                <CardTitle className="capitalize">
                  {subscription.planType} Plan
                  {subscription.status === 'trial' && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Trial
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {subscription.status === 'trial' 
                    ? `${trialDays} days remaining`
                    : `Active until ${new Date(subscription.endDate).toLocaleDateString()}`
                  }
                </CardDescription>
              </div>
            </div>
            
            {subscription.planType !== 'pro' && (
              <Button size="sm" onClick={() => setShowUpgrade(true)}>
                Upgrade
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Usage Limits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Job Matching */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Job Matches</span>
                <span className="text-gray-500">
                  {jobMatching.remaining === -1 ? 'Unlimited' : `${jobMatching.remaining} left`}
                </span>
              </div>
              {jobMatching.remaining !== -1 && (
                <Progress 
                  value={jobMatching.remaining > 0 ? (jobMatching.remaining / 5) * 100 : 0} 
                  className="h-2"
                />
              )}
              {!jobMatching.allowed && (
                <p className="text-xs text-red-600">{jobMatching.message}</p>
              )}
            </div>

            {/* CV Downloads */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">CV Downloads</span>
                <span className="text-gray-500">
                  {cvDownload.remaining === -1 ? 'Unlimited' : `${cvDownload.remaining} left`}
                </span>
              </div>
              {cvDownload.remaining !== -1 && (
                <Progress 
                  value={cvDownload.remaining > 0 ? (cvDownload.remaining / 50) * 100 : 0} 
                  className="h-2"
                />
              )}
              {!cvDownload.allowed && (
                <p className="text-xs text-red-600">{cvDownload.message}</p>
              )}
            </div>

            {/* Cover Letters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Cover Letters</span>
                <span className="text-gray-500">
                  {coverLetter.remaining === -1 ? 'Unlimited' : `${coverLetter.remaining} left`}
                </span>
              </div>
              {coverLetter.remaining !== -1 && (
                <Progress 
                  value={coverLetter.remaining > 0 ? (coverLetter.remaining / 15) * 100 : 0} 
                  className="h-2"
                />
              )}
              {!coverLetter.allowed && (
                <p className="text-xs text-red-600">{coverLetter.message}</p>
              )}
            </div>
          </div>

          {/* Plan Benefits */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Your Plan Includes:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {subscription.planType === 'base' && (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Basic Templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Email Support</span>
                  </div>
                </>
              )}
              {subscription.planType === 'premium' && (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Premium Templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Advanced ATS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Priority Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Cover Letter Builder</span>
                  </div>
                </>
              )}
              {subscription.planType === 'pro' && (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>All Templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Pro ATS Optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>LinkedIn Optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Career Coaching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Phone Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Unlimited Everything</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}