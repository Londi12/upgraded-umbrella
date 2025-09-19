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
    <div className="max-w-xl mx-auto p-4">
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2"
          placeholder="Search for jobs (e.g. frontend developer)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <ul className="space-y-4">
        {results.map((job, idx) => (
          <li key={idx} className="border rounded p-3 bg-white shadow">
            <a href={job.link} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-blue-700 hover:underline">
              {job.title}
            </a>
            <div className="text-gray-700 text-sm mt-1">{job.snippet}</div>
            <div className="text-xs text-gray-500 mt-1">{job.displayLink}</div>
            <a href={job.link} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-blue-600 hover:underline text-sm">
              View on original site
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
