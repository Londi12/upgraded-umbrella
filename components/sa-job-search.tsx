 "use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Save, ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ApplicationTracker } from "@/lib/application-tracker";
import { getSavedCVs, saveJob } from "@/lib/user-data-service";
import { getAIJobMatches, type AIJobMatch } from "@/lib/ai-job-service";
import { ATSScoringPanel } from "@/components/cv-ats-scoring";
import { formatJobCardDate } from "@/lib/date-formatter";

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
    setSelectedJob(null); // Clear selected job on new search

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
    // Company logo mapping
    const companyLogos: { [key: string]: string } = {
      nedbank: "https://logos-world.net/wp-content/uploads/2020/09/Nedbank-Logo.png",
      "standard bank":
        "https://www.standardbank.com/static_file/StandardBankGroup/Standard-Bank-Group/images/logo.svg",
      fnb: "https://www.fnb.co.za/assets/images/fnb-logo.svg",
      "first national bank": "https://www.fnb.co.za/assets/images/fnb-logo.svg",
      absa: "https://www.absa.co.za/content/dam/absa/absa-logo.svg",
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
  };

  const clearSelectedJob = () => {
    setSelectedJob(null);
    setSelectedCVId("");
  };

  

  const handleSave = async () => {
    if (!user || !selectedJob) return;

    try {
      await saveJob({
        job_title: selectedJob.title,
        company_name: selectedJob.company || selectedJob.source || "",
        job_url: selectedJob.url,
        job_description: selectedJob.description || selectedJob.snippet || "",
        location: selectedJob.location || "",
        posted_date: selectedJob.posted_date || "",
        source: selectedJob.source || "",
      });
      alert("Job saved successfully.");
    } catch (error) {
      alert("Failed to save job.");
    }
  };

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
        <Card className="border-red-200 mb-6">
          <CardContent className="pt-6">
            <div className="text-red-600">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job List Column */}
        <div className="space-y-4">
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
                          <p className="text-sm text-gray-700 leading-relaxed mb-4">
                            {job.snippet}
                          </p>

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

        {/* Job Details Column */}
        <div className="space-y-4">
          {selectedJob ? (
            <Card>
              <CardHeader>
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
              <CardContent className="space-y-4">
                {/* Job Header */}
                <div>
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

                {/* Job Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {selectedJob.description || selectedJob.snippet || "No description available."}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4 border-t">
                  {/* Single Row with Save, CV Selection, and AI Match */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button
                      onClick={handleSave}
                      disabled={!user}
                      variant="outline"
                      size="sm"
                      className="flex-none"
                      aria-label="Save Job"
                    >
                      <Save className="w-4 h-4 mr-1" /> Save
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
                    <Button asChild className="w-full" size="lg">
                      <a href={selectedJob.url} target="_blank" rel="noopener noreferrer">
                        <Send className="w-4 h-4 mr-2" />
                        Apply Now
                      </a>
                    </Button>
                  </div>
                </div>

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
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
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
    </div>
  );
}
