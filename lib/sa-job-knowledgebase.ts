function fuzzyScore(a: string, b: string): number {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const costs: number[] = [];
  for (let i = 0; i <= shorter.length; i++) {
    let last = i;
    for (let j = 1; j <= longer.length; j++) {
      const c = i === 0 ? j : (shorter[i - 1] === longer[j - 1] ? costs[j - 1] : 1 + Math.min(costs[j - 1], last, costs[j]));
      costs[j - 1] = last;
      last = c;
    }
    costs[longer.length] = last;
  }
  return (longer.length - costs[longer.length]) / longer.length;
}

export interface JobProfile {
  family: string;
  typicalTitles: string[];
  minNQF: number;
  acceptedQualifications: string[];
  professionalRegistrations: string[];
  experienceTiers: {
    junior: { minYears: number; coreSkills: string[] };
    mid: { minYears: number; coreSkills: string[] };
    senior: { minYears: number; coreSkills: string[] };
  };
  saSpecificFlags: string[];
  industryKeywords: string[];
  sector: string;
}

export interface SAKnowledgebase {
  profiles: JobProfile[];
  getClosestProfile: (input: string, options?: { threshold?: number }) => JobProfile | null;
  scoreAgainstProfile: (cvData: any, profile: JobProfile, seniorityTier?: 'junior' | 'mid' | 'senior') => {
    matchScore: number;
    gaps: string[];
    strengths: string[];
  };
}

const JOB_PROFILES: JobProfile[] = [
  // ── MINING & RESOURCES ──────────────────────────────────────────────────────
  {
    family: 'Mining Engineer',
    typicalTitles: ['Mining Engineer', 'Mine Planner', 'Geotechnical Engineer', 'Mine Surveyor', 'Mine Overseer', 'Drill & Blast Engineer', 'Underground Manager', 'Shaft Sinker'],
    minNQF: 7,
    acceptedQualifications: ['BSc Mining Engineering', 'BEng Mining', 'NDip Mining', 'Mine Overseer Certificate (MQA)'],
    professionalRegistrations: ['ECSA', 'PLATO', 'MQA'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['VentSim', 'Deswik', 'rock mechanics'] },
      mid: { minYears: 5, coreSkills: ['blast design', 'mine ventilation', 'GIS mapping'] },
      senior: { minYears: 10, coreSkills: ['mine optimisation', 'safety management', 'mineralogy'] }
    },
    saSpecificFlags: ['Medical fitness', "Driver's license", 'Willing to relocate to Rustenburg/Limpopo'],
    industryKeywords: ['VentSim', 'Deswik', 'mine planning', 'ECSA', 'PLATO', 'blast design', 'explosives', 'rock mechanics', 'GIS', 'MQA', 'blasting certificate', 'mineral processing', 'MHSA'],
    sector: 'mining'
  },
  {
    family: 'Geologist',
    typicalTitles: ['Geologist', 'Metallurgist', 'Exploration Geologist', 'Blasting Technician'],
    minNQF: 7,
    acceptedQualifications: ['BSc Geology', 'BSc Metallurgical Engineering', 'NDip Geology', 'NDip Metallurgy'],
    professionalRegistrations: ['SACNASP', 'SAIMM', 'DMR Blasting Certificate'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['geological mapping', 'sample analysis', 'GIS'] },
      mid: { minYears: 4, coreSkills: ['ore characterisation', 'mineral processing', 'ArcGIS'] },
      senior: { minYears: 8, coreSkills: ['resource estimation', 'feasibility studies', 'SAMREC'] }
    },
    saSpecificFlags: ["Driver's license", 'Willing to relocate', 'Medical fitness'],
    industryKeywords: ['mineralogy', 'ore', 'GIS', 'SAMREC', 'JORC', 'ArcGIS', 'metallurgy', 'blasting'],
    sector: 'mining'
  },
  {
    family: 'Mine Safety Officer',
    typicalTitles: ['Safety Officer', 'Health & Safety Officer', 'SHEQ Officer', 'Risk Officer'],
    minNQF: 6,
    acceptedQualifications: ['NDip Safety Management', 'NDip Mining', 'SAMTRAC Certificate'],
    professionalRegistrations: ['MQA', 'SACPCMP'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['OHS Act', 'incident reporting', 'safety audits'] },
      mid: { minYears: 3, coreSkills: ['risk assessment', 'SHEQ management', 'IOD reporting'] },
      senior: { minYears: 7, coreSkills: ['safety culture', 'ISO 45001', 'section 54 protocols'] }
    },
    saSpecificFlags: ['MHSA compliance', "Driver's license"],
    industryKeywords: ['OHS', 'SHEQ', 'MHSA', 'safety', 'risk assessment', 'incident', 'SAMTRAC', 'ISO 45001'],
    sector: 'mining'
  },

  // ── FINANCE & BANKING ───────────────────────────────────────────────────────
  {
    family: 'CA(SA)',
    typicalTitles: ['Chartered Accountant', 'CA(SA)', 'Financial Controller', 'Financial Manager', 'CFO', 'Auditor'],
    minNQF: 8,
    acceptedQualifications: ['BCom Accounting', 'CTA', 'PGDA', 'CA(SA) via SAICA'],
    professionalRegistrations: ['SAICA'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['IFRS', 'tax returns', 'audit prep'] },
      mid: { minYears: 3, coreSkills: ['IFRS', 'financial reporting', 'tax compliance', 'Sage/Pastel'] },
      senior: { minYears: 7, coreSkills: ['IFRS 17', 'group consolidation', 'stakeholder management'] }
    },
    saSpecificFlags: ['SA citizenship/work permit', "Driver's license"],
    industryKeywords: ['IFRS', 'SAICA', 'CTA', 'financial statements', 'tax', 'Sage', 'Pastel', 'SARS', 'audit', 'ISA'],
    sector: 'finance'
  },
  {
    family: 'Financial Analyst',
    typicalTitles: ['Financial Analyst', 'Management Accountant', 'Cost Accountant', 'FP&A Analyst', 'Investment Analyst', 'Bookkeeper', 'Junior Accountant', 'Accounts Payable Clerk', 'Accounts Receivable Clerk'],
    minNQF: 7,
    acceptedQualifications: ['BCom Accounting', 'BCom Finance', 'CIMA', 'NDip Financial Management', 'ICB Bookkeeping to Trial Balance', 'AGA(SA)'],
    professionalRegistrations: ['SAICA trainee', 'CIMA', 'AGA(SA)'],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['Excel', 'financial modelling', 'budgeting'] },
      mid: { minYears: 3, coreSkills: ['Power BI', 'SQL', 'forecasting', 'variance analysis'] },
      senior: { minYears: 6, coreSkills: ['ERP systems', 'stakeholder reporting', 'investment analysis'] }
    },
    saSpecificFlags: ['EE candidate'],
    industryKeywords: ['financial model', 'budget', 'forecast', 'variance', 'Power BI', 'Excel advanced', 'CIMA', 'CFA', 'CRM', 'bookkeeping', 'accounts payable', 'accounts receivable'],
    sector: 'finance'
  },
  {
    family: 'Actuary',
    typicalTitles: ['Actuary', 'Actuarial Analyst', 'Risk Actuary', 'Pricing Actuary', 'Investment Banker'],
    minNQF: 7,
    acceptedQualifications: ['BCom Actuarial Science', 'BSc Actuarial Science', 'CFA'],
    professionalRegistrations: ['ASSA', 'CFA'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['R', 'Python', 'Excel', 'probability modelling'] },
      mid: { minYears: 3, coreSkills: ['risk modelling', 'SAS', 'Solvency II', 'pricing'] },
      senior: { minYears: 7, coreSkills: ['capital management', 'IFRS 17', 'reinsurance strategy'] }
    },
    saSpecificFlags: ['ASSA membership'],
    industryKeywords: ['actuarial', 'ASSA', 'Solvency II', 'IFRS 17', 'risk modelling', 'CFA', 'pricing', 'reinsurance'],
    sector: 'finance'
  },
  {
    family: 'Tax Consultant',
    typicalTitles: ['Tax Consultant', 'Tax Advisor', 'Tax Manager', 'Transfer Pricing Specialist', 'Tax Official', 'Tax Practitioner'],
    minNQF: 7,
    acceptedQualifications: ['BCom Taxation', 'LLB (Tax)', 'HDip Tax Law', 'MCom Taxation'],
    professionalRegistrations: ['SAIT', 'SAICA', 'SARS Tax Practitioner'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['Income Tax Act', 'VAT returns', 'SARS eFiling', 'tax compliance'] },
      mid: { minYears: 3, coreSkills: ['corporate tax', 'transfer pricing', 'tax structuring', 'dividends withholding tax'] },
      senior: { minYears: 6, coreSkills: ['international tax', 'SARS disputes', 'tax court litigation', 'BEPS compliance'] }
    },
    saSpecificFlags: ['SARS Tax Practitioner registration', 'SAIT membership'],
    industryKeywords: ['SARS', 'tax', 'VAT', 'SAIT', 'eFiling', 'income tax', 'transfer pricing', 'BEPS', 'tax compliance', 'tax law'],
    sector: 'finance'
  },
  {
    family: 'Compliance Officer',
    typicalTitles: ['Compliance Officer', 'Credit Analyst', 'Risk Analyst', 'Regulatory Analyst', 'AML Analyst'],
    minNQF: 7,
    acceptedQualifications: ['BCom Finance', 'BCom Law', 'LLB', 'CFP'],
    professionalRegistrations: ['FSCA', 'FPI', 'CISA'],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['FICA', 'POPIA', 'FAIS', 'KYC'] },
      mid: { minYears: 3, coreSkills: ['regulatory reporting', 'credit risk', 'Basel III', 'AML'] },
      senior: { minYears: 6, coreSkills: ['regulatory strategy', 'board reporting', 'SARB compliance'] }
    },
    saSpecificFlags: ['FSP licence knowledge'],
    industryKeywords: ['POPIA', 'FICA', 'FAIS', 'KYC', 'AML', 'SARB', 'Basel', 'compliance', 'credit risk', 'regulatory'],
    sector: 'finance'
  },

  // ── INFORMATION TECHNOLOGY ──────────────────────────────────────────────────
  {
    family: 'Software Engineer',
    typicalTitles: ['Software Developer', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer', 'Software Engineer', 'Cloud Architect', 'Solutions Architect', 'Application Developer'],
    minNQF: 7,
    acceptedQualifications: ['BSc Computer Science', 'BSc IT', 'BEng Software Engineering', 'BCom IT', 'NDip Information Technology'],
    professionalRegistrations: [],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['JavaScript', 'React', 'Node.js', '.NET', 'Python', 'Java'] },
      mid: { minYears: 3, coreSkills: ['AWS/Azure', 'Docker', 'microservices', 'CI/CD', 'agile'] },
      senior: { minYears: 6, coreSkills: ['system architecture', 'technical leadership', 'cloud platforms'] }
    },
    saSpecificFlags: ['Willing to relocate to JHB/DBN'],
    industryKeywords: ['JavaScript', 'React', 'Node', 'AWS', 'Azure', '.NET', 'SQL', 'API', 'Git', 'Python', 'Java', 'C#', 'agile', 'cloud architecture', 'microservices', 'REST API'],
    sector: 'tech'
  },
  {
    family: 'Data Scientist',
    typicalTitles: ['Data Scientist', 'Data Analyst', 'Business Intelligence Analyst', 'Reporting Analyst', 'ML Engineer'],
    minNQF: 7,
    acceptedQualifications: ['BSc Computer Science', 'BSc Statistics', 'BCom Informatics', 'Google Data Analytics Certificate'],
    professionalRegistrations: [],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['Excel', 'Power BI', 'SQL', 'Python'] },
      mid: { minYears: 3, coreSkills: ['R', 'ETL', 'data warehouse', 'Tableau', 'machine learning'] },
      senior: { minYears: 5, coreSkills: ['ML models', 'data strategy', 'deep learning', 'MLOps'] }
    },
    saSpecificFlags: [],
    industryKeywords: ['SQL', 'Power BI', 'Tableau', 'Python', 'ETL', 'data visualisation', 'machine learning', 'AI', 'R'],
    sector: 'tech'
  },
  {
    family: 'Cybersecurity Analyst',
    typicalTitles: ['Cybersecurity Analyst', 'Information Security Analyst', 'SOC Analyst', 'Penetration Tester', 'Security Engineer', 'CISO', 'Information Security Manager'],
    minNQF: 7,
    acceptedQualifications: ['BSc Computer Science', 'BSc IT', 'CompTIA Security+', 'CISSP', 'AWS/Azure certs', 'CEH', 'OSCP'],
    professionalRegistrations: ['CompTIA Security+', 'CISSP', 'CEH'],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['networking', 'firewall management', 'SIEM', 'CompTIA A+'] },
      mid: { minYears: 3, coreSkills: ['penetration testing', 'vulnerability assessment', 'POPIA compliance', 'cloud security'] },
      senior: { minYears: 6, coreSkills: ['security architecture', 'incident response', 'CISO advisory'] }
    },
    saSpecificFlags: ['POPIA compliance knowledge'],
    industryKeywords: ['cybersecurity', 'SIEM', 'firewall', 'cloud security', 'AWS', 'Azure', 'POPIA', 'penetration testing', 'CISSP', 'Cisco CCNA', 'vulnerability assessment', 'SOC', 'CEH', 'ethical hacking'],
    sector: 'tech'
  },
  {
    family: 'IT Project Manager',
    typicalTitles: ['IT Project Manager', 'Business Analyst', 'UX Designer', 'DevOps Engineer', 'Scrum Master'],
    minNQF: 7,
    acceptedQualifications: ['BSc IT', 'BSc Computer Science', 'BCom IT', 'PMP Certification', 'NDip IT'],
    professionalRegistrations: ['PMP', 'PRINCE2'],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['agile methodologies', 'Jira', 'requirements gathering', 'UI/UX'] },
      mid: { minYears: 3, coreSkills: ['project scheduling', 'stakeholder management', 'DevOps', 'Docker', 'CI/CD'] },
      senior: { minYears: 6, coreSkills: ['portfolio management', 'enterprise architecture', 'Kubernetes', 'digital transformation'] }
    },
    saSpecificFlags: [],
    industryKeywords: ['agile', 'scrum', 'Jira', 'PRINCE2', 'PMP', 'DevOps', 'Docker', 'Kubernetes', 'UX', 'business analysis'],
    sector: 'tech'
  },
  {
    family: 'Systems Engineer',
    typicalTitles: [
      'Systems Administrator', 'Systems Engineer', 'Network Engineer', 'Infrastructure Engineer',
      'Virtualization Engineer', 'Cloud Engineer', 'Platform Engineer', 'Server Administrator',
      'IT Infrastructure Specialist', 'VMware Administrator', 'Network Administrator',
      'IT Support Engineer', 'IT Engineer', 'Systems Analyst', 'L1 Engineer', 'L2 Engineer', 'L3 Engineer'
    ],
    minNQF: 6,
    acceptedQualifications: ['BSc IT', 'BSc Computer Science', 'NDip Information Technology', 'CompTIA Network+', 'CCNA', 'MCSA', 'MCSE'],
    professionalRegistrations: ['CompTIA Network+', 'CCNA', 'MCSE', 'VMware VCP'],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['Windows Server', 'Linux', 'Active Directory', 'networking', 'VMware'] },
      mid: { minYears: 3, coreSkills: ['vSphere', 'Hyper-V', 'Azure', 'AWS', 'PowerShell', 'DNS', 'DHCP', 'backup'] },
      senior: { minYears: 6, coreSkills: ['cloud architecture', 'disaster recovery', 'capacity planning', 'security hardening', 'SAN', 'NAS'] }
    },
    saSpecificFlags: ["Driver's license"],
    industryKeywords: [
      'VMware', 'vSphere', 'Hyper-V', 'Active Directory', 'Windows Server', 'Linux',
      'Cisco', 'firewall', 'DNS', 'DHCP', 'virtualization', 'virtualisation',
      'PowerShell', 'SCCM', 'SCOM', 'storage', 'SAN', 'NAS', 'backup', 'Veeam',
      'networking', 'TCP/IP', 'LAN', 'WAN', 'VPN', 'VLAN', 'routing', 'switching',
      'Azure', 'AWS', 'Terraform', 'Ansible', 'ITIL', 'monitoring'
    ],
    sector: 'tech'
  },

  // ── HEALTHCARE & PHARMACEUTICALS ────────────────────────────────────────────
  {
    family: 'Doctor',
    typicalTitles: ['General Practitioner', 'Medical Officer', 'GP', 'Specialist Doctor', 'Registrar'],
    minNQF: 8,
    acceptedQualifications: ['MBChB', 'MBBCh'],
    professionalRegistrations: ['HPCSA'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['clinical diagnosis', 'patient assessment', 'pharmacology'] },
      mid: { minYears: 5, coreSkills: ['chronic disease management', 'emergency medicine', 'ICD coding'] },
      senior: { minYears: 10, coreSkills: ['medical leadership', 'clinical governance', 'specialist referrals'] }
    },
    saSpecificFlags: ['HPCSA registration', 'Police clearance', 'Community service done'],
    industryKeywords: ['HPCSA', 'MBChB', 'clinical', 'diagnosis', 'pharmacology', 'emergency', 'ICD-10'],
    sector: 'healthcare'
  },
  {
    family: 'Registered Nurse',
    typicalTitles: ['Registered Nurse', 'Professional Nurse', 'RN', 'Enrolled Nurse', 'ICU Nurse', 'Theatre Nurse'],
    minNQF: 7,
    acceptedQualifications: ['BSc Nursing', 'BCur Nursing', 'Higher Certificate in Nursing (SANC)'],
    professionalRegistrations: ['SANC', 'HPCSA'],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['patient care', 'medication admin', 'vital signs'] },
      mid: { minYears: 4, coreSkills: ['IV therapy', 'wound care', 'theatre scrubbing'] },
      senior: { minYears: 8, coreSkills: ['nurse management', 'quality control', 'clinical governance'] }
    },
    saSpecificFlags: ['SANC registration', 'Police clearance'],
    industryKeywords: ['SANC', 'HPCSA', 'patient care', 'IV cannula', 'vital signs', 'BCur', 'nursing', 'wound care'],
    sector: 'healthcare'
  },
  {
    family: 'Pharmacist',
    typicalTitles: ['Pharmacist', 'Pharmacy Manager', 'Clinical Pharmacist', 'Dispensing Technician'],
    minNQF: 7,
    acceptedQualifications: ['BPharm', 'NDip Medical Lab Science'],
    professionalRegistrations: ['SAPC', 'HPCSA'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['dispensing', 'drug interactions', 'patient counselling'] },
      mid: { minYears: 3, coreSkills: ['pharmacy management', 'pharmacovigilance', 'formulary management'] },
      senior: { minYears: 7, coreSkills: ['clinical pharmacy', 'regulatory affairs', 'MCC submissions'] }
    },
    saSpecificFlags: ['SAPC registration', 'HPCSA registration'],
    industryKeywords: ['SAPC', 'BPharm', 'dispensing', 'pharmacovigilance', 'MCC', 'drug', 'pharmacology'],
    sector: 'healthcare'
  },
  {
    family: 'Dentist',
    typicalTitles: ['Dentist', 'Dental Surgeon', 'Oral Hygienist', 'Orthodontist', 'Prosthodontist'],
    minNQF: 8,
    acceptedQualifications: ['BDentistry', 'BChD', 'MChD', 'Oral Hygiene Diploma'],
    professionalRegistrations: ['HPCSA'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['clinical diagnosis', 'extraction', 'restorative dentistry', 'radiographs'] },
      mid: { minYears: 4, coreSkills: ['oral surgery', 'endodontics', 'periodontics', 'patient management'] },
      senior: { minYears: 8, coreSkills: ['practice management', 'implantology', 'orthodontics', 'dental governance'] }
    },
    saSpecificFlags: ['HPCSA registration', 'Police clearance', 'Community service done'],
    industryKeywords: ['HPCSA', 'BChD', 'BDentistry', 'dental', 'oral health', 'extraction', 'orthodontics', 'prosthodontics'],
    sector: 'healthcare'
  },
  {
    family: 'Psychologist',
    typicalTitles: ['Clinical Psychologist', 'Industrial Psychologist', 'Counselling Psychologist', 'Neuropsychologist', 'Research Psychologist'],
    minNQF: 9,
    acceptedQualifications: ['MA Clinical Psychology', 'MA Counselling Psychology', 'MA Industrial Psychology', 'PhD Psychology'],
    professionalRegistrations: ['HPCSA'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['psychometric assessment', 'counselling', 'CBT', 'psychological report writing'] },
      mid: { minYears: 4, coreSkills: ['employee wellness', 'forensic assessment', 'neuropsychological testing', 'group therapy'] },
      senior: { minYears: 8, coreSkills: ['supervisory practice', 'programme evaluation', 'organisational consulting'] }
    },
    saSpecificFlags: ['HPCSA registration', 'Police clearance', 'BHF registration (industrial)'],
    industryKeywords: ['HPCSA', 'psychology', 'psychometric', 'CBT', 'counselling', 'industrial psychology', 'employee wellness', 'assessment'],
    sector: 'healthcare'
  },
  {
    family: 'Paramedic',
    typicalTitles: ['Paramedic', 'Emergency Medical Technician', 'Advanced Life Support', 'Physiotherapist', 'Radiographer', 'Medical Lab Scientist'],
    minNQF: 6,
    acceptedQualifications: ['NDip Emergency Medical Care', 'BSc Physiotherapy', 'BSc Radiography', 'NDip Medical Lab Science'],
    professionalRegistrations: ['HPCSA'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['BLS', 'ALS', 'patient assessment', 'emergency response'] },
      mid: { minYears: 3, coreSkills: ['advanced intubation', 'cardiac monitoring', 'trauma care'] },
      senior: { minYears: 7, coreSkills: ['EMS management', 'critical care transport', 'training officer'] }
    },
    saSpecificFlags: ['HPCSA registration', "Driver's license", 'Medical fitness'],
    industryKeywords: ['HPCSA', 'BLS', 'ALS', 'paramedic', 'emergency', 'trauma', 'physiotherapy', 'radiography'],
    sector: 'healthcare'
  },

  // ── EDUCATION ───────────────────────────────────────────────────────────────
  {
    family: 'Teacher',
    typicalTitles: ['Teacher', 'Educator', 'Foundation Phase Teacher', 'FET Teacher', 'School Principal', 'TVET Lecturer'],
    minNQF: 7,
    acceptedQualifications: ['BEd Foundation Phase', 'BEd Intermediate Phase', 'BEd Senior Phase', 'BA + PGCE', 'BSc + PGCE', 'NDip Early Childhood Development'],
    professionalRegistrations: ['SACE'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['lesson planning', 'classroom management', 'assessment', 'subject knowledge'] },
      mid: { minYears: 4, coreSkills: ['curriculum development', 'learner support', 'CAPS alignment'] },
      senior: { minYears: 8, coreSkills: ['school management', 'staff development', 'community engagement'] }
    },
    saSpecificFlags: ['SACE registration', 'Police clearance', 'ZA citizen'],
    industryKeywords: ['SACE', 'CAPS', 'lesson plan', 'classroom', 'foundation phase', 'FET', 'teaching', 'BEd', 'PGCE'],
    sector: 'education'
  },
  {
    family: 'Education Psychologist',
    typicalTitles: ['Education Psychologist', 'Curriculum Developer', 'University Lecturer', 'Academic'],
    minNQF: 8,
    acceptedQualifications: ['MEd', 'MA Psychology', 'BA Psychology + PGCE', 'ACE'],
    professionalRegistrations: ['HPCSA', 'SACE'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['psychometric assessment', 'learner support', 'curriculum design'] },
      mid: { minYears: 4, coreSkills: ['educational research', 'learning interventions', 'NQF alignment'] },
      senior: { minYears: 8, coreSkills: ['policy development', 'curriculum leadership', 'doctoral supervision'] }
    },
    saSpecificFlags: ['HPCSA/SACE registration', 'Police clearance'],
    industryKeywords: ['psychometric', 'curriculum', 'SAQA', 'NQF', 'MEd', 'learner support', 'assessment', 'university'],
    sector: 'education'
  },

  // ── CONSTRUCTION & CIVIL ENGINEERING ────────────────────────────────────────
  {
    family: 'Civil Engineer',
    typicalTitles: ['Civil Engineer', 'Structural Engineer', 'Site Engineer', 'Site Foreman', 'Town Planner', 'Draughtsman'],
    minNQF: 7,
    acceptedQualifications: ['BEng Civil Engineering', 'BEng Structural Engineering', 'NDip Civil Engineering'],
    professionalRegistrations: ['ECSA', 'PrEng'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['AutoCAD', 'structural design', 'SANS codes', 'site supervision'] },
      mid: { minYears: 4, coreSkills: ['Revit', 'project scheduling', 'JBCC contracts', 'NEC contracts'] },
      senior: { minYears: 8, coreSkills: ['contract management', 'stakeholder liaison', 'infrastructure planning'] }
    },
    saSpecificFlags: ['ECSA registration', "Driver's license"],
    industryKeywords: ['AutoCAD', 'ECSA', 'PrEng', 'SANS', 'JBCC', 'NEC', 'civil', 'structural', 'infrastructure', 'Revit'],
    sector: 'construction'
  },
  {
    family: 'Quantity Surveyor',
    typicalTitles: ['Quantity Surveyor', 'QS', 'Cost Consultant', 'Project Manager', 'Architect'],
    minNQF: 7,
    acceptedQualifications: ['BSc Quantity Surveying', 'BArch', 'BTech Construction Management'],
    professionalRegistrations: ['ASAQS', 'SACAP', 'SACPCMP'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['cost estimation', 'bill of quantities', 'CCS Candy', 'AutoCAD'] },
      mid: { minYears: 4, coreSkills: ['contract administration', 'procurement', 'JBCC/NEC', 'cost planning'] },
      senior: { minYears: 8, coreSkills: ['claims management', 'project strategy', 'feasibility analysis'] }
    },
    saSpecificFlags: ['ASAQS/SACAP registration', "Driver's license"],
    industryKeywords: ['QS', 'ASAQS', 'SACAP', 'SACPCMP', 'cost estimation', 'bill of quantities', 'CCS Candy', 'JBCC', 'NEC'],
    sector: 'construction'
  },

  // ── AGRICULTURE & AGRI-PROCESSING ───────────────────────────────────────────
  {
    family: 'Agronomist',
    typicalTitles: ['Agronomist', 'Agricultural Scientist', 'Farm Manager', 'Agricultural Extension Officer', 'Irrigation Specialist'],
    minNQF: 7,
    acceptedQualifications: ['BSc Agriculture', 'BSc AgriScience', 'ND Agriculture'],
    professionalRegistrations: ['SACNASP', 'ARC'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['crop management', 'soil science', 'pesticide compliance', 'irrigation systems'] },
      mid: { minYears: 3, coreSkills: ['fertiliser programmes', 'pest management', 'HACCP', 'food safety'] },
      senior: { minYears: 7, coreSkills: ['farm business management', 'agri extension', 'sustainability reporting'] }
    },
    saSpecificFlags: ["Driver's license", 'Willing to relocate to farming region'],
    industryKeywords: ['agronomy', 'crop', 'soil science', 'irrigation', 'HACCP', 'ARC', 'planting', 'harvest', 'pesticide'],
    sector: 'agriculture'
  },
  {
    family: 'Veterinarian',
    typicalTitles: ['Veterinarian', 'Vet', 'Animal Scientist', 'Food Technologist', 'Veterinary Technician'],
    minNQF: 7,
    acceptedQualifications: ['BVSc', 'BSc Food Science', 'BSc Animal Science'],
    professionalRegistrations: ['SAVC'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['animal husbandry', 'clinical diagnosis', 'surgery', 'anatomy'] },
      mid: { minYears: 4, coreSkills: ['farm herd management', 'food safety', 'disease control', 'HACCP'] },
      senior: { minYears: 8, coreSkills: ['regulatory affairs', 'veterinary public health', 'research'] }
    },
    saSpecificFlags: ['SAVC registration', "Driver's license"],
    industryKeywords: ['SAVC', 'BVSc', 'veterinary', 'animal husbandry', 'food safety', 'surgery', 'HACCP'],
    sector: 'agriculture'
  },

  // ── TOURISM & HOSPITALITY ────────────────────────────────────────────────────
  {
    family: 'Hospitality Manager',
    typicalTitles: ['Hotel Manager', 'Lodge Manager', 'Front-of-House Manager', 'Tour Guide', 'Events Manager', 'Sommelier'],
    minNQF: 6,
    acceptedQualifications: ['NDip Hospitality Management', 'BCom Tourism Management', 'CATHSSETA qualification', 'FGASA'],
    professionalRegistrations: ['FGASA', 'CATHSSETA'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['customer service', 'reservations', 'front desk', 'POS systems'] },
      mid: { minYears: 3, coreSkills: ['revenue management', 'F&B management', 'event coordination', 'cultural awareness'] },
      senior: { minYears: 7, coreSkills: ['hotel operations', 'yield management', 'lodge management', 'stakeholder relations'] }
    },
    saSpecificFlags: ["Driver's license", 'Multilingual (Zulu/Xhosa/Afrikaans advantage)'],
    industryKeywords: ['hospitality', 'FGASA', 'CATHSSETA', 'tourism', 'hotel', 'lodge', 'revenue management', 'events', 'customer service'],
    sector: 'tourism'
  },
  {
    family: 'Chef',
    typicalTitles: ['Chef', 'Head Chef', 'Executive Chef', 'Sous Chef', 'Travel Consultant'],
    minNQF: 5,
    acceptedQualifications: ['City & Guilds Culinary Arts', 'NDip Hospitality', 'CATHSSETA Culinary Certificate'],
    professionalRegistrations: ['CATHSSETA'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['food preparation', 'kitchen safety', 'HACCP', 'menu knowledge'] },
      mid: { minYears: 3, coreSkills: ['menu development', 'kitchen management', 'food costing', 'culinary arts'] },
      senior: { minYears: 7, coreSkills: ['executive kitchen management', 'supplier relations', 'culinary innovation'] }
    },
    saSpecificFlags: ['Food handler certificate', 'Health compliance'],
    industryKeywords: ['chef', 'culinary', 'HACCP', 'kitchen', 'food safety', 'menu', 'City & Guilds'],
    sector: 'tourism'
  },

  // ── LEGAL & COMPLIANCE ───────────────────────────────────────────────────────
  {
    family: 'Attorney',
    typicalTitles: ['Attorney', 'Advocate', 'Legal Advisor', 'Conveyancer', 'Notary', 'Magistrate'],
    minNQF: 7,
    acceptedQualifications: ['LLB', 'LLM', 'MBA (Commercial Law)'],
    professionalRegistrations: ['LSSA', 'Law Society', 'Bar Council'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['legal drafting', 'contract law', 'legal research', 'litigation'] },
      mid: { minYears: 4, coreSkills: ['commercial law', 'conveyancing', 'negotiation', 'POPIA/FICA'] },
      senior: { minYears: 8, coreSkills: ['litigation strategy', 'senior counsel', 'regulatory advisory'] }
    },
    saSpecificFlags: ['Admitted attorney', 'Fidelity Fund Certificate'],
    industryKeywords: ['LLB', 'LSSA', 'litigation', 'conveyancing', 'legal drafting', 'contract', 'POPIA', 'FICA', 'FAIS'],
    sector: 'legal'
  },
  {
    family: 'Legal Compliance Officer',
    typicalTitles: ['Compliance Officer', 'Legal Compliance Officer', 'Court Clerk', 'Paralegal'],
    minNQF: 6,
    acceptedQualifications: ['NDip Paralegal Studies', 'LLB', 'Compliance Officer Certificate (FSCA/FPI)'],
    professionalRegistrations: ['FSCA', 'FPI', 'LSSA'],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['POPIA', 'FICA', 'FAIS', 'regulatory research'] },
      mid: { minYears: 3, coreSkills: ['compliance audits', 'regulatory reporting', 'risk frameworks', 'FSCA liaison'] },
      senior: { minYears: 6, coreSkills: ['compliance strategy', 'board advisory', 'governance frameworks'] }
    },
    saSpecificFlags: ['FSP licence knowledge', 'FSCA registration'],
    industryKeywords: ['compliance', 'POPIA', 'FICA', 'FAIS', 'FSCA', 'FPI', 'regulatory', 'paralegal', 'governance'],
    sector: 'legal'
  },

  // ── MANUFACTURING & ENGINEERING ──────────────────────────────────────────────
  {
    family: 'Quality Controller',
    typicalTitles: ['Quality Controller', 'Quality Assurance Manager', 'QA Analyst', 'Quality Engineer', 'Quality Inspector'],
    minNQF: 6,
    acceptedQualifications: ['NDip Quality Management', 'BEng Industrial Engineering', 'ND Engineering', 'ISO Lead Auditor Certificate'],
    professionalRegistrations: ['SABS'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['ISO 9001', 'inspection procedures', 'non-conformance reporting', 'quality audits'] },
      mid: { minYears: 3, coreSkills: ['Six Sigma', 'FMEA', 'SPC', 'root cause analysis', 'PPAP'] },
      senior: { minYears: 7, coreSkills: ['QMS implementation', 'supplier quality management', 'IATF 16949', 'CAPA management'] }
    },
    saSpecificFlags: ["Driver's license"],
    industryKeywords: ['ISO 9001', 'Six Sigma', 'FMEA', 'SPC', 'quality assurance', 'QA', 'QC', 'SABS', 'PPAP', 'CAPA', 'IATF'],
    sector: 'manufacturing'
  },
  {
    family: 'Mechanical Engineer',
    typicalTitles: ['Mechanical Engineer', 'Industrial Engineer', 'Production Manager', 'Maintenance Engineer'],
    minNQF: 7,
    acceptedQualifications: ['BEng Mechanical Engineering', 'BEng Industrial Engineering', 'ND Engineering'],
    professionalRegistrations: ['ECSA', 'PrEng'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['AutoCAD', 'CAD/CAM', 'SolidWorks', 'engineering drawing'] },
      mid: { minYears: 4, coreSkills: ['PLC programming', 'lean manufacturing', 'Six Sigma', 'ISO standards'] },
      senior: { minYears: 8, coreSkills: ['plant management', 'CAPEX management', 'OEM liaison', 'OHS Act'] }
    },
    saSpecificFlags: ['ECSA registration', "Driver's license"],
    industryKeywords: ['ECSA', 'PrEng', 'AutoCAD', 'CAD/CAM', 'PLC', 'lean manufacturing', 'Six Sigma', 'ISO', 'OHS'],
    sector: 'manufacturing'
  },
  {
    family: 'Artisan',
    typicalTitles: ['Electrician', 'Fitter', 'Millwright', 'Welder', 'CNC Operator', 'Maintenance Technician'],
    minNQF: 4,
    acceptedQualifications: ['Trade Certificate via QCTO', 'Artisan Learnership', 'N3 + Trade Test'],
    professionalRegistrations: ['QCTO', 'MERSETA'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['electrical wiring', 'mechanical fitting', 'welding', 'technical drawings'] },
      mid: { minYears: 3, coreSkills: ['PLC fault-finding', 'pneumatics', 'hydraulics', 'CNC operation'] },
      senior: { minYears: 7, coreSkills: ['workshop management', 'apprentice supervision', 'preventive maintenance'] }
    },
    saSpecificFlags: ['Red Seal Trade Certificate', "Driver's license"],
    industryKeywords: ['QCTO', 'Red Seal', 'trade test', 'welding', 'electrician', 'fitter', 'millwright', 'CNC', 'PLC'],
    sector: 'manufacturing'
  },

  // ── RETAIL & E-COMMERCE ──────────────────────────────────────────────────────
  {
    family: 'Retail Manager',
    typicalTitles: ['Retail Manager', 'Store Manager', 'Buyer', 'Merchandiser', 'Loss Prevention Officer', 'Store Planner'],
    minNQF: 7,
    acceptedQualifications: ['BCom Retail Management', 'BCom Marketing', 'NDip Retail Business Management'],
    professionalRegistrations: [],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['visual merchandising', 'stock management', 'POS systems', 'customer service'] },
      mid: { minYears: 3, coreSkills: ['buying', 'inventory management', 'planogram', 'shrinkage control'] },
      senior: { minYears: 6, coreSkills: ['category management', 'retail strategy', 'supplier negotiation'] }
    },
    saSpecificFlags: ["Driver's license"],
    industryKeywords: ['merchandising', 'retail', 'buyer', 'inventory', 'POS', 'planogram', 'shrinkage', 'category management'],
    sector: 'retail'
  },
  {
    family: 'Supply Chain Analyst',
    typicalTitles: ['Supply Chain Analyst', 'Digital Marketer', 'E-Commerce Manager', 'Logistics Coordinator'],
    minNQF: 7,
    acceptedQualifications: ['BCom Logistics', 'BCom Supply Chain', 'Google/Meta Digital Marketing Certificate', 'CRM Certification'],
    professionalRegistrations: [],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['SAP', 'Excel', 'demand forecasting', 'digital advertising'] },
      mid: { minYears: 3, coreSkills: ['supply chain analytics', 'SEO/SEM', 'Google Ads', 'logistics optimisation'] },
      senior: { minYears: 6, coreSkills: ['e-commerce strategy', 'omnichannel retail', 'data-driven marketing'] }
    },
    saSpecificFlags: [],
    industryKeywords: ['supply chain', 'SAP', 'logistics', 'SEO', 'SEM', 'Google Ads', 'e-commerce', 'digital marketing', 'demand planning'],
    sector: 'retail'
  },

  // ── ENERGY & UTILITIES ───────────────────────────────────────────────────────
  {
    family: 'Electrical Engineer',
    typicalTitles: ['Electrical Engineer', 'Grid Engineer', 'Power Systems Engineer', 'Energy Analyst', 'SCADA Operator'],
    minNQF: 7,
    acceptedQualifications: ['BEng Electrical Engineering', 'BEng Nuclear Engineering', 'ND Electrical Engineering'],
    professionalRegistrations: ['ECSA', 'PrEng'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['AutoCAD Electrical', 'power systems', 'HV/LV reticulation', 'SANS 10142'] },
      mid: { minYears: 4, coreSkills: ['SCADA', 'grid management', 'smart-grid tech', 'load flow analysis'] },
      senior: { minYears: 8, coreSkills: ['IPP project management', 'grid modernisation', 'NERSA compliance', 'PPA negotiations'] }
    },
    saSpecificFlags: ['ECSA registration', "Driver's license"],
    industryKeywords: ['ECSA', 'SCADA', 'power systems', 'AutoCAD Electrical', 'smart grid', 'Eskom', 'NERSA', 'IPP', 'load flow'],
    sector: 'energy'
  },
  {
    family: 'Renewable Energy Technician',
    typicalTitles: ['Solar PV Technician', 'Wind Turbine Technician', 'Nuclear Technician', 'Environmental Compliance Officer'],
    minNQF: 5,
    acceptedQualifications: ['EWSETA Solar PV Installation Certificate', 'ND Electrical Engineering', 'BSc Environmental Science'],
    professionalRegistrations: ['EWSETA', 'SACNASP'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['solar PV installation', 'inverter configuration', 'electrical safety'] },
      mid: { minYears: 3, coreSkills: ['grid-tied systems', 'energy storage', 'EIA', 'environmental monitoring'] },
      senior: { minYears: 6, coreSkills: ['renewable project management', 'REIPPP compliance', 'EMP reporting'] }
    },
    saSpecificFlags: ["Driver's license", 'Working at heights certificate'],
    industryKeywords: ['solar PV', 'renewable energy', 'EWSETA', 'REIPPP', 'wind turbine', 'inverter', 'EIA', 'environmental'],
    sector: 'energy'
  },

  // ── MEDIA, ARTS & CREATIVE ───────────────────────────────────────────────────
  {
    family: 'Journalist',
    typicalTitles: ['Journalist', 'Copywriter', 'PR Specialist', 'Editor', 'Content Writer'],
    minNQF: 7,
    acceptedQualifications: ['BA Journalism', 'BA Communications', 'NDip Journalism', 'NDip Public Relations'],
    professionalRegistrations: [],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['news writing', 'AP style', 'media law', 'interviewing'] },
      mid: { minYears: 3, coreSkills: ['investigative journalism', 'SEO writing', 'PR strategy', 'media relations'] },
      senior: { minYears: 6, coreSkills: ['editorial management', 'broadcast production', 'brand strategy', 'media ethics'] }
    },
    saSpecificFlags: [],
    industryKeywords: ['journalism', 'copywriting', 'PR', 'media law', 'SEO', 'editorial', 'broadcast', 'storytelling'],
    sector: 'media'
  },
  {
    family: 'Graphic Designer',
    typicalTitles: ['Graphic Designer', 'UX/UI Designer', 'Animator', 'Film Director', 'Photographer', 'Social Media Manager'],
    minNQF: 7,
    acceptedQualifications: ['BA Graphic Design', 'BA Film & Media', 'NDip Graphic Design', 'NDip Photography', 'AAA School of Advertising'],
    professionalRegistrations: [],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['Adobe Photoshop', 'Illustrator', 'InDesign', 'Figma', 'UI/UX prototyping'] },
      mid: { minYears: 3, coreSkills: ['After Effects', 'Premiere Pro', 'brand identity', 'social analytics', 'video editing'] },
      senior: { minYears: 6, coreSkills: ['creative direction', 'brand strategy', 'motion graphics', 'campaign management'] }
    },
    saSpecificFlags: [],
    industryKeywords: ['Adobe', 'Photoshop', 'Illustrator', 'Figma', 'UX', 'UI', 'branding', 'social media', 'animation', 'video editing'],
    sector: 'media'
  },

  // ── TRANSPORT & LOGISTICS ────────────────────────────────────────────────────
  {
    family: 'Logistics Manager',
    typicalTitles: ['Logistics Manager', 'Fleet Manager', 'Supply Chain Manager', 'Port Operations Manager', 'Warehouse Manager'],
    minNQF: 7,
    acceptedQualifications: ['BCom Logistics', 'BCom Supply Chain', 'ND Supply Chain Management'],
    professionalRegistrations: ['SAPICS', 'CIPS'],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['route optimisation', 'warehouse management', 'SAP', 'INCOTERMS'] },
      mid: { minYears: 4, coreSkills: ['SAP S/4HANA', 'fleet management', 'cold-chain logistics', 'customs tariff codes'] },
      senior: { minYears: 8, coreSkills: ['AI-driven demand forecasting', '3PL management', 'network design', 'SCOR framework'] }
    },
    saSpecificFlags: ["Driver's license", 'PDP (professional driving permit)'],
    industryKeywords: ['logistics', 'SAP', 'INCOTERMS', 'supply chain', 'fleet management', 'cold chain', 'warehouse', 'customs', 'SAPICS'],
    sector: 'logistics'
  },
  {
    family: 'Air Traffic Controller',
    typicalTitles: ['Air Traffic Controller', 'ATC Officer', 'Airport Operations Manager', 'Aviation Safety Officer'],
    minNQF: 6,
    acceptedQualifications: ['ATNS ATC Diploma', 'BSc Aviation Management', 'NDip Aviation'],
    professionalRegistrations: ['SACAA', 'ATNS'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['radar operation', 'radio telephony', 'ICAO phraseology', 'flight strip management'] },
      mid: { minYears: 4, coreSkills: ['approach control', 'area control', 'emergency procedures', 'ATIS management'] },
      senior: { minYears: 8, coreSkills: ['ATC unit management', 'safety management system', 'ICAO compliance', 'staff mentoring'] }
    },
    saSpecificFlags: ['SACAA licence', 'Medical Class 3 certificate', 'Security clearance'],
    industryKeywords: ['SACAA', 'ATNS', 'ATC', 'air traffic', 'radar', 'ICAO', 'aviation', 'radio telephony', 'approach control'],
    sector: 'logistics'
  },
  {
    family: 'Freight Forwarder',
    typicalTitles: ['Freight Forwarder', 'Customs Clearing Agent', 'Supply Chain Analyst (AI)'],
    minNQF: 6,
    acceptedQualifications: ['ND Supply Chain Management', 'Certificate in Freight Forwarding (SAAFF)', 'FIATA Diploma', 'BCom Logistics'],
    professionalRegistrations: ['SAAFF', 'FIATA', 'PPECB'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['customs documentation', 'SARS tariff codes', 'INCOTERMS', 'Bill of Lading'] },
      mid: { minYears: 3, coreSkills: ['customs clearance', 'PPECB compliance', 'air/sea freight', 'bonded warehouse'] },
      senior: { minYears: 7, coreSkills: ['trade compliance strategy', 'customs audit management', 'ATCAS'] }
    },
    saSpecificFlags: ['SARS registered CCA', "Driver's license"],
    industryKeywords: ['SAAFF', 'FIATA', 'customs', 'INCOTERMS', 'cargo', 'freight', 'Bill of Lading', 'PPECB', 'tariff codes'],
    sector: 'logistics'
  },

  // ── PUBLIC SECTOR & GOVERNMENT ───────────────────────────────────────────────
  {
    family: 'Public Policy Analyst',
    typicalTitles: ['Public Policy Analyst', 'Municipal Manager', 'Government Auditor', 'Tax Official', 'Urban Planner'],
    minNQF: 7,
    acceptedQualifications: ['BA Public Administration', 'MPA', 'BSc Urban/Regional Planning', 'LLB'],
    professionalRegistrations: ['SACPLAN', 'AGSA'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['policy drafting', 'public administration', 'GIS', 'budget analysis'] },
      mid: { minYears: 4, coreSkills: ['intergovernmental relations', 'municipal finance (MFMA)', 'DPSA frameworks'] },
      senior: { minYears: 8, coreSkills: ['policy strategy', 'SCM', 'Treasury regulations', 'public sector governance'] }
    },
    saSpecificFlags: ['ZA citizen', 'Security clearance', 'DPSA registration'],
    industryKeywords: ['DPSA', 'MFMA', 'Treasury', 'GIS', 'urban planning', 'SACPLAN', 'public administration', 'AGSA', 'SARS'],
    sector: 'public-sector'
  },
  {
    family: 'Social Worker',
    typicalTitles: ['Social Worker', 'Diplomat', 'Police Officer', 'Probation Officer', 'Community Development Worker'],
    minNQF: 7,
    acceptedQualifications: ['BSocSci Social Work', 'BA Social Work', 'NDip Policing (SAPS)'],
    professionalRegistrations: ['SACSSP', 'SAPS'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['community development', 'case management', 'social assessment', 'counselling'] },
      mid: { minYears: 4, coreSkills: ['child protection', 'substance abuse intervention', 'court reports'] },
      senior: { minYears: 8, coreSkills: ['social policy advocacy', 'NGO management', 'programme evaluation'] }
    },
    saSpecificFlags: ['SACSSP registration', 'Police clearance', 'Valid driver\'s license', 'ZA citizen'],
    industryKeywords: ['SACSSP', 'social work', 'community development', 'case management', 'child protection', 'NPO', 'NGO'],
    sector: 'public-sector'
  },

  // ── CALL CENTRE / BPO ────────────────────────────────────────────────────────
  {
    family: 'Call Centre Agent',
    typicalTitles: ['Call Centre Agent', 'Customer Service Representative', 'Contact Centre Agent', 'BPO Agent'],
    minNQF: 4,
    acceptedQualifications: ['Matric'],
    professionalRegistrations: [],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['MS Office', 'telephony', 'data entry'] },
      mid: { minYears: 2, coreSkills: ['CRM systems', 'sales targets', 'upselling'] },
      senior: { minYears: 5, coreSkills: ['team lead', 'quality assurance', 'workforce management'] }
    },
    saSpecificFlags: ['Fluent English/Afrikaans', 'Flexible shifts'],
    industryKeywords: ['CRM', 'Avaya', 'Genesys', 'call handling', 'customer service', 'BPO', 'contact centre'],
    sector: 'bpo'
  },

  // ── HUMAN RESOURCES ──────────────────────────────────────────────────────────
  {
    family: 'HR Specialist',
    typicalTitles: ['HR Officer', 'Recruiter', 'Talent Acquisition Specialist', 'HR Generalist', 'HR Manager'],
    minNQF: 7,
    acceptedQualifications: ['BCom HR Management', 'BA Social Science', 'BCom Industrial Psychology'],
    professionalRegistrations: ['SABPP'],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['recruitment', 'onboarding', 'HR administration', 'Labour Relations Act'] },
      mid: { minYears: 3, coreSkills: ['EE reporting', 'labour relations', 'CCMA processes', 'B-BBEE'] },
      senior: { minYears: 6, coreSkills: ['talent strategy', 'change management', 'organisational development'] }
    },
    saSpecificFlags: ['EE understanding', 'B-BBEE knowledge'],
    industryKeywords: ['EE plan', 'B-BBEE', 'SABPP', 'recruitment', 'performance management', 'CCMA', 'LRA', 'BCEA'],
    sector: 'hr'
  }
];

const knowledgebase: SAKnowledgebase = {
  profiles: JOB_PROFILES,

  getClosestProfile(input: string, options = { threshold: 0.4 }) {
    const cleanInput = input.toLowerCase().trim();
    let bestMatch: JobProfile | null = null;
    let bestScore = options.threshold ?? 0.4;

    for (const profile of this.profiles) {
      let score = 0;
      for (const title of profile.typicalTitles) {
        score = Math.max(score, fuzzyScore(title.toLowerCase(), cleanInput));
      }
      const keywordMatches = profile.industryKeywords.filter(kw => cleanInput.includes(kw.toLowerCase()));
      if (keywordMatches.length > 0) score += 0.2;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = profile;
      }
    }

    return bestScore > (options.threshold ?? 0.4) ? bestMatch : null;
  },

  scoreAgainstProfile(cvData: any, profile: JobProfile, tier: 'junior' | 'mid' | 'senior' = 'mid') {
    const expTier = profile.experienceTiers[tier];
    let matchScore = 0;
    const gaps: string[] = [];
    const strengths: string[] = [];

    // NQF check — uses full NQF_MAP, not a stub
    const nqf = getHighestNQF(cvData);
    const meetsNQF = nqf >= profile.minNQF;
    if (meetsNQF) {
      matchScore += 25;
      strengths.push(`NQF ${nqf} meets the NQF ${profile.minNQF} requirement`);
    } else {
      gaps.push(`NQF ${profile.minNQF}+ required — detected NQF ${nqf}`);
    }

    // Skills: match against both tier coreSkills AND profile industryKeywords
    // Require min 4 chars to avoid short-word false positives (e.g. "r", "c", "java" ≠ "javascript")
    const cvSkills = extractSkills(cvData);
    const allProfileSkills = [
      ...expTier.coreSkills,
      ...profile.industryKeywords
    ];
    const uniqueProfileSkills = [...new Set(allProfileSkills.map(s => s.toLowerCase()))];
    const matchedSkills = uniqueProfileSkills.filter(skill =>
      skill.length >= 4 &&
      cvSkills.some(cvSkill => {
        const cv = cvSkill.toLowerCase();
        // Only check if job skill contains CV skill (not reverse) to avoid "java" → "javascript"
        return cv.length >= 4 && (cv === skill || skill.includes(cv) || cv.includes(skill));
      })
    );
    matchScore += Math.min((matchedSkills.length / Math.max(uniqueProfileSkills.length, 1)) * 40, 40);
    strengths.push(...matchedSkills.slice(0, 4).map(s => `Strong in ${s}`));
    const missingCritical = expTier.coreSkills.filter(s =>
      s.length >= 4 && !matchedSkills.includes(s.toLowerCase())
    );
    gaps.push(...missingCritical.slice(0, 3).map(s => `Needs ${s}`));

    // Professional registration check
    const cvRegs = (cvData.registrations || []).map((r: string) => r.toLowerCase());
    const requiredRegs = profile.professionalRegistrations;
    let hasRegistration = false;
    if (requiredRegs.length > 0) {
      const matched = requiredRegs.filter(reg =>
        cvRegs.some((cv: string) => cv.includes(reg.toLowerCase()) || reg.toLowerCase().includes(cv))
      );
      if (matched.length > 0) {
        hasRegistration = true;
        matchScore += 20;
        strengths.push(`Registration confirmed: ${matched.join(', ')}`);
      } else {
        gaps.push(`Missing ${requiredRegs.join('/')} registration`);
      }
    }

    // SA-specific flags
    const cvText = JSON.stringify(cvData).toLowerCase();
    const flagMatches = profile.saSpecificFlags.filter(flag => cvText.includes(flag.toLowerCase()));
    if (profile.saSpecificFlags.length > 0) {
      matchScore += (flagMatches.length / profile.saSpecificFlags.length) * 15;
    }

    return { matchScore: Math.round(matchScore), gaps, strengths, meetsNQF, hasRegistration };
  }
};

export default knowledgebase;

export const SA_JOB_PROFILES = JOB_PROFILES;

export function detectJobFamily(cv: any) {
  const title = cv.title || cv.position || cv.job_title || '';
  return knowledgebase.getClosestProfile(title, { threshold: 0.3 });
}

const NQF_MAP: Record<string, number> = {
  'matric': 4, 'grade 12': 4, 'n3': 4,
  'n4': 5, 'n5': 5, 'n6': 5, 'certificate': 5,
  'national diploma': 6, 'nd ': 6, 'diploma': 6,
  'bcom': 7, 'bsc': 7, 'ba ': 7, 'beng': 7, 'btech': 7,
  'bachelor': 7, 'degree': 7, 'llb': 7, 'mbchb': 7, 'mbbch': 7,
  'bcur': 7, 'bpharm': 7, 'bsoc': 7, 'bdentistry': 8, 'bchd': 8,
  'honours': 8, 'hons': 8, 'postgraduate diploma': 8, 'pgdip': 8,
  'masters': 9, 'mba': 9, 'msc': 9, 'mcom': 9, 'ma ': 9, 'meng': 9, 'llm': 9,
  'phd': 10, 'doctorate': 10, 'dba': 10, 'dphil': 10
};

function getHighestNQF(cvData: any): number {
  let highest = 4;
  if (!cvData.education?.length) return highest;

  for (const edu of cvData.education) {
    // Use explicit nqfLevel if the parser already resolved it
    if (edu.nqfLevel) {
      highest = Math.max(highest, edu.nqfLevel);
      continue;
    }
    const qual = (edu.degree || '').toLowerCase();
    for (const [key, level] of Object.entries(NQF_MAP)) {
      if (qual.includes(key)) {
        highest = Math.max(highest, level);
      }
    }
  }
  return highest;
}

function extractSkills(cvData: any): string[] {
  const raw: string[] = [];
  if (!cvData.skills) return raw;
  if (Array.isArray(cvData.skills)) {
    raw.push(...cvData.skills.map((s: any) => (s.name || s || '').trim()).filter(Boolean));
  } else if (typeof cvData.skills === 'string') {
    raw.push(...cvData.skills.split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean));
  }

  // Also surface skills mentioned in experience descriptions and summary
  const freeText = [
    cvData.summary || '',
    ...(cvData.experience?.map((e: any) => e.description || '') || [])
  ].join(' ').toLowerCase();

  const COMMON_SA_SKILLS = [
    'ifrs', 'gaap', 'sap', 'sage', 'pastel', 'xero', 'excel', 'power bi',
    'python', 'javascript', 'typescript', 'react', 'node', 'sql', 'aws', 'azure',
    'autocad', 'solidworks', 'revit', 'popia', 'fica', 'fais', 'b-bbee',
    'ohs act', 'mhsa', 'six sigma', 'iso 9001', 'plc', 'scada', 'solar pv',
    'haccp', 'ventsim', 'deswik', 'incoterms', 'jbcc', 'agile', 'scrum',
    'sanc', 'hpcsa', 'iv therapy', 'patient care', 'dispensing', 'bls', 'als',
    'ccs candy', 'bill of quantities', 'financial modelling', 'vat', 'cima'
  ];
  const existing = new Set(raw.map(s => s.toLowerCase()));
  for (const skill of COMMON_SA_SKILLS) {
    if (freeText.includes(skill) && !existing.has(skill)) {
      raw.push(skill);
      existing.add(skill);
    }
  }
  return raw;
}
