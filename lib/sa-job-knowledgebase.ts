/**
 * SA Job Family Knowledgebase
 * Reference profiles for South African job market intelligence.
 * Used by CV parser, job matcher, and ATS scorer.
 */

export type SeniorityTier = 'junior' | 'mid' | 'senior' | 'executive'

export interface ExperienceTier {
  level: SeniorityTier
  minYears: number
  maxYears: number
  typicalTitles: string[]
}

export interface SAJobProfile {
  id: string
  family: string
  sector: string
  description: string
  typicalTitles: string[]
  experienceTiers: ExperienceTier[]
  minNQF: number
  preferredNQF: number
  acceptedQualifications: string[]
  professionalRegistrations: {
    name: string
    body: string
    required: boolean
    applicableRoles?: string[]
  }[]
  coreSkills: {
    technical: string[]
    soft: string[]
    tools: string[]
  }
  industryKeywords: string[]
  saSpecificFlags: {
    eePreferred: boolean
    driversLicenceRequired: boolean
    citizenshipRequired: boolean
    securityClearance: boolean
    ownVehicleRequired: boolean
    bilingualAdvantage: boolean
    notes: string[]
  }
  gapPenalties: {
    skill: string
    weight: number // 0-1, how critical this gap is
    message: string
  }[]
  detectionKeywords: string[] // used to classify a CV into this family
}

// ─────────────────────────────────────────────
// 1. FINANCE & ACCOUNTING
// ─────────────────────────────────────────────
const financeProfile: SAJobProfile = {
  id: 'finance',
  family: 'Finance & Accounting',
  sector: 'Financial Services',
  description: 'Covers accounting, auditing, financial management, tax, and treasury roles across all SA industries.',
  typicalTitles: [
    'Accountant', 'Financial Accountant', 'Management Accountant', 'Cost Accountant',
    'Financial Analyst', 'Finance Manager', 'CFO', 'Chief Financial Officer',
    'Auditor', 'Internal Auditor', 'External Auditor', 'Tax Consultant', 'Tax Manager',
    'Bookkeeper', 'Creditors Clerk', 'Debtors Clerk', 'Payroll Administrator',
    'Treasury Analyst', 'Treasury Manager', 'Financial Controller', 'Group Accountant',
    'CA(SA)', 'Chartered Accountant', 'CIMA', 'CFA', 'Financial Director'
  ],
  experienceTiers: [
    {
      level: 'junior',
      minYears: 0,
      maxYears: 3,
      typicalTitles: ['Bookkeeper', 'Creditors Clerk', 'Debtors Clerk', 'Junior Accountant', 'Payroll Administrator', 'Finance Graduate']
    },
    {
      level: 'mid',
      minYears: 3,
      maxYears: 7,
      typicalTitles: ['Accountant', 'Financial Accountant', 'Management Accountant', 'Financial Analyst', 'Tax Consultant', 'Internal Auditor']
    },
    {
      level: 'senior',
      minYears: 7,
      maxYears: 15,
      typicalTitles: ['Senior Accountant', 'Finance Manager', 'Financial Controller', 'Group Accountant', 'Senior Auditor', 'Tax Manager']
    },
    {
      level: 'executive',
      minYears: 12,
      maxYears: 99,
      typicalTitles: ['CFO', 'Financial Director', 'Chief Financial Officer', 'Group CFO', 'Head of Finance']
    }
  ],
  minNQF: 6,
  preferredNQF: 7,
  acceptedQualifications: [
    'BCom Accounting', 'BCom Finance', 'BCom Financial Management',
    'National Diploma Accounting', 'BTech Accounting',
    'CA(SA)', 'CIMA', 'ACCA', 'CFA', 'MBA',
    'BCom Honours Accounting', 'MCom'
  ],
  professionalRegistrations: [
    {
      name: 'CA(SA)',
      body: 'SAICA',
      required: false,
      applicableRoles: ['Chartered Accountant', 'Auditor', 'CFO', 'Financial Director', 'Group Accountant']
    },
    {
      name: 'CIMA',
      body: 'Chartered Institute of Management Accountants',
      required: false,
      applicableRoles: ['Management Accountant', 'Finance Manager', 'CFO']
    },
    {
      name: 'ACCA',
      body: 'Association of Chartered Certified Accountants',
      required: false,
      applicableRoles: ['Accountant', 'Auditor', 'Financial Analyst']
    },
    {
      name: 'Registered Auditor',
      body: 'IRBA',
      required: true,
      applicableRoles: ['External Auditor', 'Audit Manager', 'Audit Partner']
    },
    {
      name: 'Tax Practitioner',
      body: 'SARS',
      required: false,
      applicableRoles: ['Tax Consultant', 'Tax Manager', 'Tax Advisor']
    }
  ],
  coreSkills: {
    technical: [
      'IFRS', 'GAAP', 'Financial Reporting', 'Management Accounts', 'Budgeting',
      'Forecasting', 'Financial Analysis', 'Variance Analysis', 'Cash Flow Management',
      'Tax Compliance', 'VAT', 'PAYE', 'Audit', 'Internal Controls', 'Reconciliations',
      'Fixed Assets', 'Cost Accounting', 'Treasury', 'Financial Modelling'
    ],
    soft: [
      'Attention to Detail', 'Analytical Thinking', 'Problem Solving',
      'Communication', 'Integrity', 'Time Management', 'Deadline Driven'
    ],
    tools: [
      'SAP', 'Sage', 'Pastel', 'Xero', 'QuickBooks', 'Oracle Financials',
      'Microsoft Excel', 'Power BI', 'Hyperion', 'Caseware', 'Accpac'
    ]
  },
  industryKeywords: [
    'financial statements', 'trial balance', 'general ledger', 'accounts payable',
    'accounts receivable', 'month-end', 'year-end', 'audit trail', 'consolidation',
    'intercompany', 'working capital', 'capex', 'opex', 'ebitda', 'roi',
    'sars', 'efiling', 'vat returns', 'tax returns', 'statutory compliance'
  ],
  saSpecificFlags: {
    eePreferred: true,
    driversLicenceRequired: false,
    citizenshipRequired: false,
    securityClearance: false,
    ownVehicleRequired: false,
    bilingualAdvantage: false,
    notes: [
      'CA(SA) is the gold standard qualification — commands significant salary premium',
      'SAICA articles (3 years) are highly valued even without completed CA(SA)',
      'B-BBEE reporting knowledge increasingly required at senior level',
      'King IV governance knowledge required for listed company roles',
      'SARS eFiling proficiency expected at all levels'
    ]
  },
  gapPenalties: [
    { skill: 'IFRS', weight: 0.8, message: 'IFRS knowledge is required for most financial reporting roles in SA' },
    { skill: 'CA(SA)', weight: 0.6, message: 'CA(SA) is required or strongly preferred for senior finance roles' },
    { skill: 'SAP', weight: 0.5, message: 'SAP experience is expected in most large corporate finance environments' },
    { skill: 'Excel', weight: 0.7, message: 'Advanced Excel is a baseline requirement for financial analysis roles' },
    { skill: 'Tax Compliance', weight: 0.6, message: 'SARS compliance knowledge is expected at mid-senior level' }
  ],
  detectionKeywords: [
    'accountant', 'accounting', 'finance', 'financial', 'audit', 'auditor',
    'bookkeeper', 'bookkeeping', 'tax', 'ifrs', 'gaap', 'ca(sa)', 'saica',
    'cima', 'acca', 'cfa', 'payroll', 'creditors', 'debtors', 'treasury',
    'budgeting', 'forecasting', 'financial statements', 'general ledger',
    'sage', 'pastel', 'xero', 'sap fi', 'cfo', 'financial director'
  ]
}

// ─────────────────────────────────────────────
// 2. INFORMATION TECHNOLOGY
// ─────────────────────────────────────────────
const techProfile: SAJobProfile = {
  id: 'tech',
  family: 'Information Technology',
  sector: 'Technology',
  description: 'Covers software development, infrastructure, data, cybersecurity, and IT management across all SA industries.',
  typicalTitles: [
    'Software Developer', 'Software Engineer', 'Full Stack Developer', 'Frontend Developer',
    'Backend Developer', 'Mobile Developer', 'DevOps Engineer', 'Cloud Engineer',
    'Data Engineer', 'Data Scientist', 'Data Analyst', 'Business Intelligence Developer',
    'Systems Analyst', 'Business Analyst', 'IT Manager', 'IT Director', 'CTO',
    'Network Engineer', 'Systems Administrator', 'Database Administrator', 'DBA',
    'Cybersecurity Analyst', 'Security Engineer', 'QA Engineer', 'Test Analyst',
    'Scrum Master', 'Product Owner', 'Technical Lead', 'Solutions Architect',
    'Enterprise Architect', 'IT Support Technician', 'Help Desk Analyst'
  ],
  experienceTiers: [
    {
      level: 'junior',
      minYears: 0,
      maxYears: 3,
      typicalTitles: ['Junior Developer', 'Graduate Developer', 'IT Support Technician', 'Help Desk Analyst', 'Junior QA', 'Junior Data Analyst']
    },
    {
      level: 'mid',
      minYears: 3,
      maxYears: 7,
      typicalTitles: ['Software Developer', 'Systems Analyst', 'Data Analyst', 'Network Engineer', 'DevOps Engineer', 'Business Analyst']
    },
    {
      level: 'senior',
      minYears: 7,
      maxYears: 15,
      typicalTitles: ['Senior Developer', 'Technical Lead', 'Solutions Architect', 'Senior Data Engineer', 'IT Manager', 'Security Engineer']
    },
    {
      level: 'executive',
      minYears: 12,
      maxYears: 99,
      typicalTitles: ['CTO', 'IT Director', 'Head of Technology', 'Enterprise Architect', 'Chief Digital Officer']
    }
  ],
  minNQF: 6,
  preferredNQF: 7,
  acceptedQualifications: [
    'BSc Computer Science', 'BSc Information Technology', 'BCom Information Systems',
    'National Diploma IT', 'BTech IT', 'BSc Software Engineering',
    'BSc Data Science', 'BCom Business Informatics',
    'AWS Certification', 'Microsoft Azure Certification', 'Google Cloud Certification',
    'CISSP', 'CompTIA', 'MCSE', 'CCNA', 'Certified Scrum Master'
  ],
  professionalRegistrations: [
    {
      name: 'ECSA Registration',
      body: 'ECSA',
      required: false,
      applicableRoles: ['Software Engineer', 'Systems Engineer', 'Solutions Architect']
    },
    {
      name: 'AWS Certified',
      body: 'Amazon Web Services',
      required: false,
      applicableRoles: ['Cloud Engineer', 'DevOps Engineer', 'Solutions Architect']
    },
    {
      name: 'CISSP',
      body: 'ISC2',
      required: false,
      applicableRoles: ['Cybersecurity Analyst', 'Security Engineer', 'CISO']
    }
  ],
  coreSkills: {
    technical: [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'SQL',
      'React', 'Angular', 'Vue', 'Node.js', 'REST APIs', 'GraphQL',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD',
      'Git', 'Agile', 'Scrum', 'DevOps', 'Linux', 'Networking',
      'Machine Learning', 'Data Analysis', 'Power BI', 'Tableau'
    ],
    soft: [
      'Problem Solving', 'Analytical Thinking', 'Communication',
      'Teamwork', 'Adaptability', 'Continuous Learning', 'Attention to Detail'
    ],
    tools: [
      'Git', 'GitHub', 'GitLab', 'Jira', 'Confluence', 'VS Code',
      'IntelliJ', 'Postman', 'Jenkins', 'Terraform', 'Ansible',
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch'
    ]
  },
  industryKeywords: [
    'software development', 'agile', 'scrum', 'sprint', 'microservices',
    'api', 'cloud', 'devops', 'ci/cd', 'deployment', 'infrastructure',
    'database', 'backend', 'frontend', 'full stack', 'mobile app',
    'cybersecurity', 'data pipeline', 'machine learning', 'ai',
    'sdlc', 'code review', 'unit testing', 'integration testing'
  ],
  saSpecificFlags: {
    eePreferred: true,
    driversLicenceRequired: false,
    citizenshipRequired: false,
    securityClearance: false,
    ownVehicleRequired: false,
    bilingualAdvantage: false,
    notes: [
      'SA tech market heavily influenced by financial services, mining, and retail sectors',
      'Remote work widely accepted — location less of a barrier than other sectors',
      'POPIA compliance knowledge increasingly required for data roles',
      'B-BBEE IT spend targets drive EE preference in large corporates',
      'Fintech is the fastest growing SA tech subsector — financial domain knowledge is a bonus',
      'SITA (State IT Agency) roles require SA citizenship'
    ]
  },
  gapPenalties: [
    { skill: 'Cloud', weight: 0.7, message: 'Cloud experience (AWS/Azure/GCP) is expected for most mid-senior tech roles in SA' },
    { skill: 'Agile', weight: 0.6, message: 'Agile/Scrum methodology is standard in SA tech teams' },
    { skill: 'Git', weight: 0.8, message: 'Version control (Git) is a baseline requirement for all developer roles' },
    { skill: 'SQL', weight: 0.7, message: 'SQL proficiency is expected across most tech roles including non-DBA positions' },
    { skill: 'POPIA', weight: 0.4, message: 'POPIA compliance awareness is increasingly required for data-handling roles' }
  ],
  detectionKeywords: [
    'developer', 'software', 'programming', 'coding', 'javascript', 'python',
    'java', 'react', 'angular', 'node', 'api', 'database', 'sql', 'cloud',
    'aws', 'azure', 'devops', 'agile', 'scrum', 'git', 'github', 'linux',
    'network', 'cybersecurity', 'data science', 'machine learning', 'ai',
    'it manager', 'systems analyst', 'business analyst', 'cto', 'tech lead',
    'full stack', 'backend', 'frontend', 'mobile', 'android', 'ios'
  ]
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
export const SA_JOB_PROFILES: SAJobProfile[] = [
  financeProfile,
  techProfile,
]

export const getProfileById = (id: string): SAJobProfile | undefined =>
  SA_JOB_PROFILES.find(p => p.id === id)

export const getProfileByFamily = (family: string): SAJobProfile | undefined =>
  SA_JOB_PROFILES.find(p => p.family.toLowerCase() === family.toLowerCase())

/**
 * Detect which job family a piece of text most likely belongs to.
 * Returns scored matches sorted by confidence.
 */
export const detectJobFamily = (text: string): { profile: SAJobProfile, score: number, confidence: 'high' | 'medium' | 'low' }[] => {
  const lower = text.toLowerCase()
  const results = SA_JOB_PROFILES.map(profile => {
    const matches = profile.detectionKeywords.filter(kw => lower.includes(kw))
    const score = matches.length / profile.detectionKeywords.length
    return {
      profile,
      score,
      confidence: score >= 0.25 ? 'high' : score >= 0.12 ? 'medium' : 'low' as 'high' | 'medium' | 'low'
    }
  })
  return results.sort((a, b) => b.score - a.score)
}
