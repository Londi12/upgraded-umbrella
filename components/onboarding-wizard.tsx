"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TemplateType } from "@/types/cv-types"

interface OnboardingData {
  careerLevel: string
  industry: string
  jobTitle: string
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData, selectedTemplate: TemplateType) => void
  onSkip: () => void
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    careerLevel: "",
    industry: "",
    jobTitle: "",
  })

  // Template mapping based on career level and industry
  const getRecommendedTemplate = (careerLevel: string, industry: string): TemplateType => {
    if (careerLevel === "executive") return "executive"
    if (careerLevel === "entry-level" && industry === "technology") return "graduate"
    if (industry === "creative") return "creative"
    if (industry === "technology") return "technical"
    if (careerLevel === "mid-career") return "modern"
    return "professional"
  }

  const handleNext = () => {
    if (step === 3) {
      const selectedTemplate = getRecommendedTemplate(data.careerLevel, data.industry)
      onComplete(data, selectedTemplate)
    } else {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleChange = (field: keyof OnboardingData, value: string) => {
    setData({ ...data, [field]: value })
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to CV Builder</CardTitle>
          <CardDescription>Let's personalize your CV creation experience. Step {step} of 3</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="careerLevel">What is your career level?</Label>
                <RadioGroup 
                  id="careerLevel" 
                  value={data.careerLevel} 
                  onValueChange={(value) => handleChange("careerLevel", value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="entry-level" id="entry-level" />
                    <Label htmlFor="entry-level">Entry Level</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mid-career" id="mid-career" />
                    <Label htmlFor="mid-career">Mid Career</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="executive" id="executive" />
                    <Label htmlFor="executive">Executive</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="industry">What industry are you in?</Label>
                <Select value={data.industry} onValueChange={(value) => handleChange("industry", value)}>
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="creative">Creative/Design</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">What is your target job title?</Label>
                <Input 
                  id="jobTitle" 
                  value={data.jobTitle} 
                  onChange={(e) => handleChange("jobTitle", e.target.value)} 
                  placeholder="e.g., Software Engineer"
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onSkip}>Skip Wizard</Button>
          <div className="flex gap-2">
            {step > 1 && <Button variant="outline" onClick={handleBack}>Back</Button>}
            <Button 
              onClick={handleNext} 
              disabled={
                (step === 1 && !data.careerLevel) || 
                (step === 2 && !data.industry) || 
                (step === 3 && !data.jobTitle)
              }
            >
              {step === 3 ? "Finish" : "Next"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
