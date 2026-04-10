export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-500 mb-10">Last updated: April 2025</p>

      <div className="space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
          <p>CVKonnekt is committed to protecting your personal information in accordance with the <strong>Protection of Personal Information Act (POPIA), Act 4 of 2013</strong> of South Africa. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
          <p className="mb-2">We collect the following personal information when you use CVKonnekt:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Name, email address, and password (when you create an account)</li>
            <li>CV data: job title, work experience, education, skills, and contact details you enter</li>
            <li>Optional fields: ID number, LinkedIn profile, professional registration, languages</li>
            <li>Job application tracking data you choose to save</li>
            <li>Usage data such as pages visited and features used (for improving the platform)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide and improve the CV building, job search, and application tracking features</li>
            <li>To save and retrieve your CV data across sessions</li>
            <li>To send important account-related communications (e.g. password resets)</li>
            <li>To analyse platform usage in aggregate to improve the service</li>
          </ul>
          <p className="mt-3">We do <strong>not</strong> sell, rent, or share your personal information with third parties for marketing purposes.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. How We Store Your Data</h2>
          <p>Your data is stored securely using <strong>Supabase</strong>, a cloud database provider. Data is encrypted in transit (HTTPS) and at rest. We retain your data for as long as your account is active. If you delete your account, your personal data will be removed within 30 days.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights Under POPIA</h2>
          <p className="mb-2">As a data subject under POPIA, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Access</strong> the personal information we hold about you</li>
            <li><strong>Correct</strong> inaccurate or outdated information</li>
            <li><strong>Delete</strong> your personal information (right to be forgotten)</li>
            <li><strong>Object</strong> to the processing of your personal information</li>
            <li><strong>Withdraw consent</strong> at any time by deleting your account</li>
          </ul>
          <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:info@cvkonnekt.com" className="text-blue-600 underline">info@cvkonnekt.com</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies</h2>
          <p>CVKonnekt uses essential cookies to keep you logged in and maintain your session. We do not use advertising or tracking cookies. You can disable cookies in your browser settings, but this may affect your ability to use the platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Third-Party Services</h2>
          <p>We use the following third-party services to operate CVKonnekt:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Supabase</strong> — database and authentication</li>
            <li><strong>Vercel</strong> — hosting and deployment</li>
            <li><strong>OpenAI</strong> — AI-powered CV and job matching features (only job descriptions and CV content are sent, never your ID number or contact details)</li>
          </ul>
          <p className="mt-3">Each of these providers has their own privacy policies and data protection practices.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Children's Privacy</h2>
          <p>CVKonnekt is not intended for children under the age of 16. We do not knowingly collect personal information from anyone under 16. If you believe a minor has provided us with personal information, please contact us and we will delete it promptly.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the platform. Continued use of CVKonnekt after changes are posted constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact & Complaints</h2>
          <p>For any privacy-related questions or to lodge a complaint, contact us at <a href="mailto:info@cvkonnekt.com" className="text-blue-600 underline">info@cvkonnekt.com</a>.</p>
          <p className="mt-2">If you are not satisfied with our response, you have the right to lodge a complaint with the <strong>Information Regulator of South Africa</strong> at <a href="https://www.justice.gov.za/inforeg/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">www.justice.gov.za/inforeg</a>.</p>
        </section>

      </div>
    </div>
  )
}
