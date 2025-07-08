"use client"
import React, { useState, useEffect } from "react"
import {
 Maximize2,
 ArrowLeft,
 Download,
 Eye,
 Save,
 AlertCircle,
 ChevronLeft,
 ChevronRight,
 Edit3,
 BarChart2,
 Brain
} from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog"
import Link from "next/link"
import { CVPreview } from "@/components/cv-preview"
import { generateCVPDF, downloadBlob } from "@/lib/pdf-utils"
import type { CVData } from "@/types/cv-types"
import { Progress } from "@/components/ui/progress"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ATSScoringPanel } from "@/components/cv-scoring-panel"
import { ApplicationTracker } from "@/components/application-tracker"
import { JobMatching } from "@/components/job-matching"
import { WorkingATSScore } from "@/components/working-ats-score"
import { WorkingSaveButton } from "@/components/working-save-button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getUserProfile, createOrUpdateUserProfile, saveCV } from "@/lib/user-data-service"
import { useAuth } from "@/contexts/auth-context"
import { trackCVInteraction } from '@/lib/analytics-service'
import { parseCV } from "@/lib/cv-parser"

export default function CreateCVPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const templateId = searchParams.get("template") || "1"

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
    "9": { type: "sa-professional", name: "SA Professional" },
    "10": { type: "sa-modern", name: "SA Modern" },
    "11": { type: "sa-executive", name: "SA Executive" },
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
      idNumber: "",
      linkedIn: "",
      professionalRegistration: "",
      languages: [],
    } as CVData['personalInfo'],
    summary: "",
    experience: [
      {
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
        isLearnership: false,
        isInternship: false,
      },
    ],
    education: [
      {
        degree: "",
        institution: "",
        location: "",
        graduationDate: "",
        nqfLevel: undefined as number | undefined,
        saqa: "",
        internationalEquivalence: "",
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
      if (!isConfigured || !user) {
        // Try to load from localStorage if no user is authenticated
        const savedData = localStorage.getItem('cv-draft');
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            setFormData(parsedData);
          } catch (e) {
            console.error('Error parsing saved CV data', e);
          }
        }
        return;
      }

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

    loadUserProfile()
  }, [user, isConfigured])

  // Auto-save to localStorage periodically
  useEffect(() => {
    // Save immediately on form changes
    localStorage.setItem('cv-draft', JSON.stringify(formData));

    // Also set up periodic saving
    const autoSaveInterval = setInterval(() => {
      localStorage.setItem('cv-draft', JSON.stringify(formData));
    }, 30000); // Every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [formData])

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isParsingCV, setIsParsingCV] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)


  const [showPreviewDialog, setShowPreviewDialog] = useState(false)

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
          isLearnership: false,
          isInternship: false,
        },
      ],
    })
  }

  const handleEducationChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const parsedValue = name === 'nqfLevel'
      ? value ? parseInt(value) : undefined
      : value
    const updatedEducation = [...formData.education]
    updatedEducation[index] = {
      ...updatedEducation[index],
      [name]: parsedValue,
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
          nqfLevel: undefined as number | undefined,
          saqa: "",
          internationalEquivalence: "",
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
    if (!isConfigured || !user) {
      // Redirect to login with a return path
      router.push(`/login?redirect=create&message=Please sign in to save your CV&template=${templateId}`);
      return;
    }

    setIsSaving(true)
    const { error } = await createOrUpdateUserProfile(formData)

    if (error) {
      console.error("Error saving profile:", error)
      setError("Failed to save profile data")
    } else {
      // Show success message
      setSuccess("Profile saved successfully!");
      setTimeout(() => setSuccess(null), 3000); // Clear after 3 seconds
    }
    setIsSaving(false)
  }

  const handleSaveCV = async () => {
    if (!isConfigured || !user) {
      // Redirect to login with a return path
      router.push(`/login?redirect=create&message=Please sign in to save your CV&template=${templateId}`);
      return;
    }

    const cvName = `${formData.personalInfo.fullName || "My CV"} - ${selectedTemplate.name}`

    setIsSaving(true)
    const { data: savedCV, error } = await saveCV({
      name: cvName,
      template_type: selectedTemplate.type,
      template_name: selectedTemplate.name,
      cv_data: formData as CVData,
    })

    if (error) {
      console.error("Error saving CV:", error)
      setError("Failed to save CV")
    } else {
      // Track CV creation for analytics
      if (savedCV?.id) {
        await trackCVInteraction(savedCV.id, 'view')
      }

      // Also save the profile data for future use
      await handleSaveProfile()
      // Show success message
      setSuccess("CV saved successfully!");
      setTimeout(() => setSuccess(null), 3000); // Clear after 3 seconds
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
      setParseError(`Failed to parse CV: ${errorMessage}. Please try a different file format or enter your details manually.`);
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

  // Track CV interactions for analytics
  const trackInteraction = async (type: 'view' | 'download' | 'share') => {
    if (isConfigured && user) {
      try {
        await trackCVInteraction('current-cv', type)
      } catch (error) {
        console.error('Failed to track interaction:', error)
      }
    }
  }

  // Enhanced download with tracking
  const handleDownloadPDFWithTracking = async () => {
    await trackInteraction('download')
    await handleDownloadPDF()
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-slate-50">
        <div className="page-container flex flex-col min-h-screen">
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 border-b border-slate-700 shadow-lg">
            <div className="container mx-auto px-6 py-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
            <Link href="/cv-templates">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-blue-200 transition-all duration-200">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Templates
              </Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                CV Builder
              </h1>
              <p className="text-blue-200 text-sm font-medium">
                Creating with <span className="text-cyan-300 font-semibold">{selectedTemplate.name}</span> template
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConfigured && user ? (
              <>
                <div className="text-sm text-blue-200 mr-3 hidden md:block">
                  <span className="text-white font-medium">{user.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSaveProfile} disabled={isSaving || isLoadingProfile} className="border-blue-400 text-blue-200 hover:bg-blue-800 hover:text-white transition-all duration-200">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveCV} disabled={isSaving || isLoadingProfile} className="border-blue-400 text-blue-200 hover:bg-blue-800 hover:text-white transition-all duration-200">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save CV"}
                </Button>
              </>
            ) : (
              <WorkingSaveButton 
                cvData={formData as CVData}
                className="border-blue-400 text-blue-200 hover:bg-blue-800 hover:text-white transition-all duration-200"
              />
            )}
            <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-blue-400 text-blue-200 hover:bg-blue-800 hover:text-white transition-all duration-200">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>CV Preview</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <CVPreview template={selectedTemplate.type} userData={formData} />
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-blue-400 text-blue-200 hover:bg-blue-800 hover:text-white transition-all duration-200">
                  <Brain className="h-4 w-4 mr-2" />
                  ATS Score
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>ATS Compatibility Analysis</DialogTitle>
                  <DialogDescription>
                    See how well your CV performs with Applicant Tracking Systems
                  </DialogDescription>
                </DialogHeader>
                <WorkingATSScore cvData={formData as CVData} />
              </DialogContent>
            </Dialog>
            <Button
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              size="sm"
              onClick={handleDownloadPDFWithTracking}
              disabled={isGeneratingPDF || isLoadingProfile}
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? "Generating PDF..." : "Download PDF"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {error && (
          <Alert className="mb-6 border-red-300 bg-red-50 shadow-sm rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
          </Alert>
        )}
        {parseError && (
          <Alert className="mb-6 border-red-300 bg-red-50 shadow-sm rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-medium">{parseError}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 border-green-300 bg-green-50 shadow-sm rounded-lg">
            <AlertCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
          </Alert>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Form Section */}
          <div>
            {isLoadingProfile && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading your profile...</p>
              </div>
            )}

            {!isLoadingProfile && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">CV Completion Progress</h2>
                    <span className="text-sm font-medium text-blue-800 bg-blue-100 px-3 py-1 rounded-full">{Math.round(getProgress())}% Complete</span>
                  </div>
                  <Progress value={getProgress()} className="h-3 bg-slate-200" />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">Upload Existing CV</h2>
                  <p className="text-sm text-slate-600 mb-4">Upload your existing CV to auto-fill the fields. Supported formats: PDF, DOCX, TXT.</p>
                  <Input 
                    type="file" 
                    accept=".pdf,.docx,.txt" 
                    onChange={handleFileUpload} 
                    disabled={isParsingCV}
                    className="mb-4 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <div 
                    className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-600 hover:bg-blue-100 transition-all duration-200 cursor-pointer"
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
                    <p className="text-slate-600 font-medium">Drag and drop your CV here</p>
                    <p className="text-xs text-slate-500 mt-1">or click to browse files</p>
                  </div>
                </div>
                <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
                  <TabsList className="mb-6 w-full overflow-x-auto flex bg-slate-100 p-1 rounded-xl shadow-sm">
                    <TabsTrigger value="personal" className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 font-medium rounded-lg transition-all duration-200 text-sm px-3 py-2">Personal</TabsTrigger>
                    <TabsTrigger value="summary" className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 font-medium rounded-lg transition-all duration-200 text-sm px-3 py-2">Summary</TabsTrigger>
                    <TabsTrigger value="experience" className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 font-medium rounded-lg transition-all duration-200 text-sm px-3 py-2">Experience</TabsTrigger>
                    <TabsTrigger value="education" className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 font-medium rounded-lg transition-all duration-200 text-sm px-3 py-2">Education</TabsTrigger>
                    <TabsTrigger value="skills" className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600 font-medium rounded-lg transition-all duration-200 text-sm px-3 py-2">Skills</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-6">
                    <Card className="p-6 rounded-xl shadow-sm border border-slate-200 bg-white">
                      <div className="space-y-5">
                        <div>
                          <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700 mb-2 block">Full Name</Label>
                          <Input
                            id="fullName"
                            name="fullName"
                            value={formData.personalInfo.fullName}
                            onChange={handlePersonalInfoChange}
                            placeholder="e.g., John Smith"
                            onFocus={handleInputFocus('personal')}
                            className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg h-11"
                          />
                        </div>
                        <div>
                          <Label htmlFor="jobTitle" className="text-sm font-semibold text-slate-700 mb-2 block">Job Title</Label>
                          <Input
                            id="jobTitle"
                            name="jobTitle"
                            value={formData.personalInfo.jobTitle}
                            onChange={handlePersonalInfoChange}
                            placeholder="e.g., Senior Financial Analyst"
                            onFocus={handleInputFocus('personal')}
                            className="border-slate-300 focus:border-blue-600 focus:ring-blue-600 rounded-lg h-11"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-sm font-semibold text-slate-700 mb-2 block">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.personalInfo.email}
                            onChange={handlePersonalInfoChange}
                            placeholder="e.g., john.smith@email.com"
                            onFocus={handleInputFocus('personal')}
                            className="border-slate-300 focus:border-blue-600 focus:ring-blue-600 rounded-lg h-11"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-sm font-semibold text-slate-700 mb-2 block">Phone</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.personalInfo.phone}
                            onChange={handlePersonalInfoChange}
                            placeholder="e.g., +27 11 123 4567"
                            onFocus={handleInputFocus('personal')}
                            className="border-slate-300 focus:border-blue-600 focus:ring-blue-600 rounded-lg h-11"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location" className="text-sm font-semibold text-slate-700 mb-2 block">Location</Label>
                          <Input
                            id="location"
                            name="location"
                            value={formData.personalInfo.location}
                            onChange={handlePersonalInfoChange}
                            placeholder="e.g., Johannesburg, SA"
                            onFocus={handleInputFocus('personal')}
                            className="border-slate-300 focus:border-blue-600 focus:ring-blue-600 rounded-lg h-11"
                          />
                        </div>
                        <div>
                          <Label htmlFor="idNumber">ID Number (Optional)</Label>
                          <Input
                            id="idNumber"
                            name="idNumber"
                            value={formData.personalInfo.idNumber || ''}
                            onChange={handlePersonalInfoChange}
                            placeholder="e.g., 8001015009087"
                            onFocus={handleInputFocus('personal')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="linkedIn">LinkedIn (Optional)</Label>
                          <Input
                            id="linkedIn"
                            name="linkedIn"
                            value={formData.personalInfo.linkedIn || ''}
                            onChange={handlePersonalInfoChange}
                            placeholder="e.g., linkedin.com/in/yourprofile"
                            onFocus={handleInputFocus('personal')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="professionalRegistration">Professional Registration (Optional)</Label>
                          <Input
                            id="professionalRegistration"
                            name="professionalRegistration"
                            value={formData.personalInfo.professionalRegistration || ''}
                            onChange={handlePersonalInfoChange}
                            placeholder="e.g., ECSA, SAICA, HPCSA"
                            onFocus={handleInputFocus('personal')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="languages">Languages (Optional)</Label>
                          <Input
                            id="languages"
                            name="languages"
                            value={formData.personalInfo.languages ? formData.personalInfo.languages.join(', ') : ''}
                            onChange={(e) => {
                              const languagesArray = e.target.value.split(',').map(lang => lang.trim()).filter(Boolean);
                              setFormData({
                                ...formData,
                                personalInfo: {
                                  ...formData.personalInfo,
                                  languages: languagesArray,
                                },
                              });
                            }}
                            placeholder="e.g., English, Zulu, Afrikaans (comma separated)"
                            onFocus={handleInputFocus('personal')}
                          />
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="summary" className="space-y-6">
                    <Card className="p-6 rounded-xl shadow-sm border border-slate-200 bg-white">
                      <div className="space-y-5">
                        <div>
                          <Label htmlFor="summary" className="text-sm font-semibold text-slate-700 mb-2 block">Professional Summary</Label>
                          <Textarea
                            id="summary"
                            value={formData.summary}
                            onChange={handleSummaryChange}
                            placeholder="Write a brief summary of your professional background and key qualifications..."
                            className="min-h-[150px] border-slate-300 focus:border-blue-600 focus:ring-blue-600 rounded-lg"
                            onFocus={handleInputFocus('summary')}
                          />
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="experience" className="space-y-6">
                    {formData.experience.map((exp, index) => (
                      <Card key={index} className="p-6 rounded-xl shadow-sm border border-slate-200 bg-white">
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
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`isLearnership-${index}`}
                                name="isLearnership"
                                checked={exp.isLearnership || false}
                                onChange={(e) => {
                                  const updatedExperience = [...formData.experience];
                                  updatedExperience[index] = {
                                    ...updatedExperience[index],
                                    isLearnership: e.target.checked,
                                  };
                                  setFormData({
                                    ...formData,
                                    experience: updatedExperience,
                                  });
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                                onFocus={handleInputFocus(`experience-${index}`)}
                              />
                              <Label htmlFor={`isLearnership-${index}`} className="text-sm font-normal">
                                This is a Learnership
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`isInternship-${index}`}
                                name="isInternship"
                                checked={exp.isInternship || false}
                                onChange={(e) => {
                                  const updatedExperience = [...formData.experience];
                                  updatedExperience[index] = {
                                    ...updatedExperience[index],
                                    isInternship: e.target.checked,
                                  };
                                  setFormData({
                                    ...formData,
                                    experience: updatedExperience,
                                  });
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                                onFocus={handleInputFocus(`experience-${index}`)}
                              />
                              <Label htmlFor={`isInternship-${index}`} className="text-sm font-normal">
                                This is an Internship
                              </Label>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Button variant="outline" onClick={addExperience} className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 rounded-lg py-3 font-medium transition-all duration-200">
                      Add Another Experience
                    </Button>
                  </TabsContent>

                  <TabsContent value="education" className="space-y-6">
                    {formData.education.map((edu, index) => (
                      <Card key={index} className="p-6 rounded-xl shadow-sm border border-slate-200 bg-white">
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
                          <div>
                            <Label htmlFor={`nqfLevel-${index}`}>NQF Level (Optional)</Label>
                            <Input
                              id={`nqfLevel-${index}`}
                              name="nqfLevel"
                              type="number"
                              min="1"
                              max="10"
                              value={edu.nqfLevel || ''}
                              onChange={(e) => {
                                const updatedEducation = [...formData.education];
                                updatedEducation[index] = {
                                  ...updatedEducation[index],
                                  nqfLevel: e.target.value ? parseInt(e.target.value) : undefined,
                                };
                                setFormData({
                                  ...formData,
                                  education: updatedEducation,
                                });
                              }}
                              placeholder="e.g., 7"
                              onFocus={handleInputFocus(`education-${index}`)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`saqa-${index}`}>SAQA ID (Optional)</Label>
                            <Input
                              id={`saqa-${index}`}
                              name="saqa"
                              value={edu.saqa || ''}
                              onChange={(e) => {
                                const updatedEducation = [...formData.education];
                                updatedEducation[index] = {
                                  ...updatedEducation[index],
                                  saqa: e.target.value,
                                };
                                setFormData({
                                  ...formData,
                                  education: updatedEducation,
                                });
                              }}
                              placeholder="e.g., 62116"
                              onFocus={handleInputFocus(`education-${index}`)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`internationalEquivalence-${index}`}>International Equivalence (Optional)</Label>
                            <Input
                              id={`internationalEquivalence-${index}`}
                              name="internationalEquivalence"
                              value={edu.internationalEquivalence || ''}
                              onChange={(e) => {
                                const updatedEducation = [...formData.education];
                                updatedEducation[index] = {
                                  ...updatedEducation[index],
                                  internationalEquivalence: e.target.value,
                                };
                                setFormData({
                                  ...formData,
                                  education: updatedEducation,
                                });
                              }}
                              placeholder="e.g., Bachelor's Degree (UK)"
                              onFocus={handleInputFocus(`education-${index}`)}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Button variant="outline" onClick={addEducation} className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 rounded-lg py-3 font-medium transition-all duration-200">
                      Add Another Education
                    </Button>
                  </TabsContent>

                  <TabsContent value="skills" className="space-y-6">
                    <Card className="p-6 rounded-xl shadow-sm border border-slate-200 bg-white">
                      <div className="space-y-5">
                        <div>
                          <Label htmlFor="skills" className="text-sm font-semibold text-slate-700 mb-2 block">Skills</Label>
                          <Textarea
                            id="skills"
                            value={formData.skills}
                            onChange={handleSkillsChange}
                            placeholder="List your skills, separated by commas (e.g., Excel, SQL, Python, Financial Modeling)"
                            className="min-h-[150px] border-slate-300 focus:border-blue-600 focus:ring-blue-600 rounded-lg"
                            onFocus={handleInputFocus('skills')}
                          />
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
                <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
                  <Button 
                    variant="outline" 
                    onClick={handlePreviousSection} 
                    disabled={sections.indexOf(activeSection) === 0}
                    className="flex items-center justify-center border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 rounded-lg px-6 py-3 font-medium transition-all duration-200 w-full sm:w-auto"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button 
                    onClick={handleNextSection} 
                    disabled={sections.indexOf(activeSection) === sections.length - 1}
                    className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 rounded-lg px-6 py-3 font-medium transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>


        </div>
      </div>
    </div>
  </div>
  

    </>
  )
}
