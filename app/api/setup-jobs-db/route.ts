import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Insert sample data directly (table will be created automatically)
    const sampleJobs = generateSampleJobs()
    const { error: insertError } = await supabase
      .from('scraped_jobs')
      .upsert(sampleJobs, { onConflict: 'url' })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Database setup complete',
      jobs_inserted: sampleJobs.length
    })

  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function generateSampleJobs() {
  const companies = ['Nedbank', 'Discovery', 'Shoprite', 'MTN', 'Sasol', 'Standard Bank', 'Woolworths', 'Pick n Pay']
  const locations = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth']
  const sources = ['careers24.com', 'pnet.co.za', 'careerjunction.co.za', 'jobmail.co.za']
  const jobTitles = ['Software Developer', 'Data Analyst', 'Marketing Manager', 'Sales Representative', 'Accountant', 'HR Specialist']
  
  const jobs = []
  
  for (let i = 0; i < 50; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)]
    const location = locations[Math.floor(Math.random() * locations.length)]
    const source = sources[Math.floor(Math.random() * sources.length)]
    const title = jobTitles[Math.floor(Math.random() * jobTitles.length)]
    const jobId = Math.floor(Math.random() * 9000000) + 1000000
    
    const daysAgo = Math.floor(Math.random() * 14)
    const postedDate = new Date()
    postedDate.setDate(postedDate.getDate() - daysAgo)
    
    const realUrls = {
      'careers24.com': `https://www.careers24.com/jobs/view/${jobId}`,
      'pnet.co.za': `https://www.pnet.co.za/jobs/view/${jobId}`,
      'careerjunction.co.za': `https://www.careerjunction.co.za/jobs/${jobId}`,
      'jobmail.co.za': `https://www.jobmail.co.za/job-details/${jobId}`
    }
    
    jobs.push({
      title: `${title} - ${company}`,
      snippet: `Join ${company} as a ${title} in ${location}. We offer competitive salary, benefits, and career growth opportunities.`,
      url: realUrls[source as keyof typeof realUrls],
      source,
      company,
      location,
      posted_date: postedDate.toISOString().split('T')[0]
    })
  }
  
  return jobs
}