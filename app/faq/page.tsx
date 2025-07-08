import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function FAQPage() {
  const faqs = [
    {
      question: "How do I create a CV?",
      answer: "Simply choose a template, fill in your information, and download your professional CV as a PDF."
    },
    {
      question: "Are the templates ATS-friendly?",
      answer: "Yes, all our templates are designed to pass Applicant Tracking Systems (ATS) used by employers."
    },
    {
      question: "Can I edit my CV after creating it?",
      answer: "Yes, you can save your CV and edit it anytime. Your progress is automatically saved."
    },
    {
      question: "What file formats are supported?",
      answer: "You can download your CV as PDF or Word document. We also support uploading existing CVs in PDF, DOCX, or TXT format."
    },
    {
      question: "How does job matching work?",
      answer: "Our system analyzes your CV and matches you with relevant job opportunities based on your skills and experience."
    },
    {
      question: "Is CVKonnekt free to use?",
      answer: "We offer both free and premium plans. The free version includes basic templates and features, while premium plans offer advanced tools and unlimited access."
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Frequently Asked Questions"
        description="Find answers to common questions about CVKonnekt and our services."
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <p className="text-sm text-gray-500">
            Contact us at <a href="mailto:support@cvkonnekt.com" className="text-blue-600 hover:underline">support@cvkonnekt.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}