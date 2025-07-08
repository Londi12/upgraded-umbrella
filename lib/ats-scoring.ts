import { type CVData } from '../types/cv-types';

export interface ATSScore {
  totalScore: number;
  maxScore: number;
  sections: {
    [key: string]: {
      score: number;
      maxScore: number;
      feedback: string[];
      suggestions: DetailedSuggestion[];
      priority: 'high' | 'medium' | 'low';
    };
  };
}

export interface DetailedSuggestion {
  type: 'add' | 'modify' | 'remove' | 'format';
  section: string;
  field?: string;
  current?: string;
  suggested: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
  examples?: string[];
}

const REQUIRED_SECTIONS = ['experience', 'education', 'skills', 'contact'];
const ACTION_VERBS = [
  'achieved', 'developed', 'implemented', 'managed', 'increased', 'created', 'led', 'improved',
  'optimized', 'streamlined', 'enhanced', 'delivered', 'executed', 'coordinated', 'facilitated',
  'generated', 'launched', 'maintained', 'negotiated', 'organized', 'performed', 'produced',
  'reduced', 'resolved', 'secured', 'supervised', 'transformed', 'utilized', 'validated'
];

// Industry-specific keywords for better matching
const INDUSTRY_KEYWORDS = {
  'technology': ['software', 'programming', 'development', 'coding', 'database', 'cloud', 'api', 'agile', 'scrum'],
  'finance': ['financial', 'accounting', 'budget', 'analysis', 'compliance', 'audit', 'risk', 'investment'],
  'marketing': ['campaign', 'brand', 'digital', 'social media', 'analytics', 'seo', 'content', 'strategy'],
  'healthcare': ['patient', 'clinical', 'medical', 'treatment', 'diagnosis', 'healthcare', 'nursing'],
  'education': ['teaching', 'curriculum', 'student', 'learning', 'assessment', 'education', 'training'],
  'sales': ['revenue', 'targets', 'clients', 'negotiation', 'pipeline', 'crm', 'prospecting', 'closing']
};

// Common ATS parsing issues
const ATS_FORMATTING_RULES = {
  'avoid_tables': 'Avoid using tables for layout as they confuse ATS systems',
  'avoid_headers_footers': 'Keep important information out of headers and footers',
  'use_standard_fonts': 'Use standard fonts like Arial, Calibri, or Times New Roman',
  'avoid_graphics': 'Avoid graphics, images, and complex formatting',
  'use_standard_sections': 'Use standard section headings like "Experience", "Education", "Skills"'
};

export const calculateATSScore = (cvData: CVData, jobDescription?: string): ATSScore => {
  const sections: ATSScore['sections'] = {};
  let totalScore = 0;
  let maxScore = 0;

  // Check required sections
  REQUIRED_SECTIONS.forEach((section) => {
    const sectionScore = evaluateSection(section, cvData);
    sections[section] = sectionScore;
    totalScore += sectionScore.score;
    maxScore += sectionScore.maxScore;
  });

  // Add keyword matching if job description is provided
  if (jobDescription) {
    const keywordScore = evaluateKeywords(cvData, jobDescription);
    sections.keywords = keywordScore;
    totalScore += keywordScore.score;
    maxScore += keywordScore.maxScore;
  }

  return {
    totalScore,
    maxScore,
    sections,
  };
};

const evaluateSection = (section: string, cvData: CVData) => {
  const feedback: string[] = [];
  let score = 0;
  let maxScore = 10;

  switch (section) {
    case 'contact':
      if (!cvData.personalInfo?.email || !cvData.personalInfo?.phone) {
        feedback.push('Add your email and phone number for better visibility');
      } else {
        score += 5;
      }
      if (!cvData.personalInfo?.location) {
        feedback.push('Include your location to help recruiters');
      } else {
        score += 5;
      }
      break;

    case 'experience':
      if (!cvData.experience?.length) {
        feedback.push('Add your work experience to showcase your career journey');
      } else {
        score += 5;
        // Check for action verbs and quantifiable achievements
        const hasActionVerbs = cvData.experience.some(exp => 
          ACTION_VERBS.some(verb => 
            (exp.description || '').toLowerCase().includes(verb)
          )
        );
        if (!hasActionVerbs) {
          feedback.push('Use action verbs to make your experience more impactful');
        } else {
          score += 5;
        }
      }
      break;

    case 'education':
      if (!cvData.education?.length) {
        feedback.push('Add your education history to highlight your qualifications');
      } else {
        score += 5;
        // Check for degree and institution
        const hasCompleteInfo = cvData.education.some(edu => 
          edu.degree && edu.institution
        );
        if (!hasCompleteInfo) {
          feedback.push('Include both degree and institution for each education entry');
        } else {
          score += 5;
        }
      }
      break;

    case 'skills':
      const skillsArray = Array.isArray(cvData.skills) ? cvData.skills : 
                         typeof cvData.skills === 'string' && cvData.skills.length > 0 ? 
                         cvData.skills.split(',').map(s => ({ name: s.trim() })) : [];
      
      if (!skillsArray.length) {
        feedback.push('Add your key skills to highlight your expertise');
      } else {
        score += 5;
        // Check for skill categorization
        const hasCategories = skillsArray.some(skill => 'category' in skill && skill.category);
        if (!hasCategories) {
          feedback.push('Consider categorizing your skills (e.g., Technical, Soft Skills)');
        } else {
          score += 5;
        }
      }
      break;
  }

  return {
    score,
    maxScore,
    feedback,
  };
};

export const evaluateKeywords = (cvData: CVData, jobDescription: string): ATSScore['sections']['keywords'] => {
  const feedback: string[] = [];
  let score = 0;
  const maxScore = 20;

  // Extract keywords from job description (simple implementation)
  const jobKeywords = new Set(
    jobDescription
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
  );

  // Combine all text from CV
  const skillsText = Array.isArray(cvData.skills) ? 
                    cvData.skills.map(skill => skill.name).join(' ') :
                    typeof cvData.skills === 'string' ? cvData.skills : '';
  
  const cvText = [
    ...(cvData.experience?.map(exp => exp.description) || []),
    skillsText,
    cvData.summary || '',
  ].join(' ').toLowerCase();

  const foundKeywords = new Set<string>();
  const missingKeywords = new Set<string>();

  jobKeywords.forEach(keyword => {
    if (cvText.includes(keyword)) {
      foundKeywords.add(keyword);
    } else {
      missingKeywords.add(keyword);
    }
  });

  const matchPercentage = (foundKeywords.size / jobKeywords.size) * 100;
  score = Math.min(maxScore, Math.round(matchPercentage / 5)); // Convert percentage to score

  if (missingKeywords.size > 0) {
    feedback.push(`Add ${missingKeywords.size} keywords from the job description`);
  }
  if (matchPercentage < 50) {
    feedback.push('Include more keywords from the job description');
  }

  return {
    score,
    maxScore,
    feedback,
  };
};

export const getATSReadinessPercentage = (score: ATSScore): number => {
  return Math.round((score.totalScore / score.maxScore) * 100);
};

export const getSectionTips = (section: string): string[] => {
  const tips: { [key: string]: string[] } = {
    contact: [
      'Include a professional email address',
      'Add your phone number with country code',
      'Specify your city and country',
      'Add LinkedIn profile if available'
    ],
    experience: [
      'Start bullet points with action verbs',
      'Include quantifiable achievements',
      'Focus on relevant experience',
      'Use industry-specific keywords'
    ],
    education: [
      'List most recent education first',
      'Include degree and institution',
      'Add graduation date',
      'Mention relevant coursework'
    ],
    skills: [
      'Group skills by category',
      'Include both technical and soft skills',
      'Match skills to job requirements',
      'Use industry-standard terminology'
    ],
    keywords: [
      'Match keywords from job description',
      'Use variations of important terms',
      'Include industry-specific jargon',
      'Highlight key qualifications'
    ]
  };

  return tips[section] || [];
}; 