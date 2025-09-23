import { NextRequest, NextResponse } from 'next/server'

interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  matchScore: number;
  url: string;
}

// Mock job matching data for demo purposes
const mockMatchedJobs: JobMatch[] = [
  {
    id: "1",
    title: "Senior Software Developer",
    company: "TechCorp SA",
    location: "Cape Town, WC",
    description: "We are looking for a senior software developer with experience in React, Node.js, and cloud technologies. Perfect match for candidates with strong technical skills.",
    matchScore: 95,
    url: "https://example.com/job/1"
  },
  {
    id: "2",
    title: "Full Stack Developer",
    company: "InnovateIT",
    location: "Johannesburg, GP",
    description: "Join our dynamic team as a full stack developer. Work with modern technologies including React, Node.js, and AWS. Great opportunity for growth.",
    matchScore: 88,
    url: "https://example.com/job/2"
  },
  {
    id: "3",
    title: "Frontend Developer",
    company: "Digital Solutions",
    location: "Cape Town, WC",
    description: "Frontend developer position focusing on React and modern web technologies. Collaborative environment with opportunities for skill development.",
    matchScore: 82,
    url: "https://example.com/job/3"
  },
  {
    id: "4",
    title: "Software Engineer",
    company: "TechStart",
    location: "Durban, KZN",
    description: "Software engineer role with focus on scalable web applications. Experience with JavaScript frameworks and cloud platforms preferred.",
    matchScore: 76,
    url: "https://example.com/job/4"
  },
  {
    id: "5",
    title: "Web Developer",
    company: "Creative Agency",
    location: "Pretoria, GP",
    description: "Creative web developer position combining technical skills with design thinking. Perfect for developers who enjoy user experience work.",
    matchScore: 71,
    url: "https://example.com/job/5"
  }
];

export async function POST(request: NextRequest) {
  try {
    const { c_id } = await request.json();

    if (!c_id) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Simulate API delay for realistic experience
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real implementation, this would call your Supabase RPC:
    // const { data, error } = await supabase.rpc('match_jobs_for_candidate', { c_id });

    // For demo purposes, return mock data
    const matchedJobs = mockMatchedJobs.map(job => ({
      ...job,
      // Add some randomization to make it feel more dynamic
      matchScore: Math.max(60, job.matchScore + Math.floor(Math.random() * 20) - 10)
    }));

    return NextResponse.json(matchedJobs);

  } catch (error) {
    console.error('Job matching error:', error);
    return NextResponse.json(
      { error: 'Failed to match jobs for candidate' },
      { status: 500 }
    );
  }
}
