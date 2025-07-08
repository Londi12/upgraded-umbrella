"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Download, Eye, Save, AlertCircle, Edit3 } from "lucide-react"
import Link from "next/link"
import { generateCoverLetterPDF, downloadBlob } from "@/lib/pdf-utils"
import type { CoverLetterData } from "@/types/cv-types"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CoverLetterPreview } from "@/components/cover-letter-preview"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CreateCoverLetterPage() {
  const searchParams = useSearchParams()
  const templateId = searchParams.get("template") || "1"

  // Map template IDs to template types
  const templateMap: Record<string, any> = {
    "1": { type: "professional", name: "Corporate Professional" },
    "2": { type: "modern", name: "Modern Minimalist" },
    "3": { type: "creative", name: "Creative Design" },
    "4": { type: "simple", name: "Simple Clean" },
    "5": { type: "executive", name: "Executive Elite" },
    "6": { type: "technical", name: "Technical Expert" },
  }

  const selectedTemplate = templateMap[templateId] || templateMap["1"]

  // Form state
  const [formData, setFormData] = useState({
    personalInfo: {
      fullName: "",
      jobTitle: "",
      email: "",
      phone: "",
    },
    recipientInfo: {
      name: "",
      title: "",
      company: "",
      address: "",
    },
    letterContent: {
      date: "",
      greeting: "",
      opening: "",
      body: "",
      closing: "",
      signature: "",
    },
  })

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form')

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

  const handleRecipientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      recipientInfo: {
        ...formData.recipientInfo,
        [name]: value,
      },
    })
  }

  const handleLetterContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      letterContent: {
        ...formData.letterContent,
        [name]: value,
      },
    })
  }

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    setError(null)

    try {
      const pdfBlob = await generateCoverLetterPDF(
        selectedTemplate.type,
        formData as CoverLetterData,
        selectedTemplate.name,
      )

      const fileName = `${formData.personalInfo.fullName || "Cover_Letter"}_${selectedTemplate.name}.pdf`
      downloadBlob(pdfBlob, fileName)
    } catch (error) {
      console.error("Error generating PDF:", error)
      setError(error instanceof Error ? error.message : "Failed to generate PDF. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 border-b border-purple-700 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/cover-letter-templates">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-purple-200">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Templates
                </Button>
              </Link>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-white">
                  Cover Letter Builder
                </h1>
                <p className="text-purple-200 text-sm">
                  Creating with <span className="text-purple-100 font-semibold">{selectedTemplate.name}</span> template
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Button variant="outline" size="sm" className="border-purple-400 text-purple-200 hover:bg-purple-800 hover:text-white flex-1 lg:flex-none">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                className="bg-white text-purple-600 hover:bg-purple-100 font-semibold flex-1 lg:flex-none"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? "Generating..." : "Download PDF"}
              </Button>
            </div>
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

        {/* Mobile Toggle */}
        <div className="block lg:hidden mb-6">
          <div className="flex space-x-1 bg-purple-100 p-1 rounded-xl shadow-sm">
            <Button
              variant="ghost"
              className={`flex-1 rounded-lg transition-all duration-200 font-medium ${activeTab === 'form' ? 'bg-white shadow-sm text-purple-900 font-semibold' : 'text-purple-600 hover:text-purple-900 hover:bg-white/50'}`}
              onClick={() => setActiveTab('form')}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Letter
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 rounded-lg transition-all duration-200 font-medium ${activeTab === 'preview' ? 'bg-white shadow-sm text-purple-900 font-semibold' : 'text-purple-600 hover:text-purple-900 hover:bg-white/50'}`}
              onClick={() => setActiveTab('preview')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className={`${activeTab === 'preview' ? 'hidden lg:block' : ''}`}>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="mb-4 w-full bg-purple-100 p-1">
                <TabsTrigger value="personal" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-purple-600 text-purple-700 font-medium">Your Info</TabsTrigger>
                <TabsTrigger value="recipient" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-purple-600 text-purple-700 font-medium">Recipient</TabsTrigger>
                <TabsTrigger value="content" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-purple-600 text-purple-700 font-medium">Content</TabsTrigger>
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
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="recipient" className="space-y-4">
                <Card className="p-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="recipientName">Recipient Name</Label>
                      <Input
                        id="recipientName"
                        name="name"
                        value={formData.recipientInfo.name}
                        onChange={handleRecipientInfoChange}
                        placeholder="e.g., Jane Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="recipientTitle">Recipient Title</Label>
                      <Input
                        id="recipientTitle"
                        name="title"
                        value={formData.recipientInfo.title}
                        onChange={handleRecipientInfoChange}
                        placeholder="e.g., Hiring Manager"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.recipientInfo.company}
                        onChange={handleRecipientInfoChange}
                        placeholder="e.g., ABC Company"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.recipientInfo.address}
                        onChange={handleRecipientInfoChange}
                        placeholder="e.g., Johannesburg, SA"
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <Card className="p-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        name="date"
                        value={formData.letterContent.date}
                        onChange={handleLetterContentChange}
                        placeholder="e.g., 15 December 2024"
                      />
                    </div>
                    <div>
                      <Label htmlFor="greeting">Greeting</Label>
                      <Input
                        id="greeting"
                        name="greeting"
                        value={formData.letterContent.greeting}
                        onChange={handleLetterContentChange}
                        placeholder="e.g., Dear Ms. Doe,"
                      />
                    </div>
                    <div>
                      <Label htmlFor="opening">Opening Paragraph</Label>
                      <Textarea
                        id="opening"
                        name="opening"
                        value={formData.letterContent.opening}
                        onChange={handleLetterContentChange}
                        placeholder="Introduce yourself and state the position you're applying for..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="body">Body Paragraphs</Label>
                      <Textarea
                        id="body"
                        name="body"
                        value={formData.letterContent.body}
                        onChange={handleLetterContentChange}
                        placeholder="Explain why you're a good fit for the position and highlight relevant experience..."
                        className="min-h-[150px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="closing">Closing Paragraph</Label>
                      <Textarea
                        id="closing"
                        name="closing"
                        value={formData.letterContent.closing}
                        onChange={handleLetterContentChange}
                        placeholder="Thank the recipient for their consideration and express interest in next steps..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signature">Signature</Label>
                      <Input
                        id="signature"
                        name="signature"
                        value={formData.letterContent.signature}
                        onChange={handleLetterContentChange}
                        placeholder="e.g., Sincerely,"
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Section */}
          <div className={`${activeTab === 'form' ? 'hidden lg:block' : ''} lg:sticky lg:top-20`}>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Cover Letter Preview</h2>
              <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                <Eye className="h-4 w-4 mr-2" />
                Full Preview
              </Button>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-gray-50" id="cover-letter-preview">
              <div className="aspect-[1/1.414] overflow-auto p-4">
                <CoverLetterPreview template={selectedTemplate.type} className="w-full h-full" userData={formData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
