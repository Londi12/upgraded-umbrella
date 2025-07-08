"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Plus, X } from "lucide-react"
import type { CVData } from "@/types/cv-types"

interface SmartCVBuilderProps {
  formData: CVData
  onFormDataChange: (data: CVData) => void
}

// Job title suggestions based on SA market
const jobTitleSuggestions: Record<string, string[]> = {
  "software": ["Software Developer", "Senior Software Engineer", "Full Stack Developer", "Frontend Developer", "Backend Developer"],
  "finance": ["Financial Analyst", "Senior Financial Analyst", "Finance Manager", "Investment Analyst", "Risk Analyst"],
  "marketing": ["Marketing Manager", "Digital Marketing Specialist", "Brand Manager", "Marketing Coordinator", "Social Media Manager"],
  "data": ["Data Analyst", "Data Scientist", "Business Intelligence Analyst", "Data Engineer", "Analytics Manager"],
  "project": ["Project Manager", "Senior Project Manager", "Project Coordinator", "Scrum Master", "Program Manager"]
}

// Skills suggestions based on job title
const skillsSuggestions: Record<string, string[]> = {
  "software": ["JavaScript", "Python", "React", "Node.js", "SQL", "Git", "AWS", "Docker"],
  "finance": ["Excel", "Financial Modeling", "SAP", "Power BI", "Risk Management", "IFRS", "Budgeting", "Forecasting"],
  "marketing": ["Google Analytics", "Social Media Marketing", "Content Marketing", "SEO", "PPC", "Adobe Creative Suite", "Email Marketing"],
  "data": ["Python", "SQL", "Tableau", "Power BI", "Machine Learning", "Statistics", "Excel", "R"],
  "project": ["Agile", "Scrum", "MS Project", "JIRA", "Risk Management", "Stakeholder Management", "Budget Management"]
}

export function SmartCVBuilder({ formData, onFormDataChange }: SmartCVBuilderProps) {
  const [suggestions, setSuggestions] = useState<{
    jobTitles: string[]
    skills: string[]
  }>({ jobTitles: [], skills: [] })

  const [showSuggestions, setShowSuggestions] = useState(false)

  // Generate suggestions based on current input
  useEffect(() => {
    const jobTitle = formData.personalInfo.jobTitle.toLowerCase()
    const matchedCategory = Object.keys(jobTitleSuggestions).find(key => 
      jobTitle.includes(key)
    )

    if (matchedCategory) {
      setSuggestions({
        jobTitles: jobTitleSuggestions[matchedCategory] || [],
        skills: skillsSuggestions[matchedCategory] || []
      })
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [formData.personalInfo.jobTitle])

  const handleJobTitleChange = (value: string) => {
    onFormDataChange({
      ...formData,
      personalInfo: {
        ...formData.personalInfo,
        jobTitle: value
      }
    })
  }

  const addSuggestedSkill = (skill: string) => {
    const currentSkills = typeof formData.skills === 'string' 
      ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
      : []
    
    if (!currentSkills.includes(skill)) {
      const newSkills = [...currentSkills, skill].join(', ')
      onFormDataChange({
        ...formData,
        skills: newSkills
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Smart Job Title Input */}
      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job Title</Label>
        <Input
          id="jobTitle"
          value={formData.personalInfo.jobTitle}
          onChange={(e) => handleJobTitleChange(e.target.value)}
          placeholder="e.g., Software Developer"
        />
        
        {showSuggestions && suggestions.jobTitles.length > 0 && (
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Suggested Job Titles</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.jobTitles.slice(0, 3).map((title) => (
                <Badge
                  key={title}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-100 border-blue-300 text-blue-700"
                  onClick={() => handleJobTitleChange(title)}
                >
                  {title}
                </Badge>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Smart Skills Suggestions */}
      {showSuggestions && suggestions.skills.length > 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Recommended Skills for {formData.personalInfo.jobTitle}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.skills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="cursor-pointer hover:bg-green-100 border-green-300 text-green-700"
                onClick={() => addSuggestedSkill(skill)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {skill}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-green-600 mt-2">
            Click to add skills to your CV
          </p>
        </Card>
      )}
    </div>
  )
}