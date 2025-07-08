export interface MarketInsight {
  id: string
  title: string
  description: string
  trend: 'up' | 'down' | 'stable'
  value: string
  change: string
}

export const getMarketInsights = (): MarketInsight[] => {
  return [
    {
      id: '1',
      title: 'Tech Jobs Growth',
      description: 'Software development roles increased by 25%',
      trend: 'up',
      value: '2,847',
      change: '+25%'
    },
    {
      id: '2', 
      title: 'Remote Work',
      description: 'Remote positions now 40% of all listings',
      trend: 'up',
      value: '40%',
      change: '+15%'
    },
    {
      id: '3',
      title: 'Average Salary',
      description: 'Tech salaries in SA market',
      trend: 'stable',
      value: 'R650k',
      change: '+8%'
    }
  ]
}