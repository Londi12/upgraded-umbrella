import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  matchScore: number;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const { c_id } = await request.json();

    if (!c_id) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Get recent jobs from job_listings table
    const { data: jobs, error: jobsError } = await supabase
      .from('job_listings')
      .select('*')
      .eq('is_active', true)
      .order('posted_date', { ascending: false })
      .limit(50);

    if (jobsError || !jobs || jobs.length === 0) {
      // Fallback to sample jobs if no database jobs
      const sampleJobs = [
        {
          id: "1",
          title: "Software Developer",
          company: "TechCorp SA",
          location: "Cape Town",
          description: "Looking for a software developer with React and Node.js experience.",
          matchScore: 85,
          url: "https://example.com/job/1"
        },
        {
          id: "2",
          title: "Full Stack Developer",
          company: "InnovateIT",
          location: "Johannesburg",
          description: "Full stack developer role with modern web technologies.",
          matchScore: 78,
          url: "https://example.com/job/2"
        }
      ];
      return NextResponse.json(sampleJobs);
    }

    // Mock CV data for matching (in real app, get from user profile)
    const mockCVData = {
      personalInfo: { jobTitle: "Software Developer" },
      skills: "JavaScript, React, Node.js, Python, SQL",
      summary: "Experienced software developer",
      experience: [{ title: "Developer", description: "Web development" }]
    };

    // Use AI job matching
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/ai-job-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        cvData: mockCVData, 
        jobs: jobs.slice(0, 10) // Limit to 10 jobs for performance
      })
    });

    if (!response.ok) {
      throw new Error('AI matching failed');
    }

    const aiMatches = await response.json();
    
    // Convert to expected format
    const matchedJobs = aiMatches.map((match: any) => {
      const job = jobs.find(j => j.id === match.jobId || j.external_id === match.jobId);
      return {
        id: match.jobId,
        title: job?.title || 'Unknown Job',
        company: job?.company || 'Unknown Company',
        location: job?.location || 'Unknown Location',
        description: job?.description || match.reasoning,
        matchScore: match.matchScore,
        url: job?.application_url || '#'
      };
    }).filter((job: JobMatch) => job.matchScore >= 60);

    return NextResponse.json(matchedJobs);

  } catch (error) {
    console.error('Job matching error:', error);
    return NextResponse.json(
      { error: 'Failed to match jobs for candidate' },
      { status: 500 }
    );
  }
}
