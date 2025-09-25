"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, MapPin, Calendar, Building } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

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
  // Get company logo or fallback to initials
  const getCompanyLogo = (companyName: string) => {
    console.log(`🔍 Looking for logo for company: "${companyName}"`);

    // Company logo mapping
    const companyLogos: { [key: string]: string } = {
      'nedbank': '/Nedbank_logo_small.jpg',
      'standard bank': 'https://www.standardbank.com/static_file/StandardBankGroup/Standard-Bank-Group/images/logo.svg',
      'fnb': 'https://www.fnb.co.za/assets/images/fnb-logo.svg',
      'first national bank': 'https://www.fnb.co.za/assets/images/fnb-logo.svg',
      'absa': '/Absa_Logo.png',
      'capitec': 'https://www.capitecbank.co.za/assets/images/capitec-logo.svg',
      'investec': 'https://www.investec.com/content/dam/investec/investec-logo.svg',
      'santam': 'https://www.santam.co.za/content/dam/santam/santam-logo.svg',
      'old mutual': 'https://www.oldmutual.co.za/content/dam/old-mutual/om-logo.svg',
      'discovery': 'https://www.discovery.co.za/assets/images/discovery-logo.svg',
      'momentum': 'https://www.momentum.co.za/content/dam/momentum/momentum-logo.svg',
      'liberty': 'https://www.liberty.co.za/content/dam/liberty/liberty-logo.svg',
      'sanlam': 'https://www.sanlam.co.za/content/dam/sanlam/sanlam-logo.svg',
      'vanguard': 'https://www.vanguard.com/content/dam/vanguard/logo.svg',
      'blackrock': 'https://www.blackrock.com/content/dam/blackrock/logo.svg',
      'jpmorgan': 'https://www.jpmorgan.com/content/dam/jpmorgan/logo.svg',
      'goldman sachs': 'https://www.goldmansachs.com/content/dam/goldmansachs/logo.svg',
      'morgan stanley': 'https://www.morganstanley.com/content/dam/morganstanley/logo.svg',
      'citibank': 'https://www.citibank.com/content/dam/citibank/logo.svg',
      'hsbc': 'https://www.hsbc.com/content/dam/hsbc/logo.svg',
      'deutsche bank': 'https://www.db.com/content/dam/db/logo.svg',
      'mr price': '/mrp.jpg',
      'mrp': '/mrp.jpg',
      'vector logistics': '/vector-logistics-logo.png',
      'vector': '/vector-logistics-logo.png',
      'bp': '/bp-logo.png',
      'british petroleum': '/bp-logo.png'
    };

    // Check for exact matches first
    const lowerCompanyName = companyName.toLowerCase().trim();
    console.log(`🔍 Checking exact match for: "${lowerCompanyName}"`);
    
    if (companyLogos[lowerCompanyName]) {
      console.log(`✅ Found exact match: ${companyLogos[lowerCompanyName]}`);
      return companyLogos[lowerCompanyName];
    }

    // Check for partial matches
    console.log(`🔍 Checking partial matches for: "${lowerCompanyName}"`);
    for (const [companyKey, logoUrl] of Object.entries(companyLogos)) {
      if (lowerCompanyName.includes(companyKey) || companyKey.includes(lowerCompanyName)) {
        console.log(`✅ Found partial match: "${companyKey}" -> ${logoUrl}`);
        return logoUrl;
      }
    }

    console.log(`❌ No logo found for company: "${companyName}", using initials fallback`);
    console.log(`Available logo keys:`, Object.keys(companyLogos));
    return null; // No logo found, will use initials
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
              src={`${companyLogo}?v=${Date.now()}`}
              alt={`${job.company} logo`}
              className="w-14 h-14 rounded-xl object-contain flex-shrink-0 bg-white p-1"
              onError={(e) => {
                console.log(`Failed to load logo for ${job.company}: ${companyLogo}`);
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
              onLoad={() => {
                console.log(`Successfully loaded logo for ${job.company}: ${companyLogo}`);
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
        <div className="mb-4">
          <MarkdownRenderer
            content={job.description}
            className="text-sm text-gray-700"
          />
        </div>

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
