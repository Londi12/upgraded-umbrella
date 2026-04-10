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
// 5. MINING
// ─────────────────────────────────────────────
const miningProfile: SAJobProfile = {
  id: 'mining',
  family: 'Mining',
  sector: 'Mining & Resources',
  description: 'Covers mining engineering, geology, metallurgy, mine management, and safety roles in SA\'s gold, platinum, coal, iron ore, and diamond sectors.',
  typicalTitles: [
    'Mining Engineer', 'Mine Manager', 'Mine Overseer', 'Shift Boss',
    'Rock Engineer', 'Rock Mechanics Engineer', 'Geologist', 'Senior Geologist',
    'Metallurgical Engineer', 'Metallurgist', 'Process Engineer', 'Plant Metallurgist',
    'Mine Surveyor', 'Survey Manager', 'Ventilation Engineer', 'Ventilation Officer',
    'Safety Officer', 'Safety Manager', 'SHEQ Manager', 'Environmental Manager',
    'Production Manager', 'Underground Manager', 'Open Cast Manager',
    'Drill and Blast Engineer', 'Blasting Foreman', 'Mining Foreman',
    'Mineral Resource Manager', 'Competent Person', 'Technical Services Manager'
  ],
  experienceTiers: [
    {
      level: 'junior',
      minYears: 0,
      maxYears: 3,
      typicalTitles: ['Graduate Mining Engineer', 'Junior Geologist', 'Mining Trainee', 'Learner Miner', 'Junior Metallurgist']
    },
    {
      level: 'mid',
      minYears: 3,
      maxYears: 8,
      typicalTitles: ['Mining Engineer', 'Geologist', 'Metallurgist', 'Shift Boss', 'Mine Surveyor', 'Safety Officer']
    },
    {
      level: 'senior',
      minYears: 8,
      maxYears: 15,
      typicalTitles: ['Senior Mining Engineer', 'Rock Engineer', 'Mine Overseer', 'Production Manager', 'Technical Services Manager', 'SHEQ Manager']
    },
    {
      level: 'executive',
      minYears: 15,
      maxYears: 99,
      typicalTitles: ['Mine Manager', 'General Manager', 'VP Mining', 'Chief Mining Officer', 'Mineral Resource Manager']
    }
  ],
  minNQF: 7,
  preferredNQF: 7,
  acceptedQualifications: [
    'BEng Mining Engineering', 'BSc Mining Engineering',
    'BEng Metallurgical Engineering', 'BSc Geology', 'BSc Geological Sciences',
    'BEng Rock Engineering', 'BSc Rock Engineering',
    'National Certificate Rock Breaking', 'Blasting Certificate',
    'Mine Overseer Certificate', 'Mine Manager Certificate of Competency',
    'BTech Mining', 'National Diploma Mining'
  ],
  professionalRegistrations: [
    {
      name: 'Pr.Eng (Mining)',
      body: 'ECSA',
      required: false,
      applicableRoles: ['Mining Engineer', 'Rock Engineer', 'Metallurgical Engineer']
    },
    {
      name: 'Mine Manager Certificate of Competency',
      body: 'DMRE',
      required: true,
      applicableRoles: ['Mine Manager', 'Underground Manager', 'Open Cast Manager']
    },
    {
      name: 'Mine Overseer Certificate',
      body: 'DMRE',
      required: true,
      applicableRoles: ['Mine Overseer', 'Shift Boss']
    },
    {
      name: 'Blasting Certificate',
      body: 'DMRE',
      required: true,
      applicableRoles: ['Blasting Foreman', 'Drill and Blast Engineer', 'Shift Boss']
    },
    {
      name: 'Rock Engineering Certificate',
      body: 'SANIRE',
      required: false,
      applicableRoles: ['Rock Engineer', 'Rock Mechanics Engineer']
    },
    {
      name: 'Professional Natural Scientist',
      body: 'SACNASP',
      required: false,
      applicableRoles: ['Geologist', 'Senior Geologist', 'Mineral Resource Manager']
    }
  ],
  coreSkills: {
    technical: [
      'MHSA', 'Mine Health and Safety Act', 'Section 54', 'Section 55',
      'Stope Design', 'Drill and Blast', 'Rock Mechanics', 'Ground Control',
      'Ventilation Design', 'Mine Planning', 'Reserve Estimation',
      'Mineral Resource Management', 'SAMREC', 'JORC',
      'Metallurgical Process', 'Comminution', 'Flotation', 'Leaching',
      'Mine Surveying', 'Geotechnical Assessment', 'Environmental Management',
      'SHEQ', 'Risk Assessment', 'Incident Investigation'
    ],
    soft: [
      'Safety Leadership', 'Decision Making Under Pressure', 'Team Management',
      'Communication', 'Problem Solving', 'Attention to Detail', 'Accountability'
    ],
    tools: [
      'Surpac', 'Datamine', 'Vulcan', 'Deswik', 'MineSight',
      'AutoCAD', 'Micromine', 'Leapfrog', 'FLAC', 'Phase2',
      'SAP PM', 'JDE', 'Isometrix'
    ]
  },
  industryKeywords: [
    'underground', 'open cast', 'open pit', 'stope', 'shaft', 'decline',
    'reef', 'ore body', 'grade', 'recovery', 'milling', 'crushing',
    'mhsa', 'dmre', 'section 54', 'section 55', 'lta', 'fatality',
    'gold', 'platinum', 'pgm', 'coal', 'iron ore', 'chrome', 'manganese',
    'anglogold', 'impala', 'sibanye', 'kumba', 'exxaro', 'glencore',
    'samrec', 'jorc', 'competent person', 'mineral resource'
  ],
  saSpecificFlags: {
    eePreferred: true,
    driversLicenceRequired: true,
    citizenshipRequired: false,
    securityClearance: false,
    ownVehicleRequired: false,
    bilingualAdvantage: false,
    notes: [
      'MHSA compliance is non-negotiable — all site roles require demonstrated knowledge',
      'DMRE Certificates of Competency are legally required for Mine Manager and Overseer roles',
      'Section 54 and 55 stoppages knowledge is expected at all supervisory levels',
      'SAMREC/JORC code knowledge required for Competent Person and Resource Manager roles',
      'Most SA mining operations are in Limpopo, Mpumalanga, North West, Northern Cape',
      'Accommodation provided on many mine sites — willingness to be site-based is critical',
      'Safety record (LTI-free) is actively screened — incidents must be disclosed',
      'NOTE: Profile accuracy should be validated with practising mining engineers before production use'
    ]
  },
  gapPenalties: [
    { skill: 'MHSA', weight: 1.0, message: 'MHSA knowledge is legally required for all supervisory mining roles in SA — this is a hard requirement' },
    { skill: 'DMRE Certificate', weight: 0.9, message: 'DMRE Certificate of Competency is legally required for Mine Manager and Overseer roles' },
    { skill: 'Mine Planning', weight: 0.7, message: 'Mine planning experience is expected for mid-senior mining engineering roles' },
    { skill: 'Surpac', weight: 0.5, message: 'Surpac or equivalent mine planning software is standard in SA mining operations' },
    { skill: 'Rock Mechanics', weight: 0.6, message: 'Rock mechanics knowledge is critical for underground mining roles' }
  ],
  detectionKeywords: [
    'mining', 'mine', 'underground', 'open cast', 'open pit', 'shaft',
    'mining engineer', 'mine manager', 'mine overseer', 'shift boss',
    'geologist', 'geology', 'metallurgist', 'metallurgy', 'rock engineer',
    'mhsa', 'dmre', 'blasting', 'drill', 'stope', 'reef', 'ore',
    'surpac', 'datamine', 'vulcan', 'deswik', 'micromine',
    'gold', 'platinum', 'pgm', 'coal', 'iron ore', 'chrome',
    'anglogold', 'impala', 'sibanye', 'kumba', 'exxaro',
    'samrec', 'jorc', 'competent person', 'mineral resource'
  ]
}

// ─────────────────────────────────────────────
// 6. RETAIL & FMCG
// ─────────────────────────────────────────────
const retailProfile: SAJobProfile = {
  id: 'retail',
  family: 'Retail & FMCG',
  sector: 'Retail & Consumer Goods',
  description: 'Covers store management, merchandising, buying, supply chain, and FMCG sales roles across SA\'s large retail and consumer goods sector.',
  typicalTitles: [
    'Store Manager', 'Assistant Store Manager', 'Branch Manager', 'Area Manager',
    'Regional Manager', 'Retail Manager', 'Floor Manager', 'Department Manager',
    'Buyer', 'Senior Buyer', 'Assistant Buyer', 'Category Manager',
    'Merchandiser', 'Visual Merchandiser', 'Merchandise Planner',
    'Sales Representative', 'Key Account Manager', 'Trade Marketing Manager',
    'FMCG Sales Manager', 'National Sales Manager', 'Territory Manager',
    'Supply Chain Manager', 'Demand Planner', 'Replenishment Analyst',
    'Loss Prevention Manager', 'Shrinkage Controller'
  ],
  experienceTiers: [
    {
      level: 'junior',
      minYears: 0,
      maxYears: 2,
      typicalTitles: ['Sales Assistant', 'Cashier Supervisor', 'Junior Merchandiser', 'Graduate Buyer', 'Trainee Manager']
    },
    {
      level: 'mid',
      minYears: 2,
      maxYears: 6,
      typicalTitles: ['Store Manager', 'Buyer', 'Merchandiser', 'Sales Representative', 'Key Account Manager', 'Department Manager']
    },
    {
      level: 'senior',
      minYears: 6,
      maxYears: 12,
      typicalTitles: ['Senior Buyer', 'Area Manager', 'Category Manager', 'FMCG Sales Manager', 'Supply Chain Manager']
    },
    {
      level: 'executive',
      minYears: 12,
      maxYears: 99,
      typicalTitles: ['Regional Manager', 'National Sales Manager', 'Head of Buying', 'Retail Director', 'Commercial Director']
    }
  ],
  minNQF: 5,
  preferredNQF: 6,
  acceptedQualifications: [
    'Matric', 'National Certificate Retail', 'National Diploma Retail Management',
    'BCom Marketing', 'BCom Business Management', 'BCom Supply Chain',
    'National Diploma Marketing', 'National Diploma Business Administration',
    'BTech Retail Business Management', 'MBA'
  ],
  professionalRegistrations: [
    {
      name: 'FMCG Forum Membership',
      body: 'Consumer Goods Council of SA',
      required: false,
      applicableRoles: ['FMCG Sales Manager', 'National Sales Manager', 'Key Account Manager']
    }
  ],
  coreSkills: {
    technical: [
      'Stock Management', 'Inventory Control', 'Shrinkage Control', 'Loss Prevention',
      'Merchandising', 'Planogram', 'Category Management', 'Buying',
      'Sales Targets', 'KPI Management', 'P&L Management', 'Budgeting',
      'Customer Service', 'Staff Management', 'Scheduling', 'Payroll',
      'Supply Chain', 'Demand Planning', 'Replenishment', 'Vendor Management',
      'Trade Marketing', 'Promotions', 'Pricing Strategy'
    ],
    soft: [
      'Customer Focus', 'Leadership', 'Communication', 'Problem Solving',
      'Target Driven', 'Resilience', 'Adaptability', 'Attention to Detail'
    ],
    tools: [
      'SAP Retail', 'Oracle Retail', 'JDA', 'Blue Yonder', 'Manhattan',
      'Excel', 'Power BI', 'Nielsen', 'IRI', 'Syspro',
      'POS Systems', 'WMS'
    ]
  },
  industryKeywords: [
    'retail', 'store', 'branch', 'fmcg', 'consumer goods', 'buying',
    'merchandising', 'planogram', 'category', 'shrinkage', 'stock',
    'sales target', 'footfall', 'basket size', 'conversion rate',
    'woolworths', 'pick n pay', 'checkers', 'shoprite', 'spar',
    'clicks', 'dischem', 'mr price', 'truworths', 'foschini', 'edgars',
    'unilever', 'p&g', 'nestle', 'tiger brands', 'pioneer foods',
    'trade marketing', 'key account', 'route to market'
  ],
  saSpecificFlags: {
    eePreferred: true,
    driversLicenceRequired: true,
    citizenshipRequired: false,
    securityClearance: false,
    ownVehicleRequired: true,
    bilingualAdvantage: true,
    notes: [
      'SA retail is dominated by Shoprite/Checkers, Pick n Pay, Woolworths, SPAR, Clicks, Dis-Chem',
      'FMCG sales roles almost always require own vehicle and valid driver\'s licence',
      'Bilingual ability is a strong advantage — Afrikaans particularly valued in Western Cape and Northern Cape',
      'B-BBEE compliance knowledge increasingly required for buying and supplier management roles',
      'Retail hours include weekends and public holidays — flexibility is expected',
      'Nielsen/IRI data analysis skills are a strong differentiator for FMCG roles'
    ]
  },
  gapPenalties: [
    { skill: 'Stock Management', weight: 0.8, message: 'Stock management experience is a baseline requirement for retail management roles' },
    { skill: 'P&L', weight: 0.7, message: 'P&L management is expected for store manager and above roles in SA retail' },
    { skill: 'Driver\'s Licence', weight: 0.7, message: 'Valid driver\'s licence is required for most FMCG sales and area management roles' },
    { skill: 'SAP', weight: 0.5, message: 'SAP Retail or equivalent ERP experience is expected in large SA retail operations' },
    { skill: 'Merchandising', weight: 0.6, message: 'Merchandising and planogram knowledge is expected for buying and category roles' }
  ],
  detectionKeywords: [
    'retail', 'store manager', 'branch manager', 'fmcg', 'buyer', 'buying',
    'merchandiser', 'merchandising', 'category manager', 'area manager',
    'sales representative', 'key account', 'trade marketing',
    'stock', 'inventory', 'shrinkage', 'planogram', 'replenishment',
    'woolworths', 'pick n pay', 'checkers', 'shoprite', 'spar',
    'clicks', 'dischem', 'mr price', 'truworths', 'foschini',
    'unilever', 'tiger brands', 'pioneer foods', 'consumer goods'
  ]
}

// ─────────────────────────────────────────────
// 7. SALES
// ─────────────────────────────────────────────
const salesProfile: SAJobProfile = {
  id: 'sales',
  family: 'Sales',
  sector: 'Sales & Business Development',
  description: 'Covers B2B and B2C sales, business development, account management, and sales leadership across all SA industries.',
  typicalTitles: [
    'Sales Representative', 'Sales Consultant', 'Sales Executive', 'Sales Manager',
    'Senior Sales Manager', 'National Sales Manager', 'Regional Sales Manager',
    'Key Account Manager', 'Account Executive', 'Account Manager',
    'Business Development Manager', 'Business Development Executive',
    'Territory Manager', 'Area Sales Manager', 'Channel Manager',
    'Inside Sales Representative', 'External Sales Representative',
    'Technical Sales Representative', 'Medical Sales Representative',
    'Head of Sales', 'VP Sales', 'Chief Revenue Officer'
  ],
  experienceTiers: [
    {
      level: 'junior',
      minYears: 0,
      maxYears: 2,
      typicalTitles: ['Sales Consultant', 'Sales Representative', 'Junior Sales Executive', 'Telesales Agent']
    },
    {
      level: 'mid',
      minYears: 2,
      maxYears: 6,
      typicalTitles: ['Sales Executive', 'Key Account Manager', 'Account Manager', 'Territory Manager', 'Business Development Executive']
    },
    {
      level: 'senior',
      minYears: 6,
      maxYears: 12,
      typicalTitles: ['Sales Manager', 'Regional Sales Manager', 'Business Development Manager', 'Senior Account Manager']
    },
    {
      level: 'executive',
      minYears: 12,
      maxYears: 99,
      typicalTitles: ['National Sales Manager', 'Head of Sales', 'VP Sales', 'Chief Revenue Officer', 'Commercial Director']
    }
  ],
  minNQF: 5,
  preferredNQF: 6,
  acceptedQualifications: [
    'Matric', 'National Diploma Sales', 'National Diploma Marketing',
    'BCom Marketing', 'BCom Business Management', 'BCom Sales Management',
    'National Certificate Sales', 'BTech Marketing', 'MBA'
  ],
  professionalRegistrations: [],
  coreSkills: {
    technical: [
      'Sales Pipeline Management', 'Lead Generation', 'Prospecting', 'Cold Calling',
      'Negotiation', 'Closing', 'Account Management', 'Key Account Management',
      'CRM', 'Sales Forecasting', 'Territory Management', 'Tender Management',
      'Proposal Writing', 'Presentations', 'Target Achievement', 'Revenue Growth',
      'B2B Sales', 'B2C Sales', 'Solution Selling', 'Consultative Selling'
    ],
    soft: [
      'Persuasion', 'Resilience', 'Self-Motivation', 'Communication',
      'Relationship Building', 'Networking', 'Time Management', 'Target Driven'
    ],
    tools: [
      'Salesforce', 'HubSpot', 'Microsoft Dynamics', 'Pipedrive',
      'Excel', 'PowerPoint', 'SAP CRM', 'Zoho CRM'
    ]
  },
  industryKeywords: [
    'sales', 'revenue', 'targets', 'pipeline', 'leads', 'prospects',
    'cold calling', 'closing', 'negotiation', 'account management',
    'crm', 'salesforce', 'hubspot', 'b2b', 'b2c', 'solution selling',
    'quota', 'commission', 'incentive', 'territory', 'key account',
    'business development', 'new business', 'retention', 'upsell', 'cross-sell'
  ],
  saSpecificFlags: {
    eePreferred: true,
    driversLicenceRequired: true,
    citizenshipRequired: false,
    securityClearance: false,
    ownVehicleRequired: true,
    bilingualAdvantage: true,
    notes: [
      'Driver\'s licence and own vehicle are almost universally required for external sales roles',
      'Bilingual ability (Afrikaans, Zulu, Sotho) is a strong advantage for territory-based roles',
      'Commission structures vary widely — OTE (on-target earnings) is the standard SA metric',
      'B-BBEE supplier status knowledge is increasingly required for corporate B2B sales',
      'Medical sales requires product knowledge and often HPCSA-adjacent compliance awareness'
    ]
  },
  gapPenalties: [
    { skill: 'CRM', weight: 0.7, message: 'CRM experience (Salesforce, HubSpot, or equivalent) is expected for most sales roles' },
    { skill: 'Target Achievement', weight: 0.8, message: 'Demonstrated track record of meeting or exceeding sales targets is critical' },
    { skill: 'Driver\'s Licence', weight: 0.8, message: 'Valid driver\'s licence is required for virtually all external sales roles in SA' },
    { skill: 'Negotiation', weight: 0.7, message: 'Negotiation skills are a core requirement for mid-senior sales roles' }
  ],
  detectionKeywords: [
    'sales', 'sales representative', 'sales manager', 'account manager',
    'business development', 'key account', 'territory manager',
    'salesforce', 'hubspot', 'crm', 'pipeline', 'leads', 'prospecting',
    'cold calling', 'closing', 'negotiation', 'revenue', 'targets',
    'b2b', 'b2c', 'solution selling', 'consultative', 'quota', 'commission'
  ]
}

// ─────────────────────────────────────────────
// 8. MARKETING
// ─────────────────────────────────────────────
const marketingProfile: SAJobProfile = {
  id: 'marketing',
  family: 'Marketing',
  sector: 'Marketing & Communications',
  description: 'Covers brand management, digital marketing, content, PR, and marketing management across SA corporate and agency environments.',
  typicalTitles: [
    'Marketing Manager', 'Marketing Coordinator', 'Marketing Assistant',
    'Digital Marketing Manager', 'Digital Marketing Specialist', 'SEO Specialist',
    'Social Media Manager', 'Social Media Specialist', 'Content Manager',
    'Content Creator', 'Copywriter', 'Brand Manager', 'Brand Strategist',
    'PR Manager', 'Communications Manager', 'Public Relations Officer',
    'Marketing Director', 'Head of Marketing', 'CMO', 'Chief Marketing Officer',
    'Performance Marketing Manager', 'Growth Marketer', 'CRM Manager',
    'Trade Marketing Manager', 'Shopper Marketing Manager'
  ],
  experienceTiers: [
    {
      level: 'junior',
      minYears: 0,
      maxYears: 2,
      typicalTitles: ['Marketing Assistant', 'Marketing Coordinator', 'Junior Copywriter', 'Social Media Assistant', 'Graduate Marketer']
    },
    {
      level: 'mid',
      minYears: 2,
      maxYears: 6,
      typicalTitles: ['Marketing Manager', 'Brand Manager', 'Digital Marketing Specialist', 'Content Manager', 'PR Officer', 'Social Media Manager']
    },
    {
      level: 'senior',
      minYears: 6,
      maxYears: 12,
      typicalTitles: ['Senior Marketing Manager', 'Senior Brand Manager', 'Digital Marketing Manager', 'Communications Manager', 'Head of Digital']
    },
    {
      level: 'executive',
      minYears: 12,
      maxYears: 99,
      typicalTitles: ['Marketing Director', 'Head of Marketing', 'CMO', 'Chief Marketing Officer', 'VP Marketing']
    }
  ],
  minNQF: 6,
  preferredNQF: 7,
  acceptedQualifications: [
    'BCom Marketing', 'BCom Marketing Management', 'BA Communications',
    'BA Journalism', 'National Diploma Marketing', 'BTech Marketing',
    'BCom Business Management', 'Postgraduate Diploma Marketing',
    'MBA', 'IMM Graduate School Diploma'
  ],
  professionalRegistrations: [
    {
      name: 'IMM Membership',
      body: 'IMM Graduate School',
      required: false,
      applicableRoles: ['Marketing Manager', 'Brand Manager', 'Marketing Director']
    },
    {
      name: 'PRISA Membership',
      body: 'Public Relations Institute of SA',
      required: false,
      applicableRoles: ['PR Manager', 'Communications Manager', 'Public Relations Officer']
    }
  ],
  coreSkills: {
    technical: [
      'Brand Management', 'Campaign Management', 'Digital Marketing',
      'SEO', 'SEM', 'Google Ads', 'Meta Ads', 'Social Media Marketing',
      'Content Strategy', 'Copywriting', 'Email Marketing', 'Marketing Automation',
      'Market Research', 'Consumer Insights', 'Competitor Analysis',
      'Budget Management', 'ROI Measurement', 'Analytics', 'Reporting',
      'Trade Marketing', 'ATL', 'BTL', 'TTL', 'PR', 'Media Relations'
    ],
    soft: [
      'Creativity', 'Strategic Thinking', 'Communication', 'Collaboration',
      'Attention to Detail', 'Project Management', 'Adaptability', 'Curiosity'
    ],
    tools: [
      'Google Analytics', 'Google Ads', 'Meta Business Suite', 'HubSpot',
      'Mailchimp', 'Hootsuite', 'Canva', 'Adobe Creative Suite',
      'Salesforce Marketing Cloud', 'SEMrush', 'Ahrefs', 'Power BI'
    ]
  },
  industryKeywords: [
    'marketing', 'brand', 'campaign', 'digital', 'social media', 'content',
    'seo', 'sem', 'google ads', 'meta ads', 'email marketing', 'crm',
    'analytics', 'roi', 'atl', 'btl', 'pr', 'communications', 'media',
    'consumer insights', 'market research', 'brand strategy', 'copywriting',
    'b-bbee marketing', 'transformation', 'imm', 'prisa'
  ],
  saSpecificFlags: {
    eePreferred: true,
    driversLicenceRequired: false,
    citizenshipRequired: false,
    securityClearance: false,
    ownVehicleRequired: false,
    bilingualAdvantage: true,
    notes: [
      'B-BBEE marketing compliance and transformation messaging is increasingly required in SA corporate marketing',
      'IMM Graduate School is the leading SA marketing qualification body',
      'PRISA membership is valued for PR and communications roles',
      'Multilingual content creation (Zulu, Xhosa, Afrikaans) is a growing differentiator',
      'SA market requires understanding of township economy and informal sector dynamics for FMCG brands',
      'POPIA compliance knowledge is required for email marketing and data-driven roles'
    ]
  },
  gapPenalties: [
    { skill: 'Google Analytics', weight: 0.7, message: 'Google Analytics is a baseline requirement for digital marketing roles' },
    { skill: 'Campaign Management', weight: 0.7, message: 'End-to-end campaign management experience is expected at mid-senior level' },
    { skill: 'Budget Management', weight: 0.6, message: 'Marketing budget management is expected for manager-level roles' },
    { skill: 'Digital Marketing', weight: 0.7, message: 'Digital marketing skills are now a baseline requirement across all marketing roles in SA' }
  ],
  detectionKeywords: [
    'marketing', 'brand manager', 'digital marketing', 'social media',
    'content', 'seo', 'sem', 'google ads', 'meta ads', 'email marketing',
    'campaign', 'copywriter', 'pr manager', 'communications', 'media',
    'analytics', 'hubspot', 'mailchimp', 'hootsuite', 'canva',
    'adobe', 'market research', 'consumer insights', 'imm', 'prisa',
    'atl', 'btl', 'brand strategy', 'marketing manager', 'cmo'
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
  miningProfile,
  retailProfile,
  salesProfile,
  marketingProfile,
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
