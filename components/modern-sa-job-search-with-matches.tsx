"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Search, Shield, Clock, Database, Target, Loader2 } from "lucide-react";
import { ModernJobCard } from "./modern-job-card";

interface SAJobResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  posted_date?: string;
  company?: string;
  location?: string;
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

interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  matchScore: number;
  url: string;
}

export default function ModernSAJobSearchWithMatches() {
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
  const [matchedJobs, setMatchedJobs] = useState<JobMatch[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [showMatches, setShowMatches] = useState(false);

  // Initialize cache on mount
  React.useEffect(() => {
    const initCache = async () => {
      try {
        const res = await fetch('/api/sa-jobs?q=jobs')
        if (res.ok) {
          const data = await res.json()
          // Cache is automatically populated by the scraper
        }
      } catch (error) {
        console.log('Cache initialization failed:', error)
      }
    }
    initCache()
  }, [])

  const handleSearch = async () => {
    if (!locationFilter) return;

    setLoading(true);
    setError("");
    setResults([]);
    setSearchResponse(null);

    try {
      const res = await fetch(`/api/sa-jobs?q=${encodeURIComponent(query || 'jobs')}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data && data.results) {
        setResults(data.results);
        setSearchResponse(data);
        setFilteredResults(data.results);
      } else {
        setError('No results returned');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatches = async () => {
    setMatchingLoading(true);
    setError("");

    try {
      // For demo purposes, we'll use a mock candidate ID
      const candidateId = "demo-candidate-123";

      const response = await fetch('/api/match-jobs-for-candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          c_id: candidateId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setMatchedJobs(data);
      setShowMatches(true);
    } catch (err) {
      console.error('Matching error:', err);
      setError('Failed to find job matches. Please try again.');
    } finally {
      setMatchingLoading(false);
    }
  };

  const applyFilters = (jobs: SAJobResult[]) => {
    let filtered = jobs;

    if (jobType) {
      filtered = filtered.filter(job =>
        job.snippet.toLowerCase().includes(jobType.replace('-', ' '))
      );
    }

    if (experience) {
      filtered = filtered.filter(job =>
        job.snippet.toLowerCase().includes(experience) ||
        job.title.toLowerCase().includes(experience)
      );
    }

    if (salary) {
      const [min, max] = salary.split('-').map(s => parseInt(s.replace('+', '')));
      filtered = filtered.filter(job => {
        const salaryMatch = job.snippet.match(/R([\d,]+)/);
        if (!salaryMatch) return true;
        const jobSalary = parseInt(salaryMatch[1].replace(',', ''));
        if (salary.includes('+')) return jobSalary >= min;
        return jobSalary >= min && jobSalary <= max;
      });
    }

    if (locationFilter) {
      filtered = filtered.filter(job =>
        job.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (datePosted) {
      const daysAgo = parseInt(datePosted);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

      filtered = filtered.filter(job => {
        if (!job.posted_date) return true;
        const jobDate = new Date(job.posted_date);
        return jobDate >= cutoffDate;
      });
    }

    setFilteredResults(filtered);
  };

  React.useEffect(() => {
    applyFilters(results);
  }, [jobType, experience, salary, locationFilter, datePosted, results]);

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
                  onChange={e => setQuery(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
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
                <Button type="button" onClick={() => handleSearch()} disabled={loading || !locationFilter}>
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>

              {/* Find Matches Button */}
              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  onClick={handleFindMatches}
                  disabled={matchingLoading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                  {matchingLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Finding Matches...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4" />
                      Find Matches
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <select
                  value={jobType}
                  onChange={e => setJobType(e.target.value)}
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
                  onChange={e => setExperience(e.target.value)}
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
                  onChange={e => setSalary(e.target.value)}
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
                  onChange={e => setDatePosted(e.target.value)}
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

      {/* Job Matches Section */}
      {showMatches && matchedJobs.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Target className="h-5 w-5" />
              Your Job Matches
            </CardTitle>
            <p className="text-blue-700">
              Found {matchedJobs.length} job{matchedJobs.length !== 1 ? 's' : ''} that match your profile
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matchedJobs.map((job, idx) => (
                <Card key={idx} className="border border-blue-200 hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                        <p className="text-gray-600">{job.company} • {job.location}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{job.matchScore}%</div>
                        <div className="text-xs text-gray-500">Match Score</div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3 line-clamp-2">{job.description}</p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => window.open(job.url, '_blank')}>
                        Apply Now
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </Button>
                      <Button variant="outline" size="sm">
                        Save Job
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
              <span>Checked {searchResponse.sources_checked.length} sources</span>
              {searchResponse.message && (
                <>
                  <span>•</span>
                  <span>{searchResponse.message}</span>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-xs">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-600" />
                <span>Robots.txt: {searchResponse.compliance_report.robots_txt_checked ? "✓" : "✗"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-600" />
                <span>Rate Limited: {searchResponse.compliance_report.rate_limiting_applied ? "✓" : "✗"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Database className="h-3 w-3 text-purple-600" />
                <span>Cached: {searchResponse.compliance_report.cache_utilized ? "✓" : "✗"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-600" />
                <span>Compliant: {searchResponse.compliance_report.data_retention_compliant ? "✓" : "✗"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {filteredResults.map((job, idx) => (
          <ModernJobCard
            key={idx}
            job={{
              id: job.url || `job-${idx}`,
              title: job.title,
              company: job.company || job.source,
              location: job.location || "South Africa",
              postedDate: job.posted_date || "Recently posted",
              description: job.snippet,
              requirements: [],
              category: "IT Operations",
              experience: "2-3 yrs",
              qualification: "Degree/Diploma",
              jobType: "Full-time",
              url: job.url
            }}
            onApply={(jobId) => window.open(job.url, '_blank')}
            onView={(jobId) => window.open(job.url, '_blank')}
          />
        ))}
      </div>

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
