import { Data } from '../types/cv-types';

// Readability scoring using Flesch-Kincaid Grade Level
export const calculateReadabilityScore = (text: string): number => {
  const words = text.trim().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const syllables = countSyllables(text);

  if (words.length === 0 || sentences.length === 0) return 0;

  const averageWordsPerSentence = words.length / sentences.length;
  const averageSyllablesPerWord = syllables / words.length;
  
  // Flesch-Kincaid Grade Level formula
  const score = 0.39 * averageWordsPerSentence + 11.8 * averageSyllablesPerWord - 15.59;
  
  // Normalize score to 0-100 range
  return Math.min(Math.max(Math.round((100 - score * 10)), 0), 100);
};

// Helper function to count syllables
const countSyllables = (text: string): number => {
  return text.toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/[^aeiouy]*[aeiouy]+/g, 'a')
    .length;
};

// Calculate keyword density
export const calculateKeywordDensity = (text: string): Map<string, number> => {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3); // Ignore short words

  const totalWords = words.length;
  const wordFrequency = new Map<string, number>();

  words.forEach(word => {
    const count = wordFrequency.get(word) || 0;
    wordFrequency.set(word, count + 1);
  });

  // Convert to percentages
  wordFrequency.forEach((count, word) => {
    wordFrequency.set(word, Number(((count / totalWords) * 100).toFixed(1)));
  });

  // Sort by frequency and take top 10
  return new Map([...wordFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10));
};

// Calculate CV completion strength
export const calculateCompletionStrength = (cv: CVData): number => {
  const sections = [
    'personalInfo',
    'education',
    'experience',
    'skills',
    'summary'
  ];

  const weights = {
    personalInfo: 15,
    education: 20,
    experience: 30,
    skills: 20,
    summary: 15
  };

  let totalScore = 0;

  // Check personal info completeness
  if (cv.personalInfo) {
    const requiredFields = ['name', 'email', 'phone', 'location'];
    const completedFields = requiredFields.filter(field => 
      cv.personalInfo && cv.personalInfo[field as keyof typeof cv.personalInfo]
    );
    totalScore += (completedFields.length / requiredFields.length) * weights.personalInfo;
  }

  // Check education completeness
  if (cv.education && cv.education.length > 0) {
    totalScore += weights.education;
  }

  // Check experience completeness
  if (cv.experience && cv.experience.length > 0) {
    totalScore += weights.experience;
  }

  // Check skills completeness
  if (cv.skills && cv.skills.length > 0) {
    totalScore += weights.skills;
  }

  // Check summary completeness
  if (cv.summary && cv.summary.length > 50) {
    totalScore += weights.summary;
  }

  return Math.round(totalScore);
};

// Check ATS compatibility
export const checkATSCompatibility = (cv: CVData): { score: number; issues: string[] } => {
  const issues: string[] = [];
  let score = 100;

  // Check for common ATS issues
  if (!cv.personalInfo?.email?.includes('@')) {
    issues.push('Missing or invalid email address');
    score -= 15;
  }

  if (!cv.personalInfo?.phone) {
    issues.push('Missing phone number');
    score -= 10;
  }

  // Check education formatting
  if (cv.education) {
    cv.education.forEach(edu => {
      if (!edu.graduationDate) {
        issues.push('Missing graduation date in education');
        score -= 5;
      }
    });
  }

  // Check experience formatting
  if (cv.experience) {
    cv.experience.forEach((exp: any) => {
      if (!exp.startDate || !exp.endDate) {
        issues.push('Missing dates in experience');
        score -= 5;
      }
      if (!exp.company || !exp.title) {
        issues.push('Missing company or title in experience');
        score -= 5;
      }
    });
  }

  // Check skills format
  if (!cv.skills || cv.skills.length === 0) {
    issues.push('Missing skills section');
    score -= 15;
  }

  // Check summary length
  if (!cv.summary || cv.summary.length < 50) {
    issues.push('Summary is too short or missing');
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    issues
  };
};
