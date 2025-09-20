"use client";
import React, { useState } from "react";

interface JobResult {
  title: string;
  snippet: string;
  link: string;
  displayLink: string;
}

export default function JobSearch() {
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
        {results.map((job, idx) => {
          // Generate company initials for logo
          const getCompanyInitials = (companyName: string) => {
            return companyName
              .split(' ')
              .map(word => word.charAt(0))
              .join('')
              .toUpperCase()
              .substring(0, 2);
          };

          // Generate random color for logo based on company name
          const getLogoColor = (companyName: string) => {
            const colors = [
              'from-blue-500 to-cyan-500',
              'from-purple-500 to-pink-500',
              'from-green-500 to-teal-500',
              'from-orange-500 to-red-500',
              'from-indigo-500 to-blue-500'
            ];
            const index = companyName.length % colors.length;
            return colors[index];
          };

          return (
            <div key={idx} className="border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300 rounded-lg overflow-hidden">
              <div className="p-5">
                {/* Header with Logo and Basic Info */}
                <div className="flex gap-3 mb-4">
                  {/* Company Logo */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getLogoColor(job.displayLink)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                    {getCompanyInitials(job.displayLink)}
                  </div>

                  {/* Job Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                      {job.title}
                    </h3>
                    <div className="text-sm text-gray-600 mb-2">
                      {job.displayLink}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <div className="bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs px-2 py-1 rounded">
                        Technology
                      </div>
                      <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        Various
                      </div>
                      <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        Various
                      </div>
                      <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                        Full-time
                      </div>
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
                      📍 Remote / Various
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      🕒 Recently posted
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-50 transition-colors">
                      View
                    </button>
                    <button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1 rounded text-xs hover:from-cyan-600 hover:to-blue-600 transition-all duration-200">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
