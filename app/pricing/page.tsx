"use client"

import { useState, useEffect, Suspense } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { useSearchParams } from "next/navigation"

function PricingPageContent() {
  const searchParams = useSearchParams()
  const [isSignupFlow, setIsSignupFlow] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const signup = searchParams.get('signup')
    const email = searchParams.get('email')
    if (signup === 'true') {
      setIsSignupFlow(true)
      if (email) setUserEmail(email)
    }
  }, [searchParams])

  const plans = [
    {
      name: "Base",
      price: "R199.99",
      paymentUrl: "https://pay.yoco.com/r/mN8Zyk",
      description: "Full access to the Resume Builder + Downloadable PDF & Word formats + Basic design templates + Basic ATS-friendly formatting + 1 Job Match search per week + Email support",
      features: [
        "Resume Builder Access",
        "PDF & Word Downloads",
        "Basic Design Templates",
        "Basic ATS Formatting",
        "1 Job Match per week",
        "Email Support"
      ]
    },
    {
      name: "Premium",
      price: "R299.99",
      paymentUrl: "https://pay.yoco.com/r/moYrVp",
      description: "Everything in Base plus advanced features",
      features: [
        "Everything in Base",
        "Premium Templates",
        "Advanced ATS Optimization",
        "5 Job Matches per week",
        "Cover Letter Builder",
        "Priority Support"
      ]
    },
    {
      name: "Pro",
      price: "R399.99",
      paymentUrl: "https://pay.yoco.com/r/4aAqV5",
      description: "Complete professional package",
      features: [
        "Everything in Premium",
        "Unlimited Job Matches",
        "Personal Branding Tools",
        "LinkedIn Optimization",
        "Career Coaching Session",
        "24/7 Phone Support"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title={isSignupFlow ? "Welcome! Choose Your Plan" : "Choose Your Plan"}
        description={isSignupFlow ? 
          `Complete your registration by selecting a plan. Welcome ${userEmail ? userEmail.split('@')[0] : 'to CVKonnekt'}!` :
          "Select the perfect plan to accelerate your job search and career growth."
        }
      />

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={plan.name} className={`relative ${index === 1 ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-200'}`}>
              {index === 1 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-blue-600">{plan.price}</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <CardDescription className="mt-4 text-sm">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full mt-6 ${index === 1 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'}`}
                  size="lg"
                  onClick={() => {
                    if (isSignupFlow) {
                      // Store selected plan and redirect to dashboard
                      localStorage.setItem('selected_plan', JSON.stringify({
                        plan: plan.name,
                        price: plan.price,
                        paymentUrl: plan.paymentUrl,
                        selectedAt: new Date().toISOString()
                      }))
                      window.location.href = '/dashboard?welcome=true'
                    } else {
                      window.open(plan.paymentUrl, '_blank')
                    }
                  }}
                >
                  {isSignupFlow ? 'Select Plan' : 'Get Started'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">All plans include a 7-day free trial. Cancel anytime.</p>
          <p className="text-sm text-gray-500">
            Need a custom solution? <a href="/contact" className="text-blue-600 hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingPageContent />
    </Suspense>
  )
}