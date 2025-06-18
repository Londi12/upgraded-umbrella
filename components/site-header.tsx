"use client"

import { FileText, Menu, X, User, LogOut } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"

import { Button } from "@/components/ui/button"

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, signOut, loading, isConfigured } = useAuth()

  const navigationItems = [
    { href: "/cv-templates", label: "CV Templates" },
    { href: "/cv-examples", label: "CV Examples" },
    { href: "/cover-letter-templates", label: "Cover Letters" },
    { href: "/cover-letter-examples", label: "Examples" },
    { href: "/faq", label: "FAQ" },
  ]

  const handleSignOut = async () => {
    await signOut()
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link className="flex items-center space-x-2 hover:opacity-80 transition-opacity" href="/">
            <div className="flex items-center justify-center w-8 h-8 bg-emerald-600 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CVKonnekt</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {loading ? (
              <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
            ) : user || !isConfigured ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                {isConfigured && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                )}
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    Log in
                  </Button>
                </Link>
                <Link href="/create">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                    Create CV
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 border-t space-y-2">
                {user || !isConfigured ? (
                  <>
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    {isConfigured && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSignOut}
                        className="w-full justify-start text-gray-600"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600">
                        Log in
                      </Button>
                    </Link>
                    <Link href="/create" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                        Create CV
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
