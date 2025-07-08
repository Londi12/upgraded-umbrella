"use client"

import { type CVData } from "@/types/cv-types";
import { ATSScoringPanel } from "@/components/cv-ats-scoring";

interface JobMatchingProps {
  cvData: CVData;
}

export function JobMatching({ cvData }: JobMatchingProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Job Matching Analysis</h3>
      <ATSScoringPanel cvData={cvData} currentSection="job-matching" />
    </div>
  );
}