"use client"

import { CreditCard, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"

export default function CurrentPlanPage() {
  const currentPlan = {
    name: "Premium",
    price: "R299.99",
    status: "Active",
    nextBilling: "2024-02-15",
    features: [
      "Everything in Base",
      "Premium Templates", 
      "Advanced ATS Optimization",
      "5 Job Matches per week",
      "Cover Letter Builder",
      "Priority Support"
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Current Plan"
        description="Manage your subscription and billing details"
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {currentPlan.name} Plan
                </CardTitle>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {currentPlan.status}
                </Badge>
              </div>
              <CardDescription>
                Your current subscription details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Price</span>
                <span className="text-2xl font-bold text-blue-600">{currentPlan.price}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Next Billing Date</span>
                <span className="font-medium">{currentPlan.nextBilling}</span>
              </div>
              <div className="pt-4 space-y-2">
                <h4 className="font-medium">Plan Features:</h4>
                <ul className="space-y-2">
                  {currentPlan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan Actions</CardTitle>
              <CardDescription>
                Manage your subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => window.location.href = '/pricing'}>
                Upgrade Plan
              </Button>
              <Button variant="outline" className="w-full">
                Download Invoice
              </Button>
              <Button variant="outline" className="w-full">
                Update Payment Method
              </Button>
              <Button variant="destructive" className="w-full">
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}