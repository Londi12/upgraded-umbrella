"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MapPin, Calendar, Building } from "lucide-react";

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
  className?: string;
}

export function ModernJobCard({ job, onApply, onView, className = "" }: ModernJobCardProps) {
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

  return (
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
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
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
              onClick={() => onApply?.(job.id)}
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
