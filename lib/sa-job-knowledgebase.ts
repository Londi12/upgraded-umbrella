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
  saSpecificFlags: string[]; // ['EE candidate', 'Driver\'s license', 'SA citizenship']
  industryKeywords: string[];
  sector: string; // finance, tech, mining etc.
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

// Core SA Job Profiles - Covers 80% of market
const JOB_PROFILES: JobProfile[] = [
  // FINANCE/ACCOUNTING (20% of white-collar jobs)
  {
    family: 'CA(SA)',
    typicalTitles: ['Chartered Accountant', 'CA(SA)', 'Financial Controller', 'Financial Manager', 'CFO'],
    minNQF: 8,
    acceptedQualifications: ['BCom Accounting', 'CTA', 'PGDA'],
    professionalRegistrations: ['SAICA'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['IFRS', 'tax returns', 'audit prep'] },
      mid: { minYears: 3, coreSkills: ['IFRS', 'financial reporting', 'tax compliance', 'Sage/Pastel'] },
      senior: { minYears: 7, coreSkills: ['IFRS 17', 'group consolidation', 'stakeholder management'] }
    },
    saSpecificFlags: ['SA citizenship/work permit', 'Driver\'s license'],
    industryKeywords: ['IFRS', 'SAICA', 'CTA', 'financial statements', 'tax', 'Sage', 'Pastel', 'SARS'],
    sector: 'finance'
  },
  {
    family: 'Financial Analyst',
    typicalTitles: ['Financial Analyst', 'Management Accountant', 'Cost Accountant', 'FP&A Analyst'],
    minNQF: 7,
    acceptedQualifications: ['BCom Accounting/Finance', 'CIMA'],
    professionalRegistrations: ['SAICA trainee', 'CIMA'],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['Excel', 'financial modelling', 'budgeting'] },
      mid: { minYears: 3, coreSkills: ['Power BI', 'SQL', 'forecasting', 'variance analysis'] },
      senior: { minYears: 6, coreSkills: ['ERP systems', 'stakeholder reporting'] }
    },
    saSpecificFlags: ['EE candidate'],
    industryKeywords: ['financial model', 'budget', 'forecast', 'variance', 'Power BI', 'Excel advanced'],
    sector: 'finance'
  },

  // TECH/IT (15% growth sector)
  {
    family: 'Software Engineer',
    typicalTitles: ['Software Developer', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer'],
    minNQF: 7,
    acceptedQualifications: ['BSc Computer Science', 'BCom IT', 'Diploma in IT'],
    professionalRegistrations: [],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['JavaScript', 'React', 'Node.js', '.NET'] },
      mid: { minYears: 3, coreSkills: ['AWS/Azure', 'Docker', 'microservices', 'CI/CD'] },
      senior: { minYears: 6, coreSkills: ['system architecture', 'technical leadership'] }
    },
    saSpecificFlags: ['Willing to relocate to JHB/DBN'],
    industryKeywords: ['JavaScript', 'React', 'Node', 'AWS', 'Azure', '.NET', 'SQL', 'API', 'Git'],
    sector: 'tech'
  },
  {
    family: 'Data Analyst',
    typicalTitles: ['Data Analyst', 'Business Intelligence Analyst', 'Reporting Analyst'],
    minNQF: 7,
    acceptedQualifications: ['BSc Stats/Maths', 'BCom Informatics'],
    professionalRegistrations: [],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['Excel', 'Power BI', 'SQL'] },
      mid: { minYears: 3, coreSkills: ['Python R', 'ETL', 'data warehouse'] },
      senior: { minYears: 5, coreSkills: ['ML models', 'data strategy'] }
    },
    saSpecificFlags: [],
    industryKeywords: ['SQL', 'Power BI', 'Tableau', 'Python', 'ETL', 'data visualization'],
    sector: 'tech'
  },

  // MINING/ENGINEERING (key SA sectors)
  {
    family: 'Mining Engineer',
    typicalTitles: ['Mining Engineer', 'Mine Planner', 'Geotechnical Engineer'],
    minNQF: 8,
    acceptedQualifications: ['BEng Mining', 'BSc Geology'],
    professionalRegistrations: ['ECSA', 'PLATO'],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['VentSim', 'Deswik'] },
      mid: { minYears: 5, coreSkills: ['blast design', 'mine ventilation'] },
      senior: { minYears: 10, coreSkills: ['mine optimization', 'safety management'] }
    },
    saSpecificFlags: ['Medical fitness', 'Driver\'s license', 'Willing to relocate to Rustenburg/Limpopo'],
    industryKeywords: ['VentSim', 'Deswik', 'mine planning', 'ECSA', 'PLATO', 'blast design'],
    sector: 'mining'
  },

  // HEALTHCARE
  {
    family: 'Registered Nurse',
    typicalTitles: ['Registered Nurse', 'Professional Nurse', 'RN'],
    minNQF: 7,
    acceptedQualifications: ['Diploma/BCur Nursing'],
    professionalRegistrations: ['SANC', 'HPCSA'],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['patient care', 'medication admin'] },
      mid: { minYears: 4, coreSkills: ['IV therapy', 'wound care'] },
      senior: { minYears: 8, coreSkills: ['nurse management', 'quality control'] }
    },
    saSpecificFlags: ['SANC registration', 'Police clearance'],
    industryKeywords: ['SANC', 'HPCSA', 'patient care', 'IV cannula', 'vital signs'],
    sector: 'healthcare'
  },

  // BPO/CUSTOMER SERVICE (huge entry-level sector)
  {
    family: 'Call Centre Agent',
    typicalTitles: ['Call Centre Agent', 'Customer Service Representative', 'Contact Centre Agent'],
    minNQF: 4,
    acceptedQualifications: ['Matric'],
    professionalRegistrations: [],
    experienceTiers: {
      junior: { minYears: 0, coreSkills: ['MS Office', 'telephony'] },
      mid: { minYears: 2, coreSkills: ['CRM systems', 'sales targets'] },
      senior: { minYears: 5, coreSkills: ['team lead', 'quality assurance'] }
    },
    saSpecificFlags: ['Fluent English/Afrikaans', 'Headset', 'Flexible shifts'],
    industryKeywords: ['CRM', 'Avaya', 'Genesys', 'call handling', 'customer service'],
    sector: 'bpo'
  },

  // More profiles... (HR, Logistics, Retail Manager, etc.) - expand to 25+
  {
    family: 'HR Specialist',
    typicalTitles: ['HR Officer', 'Recruiter', 'Talent Acquisition', 'HR Generalist'],
    minNQF: 7,
    acceptedQualifications: ['BCom HR', 'BA Social Science'],
    professionalRegistrations: ['SABPP'],
    experienceTiers: {
      junior: { minYears: 1, coreSkills: ['recruitment', 'onboarding'] },
      mid: { minYears: 3, coreSkills: ['EE reporting', 'labour relations'] },
      senior: { minYears: 6, coreSkills: ['talent strategy', 'change management'] }
    },
    saSpecificFlags: ['EE understanding'],
    industryKeywords: ['EE plan', 'B-BBEE', 'SABPP', 'recruitment', 'performance management'],
    sector: 'hr'
  }
  // TODO: Add 20 more (Legal, Logistics, Retail, Govt Admin, Sales, Marketing, etc.)
];

const knowledgebase: SAKnowledgebase = {
  profiles: JOB_PROFILES,

  getClosestProfile(input: string, options = { threshold: 0.4 }) {
    const cleanInput = input.toLowerCase().trim();
    let bestMatch: JobProfile | null = null;
    let bestScore = options.threshold;

    for (const profile of this.profiles) {
      // Score titles
      let score = 0;
      for (const title of profile.typicalTitles) {
        score = Math.max(score, fuzzyScore(title.toLowerCase(), cleanInput));
      }

      // Boost if keywords match
      const keywordMatches = profile.industryKeywords.filter(kw => cleanInput.includes(kw.toLowerCase()));
      if (keywordMatches.length > 0) score += 0.2;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = profile;
      }
    }

    return bestScore > options.threshold ? bestMatch : null;
  },

  scoreAgainstProfile(cvData: any, profile: JobProfile, tier: 'junior' | 'mid' | 'senior' = 'mid') {
    const expTier = profile.experienceTiers[tier];
    let matchScore = 0;
    const gaps: string[] = [];
    const strengths: string[] = [];

    // NQF match
    if (cvData.education && getHighestNQF(cvData) >= profile.minNQF) {
      matchScore += 25;
      strengths.push('Meets NQF requirement');
    } else {
      gaps.push(`NQF ${profile.minNQF}+ required`);
    }

    // Skills match
    const cvSkills = extractSkills(cvData);
    const tierSkills = expTier.coreSkills;
    const matchedSkills = tierSkills.filter(skill => cvSkills.some(cvSkill => cvSkill.toLowerCase().includes(skill.toLowerCase())));
    matchScore += (matchedSkills.length / tierSkills.length) * 40;
    strengths.push(...matchedSkills.map(s => `Strong in ${s}`));
    gaps.push(...tierSkills.filter(s => !matchedSkills.includes(s)).map(s => `Needs ${s}`));

    // Registrations
    const cvRegs = cvData.registrations || [];
    if (profile.professionalRegistrations.some(reg => cvRegs.includes(reg))) {
      matchScore += 20;
      strengths.push('Required registration found');
    } else {
      gaps.push(`Missing ${profile.professionalRegistrations.join('/')}`);
    }

    // SA flags (basic keyword check)
    const cvText = JSON.stringify(cvData).toLowerCase();
    const flagMatches = profile.saSpecificFlags.filter(flag => cvText.includes(flag.toLowerCase()));
    matchScore += (flagMatches.length / profile.saSpecificFlags.length) * 15;

    return { matchScore: Math.round(matchScore), gaps, strengths };
  }
};

// Export typed knowledgebase
export default knowledgebase;

// Helpers (reuse from ai-job-match)
function getHighestNQF(cvData: any): number {
  // Simplified - copy from ai-job-match
  if (!cvData.education?.length) return 4;
  // ... implement logic
  return 7; // placeholder
}

function extractSkills(cvData: any): string[] {
  // Simplified
  return cvData.skills ? (Array.isArray(cvData.skills) ? cvData.skills.map((s: any) => s.name || s) : cvData.skills.split(',')) : [];
}
 = ["All", "Professional", "Modern", "Creative", "Simple", "Executive", "South African"]

const TEMPLATES = [
  { id: 1,  name: "Corporate Professional",    category: "Professional",   template: "professional"    as TemplateType, popular: true  },
  { id: 2,  name: "Modern Minimalist",         category: "Modern",         template: "modern"          as TemplateType, popular: false },
  { id: 3,  name: "Creative Design",           category: "Creative",       template: "creative"        as TemplateType, popular: true  },
  { id: 4,  name: "Simple Clean",              category: "Simple",         template: "simple"          as TemplateType, popular: false },
  { id: 5,  name: "Executive Elite",           category: "Executive",      template: "executive"       as TemplateType, popular: true  },
  { id: 6,  name: "Technical Expert",          category: "Professional",   template: "technical"       as TemplateType, popular: false },
  { id: 7,  name: "Graduate Entry",            category: "Simple",         template: "graduate"        as TemplateType, popular: false },
  { id: 8,  name: "Digital Portfolio",         category: "Creative",       template: "digital"         as TemplateType, popular: true  },
  { id: 9,  name: "SA Professional",           category: "South African",  template: "sa-professional" as TemplateType, popular: true  },
  { id: 10, name: "SA Modern",                 category: "South African",  template: "sa-modern"       as TemplateType, popular: true  },
  { id: 11, name: "SA Executive",              category: "South African",  template: "sa-executive"    as TemplateType, popular: false },
  { id: 12, name: "Compact One-Page",          category: "Simple",         template: "compact"         as TemplateType, popular: true  },
  { id: 13, name: "Chronological",             category: "Professional",   template: "chronological"   as TemplateType, popular: false },
  { id: 14, name: "Functional / Skills-First", category: "Modern",         template: "functional"      as TemplateType, popular: false },
  { id: 15, name: "Sidebar",                   category: "Modern",         template: "sidebar"         as TemplateType, popular: false },
  { id: 16, name: "Matric / School Leaver",    category: "Simple",         template: "matric"          as TemplateType, popular: true  },
]

export function TemplateChooser() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(TEMPLATES[0])

  const filtered = useMemo(() =>
    TEMPLATES.filter(t =>
      (activeCategory === "All" || t.category === activeCategory) &&
      t.name.toLowerCase().includes(search.toLowerCase())
    ), [activeCategory, search])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Choose a CV Template</h1>
            <p className="text-sm text-gray-500 mt-0.5">Select a template to preview it, then click Use Template to start building.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 h-9 text-sm"
              placeholder="Search templates…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-screen-xl mx-auto flex gap-1 overflow-x-auto py-2 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column body */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-6 flex gap-6 items-start">

        {/* LEFT — scrollable card grid */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-12 text-center">No templates match your search.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(t => {
                const isSelected = selected.id === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className={`group relative rounded-xl border-2 overflow-hidden text-left transition-all duration-150 focus:outline-none ${
                      isSelected
                        ? "border-blue-600 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                    }`}
                  >
                    {t.popular && (
                      <span className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                    {isSelected && (
                      <span className="absolute top-2 right-2 z-10">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 fill-white" />
                      </span>
                    )}
                    <div className="h-44 bg-gray-50 overflow-hidden pointer-events-none">
                      <div className="scale-[0.55] origin-top-left w-[182%] h-[182%]">
                        <CVPreview template={t.template} className="w-full h-full" />
                      </div>
                    </div>
                    <div className={`px-3 py-2 border-t ${isSelected ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100"}`}>
                      <p className="text-xs font-semibold text-gray-800 truncate">{t.name}</p>
                      <p className="text-[11px] text-gray-500">{t.category}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT — sticky preview panel */}
        <div className="hidden lg:flex flex-col w-80 xl:w-96 flex-shrink-0 sticky top-6 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{selected.name}</p>
                <p className="text-xs text-gray-500">{selected.category}</p>
              </div>
              {selected.popular && <Badge className="bg-blue-600 text-white text-[10px]">Popular</Badge>}
            </div>
            <div className="p-3 bg-gray-50 h-[520px] overflow-hidden">
              <CVPreview template={selected.template} className="w-full h-full" />
            </div>
            <div className="p-4 border-t border-gray-100 space-y-2">
              <Link href={`/create?template=${selected.id}`} className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  Use This Template
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/create?template=${selected.id}&preview=1`} className="block">
                <Button variant="outline" className="w-full text-sm">
                  Customise & Preview
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-xs text-center text-gray-400">
            {TEMPLATES.length} templates · Free, no subscription
          </p>
        </div>

      </div>
    </div>
  )
}
