"use client"

import { useState } from "react"
import { Crown, Check, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface PlanSelectionProps {
  open: boolean
  onClose: () => void
  onPlanSelected: (plan: string) => void
}

export function PlanSelection({ open, onClose, onPlanSelected }: PlanSelectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const plans = [
    {
      id: 'free',
      name: 'Free Trial',
      price: 'R0',
      duration: '7 days',
      features: [
        '1 CV download',
        'Basic templates',
        'Basic ATS check',
        'No job matching'
      ],
      buttonText: 'Start Free Trial',
      popular: false
    },
    {
      id: 'base',
      name: 'Base',
      price: 'R199.99',
      duration: '/month',
      features: [
        '10 CV downloads/month',
        'Basic templates',
        '1 job match/week',
        'Email support'
      ],
      buttonText: 'Choose Base',
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 'R299.99',
      duration: '/month',
      features: [
        '50 downloads/month',
        'Premium templates',
        '5 job matches/week',
        'Advanced ATS',
        'Priority support'
      ],
      buttonText: 'Choose Premium',
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 'R399.99',
      duration: '/month',
      features: [
        'Unlimited everything',
        'All templates',
        'Unlimited job matches',
        'Pro ATS optimization',
        'Career coaching',
        'Phone support'
      ],
      buttonText: 'Choose Pro',
      popular: false
    }
  ]

  const handlePlanSelect = (planId: string) => {
    if (planId === 'free') {
      // Start free trial immediately
      localStorage.setItem('user_plan', JSON.stringify({
        plan: 'premium',
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }))
      onPlanSelected('trial')
    } else {
      // For paid plans, redirect to payment
      const plan = plans.find(p => p.id === planId)
      if (plan) {
        const paymentUrls = {
          base: 'https://pay.yoco.com/r/mN8Zyk',
          premium: 'https://pay.yoco.com/r/moYrVp',
          pro: 'https://pay.yoco.com/r/4aAqV5'
        }
        window.open(paymentUrls[planId as keyof typeof paymentUrls], '_blank')
        onPlanSelected(planId)
      }
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
              <DialogDescription className="text-lg mt-2">
                Start with a free trial or choose a plan that fits your needs
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative cursor-pointer transition-all hover:shadow-lg ${
                plan.popular ? 'border-blue-500 shadow-md' : 'border-gray-200'
              } ${selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-2">
                  {plan.id === 'free' ? (
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm">🆓</span>
                    </div>
                  ) : (
                    <Crown className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-blue-600">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.duration}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlanSelect(plan.id)
                  }}
                >
                  {plan.buttonText}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-6 text-sm text-gray-500">
          All paid plans include 7-day free trial • Cancel anytime • Secure payment by Yoco
        </div>
      </DialogContent>
    </Dialog>
  )
}