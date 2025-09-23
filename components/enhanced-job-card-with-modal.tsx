"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ExternalLink, MapPin, Calendar, Building, DollarSign, X, Eye, Briefcase } from "lucide-react";

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
  fullDescription?: string;
  benefits?: string[];
  skills?: string[];
}

interface EnhancedJobCardWithModalProps {
  job: JobCardData;
  onApply?: (jobId: string) => void;
  onView?: (jobId: string) => void;
  className?: string;
}

export function EnhancedJobCardWithModal({ job, onApply, onView, className = "" }: EnhancedJobCardWithModalProps) {
  const [showFullView, setShowFullView] = useState(false);

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

  const handleViewClick = () => {
    setShowFullView(true);
    onView?.(job.id);
  };

  const handleApplyClick = () => {
    if (job.url) {
      window.open(job.url, '_blank');
    }
    onApply?.(job.id);
  };

  return (
    <>
      <Card className={`border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300 ${className}`}>
        <CardContent className="p-5">
          {/* Header with Logo and Basic Info */}
          <div className="flex gap-3 mb-4">
            {/* Company Logo */}
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getLogoColor(job.company)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
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
              {job.salary && (
                <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                  <DollarSign className="h-4 w-4" />
                  {job.salary}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewClick}
                className="text-xs"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                onClick={handleApplyClick}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-xs"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Job View Modal */}
      <Dialog open={showFullView} onOpenChange={setShowFullView}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Company Logo */}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getLogoColor(job.company)} flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                  {getCompanyInitials(job.company)}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {job.title}
                  </DialogTitle>
                  <p className="text-lg text-gray-600 mt-1">{job.company}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {job.postedDate}
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-1 text-green-600 font-medium">
                        <DollarSign className="h-4 w-4" />
                        {job.salary}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullView(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Job Badges */}
            <div className="flex flex-wrap gap-2">
              {job.category && (
                <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200">
                  {job.category}
                </Badge>
              )}
              {job.experience && (
                <Badge variant="outline">
                  {job.experience}
                </Badge>
              )}
              {job.qualification && (
                <Badge variant="outline">
                  {job.qualification}
                </Badge>
              )}
              {job.jobType && (
                <Badge variant="outline">
                  {job.jobType}
                </Badge>
              )}
            </div>

            {/* Job Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Job Description
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {job.fullDescription || job.description}
                </p>
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {job.requirements.map((req, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-gray-700 bg-white border border-gray-200 rounded-lg p-3"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      {req}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {job.benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-gray-700 bg-green-50 border border-green-200 rounded-lg p-3"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Apply Button */}
            <div className="flex justify-center pt-6 border-t border-gray-200">
              <Button
                size="lg"
                onClick={handleApplyClick}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-3 text-lg font-medium"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Apply for this Position
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
