"use client";
import React, { useState } from "react";
import { ModernJobCard } from "./modern-job-card";

interface JobResult {
  title: string;
  snippet: string;
  link: string;
  displayLink: string;
}

export default function ModernJobSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await fetch(`/api/jobsearch?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok) {
        setResults(data.results);
      } else {
        setError(data.error || "Unknown error");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search for jobs (e.g. frontend developer)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      <div className="space-y-4">
        {results.map((job, idx) => (
          <ModernJobCard
            key={idx}
            job={{
              id: job.link,
              title: job.title,
              company: job.displayLink,
              location: "Remote / Various",
              postedDate: "Recently posted",
              description: job.snippet,
              requirements: [],
              category: "Technology",
              experience: "Various",
              qualification: "Various",
              jobType: "Full-time",
              url: job.link
            }}
            onApply={(jobId) => window.open(job.link, '_blank')}
            onView={(jobId) => window.open(job.link, '_blank')}
          />
        ))}
      </div>
    </div>
  );
}
