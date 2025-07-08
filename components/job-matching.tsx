"use client"

import { type CVData } from "@/types/cv-types";
import { ATSScoringPanel } from "@/components/cv-ats-scoring";

interface JobMatchingProps {
  cvData: CVData | null;
}

export function JobMatching({ cvData }: JobMatchingProps) {
  if (!cvData) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Job Matching Analysis</h3>
        <p className="text-gray-500">Create a CV to see job matching analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Job Matching Analysis</h3>
      <ATSScoringPanel cvData={cvData} currentSection="job-matching" />
    </div>
  );
}