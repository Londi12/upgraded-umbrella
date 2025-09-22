 "use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Save, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ApplicationTracker } from "@/lib/application-tracker";
import { getSavedCVs, saveJob } from "@/lib/user-data-service";
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

  const handleApply = async () => {
    if (!user || !selectedJob) return;
    try {
      window.open(selectedJob.url, "_blank");
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
    } catch (error) {
      alert("Failed to track application.");
    }
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

  const handleAIJobMatchReview = () => {
    if (!user) {
      alert("Please sign in to use AI Job-Match Review.");
      // Optionally, redirect to sign-in or CV creation page here
      return;
    }
    if (savedCVs.length === 0) {
      alert("Please create a CV to use AI Job-Match Review.");
      // Optionally, redirect to CV creation page here
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

                            {/* Action Buttons */}
                            <div className="flex gap-2">
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
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
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
                    <label htmlFor="cv-select" className="text-sm font-medium">CV for AI Match:</label>
                    <select
                      id="cv-select"
                      value={selectedCVId}
                      onChange={(e) => setSelectedCVId(e.target.value)}
                      className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{user ? (savedCVs.length ? "Select CV" : "Create a CV to use AI Match") : "Sign in to use AI Match"}</option>
                      {user && savedCVs.length > 0 && savedCVs.map((cv) => (
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
                </div>

                {/* Apply Button */}
                <div className="pt-4">
                  <Button
                    size="lg"
                    asChild
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  >
                    <a href={selectedJob.url} target="_blank" rel="noopener noreferrer">
                      Apply Now
                    </a>
                  </Button>
                </div>
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
