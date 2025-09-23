import { type CVData } from '../types/cv-types';

const INDUSTRY_KEYWORDS = {
  Technology: ['software', 'developer', 'engineer', 'programming', 'react', 'node', 'aws'],
  Finance: ['finance', 'accounting', 'audit', 'investment', 'banking'],
  Marketing: ['marketing', 'seo', 'content', 'social media', 'campaign'],
  Healthcare: ['healthcare', 'medical', 'patient', 'clinic', 'nursing'],
};

export const analyzeIndustryCompliance = (cvData: CVData) => {
  const cvText = JSON.stringify(cvData).toLowerCase();
  let detectedIndustry = 'General';
  let maxScore = 0;

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const score = keywords.reduce((acc, keyword) => {
      if (cvText.includes(keyword)) {
        return acc + 1;
      }
      return acc;
    }, 0);

    if (score > maxScore) {
      maxScore = score;
      detectedIndustry = industry;
    }
  }

  return {
    detectedIndustry,
    compliance: Math.min(95, 50 + maxScore * 10), // Mock compliance score
    recommendations: [
      `Tailor your CV for the ${detectableIndustry} industry.`,
      'Add more industry-specific keywords and skills.',
    ],
  };
};

export const analyzeJobMatch = (cvData: CVData, jobDescription: string) => {
  const cvText = JSON.stringify(cvData).toLowerCase();
  const jobText = jobDescription.toLowerCase();

  const jobKeywords = [...new Set(jobText.match(/[a-z-']+/g) || [])];
  const cvKeywords = new Set(cvText.match(/[a-z-']+/g) || []);

  const matchingKeywords = jobKeywords.filter(keyword => cvKeywords.has(keyword));
  const missingKeywords = jobKeywords.filter(keyword => !cvKeywords.has(keyword));

  const score = Math.round((matchingKeywords.length / jobKeywords.length) * 100);

  return {
    score: Math.min(98, score),
    matchingKeywords: matchingKeywords.slice(0, 10),
    missingKeywords: missingKeywords.slice(0, 10),
    skillsGap: [`Your CV is missing keywords like: ${missingKeywords.slice(0, 5).join(', ')}`],
    suggestions: [
      'Add missing keywords to your skills or experience sections.',
      'Tailor your experience to better match the job description.',
    ],
  };
};
