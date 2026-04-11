"use client"
import React, { useState, useEffect } from "react"
import {
 Maximize2,
 ArrowLeft,
 Download,
 Save,
 AlertCircle,
 ChevronLeft,
 ChevronRight,
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
import { getUserProfile, createOrUpdateUserProfile, saveCV, getSavedCVs, updateCV } from "@/lib/user-data-service"
import { useAuth } from "@/contexts/auth-context"
import { trackCVInteraction } from '@/lib/analytics-service'
import { parseCV } from "@/lib/cv-parser"
import { CVUploadLoader, CVParsingLoader, SuccessAnimation, ErrorAnimation } from "@/components/loading-animations"

import { ErrorBoundary } from "@/components/error-boundary"

export default function CreateCVPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const templateId = searchParams.get("template") || "1"
  const editId = searchParams.get("edit")

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
    "12": { type: "compact", name: "Compact One-Page" },
    "13": { type: "chronological", name: "Chronological" },
    "14": { type: "functional", name: "Functional / Skills-First" },
    "15": { type: "sidebar", name: "Sidebar" },
    "16": { type: "matric", name: "Matric / School Leaver" },
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
    customSections: [] as {id: string, title: string, content: string}[],
  })

  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingCVId, setEditingCVId] = useState<string | null>(editId)
  const { user, isConfigured } = useAuth()

  // Load user profile or existing CV on mount
  useEffect(() => {
    const loadData = async () => {
      if (!isConfigured || !user) {
        const savedData = localStorage.getItem('cv-draft')
        if (savedData) {
          try { setFormData(JSON.parse(savedData)) } catch (e) {}
        }
        return
      }

      setIsLoadingProfile(true)

      // If editing an existing CV, load it from Supabase
      if (editId) {
        const { data: cvs } = await getSavedCVs()
        const cv = cvs?.find((c: any) => c.id === editId)
        if (cv) {
          setFormData(cv.cv_data)
          const tmpl = Object.values(templateMap).find(t => t.type === cv.template_type)
          if (tmpl) setSelectedTemplate(tmpl)
          setIsLoadingProfile(false)
          return
        }
      }

      // Otherwise load profile defaults
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
    loadData()
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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [parseStep, setParseStep] = useState<'uploading' | 'parsing' | 'complete' | 'error'>('complete')
  const [isDragActive, setIsDragActive] = useState(false)


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
      router.push(`/login?redirect=create&message=Please sign in to save your CV&template=${templateId}`)
      return
    }

    const cvName = `${formData.personalInfo.fullName || "My CV"} - ${selectedTemplate.name}`
    setIsSaving(true)

    if (editingCVId) {
      // Update existing CV in Supabase
      const { error } = await updateCV(editingCVId, {
        name: cvName,
        template_type: selectedTemplate.type,
        template_name: selectedTemplate.name,
        cv_data: formData as CVData,
      })
      if (error) { setError("Failed to update CV"); setIsSaving(false); return }
    } else {
      // Create new CV
      const { data: savedCV, error } = await saveCV({
        name: cvName,
        template_type: selectedTemplate.type,
        template_name: selectedTemplate.name,
        cv_data: formData as CVData,
      })
      if (error) { setError("Failed to save CV"); setIsSaving(false); return }
      if (savedCV?.id) await trackCVInteraction(savedCV.id, 'view')
    }

    await handleSaveProfile()
    setSuccess("CV saved successfully!")
    setTimeout(() => router.push("/profile/cvs"), 1000)
    setIsSaving(false)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParseStep('uploading');
    setParseError(null);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      setParseStep('parsing');
      setUploadProgress(100);
      
      const response = await fetch('/api/parse-cv', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('CV parsing failed:', errorData);
        throw new Error(errorData.error || `API request failed: ${response.status}`);
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
            idNumber: result.data.personalInfo?.idNumber || "",
            linkedIn: result.data.personalInfo?.linkedIn || "",
            professionalRegistration: result.data.personalInfo?.professionalRegistration || "",
            languages: result.data.personalInfo?.languages || [],
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
        setParseStep('complete');
        setTimeout(() => setParseStep('complete'), 2000);
      } else {
        setParseError(result.error || "Failed to parse CV. Please enter your details manually.");
        setParseStep('error');
      }
    } catch (err) {
      console.error("Error parsing CV:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setParseError(`Failed to parse CV: ${errorMessage}. Please try a different file format or enter your details manually.`);
      setParseStep('error');
    }
  }

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    setError(null)

    try {
      const pdfBlob = await generateCVPDF(selectedTemplate.type, formData as CVData, selectedTemplate.name, !!user)
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
    <ErrorBoundary>
    <>
      <div className="min-h-screen bg-gray-50">

        {/* ── Step header bar — matches templates page ── */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="container mx-auto max-w-7xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/templates">
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 -ml-2">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">Step 2</span>
              <h1 className="text-base font-semibold text-gray-800">Build Your CV</h1>
              <p className="text-sm text-gray-500 hidden sm:block">
                {editingCVId ? 'Editing' : 'Using'} <span className="font-medium text-gray-700">{selectedTemplate.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isConfigured && user ? (
                <Button variant="outline" size="sm" onClick={handleSaveCV} disabled={isSaving || isLoadingProfile} className="border-gray-200 text-gray-700 hover:bg-gray-50">
                  <Save className="h-4 w-4 mr-1.5" />
                  {isSaving ? "Saving..." : "Save CV"}
                </Button>
              ) : (
                <WorkingSaveButton cvData={formData as CVData} className="border-gray-200 text-gray-700 hover:bg-gray-50" />
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">
                    <Brain className="h-4 w-4 mr-1.5" />
                    ATS Score
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>ATS Compatibility Analysis</DialogTitle>
                    <DialogDescription>See how well your CV performs with Applicant Tracking Systems</DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto flex-1 pr-1">
                    <WorkingATSScore cvData={formData as CVData} />
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onClick={handleDownloadPDFWithTracking}
                disabled={isGeneratingPDF || isLoadingProfile}
              >
                <Download className="h-4 w-4 mr-1.5" />
                {isGeneratingPDF ? "Generating..." : "Download PDF"}
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {error && (
            <Alert className="mb-4 border-red-300 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 border-green-300 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-6 items-start">

            {/* ── LEFT COLUMN — form ── */}
            <div className="flex-1 min-w-0">

          {isLoadingProfile && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading your profile...</p>
            </div>
          )}

          {!isLoadingProfile && (
            <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-800">CV Completion</h2>
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">{Math.round(getProgress())}% Complete</span>
                  </div>
                  <Progress value={getProgress()} className="h-2 bg-gray-100" />
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-800">Upload Existing CV</h2>
                    <span className="text-xs text-gray-400">PDF, DOCX, TXT ≤10MB</span>
                  </div>
                  
                  {parseStep === 'uploading' && <CVUploadLoader progress={uploadProgress} />}
                  {parseStep === 'parsing' && <CVParsingLoader />}
                  {parseStep === 'complete' && parseError === null && formData.personalInfo.fullName && (
                    <SuccessAnimation message="CV parsed successfully! Fields have been auto-filled." />
                  )}
                  {parseStep === 'error' && <ErrorAnimation message={parseError || 'Upload failed'} />}
                  
                  {(parseStep === 'complete' || parseStep === 'error') && (
                    <>
                      <Input 
                        ref={(el) => {
                          if (el) {
                            el.style.display = 'none';
                          }
                        }}
                        type="file" 
                        id="cv-upload"
                        accept=".pdf,.docx,.txt" 
                        onChange={handleFileUpload} 
                        className="hidden"
                      />
                      <div 
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                          isDragActive 
                            ? 'border-green-500 bg-green-50 shadow-2xl ring-4 ring-green-200/50 scale-[1.02]' 
                            : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                        onClick={() => {
                          const input = document.getElementById('cv-upload') as HTMLInputElement;
                          if (input) input.click();
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDragActive(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDragActive(false);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                          setIsDragActive(true);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragActive(false);
                          const files = Array.from(e.dataTransfer.files);
                          if (files.length > 0) {
                            const file = files[0];
                            if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.txt')) && file.size <= 10 * 1024 * 1024) {
                              const event = { target: { files: [file] as unknown as FileList } } as React.ChangeEvent<HTMLInputElement>;
                              handleFileUpload(event);
                            }
                          }
                        }}
                      >
                        <p className="text-slate-600 font-medium">{parseStep === 'uploading' || parseStep === 'parsing' ? 'Uploading...' : 'Drag and drop your CV here'}</p>
                        <p className="text-xs text-slate-500 mt-1">or click to browse files (PDF, DOCX, TXT ≤10MB)</p>
                      </div>
                    </>
                  )}
                </div>
                <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
                  <TabsList className="mb-4 w-full flex bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger value="personal" className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 font-medium rounded-lg text-sm px-3 py-2">Personal</TabsTrigger>
                    <TabsTrigger value="summary" className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 font-medium rounded-lg text-sm px-3 py-2">Summary</TabsTrigger>
                    <TabsTrigger value="experience" className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 font-medium rounded-lg text-sm px-3 py-2">Experience</TabsTrigger>
                    <TabsTrigger value="education" className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 font-medium rounded-lg text-sm px-3 py-2">Education</TabsTrigger>
                    <TabsTrigger value="skills" className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 font-medium rounded-lg text-sm px-3 py-2">Skills</TabsTrigger>
                    <TabsTrigger value="extra" className="flex-1 min-w-0 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 font-medium rounded-lg text-sm px-3 py-2">+ More</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    <Card className="p-5 rounded-xl border border-gray-200 bg-white shadow-none">
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

                  <TabsContent value="summary" className="space-y-4">
                    <Card className="p-5 rounded-xl border border-gray-200 bg-white shadow-none">
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

                  <TabsContent value="experience" className="space-y-4">
                    {formData.experience.map((exp, index) => (
                      <Card key={index} className="p-5 rounded-xl border border-gray-200 bg-white shadow-none">
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
                    <Button variant="outline" onClick={addExperience} className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg py-2.5 font-medium">
                      Add Another Experience
                    </Button>
                  </TabsContent>

                  <TabsContent value="education" className="space-y-4">
                    {formData.education.map((edu, index) => (
                      <Card key={index} className="p-5 rounded-xl border border-gray-200 bg-white shadow-none">
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
                    <Button variant="outline" onClick={addEducation} className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg py-2.5 font-medium">
                      Add Another Education
                    </Button>
                  </TabsContent>

                  <TabsContent value="skills" className="space-y-4">
                    <Card className="p-5 rounded-xl border border-gray-200 bg-white shadow-none">
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

                  <TabsContent value="extra" className="space-y-4">
                    <Card className="p-5 rounded-xl border border-gray-200 bg-white shadow-none">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">Custom Sections</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Add sections like Certifications, Volunteer Work, Awards, References, etc.</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            customSections: [...(prev.customSections || []), { id: Date.now().toString(), title: '', content: '' }]
                          }))}
                        >
                          + Add Section
                        </Button>
                      </div>
                      {(formData.customSections || []).length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-6">No custom sections yet. Click "+ Add Section" to add one.</p>
                      )}
                      <div className="space-y-4">
                        {(formData.customSections || []).map((section, index) => (
                          <div key={section.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Section title (e.g. Certifications, Awards)"
                                value={section.title}
                                onChange={e => {
                                  const updated = [...(formData.customSections || [])]
                                  updated[index] = { ...updated[index], title: e.target.value }
                                  setFormData(prev => ({ ...prev, customSections: updated }))
                                }}
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-600"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  customSections: (prev.customSections || []).filter((_, i) => i !== index)
                                }))}
                              >
                                Remove
                              </Button>
                            </div>
                            <Textarea
                              placeholder="Section content..."
                              value={section.content}
                              onChange={e => {
                                const updated = [...(formData.customSections || [])]
                                updated[index] = { ...updated[index], content: e.target.value }
                                setFormData(prev => ({ ...prev, customSections: updated }))
                              }}
                              className="min-h-[80px]"
                            />
                          </div>
                        ))}
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
                <div className="flex justify-between gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={handlePreviousSection}
                    disabled={sections.indexOf(activeSection) === 0}
                    className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg px-5 font-medium"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button
                    onClick={handleNextSection}
                    disabled={sections.indexOf(activeSection) === sections.length - 1}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 font-medium"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
            </div>
          )}
        </div>

            {/* ── RIGHT COLUMN — sticky live preview ── */}
            <div className="w-80 xl:w-96 flex-shrink-0 sticky top-6 self-start">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 pt-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                  <p className="font-semibold text-gray-900 text-sm">Live Preview</p>
                  <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 h-7 px-2">
                        <Maximize2 className="h-3.5 w-3.5 mr-1" /> Fullscreen
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                      <DialogHeader><DialogTitle>CV Preview</DialogTitle></DialogHeader>
                      <div className="mt-4"><CVPreview template={selectedTemplate.type} userData={formData} /></div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="p-3 bg-gray-50 h-[520px] overflow-hidden">
                  <div className="w-full h-full overflow-hidden rounded scale-[0.9] origin-top">
                    <CVPreview template={selectedTemplate.type} userData={formData} className="w-full h-full" />
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-700">{selectedTemplate.name}</p>
                    <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">{Math.round(getProgress())}% complete</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${getProgress()}%` }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
    </ErrorBoundary>
  )
}
