"use client"

import { useEffect, useState } from 'react'
import { 
  BarChart, 
  LineChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingUp, ArrowRight, Briefcase, MapPin, FileText } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getMarketInsights } from '@/lib/market-insights-service'

// Types
export interface JobMarketInsight {
  industry: string
  avg_salary: number
  job_openings: number
  growth_rate: number
  top_skills: string[]
  top_locations: {
    location: string
    count: number
  }[]
  demand_trend: {
    month: string
    count: number
  }[]
}

export interface MarketOverview {
  total_jobs: number
  trending_industries: {
    industry: string
    growth_rate: number
    job_count: number
  }[]
  top_locations: {
    location: string
    job_count: number
  }[]
  top_skills: {
    skill: string
    demand_score: number
  }[]
  salary_ranges: {
    title: string
    min: number
    max: number
    avg: number
  }[]
}

interface MarketInsightsProps {
  userIndustries?: string[]
  userSkills?: string[]
  userLocation?: string
}

export function MarketInsights({ 
  userIndustries = [], 
  userSkills = [], 
  userLocation = "" 
}: MarketInsightsProps) {
  const [insights, setInsights] = useState<JobMarketInsight[]>([])
  const [overview, setOverview] = useState<MarketOverview | null>(null)
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string>('national')
  const [selectedTab, setSelectedTab] = useState<string>('overview')

  const regionOptions = [
    { value: 'national', label: 'National (South Africa)' },
    { value: 'gauteng', label: 'Gauteng' },
    { value: 'western-cape', label: 'Western Cape' },
    { value: 'kwazulu-natal', label: 'KwaZulu-Natal' },
    { value: 'eastern-cape', label: 'Eastern Cape' },
    { value: 'free-state', label: 'Free State' },
    { value: 'north-west', label: 'North West' },
    { value: 'mpumalanga', label: 'Mpumalanga' },
    { value: 'limpopo', label: 'Limpopo' },
    { value: 'northern-cape', label: 'Northern Cape' },
  ]

  // South African theme colors
  const colors = {
    primary: '#0B4D3C', // Deep emerald green
    secondary: '#F4A261', // Warm gold
    blue: '#264653',
    teal: '#2A9D8F',
    orange: '#E76F51',
    yellow: '#E9C46A',
    lightGreen: '#6ECB63',
    purple: '#9980FA',
    navy: '#1E3A8A',
  }

  useEffect(() => {
    const loadInsights = async () => {
      setIsLoading(true)
      try {
        const result = await getMarketInsights(selectedRegion)
        if (result.data) {
          setInsights(result.data.industries || [])
          setOverview(result.data.overview || null)
        }
      } catch (error) {
        console.error('Error loading market insights:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInsights()
  }, [selectedRegion])

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading market insights...</p>
      </div>
    )
  }

  // Filter insights based on selected industry
  const filteredInsights = selectedIndustry === 'all' 
    ? insights 
    : insights.filter(insight => insight.industry === selectedIndustry)

  // Calculate relevant insights for the user
  const relevantIndustries = insights.filter(insight => 
    userIndustries.includes(insight.industry) || 
    insight.top_skills.some(skill => userSkills.includes(skill))
  )

  const personalizedInsights = userIndustries.length > 0 || userSkills.length > 0
    ? relevantIndustries
    : []

  return (
    <div className="space-y-6">
      {/* Personalized Insights Alert */}
      {personalizedInsights.length > 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Personalized Insights Available</AlertTitle>
          <AlertDescription className="text-blue-700">
            We've found {personalizedInsights.length} industries matching your skills and experience. 
            Explore them below to optimize your job search strategy.
          </AlertDescription>
        </Alert>
      )}

      {/* Region & Industry Selector */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Select 
            value={selectedRegion} 
            onValueChange={setSelectedRegion}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Region" />
            </SelectTrigger>
            <SelectContent>
              {regionOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <Select 
            value={selectedIndustry} 
            onValueChange={setSelectedIndustry}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {insights.map(insight => (
                <SelectItem key={insight.industry} value={insight.industry}>
                  {insight.industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="industries">Industry Insights</TabsTrigger>
          <TabsTrigger value="skills">In-Demand Skills</TabsTrigger>
        </TabsList>

        {/* Market Overview Tab */}
        <TabsContent value="overview">
          {overview ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Job Listings</p>
                        <h3 className="text-2xl font-bold">{overview.total_jobs.toLocaleString()}</h3>
                      </div>
                      <Briefcase className="h-8 w-8 text-emerald-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Trending Industry</p>
                        <h3 className="text-lg font-bold">{overview.trending_industries[0]?.industry || "N/A"}</h3>
                      </div>
                      <TrendingUp className="h-8 w-8 text-emerald-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Top Location</p>
                        <h3 className="text-lg font-bold">{overview.top_locations[0]?.location || "N/A"}</h3>
                      </div>
                      <MapPin className="h-8 w-8 text-emerald-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Top Skill</p>
                        <h3 className="text-lg font-bold">{overview.top_skills[0]?.skill || "N/A"}</h3>
                      </div>
                      <FileText className="h-8 w-8 text-emerald-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trending Industries */}
              <Card>
                <CardHeader>
                  <CardTitle>Trending Industries</CardTitle>
                  <CardDescription>
                    Industries with the highest growth rates in South Africa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={overview.trending_industries}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="industry" />
                        <YAxis yAxisId="left" orientation="left" stroke={colors.primary} />
                        <YAxis yAxisId="right" orientation="right" stroke={colors.secondary} />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="job_count" name="Job Openings" fill={colors.primary}>
                          {overview.trending_industries.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors.primary} />
                          ))}
                        </Bar>
                        <Bar yAxisId="right" dataKey="growth_rate" name="Growth Rate %" fill={colors.secondary}>
                          {overview.trending_industries.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors.secondary} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Salary Ranges */}
              <Card>
                <CardHeader>
                  <CardTitle>Salary Ranges by Job Title</CardTitle>
                  <CardDescription>
                    Average salary ranges for popular positions in South Africa (ZAR)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={overview.salary_ranges}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="title" type="category" width={150} />
                        <Tooltip 
                          formatter={(value) => [`R${value.toLocaleString()}`, 'Salary']}
                        />
                        <Legend />
                        <Bar dataKey="min" name="Minimum" fill={colors.blue} />
                        <Bar dataKey="avg" name="Average" fill={colors.primary} />
                        <Bar dataKey="max" name="Maximum" fill={colors.teal} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Locations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Locations</CardTitle>
                    <CardDescription>
                      Areas with the highest job availability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={overview.top_locations}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="location" type="category" width={100} />
                          <Tooltip />
                          <Bar dataKey="job_count" name="Job Openings" fill={colors.teal}>
                            {overview.top_locations.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.location === userLocation ? colors.orange : colors.teal} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* In-Demand Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle>In-Demand Skills</CardTitle>
                    <CardDescription>
                      Most requested skills across all industries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={overview.top_skills}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="skill" type="category" width={120} />
                          <Tooltip />
                          <Bar 
                            dataKey="demand_score" 
                            name="Demand Score" 
                            fill={colors.orange}
                          >
                            {overview.top_skills.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={userSkills.includes(entry.skill) ? colors.lightGreen : colors.orange} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p>No market overview data available for the selected region.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Industry Insights Tab */}
        <TabsContent value="industries">
          {filteredInsights.length > 0 ? (
            <div className="space-y-6">
              {filteredInsights.map((insight) => (
                <Card key={insight.industry}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{insight.industry}</CardTitle>
                        <CardDescription>
                          {insight.job_openings.toLocaleString()} open positions • {insight.growth_rate}% growth
                        </CardDescription>
                      </div>
                      {userIndustries.includes(insight.industry) && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          Matches Your Profile
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Demand Trend</h4>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={insight.demand_trend}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip />
                              <Line 
                                type="monotone" 
                                dataKey="count" 
                                name="Job Postings" 
                                stroke={colors.primary} 
                                strokeWidth={2}
                                activeDot={{ r: 8 }} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Top Locations</h4>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={insight.top_locations}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              layout="vertical"
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis dataKey="location" type="category" width={100} />
                              <Tooltip />
                              <Bar 
                                dataKey="count" 
                                name="Job Count" 
                                fill={colors.teal}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Top Skills in Demand</h4>
                      <div className="flex flex-wrap gap-2">
                        {insight.top_skills.map((skill) => (
                          <Badge 
                            key={skill}
                            variant="secondary"
                            className={`py-1 ${userSkills.includes(skill) ? 'bg-green-100 text-green-800' : ''}`}
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Average Salary</h4>
                      <p className="text-2xl font-bold">R {insight.avg_salary.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p>No industry data available for the selected filters.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>In-Demand Skills Analysis</CardTitle>
              <CardDescription>
                Discover which skills are most valued in the South African job market
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overview && overview.top_skills.length > 0 ? (
                <div className="space-y-8">
                  {/* Top Skills Overall */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Top Skills Across All Industries</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {overview.top_skills.slice(0, 15).map((skill) => (
                        <div 
                          key={skill.skill}
                          className={`p-4 rounded-lg border ${
                            userSkills.includes(skill.skill) 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{skill.skill}</span>
                            <span className="text-sm px-2 py-1 rounded-full bg-gray-100">
                              {skill.demand_score}
                            </span>
                          </div>
                          {userSkills.includes(skill.skill) && (
                            <p className="text-xs text-green-600 mt-1">You have this skill</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Industry-Specific Skills */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Industry-Specific Skills</h3>
                    
                    {insights.slice(0, 5).map((industry) => (
                      <div key={industry.industry} className="mb-6">
                        <h4 className="font-medium text-gray-700 mb-2">{industry.industry}</h4>
                        <div className="flex flex-wrap gap-2">
                          {industry.top_skills.map((skill) => (
                            <Badge 
                              key={`${industry.industry}-${skill}`}
                              variant="secondary"
                              className={`py-1 ${userSkills.includes(skill) ? 'bg-green-100 text-green-800' : ''}`}
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skills Gap Analysis */}
                  {userSkills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Your Skills Gap Analysis</h3>
                      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <p className="mb-4">
                          Based on your current skills and the job market demands, here are skills you might consider adding to your profile:
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {overview.top_skills
                            .filter(skill => !userSkills.includes(skill.skill))
                            .slice(0, 8)
                            .map(skill => (
                              <Badge key={skill.skill} className="bg-white border py-1">
                                {skill.skill}
                              </Badge>
                            ))}
                        </div>
                        <Button variant="outline" className="text-blue-600 border-blue-200">
                          Add to My CV <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center py-4">No skills data available for the selected region.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
