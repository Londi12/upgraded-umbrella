/**
 * SA Job Knowledgebase - Complete Rewrite
 * Properly structured to match profile-scorer.ts consumption
 */

import type { CVData } from '@/types/cv-types';

export type SeniorityTier = 'junior' | 'mid' | 'senior';

export interface ExperienceTier {
  level: SeniorityTier;
  minYears: number;
  typicalTitles: string[];
  coreSkills: string[];
}

export interface ProfessionalRegistration {
  name: string;
  body: string; // e.g., 'SAICA', 'ECSA', 'LSCA'
  required: boolean;
}

export interface SASpecificFlags {
  driversLicenceRequired: boolean;
  eePreferred: boolean;
  securityClearance: boolean;
}

export interface GapPenalty {
  skill: string;
  weight: number; // 0-1
  message: string;
}

export interface SAJobProfile {
  id: string;
  family: string;
  typicalTitles: string[];
  minNQF: number;
  detectionKeywords: string[];
  coreSkills: {
    technical: string[];
    tools: string[];
  };
  professionalRegistrations: ProfessionalRegistration[];
  experienceTiers: ExperienceTier[];
  saSpecificFlags: SASpecificFlags;
  gapPenalties?: GapPenalty[];
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE DATABASE — 31 SA JOB PROFILES
// ═══════════════════════════════════════════════════════════════════════════

const SA_JOB_PROFILES: SAJobProfile[] = [
  // FINANCE & ACCOUNTING
  {
    id: 'ca-sa',
    family: 'Chartered Accountant (CA(SA))',
    typicalTitles: ['Chartered Accountant', 'CA(SA)', 'Financial Controller', 'Financial Manager', 'CFO'],
    minNQF: 8,
    detectionKeywords: ['IFRS', 'SAICA', 'CTA', 'financial statements', 'audit', 'tax', 'consolidation'],
    coreSkills: {
      technical: ['IFRS', 'financial reporting', 'tax compliance', 'audit prep', 'group consolidation'],
      tools: ['Sage', 'Pastel', 'Excel', 'accounting software', 'SARS systems']
    },
    professionalRegistrations: [
      { name: 'SAICA', body: 'South African Institute of Chartered Accountants', required: true }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 0, typicalTitles: ['Trainee', 'Article clerk'], coreSkills: ['IFRS', 'tax returns', 'audit prep'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Senior accountant', 'Manager'], coreSkills: ['IFRS', 'financial reporting', 'tax compliance', 'Sage/Pastel'] },
      { level: 'senior', minYears: 7, typicalTitles: ['Financial Controller', 'CFO', 'Partner'], coreSkills: ['IFRS 17', 'group consolidation', 'stakeholder management'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: false },
    gapPenalties: [
      { skill: 'SAICA registration', weight: 1.0, message: 'SAICA membership mandatory for CA(SA) title' }
    ]
  },
  {
    id: 'financial-analyst',
    family: 'Financial Analyst',
    typicalTitles: ['Financial Analyst', 'Management Accountant', 'Cost Accountant', 'FP&A Analyst'],
    minNQF: 7,
    detectionKeywords: ['financial modelling', 'budgeting', 'forecasting', 'variance analysis', 'Power BI'],
    coreSkills: {
      technical: ['financial modelling', 'budgeting', 'forecasting', 'variance analysis', 'ERP systems'],
      tools: ['Power BI', 'SQL', 'Excel advanced', 'SAP', 'Tableau']
    },
    professionalRegistrations: [
      { name: 'CIMA', body: 'Chartered Institute of Management Accountants', required: false }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Analyst'], coreSkills: ['Excel', 'financial modelling', 'budgeting'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Senior analyst', 'Team lead'], coreSkills: ['Power BI', 'SQL', 'forecasting', 'variance analysis'] },
      { level: 'senior', minYears: 6, typicalTitles: ['Manager', 'Director'], coreSkills: ['ERP systems', 'stakeholder reporting', 'strategy'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: false }
  },

  // TECH & IT (5 profiles)
  {
    id: 'software-engineer',
    family: 'Software Engineer',
    typicalTitles: ['Software Developer', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer'],
    minNQF: 7,
    detectionKeywords: ['JavaScript', 'React', 'Node', 'AWS', 'Azure', '.NET', 'SQL', 'API', 'Git', 'microservices'],
    coreSkills: {
      technical: ['JavaScript', 'React', 'Node.js', '.NET', 'API design', 'database design'],
      tools: ['Git', 'Docker', 'AWS', 'Azure', 'CI/CD pipelines', 'REST APIs']
    },
    professionalRegistrations: [],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Junior developer', 'Graduate developer'], coreSkills: ['JavaScript', 'React', 'Node.js', '.NET'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Developer', 'Senior developer'], coreSkills: ['AWS/Azure', 'Docker', 'microservices', 'CI/CD'] },
      { level: 'senior', minYears: 6, typicalTitles: ['Lead developer', 'Principal engineer'], coreSkills: ['system architecture', 'technical leadership', 'mentoring'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: false, securityClearance: false },
    gapPenalties: [
      { skill: 'git', weight: 0.8, message: 'Version control (Git) critical for software engineering' }
    ]
  },
  {
    id: 'data-analyst',
    family: 'Data Analyst',
    typicalTitles: ['Data Analyst', 'Business Intelligence Analyst', 'Reporting Analyst'],
    minNQF: 7,
    detectionKeywords: ['SQL', 'Power BI', 'Tableau', 'Python', 'ETL', 'data visualization', 'analytics'],
    coreSkills: {
      technical: ['SQL', 'data warehouse', 'ETL', 'statistical analysis', 'data modelling'],
      tools: ['Power BI', 'Tableau', 'Python', 'Excel', 'SQL Server', 'Google Analytics']
    },
    professionalRegistrations: [],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Junior analyst'], coreSkills: ['Excel', 'Power BI', 'SQL'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Data analyst', 'BI analyst'], coreSkills: ['Python/R', 'ETL', 'data warehouse'] },
      { level: 'senior', minYears: 5, typicalTitles: ['Senior analyst', 'Analytics manager'], coreSkills: ['ML models', 'data strategy'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: false, securityClearance: false }
  },
  {
    id: 'network-engineer',
    family: 'Network Engineer',
    typicalTitles: ['Network Engineer', 'Network Administrator', 'Systems Administrator', 'IT Infrastructure Engineer'],
    minNQF: 6,
    detectionKeywords: ['Cisco', 'networking', 'TCP/IP', 'firewall', 'AWS', 'Azure', 'infrastructure'],
    coreSkills: {
      technical: ['TCP/IP', 'LAN/WAN', 'routing', 'switching', 'network security', 'cloud networking'],
      tools: ['Cisco', 'Fortinet', 'SD-WAN', 'Azure', 'AWS', 'Linux', 'Windows Server']
    },
    professionalRegistrations: [
      { name: 'CCNA', body: 'Cisco Certified Network Associate', required: false },
      { name: 'CompTIA Network+', body: 'CompTIA', required: false }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Support engineer'], coreSkills: ['TCP/IP', 'LAN/WAN', 'Active Directory', 'VLAN'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Network engineer', 'Senior engineer'], coreSkills: ['Fortinet', 'Cisco', 'SD-WAN', 'Azure/AWS networking'] },
      { level: 'senior', minYears: 7, typicalTitles: ['Network architect', 'Infrastructure manager'], coreSkills: ['network architecture', 'NOC management', 'BGP/OSPF'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: false, securityClearance: false }
  },
  {
    id: 'business-analyst',
    family: 'Business Analyst',
    typicalTitles: ['Business Analyst', 'Systems Analyst', 'Requirements Analyst', 'Solutions Architect'],
    minNQF: 7,
    detectionKeywords: ['requirements', 'use cases', 'data modelling', 'business process', 'stakeholder', 'solution design'],
    coreSkills: {
      technical: ['requirements gathering', 'data modelling', 'UML', 'business process mapping', 'solution design'],
      tools: ['Jira', 'Confluence', 'MS Visio', 'Excel', 'SQL', 'data modelling tools']
    },
    professionalRegistrations: [
      { name: 'IIBA', body: 'International Institute of Business Analysis', required: false }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Junior analyst'], coreSkills: ['requirements gathering', 'documentation', 'user stories'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Business analyst'], coreSkills: ['solution design', 'stakeholder management', 'data modelling', 'UAT coordination'] },
      { level: 'senior', minYears: 6, typicalTitles: ['Senior BA', 'Solutions architect'], coreSkills: ['enterprise architecture', 'business case development', 'change management'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: false, securityClearance: false }
  },

  // MINING & ENGINEERING
  {
    id: 'mining-engineer',
    family: 'Mining Engineer',
    typicalTitles: ['Mining Engineer', 'Mine Planner', 'Geotechnical Engineer'],
    minNQF: 8,
    detectionKeywords: ['VentSim', 'Deswik', 'mine planning', 'blast design', 'mine ventilation'],
    coreSkills: {
      technical: ['mine planning', 'blast design', 'ventilation design', 'geotechnical analysis', 'safety management'],
      tools: ['VentSim', 'Deswik', 'AutoCAD', 'Surpac', 'Minex']
    },
    professionalRegistrations: [
      { name: 'ECSA', body: 'Engineering Council of South Africa', required: true },
      { name: 'PLATO', body: 'Professionalism in Land and Tenure Operations', required: false }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 0, typicalTitles: ['Graduate engineer'], coreSkills: ['VentSim', 'Deswik', 'AutoCAD'] },
      { level: 'mid', minYears: 5, typicalTitles: ['Mining engineer'], coreSkills: ['blast design', 'mine ventilation', 'planning'] },
      { level: 'senior', minYears: 10, typicalTitles: ['Senior engineer', 'Mine manager'], coreSkills: ['mine optimization', 'safety management', 'strategic planning'] }
    ],
    saSpecificFlags: { driversLicenceRequired: true, eePreferred: false, securityClearance: false },
    gapPenalties: [
      { skill: 'ECSA registration', weight: 1.0, message: 'ECSA registration required for professional engineer role' }
    ]
  },

  // HEALTHCARE
  {
    id: 'registered-nurse',
    family: 'Registered Nurse',
    typicalTitles: ['Registered Nurse', 'Professional Nurse', 'RN'],
    minNQF: 7,
    detectionKeywords: ['nursing', 'patient care', 'IV therapy', 'medication', 'SANC', 'HPCSA'],
    coreSkills: {
      technical: ['patient care', 'medication administration', 'IV therapy', 'wound care', 'clinical assessment'],
      tools: ['medical records systems', 'patient monitoring equipment', 'IV cannulas', 'vital signs monitoring']
    },
    professionalRegistrations: [
      { name: 'SANC', body: 'South African Nursing Council', required: true },
      { name: 'HPCSA', body: 'Health Professions Council of South Africa', required: true }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Staff nurse'], coreSkills: ['patient care', 'medication admin', 'basic nursing'] },
      { level: 'mid', minYears: 4, typicalTitles: ['Senior nurse', 'Nurse specialist'], coreSkills: ['IV therapy', 'wound care', 'patient education'] },
      { level: 'senior', minYears: 8, typicalTitles: ['Nurse manager', 'Senior specialist'], coreSkills: ['nurse management', 'quality control', 'training'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: false },
    gapPenalties: [
      { skill: 'SANC registration', weight: 1.0, message: 'SANC registration mandatory for professional nursing' }
    ]
  },

  // BPO & CUSTOMER SERVICE
  {
    id: 'call-centre-agent',
    family: 'Call Centre Agent',
    typicalTitles: ['Call Centre Agent', 'Customer Service Representative', 'Contact Centre Agent'],
    minNQF: 4,
    detectionKeywords: ['CRM', 'customer service', 'telephony', 'call handling', 'Avaya', 'Genesys'],
    coreSkills: {
      technical: ['customer service', 'communication', 'problem solving', 'call handling', 'CRM systems'],
      tools: ['CRM systems', 'Avaya', 'Genesys', 'MS Office', 'telephone systems', 'call recording']
    },
    professionalRegistrations: [],
    experienceTiers: [
      { level: 'junior', minYears: 0, typicalTitles: ['Agent'], coreSkills: ['MS Office', 'telephony', 'customer service'] },
      { level: 'mid', minYears: 2, typicalTitles: ['Senior agent', 'Team leader'], coreSkills: ['CRM systems', 'sales targets', 'quality assurance'] },
      { level: 'senior', minYears: 5, typicalTitles: ['Supervisor', 'Manager'], coreSkills: ['team lead', 'quality assurance', 'training'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: false }
  },

  // HR & RECRUITMENT
  {
    id: 'hr-specialist',
    family: 'HR Specialist',
    typicalTitles: ['HR Officer', 'Recruiter', 'Talent Acquisition', 'HR Generalist'],
    minNQF: 7,
    detectionKeywords: ['recruitment', 'EE plan', 'B-BBEE', 'labour relations', 'SABPP'],
    coreSkills: {
      technical: ['recruitment', 'onboarding', 'EE reporting', 'labour relations', 'performance management'],
      tools: ['HRIS systems', 'SAP HCM', 'recruitment platforms', 'Excel', 'LinkedIn Recruiter']
    },
    professionalRegistrations: [
      { name: 'SABPP', body: 'South African Board for People Practices', required: false }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['HR coordinator', 'Recruiter'], coreSkills: ['recruitment', 'onboarding', 'admin'] },
      { level: 'mid', minYears: 3, typicalTitles: ['HR officer', 'Recruitment manager'], coreSkills: ['EE reporting', 'labour relations', 'policy implementation'] },
      { level: 'senior', minYears: 6, typicalTitles: ['HR manager', 'Head of HR'], coreSkills: ['talent strategy', 'change management', 'strategic HR'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: false }
  },

  // LEGAL (2 profiles)
  {
    id: 'attorney',
    family: 'Attorney',
    typicalTitles: ['Attorney', 'Associate', 'Legal Advisor', 'In-House Counsel', 'Candidate Attorney'],
    minNQF: 8,
    detectionKeywords: ['LPC', 'legal drafting', 'litigation', 'conveyancing', 'POPIA', 'Companies Act'],
    coreSkills: {
      technical: ['legal drafting', 'contract review', 'litigation', 'legal research', 'dispute resolution'],
      tools: ['LexisNexis', 'case management systems', 'legal research databases', 'MS Office']
    },
    professionalRegistrations: [
      { name: 'Legal Practice Council (LPC)', body: 'Law Society of South Africa', required: true }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 0, typicalTitles: ['Candidate attorney', 'Junior associate'], coreSkills: ['legal drafting', 'contract review', 'research'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Attorney', 'Senior associate'], coreSkills: ['litigation', 'dispute resolution', 'client management'] },
      { level: 'senior', minYears: 8, typicalTitles: ['Senior attorney', 'Partner'], coreSkills: ['practice management', 'client development', 'senior counsel'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: false },
    gapPenalties: [
      { skill: 'LPC admission', weight: 1.0, message: 'LPC admission mandatory for attorney role' }
    ]
  },
  {
    id: 'paralegal',
    family: 'Legal Secretary / Paralegal',
    typicalTitles: ['Legal Secretary', 'Paralegal', 'Litigation Secretary', 'Conveyancing Secretary'],
    minNQF: 5,
    detectionKeywords: ['legal secretary', 'paralegal', 'conveyancing', 'summons', 'ghost convey', 'deeds'],
    coreSkills: {
      technical: ['legal documentation', 'filing', 'conveyancing', 'billing', 'court procedures'],
      tools: ['Ghost Convey', 'Lexis Nexis', 'legal databases', 'typing', 'MS Office']
    },
    professionalRegistrations: [],
    experienceTiers: [
      { level: 'junior', minYears: 0, typicalTitles: ['Legal secretary', 'Paralegal'], coreSkills: ['typing', 'filing', 'court documentation'] },
      { level: 'mid', minYears: 2, typicalTitles: ['Senior paralegal'], coreSkills: ['Ghost Convey', 'summons drafting', 'billing'] },
      { level: 'senior', minYears: 5, typicalTitles: ['Senior legal secretary'], coreSkills: ['senior attorney support', 'practice management', 'trust accounting'] }
    ],
    saSpecificFlags: { driversLicenceRequired: true, eePreferred: true, securityClearance: false }
  },

  // LOGISTICS & SUPPLY CHAIN (3 profiles)
  {
    id: 'supply-chain-manager',
    family: 'Supply Chain Manager',
    typicalTitles: ['Supply Chain Manager', 'Logistics Manager', 'Operations Manager', 'Procurement Manager'],
    minNQF: 7,
    detectionKeywords: ['SAP', 'S&OP', 'procurement', 'inventory', 'freight', 'SAPICS', 'CIPS'],
    coreSkills: {
      technical: ['demand planning', 'procurement', 'inventory management', 'S&OP', 'cost optimization'],
      tools: ['SAP', 'demand planning software', 'ERP systems', 'Excel', 'logistics TMS']
    },
    professionalRegistrations: [
      { name: 'SAPICS', body: 'South African Production and Inventory Control Society', required: false },
      { name: 'CIPS', body: 'Chartered Institute of Procurement & Supply', required: false }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Coordinator'], coreSkills: ['SAP', 'demand planning', 'purchase orders'] },
      { level: 'mid', minYears: 4, typicalTitles: ['Manager'], coreSkills: ['S&OP', 'inventory optimisation', 'freight management'] },
      { level: 'senior', minYears: 8, typicalTitles: ['Director', 'VP'], coreSkills: ['end-to-end supply chain', 'strategic procurement', 'risk management'] }
    ],
    saSpecificFlags: { driversLicenceRequired: true, eePreferred: true, securityClearance: false }
  },
  {
    id: 'warehouse-manager',
    family: 'Warehouse Manager',
    typicalTitles: ['Warehouse Manager', 'Distribution Centre Manager', 'Stores Manager', 'Inventory Controller'],
    minNQF: 5,
    detectionKeywords: ['WMS', 'inventory', 'FIFO', 'shrinkage', 'forklift', 'picking', 'packing'],
    coreSkills: {
      technical: ['inventory management', 'stock control', 'FIFO/FEFO', 'team supervision', 'safety management'],
      tools: ['WMS', 'SAP WM', 'RF scanners', 'Excel', 'forklift systems']
    },
    professionalRegistrations: [],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Supervisor'], coreSkills: ['stock counts', 'GRV', 'forklift operation'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Manager'], coreSkills: ['WMS', 'SAP WM', 'team supervision', 'FIFO/FEFO'] },
      { level: 'senior', minYears: 6, typicalTitles: ['Warehouse manager'], coreSkills: ['P&L management', 'SLA management', '3PL oversight'] }
    ],
    saSpecificFlags: { driversLicenceRequired: true, eePreferred: true, securityClearance: false }
  },
  {
    id: 'fleet-manager',
    family: 'Fleet / Transport Manager',
    typicalTitles: ['Fleet Manager', 'Transport Manager', 'Fleet Controller', 'Logistics Controller'],
    minNQF: 6,
    detectionKeywords: ['fleet', 'RTMS', 'route planning', 'MiX Telematics', 'transport', 'cross-border'],
    coreSkills: {
      technical: ['route planning', 'driver management', 'fleet maintenance', 'compliance', 'cost optimization'],
      tools: ['MiX Telematics', 'Tracker', 'RTMS', 'fleet management systems', 'Excel']
    },
    professionalRegistrations: [
      { name: 'RTMS', body: 'Road Transport Management System', required: false }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Coordinator'], coreSkills: ['route planning', 'driver management', 'vehicle inspections'] },
      { level: 'mid', minYears: 4, typicalTitles: ['Manager'], coreSkills: ['fleet cost management', 'RTMS compliance', 'maintenance scheduling'] },
      { level: 'senior', minYears: 8, typicalTitles: ['Director'], coreSkills: ['fleet capex planning', 'SLA management', 'cross-border logistics'] }
    ],
    saSpecificFlags: { driversLicenceRequired: true, eePreferred: true, securityClearance: false }
  },

  // RETAIL (2 profiles)
  {
    id: 'retail-store-manager',
    family: 'Retail Store Manager',
    typicalTitles: ['Store Manager', 'Branch Manager', 'Retail Manager', 'Area Manager', 'Shop Manager'],
    minNQF: 5,
    detectionKeywords: ['POS', 'shrinkage', 'conversion rate', 'visual merchandising', 'planogram', 'stock management'],
    coreSkills: {
      technical: ['P&L management', 'staff scheduling', 'stock management', 'customer service', 'sales targets'],
      tools: ['POS systems', 'Excel', 'SPAR/Woolworths systems', 'scheduling software']
    },
    professionalRegistrations: [],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Assistant manager'], coreSkills: ['POS systems', 'stock management', 'customer service'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Store manager'], coreSkills: ['P&L management', 'staff scheduling', 'shrinkage control'] },
      { level: 'senior', minYears: 6, typicalTitles: ['Area manager', 'Regional manager'], coreSkills: ['multi-site management', 'HR/IR', 'turnaround management'] }
    ],
    saSpecificFlags: { driversLicenceRequired: true, eePreferred: true, securityClearance: false }
  },
  {
    id: 'buyer-planner',
    family: 'Buyer / Merchandise Planner',
    typicalTitles: ['Buyer', 'Assistant Buyer', 'Merchandise Planner', 'Category Manager', 'Planner'],
    minNQF: 7,
    detectionKeywords: ['OTB', 'markdown', 'range planning', 'supplier negotiation', 'planogram', 'sell-through'],
    coreSkills: {
      technical: ['OTB management', 'range building', 'margin management', 'markdown strategy', 'trend analysis'],
      tools: ['Excel advanced', 'WSSI', 'retail planning systems', 'supplier management systems']
    },
    professionalRegistrations: [],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Assistant buyer'], coreSkills: ['OTB management', 'range building', 'supplier liaison'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Buyer'], coreSkills: ['margin management', 'markdown strategy', 'planogram', 'trend analysis'] },
      { level: 'senior', minYears: 6, typicalTitles: ['Senior buyer', 'Category manager'], coreSkills: ['category P&L', 'supplier negotiation', 'private label development'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: false }
  },

  // GOVERNMENT & PUBLIC SECTOR (2 profiles)
  {
    id: 'govt-administrator',
    family: 'Government Administrator',
    typicalTitles: ['Administrative Officer', 'Public Servant', 'Government Official', 'Policy Analyst', 'Municipal Officer'],
    minNQF: 6,
    detectionKeywords: ['PFMA', 'PERSAL', 'BAS', 'treasury regulations', 'MFMA', 'government compliance'],
    coreSkills: {
      technical: ['PFMA compliance', 'supply chain compliance', 'budget management', 'policy implementation', 'report writing'],
      tools: ['PERSAL', 'BAS system', 'Excel', 'government portals', 'SAP']
    },
    professionalRegistrations: [],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Officer'], coreSkills: ['PFMA compliance', 'PERSAL', 'report writing'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Senior officer'], coreSkills: ['supply chain compliance', 'BAS system', 'treasury regulations'] },
      { level: 'senior', minYears: 7, typicalTitles: ['Manager', 'Director'], coreSkills: ['Exco reporting', 'budget oversight', 'intergovernmental relations'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: true }
  },
  {
    id: 'social-worker',
    family: 'Social Worker',
    typicalTitles: ['Social Worker', 'Social Auxiliary Worker', 'Case Manager', 'Child Protection Officer'],
    minNQF: 7,
    detectionKeywords: ['case management', 'child protection', 'SACSSP', 'DSD', 'foster care', 'statutory work'],
    coreSkills: {
      technical: ['case management', 'report writing', 'child protection', 'DSD policy', 'court procedures'],
      tools: ['case management systems', 'Office Suite', 'DSD reporting systems']
    },
    professionalRegistrations: [
      { name: 'SACSSP', body: 'South African Council for Social Service Professions', required: true }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 0, typicalTitles: ['Social worker'], coreSkills: ['case management', 'report writing', 'child protection'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Senior social worker'], coreSkills: ['court report writing', 'statutory work', 'foster care'] },
      { level: 'senior', minYears: 7, typicalTitles: ['Senior practitioner', 'Manager'], coreSkills: ['programme management', 'supervision', 'strategic planning'] }
    ],
    saSpecificFlags: { driversLicenceRequired: true, eePreferred: true, securityClearance: true },
    gapPenalties: [
      { skill: 'SACSSP registration', weight: 1.0, message: 'SACSSP registration required for professional social work' }
    ]
  },

  // CONSTRUCTION & PROPERTY (3 profiles)
  {
    id: 'civil-engineer',
    family: 'Civil / Structural Engineer',
    typicalTitles: ['Civil Engineer', 'Structural Engineer', 'Site Engineer', 'Project Engineer'],
    minNQF: 8,
    detectionKeywords: ['AutoCAD', 'Civil 3D', 'FIDIC', 'structural design', 'NEC3', 'site supervision'],
    coreSkills: {
      technical: ['site supervision', 'structural design', 'concrete design', 'project management', 'FIDIC contracts'],
      tools: ['AutoCAD', 'Civil 3D', 'SAP2000', 'Revit', 'project management software']
    },
    professionalRegistrations: [
      { name: 'ECSA', body: 'Engineering Council of South Africa', required: true }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 0, typicalTitles: ['Graduate engineer'], coreSkills: ['AutoCAD', 'Civil 3D', 'site supervision'] },
      { level: 'mid', minYears: 5, typicalTitles: ['Engineer'], coreSkills: ['project management', 'FIDIC contracts', 'design'] },
      { level: 'senior', minYears: 10, typicalTitles: ['Senior engineer', 'Principal'], coreSkills: ['Pr.Eng registration', 'multi-disciplinary leadership', 'NEC/FIDIC'] }
    ],
    saSpecificFlags: { driversLicenceRequired: true, eePreferred: false, securityClearance: false },
    gapPenalties: [
      { skill: 'ECSA registration', weight: 1.0, message: 'ECSA registration required for professional engineer role' }
    ]
  },
  {
    id: 'property-agent',
    family: 'Property / Estate Agent',
    typicalTitles: ['Estate Agent', 'Property Practitioner', 'Rental Agent', 'Commercial Property Broker'],
    minNQF: 4,
    detectionKeywords: ['FFC', 'PPRA', 'property', 'conveyancing', 'bond origination', 'sectional title'],
    coreSkills: {
      technical: ['property sales', 'market analysis', 'client relations', 'conveyancing', 'negotiation'],
      tools: ['Prop Data', 'Lightstone', 'MLS systems', 'Excel', 'property portals']
    },
    professionalRegistrations: [
      { name: 'FFC', body: 'Fidelity Fund Certificate', required: true },
      { name: 'PPRA', body: 'Property Practitioners Regulatory Authority', required: true }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 0, typicalTitles: ['Property agent'], coreSkills: ['show houses', 'listing generation', 'MLS systems'] },
      { level: 'mid', minYears: 2, typicalTitles: ['Broker'], coreSkills: ['mandate management', 'OTP drafting', 'transfer process'] },
      { level: 'senior', minYears: 5, typicalTitles: ['Principal broker', 'Director'], coreSkills: ['principal agent', 'office management', 'agent development'] }
    ],
    saSpecificFlags: { driversLicenceRequired: true, eePreferred: true, securityClearance: false }
  },
  {
    id: 'quantity-surveyor',
    family: 'Quantity Surveyor',
    typicalTitles: ['Quantity Surveyor', 'QS', 'Cost Manager', 'Estimator'],
    minNQF: 7,
    detectionKeywords: ['BOQ', 'CCS Candy', 'JBCC', 'cost estimation', 'variation order', 'final account'],
    coreSkills: {
      technical: ['cost estimation', 'Bills of Quantities', 'measurement', 'cost reporting', 'contract management'],
      tools: ['CCS Candy', 'Excel', 'CAD systems', 'estimating software', 'project management']
    },
    professionalRegistrations: [
      { name: 'SACQSP', body: 'South African Council for the Quantity Surveying Profession', required: true }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Assistant QS'], coreSkills: ['Bills of Quantities', 'measurement', 'CCS Candy'] },
      { level: 'mid', minYears: 4, typicalTitles: ['Quantity surveyor'], coreSkills: ['cost reporting', 'JBCC contracts', 'variation orders'] },
      { level: 'senior', minYears: 8, typicalTitles: ['Senior QS', 'Principal'], coreSkills: ['project QS lead', 'PQS role', 'dispute resolution'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: false, securityClearance: false }
  },

  // EDUCATION
  {
    id: 'teacher',
    family: 'Teacher',
    typicalTitles: ['Teacher', 'Educator', 'Lecturer', 'Facilitator', 'Grade R Practitioner'],
    minNQF: 6,
    detectionKeywords: ['CAPS', 'lesson planning', 'IEB', 'NSC', 'SACE', 'classroom management'],
    coreSkills: {
      technical: ['lesson planning', 'CAPS curriculum', 'classroom management', 'assessment', 'student engagement'],
      tools: ['Google Classroom', 'Microsoft Teams', 'LMS platforms', 'Office Suite']
    },
    professionalRegistrations: [
      { name: 'SACE', body: 'South African Council for Educators', required: true }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 0, typicalTitles: ['Teacher', 'Educator'], coreSkills: ['lesson planning', 'CAPS curriculum', 'classroom management'] },
      { level: 'mid', minYears: 4, typicalTitles: ['Senior teacher', 'Subject lead'], coreSkills: ['subject HOD', 'exam marking', 'intervention programmes'] },
      { level: 'senior', minYears: 10, typicalTitles: ['HOD', 'Deputy principal'], coreSkills: ['HOD role', 'curriculum development', 'leadership'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: true }
  },

  // FINANCIAL SERVICES (2 profiles)
  {
    id: 'financial-planner',
    family: 'Financial Planner / Wealth Manager',
    typicalTitles: ['Financial Planner', 'Wealth Manager', 'Financial Advisor', 'Investment Consultant', 'Relationship Banker'],
    minNQF: 7,
    detectionKeywords: ['RE5', 'RE1', 'FAIS', 'CFP', 'financial planning', 'portfolio management'],
    coreSkills: {
      technical: ['needs analysis', 'risk profiling', 'financial planning', 'portfolio management', 'estate planning'],
      tools: ['Xplan', 'Salesforce', 'financial planning software', 'Excel', 'investment platforms']
    },
    professionalRegistrations: [
      { name: 'FPI (CFP)', body: 'Financial Planning Institute', required: false }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Financial advisor'], coreSkills: ['needs analysis', 'risk profiling', 'RE5', 'product knowledge'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Planner'], coreSkills: ['CFP designation', 'estate planning', 'portfolio management'] },
      { level: 'senior', minYears: 7, typicalTitles: ['Senior advisor', 'Manager'], coreSkills: ['HNW management', 'fiduciary services', 'business solutions'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: false }
  },
  {
    id: 'insurance-broker',
    family: 'Short Term Insurance Broker / Underwriter',
    typicalTitles: ['Short Term Broker', 'Underwriter', 'Claims Assessor', 'Commercial Lines Broker'],
    minNQF: 6,
    detectionKeywords: ['RE5', 'underwriting', 'claims', 'Guidewire', 'commercial lines', 'reinsurance'],
    coreSkills: {
      technical: ['policy administration', 'claims handling', 'underwriting', 'risk assessment', 'broker management'],
      tools: ['Guidewire', 'Sapiens', 'claims systems', 'Excel']
    },
    professionalRegistrations: [
      { name: 'FSCA', body: 'Financial Sector Conduct Authority', required: true }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Administrator'], coreSkills: ['policy administration', 'claims handling', 'Guidewire', 'RE5'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Broker', 'Underwriter'], coreSkills: ['commercial underwriting', 'risk survey', 'broker relations'] },
      { level: 'senior', minYears: 7, typicalTitles: ['Senior broker', 'Manager'], coreSkills: ['portfolio management', 'treaty reinsurance', 'product development'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: false }
  },

  // MANUFACTURING (2 profiles)
  {
    id: 'production-manager',
    family: 'Production / Plant Manager',
    typicalTitles: ['Production Manager', 'Plant Manager', 'Manufacturing Manager', 'Operations Manager'],
    minNQF: 7,
    detectionKeywords: ['OEE', 'Lean', 'Six Sigma', 'SAP PP', 'ISO 9001', 'continuous improvement'],
    coreSkills: {
      technical: ['OEE tracking', 'shift management', 'Lean manufacturing', 'Six Sigma', 'safety management'],
      tools: ['SAP PP', 'Excel', 'quality management systems', 'maintenance management']
    },
    professionalRegistrations: [],
    experienceTiers: [
      { level: 'junior', minYears: 2, typicalTitles: ['Supervisor'], coreSkills: ['OEE tracking', 'shift management', 'ISO 9001', '5S'] },
      { level: 'mid', minYears: 5, typicalTitles: ['Manager'], coreSkills: ['lean manufacturing', 'Six Sigma', 'capex management'] },
      { level: 'senior', minYears: 10, typicalTitles: ['Director'], coreSkills: ['plant P&L', 'world-class manufacturing', 'greenfield/brownfield'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: false }
  },
  {
    id: 'qa-manager',
    family: 'Quality Assurance Manager',
    typicalTitles: ['QA Manager', 'Quality Controller', 'Quality Technician', 'Food Technologist'],
    minNQF: 6,
    detectionKeywords: ['HACCP', 'GMP', 'FSSC 22000', 'ISO 22000', 'food safety', 'auditing'],
    coreSkills: {
      technical: ['HACCP', 'GMP', 'ISO 22000', 'FSSC 22000', 'audit management', 'food safety'],
      tools: ['audit software', 'Excel', 'SQF systems', 'food testing equipment']
    },
    professionalRegistrations: [],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['QA technician'], coreSkills: ['HACCP', 'GMP', 'sensory evaluation', 'NCR management'] },
      { level: 'mid', minYears: 4, typicalTitles: ['QA officer'], coreSkills: ['ISO 22000', 'FSSC 22000', 'audit management', 'SQF'] },
      { level: 'senior', minYears: 8, typicalTitles: ['QA manager', 'Director'], coreSkills: ['GFSI scheme management', 'food safety culture', 'regulatory affairs'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: false }
  },

  // HOSPITALITY
  {
    id: 'hotel-manager',
    family: 'Hotel / Lodge Manager',
    typicalTitles: ['Hotel Manager', 'Lodge Manager', 'Front Office Manager', 'F&B Manager', 'Guest Relations Manager'],
    minNQF: 6,
    detectionKeywords: ['Opera PMS', 'RevPAR', 'guest experience', 'F&B service', 'booking', 'hospitality'],
    coreSkills: {
      technical: ['room management', 'guest experience', 'F&B service', 'staff scheduling', 'P&L management'],
      tools: ['Opera PMS', 'Fidelio', 'Booking.com', 'OTA management', 'Excel']
    },
    professionalRegistrations: [],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Staff member'], coreSkills: ['Opera PMS', 'Fidelio', 'room management', 'guest experience'] },
      { level: 'mid', minYears: 4, typicalTitles: ['Manager'], coreSkills: ['RevPAR management', 'OTA management', 'staff scheduling'] },
      { level: 'senior', minYears: 8, typicalTitles: ['Director', 'Area manager'], coreSkills: ['property P&L', 'owner relations', 'MICE management'] }
    ],
    saSpecificFlags: { driversLicenceRequired: true, eePreferred: true, securityClearance: false }
  },

  // ADMIN & SUPPORT (2 profiles)
  {
    id: 'executive-pa',
    family: 'Executive Personal Assistant',
    typicalTitles: ['Executive PA', 'Personal Assistant', 'Executive Assistant', 'Office Manager', 'Company Secretary'],
    minNQF: 6,
    detectionKeywords: ['PA', 'executive support', 'board', 'CIPC', 'minute taking', 'governance'],
    coreSkills: {
      technical: ['diary management', 'minute taking', 'event coordination', 'board support', 'corporate governance'],
      tools: ['MS Office 365', 'Concur', 'SAP', 'project management tools', 'CIPC systems']
    },
    professionalRegistrations: [],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['PA', 'Assistant'], coreSkills: ['MS Office 365', 'diary management', 'minute taking'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Senior PA'], coreSkills: ['board pack preparation', 'Concur', 'SAP', 'event coordination'] },
      { level: 'senior', minYears: 7, typicalTitles: ['Executive PA', 'Office manager'], coreSkills: ['C-suite support', 'corporate governance', 'board secretarial'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: false, securityClearance: false }
  },
  {
    id: 'payroll-admin',
    family: 'Payroll Administrator',
    typicalTitles: ['Payroll Administrator', 'Payroll Officer', 'Payroll Manager', 'Compensation & Benefits Manager'],
    minNQF: 6,
    detectionKeywords: ['VIP Payroll', 'PAYE', 'SARS', 'IRP5', 'EMP501', 'leave management'],
    coreSkills: {
      technical: ['PAYE management', 'UIF administration', 'leave management', 'SARS compliance', 'benefits administration'],
      tools: ['VIP Payroll', 'Sage 300', 'SAP HCM', 'SARS eFiling', 'Excel']
    },
    professionalRegistrations: [
      { name: 'SAPA', body: 'SA Payroll Association', required: false }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Payroll clerk'], coreSkills: ['VIP Payroll', 'PAYE', 'UIF', 'SDL'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Payroll officer'], coreSkills: ['SAP HCM', 'Sage 300', 'SARS eFiling', 'EMP501'] },
      { level: 'senior', minYears: 6, typicalTitles: ['Payroll manager'], coreSkills: ['payroll strategy', 'SARSS compliance', 'C&B benchmarking'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: false }
  },

  // SHEQ
  {
    id: 'sheq-manager',
    family: 'SHEQ Manager',
    typicalTitles: ['SHEQ Manager', 'HSE Manager', 'Safety Officer', 'EHS Specialist', 'Risk Manager'],
    minNQF: 6,
    detectionKeywords: ['OHSA', 'MHSA', 'ISO 45001', 'ISO 14001', 'SAMTRAC', 'NEBOSH', 'incident investigation'],
    coreSkills: {
      technical: ['incident investigation', 'risk assessment', 'OHSA compliance', 'audit management', 'safety culture'],
      tools: ['safety management systems', 'Excel', 'incident reporting systems', 'audit software']
    },
    professionalRegistrations: [
      { name: 'SAIOSH', body: 'South African Institute for Occupational Safety and Health', required: false }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Safety officer'], coreSkills: ['incident investigation', 'risk assessment', 'OHSA compliance'] },
      { level: 'mid', minYears: 4, typicalTitles: ['SHEQ officer'], coreSkills: ['ISO 45001', 'ISO 14001', 'legal appointment', 'audit management'] },
      { level: 'senior', minYears: 8, typicalTitles: ['SHEQ manager', 'Director'], coreSkills: ['SHEQ system design', 'DOL engagement', 'contractor management'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: false }
  },

  // SALES & MARKETING (2 profiles)
  {
    id: 'sales-manager',
    family: 'Sales Manager',
    typicalTitles: ['Sales Manager', 'Sales Director', 'Regional Sales Manager', 'Account Manager', 'Business Development Manager'],
    minNQF: 6,
    detectionKeywords: ['Salesforce', 'CRM', 'sales pipeline', 'target achievement', 'business development'],
    coreSkills: {
      technical: ['sales techniques', 'CRM systems', 'client relationships', 'pipeline management', 'sales strategy'],
      tools: ['Salesforce', 'HubSpot', 'Excel', 'sales analytics tools', 'communication systems']
    },
    professionalRegistrations: [],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Sales rep'], coreSkills: ['sales techniques', 'CRM', 'client relations'] },
      { level: 'mid', minYears: 4, typicalTitles: ['Sales manager'], coreSkills: ['sales strategy', 'team leadership', 'quota management'] },
      { level: 'senior', minYears: 8, typicalTitles: ['Director'], coreSkills: ['sales P&L', 'revenue targets', 'partner development'] }
    ],
    saSpecificFlags: { driversLicenceRequired: true, eePreferred: true, securityClearance: false }
  },
  {
    id: 'marketing-manager',
    family: 'Digital Marketing Manager',
    typicalTitles: ['Digital Marketing Manager', 'Marketing Manager', 'Content Manager', 'Brand Manager', 'Social Media Manager'],
    minNQF: 7,
    detectionKeywords: ['Google Analytics', 'social media', 'SEO', 'SEM', 'content strategy', 'brand', 'digital marketing'],
    coreSkills: {
      technical: ['social media management', 'content creation', 'digital campaigns', 'brand strategy', 'data analytics'],
      tools: ['Google Analytics', 'Meta Ads', 'content management systems', 'email marketing tools', 'Excel']
    },
    professionalRegistrations: [],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Coordinator'], coreSkills: ['social media', 'copywriting', 'basic analytics'] },
      { level: 'mid', minYears: 3, typicalTitles: ['Manager'], coreSkills: ['campaign management', 'Google Analytics', 'SEO/SEM'] },
      { level: 'senior', minYears: 6, typicalTitles: ['Director'], coreSkills: ['marketing strategy', 'budget management', 'brand development'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: false }
  },

  // PROJECT MANAGEMENT
  {
    id: 'project-manager',
    family: 'Project Manager',
    typicalTitles: ['Project Manager', 'Programme Manager', 'PMO Manager', 'Agile Scrum Master', 'Delivery Manager'],
    minNQF: 7,
    detectionKeywords: ['PMP', 'PRINCE2', 'Jira', 'Agile', 'Scrum', 'risk management', 'RACI'],
    coreSkills: {
      technical: ['project planning', 'risk management', 'budget management', 'change control', 'stakeholder management'],
      tools: ['MS Project', 'Jira', 'Confluence', 'Azure DevOps', 'Asana']
    },
    professionalRegistrations: [
      { name: 'PMP', body: 'Project Management Institute', required: false },
      { name: 'PRINCE2', body: 'Projects in Controlled Environments', required: false }
    ],
    experienceTiers: [
      { level: 'junior', minYears: 1, typicalTitles: ['Assistant PM'], coreSkills: ['MS Project', 'Jira', 'risk registers', 'communication'] },
      { level: 'mid', minYears: 4, typicalTitles: ['Project manager'], coreSkills: ['budget management', 'change control', 'agile/waterfall'] },
      { level: 'senior', minYears: 8, typicalTitles: ['Senior PM', 'PMO director'], coreSkills: ['programme management', 'PMO setup', 'exec reporting'] }
    ],
    saSpecificFlags: { driversLicenceRequired: false, eePreferred: true, securityClearance: false }
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { SA_JOB_PROFILES };
export default SA_JOB_PROFILES;

/**
 * Find closest matching job profiles based on input text
 * @param input Job title, keywords, or description
 * @param threshold Minimum similarity score (0-1)
 * @returns Array of matching profiles with scores, sorted by score descending
 */
export function detectJobFamily(text: string, threshold = 0.4): Array<{ profile: SAJobProfile; score: number }> {
  const lowerText = text.toLowerCase();
  const matches: Array<{ profile: SAJobProfile; score: number }> = [];

  for (const profile of SA_JOB_PROFILES) {
    let score = 0;

    // Check title matches
    for (const title of profile.typicalTitles) {
      const similarity = levenshteinSimilarity(title.toLowerCase(), lowerText);
      score = Math.max(score, similarity);
    }

    // Check keyword matches
    const keywordMatches = profile.detectionKeywords.filter(kw => lowerText.includes(kw.toLowerCase())).length;
    if (keywordMatches > 0) {
      const keywordBoost = (keywordMatches / profile.detectionKeywords.length) * 0.3;
      score += Math.min(keywordBoost, 0.3);
    }

    if (score >= threshold) {
      matches.push({ profile, score: Math.min(score, 1) });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Levenshtein distance-based similarity (0-1)
 */
function levenshteinSimilarity(a: string, b: string): number {
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

  const distance = costs[longer.length];
  const similarity = (longer.length - distance) / longer.length;
  return Math.min(similarity, 1);
}

