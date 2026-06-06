'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, FileText, Brain, Settings, Search, CheckCircle2, XCircle, AlertTriangle, BarChart3, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app-store'
import { useToast } from '@/hooks/use-toast'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'

interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  verified: boolean
  active: boolean
}

const roleColors: Record<string, string> = {
  admin: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  police: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  ngo: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  rescue: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  parent: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400',
}

export function AdminView() {
  const currentUser = useAppStore((s) => s.currentUser)
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('users')

  // Users
  const [users, setUsers] = useState<UserRecord[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')

  // AI Logs
  const [aiLogs, setAiLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  // Analytics
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  // Settings
  const [matchThreshold, setMatchThreshold] = useState([70])
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(true)
  const [rateLimit, setRateLimit] = useState([100])

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.data || [])
      } else {
        setUsers([])
      }
    } catch {
      setUsers([])
    } finally { setUsersLoading(false) }
  }, [])

  const fetchAiLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const res = await fetch('/api/admin/ai-logs')
      if (res.ok) {
        const data = await res.json()
        setAiLogs(data.logs || data.data || [])
      } else {
        setAiLogs([])
      }
    } catch {
      setAiLogs([])
    } finally { setLogsLoading(false) }
  }, [])

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics')
      if (res.ok) {
        const data = await res.json()
        setAnalyticsData(data)
      }
    } catch {
      // Analytics fetch failed — non-critical
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])
  useEffect(() => { if (activeTab === 'ai-logs') fetchAiLogs() }, [activeTab, fetchAiLogs])
  useEffect(() => { if (activeTab === 'analytics') fetchAnalytics() }, [activeTab, fetchAnalytics])

  // Safety: force loading to finish after 8 seconds to prevent infinite spinners
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (usersLoading) setUsersLoading(false)
      if (logsLoading) setLogsLoading(false)
    }, 8000)
    return () => clearTimeout(safetyTimer)
  }, [usersLoading, logsLoading])

  // Check admin access
  if (currentUser?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold text-muted-foreground">Access Denied</h3>
          <p className="mt-1 text-sm text-muted-foreground/70">Admin access required</p>
        </CardContent>
      </Card>
    )
  }

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, active: !currentActive, adminUserId: currentUser?.id }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !currentActive } : u))
        toast({ title: 'User Updated', description: `User ${!currentActive ? 'activated' : 'deactivated'}` })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' })
    }
  }

  const handleChangeRole = async (userId: string, role: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role, adminUserId: currentUser?.id }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
        toast({ title: 'Role Updated' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' })
    }
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">Admin Control Panel</h1>
            <p className="text-sm text-muted-foreground">Manage users, reports, AI logs and platform settings</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="users" className="text-xs sm:text-sm gap-1"><Users className="h-3.5 w-3.5" /> Users</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm gap-1"><FileText className="h-3.5 w-3.5" /> Reports</TabsTrigger>
          <TabsTrigger value="ai-logs" className="text-xs sm:text-sm gap-1"><Brain className="h-3.5 w-3.5" /> AI Logs</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm gap-1"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm gap-1"><Settings className="h-3.5 w-3.5" /> Settings</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." className="pl-9" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          </div>

          {usersLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden md:table-cell">Verified</TableHead>
                      <TableHead className="hidden md:table-cell">Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{user.email}</TableCell>
                        <TableCell>
                          <Select value={user.role} onValueChange={(role) => handleChangeRole(user.id, role)}>
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="police">Police</SelectItem>
                              <SelectItem value="ngo">NGO</SelectItem>
                              <SelectItem value="rescue">Rescue</SelectItem>
                              <SelectItem value="parent">Parent</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {user.verified ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Switch checked={user.active} onCheckedChange={() => handleToggleActive(user.id, user.active)} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={roleColors[user.role] || roleColors.parent}>{user.role}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold text-muted-foreground">Report Management</h3>
              <p className="mt-1 text-sm text-muted-foreground/70">Verify, flag, or remove reports from this panel</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Logs Tab */}
        <TabsContent value="ai-logs" className="mt-4">
          {logsLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : aiLogs.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground/40" />
                <h3 className="mt-4 text-lg font-semibold text-muted-foreground">No AI Logs Yet</h3>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Missing Child</TableHead>
                      <TableHead className="hidden sm:table-cell">Found Child</TableHead>
                      <TableHead>Similarity</TableHead>
                      <TableHead className="hidden md:table-cell">Confidence</TableHead>
                      <TableHead className="hidden md:table-cell">Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aiLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.missingChild?.fullName || 'N/A'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{log.foundChild?.estimatedName || 'Unknown'}</TableCell>
                        <TableCell>{Math.round(log.similarityScore)}%</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            log.confidence === 'high' ? 'bg-emerald-100 text-emerald-800' :
                            log.confidence === 'medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }>{log.confidence}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">{log.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4 space-y-4">
          {analyticsData?.stats ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Missing', value: analyticsData.stats.totalMissing || 0, color: 'text-amber-600' },
                  { label: 'Total Found', value: analyticsData.stats.totalFound || 0, color: 'text-emerald-600' },
                  { label: 'AI Matches', value: analyticsData.stats.totalMatches || 0, color: 'text-teal-600' },
                  { label: 'Reunifications', value: analyticsData.stats.reunifications || 0, color: 'text-rose-600' },
                ].map(s => (
                  <Card key={s.label}>
                    <CardContent className="p-4 text-center">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {analyticsData.stats.monthlyData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monthly Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                    <BarChart width={600} height={300} data={analyticsData.stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Bar dataKey="missing" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="found" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="matched" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/40" />
                <h3 className="mt-4 text-lg font-semibold text-muted-foreground">Loading Analytics...</h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Matching Configuration</CardTitle>
              <CardDescription>Fine-tune the facial recognition matching engine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Match Threshold</p>
                    <p className="text-xs text-muted-foreground">Minimum similarity score for a match ({matchThreshold[0]}%)</p>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">{matchThreshold[0]}%</span>
                </div>
                <Slider value={matchThreshold} onValueChange={setMatchThreshold} min={30} max={95} step={5} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Send alerts via email for high-confidence matches</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">SMS Notifications</p>
                  <p className="text-xs text-muted-foreground">Send SMS alerts for emergency cases</p>
                </div>
                <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">API Rate Limit</p>
                    <p className="text-xs text-muted-foreground">Max requests per minute ({rateLimit[0]})</p>
                  </div>
                  <span className="text-lg font-bold">{rateLimit[0]}</span>
                </div>
                <Slider value={rateLimit} onValueChange={setRateLimit} min={10} max={500} step={10} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
