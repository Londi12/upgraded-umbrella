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
// 3. ENGINEERING
// ─────────────────────────────────────────────
const engineeringProfile: SAJobProfile = {
  id: 'engineering',
  family: 'Engineering',
  sector: 'Engineering & Construction',
  description: 'Covers civil, mechanical, electrical, chemical, industrial, and mining engineering across SA industries.',
  typicalTitles: [
    'Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Chemical Engineer',
    'Industrial Engineer', 'Structural Engineer', 'Mining Engineer', 'Metallurgical Engineer',
    'Project Engineer', 'Site Engineer', 'Design Engineer', 'Process Engineer',
    'Engineering Manager', 'Technical Manager', 'Plant Manager', 'Operations Engineer',
    'Maintenance Engineer', 'Reliability Engineer', 'Quality Engineer', 'Safety Engineer',
    'Draughtsman', 'Technician', 'Engineering Technologist', 'Graduate Engineer'
  ],
  experienceTiers: [
    {
      level: 'junior',
      minYears: 0,
      maxYears: 3,
      typicalTitles: ['Graduate Engineer', 'Junior Engineer', 'Engineering Trainee', 'Draughtsman', 'Technician']
    },
    {
      level: 'mid',
      minYears: 3,
      maxYears: 8,
      typicalTitles: ['Engineer', 'Project Engineer', 'Design Engineer', 'Process Engineer', 'Site Engineer', 'Engineering Technologist']
    },
    {
      level: 'senior',
      minYears: 8,
      maxYears: 15,
      typicalTitles: ['Senior Engineer', 'Principal Engineer', 'Lead Engineer', 'Engineering Manager', 'Technical Manager']
    },
    {
      level: 'executive',
      minYears: 15,
      maxYears: 99,
      typicalTitles: ['Plant Manager', 'Operations Director', 'Chief Engineer', 'Technical Director', 'VP Engineering']
    }
  ],
  minNQF: 6,
  preferredNQF: 7,
  acceptedQualifications: [
    'BEng Civil', 'BEng Mechanical', 'BEng Electrical', 'BEng Chemical', 'BEng Industrial',
    'BSc Engineering', 'BTech Engineering', 'National Diploma Engineering',
    'BEng Mining', 'BEng Metallurgical', 'BEng Structural',
    'MEng', 'MSc Engineering', 'MBA'
  ],
  professionalRegistrations: [
    {
      name: 'Professional Engineer (Pr.Eng)',
      body: 'ECSA',
      required: false,
      applicableRoles: ['Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Chemical Engineer', 'Structural Engineer']
    },
    {
      name: 'Engineering Technologist (Pr.Tech.Eng)',
      body: 'ECSA',
      required: false,
      applicableRoles: ['Engineering Technologist', 'Technical Manager']
    },
    {
      name: 'Engineering Technician (Pr.Techni.Eng)',
      body: 'ECSA',
      required: false,
      applicableRoles: ['Engineering Technician', 'Draughtsman']
    },
    {
      name: 'Professional Construction Manager',
      body: 'SACPCMP',
      required: false,
      applicableRoles: ['Construction Manager', 'Site Manager', 'Project Manager']
    },
    {
      name: 'Mine Manager Certificate of Competency',
      body: 'DMRE',
      required: true,
      applicableRoles: ['Mine Manager', 'Mining Engineer']
    }
  ],
  coreSkills: {
    technical: [
      'AutoCAD', 'SolidWorks', 'CATIA', 'Revit', 'Civil 3D', 'STAAD Pro',
      'Project Management', 'Technical Drawing', 'Structural Analysis',
      'Process Design', 'Plant Maintenance', 'Quality Control', 'ISO Standards',
      'SANS Standards', 'OHS Act', 'MHSA', 'Risk Assessment', 'HAZOP',
      'Commissioning', 'Procurement', 'Contract Management', 'NEC', 'FIDIC'
    ],
    soft: [
      'Problem Solving', 'Analytical Thinking', 'Project Management',
      'Leadership', 'Communication', 'Attention to Detail', 'Safety Conscious'
    ],
    tools: [
      'AutoCAD', 'SolidWorks', 'Revit', 'MS Project', 'Primavera P6',
      'SAP PM', 'CMMS', 'MATLAB', 'ANSYS', 'Civil 3D'
    ]
  },
  industryKeywords: [
    'engineering', 'design', 'construction', 'commissioning', 'maintenance',
    'plant', 'site', 'project', 'technical', 'specifications', 'drawings',
    'ohs act', 'mhsa', 'iso 9001', 'sans', 'nec contract', 'fidic',
    'bill of quantities', 'boq', 'tender', 'procurement', 'epc'
  ],
  saSpecificFlags: {
    eePreferred: true,
    driversLicenceRequired: true,
    citizenshipRequired: false,
    securityClearance: false,
    ownVehicleRequired: true,
    bilingualAdvantage: false,
    notes: [
      'ECSA registration (Pr.Eng) is the gold standard — required for signing off designs',
      'OHS Act and MHSA compliance knowledge mandatory for site-based roles',
      'Mining engineering roles require DMRE Certificate of Competency',
      'SANS and SABS standards knowledge expected for SA-based design work',
      'Driver\'s licence and own vehicle commonly required for site visits',
      'NEC and FIDIC contract knowledge valued in infrastructure projects'
    ]
  },
  gapPenalties: [
    { skill: 'ECSA', weight: 0.7, message: 'ECSA registration (Pr.Eng) is required or strongly preferred for senior engineering roles in SA' },
    { skill: 'AutoCAD', weight: 0.6, message: 'AutoCAD or equivalent CAD software is a baseline requirement for most engineering roles' },
    { skill: 'OHS Act', weight: 0.7, message: 'OHS Act knowledge is mandatory for site-based engineering roles in SA' },
    { skill: 'Project Management', weight: 0.5, message: 'Project management skills are expected at mid-senior engineering level' },
    { skill: 'Driver\'s Licence', weight: 0.6, message: 'Valid driver\'s licence is required for most site-based engineering roles' }
  ],
  detectionKeywords: [
    'engineer', 'engineering', 'civil', 'mechanical', 'electrical', 'chemical',
    'structural', 'industrial', 'mining engineer', 'process engineer',
    'autocad', 'solidworks', 'revit', 'ecsa', 'pr.eng', 'beng', 'bsc eng',
    'plant', 'site engineer', 'commissioning', 'maintenance engineer',
    'ohs', 'mhsa', 'draughtsman', 'technician', 'technologist'
  ]
}

// ─────────────────────────────────────────────
// 4. HEALTHCARE
// ─────────────────────────────────────────────
const healthcareProfile: SAJobProfile = {
  id: 'healthcare',
  family: 'Healthcare',
  sector: 'Health & Medical',
  description: 'Covers medical, nursing, pharmacy, allied health, and healthcare management roles across SA public and private sectors.',
  typicalTitles: [
    'Medical Doctor', 'General Practitioner', 'Specialist', 'Registrar',
    'Registered Nurse', 'Professional Nurse', 'Staff Nurse', 'Enrolled Nurse',
    'Pharmacist', 'Pharmacy Manager', 'Pharmacist\'s Assistant',
    'Physiotherapist', 'Occupational Therapist', 'Speech Therapist',
    'Radiographer', 'Sonographer', 'Medical Technologist', 'Biomedical Technologist',
    'Dietitian', 'Social Worker', 'Clinical Psychologist', 'Counsellor',
    'Theatre Nurse', 'ICU Nurse', 'Midwife', 'Community Health Worker',
    'Hospital Manager', 'Clinical Manager', 'Ward Manager', 'Practice Manager'
  ],
  experienceTiers: [
    {
      level: 'junior',
      minYears: 0,
      maxYears: 3,
      typicalTitles: ['Community Service Doctor', 'Junior Doctor', 'Staff Nurse', 'Enrolled Nurse', 'Intern Pharmacist', 'Graduate Physiotherapist']
    },
    {
      level: 'mid',
      minYears: 3,
      maxYears: 8,
      typicalTitles: ['General Practitioner', 'Registered Nurse', 'Pharmacist', 'Physiotherapist', 'Occupational Therapist', 'Radiographer']
    },
    {
      level: 'senior',
      minYears: 8,
      maxYears: 15,
      typicalTitles: ['Senior Nurse', 'Ward Manager', 'Pharmacy Manager', 'Senior Physiotherapist', 'Registrar', 'Clinical Specialist']
    },
    {
      level: 'executive',
      minYears: 12,
      maxYears: 99,
      typicalTitles: ['Hospital Manager', 'Clinical Manager', 'Medical Director', 'Chief Medical Officer', 'Head of Department']
    }
  ],
  minNQF: 6,
  preferredNQF: 7,
  acceptedQualifications: [
    'MBChB', 'MBBCh', 'Bachelor of Nursing', 'BCur', 'BPharm',
    'BSc Physiotherapy', 'BSc Occupational Therapy', 'BSc Radiography',
    'BSc Medical Technology', 'BSc Dietetics', 'BSocSci Social Work',
    'BA Psychology', 'MA Clinical Psychology', 'PhD',
    'Diploma Nursing', 'Diploma Midwifery'
  ],
  professionalRegistrations: [
    {
      name: 'HPCSA Registration',
      body: 'HPCSA',
      required: true,
      applicableRoles: ['Medical Doctor', 'Physiotherapist', 'Occupational Therapist', 'Radiographer', 'Dietitian', 'Clinical Psychologist']
    },
    {
      name: 'SANC Registration',
      body: 'SANC',
      required: true,
      applicableRoles: ['Registered Nurse', 'Professional Nurse', 'Midwife', 'Enrolled Nurse']
    },
    {
      name: 'SAPC Registration',
      body: 'SAPC',
      required: true,
      applicableRoles: ['Pharmacist', 'Pharmacy Manager', 'Pharmacist\'s Assistant']
    },
    {
      name: 'SACSSP Registration',
      body: 'SACSSP',
      required: true,
      applicableRoles: ['Social Worker', 'Counsellor']
    }
  ],
  coreSkills: {
    technical: [
      'Patient Assessment', 'Clinical Diagnosis', 'Treatment Planning',
      'Medication Administration', 'Wound Care', 'IV Therapy', 'CPR/BLS',
      'ACLS', 'Theatre Procedures', 'ICU Care', 'Infection Control',
      'Medical Records', 'ICD-10 Coding', 'Clinical Governance',
      'Dispensing', 'Pharmacovigilance', 'Drug Interactions'
    ],
    soft: [
      'Empathy', 'Communication', 'Attention to Detail', 'Stress Management',
      'Teamwork', 'Ethical Practice', 'Cultural Sensitivity', 'Resilience'
    ],
    tools: [
      'MEDITECH', 'SAP Healthcare', 'GoodX', 'Elixir', 'Nexus',
      'PACS', 'EMR Systems', 'Dispensing Software'
    ]
  },
  industryKeywords: [
    'patient care', 'clinical', 'medical', 'nursing', 'pharmacy', 'diagnosis',
    'treatment', 'ward', 'theatre', 'icu', 'emergency', 'outpatient',
    'hpcsa', 'sanc', 'sapc', 'community service', 'public health',
    'nhi', 'national health insurance', 'doh', 'department of health',
    'private hospital', 'netcare', 'mediclinic', 'life healthcare'
  ],
  saSpecificFlags: {
    eePreferred: true,
    driversLicenceRequired: false,
    citizenshipRequired: false,
    securityClearance: false,
    ownVehicleRequired: false,
    bilingualAdvantage: true,
    notes: [
      'HPCSA/SANC/SAPC registration is non-negotiable — unregistered practitioners cannot legally practice',
      'Community service year is compulsory for all SA-trained health professionals',
      'NHI implementation will significantly reshape public sector healthcare roles',
      'Bilingual ability (especially isiZulu, Sesotho, Afrikaans) is a strong advantage in public sector',
      'Foreign-qualified health professionals must have HPCSA/SANC equivalence assessment',
      'PMDS (Performance Management) knowledge required for public sector roles'
    ]
  },
  gapPenalties: [
    { skill: 'HPCSA', weight: 1.0, message: 'HPCSA registration is legally required to practice — this is a hard requirement' },
    { skill: 'SANC', weight: 1.0, message: 'SANC registration is legally required for all nursing roles in SA' },
    { skill: 'SAPC', weight: 1.0, message: 'SAPC registration is legally required for all pharmacy roles in SA' },
    { skill: 'BLS/CPR', weight: 0.7, message: 'Basic Life Support certification is expected for all clinical roles' },
    { skill: 'ICD-10', weight: 0.5, message: 'ICD-10 coding knowledge is required for billing and medical records roles' }
  ],
  detectionKeywords: [
    'nurse', 'nursing', 'doctor', 'physician', 'pharmacist', 'pharmacy',
    'physiotherapist', 'occupational therapist', 'radiographer', 'dietitian',
    'social worker', 'psychologist', 'hpcsa', 'sanc', 'sapc', 'mbchb',
    'clinical', 'patient', 'ward', 'theatre', 'icu', 'hospital',
    'medical', 'healthcare', 'health', 'midwife', 'community service',
    'netcare', 'mediclinic', 'life healthcare', 'department of health'
  ]
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
export const SA_JOB_PROFILES: SAJobProfile[] = [
  financeProfile,
  techProfile,
  engineeringProfile,
  healthcareProfile,
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
