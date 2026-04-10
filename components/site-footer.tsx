import Link from "next/link"
import { Heart } from "lucide-react"

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
            <p className="text-xs text-blue-300">Built by one person, free for everyone 🇿🇦</p>
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

        {/* Donation banner */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <div className="bg-slate-800/60 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4">
            <Heart className="h-6 w-6 text-pink-400 flex-shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <p className="text-white text-sm font-medium">CVKonnekt is free and always will be.</p>

            </div>
            <Link
              href="/donate"
              className="flex-shrink-0 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Donate via SnapScan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
