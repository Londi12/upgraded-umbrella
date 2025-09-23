"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search, Save } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ApplicationTracker } from "@/lib/application-tracker";
import { getSavedCVs } from "@/lib/user-data-service";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface SAJobResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  posted_date?: string;
  company?: string;
  location?: string;
  description?: string;
  qualifications?: string[];
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

export default function SAJobSearchWithMarkdown() {
  const [query, setQuery] = useState("");
  const [jobType, setJobType] = useState("");
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [datePosted, setDatePosted] = useState("");
  const [results, setResults] = useState<SAJobResult[]>([]);
  const [searchResponse, setSearchResponse] = useState<SAJobSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filteredResults, setFilteredResults] = useState<SAJobResult[]>([]);

  const [selectedJob, setSelectedJob] = useState<SAJobResult | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [savedCVs, setSavedCVs] = useState<any[]>([]);
  const [selectedCVId, setSelectedCVId] = useState<string>("");

  const { user } = useAuth();
  const applicationTracker = new ApplicationTracker();

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

  // Initialize cache on mount
  useEffect(() => {
    const initCache = async () => {
      try {
        const res = await fetch("/api/sa-jobs?q=jobs");
        if (res.ok) {
          const data = await res.json();
          // Cache is automatically populated by the scraper
        }
      } catch (error) {
        console.log("Cache initialization failed:", error);
      }
    };
    initCache();
  }, []);

  const handleSearch = async () => {
    if (!locationFilter) return;

    setLoading(true);
    setError("");
    setResults([]);
    setSearchResponse(null);

    try {
      const res = await fetch(`/api/sa-jobs?q=${encodeURIComponent(query || "jobs")}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

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

    if (jobType) {
      filtered = filtered.filter((job) =>
        job.snippet.toLowerCase().includes(jobType.replace("-", " "))
      );
    }

    if (experience) {
      filtered = filtered.filter(
        (job) =>
          job.snippet.toLowerCase().includes(experience) ||
          job.title.toLowerCase().includes(experience)
      );
    }

    if (salary) {
      const [min, max] = salary.split("-").map((s) => parseInt(s.replace("+", "")));
      filtered = filtered.filter((job) => {
        const salaryMatch = job.snippet.match(/R([\d,]+)/);
        if (!salaryMatch) return true;
        const jobSalary = parseInt(salaryMatch[1].replace(",", ""));
        if (salary.includes("+")) return jobSalary >= min;
        return jobSalary >= min && jobSalary <= max;
      });
    }

    if (locationFilter) {
      filtered = filtered.filter((job) =>
        job.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (datePosted) {
      const daysAgo = parseInt(datePosted);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

      filtered = filtered.filter((job) => {
        if (!job.posted_date) return true;
        const jobDate = new Date(job.posted_date);
        return jobDate >= cutoffDate;
      });
    }

    setFilteredResults(filtered);
  };

  useEffect(() => {
    applyFilters(results);
  }, [jobType, experience, salary, locationFilter, datePosted, results]);

  // Get company logo or fallback to initials
  const getCompanyLogo = (companyName: string) => {
    console.log(`Looking for logo for company: "${companyName}"`);

    // Company logo mapping using local files from root directory
    const companyLogos: { [key: string]: string } = {
      'nedbank': 'Nedbank_logo_small.jpg',
      'standard bank': 'placeholder-logo.svg',
      'fnb': 'placeholder-logo.svg',
      'first national bank': 'placeholder-logo.svg',
      'absa': 'Absa_Logo.png',
      'capitec': 'placeholder-logo.svg',
      'investec': 'placeholder-logo.svg',
      'santam': 'placeholder-logo.svg',
      'old mutual': 'placeholder-logo.svg',
      'discovery': 'placeholder-logo.svg',
      'momentum': 'placeholder-logo.svg',
      'liberty': 'placeholder-logo.svg',
      'sanlam': 'placeholder-logo.svg',
      'vanguard': 'placeholder-logo.svg',
      'blackrock': 'placeholder-logo.svg',
      'jpmorgan': 'placeholder-logo.svg',
      'goldman sachs': 'placeholder-logo.svg',
      'morgan stanley': 'placeholder-logo.svg',
      'citibank': 'placeholder-logo.svg',
      'hsbc': 'placeholder-logo.svg',
      'deutsche bank': 'placeholder-logo.svg',
      'mr price': 'mrp.jpg',
      'mrp': 'mrp.jpg',
      'vector logistics': 'vector-logistics-logo.png',
      'vector': 'vector-logistics-logo.png'
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

  const openJobSheet = (job: SAJobResult) => {
    setSelectedJob(job);
    setIsSheetOpen(true);
  };

  const closeJobSheet = () => {
    setSelectedJob(null);
    setIsSheetOpen(false);
    setSelectedCVId("");
  };

  const handleApply = async () => {
    if (!user || !selectedJob) return;
    try {
      await applicationTracker.trackApplication({
        jobId: selectedJob.url,
        jobTitle: selectedJob.title,
        company: selectedJob.company || selectedJob.source || "",
        status: "applied",
        source: selectedJob.source || "",
        cvVersion: selectedCVId,
        coverLetterUsed: false,
        matchScore: 0,
      });
      alert("Application tracked successfully.");
      closeJobSheet();
    } catch (error) {
      alert("Failed to track application.");
    }
  };

  const handleSave = () => {
    if (!user || !selectedJob) return;
    // Implement save job logic here, e.g., save to user profile or localStorage
    alert("Job saved for later.");
  };

  const handleAIJobMatchReview = () => {
    if (!user) {
      alert("Please sign in and create a CV to proceed with AI Job-Match Review.");
      // Optionally, redirect to sign-in or CV creation page here
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
    // Implement AI Job-Match Review logic here
    alert(`AI Job-Match Review started for CV ID: ${selectedCVId}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            South African Job Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Job title or keywords (optional)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  required
                  className="px-3 py-2 border rounded-md min-w-[150px]"
                >
                  <option value="">Select Location</option>
                  <option value="johannesburg">Johannesburg</option>
                  <option value="cape town">Cape Town</option>
                  <option value="durban">Durban</option>
                  <option value="pretoria">Pretoria</option>
                  <option value="port elizabeth">Port Elizabeth</option>
                </select>
                <Button
                  type="button"
                  onClick={() => handleSearch()}
                  disabled={loading || !locationFilter}
                >
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">All Job Types</option>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">All Experience</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="executive">Executive</option>
                </select>
                <select
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">All Salaries</option>
                  <option value="0-15000">R0 - R15,000</option>
                  <option value="15000-30000">R15,000 - R30,000</option>
                  <option value="30000-50000">R30,000 - R50,000</option>
                  <option value="50000+">R50,000+</option>
                </select>

                <select
                  value={datePosted}
                  onChange={(e) => setDatePosted(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">Any Time</option>
                  <option value="1">Last 24 hours</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                </select>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-red-600">{error}</div>
          </CardContent>
        </Card>
      )}

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

                return (
                  <Card
                    key={idx}
                    className="border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300"
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

                      {/* Qualifications */}
                      {job.qualifications && job.qualifications.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Qualifications</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {job.qualifications.map((qualification, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3"
                              >
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                {qualification}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            📍 {job.location || "South Africa"}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            🕒 {job.posted_date || "Recently posted"}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => openJobSheet(job)}
                              >
                                View
                              </Button>
                            </SheetTrigger>
                            <SheetContent
                              aria-labelledby="job-sheet-title"
                              className="bg-white rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-y-auto"
                            >
                              <SheetHeader className="text-left space-y-2">
                                <div className="flex items-center gap-3">
                                  {/* Company Logo in Job Details */}
                                  {(() => {
                                    const companyLogo = getCompanyLogo(selectedJob?.company || selectedJob?.source || "");
                                    return companyLogo ? (
                                      <img
                                        src={companyLogo}
                                        alt={`${selectedJob?.company || selectedJob?.source} logo`}
                                        className="w-12 h-12 rounded-lg object-contain flex-shrink-0 bg-white p-1"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = "none";
                                          const fallback = target.nextElementSibling as HTMLElement;
                                          if (fallback) fallback.style.display = "flex";
                                        }}
                                      />
                                    ) : (
                                      <div
                                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getLogoColor(
                                          selectedJob?.company || selectedJob?.source || ""
                                        )} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                                      >
                                        {getCompanyInitials(selectedJob?.company || selectedJob?.source || "")}
                                      </div>
                                    );
                                  })()}
                                  <div className="flex-1">
                                    <SheetTitle id="job-sheet-title" className="text-xl font-semibold text-gray-900">
                                      {selectedJob?.title ?? "Job details"}
                                    </SheetTitle>
                                    <SheetDescription className="text-sm text-gray-500">
                                      {selectedJob?.company || selectedJob?.source}
                                    </SheetDescription>
                                  </div>
                                </div>
                              </SheetHeader>

                              <div className="mt-4 max-h-72 overflow-y-auto text-sm leading-relaxed text-gray-700 pr-2">
                                <MarkdownRenderer
                                  content={selectedJob?.description || selectedJob?.snippet || "No description available."}
                                  className="text-gray-700"
                                />
                              </div>

                              <SheetFooter className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-3">
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleApply}
                                    disabled={!user}
                                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                                  >
                                    Apply
                                  </Button>

                                  <Button onClick={handleSave} disabled={!user} variant="outline" aria-label="Save Job">
                                    <Save className="w-4 h-4 mr-1" /> Save
                                  </Button>
                                </div>

                                <div className="flex gap-2 items-center">
                                  <label htmlFor="cv-select" className="sr-only">Select CV</label>
                                  <select
                                    id="cv-select"
                                    value={selectedCVId}
                                    onChange={(e) => setSelectedCVId(e.target.value)}
                                    className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">{savedCVs.length ? "Select CV for AI Job-Match Review" : "No saved CVs"}</option>
                                    {savedCVs.length > 0 && savedCVs.map((cv) => (
                                      <option key={cv.id} value={cv.id}>
                                        {cv.name}
                                      </option>
                                    ))}
                                  </select>

                                  <Button
                                    onClick={handleAIJobMatchReview}
                                    disabled={!user || !selectedCVId}
                                    variant="outline"
                                    aria-label="AI Job Match Review"
                                  >
                                    AI Match
                                  </Button>
                                </div>
                              </SheetFooter>
                            </SheetContent>
                          </Sheet>
                          <Button
                            size="sm"
                            asChild
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-xs"
                          >
                            <a href={job.url} target="_blank" rel="noopener noreferrer">
                              Apply
                            </a>
                          </Button>
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
  );
}
