"use client"

import { useState, useEffect } from "react"
import { Lock, Crown, Zap, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SubscriptionManager, type PlanType } from "@/lib/subscription-manager"

interface PlanGateProps {
  feature: string
  requiredPlan: PlanType
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PlanGate({ feature, requiredPlan, children, fallback }: PlanGateProps) {
  const [hasAccess, setHasAccess] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const subscriptionManager = new SubscriptionManager()

  useEffect(() => {
    checkAccess()
  }, [feature])

  const checkAccess = async () => {
    const userSub = await subscriptionManager.getUserSubscription('current_user')
    setSubscription(userSub)
    setHasAccess(subscriptionManager.canAccessFeature(feature))
  }

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <Card className="max-w-sm mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Upgrade Required</CardTitle>
            <CardDescription>
              This feature requires a {requiredPlan} plan or higher
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setShowUpgrade(true)} className="w-full">
              Upgrade Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <UpgradeDialog 
        open={showUpgrade} 
        onClose={() => setShowUpgrade(false)}
        currentPlan={subscription?.planType}
        requiredPlan={requiredPlan}
      />
    </div>
  )
}

interface UsageLimitProps {
  feature: 'jobMatching' | 'cvDownload' | 'coverLetter'
  onUpgrade?: () => void
}

export function UsageLimit({ feature, onUpgrade }: UsageLimitProps) {
  const [usage, setUsage] = useState<{ allowed: boolean, remaining: number, message?: string }>({ allowed: true, remaining: 0 })
  const [showUpgrade, setShowUpgrade] = useState(false)
  const subscriptionManager = new SubscriptionManager()

  useEffect(() => {
    checkUsage()
  }, [feature])

  const checkUsage = async () => {
    await subscriptionManager.getUserSubscription('current_user')
    
    switch (feature) {
      case 'jobMatching':
        setUsage(subscriptionManager.canUseJobMatching())
        break
      case 'cvDownload':
        setUsage(subscriptionManager.canDownloadCV())
        break
      case 'coverLetter':
        setUsage(subscriptionManager.canCreateCoverLetter())
        break
    }
  }

  if (usage.allowed && usage.remaining > 0) {
    return (
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-900">
            {feature === 'jobMatching' && 'Job Matches'}
            {feature === 'cvDownload' && 'CV Downloads'}
            {feature === 'coverLetter' && 'Cover Letters'}
          </span>
          <Badge variant="outline" className="text-blue-700">
            {usage.remaining === -1 ? 'Unlimited' : `${usage.remaining} left`}
          </Badge>
        </div>
        {usage.remaining !== -1 && usage.remaining <= 3 && (
          <div className="space-y-2">
            <Progress value={(usage.remaining / 10) * 100} className="h-2" />
            <p className="text-xs text-blue-700">
              Running low! <button onClick={() => setShowUpgrade(true)} className="underline">Upgrade for more</button>
            </p>
          </div>
        )}
      </div>
    )
  }

  if (!usage.allowed) {
    return (
      <Card className="mb-4 border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">Limit Reached</p>
              <p className="text-xs text-amber-700">{usage.message}</p>
            </div>
            <Button size="sm" onClick={() => setShowUpgrade(true)}>
              Upgrade
            </Button>
          </div>
        </CardContent>
        
        <UpgradeDialog 
          open={showUpgrade} 
          onClose={() => setShowUpgrade(false)}
          feature={feature}
        />
      </Card>
    )
  }

  return null
}

interface UpgradeDialogProps {
  open: boolean
  onClose: () => void
  currentPlan?: PlanType
  requiredPlan?: PlanType
  feature?: string
}

function UpgradeDialog({ open, onClose, currentPlan, requiredPlan, feature }: UpgradeDialogProps) {
  const plans = [
    {
      name: 'Base',
      price: 'R199.99',
      type: 'base' as PlanType,
      icon: <Zap className="h-5 w-5" />,
      features: ['1 Job Match/week', '10 Downloads/month', 'Basic Templates', 'Email Support'],
      paymentUrl: 'https://pay.yoco.com/r/mN8Zyk'
    },
    {
      name: 'Premium',
      price: 'R299.99',
      type: 'premium' as PlanType,
      icon: <Crown className="h-5 w-5" />,
      features: ['5 Job Matches/week', '50 Downloads/month', 'Premium Templates', 'Priority Support'],
      paymentUrl: 'https://pay.yoco.com/r/moYrVp',
      popular: true
    },
    {
      name: 'Pro',
      price: 'R399.99',
      type: 'pro' as PlanType,
      icon: <Crown className="h-5 w-5" />,
      features: ['Unlimited Everything', 'All Templates', 'Career Coaching', 'Phone Support'],
      paymentUrl: 'https://pay.yoco.com/r/4aAqV5'
    }
  ]

  const filteredPlans = requiredPlan 
    ? plans.filter(plan => plan.type === requiredPlan || (requiredPlan === 'base' && ['premium', 'pro'].includes(plan.type)))
    : plans.filter(plan => plan.type !== currentPlan)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-blue-600" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            {feature && `Unlock ${feature} and get more from CVKonnekt`}
            {requiredPlan && `${requiredPlan} plan required for this feature`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {filteredPlans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="mx-auto w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  {plan.icon}
                </div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="text-2xl font-bold text-blue-600">{plan.price}</div>
                <div className="text-sm text-gray-500">/month</div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full"
                  onClick={() => window.open(plan.paymentUrl, '_blank')}
                >
                  Choose {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-4 text-sm text-gray-500">
          7-day free trial • Cancel anytime • Secure payment by Yoco
        </div>
      </DialogContent>
    </Dialog>
  )
}