"use client"

import { ChevronDown, ChevronUp, FileText, Download, Users, Shield, HelpCircle } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  // General Questions
  {
    question: "What is CVKonnekt?",
    answer: "CVKonnekt is a free CV builder designed specifically for South African job seekers. We provide professional templates, cover letter tools, and instant PDF downloads to help you create compelling CVs that stand out to local employers.",
    category: "general"
  },
  {
    question: "Is CVKonnekt really free?",
    answer: "Yes, CVKonnekt is completely free to use. You can create unlimited CVs, download them as PDFs, and access all our templates without any cost. We believe everyone deserves access to professional CV tools.",
    category: "general"
  },
  {
    question: "Do I need to create an account?",
    answer: "No, you can create and download CVs without an account. However, creating an account allows you to save your CVs, access them later, and track your progress. It's completely optional.",
    category: "general"
  },

  // CV Creation
  {
    question: "How do I create my CV?",
    answer: "Simply click 'Create CV' on our homepage, choose a template that fits your industry, and fill in your details. Our step-by-step process guides you through each section. You can preview your CV in real-time and download it when ready.",
    category: "creation"
  },
  {
    question: "Can I upload my existing CV?",
    answer: "Yes! You can upload your existing CV (PDF, DOCX, or TXT) and our AI parser will automatically extract your information to pre-fill the form. This saves you time and ensures no information is lost.",
    category: "creation"
  },
  {
    question: "What templates do you offer?",
    answer: "We offer 8 professional templates: Corporate Professional, Modern Minimalist, Creative Design, Simple Clean, Executive Elite, Technical Expert, Graduate Entry, and Digital Portfolio. Each is designed for different industries and experience levels.",
    category: "creation"
  },
  {
    question: "Can I customize the templates?",
    answer: "Yes, all templates are fully customizable. You can adjust colors, fonts, spacing, and layout to match your preferences. Our templates are designed to be flexible while maintaining professional standards.",
    category: "creation"
  },

  // File Formats & Downloads
  {
    question: "What file formats can I download?",
    answer: "You can download your CV as a high-quality PDF file, which is the standard format preferred by most employers. PDFs maintain perfect formatting across all devices and applications.",
    category: "downloads"
  },
  {
    question: "Is there a limit on downloads?",
    answer: "No, you can download your CV as many times as you want. We encourage you to create multiple versions for different job applications or update your CV as your experience grows.",
    category: "downloads"
  },
  {
    question: "Can I edit my CV after downloading?",
    answer: "Yes! Your CV is saved in your account, so you can log back in anytime to make changes. Simply edit the information, preview the changes, and download the updated version.",
    category: "downloads"
  },

  // Cover Letters
  {
    question: "Do you offer cover letter templates?",
    answer: "Yes, we provide professional cover letter templates that complement our CV designs. You can create cover letters for different job types and customize them to match your CV style.",
    category: "cover-letters"
  },
  {
    question: "Are cover letters also free?",
    answer: "Absolutely! All our cover letter tools and templates are completely free, just like our CV builder. You can create and download as many cover letters as you need.",
    category: "cover-letters"
  },

  // Privacy & Security
  {
    question: "Is my information secure?",
    answer: "Yes, we take your privacy seriously. Your personal information is encrypted and stored securely. We never share your data with third parties, and you can delete your account and data at any time.",
    category: "privacy"
  },
  {
    question: "What happens to my data if I delete my account?",
    answer: "When you delete your account, all your personal information and saved CVs are permanently removed from our servers. We cannot recover this data once deleted.",
    category: "privacy"
  },

  // South Africa Specific
  {
    question: "Are your templates suitable for South African employers?",
    answer: "Yes, our templates are specifically designed with South African hiring practices in mind. They follow local conventions and are optimized for ATS (Applicant Tracking Systems) used by South African companies.",
    category: "south-africa"
  },
  {
    question: "Do you support South African phone numbers and addresses?",
    answer: "Yes, our forms are designed to accommodate South African phone numbers (+27 format) and address formats. We also support local postal codes and city names.",
    category: "south-africa"
  },

  // Technical Support
  {
    question: "What if I have trouble creating my CV?",
    answer: "Our platform is designed to be user-friendly, but if you encounter any issues, you can contact our support team. We also provide helpful tips and examples throughout the creation process.",
    category: "support"
  },
  {
    question: "Can I use CVKonnekt on my mobile device?",
    answer: "Yes, CVKonnekt is fully responsive and works great on mobile devices, tablets, and desktop computers. You can create and edit your CV from anywhere.",
    category: "support"
  },
  {
    question: "What browsers do you support?",
    answer: "We support all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using the latest version of your browser.",
    category: "support"
  }
]

const categories = [
  { id: "general", name: "General Questions", icon: HelpCircle },
  { id: "creation", name: "CV Creation", icon: FileText },
  { id: "downloads", name: "Downloads & Files", icon: Download },
  { id: "cover-letters", name: "Cover Letters", icon: FileText },
  { id: "privacy", name: "Privacy & Security", icon: Shield },
  { id: "south-africa", name: "South Africa Specific", icon: Users },
  { id: "support", name: "Technical Support", icon: HelpCircle }
]

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("general")

  const filteredFAQs = faqData.filter(faq => faq.category === activeCategory)

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-500">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Everything you need to know about creating professional CVs with CVKonnekt
          </p>
        </div>

        {/* Category Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeCategory === category.id
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* FAQ Content */}
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="px-6 py-4 text-left font-medium text-gray-900 hover:text-emerald-600">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Ready to Create Your CV?
              </CardTitle>
              <CardDescription className="text-gray-600">
                Join thousands of South Africans who are getting noticed by employers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/create">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                    Create My CV
                  </Button>
                </Link>
                <Link href="/cv-templates">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Browse Templates
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Still have questions? We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700">
              Contact Support
            </Button>
            <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700">
              View Tutorials
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 