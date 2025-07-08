"use client"

import { FileText, Menu, X, User, LogOut, ChevronDown, ShieldCheck, BadgeCheck, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ProfileMenu } from "@/components/profile-menu"

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const { user, signOut, loading, isConfigured } = useAuth()
  
  // Close mobile menu on route change and handle loading
  useEffect(() => {
    const handleStart = () => setIsNavigating(true)
    const handleComplete = () => {
      setIsNavigating(false)
      setIsMobileMenuOpen(false)
    }
    
    // Listen for navigation events
    window.addEventListener('beforeunload', handleStart)
    window.addEventListener('load', handleComplete)
    
    return () => {
      window.removeEventListener('beforeunload', handleStart)
      window.removeEventListener('load', handleComplete)
    }
  }, [])
  
  const handleNavClick = () => {
    setIsNavigating(true)
    setIsMobileMenuOpen(false)
  }

  // Dropdown menu structure
  const cvMenu = [
    { href: "/create", label: "Create CV" },
    { href: "/cv-templates", label: "CV Templates" },
  ]
  const coverLetterMenu = [
    { href: "/create-cover-letter", label: "Create Cover Letter" },
    { href: "/cover-letter-templates", label: "Cover Letter Templates" },
  ]
  const navigationItems: { href: string; label: string }[] = []

  const handleSignOut = async () => {
    await signOut()
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link className="flex items-center gap-2 group" href="/templates">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg group-hover:scale-110 transition-transform duration-200">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-900">CVKonnekt</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all duration-200">
                  Templates
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2 rounded-md shadow-lg border">
                <div className="space-y-1">
                  <Link href="/templates" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md">
                    CV Templates
                  </Link>
                  <Link href="/cover-letter-templates" className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md">
                    Cover Letters
                  </Link>
                </div>
              </PopoverContent>
            </Popover>
            
            <Link href="/jobs" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all duration-200">
              Find Jobs
            </Link>
            
            <Link href="/dashboard" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all duration-200">
              Applications
            </Link>
            
            <Link href="/pricing" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all duration-200">
              Pricing
            </Link>
            
            <Link href="/faq" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all duration-200">
              FAQ
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="w-16 h-8 bg-slate-200 animate-pulse rounded-lg"></div>
            ) : user || !isConfigured ? (
              <ProfileMenu />
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                    Sign in
                  </Button>
                </Link>
                <Link href="/templates">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 font-medium">
                    Create CV
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            disabled={isNavigating}
          >
            {isNavigating ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 pt-4 pb-6 space-y-3 max-h-[80vh] overflow-y-auto">
              {/* Navigation Links */}
              <div className="space-y-1">
                <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">CV Builder</div>
                <Link
                  href="/templates"
                  className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  onClick={handleNavClick}
                >
                  Choose Template
                </Link>
                <Link
                  href="/create"
                  className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  onClick={handleNavClick}
                >
                  Quick Start
                </Link>
                
                <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">Job Search</div>
                <Link
                  href="/jobs"
                  className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  onClick={handleNavClick}
                >
                  Find Jobs
                </Link>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  onClick={handleNavClick}
                >
                  My Applications
                </Link>
                
                <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4">More</div>
                <Link
                  href="/cover-letter-templates"
                  className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Cover Letters
                </Link>
                <Link
                  href="/pricing"
                  className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="/faq"
                  className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  FAQ
                </Link>
              </div>
              
              {/* User Actions */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                {user || !isConfigured ? (
                  <>
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    {isConfigured && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSignOut}
                        className="w-full justify-start text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                        Sign in
                      </Button>
                    </Link>
                    <Link href="/create" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
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
