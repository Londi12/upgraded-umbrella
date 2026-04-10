 "use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Save, ArrowLeft, Send, X, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getSavedCVs, saveJob } from "@/lib/user-data-service";
import { getAIJobMatches, type AIJobMatch } from "@/lib/ai-job-service";
import { ATSScoringPanel } from "@/components/cv-ats-scoring";
import { formatJobCardDate } from "@/lib/date-formatter";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { supabase } from "@/lib/supabase";

interface SAJobResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  posted_date?: string;
  company?: string;
  location?: string;
  description?: string;
}

interface SAJobSearchResponse {
  results: SAJobResult[];
  total: number;
  sources_checked: string[];
  compliance_report: {
    robots_txt_checked: boolean;
    rate_limiting_applied: boolean;
    cache_utilized: boolean;
    data_retention_compliant: boolean;
  };
  message?: string;
}

export default function SAJobSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [jobType, setJobType] = useState("");
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [datePosted, setDatePosted] = useState("7");
  const [sortBy, setSortBy] = useState("relevant");
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [results, setResults] = useState<SAJobResult[]>([]);
  const [searchResponse, setSearchResponse] = useState<SAJobSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filteredResults, setFilteredResults] = useState<SAJobResult[]>([]);

  const JOB_SUGGESTIONS = [
    "Account Manager", "Software Developer", "Data Analyst", "Project Manager",
    "Supply Chain", "Customer Support", "Financial Analyst", "HR Manager",
    "Sales Representative", "Logistics Coordinator", "Civil Engineer", "Nurse",
    "Teacher", "Marketing Manager", "Business Analyst", "Accountant",
    "CRM", "Python", "SQL", "Retail", "Call Centre", "Learnership",
  ];

  const QUICK_FILTER_OPTIONS = [
    { label: "🏠 Remote", value: "remote" },
    { label: "🎓 No experience", value: "no experience" },
    { label: "📄 Degree not required", value: "matric" },
    { label: "📋 Learnership", value: "learnership" },
  ];

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (val.length > 1) {
      const filtered = JOB_SUGGESTIONS.filter(s => s.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(filtered.slice(0, 6));
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const toggleQuickFilter = (value: string) => {
    setQuickFilters(prev =>
      prev.includes(value) ? prev.filter(f => f !== value) : [...prev, value]
    );
  };

  const resetFilters = () => {
    setJobType("");
    setExperience("");
    setSalary("");
    setLocationFilter("");
    setDatePosted("7");
    setSortBy("relevant");
    setQuickFilters([]);
  };

  const [selectedJob, setSelectedJob] = useState<SAJobResult | null>(null);
  const [savedCVs, setSavedCVs] = useState<any[]>([]);
  const [selectedCVId, setSelectedCVId] = useState<string>("");
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    const fetchSavedCVs = async () => {
      if (user) {
        const { data, error } = await getSavedCVs();
        if (!error) {
          setSavedCVs(data);
        }
      }
    };
    fetchSavedCVs();
  }, [user]);

  // Auto-load jobs on mount
  useEffect(() => {
    handleSearch()
  }, [])

  // Initialize cache on mount
  useEffect(() => {
    const initCache = async () => {
      try {
        await fetch("/api/sa-jobs?q=jobs");
      } catch (error) {
        console.log("Cache initialization failed:", error);
      }
    };
    initCache();
  }, []);

  const buildSearchUrl = (overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams()
    params.set('q', overrides.q ?? (query || 'jobs'))
    if (overrides.location ?? locationFilter) params.set('location', overrides.location ?? locationFilter)
    if (overrides.jobType ?? jobType) params.set('jobType', overrides.jobType ?? jobType)
    if (overrides.experience ?? experience) params.set('experience', overrides.experience ?? experience)
    if (overrides.datePosted ?? datePosted) params.set('datePosted', overrides.datePosted ?? datePosted)
    params.set('sortBy', overrides.sortBy ?? sortBy)
    return `/api/sa-jobs?${params.toString()}`
  }

  const handleSearch = async (overrides: Record<string, string> = {}) => {
    setLoading(true);
    setError("");
    setResults([]);
    setSearchResponse(null);
    setSelectedJob(null);

    try {
      const res = await fetch(buildSearchUrl(overrides));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.results) {
        setResults(data.results);
        setSearchResponse(data);
        setFilteredResults(data.results);
      } else {
        setError("No results returned");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (jobs: SAJobResult[]) => {
    let filtered = jobs;

    // Quick filters still client-side (keyword matching on loaded results)
    if (quickFilters.length > 0) {
      filtered = filtered.filter((job) =>
        quickFilters.every(f => (job.snippet + job.title + (job.location || "")).toLowerCase().includes(f))
      );
    }

    if (sortBy === "newest") {
      filtered = [...filtered].sort((a, b) =>
        new Date(b.posted_date || 0).getTime() - new Date(a.posted_date || 0).getTime()
      );
    }

    setFilteredResults(filtered);
  };

  useEffect(() => {
    applyFilters(results);
  }, [quickFilters, sortBy, results]);

  // Re-search when server-side filters change
  useEffect(() => {
    handleSearch();
  }, [jobType, experience, datePosted, locationFilter, sortBy]);

  // Get company logo or fallback to initials
  const getCompanyLogo = (companyName: string) => {
    // Company logo mapping - using local assets for better performance
    const companyLogos: { [key: string]: string } = {
      nedbank: "/Nedbank_logo_small.jpg",
      "standard bank":
        "https://www.standardbank.com/static_file/StandardBankGroup/Standard-Bank-Group/images/logo.svg",
      fnb: "https://www.fnb.co.za/assets/images/fnb-logo.svg",
      "first national bank": "https://www.fnb.co.za/assets/images/fnb-logo.svg",
      absa: "/Absa_Logo.png",
      capitec: "https://www.capitecbank.co.za/assets/images/capitec-logo.svg",
      investec: "https://www.investec.com/content/dam/investec/investec-logo.svg",
      santam: "https://www.santam.co.za/content/dam/santam/santam-logo.svg",
      "old mutual": "https://www.oldmutual.co.za/content/dam/old-mutual/om-logo.svg",
      discovery: "https://www.discovery.co.za/assets/images/discovery-logo.svg",
      momentum: "https://www.momentum.co.za/content/dam/momentum/momentum-logo.svg",
      liberty: "https://www.liberty.co.za/content/dam/liberty/liberty-logo.svg",
      sanlam: "https://www.sanlam.co.za/content/dam/sanlam/sanlam-logo.svg",
      vanguard: "https://www.vanguard.com/content/dam/vanguard/logo.svg",
      blackrock: "https://www.blackrock.com/content/dam/blackrock/logo.svg",
      jpmorgan: "https://www.jpmorgan.com/content/dam/jpmorgan/logo.svg",
      "goldman sachs": "https://www.goldmansachs.com/content/dam/goldmansachs/logo.svg",
      "morgan stanley": "https://www.morganstanley.com/content/dam/morganstanley/logo.svg",
      citibank: "https://www.citibank.com/content/dam/citibank/logo.svg",
      hsbc: "https://www.hsbc.com/content/dam/hsbc/logo.svg",
      "deutsche bank": "https://www.db.com/content/dam/db/logo.svg",
      "mr price": "/mrp.jpg",
      "mrp": "/mrp.jpg",
      "vector logistics": "/vector-logistics-logo.png",
      "vector": "/vector-logistics-logo.png",
      "bp": "/bp-logo.png",
      "british petroleum": "/bp-logo.png"
    };

    // Check for exact matches first
    const lowerCompanyName = companyName.toLowerCase();
    if (companyLogos[lowerCompanyName]) {
      return companyLogos[lowerCompanyName];
    }

    // Check for partial matches
    for (const [companyKey, logoUrl] of Object.entries(companyLogos)) {
      if (
        lowerCompanyName.includes(companyKey) ||
        companyKey.includes(lowerCompanyName)
      ) {
        return logoUrl;
      }
    }

    return null; // No logo found, will use initials
  };

  // Generate company initials for logo
  const getCompanyInitials = (companyName: string) => {
    return companyName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Generate random color for logo based on company name
  const getLogoColor = (companyName: string) => {
    const colors = [
      "from-blue-500 to-cyan-500",
      "from-purple-500 to-pink-500",
      "from-green-500 to-teal-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-blue-500",
    ];
    const index = companyName.length % colors.length;
    return colors[index];
  };

  const selectJob = (job: SAJobResult) => {
    setSelectedJob(job);
    // Open mobile sheet on mobile devices
    if (window.innerWidth < 1024) {
      setIsMobileSheetOpen(true);
    }
  };

  const clearSelectedJob = () => {
    setSelectedJob(null);
    setSelectedCVId("");
    setIsMobileSheetOpen(false);
  };

  

  const [trackDialogOpen, setTrackDialogOpen] = useState(false)
  const [trackForm, setTrackForm] = useState({
    cv_id: '',
    cover_letter: '',
    job_title: '',
    company_name: '',
    job_board: 'CVKonnekt',
    application_date: new Date().toISOString().split('T')[0],
    status: 'applied' as 'applied' | 'viewed' | 'interview' | 'offered' | 'hired' | 'rejected',
    notes: '',
    job_description: '',
    job_url: '',
  })
  const [trackSaving, setTrackSaving] = useState(false)
  const [trackSuccess, setTrackSuccess] = useState(false)
  const [applyToast, setApplyToast] = useState(false)

  const openTrackDialog = (job: SAJobResult) => {
    setTrackForm({
      cv_id: selectedCVId || '',
      cover_letter: '',
      job_title: job.title,
      company_name: job.company || job.source || '',
      job_board: 'CVKonnekt',
      application_date: new Date().toISOString().split('T')[0],
      status: 'applied',
      notes: '',
      job_description: job.description || job.snippet || '',
      job_url: job.url,
    })
    setTrackSuccess(false)
    setTrackDialogOpen(true)
  }

  const handleTrackSave = async () => {
    if (!user) return
    setTrackSaving(true)
    try {
      await saveJob({
        job_title: trackForm.job_title,
        company_name: trackForm.company_name,
        job_url: trackForm.job_url,
        job_description: trackForm.job_description,
        location: selectedJob?.location || '',
        posted_date: selectedJob?.posted_date || '',
        source: trackForm.job_board,
      })
      await fetch('/api/track-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cv_id: trackForm.cv_id || null,
          job_title: trackForm.job_title,
          company_name: trackForm.company_name,
          job_board: trackForm.job_board,
          application_date: trackForm.application_date,
          status: trackForm.status,
          ats_score_at_application: 0,
          job_description: trackForm.job_description,
          notes: trackForm.notes + (trackForm.cover_letter ? `\n\nCover Letter: ${trackForm.cover_letter}` : ''),
        })
      })
      setTrackSuccess(true)
    } catch (e) {
      console.error(e)
    }
    setTrackSaving(false)
  }

  const [aiMatching, setAiMatching] = useState(false);
  const [aiMatchResults, setAiMatchResults] = useState<AIJobMatch[]>([]);
  const [aiMatchError, setAiMatchError] = useState("");

  // Test function to verify API connectivity
  const testJobsAPI = async () => {
    try {
      console.log("Testing jobs API connectivity...");
      const response = await fetch('/api/sa-jobs?q=test&limit=1');
      if (response.ok) {
        const data = await response.json();
        console.log("Jobs API test successful:", data);
        return true;
      } else {
        console.error("Jobs API test failed:", response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error("Jobs API test error:", error);
      return false;
    }
  };

  const handleAIJobMatchReview = async () => {
    if (!user) {
      alert("Please sign in to use AI Job-Match Review.");
      return;
    }
    if (savedCVs.length === 0) {
      alert("Please create a CV to use AI Job-Match Review.");
      return;
    }
    if (!selectedCVId) {
      alert("Please select a CV for AI Job-Match Review.");
      return;
    }
    if (!selectedJob) {
      alert("No job selected.");
      return;
    }

    setAiMatching(true);
    setAiMatchError("");
    setAiMatchResults([]);

    try {
      // Test API connectivity first
      const apiWorking = await testJobsAPI();
      if (!apiWorking) {
        console.warn("Jobs API is not working, but continuing with fallback...");
      }

      // Get the selected CV data
      const selectedCV = savedCVs.find(cv => cv.id === selectedCVId);
      if (!selectedCV) {
        throw new Error("Selected CV not found");
      }

      // Get recent jobs for matching with better error handling
      let jobsToMatch: any[] = [];

      try {
        const recentJobsResponse = await fetch(`/api/sa-jobs?q=${encodeURIComponent(selectedJob.title || "jobs")}&limit=10`);
        if (recentJobsResponse.ok) {
          const jobsData = await recentJobsResponse.json();
          jobsToMatch = jobsData.results || [];
        } else {
          console.warn("Failed to fetch jobs from API, using selected job only");
        }
      } catch (fetchError) {
        console.warn("Error fetching jobs from API:", fetchError);
        console.log("Using selected job only for AI matching");
      }

      // Add the selected job to the list if not already included
      const jobExists = jobsToMatch.some((job: any) => job.url === selectedJob.url);
      if (!jobExists && selectedJob) {
        jobsToMatch.unshift(selectedJob);
      }

      // If no jobs available, create a fallback job from the selected job
      if (jobsToMatch.length === 0) {
        jobsToMatch = [{
          id: selectedJob.url,
          title: selectedJob.title,
          company: selectedJob.company || selectedJob.source,
          description: selectedJob.description || selectedJob.snippet,
          requirements: [] // Will be extracted from description
        }];
      }

      // Call AI job matching service
      console.log("Starting AI job matching with", jobsToMatch.length, "jobs");
      const matches = await getAIJobMatches(selectedCV.cv_data, jobsToMatch);

      if (matches && matches.length > 0) {
        setAiMatchResults(matches);
        console.log("AI Job-Match Review completed for CV ID:", selectedCVId);
        console.log("Found", matches.length, "matches");
      } else {
        setAiMatchError("No AI matches found. This could be due to missing API keys or insufficient job data. Try using the test page at /test-ai-job-match to verify the system is working.");
      }
    } catch (error) {
      console.error("AI Job-Match Review error:", error);
      setAiMatchError(error instanceof Error ? error.message : "AI matching failed. Please try again.");
    } finally {
      setAiMatching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Search Section */}
      <Card className="mb-6">
        <CardContent className="pt-5 space-y-4">
          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="e.g. Account Manager, Supply Chain, CRM, Logistics"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => query.length > 1 && setShowSuggestions(suggestions.length > 0)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
              {showSuggestions && (
                <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                  {suggestions.map(s => (
                    <button key={s} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      onMouseDown={() => { setQuery(s); setShowSuggestions(false); }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 border rounded-md min-w-[140px] text-sm"
            >
              <option value="">All Locations</option>
              <option value="johannesburg">Johannesburg</option>
              <option value="cape town">Cape Town</option>
              <option value="durban">Durban</option>
              <option value="pretoria">Pretoria</option>
              <option value="port elizabeth">Gqeberha</option>
            </select>
            <Button onClick={() => handleSearch()} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTER_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => toggleQuickFilter(value)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  quickFilters.includes(value)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Dropdowns row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
              <option value="">Job Type</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="learnership">Learnership / Internship</option>
            </select>
            <select value={experience} onChange={(e) => setExperience(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
              <option value="">Experience</option>
              <option value="entry">Entry (0–2 yrs)</option>
              <option value="mid">Mid (2–5 yrs)</option>
              <option value="senior">Senior (5+ yrs)</option>
            </select>
            <select value={salary} onChange={(e) => setSalary(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
              <option value="">Salary</option>
              <option value="0-15000">Up to R15k</option>
              <option value="15000-30000">R15k – R30k</option>
              <option value="30000-50000">R30k – R50k</option>
              <option value="50000+">R50k+</option>
            </select>
            <select value={datePosted} onChange={(e) => setDatePosted(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
              <option value="1">Today</option>
              <option value="3">Last 3 days</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="">Any time</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
              <option value="relevant">Most relevant</option>
              <option value="newest">Newest first</option>
            </select>
          </div>

          {/* Active filters + reset */}
          {(jobType || experience || salary || datePosted !== "7" || sortBy !== "relevant" || quickFilters.length > 0) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Active filters:</span>
              <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-700 underline">Reset all</button>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 mb-6">
          <CardContent className="pt-6">
            <div className="text-red-600">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout - Desktop */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 280px)' }}>
        {/* Job List Column - scrollable */}
        <div className="overflow-y-auto space-y-4 pr-2">
          {searchResponse && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Results</CardTitle>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>Found {searchResponse.total} jobs</span>
                  <span>•</span>
                  <span>Showing {filteredResults.length} after filters</span>
                  <span>•</span>
                  {searchResponse.message && (
                    <>
                      <span>•</span>
                      <span>{searchResponse.message}</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredResults.map((job, idx) => {
                    const companyLogo = getCompanyLogo(job.company || job.source);
                    const isSelected = selectedJob?.url === job.url;

                    return (
                      <Card
                        key={idx}
                        className={`border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => selectJob(job)}
                      >
                        <CardContent className="p-5">
                          {/* Header with Logo and Basic Info */}
                          <div className="flex gap-3 mb-4">
                            {/* Company Logo */}
                            {companyLogo ? (
                              <img
                                src={companyLogo}
                                alt={`${job.company || job.source} logo`}
                                className="w-14 h-14 rounded-xl object-contain flex-shrink-0 bg-white p-1"
                                onError={(e) => {
                                  // Fallback to initials if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getLogoColor(
                                job.company || job.source
                              )} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
                              style={{ display: companyLogo ? "none" : "flex" }}
                            >
                              {getCompanyInitials(job.company || job.source)}
                            </div>

                            {/* Job Details */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                                {job.title}
                              </h3>
                              <div className="text-sm text-gray-600 mb-2">
                                {job.company || job.source}
                              </div>

                              {/* Badges */}
                              <div className="flex flex-wrap gap-2">
                                <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-xs">
                                  IT Operations
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  2-3 yrs
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Degree/Diploma
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Full-time
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="mb-4">
                            <MarkdownRenderer
                              content={job.snippet}
                              className="text-sm text-gray-700"
                            />
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                📍 {job.location || "South Africa"}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                🕒 {formatJobCardDate(job.posted_date)}
                              </div>
                            </div>


                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {filteredResults.length === 0 && searchResponse && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No jobs found matching your criteria.</p>
                <p className="text-sm mt-1">Try different keywords or check back later.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Job Details Column - fixed with internal scroll */}
        <div className="flex flex-col pl-2 min-h-0">
          {selectedJob ? (
            <Card className="flex flex-col flex-1 min-h-0">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelectedJob}
                    className="p-1 h-8 w-8"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-lg">Job Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 min-h-0 space-y-4">
                {/* Job Header */}
                <div className="flex items-start gap-3">
                  {/* Company Logo in Job Details */}
                  {(() => {
                    const companyLogo = getCompanyLogo(selectedJob.company || selectedJob.source || "");
                    return companyLogo ? (
                      <img
                        src={companyLogo}
                        alt={`${selectedJob.company || selectedJob.source} logo`}
                        className="w-16 h-16 rounded-xl object-contain flex-shrink-0 bg-white p-1"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getLogoColor(
                          selectedJob.company || selectedJob.source || ""
                        )} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
                      >
                        {getCompanyInitials(selectedJob.company || selectedJob.source || "")}
                      </div>
                    );
                  })()}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedJob.title}
                    </h2>
                    <p className="text-lg text-gray-600 mb-4">
                      {selectedJob.company || selectedJob.source}
                    </p>

                    {/* Job Meta */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        📍 {selectedJob.location || "South Africa"}
                      </div>
                      <div className="flex items-center gap-1">
                        🕒 {formatJobCardDate(selectedJob.posted_date)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Description - scrollable */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <MarkdownRenderer
                      content={selectedJob.description || selectedJob.snippet || "No description available."}
                      className="text-gray-700 text-sm"
                    />
                  </div>
                </div>

                {/* Action Buttons - sticky at bottom */}
                <div className="flex-shrink-0 flex flex-col gap-3 pt-4 border-t bg-white">
                  {/* Single Row with Save, CV Selection, and AI Match */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button
                      onClick={() => selectedJob && openTrackDialog(selectedJob)}
                      disabled={!user}
                      variant="outline"
                      size="sm"
                      className="flex-none"
                      aria-label="Save Job"
                    >
                      <Save className="w-4 h-4 mr-1" /> Save & Track
                    </Button>

                    <div className="flex items-center gap-2 min-w-0 flex-1 max-w-xs">
                      <label htmlFor="cv-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        CV for Analysis:
                      </label>
                      <select
                        id="cv-select"
                        value={selectedCVId}
                        onChange={(e) => setSelectedCVId(e.target.value)}
                        className="flex-1 min-w-0 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">
                          {user
                            ? (savedCVs.length ? "Select CV" : "Create CV for AI Match")
                            : "Sign in to use AI Match"
                          }
                        </option>
                        {user && savedCVs.length > 0 && savedCVs.map((cv) => (
                          <option key={cv.id} value={cv.id}>
                            {cv.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      onClick={handleAIJobMatchReview}
                      disabled={!user || !selectedCVId || aiMatching}
                      variant="outline"
                      size="sm"
                      className="flex-none whitespace-nowrap"
                      aria-label="AI Job Match Review"
                    >
                      {aiMatching ? "Matching..." : "AI Match"}
                    </Button>
                  </div>

                  {/* Primary Action - Apply */}
                  <div className="pt-2">
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={async () => {
                        try {
                          await fetch('/api/track-application', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              cv_id: selectedCVId || null,
                              job_title: selectedJob.title,
                              company_name: selectedJob.company || selectedJob.source,
                              job_board: 'SA Job Search',
                              application_date: new Date().toISOString().split('T')[0],
                              status: 'applied',
                              ats_score_at_application: 0,
                              job_description: selectedJob.description || selectedJob.snippet,
                              notes: `Applied via SA Job Search: ${selectedJob.url}`
                            })
                          })
                          setApplyToast(true)
                          setTimeout(() => setApplyToast(false), 5000)
                        } catch (error) {
                          console.error('Error tracking application:', error)
                        }
                        window.open(selectedJob.url, '_blank')
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Apply Now
                    </Button>
                  </div>
                </div>

                {applyToast && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="flex-1 text-sm text-green-800">Application tracked!</span>
                    <a href="/dashboard" className="text-sm font-medium text-green-700 underline whitespace-nowrap">View Tracker →</a>
                  </div>
                )}

                {/* AI Match Results */}
                {aiMatchResults.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">AI Match Results</h3>
                    <div className="space-y-3">
                      {aiMatchResults.slice(0, 5).map((match, index) => (
                        <Card key={match.jobId} className="border-green-200 bg-green-50">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className="bg-green-100 text-green-800">
                                    {match.matchScore}% Match
                                  </Badge>
                                  <span className="text-sm text-gray-600">#{index + 1}</span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {match.reasoning}
                                </p>
                              </div>
                            </div>
                            {match.skillsMatch.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs font-medium text-green-700">Matched Skills: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {match.skillsMatch.slice(0, 3).map((skill, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs bg-green-50">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {match.skillsGap.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs font-medium text-orange-700">Skills to Develop: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {match.skillsGap.map((skill, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs bg-orange-50 text-orange-700">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Match Error */}
                {aiMatchError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{aiMatchError}</p>
                  </div>
                )}

                {/* ATS Scoring Panel */}
                {selectedCVId && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">CV ATS Analysis</h3>
                    <ATSScoringPanel
                      cvData={savedCVs.find(cv => cv.id === selectedCVId)?.cv_data}
                      currentSection="job-matching"
                      jobDescription={selectedJob?.description || selectedJob?.snippet || ''}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="flex-1">
              <CardContent className="pt-6 text-center text-muted-foreground">
                <div className="py-12">
                  <div className="text-6xl mb-4">👈</div>
                  <p className="text-lg mb-2">Select a job to view details</p>
                  <p className="text-sm">Click on any job from the list to see full details here</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile Layout - Single Column with Sheet */}
      <div className="lg:hidden">
        <div className="space-y-4">
          {searchResponse && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Results</CardTitle>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>Found {searchResponse.total} jobs</span>
                  <span>•</span>
                  <span>Showing {filteredResults.length} after filters</span>
                  {searchResponse.message && (
                    <>
                      <span>•</span>
                      <span>{searchResponse.message}</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredResults.map((job, idx) => {
                    const companyLogo = getCompanyLogo(job.company || job.source);
                    const isSelected = selectedJob?.url === job.url;

                    return (
                      <Card
                        key={idx}
                        className={`border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => selectJob(job)}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-3 mb-3">
                            {companyLogo ? (
                              <img
                                src={companyLogo}
                                alt={`${job.company || job.source} logo`}
                                className="w-12 h-12 rounded-lg object-contain flex-shrink-0 bg-white p-1"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getLogoColor(
                                job.company || job.source
                              )} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                              style={{ display: companyLogo ? "none" : "flex" }}
                            >
                              {getCompanyInitials(job.company || job.source)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 leading-tight mb-1 text-base">
                                {job.title}
                              </h3>
                              <div className="text-sm text-gray-600 mb-2">
                                {job.company || job.source}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>📍 {job.location || "South Africa"}</span>
                                <span>🕒 {formatJobCardDate(job.posted_date)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 line-clamp-2">
                            {job.snippet.substring(0, 120)}...
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {filteredResults.length === 0 && searchResponse && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No jobs found matching your criteria.</p>
                <p className="text-sm mt-1">Try different keywords or check back later.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile Job Details Sheet */}
      <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-lg">Job Details</SheetTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileSheetOpen(false)}
                    className="p-1 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </SheetHeader>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-start gap-3">
                  {(() => {
                    const companyLogo = getCompanyLogo(selectedJob.company || selectedJob.source || "");
                    return companyLogo ? (
                      <img
                        src={companyLogo}
                        alt={`${selectedJob.company || selectedJob.source} logo`}
                        className="w-16 h-16 rounded-xl object-contain flex-shrink-0 bg-white p-1"
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getLogoColor(
                          selectedJob.company || selectedJob.source || ""
                        )} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
                      >
                        {getCompanyInitials(selectedJob.company || selectedJob.source || "")}
                      </div>
                    );
                  })()}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedJob.title}
                    </h2>
                    <p className="text-lg text-gray-600 mb-4">
                      {selectedJob.company || selectedJob.source}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        📍 {selectedJob.location || "South Africa"}
                      </div>
                      <div className="flex items-center gap-1">
                        🕒 {formatJobCardDate(selectedJob.posted_date)}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-72 overflow-y-auto">
                    <MarkdownRenderer
                      content={selectedJob.description || selectedJob.snippet || "No description available."}
                      className="text-gray-700 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button
                      onClick={() => selectedJob && openTrackDialog(selectedJob)}
                      disabled={!user}
                      variant="outline"
                      size="sm"
                      className="flex-none"
                    >
                      <Save className="w-4 h-4 mr-1" /> Save & Track
                    </Button>

                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <label htmlFor="cv-select-mobile" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        CV:
                      </label>
                      <select
                        id="cv-select-mobile"
                        name="cv-select-mobile"
                        value={selectedCVId}
                        onChange={(e) => setSelectedCVId(e.target.value)}
                        className="flex-1 min-w-0 border rounded-md px-2 py-1 text-sm"
                      >
                        <option value="">
                          {user ? (savedCVs.length ? "Select CV" : "Create CV") : "Sign in"}
                        </option>
                        {user && savedCVs.length > 0 && savedCVs.map((cv) => (
                          <option key={cv.id} value={cv.id}>
                            {cv.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      onClick={handleAIJobMatchReview}
                      disabled={!user || !selectedCVId || aiMatching}
                      variant="outline"
                      size="sm"
                      className="flex-none"
                    >
                      {aiMatching ? "Matching..." : "AI Match"}
                    </Button>
                  </div>

                  <div className="pt-2">
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={async () => {
                        try {
                          await fetch('/api/track-application', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              cv_id: selectedCVId || null,
                              job_title: selectedJob.title,
                              company_name: selectedJob.company || selectedJob.source,
                              job_board: 'SA Job Search',
                              application_date: new Date().toISOString().split('T')[0],
                              status: 'applied',
                              ats_score_at_application: 0,
                              job_description: selectedJob.description || selectedJob.snippet,
                              notes: `Applied via SA Job Search: ${selectedJob.url}`
                            })
                          })
                          setApplyToast(true)
                          setTimeout(() => setApplyToast(false), 5000)
                        } catch (error) {
                          console.error('Error tracking application:', error)
                        }
                        window.open(selectedJob.url, '_blank')
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Apply Now
                    </Button>
                  </div>
                </div>

                {applyToast && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="flex-1 text-sm text-green-800">Application tracked!</span>
                    <a href="/dashboard" className="text-sm font-medium text-green-700 underline whitespace-nowrap">View Tracker →</a>
                  </div>
                )}

                {aiMatchResults.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">AI Match Results</h3>
                    <div className="space-y-3">
                      {aiMatchResults.slice(0, 3).map((match, index) => (
                        <Card key={match.jobId} className="border-green-200 bg-green-50">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {match.matchScore}% Match
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700">
                              {match.reasoning}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {aiMatchError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{aiMatchError}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      {/* Track Application Dialog */}
      <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Save & Track Application</DialogTitle>
          </DialogHeader>
          {trackSuccess ? (
            <div className="py-6 text-center">
              <div className="text-green-600 text-4xl mb-2">✓</div>
              <p className="font-medium text-gray-900">Saved to your Application Tracker</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" onClick={() => setTrackDialogOpen(false)}>Done</Button>
                <a href="/dashboard"><Button className="bg-blue-600 hover:bg-blue-700">View Tracker →</Button></a>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="t-title">Job Title</Label>
                  <Input id="t-title" value={trackForm.job_title} onChange={e => setTrackForm(p => ({ ...p, job_title: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="t-company">Company</Label>
                  <Input id="t-company" value={trackForm.company_name} onChange={e => setTrackForm(p => ({ ...p, company_name: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="t-date">Date Applied</Label>
                  <Input id="t-date" type="date" value={trackForm.application_date} onChange={e => setTrackForm(p => ({ ...p, application_date: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="t-status">Status</Label>
                  <Select value={trackForm.status} onValueChange={v => setTrackForm(p => ({ ...p, status: v as any }))}>
                    <SelectTrigger id="t-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="viewed">Viewed</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="t-cv">CV Used</Label>
                <Select value={trackForm.cv_id || 'none'} onValueChange={v => setTrackForm(p => ({ ...p, cv_id: v === 'none' ? '' : v }))}>
                  <SelectTrigger id="t-cv"><SelectValue placeholder="Select CV (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific CV</SelectItem>
                    {savedCVs.map(cv => <SelectItem key={cv.id} value={cv.id}>{cv.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="t-cover">Cover Letter Used (optional)</Label>
                <Input id="t-cover" placeholder="e.g. Software Dev Cover Letter" value={trackForm.cover_letter} onChange={e => setTrackForm(p => ({ ...p, cover_letter: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="t-notes">Notes & Follow-ups</Label>
                <Textarea id="t-notes" rows={3} placeholder="Interview date, recruiter name, follow-up reminders..." value={trackForm.notes} onChange={e => setTrackForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setTrackDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleTrackSave} disabled={trackSaving} className="bg-blue-600 hover:bg-blue-700">
                  {trackSaving ? 'Saving...' : 'Save & Track'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
