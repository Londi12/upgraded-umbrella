import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const faqs = [
  {
    category: "General",
    items: [
      {
        question: "Is CVKonnekt free?",
        answer: "Yes, CVKonnekt is completely free to use. There are no plans, subscriptions, or hidden fees. If it's helped you, you're welcome to support us with a small donation to keep the lights on."
      },
      {
        question: "Who is CVKonnekt for?",
        answer: "CVKonnekt is built specifically for South African job seekers — from matric leavers looking for learnerships to experienced professionals. Everything is tailored for the SA job market."
      },
    ]
  },
  {
    category: "CV Builder",
    items: [
      {
        question: "How do I create a CV?",
        answer: "Go to Templates, pick a design, fill in your details, and download your CV as a PDF. You can also upload an existing CV and we'll auto-fill the fields for you."
      },
      {
        question: "Can I edit my CV after saving it?",
        answer: "Yes. Sign in, go to your profile, and you'll find all your saved CVs. Click edit on any of them to make changes."
      },
      {
        question: "What file formats can I download?",
        answer: "You can download your CV as a PDF. You can also upload existing CVs in PDF, DOCX, or TXT format to auto-fill your details."
      },
      {
        question: "Will my CV pass ATS systems?",
        answer: "All our templates are designed to be ATS-friendly. We also have a built-in ATS score checker that analyses your CV and gives you feedback before you apply."
      },
      {
        question: "Do I need to sign in to create a CV?",
        answer: "No — you can build and download a CV without signing in. However, signing in lets you save your CVs, track applications, and use Job Match."
      },
    ]
  },
  {
    category: "Job Search",
    items: [
      {
        question: "Where do the job listings come from?",
        answer: "We aggregate jobs from publicly available South African job sources. Listings are refreshed daily. Always verify opportunities directly with the employer before sharing personal information."
      },
      {
        question: "How do the filters work?",
        answer: "You can filter by job type (including Learnerships/Internships), experience level, location, and date posted. There are also quick filter chips for common searches like Remote, No experience required, and Degree not required."
      },
      {
        question: "What is Job Match?",
        answer: "Job Match compares your saved CV against a job listing and gives you a match score, highlights skills you have that match, and shows gaps you could work on. You need to be signed in and have a saved CV to use it."
      },
    ]
  },
  {
    category: "Account & Data",
    items: [
      {
        question: "How do I sign up?",
        answer: "Click Sign in at the top right and choose to create an account. You'll receive a confirmation email — click the link in it to activate your account."
      },
      {
        question: "Is my data safe?",
        answer: "Yes. Your data is stored securely using Supabase and encrypted in transit. We do not sell your personal information to anyone. See our Privacy Policy for full details."
      },
      {
        question: "Can I delete my account?",
        answer: "Yes. Contact us at info@cvkonnekt.com and we'll delete your account and all associated data within 30 days, in line with POPIA."
      },
    ]
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Frequently Asked Questions"
        description="Everything you need to know about CVKonnekt."
      />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {faqs.map((section) => (
          <div key={section.category} className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">{section.category}</h2>
            <div className="space-y-4">
              {section.items.map((faq, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        <div className="text-center mt-12 text-sm text-gray-500">
          Still have questions? Email us at{" "}
          <a href="mailto:info@cvkonnekt.com" className="text-blue-600 hover:underline">
            info@cvkonnekt.com
          </a>
        </div>
      </div>
    </div>
  )
}
