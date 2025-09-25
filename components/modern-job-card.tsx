"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MapPin, Calendar, Building, Bookmark, BookmarkCheck } from "lucide-react";

interface JobCardData {
  id: string;
  title: string;
  company: string;
  location: string;
  postedDate: string;
  description: string;
  requirements?: string[];
  category?: string;
  experience?: string;
  qualification?: string;
  jobType?: string;
  url?: string;
  salary?: string;
}

interface ModernJobCardProps {
  job: JobCardData;
  onApply?: (jobId: string) => void;
  onView?: (jobId: string) => void;
  onSave?: (jobId: string) => void;
  isSaved?: boolean;
  className?: string;
}

export function ModernJobCard({ job, onApply, onView, onSave, isSaved = false, className = "" }: ModernJobCardProps) {
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(isSaved)

  const handleSave = async () => {
    if (saving) return
    
    setSaving(true)
    try {
      console.log('Saving job:', job.title)
      const response = await fetch('/api/saved-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_title: job.title,
          company_name: job.company,
          job_url: job.url || `#job-${job.id}`,
          job_description: job.description,
          location: job.location,
          posted_date: job.postedDate,
          source: 'Job Search'
        })
      })
      
      const result = await response.json()
      console.log('Save response:', result)
      
      if (response.ok) {
        setSaved(true)
        onSave?.(job.id)
        console.log('Job saved successfully')
      } else {
        console.error('Save failed:', result)
      }
    } catch (error) {
      console.error('Error saving job:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleApply = async () => {
    // Track application automatically
    try {
      console.log('Tracking application for:', job.title)
      const response = await fetch('/api/track-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cv_id: 'default-cv',
          job_title: job.title,
          company_name: job.company,
          job_board: job.source || 'Job Search',
          application_date: new Date().toISOString().split('T')[0],
          status: 'applied',
          ats_score_at_application: 0,
          job_description: job.description,
          notes: `Applied via ${job.url || 'job search'}`
        })
      })
      
      const result = await response.json()
      console.log('Track response:', result)
      
      if (!response.ok) {
        console.error('Track failed:', result)
      } else {
        console.log('Application tracked successfully')
      }
    } catch (error) {
      console.error('Error tracking application:', error)
    }
    
    // Open job URL
    if (job.url) {
      window.open(job.url, '_blank')
    }
    onApply?.(job.id)
  }
  // Get company logo or fallback to initials
  const getCompanyLogo = (companyName: string) => {
    console.log(`🔍 LOGO DEBUG: Looking for logo for company: "${companyName}"`);
    
    // Force test logos for debugging
    const testCompanies = ['nedbank', 'absa', 'mrp', 'mr price', 'vector', 'bp'];
    const lowerCompanyName = companyName.toLowerCase().trim();
    
    if (testCompanies.some(test => lowerCompanyName.includes(test))) {
      console.log(`🧪 LOGO DEBUG: Test company detected: "${lowerCompanyName}"`);
    }
    
    const companyLogos: { [key: string]: string } = {
      'nedbank': '/Nedbank_logo_small.jpg',
      'nedbank limited': '/Nedbank_logo_small.jpg',
      'nedbank group': '/Nedbank_logo_small.jpg',
      'absa': '/Absa_Logo.png',
      'absa bank': '/Absa_Logo.png',
      'absa group': '/Absa_Logo.png',
      'mr price': '/mrp.jpg',
      'mrp': '/mrp.jpg',
      'mr price group': '/mrp.jpg',
      'vector logistics': '/vector-logistics-logo.png',
      'vector': '/vector-logistics-logo.png',
      'vector logistics (pty) ltd': '/vector-logistics-logo.png',
      'bp': '/bp-logo.png',
      'british petroleum': '/bp-logo.png',
      'bp southern africa': '/bp-logo.png'
    };

    console.log(`🔍 LOGO DEBUG: Normalized company name: "${lowerCompanyName}"`);
    console.log(`🔍 LOGO DEBUG: Available logo keys:`, Object.keys(companyLogos));
    
    // Check exact match
    if (companyLogos[lowerCompanyName]) {
      console.log(`✅ LOGO DEBUG: Found exact match for "${lowerCompanyName}": ${companyLogos[lowerCompanyName]}`);
      return companyLogos[lowerCompanyName];
    }

    // Check partial matches - more aggressive matching
    for (const [companyKey, logoUrl] of Object.entries(companyLogos)) {
      // Split company names into words for better matching
      const companyWords = lowerCompanyName.split(/\s+/);
      const keyWords = companyKey.split(/\s+/);
      
      // Check if any key word matches any company word
      const hasWordMatch = keyWords.some(keyWord => 
        companyWords.some(companyWord => 
          companyWord.includes(keyWord) || keyWord.includes(companyWord)
        )
      );
      
      if (hasWordMatch || lowerCompanyName.includes(companyKey) || companyKey.includes(lowerCompanyName)) {
        console.log(`✅ LOGO DEBUG: Found partial match "${companyKey}" for "${lowerCompanyName}": ${logoUrl}`);
        return logoUrl;
      }
    }

    console.log(`❌ LOGO DEBUG: No match found for "${companyName}"`);
    return null;
  };

  // Generate company initials for logo
  const getCompanyInitials = (companyName: string) => {
    return companyName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Generate random color for logo based on company name
  const getLogoColor = (companyName: string) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-blue-500'
    ];
    const index = companyName.length % colors.length;
    return colors[index];
  };

  const companyLogo = getCompanyLogo(job.company);

  return (
    <Card className={`border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300 ${className}`}>
      <CardContent className="p-5">
        {/* Header with Logo and Basic Info */}
        <div className="flex gap-3 mb-4">
          {/* Company Logo */}
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={`${job.company} logo`}
              className="w-14 h-14 rounded-xl object-contain flex-shrink-0 bg-white p-1"
              onLoad={() => {
                console.log(`✅ IMAGE DEBUG: Successfully loaded logo for ${job.company}: ${companyLogo}`);
              }}
              onError={(e) => {
                console.log(`❌ IMAGE DEBUG: Failed to load logo for ${job.company}: ${companyLogo}`);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getLogoColor(job.company)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
            style={{ display: companyLogo ? 'none' : 'flex' }}
          >
            {getCompanyInitials(job.company)}
          </div>

          {/* Job Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
              {job.title}
            </h3>
            <div className="text-sm text-gray-600 mb-2">
              {job.company}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {job.category && (
                <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-xs">
                  {job.category}
                </Badge>
              )}
              {job.experience && (
                <Badge variant="outline" className="text-xs">
                  {job.experience}
                </Badge>
              )}
              {job.qualification && (
                <Badge variant="outline" className="text-xs">
                  {job.qualification}
                </Badge>
              )}
              {job.jobType && (
                <Badge variant="outline" className="text-xs">
                  {job.jobType}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          {job.description}
        </p>

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {job.requirements.map((req, index) => (
              <div
                key={index}
                className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded-md border border-gray-200"
              >
                {req}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              {job.location}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {job.postedDate}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSave}
              disabled={saving || saved}
              className={saved ? "bg-blue-50 border-blue-300 text-blue-600" : ""}
            >
              {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </Button>
            {job.url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView?.(job.id)}
                className="text-xs"
              >
                View
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleApply}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-xs"
            >
              Apply
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
