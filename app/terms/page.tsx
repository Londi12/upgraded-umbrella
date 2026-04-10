export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-gray-500 mb-10">Last updated: April 2025</p>

      <div className="space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. About CVKonnekt</h2>
          <p>CVKonnekt is a free South African career platform that helps job seekers build professional CVs, search for jobs, and track applications. By using CVKonnekt, you agree to these Terms of Service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Who Can Use CVKonnekt</h2>
          <p>You must be at least 16 years old to use CVKonnekt. By creating an account, you confirm that the information you provide is accurate and that you are using the platform for lawful purposes.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Your Account</h2>
          <p>You are responsible for keeping your account credentials secure. CVKonnekt will never ask for your password via email. If you suspect unauthorised access to your account, contact us immediately at <a href="mailto:info@cvkonnekt.com" className="text-blue-600 underline">info@cvkonnekt.com</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Your Content</h2>
          <p>You own the CV data and personal information you enter on CVKonnekt. By using the platform, you grant CVKonnekt a limited licence to store and process your data solely to provide the service to you. We do not sell your CV data or personal information to third parties.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Acceptable Use</h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use CVKonnekt for any unlawful purpose</li>
            <li>Upload false, misleading, or fraudulent information</li>
            <li>Attempt to access other users' accounts or data</li>
            <li>Scrape, copy, or redistribute job listings or platform content without permission</li>
            <li>Use automated tools to access the platform without prior written consent</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Job Listings</h2>
          <p>CVKonnekt aggregates job listings from publicly available sources. We do not guarantee the accuracy, availability, or legitimacy of any job listing. Always verify opportunities directly with the employer before sharing sensitive personal information or making payments.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Free Service & Donations</h2>
          <p>CVKonnekt is free to use. We accept voluntary donations to help cover running costs. Donations are non-refundable and do not entitle you to any additional services or guarantees.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Disclaimer of Warranties</h2>
          <p>CVKonnekt is provided "as is" without warranties of any kind. We do not guarantee that the platform will be available at all times, error-free, or that using it will result in employment. We are not responsible for decisions made by employers based on CVs created using our platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by South African law, CVKonnekt shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. Continued use of CVKonnekt after changes are posted means you accept the updated Terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Governing Law</h2>
          <p>These Terms are governed by the laws of the Republic of South Africa. Any disputes will be subject to the jurisdiction of South African courts.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact</h2>
          <p>For any questions about these Terms, contact us at <a href="mailto:info@cvkonnekt.com" className="text-blue-600 underline">info@cvkonnekt.com</a>.</p>
        </section>

      </div>
    </div>
  )
}
