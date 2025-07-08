import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800">
      <div className="container px-4 md:px-6 py-8 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">CVKonnekt</h3>
            <p className="text-sm text-blue-200">
              Professional CV builder for South African job seekers.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-blue-200">© {new Date().getFullYear()} CVKonnekt. All rights reserved.</p>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <Link className="text-sm text-blue-200 hover:text-white transition-colors duration-200" href="/terms">
                Terms
              </Link>
              <Link className="text-sm text-blue-200 hover:text-white transition-colors duration-200" href="/privacy">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
