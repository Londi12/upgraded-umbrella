import { CVData, PersonalInfo, Experience, Education } from '@/types/cv-types';
import { CVFileType, CVParseResult, TemplateType, extractTextFromFile } from './cv-parser';

/**
 * Parse our own template CV from a file buffer
 * This handles our own templates more accurately than the generic parser
 */
export async function parseOwnTemplate(buffer: Buffer, fileType: CVFileType, templateType: TemplateType): Promise<CVParseResult> {
  try {
    // Extract text from the file
    const text = await extractTextFromFile(buffer, fileType);

    // Initialize the CV data structure
    const cvData: CVData = {
      personalInfo: {
        fullName: '',
        jobTitle: '',
        email: '',
        phone: '',
        location: ''
      },
      summary: '',
      experience: [],
      education: [],
      skills: ''
    };

    // For our templates, we can use more specific pattern matching
    // based on the known structure of each template

    // Extract personal info with template-specific patterns
    cvData.personalInfo = extractPersonalInfoFromTemplate(text, templateType);

    // Extract other sections with template-specific patterns
    cvData.summary = extractSummaryFromTemplate(text, templateType);
    cvData.experience = extractExperienceFromTemplate(text, templateType);
    cvData.education = extractEducationFromTemplate(text, templateType);
    cvData.skills = extractSkillsFromTemplate(text, templateType);

    return {
      success: true,
      data: cvData,
      rawText: text,
      confidence: 95, // Higher confidence for our own templates
      ownTemplate: true
    };
  } catch (error) {
    console.error('Error parsing own template:', error);
    return {
      success: false,
      error: 'Error parsing our CV template. Please try again.',
      confidence: 0
    };
  }
}

/**
 * Extract personal information from our template
 */
function extractPersonalInfoFromTemplate(text: string, templateType: TemplateType): PersonalInfo {
  const personalInfo: PersonalInfo = {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: ''
  };

  // Different patterns based on template type
  switch (templateType) {
    case TemplateType.PROFESSIONAL:
    case TemplateType.EXECUTIVE:
      // These templates typically have the name at the top in large font
      const nameMatch = text.match(/^([\s\S]{1,50}?)\n/);
      if (nameMatch) personalInfo.fullName = nameMatch[1].trim();

      // Job title is usually right after the name
      const jobTitleMatch = text.match(/^[\s\S]{1,50}?\n([\s\S]{1,80}?)\n/);
      if (jobTitleMatch) personalInfo.jobTitle = jobTitleMatch[1].trim();
      break;

    case TemplateType.MODERN:
    case TemplateType.SIMPLE:
      // These templates may have a different layout
      const modernNameMatch = text.match(/^([\s\S]{1,50}?)\n/) || 
                               text.match(/Name:\s*([^\n]+)/);
      if (modernNameMatch) personalInfo.fullName = modernNameMatch[1].trim();

      const modernJobMatch = text.match(/^[\s\S]{1,50}?\n([\s\S]{1,80}?)\n/) || 
                               text.match(/Job Title:\s*([^\n]+)/);
      if (modernJobMatch) personalInfo.jobTitle = modernJobMatch[1].trim();
      break;

    default:
      // Generic approach for other templates
      const genericNameMatch = text.match(/^([\s\S]{1,50}?)\n/) || 
                                text.match(/Name:\s*([^\n]+)/);
      if (genericNameMatch) personalInfo.fullName = genericNameMatch[1].trim();

      const genericJobMatch = text.match(/Job Title:\s*([^\n]+)/) || 
                                text.match(/Position:\s*([^\n]+)/);
      if (genericJobMatch) personalInfo.jobTitle = genericJobMatch[1].trim();
  }

  // Common patterns across all templates
  const emailMatch = text.match(/Email:\s*([^\n]+)/) || 
                      text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) personalInfo.email = emailMatch[1]?.trim() || emailMatch[0].trim();

  const phoneMatch = text.match(/Phone:\s*([^\n]+)/) || 
                      text.match(/(\+?\d{1,3}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4})/);
  if (phoneMatch) personalInfo.phone = phoneMatch[1]?.trim() || phoneMatch[0].trim();

  const locationMatch = text.match(/Location:\s*([^\n]+)/) || 
                         text.match(/Address:\s*([^\n]+)/);
  if (locationMatch) personalInfo.location = locationMatch[1].trim();

  return personalInfo;
}

/**
 * Extract summary from our template
 */
function extractSummaryFromTemplate(text: string, templateType: TemplateType): string {
  // Different patterns based on template type
  switch (templateType) {
    case TemplateType.PROFESSIONAL:
    case TemplateType.EXECUTIVE:
      const profMatch = text.match(/(?:Professional Summary|Summary|Profile)\s*(?::|\n)\s*([\s\S]*?)(?=\n\s*(?:Experience|Work Experience|Employment|Education|Skills))/i);
      return profMatch ? profMatch[1].trim() : '';

    case TemplateType.MODERN:
    case TemplateType.SIMPLE:
      const modernMatch = text.match(/(?:About Me|Summary|Profile)\s*(?::|\n)\s*([\s\S]*?)(?=\n\s*(?:Experience|Work Experience|Employment|Education|Skills))/i);
      return modernMatch ? modernMatch[1].trim() : '';

    default:
      // Generic approach
      const genericMatch = text.match(/(?:Summary|Profile|About|Objective)\s*(?::|\n)\s*([\s\S]*?)(?=\n\s*(?:Experience|Work Experience|Employment|Education|Skills))/i);
      return genericMatch ? genericMatch[1].trim() : '';
  }
}

/**
 * Extract experience from our template
 */
function extractExperienceFromTemplate(text: string, templateType: TemplateType): Experience[] {
  const experiences: Experience[] = [];

  // Find the experience section
  const experienceSectionMatch = text.match(/(?:Experience|Work Experience|Employment History)\s*(?::|\n)\s*([\s\S]*?)(?=\n\s*(?:Education|Skills|Languages|References|$))/i);

  if (!experienceSectionMatch) return experiences;

  const experienceSection = experienceSectionMatch[1];

  // Different parsing logic based on template type
  switch (templateType) {
    case TemplateType.PROFESSIONAL:
    case TemplateType.EXECUTIVE:
      // These templates usually have a clear structure with job title, company, dates
      const professionalExpItems = experienceSection.split(/\n\s*(?=\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/g);

      for (const item of professionalExpItems) {
        if (item.trim().length < 10) continue; // Skip short items

        const experience: Experience = {
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          description: ''
        };

        // Extract job title
        const titleMatch = item.match(/^([^\n]+)/);
        if (titleMatch) experience.title = titleMatch[1].trim();

        // Extract company
        const companyMatch = item.match(/\n([^\n,]+)(?:,|\n)/);
        if (companyMatch) experience.company = companyMatch[1].trim();

        // Extract location
        const locationMatch = item.match(/,\s*([^\n]+)\n/);
        if (locationMatch) experience.location = locationMatch[1].trim();

        // Extract dates
        const dateMatch = item.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\s*[-–]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4}|Present))/);
        if (dateMatch) {
          const dates = dateMatch[1].split(/[-–]/);
          experience.startDate = dates[0].trim();
          experience.endDate = dates[1].trim();
        }

        // Extract description
        const descMatch = item.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\s*[-–]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4}|Present)[\s\S]*?\n([\s\S]+)$/);
        if (descMatch) experience.description = descMatch[1].trim();

        experiences.push(experience);
      }
      break;

    case TemplateType.MODERN:
    case TemplateType.SIMPLE:
      // Modern templates might have a different structure
      const modernExpItems = experienceSection.split(/\n\s*(?=\d{4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b)/g);

      for (const item of modernExpItems) {
        if (item.trim().length < 10) continue;

        const experience: Experience = {
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          description: ''
        };

        // For modern templates, the job title might be more prominent
        const modernTitleMatch = item.match(/^([^\n]+)/);
        if (modernTitleMatch) experience.title = modernTitleMatch[1].trim();

        // Company might be on the next line
        const modernCompanyMatch = item.match(/\n([^\n,]+)(?:,|\n|\s+in\s+)/);
        if (modernCompanyMatch) experience.company = modernCompanyMatch[1].trim();

        // Location pattern
        const modernLocationMatch = item.match(/(?:,|\s+in\s+)\s*([^\n]+)\n/);
        if (modernLocationMatch) experience.location = modernLocationMatch[1].trim();

        // Date patterns for modern templates
        const modernDateMatch = item.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\s*[-–]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4}|Present))/);
        if (modernDateMatch) {
          const dates = modernDateMatch[1].split(/[-–]/);
          experience.startDate = dates[0].trim();
          experience.endDate = dates[1].trim();
        }

        // Description extraction
        const modernDescMatch = item.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\s*[-–]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4}|Present)[\s\S]*?\n([\s\S]+)$/);
        if (modernDescMatch) experience.description = modernDescMatch[1].trim();

        experiences.push(experience);
      }
      break;

    default:
      // Generic approach for other templates
      const genericExpItems = experienceSection.split(/\n\s*(?=\d{4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b|\b(?:Position|Job Title|Role)\b)/gi);

      for (const item of genericExpItems) {
        if (item.trim().length < 10) continue;

        const experience: Experience = {
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          description: ''
        };

        // Title extraction
        const genericTitleMatch = item.match(/^([^\n]+)/) || 
                                    item.match(/(?:Position|Job Title|Role):\s*([^\n]+)/i);
        if (genericTitleMatch) experience.title = (genericTitleMatch[1] || genericTitleMatch[2]).trim();

        // Company extraction
        const genericCompanyMatch = item.match(/\n([^\n,]+)(?:,|\n)/) || 
                                     item.match(/(?:Company|Employer|Organization):\s*([^\n]+)/i);
        if (genericCompanyMatch) experience.company = (genericCompanyMatch[1] || genericCompanyMatch[2]).trim();

        // Location extraction
        const genericLocationMatch = item.match(/,\s*([^\n]+)\n/) || 
                                      item.match(/(?:Location|Place):\s*([^\n]+)/i);
        if (genericLocationMatch) experience.location = (genericLocationMatch[1] || genericLocationMatch[2]).trim();

        // Date extraction
        const genericDateMatch = item.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\s*[-–]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4}|Present))/) || 
                                  item.match(/(?:Duration|Period|Dates):\s*([^\n]+)/i);
        if (genericDateMatch) {
          const dateStr = genericDateMatch[1] || genericDateMatch[2];
          if (dateStr.includes('-') || dateStr.includes('–')) {
            const dates = dateStr.split(/[-–]/);
            experience.startDate = dates[0].trim();
            experience.endDate = dates[1].trim();
          }
        }

        // Description extraction
        const genericDescMatch = item.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\s*[-–]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4}|Present)[\s\S]*?\n([\s\S]+)$/) || 
                                  item.match(/(?:Description|Responsibilities|Duties):\s*([\s\S]+?)(?=\n\s*\n|$)/i);
        if (genericDescMatch) experience.description = (genericDescMatch[1] || genericDescMatch[2]).trim();

        experiences.push(experience);
      }
  }

  return experiences;
}

/**
 * Extract education from our template
 */
function extractEducationFromTemplate(text: string, templateType: TemplateType): Education[] {
  const educationEntries: Education[] = [];

  // Find the education section
  const educationSectionMatch = text.match(/(?:Education|Academic Background|Qualifications)\s*(?::|\n)\s*([\s\S]*?)(?=\n\s*(?:Skills|Experience|Languages|References|$))/i);

  if (!educationSectionMatch) return educationEntries;

  const educationSection = educationSectionMatch[1];

  // Different parsing logic based on template type
  switch (templateType) {
    case TemplateType.PROFESSIONAL:
    case TemplateType.EXECUTIVE:
    case TemplateType.GRADUATE:
      // These templates usually have a clear structure
      const eduItems = educationSection.split(/\n\s*(?=\d{4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b|\b(?:Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.)\b)/gi);

      for (const item of eduItems) {
        if (item.trim().length < 10) continue;

        const education: Education = {
          degree: '',
          institution: '',
          location: '',
          graduationDate: ''
        };

        // Extract degree
        const degreeMatch = item.match(/^([^\n]+)/);
        if (degreeMatch) education.degree = degreeMatch[1].trim();

        // Extract institution
        const institutionMatch = item.match(/\n([^\n,]+)(?:,|\n)/);
        if (institutionMatch) education.institution = institutionMatch[1].trim();

        // Extract location
        const locationMatch = item.match(/,\s*([^\n]+)\n/);
        if (locationMatch) education.location = locationMatch[1].trim();

        // Extract graduation date
        const gradDateMatch = item.match(/(?:\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b\s*\d{4}|\d{4})/);
        if (gradDateMatch) education.graduationDate = gradDateMatch[0].trim();

        educationEntries.push(education);
      }
      break;

    default:
      // Generic approach for other templates
      const genericEduItems = educationSection.split(/\n\s*(?=\d{4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b|\b(?:Degree|Diploma|Certificate)\b)/gi);

      for (const item of genericEduItems) {
        if (item.trim().length < 10) continue;

        const education: Education = {
          degree: '',
          institution: '',
          location: '',
          graduationDate: ''
        };

        // Extract degree
        const genericDegreeMatch = item.match(/^([^\n]+)/) || 
                                    item.match(/(?:Degree|Diploma|Certificate):\s*([^\n]+)/i);
        if (genericDegreeMatch) education.degree = (genericDegreeMatch[1] || genericDegreeMatch[2]).trim();

        // Extract institution
        const genericInstitutionMatch = item.match(/\n([^\n,]+)(?:,|\n)/) || 
                                         item.match(/(?:Institution|University|College|School):\s*([^\n]+)/i);
        if (genericInstitutionMatch) education.institution = (genericInstitutionMatch[1] || genericInstitutionMatch[2]).trim();

        // Extract location
        const genericLocationMatch = item.match(/,\s*([^\n]+)\n/) || 
                                      item.match(/(?:Location|Place):\s*([^\n]+)/i);
        if (genericLocationMatch) education.location = (genericLocationMatch[1] || genericLocationMatch[2]).trim();

        // Extract graduation date
        const genericGradDateMatch = item.match(/(?:\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b\s*\d{4}|\d{4})/) || 
                                     item.match(/(?:Graduation|Completion):\s*([^\n]+)/i);
        if (genericGradDateMatch) education.graduationDate = (genericGradDateMatch[0] || genericGradDateMatch[1]).trim();

        educationEntries.push(education);
      }
  }

  return educationEntries;
}

/**
 * Extract skills from our template
 */
function extractSkillsFromTemplate(text: string, templateType: TemplateType): string {
  // Find the skills section
  const skillsSectionMatch = text.match(/(?:Skills|Technical Skills|Core Competencies|Key Skills)\s*(?::|\n)\s*([\s\S]*?)(?=\n\s*(?:Languages|References|$))/i);

  if (!skillsSectionMatch) return '';

  const skillsSection = skillsSectionMatch[1].trim();

  // Process skills section based on template
  switch (templateType) {
    case TemplateType.TECHNICAL:
      // Technical template may have categorized skills
      const categories = skillsSection.split(/\n\s*(?=\w+:)/g);
      const technicalSkills: string[] = [];

      for (const category of categories) {
        if (category.includes(':')) {
          const [_, skillsList] = category.split(':', 2);
          if (skillsList) {
            const skills = skillsList.split(/[,•|\n]+/).map(s => s.trim()).filter(Boolean);
            technicalSkills.push(...skills);
          }
        } else {
          const skills = category.split(/[,•|\n]+/).map(s => s.trim()).filter(Boolean);
          technicalSkills.push(...skills);
        }
      }

      return technicalSkills.join(', ');

    default:
      // For other templates, simply clean up the skills section
      return skillsSection
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[•|*-]/g, ',')
        .split(/[,;]+/)
        .map(skill => skill.trim())
        .filter(Boolean)
        .join(', ');
  }
}
