"use client"

import { useState } from 'react'
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  trackApplication, 
  updateApplicationStatus,
  type ApplicationTracking 
} from '@/lib/analytics-service'

interface ApplicationTrackerProps {
  applications: ApplicationTracking[]
  savedCVs: any[]
  onApplicationAdded: () => void
  onApplicationUpdated: () => void
}

export function ApplicationTracker({ 
  applications, 
  savedCVs, 
  onApplicationAdded, 
  onApplicationUpdated 
}: ApplicationTrackerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState<ApplicationTracking | null>(null)
  const [formData, setFormData] = useState({
    cv_id: '',
    job_title: '',
    company_name: '',
    job_board: '',
    application_date: new Date().toISOString().split('T')[0],
    status: 'applied' as ApplicationTracking['status'],
    ats_score_at_application: 0,
    job_description: '',
    notes: ''
  })

  const resetForm = () => {
    setFormData({
      cv_id: '',
      job_title: '',
      company_name: '',
      job_board: '',
      application_date: new Date().toISOString().split('T')[0],
      status: 'applied',
      ats_score_at_application: 0,
      job_description: '',
      notes: ''
    })
  }

  const handleAddApplication = async () => {
    try {
      await trackApplication(formData)
      setIsAddDialogOpen(false)
      resetForm()
      onApplicationAdded()
    } catch (error) {
      console.error('Error adding application:', error)
    }
  }

  const handleUpdateStatus = async (applicationId: string, status: ApplicationTracking['status'], notes?: string) => {
    try {
      await updateApplicationStatus(applicationId, status, notes)
      onApplicationUpdated()
    } catch (error) {
      console.error('Error updating application:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired': return 'bg-green-100 text-green-800'
      case 'offered': return 'bg-blue-100 text-blue-800'
      case 'interview': return 'bg-purple-100 text-purple-800'
      case 'viewed': return 'bg-yellow-100 text-yellow-800'
      case 'applied': return 'bg-gray-100 text-gray-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const jobBoards = [
    'Careers24', 'PNet', 'JobMail', 'Indeed', 'LinkedIn', 'CareerJet', 'Company Website', 'Other'
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Application Tracker</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Track New Job Application</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cv_id">CV Used</Label>
                  <Select value={formData.cv_id || undefined} onValueChange={(value) => setFormData(prev => ({ ...prev, cv_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select CV" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedCVs.map(cv => (
                        <SelectItem key={cv.id} value={cv.id}>
                          {cv.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="job_board">Job Board</Label>
                  <Select value={formData.job_board || undefined} onValueChange={(value) => setFormData(prev => ({ ...prev, job_board: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job board" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobBoards.map(board => (
                        <SelectItem key={board} value={board}>
                          {board}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                    placeholder="e.g., Software Developer"
                  />
                </div>
                <div>
                  <Label htmlFor="company_name">Company</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="e.g., TechCorp"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="application_date">Application Date</Label>
                  <Input
                    id="application_date"
                    type="date"
                    value={formData.application_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, application_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ats_score">ATS Score (if known)</Label>
                  <Input
                    id="ats_score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.ats_score_at_application}
                    onChange={(e) => setFormData(prev => ({ ...prev, ats_score_at_application: parseInt(e.target.value) || 0 }))}
                    placeholder="0-100"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="job_description">Job Description (optional)</Label>
                <Textarea
                  id="job_description"
                  value={formData.job_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, job_description: e.target.value }))}
                  placeholder="Paste the job description here for better analytics..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes about this application..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddApplication} className="bg-blue-600 hover:bg-blue-700">
                Track Application
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <ExternalLink className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications tracked yet</h3>
            <p className="text-gray-600 mb-4">
              Start tracking your job applications to see detailed analytics and improve your success rate.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              Track Your First Application
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{app.job_title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span>{app.company_name}</span>
                      <span>•</span>
                      <span>{app.job_board}</span>
                      <span>•</span>
                      <span>{app.application_date}</span>
                      {app.ats_score_at_application > 0 && (
                        <>
                          <span>•</span>
                          <span>ATS: {app.ats_score_at_application}%</span>
                        </>
                      )}
                    </div>
                    {app.notes && (
                      <p className="text-sm text-gray-700 mb-3">{app.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(app.status)}>
                      {app.status}
                    </Badge>
                    <Select
                      value={app.status}
                      onValueChange={(value) => handleUpdateStatus(app.id!, value as ApplicationTracking['status'])}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="viewed">Viewed</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="offered">Offered</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
