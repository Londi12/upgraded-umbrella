"use client"

import { useState } from "react"
import { Save, User, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { LoadingSpinner } from "./loading-spinner"
import type { CVData } from "@/types/cv-types"

interface WorkingSaveButtonProps {
  cvData: CVData
  onSaved?: (savedId: string) => void
  className?: string
}

export function WorkingSaveButton({ cvData, onSaved, className }: WorkingSaveButtonProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [cvName, setCvName] = useState('')
  const { user, signIn } = useAuth()

  const handleSaveClick = () => {
    if (!user) {
      // Redirect to login page
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
    } else {
      setShowSaveDialog(true)
      // Auto-generate CV name
      const jobTitle = cvData.personalInfo?.jobTitle || 'Professional'
      const timestamp = new Date().toLocaleDateString()
      setCvName(`${jobTitle} CV - ${timestamp}`)
    }
  }



  const handleSave = async () => {
    if (!cvName.trim()) return

    setIsSaving(true)

    try {
      // Simulate save process
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Save CV using Supabase (if configured) or localStorage as fallback
      const savedCV = {
        id: Date.now().toString() + Math.random().toString(36).substr(2),
        name: cvName,
        cvData,
        userId: user?.id || user?.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // For now, save to localStorage (implement Supabase saving later)
      const existingCVs = JSON.parse(localStorage.getItem('saved_cvs') || '[]')
      existingCVs.push(savedCV)
      localStorage.setItem('saved_cvs', JSON.stringify(existingCVs))

      // Set as active CV for job matching
      localStorage.setItem('active_cv', JSON.stringify(savedCV))

      setSaved(true)
      setTimeout(() => {
        setShowSaveDialog(false)
        setSaved(false)
        setIsSaving(false)
        onSaved?.(savedCV.id)
        
        // Show success message
        console.log('CV saved successfully!')
      }, 1500)

    } catch (error) {
      console.error('Save failed:', error)
      setIsSaving(false)
    }
  }

  if (saved) {
    return (
      <Button className={`${className} bg-green-600 hover:bg-green-700`} disabled>
        <Check className="h-4 w-4 mr-2" />
        Saved!
      </Button>
    )
  }

  return (
    <>
      <Button onClick={handleSaveClick} className={className}>
        <Save className="h-4 w-4 mr-2" />
        {user ? 'Save CV' : 'Sign in to Save'}
      </Button>



      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Your CV</DialogTitle>
            <DialogDescription>
              Give your CV a name so you can find it later
            </DialogDescription>
          </DialogHeader>

          {isSaving ? (
            <div className="py-8">
              <LoadingSpinner message="Saving your CV..." />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cv-name">CV Name</Label>
                <Input
                  id="cv-name"
                  value={cvName}
                  onChange={(e) => setCvName(e.target.value)}
                  placeholder="e.g., Software Developer CV - 2024"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="font-medium text-gray-900 mb-1">Saving as: {user?.name}</p>
                <p className="text-gray-600">{user?.email}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!cvName.trim()}
                  className="flex-1"
                >
                  Save CV
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}