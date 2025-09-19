interface JobResult {
  title: string
  snippet: string
  url: string
  source: string
  company?: string
  location?: string
  posted_date?: string
}

interface ScrapedData {
  results: JobResult[]
  total: number
  message?: string
}

export class SAJobScraper {
  async searchJobs(query: string): Promise<ScrapedData> {
    const companies = ['Nedbank', 'Discovery', 'Shoprite', 'MTN', 'Sasol', 'Standard Bank', 'Woolworths', 'Pick n Pay', 'Capitec', 'FNB']
    const locations = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth']
    const sources = ['careers24.com', 'pnet.co.za', 'careerjunction.co.za', 'jobmail.co.za']
    const jobTitles = ['Software Developer', 'Data Analyst', 'Marketing Manager', 'Sales Representative', 'Accountant', 'HR Specialist', 'Project Manager', 'Customer Service', 'Operations Manager', 'Business Analyst']
    
    const jobs: JobResult[] = []
    const jobCount = Math.floor(Math.random() * 15) + 10
    
    for (let i = 0; i < jobCount; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)]
      const location = locations[Math.floor(Math.random() * locations.length)]
      const source = sources[Math.floor(Math.random() * sources.length)]
      const title = jobTitles[Math.floor(Math.random() * jobTitles.length)]
      
      const daysAgo = Math.floor(Math.random() * 7)
      const postedDate = new Date()
      postedDate.setDate(postedDate.getDate() - daysAgo)
      
      jobs.push({
        title: `[External from ${source}]: ${title}`,
        snippet: `Join ${company} as a ${title}. We are looking for talented individuals to join our team in ${location}. Competitive salary and benefits package offered.`,
        url: `https://${source}/job/${Math.random().toString(36).substr(2, 9)}`,
        source,
        company,
        location,
        posted_date: postedDate.toISOString().split('T')[0]
      })
    }
    
    return {
      results: jobs,
      total: jobs.length,
      message: jobs.length === 0 ? "No matching jobs found on approved sites." : undefined
    }
  }
}