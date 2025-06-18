import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container px-4 md:px-6 py-8 mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">CVKonnekt</h3>
            <p className="text-sm text-gray-600">
              Professional CV and cover letter builder for South African job seekers. Built with ❤️ in South Africa.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">CV</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="text-gray-600 hover:text-emerald-600" href="/cv-templates">
                  CV Templates
                </Link>
              </li>
              <li>
                <Link className="text-gray-600 hover:text-emerald-600" href="/cv-examples">
                  CV Examples
                </Link>
              </li>
              <li>
                <Link className="text-gray-600 hover:text-emerald-600" href="/create">
                  CV Builder
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Cover Letter</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="text-gray-600 hover:text-emerald-600" href="/cover-letter-templates">
                  Cover Letter Templates
                </Link>
              </li>
              <li>
                <Link className="text-gray-600 hover:text-emerald-600" href="/cover-letter-examples">
                  Cover Letter Examples
                </Link>
              </li>
              <li>
                <Link className="text-gray-600 hover:text-emerald-600" href="/create-cover-letter">
                  Cover Letter Builder
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="text-gray-600 hover:text-emerald-600" href="/about">
                  About Us
                </Link>
              </li>
              <li>
                <Link className="text-gray-600 hover:text-emerald-600" href="/faq">
                  FAQ
                </Link>
              </li>
              <li>
                <Link className="text-gray-600 hover:text-emerald-600" href="/contact">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link className="text-gray-600 hover:text-emerald-600" href="/help">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center border-t pt-8 mt-8">
          <p className="text-xs text-gray-600">© 2024 CVKonnekt. All rights reserved. Made with ❤️ for South Africa.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link className="text-xs text-gray-600 hover:underline" href="/terms">
              Terms of Service
            </Link>
            <Link className="text-xs text-gray-600 hover:underline" href="/privacy">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
