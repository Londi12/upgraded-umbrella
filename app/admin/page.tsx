"use client"

import { useState, useEffect } from "react"
import { Users, FileText, DollarSign, MessageCircle, Eye, Calendar, Download, Settings, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AdminChatWindow } from "@/components/admin-chat-window"

export default function AdminDashboard() {
  const [isOnline, setIsOnline] = useState(true)
  const [activeChats, setActiveChats] = useState(3)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [selectedUser, setSelectedUser] = useState<any>(null)
  
  // Real-time data (would come from database)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCVs: 0,
    revenue: 0,
    activeUsers: 0,
    todaySignups: 0,
    todayDownloads: 0
  })

  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [liveActivity, setLiveActivity] = useState<any[]>([])

  useEffect(() => {
    loadRealData()
    const interval = setInterval(loadRealData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const loadRealData = () => {
    // Load from localStorage and simulate real data
    const savedCVs = JSON.parse(localStorage.getItem('saved_cvs') || '[]')
    const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]')
    
    setStats({
      totalUsers: 2847 + mockUsers.length,
      totalCVs: 5634 + savedCVs.length,
      revenue: 89450 + (mockUsers.length * 299),
      activeUsers: Math.floor(Math.random() * 50) + 150,
      todaySignups: Math.floor(Math.random() * 20) + 5,
      todayDownloads: Math.floor(Math.random() * 100) + 50
    })

    // Generate realistic user data
    const users = [
      { 
        id: 1, 
        name: "John Smith", 
        email: "john@example.com", 
        plan: "Premium", 
        joined: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        cvsCreated: 3,
        lastActive: "2 hours ago",
        status: "online"
      },
      { 
        id: 2, 
        name: "Sarah Johnson", 
        email: "sarah@example.com", 
        plan: "Pro", 
        joined: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        cvsCreated: 7,
        lastActive: "1 hour ago",
        status: "offline"
      },
      { 
        id: 3, 
        name: "Mike Wilson", 
        email: "mike@example.com", 
        plan: "Base", 
        joined: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        cvsCreated: 1,
        lastActive: "30 minutes ago",
        status: "online"
      }
    ]
    setRecentUsers(users)

    // Live activity feed
    const activities = [
      { type: 'cv_created', user: 'John S.', time: '2 min ago', details: 'Created "Software Developer CV"' },
      { type: 'user_signup', user: 'Lisa M.', time: '5 min ago', details: 'Signed up for Premium plan' },
      { type: 'pdf_download', user: 'Mike W.', time: '8 min ago', details: 'Downloaded CV as PDF' },
      { type: 'job_match', user: 'Sarah J.', time: '12 min ago', details: 'Generated 5 job matches' }
    ]
    setLiveActivity(activities)
    setLastRefresh(new Date())
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-blue-200">CVKonnekt Analytics & Management</p>
              <p className="text-xs text-blue-300 mt-1">Last updated: {lastRefresh.toLocaleTimeString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <Badge className="bg-orange-500/20 text-orange-300">{activeChats} Active Chats</Badge>
              <Badge className="bg-green-500/20 text-green-300">Demo Mode</Badge>
              <Button variant="outline" size="sm" onClick={loadRealData} className="border-white/20 text-white hover:bg-white/10">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-green-600">+{stats.todaySignups} today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CVs Created</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCVs.toLocaleString()}</div>
              <p className="text-xs text-green-600">+{stats.todayDownloads} downloads today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R{stats.revenue.toLocaleString()}</div>
              <p className="text-xs text-green-600">+15% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-blue-600">Users online</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="activity">Live Activity</TabsTrigger>
            <TabsTrigger value="chat">Support Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">Joined: {new Date(user.joined).toLocaleDateString()} • {user.cvsCreated} CVs • {user.lastActive}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.plan === 'Pro' ? 'default' : 'secondary'}>
                          {user.plan}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>User Details: {user.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Email</label>
                                  <p className="text-sm text-gray-600">{user.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Plan</label>
                                  <p className="text-sm text-gray-600">{user.plan}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">CVs Created</label>
                                  <p className="text-sm text-gray-600">{user.cvsCreated}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Status</label>
                                  <p className={`text-sm ${user.status === 'online' ? 'text-green-600' : 'text-gray-600'}`}>
                                    {user.status}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm">Send Message</Button>
                                <Button variant="outline" size="sm">View CVs</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Live Activity Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {liveActivity.map((activity, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border-l-2 border-blue-200 bg-blue-50/50">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'cv_created' ? 'bg-green-500' :
                        activity.type === 'user_signup' ? 'bg-blue-500' :
                        activity.type === 'pdf_download' ? 'bg-purple-500' : 'bg-orange-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.user}</p>
                        <p className="text-xs text-gray-600">{activity.details}</p>
                      </div>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Support Chat</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant={isOnline ? "destructive" : "default"} 
                      size="sm"
                      onClick={() => setIsOnline(!isOnline)}
                    >
                      {isOnline ? 'Go Offline' : 'Go Online'}
                    </Button>
                    <Badge variant="outline">{activeChats} active</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Sarah Johnson</span>
                      <span className="text-xs text-gray-500">2 min ago</span>
                    </div>
                    <p className="text-sm text-gray-700">"Hi, I'm having trouble downloading my CV as PDF. Can you help?"</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm">Reply</Button>
                      <Button variant="outline" size="sm">View Profile</Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Mike Wilson</span>
                      <span className="text-xs text-gray-500">5 min ago</span>
                    </div>
                    <p className="text-sm text-gray-700">"How do I upgrade to Premium plan?"</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm">Reply</Button>
                      <Button variant="outline" size="sm">View Profile</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>


      </div>
      
      <AdminChatWindow />
    </div>
  )
}