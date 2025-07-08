"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, ArrowLeft, FileText, Target, Zap } from "lucide-react"

interface OnboardingWizardProps {
  onComplete: () => void
  onSkip: () => void
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Welcome to CVKonnekt",
      description: "Create professional CVs designed for the South African job market",
      icon: <FileText className="h-12 w-12 text-blue-600" />,
      content: "Get started in just 3 simple steps and land your dream job faster."
    },
    {
      title: "Choose Your Path",
      description: "Select how you'd like to build your CV",
      icon: <Target className="h-12 w-12 text-green-600" />,
      content: "Upload existing CV for auto-fill or start fresh with our guided builder."
    },
    {
      title: "Get Matched",
      description: "Find jobs that match your skills",
      icon: <Zap className="h-12 w-12 text-purple-600" />,
      content: "Our AI analyzes your CV and matches you with relevant job opportunities."
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {steps[currentStep].icon}
          </div>
          <CardTitle className="text-xl">{steps[currentStep].title}</CardTitle>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-2">{steps[currentStep].description}</p>
            <p className="text-sm text-gray-500">{steps[currentStep].content}</p>
          </div>
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onSkip}>
                Skip
              </Button>
              <Button onClick={nextStep}>
                {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}