"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Download, Eye, Save, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { generateCVPDF, downloadBlob } from "@/lib/pdf-utils"
import type { CVData } from "@/types/cv-types"
import { type TemplateType } from '@/types/cv-types'
import { OnboardingWizard } from "@/components/onboarding-wizard"
import { Progress } from "@/components/ui/progress"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CVPreview } from "@/components/cv-preview"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getUserProfile, createOrUpdateUserProfile, saveCV } from "@/lib/user-data-service"
import { useAuth } from "@/contexts/auth-context"
import { ATSScoringPanel } from '@/components/ats-scoring-panel'
import { parseCV } from "@/lib/cv-parser"

export default function CreateCVPage() {
  const searchParams = useSearchParams()
  const templateId = searchParams.get("template") || "1"
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true)

  useEffect(() => {
    // Check if the user has completed onboarding before, but only on client side
    if (typeof window !== 'undefined') {
      const hasCompletedOnboarding = localStorage.getItem("hasCompletedOnboarding")
      setShowOnboarding(!hasCompletedOnboarding)
    }
  }, [])

  // Map template IDs to template types
  const templateMap: Record<string, any> = {
    "1": { type: "professional", name: "Corporate Professional" },
    "2": { type: "modern", name: "Modern Minimalist" },
    "3": { type: "creative", name: "Creative Design" },
    "4": { type: "simple", name: "Simple Clean" },
    "5": { type: "executive", name: "Executive Elite" },
    "6": { type: "technical", name: "Technical Expert" },
    "7": { type: "graduate", name: "Graduate Entry" },
    "8": { type: "digital", name: "Digital Portfolio" },
  }

  const [selectedTemplate, setSelectedTemplate] = useState(templateMap[templateId] || templateMap["1"])

  // Form state
  const [formData, setFormData] = useState({
    personalInfo: {
      fullName: "",
      jobTitle: "",
      email: "",
      phone: "",
      location: "",
    },
    summary: "",
    experience: [
      {
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ],
    education: [
      {
        degree: "",
        institution: "",
        location: "",
        graduationDate: "",
      },
    ],
    skills: "",
  })

  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { user, isConfigured } = useAuth()

  // Load user profile on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!isConfigured || !user) return

      setIsLoadingProfile(true)
      const { data: profile } = await getUserProfile()

      if (profile) {
        setFormData({
          personalInfo: profile.personal_info || formData.personalInfo,
          summary: profile.summary || "",
          experience: profile.experience?.length > 0 ? profile.experience : formData.experience,
          education: profile.education?.length > 0 ? profile.education : formData.education,
          skills: profile.skills || "",
        })
      }
      setIsLoadingProfile(false)
    }

    if (!showOnboarding) {
      loadUserProfile()
    }
  }, [user, isConfigured, showOnboarding])

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isParsingCV, setIsParsingCV] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const [activeSection, setActiveSection] = useState<string>('personal')
  const sections = ['personal', 'summary', 'experience', 'education', 'skills']
  
  const getProgress = () => {
    let completed = 0;
    if (formData.personalInfo.fullName && formData.personalInfo.jobTitle) completed++;
    if (formData.summary) completed++;
    if (formData.experience.length > 0 && formData.experience[0].title) completed++;
    if (formData.education.length > 0 && formData.education[0].degree) completed++;
    if (formData.skills) completed++;
    return (completed / 5) * 100;
  }
  
  const handleNextSection = () => {
    const currentIndex = sections.indexOf(activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1]);
    }
  }
  
  const handlePreviousSection = () => {
    const currentIndex = sections.indexOf(activeSection);
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1]);
    }
  }

  // Handle form changes
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      personalInfo: {
        ...formData.personalInfo,
        [name]: value,
      },
    })
  }

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      summary: e.target.value,
    })
  }

  const handleExperienceChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const updatedExperience = [...formData.experience]
    updatedExperience[index] = {
      ...updatedExperience[index],
      [name]: value,
    }
    setFormData({
      ...formData,
      experience: updatedExperience,
    })
  }

  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [
        ...formData.experience,
        {
          title: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          description: "",
        },
      ],
    })
  }

  const handleEducationChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updatedEducation = [...formData.education]
    updatedEducation[index] = {
      ...updatedEducation[index],
      [name]: value,
    }
    setFormData({
      ...formData,
      education: updatedEducation,
    })
  }

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [
        ...formData.education,
        {
          degree: "",
          institution: "",
          location: "",
          graduationDate: "",
        },
      ],
    })
  }

  const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      skills: e.target.value,
    })
  }

  const handleSaveProfile = async () => {
    if (!isConfigured || !user) return

    setIsSaving(true)
    const { error } = await createOrUpdateUserProfile(formData)

    if (error) {
      console.error("Error saving profile:", error)
      setError("Failed to save profile data")
    }
    setIsSaving(false)
  }

  const handleSaveCV = async () => {
    if (!isConfigured || !user) return

    const cvName = `${formData.personalInfo.fullName || "My CV"} - ${selectedTemplate.name}`

    setIsSaving(true)
    const { error } = await saveCV({
      name: cvName,
      template_type: selectedTemplate.type,
      template_name: selectedTemplate.name,
      cv_data: formData as CVData,
    })

    if (error) {
      console.error("Error saving CV:", error)
      setError("Failed to save CV")
    } else {
      // Also save the profile data for future use
      await handleSaveProfile()
    }
    setIsSaving(false)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsingCV(true);
    setParseError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const response = await fetch('/api/parse-cv', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('CV parsing failed:', errorData);
        throw new Error(`API request failed: ${errorData.error || response.status}`);
      }

      const result = await response.json();

      if (result.data && result.data.personalInfo) {
        setFormData({
          personalInfo: {
            fullName: result.data.personalInfo?.fullName || "",
            jobTitle: result.data.personalInfo?.jobTitle || "",
            email: result.data.personalInfo?.email || "",
            phone: result.data.personalInfo?.phone || "",
            location: result.data.personalInfo?.location || "",
          },
          summary: result.data.summary || "",
          experience: Array.isArray(result.data.experience) && result.data.experience.length > 0 
            ? result.data.experience 
            : formData.experience,
          education: Array.isArray(result.data.education) && result.data.education.length > 0 
            ? result.data.education 
            : formData.education,
          skills: result.data.skills || "",
        });
      } else {
        setParseError(result.error || "Failed to parse CV. Please enter your details manually.");
      }
    } catch (err) {
      console.error("Error parsing CV:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setParseError(`Failed to parse CV: ${errorMessage}. Debug Info: Check the browser console for detailed error logs. There might be an issue with the file processing library. Please try a different file format or enter your details manually.`);
    } finally {
      setIsParsingCV(false);
    }
  }

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    setError(null)

    try {
      const pdfBlob = await generateCVPDF(selectedTemplate.type, formData as CVData, selectedTemplate.name)
      const fileName = `${formData.personalInfo.fullName || "CV"}_${selectedTemplate.name}.pdf`
      downloadBlob(pdfBlob, fileName)
    } catch (error) {
      console.error("Error generating PDF:", error)
      setError(error instanceof Error ? error.message : "Failed to generate PDF. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Add section change handler
  const handleSectionChange = (section: string) => {
    setActiveSection(section)
  }

  const handleInputFocus = (section: string) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleSectionChange(section);
  };

  const handleOnboardingComplete = (onboardingData: { careerLevel: string; industry: string; jobTitle: string }, templateType: TemplateType) => {
    // Find the template ID from the type
    const newTemplateId = Object.keys(templateMap).find(id => templateMap[id].type === templateType) || "1"
    setSelectedTemplate(templateMap[newTemplateId])
    setFormData({
      ...formData,
      personalInfo: {
        ...formData.personalInfo,
        jobTitle: onboardingData.jobTitle,
      },
    })
    setShowOnboarding(false)
    localStorage.setItem("hasCompletedOnboarding", "true")
  }

  const handleSkipOnboarding = () => {
    setShowOnboarding(false)
    localStorage.setItem("hasCompletedOnboarding", "true")
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} onSkip={handleSkipOnboarding} />
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/cv-templates">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Templates
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">
              Creating CV with <span className="text-emerald-600">{selectedTemplate.name}</span> template
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isConfigured && user && (
              <>
                <Button variant="outline" size="sm" onClick={handleSaveProfile} disabled={isSaving || isLoadingProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveCV} disabled={isSaving || isLoadingProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save CV"}
                </Button>
              </>
            )}
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF || isLoadingProfile}
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? "Generating PDF..." : "Download PDF"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        {parseError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{parseError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
            {isLoadingProfile && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your profile...</p>
              </div>
            )}

            {!isLoadingProfile && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h2 className="text-lg font-medium mb-2">CV Completion Progress</h2>
                  <Progress value={getProgress()} className="h-2" />
                  <p className="text-sm text-gray-500 mt-1">{Math.round(getProgress())}% Complete</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h2 className="text-lg font-medium mb-2">Upload Existing CV</h2>
                  <p className="text-sm text-gray-600 mb-3">Upload your existing CV to auto-fill the fields. Supported formats: PDF, DOCX, TXT.</p>
                  <Input 
                    type="file" 
                    accept=".pdf,.docx,.txt" 
                    onChange={handleFileUpload} 
                    disabled={isParsingCV}
                    className="mb-2"
                  />
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-4 hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = e.dataTransfer.files;
                      if (files.length > 0) {
                        const event = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
                        handleFileUpload(event);
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <p className="text-gray-500">Drag and drop your CV here</p>
                  </div>
                </div>
                <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
                  <TabsList className="mb-4 overflow-x-auto flex">
                    <TabsTrigger value="personal">Personal Info</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    <Card className="p-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            name="fullName"
                            value={formData.personalInfo.fullName}
                            onChange={handlePersonalInfoChange}
                            placeholder="e.g., John Smith"
                            onFocus={handleInputFocus('personal')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="jobTitle">Job Title</Label>
                          <Input
                            id="jobTitle"
                            name="jobTitle"
                            value={formData.personalInfo.jobTitle}
                            onChange={handlePersonalInfoChange}
                            placeholder="e.g., Senior Financial Analyst"
                            onFocus={handleInputFocus('personal')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.personalInfo.email}
                            onChange={handlePersonalInfoChange}
                            placeholder="e.g., john.smith@email.com"
                            onFocus={handleInputFocus('personal')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.personalInfo.phone}
                            onChange={handlePersonalInfoChange}
                            placeholder="e.g., +27 11 123 4567"
                            onFocus={handleInputFocus('personal')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            name="location"
                            value={formData.personalInfo.location}
                            onChange={handlePersonalInfoChange}
                            placeholder="e.g., Johannesburg, SA"
                            onFocus={handleInputFocus('personal')}
                          />
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="summary" className="space-y-4">
                    <Card className="p-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="summary">Professional Summary</Label>
                          <Textarea
                            id="summary"
                            value={formData.summary}
                            onChange={handleSummaryChange}
                            placeholder="Write a brief summary of your professional background and key qualifications..."
                            className="min-h-[150px]"
                            onFocus={handleInputFocus('summary')}
                          />
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="experience" className="space-y-4">
                    {formData.experience.map((exp, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`title-${index}`}>Job Title</Label>
                            <Input
                              id={`title-${index}`}
                              name="title"
                              value={exp.title}
                              onChange={(e) => handleExperienceChange(index, e)}
                              placeholder="e.g., Senior Financial Analyst"
                              onFocus={handleInputFocus(`experience-${index}`)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`company-${index}`}>Company</Label>
                            <Input
                              id={`company-${index}`}
                              name="company"
                              value={exp.company}
                              onChange={(e) => handleExperienceChange(index, e)}
                              placeholder="e.g., ABC Corporation"
                              onFocus={handleInputFocus(`experience-${index}`)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`startDate-${index}`}>Start Date</Label>
                              <Input
                                id={`startDate-${index}`}
                                name="startDate"
                                value={exp.startDate}
                                onChange={(e) => handleExperienceChange(index, e)}
                                placeholder="e.g., Jan 2020"
                                onFocus={handleInputFocus(`experience-${index}`)}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`endDate-${index}`}>End Date</Label>
                              <Input
                                id={`endDate-${index}`}
                                name="endDate"
                                value={exp.endDate}
                                onChange={(e) => handleExperienceChange(index, e)}
                                placeholder="e.g., Present"
                                onFocus={handleInputFocus(`experience-${index}`)}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`location-${index}`}>Location</Label>
                            <Input
                              id={`location-${index}`}
                              name="location"
                              value={exp.location}
                              onChange={(e) => handleExperienceChange(index, e)}
                              placeholder="e.g., Johannesburg, SA"
                              onFocus={handleInputFocus(`experience-${index}`)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`description-${index}`}>Description</Label>
                            <Textarea
                              id={`description-${index}`}
                              name="description"
                              value={exp.description}
                              onChange={(e) => handleExperienceChange(index, e)}
                              placeholder="Describe your responsibilities and achievements..."
                              className="min-h-[100px]"
                              onFocus={handleInputFocus(`experience-${index}`)}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Button variant="outline" onClick={addExperience} className="w-full">
                      Add Another Experience
                    </Button>
                  </TabsContent>

                  <TabsContent value="education" className="space-y-4">
                    {formData.education.map((edu, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`degree-${index}`}>Degree</Label>
                            <Input
                              id={`degree-${index}`}
                              name="degree"
                              value={edu.degree}
                              onChange={(e) => handleEducationChange(index, e)}
                              placeholder="e.g., Bachelor of Commerce"
                              onFocus={handleInputFocus(`education-${index}`)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`institution-${index}`}>Institution</Label>
                            <Input
                              id={`institution-${index}`}
                              name="institution"
                              value={edu.institution}
                              onChange={(e) => handleEducationChange(index, e)}
                              placeholder="e.g., University of Cape Town"
                              onFocus={handleInputFocus(`education-${index}`)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`eduLocation-${index}`}>Location</Label>
                            <Input
                              id={`eduLocation-${index}`}
                              name="location"
                              value={edu.location}
                              onChange={(e) => handleEducationChange(index, e)}
                              placeholder="e.g., Cape Town, SA"
                              onFocus={handleInputFocus(`education-${index}`)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`graduationDate-${index}`}>Graduation Date</Label>
                            <Input
                              id={`graduationDate-${index}`}
                              name="graduationDate"
                              value={edu.graduationDate}
                              onChange={(e) => handleEducationChange(index, e)}
                              placeholder="e.g., 2020"
                              onFocus={handleInputFocus(`education-${index}`)}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Button variant="outline" onClick={addEducation} className="w-full">
                      Add Another Education
                    </Button>
                  </TabsContent>

                  <TabsContent value="skills" className="space-y-4">
                    <Card className="p-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="skills">Skills</Label>
                          <Textarea
                            id="skills"
                            value={formData.skills}
                            onChange={handleSkillsChange}
                            placeholder="List your skills, separated by commas (e.g., Excel, SQL, Python, Financial Modeling)"
                            className="min-h-[150px]"
                            onFocus={handleInputFocus('skills')}
                          />
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
                <div className="flex justify-between mt-4">
                  <Button 
                    variant="outline" 
                    onClick={handlePreviousSection} 
                    disabled={sections.indexOf(activeSection) === 0}
                    className="flex items-center"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleNextSection} 
                    disabled={sections.indexOf(activeSection) === sections.length - 1}
                    className="flex items-center"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="relative">
            <div className="sticky top-20">
              <div className="bg-white border rounded-lg p-4 mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium">Preview</h2>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Full Preview
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden" id="cv-preview">
                <div className="aspect-[1/1.414] overflow-auto">
                  <CVPreview template={selectedTemplate.type} className="w-full h-full" userData={formData} />
                </div>
              </div>
            </div>
            <ATSScoringPanel 
              cvData={formData as CVData}
              currentSection={activeSection}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
