"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Download, Eye, Save, AlertCircle } from "lucide-react"
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
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/cover-letter-templates">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Templates
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">
              Creating Cover Letter with <span className="text-emerald-600">{selectedTemplate.name}</span> template
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="personal">Your Info</TabsTrigger>
                <TabsTrigger value="recipient">Recipient</TabsTrigger>
                <TabsTrigger value="content">Letter Content</TabsTrigger>
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
          <div className="sticky top-20">
            <div className="bg-white border rounded-lg p-4 mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Preview</h2>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Full Preview
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden" id="cover-letter-preview">
              <div className="aspect-[1/1.414] overflow-auto">
                <CoverLetterPreview template={selectedTemplate.type} className="w-full h-full" userData={formData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
