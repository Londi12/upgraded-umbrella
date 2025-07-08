"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Download, Eye, Brain, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CVPreview } from "@/components/cv-preview"
import { PageHeader } from "@/components/ui/page-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ATSScoringPanel } from "@/components/cv-ats-scoring"
import { useAuth } from "@/contexts/auth-context"
import { saveCV } from "@/lib/user-data-service"
import { generateCVPDF, downloadBlob } from "@/lib/pdf-utils"
import type { CVData } from "@/types/cv-types"

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

function BuildPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isConfigured } = useAuth()
  const templateId = searchParams.get("template") || "1"
  const selectedTemplate = templateMap[templateId] || templateMap["1"]

  const [formData, setFormData] = useState({
    personalInfo: {
      fullName: "",
      jobTitle: "",
      email: "",
      phone: "",
      location: "",
    },
    summary: "",
    experience: [{ title: "", company: "", startDate: "", endDate: "", description: "" }],
    education: [{ degree: "", institution: "", graduationDate: "" }],
    skills: "",
  })

  const [activeSection, setActiveSection] = useState("personal")
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState("")

  const sections = ["personal", "summary", "experience", "education", "skills"]

  const getProgress = () => {
    let completed = 0
    if (formData.personalInfo.fullName && formData.personalInfo.jobTitle) completed++
    if (formData.summary) completed++
    if (formData.experience[0].title) completed++
    if (formData.education[0].degree) completed++
    if (formData.skills) completed++
    return (completed / 5) * 100
  }

  const handleSave = async () => {
    if (!isConfigured || !user) {
      router.push("/login?redirect=build&message=Please sign in to save your CV")
      return
    }

    setIsSaving(true)
    const cvName = `${formData.personalInfo.fullName || "My CV"} - ${selectedTemplate.name}`
    
    const { error } = await saveCV({
      name: cvName,
      template_type: selectedTemplate.type,
      template_name: selectedTemplate.name,
      cv_data: formData as CVData,
    })

    if (!error) {
      setSuccess("CV saved successfully!")
      setTimeout(() => setSuccess(""), 3000)
    }
    setIsSaving(false)
  }

  const handleDownload = async () => {
    const pdfBlob = await generateCVPDF(selectedTemplate.type, formData as CVData, selectedTemplate.name)
    const fileName = `${formData.personalInfo.fullName || "CV"}_${selectedTemplate.name}.pdf`
    downloadBlob(pdfBlob, fileName)
  }

  const handleNext = () => {
    const currentIndex = sections.indexOf(activeSection)
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1])
    } else {
      // All sections completed, go to job matching
      router.push("/jobs")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Step 2: Build Your CV"
        description="Fill in your information to create a professional CV. Your progress is automatically saved."
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/templates">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Change Template
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>CV Preview</DialogTitle>
                  </DialogHeader>
                  <CVPreview template={selectedTemplate.type} userData={formData} />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Brain className="h-4 w-4 mr-2" />
                    ATS Score
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>ATS Score Analysis</DialogTitle>
                  </DialogHeader>
                  <ATSScoringPanel cvData={formData as CVData} currentSection={activeSection} />
                </DialogContent>
              </Dialog>

              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save CV"}
              </Button>

              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {success && (
            <Alert className="mb-6 border-green-300 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Upload CV */}
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Upload Existing CV</h2>
            <p className="text-sm text-gray-600 mb-4">Upload your existing CV to auto-fill the fields. Supported formats: PDF, DOCX, TXT.</p>
            <input 
              type="file" 
              accept=".pdf,.docx,.txt" 
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                
                const formData = new FormData()
                formData.append('file', file)
                
                try {
                  const response = await fetch('/api/parse-cv', {
                    method: 'POST',
                    body: formData,
                  })
                  
                  const result = await response.json()
                  
                  if (result.data) {
                    setFormData({
                      personalInfo: {
                        fullName: result.data.personalInfo?.fullName || "",
                        jobTitle: result.data.personalInfo?.jobTitle || "",
                        email: result.data.personalInfo?.email || "",
                        phone: result.data.personalInfo?.phone || "",
                        location: result.data.personalInfo?.location || "",
                      },
                      summary: result.data.summary || "",
                      experience: result.data.experience?.length > 0 ? 
                        result.data.experience.map(exp => ({
                          title: exp.title || "",
                          company: exp.company || "",
                          startDate: exp.startDate || "",
                          endDate: exp.endDate || "",
                          description: exp.description || ""
                        })) : formData.experience,
                      education: result.data.education?.length > 0 ? 
                        result.data.education.map(edu => ({
                          degree: edu.degree || "",
                          institution: edu.institution || "",
                          graduationDate: edu.graduationDate || ""
                        })) : formData.education,
                      skills: Array.isArray(result.data.skills) ? 
                        result.data.skills.map(s => typeof s === 'string' ? s : s.name).join(', ') : 
                        result.data.skills || "",
                    })
                    setSuccess("CV uploaded and fields auto-filled!")
                  } else {
                    setSuccess("CV uploaded but some fields couldn't be parsed. Please review and fill manually.")
                  }
                } catch (error) {
                  console.error('Upload failed:', error)
                  setSuccess("Upload failed. Please try a different file or fill manually.")
                }
              }}
              className="mb-4 border border-gray-300 rounded-md p-2 w-full"
            />
          </Card>

          {/* Progress */}
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">CV Completion Progress</h2>
              <span className="text-sm font-medium text-blue-600">{Math.round(getProgress())}% Complete</span>
            </div>
            <Progress value={getProgress()} className="h-3" />
          </Card>

          {/* Form */}
          <Tabs value={activeSection} onValueChange={setActiveSection}>
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.personalInfo.fullName}
                        onChange={(e) => setFormData({
                          ...formData,
                          personalInfo: { ...formData.personalInfo, fullName: e.target.value }
                        })}
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={formData.personalInfo.jobTitle}
                        onChange={(e) => setFormData({
                          ...formData,
                          personalInfo: { ...formData.personalInfo, jobTitle: e.target.value }
                        })}
                        placeholder="Senior Developer"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.personalInfo.email}
                        onChange={(e) => setFormData({
                          ...formData,
                          personalInfo: { ...formData.personalInfo, email: e.target.value }
                        })}
                        placeholder="john@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.personalInfo.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          personalInfo: { ...formData.personalInfo, phone: e.target.value }
                        })}
                        placeholder="+27 11 123 4567"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.personalInfo.location}
                        onChange={(e) => setFormData({
                          ...formData,
                          personalInfo: { ...formData.personalInfo, location: e.target.value }
                        })}
                        placeholder="Johannesburg, SA"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="summary">
              <Card className="p-6">
                <div>
                  <Label htmlFor="summary">Professional Summary</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Write a brief summary of your professional background..."
                    className="min-h-[150px] mt-2"
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="experience">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={formData.experience[0].title}
                        onChange={(e) => setFormData({
                          ...formData,
                          experience: [{ ...formData.experience[0], title: e.target.value }]
                        })}
                        placeholder="Senior Developer"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={formData.experience[0].company}
                        onChange={(e) => setFormData({
                          ...formData,
                          experience: [{ ...formData.experience[0], company: e.target.value }]
                        })}
                        placeholder="ABC Company"
                      />
                    </div>
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        value={formData.experience[0].startDate}
                        onChange={(e) => setFormData({
                          ...formData,
                          experience: [{ ...formData.experience[0], startDate: e.target.value }]
                        })}
                        placeholder="Jan 2020"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        value={formData.experience[0].endDate}
                        onChange={(e) => setFormData({
                          ...formData,
                          experience: [{ ...formData.experience[0], endDate: e.target.value }]
                        })}
                        placeholder="Present"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.experience[0].description}
                      onChange={(e) => setFormData({
                        ...formData,
                        experience: [{ ...formData.experience[0], description: e.target.value }]
                      })}
                      placeholder="Describe your responsibilities and achievements..."
                      className="min-h-[100px] mt-2"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="education">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="degree">Degree</Label>
                      <Input
                        id="degree"
                        value={formData.education[0].degree}
                        onChange={(e) => setFormData({
                          ...formData,
                          education: [{ ...formData.education[0], degree: e.target.value }]
                        })}
                        placeholder="Bachelor of Science"
                      />
                    </div>
                    <div>
                      <Label htmlFor="institution">Institution</Label>
                      <Input
                        id="institution"
                        value={formData.education[0].institution}
                        onChange={(e) => setFormData({
                          ...formData,
                          education: [{ ...formData.education[0], institution: e.target.value }]
                        })}
                        placeholder="University of Cape Town"
                      />
                    </div>
                    <div>
                      <Label htmlFor="graduationDate">Graduation Date</Label>
                      <Input
                        id="graduationDate"
                        value={formData.education[0].graduationDate}
                        onChange={(e) => setFormData({
                          ...formData,
                          education: [{ ...formData.education[0], graduationDate: e.target.value }]
                        })}
                        placeholder="2020"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="skills">
              <Card className="p-6">
                <div>
                  <Label htmlFor="skills">Skills</Label>
                  <Textarea
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="List your skills separated by commas (e.g., JavaScript, React, Node.js)"
                    className="min-h-[150px] mt-2"
                  />
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => {
                const currentIndex = sections.indexOf(activeSection)
                if (currentIndex > 0) {
                  setActiveSection(sections[currentIndex - 1])
                }
              }}
              disabled={sections.indexOf(activeSection) === 0}
            >
              Previous
            </Button>

            <Button onClick={handleNext}>
              {sections.indexOf(activeSection) === sections.length - 1 ? "Find Jobs" : "Next"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BuildPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <BuildPageContent />
    </Suspense>
  )
}