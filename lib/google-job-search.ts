/**
 * Mock implementation of Google Job Search
 * Replace with actual implementation using Google Custom Search API
 */

export interface GoogleJobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string;
  jobType: string;
  postedDate: string;
  keywords: string[];
}

export class GoogleJobSearch {
  isConfigured(): boolean {
    // In a real implementation, this would check for API keys
    return false;
  }

  async searchJobs(keywords: string, location: string, limit: number): Promise<GoogleJobResult[]> {
    console.warn('GoogleJobSearch is using a mock implementation.');
    // In a real implementation, this would call the Google Custom Search API
    return Promise.resolve([]);
  }
}
