'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, UserX, Eye, Brain, Filter, MapPin, Calendar, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app-store'

interface MissingChild {
  id: string
  fullName: string
  age: number
  gender: string
  lastSeenLocation: string
  lastSeenDate: string
  dateMissing: string
  status: string
  priority: string
  caseNumber: string
  photos: string
  parentGuardianName: string
  parentGuardianPhone: string
  clothingDescription?: string
  medicalConditions?: string
  reporter?: { id: string; name: string }
}

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800' },
  investigating: { label: 'Investigating', className: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800' },
  matched: { label: 'Matched', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700' },
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300' },
  high: { label: 'High', className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300' },
  normal: { label: 'Normal', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400' },
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function MissingListView() {
  const navigateTo = useAppStore((s) => s.navigateTo)
  const setSelectedMissingChildId = useAppStore((s) => s.setSelectedMissingChildId)
  const [children, setChildren] = useState<MissingChild[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedChild, setSelectedChild] = useState<MissingChild | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchChildren = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (activeTab !== 'all') params.set('status', activeTab)
      if (search) params.set('search', search)
      const res = await fetch(`/api/missing?${params}`)
      if (res.ok) {
        const json = await res.json()
        setChildren(json.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch missing children:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, search])

  useEffect(() => {
    fetchChildren()
  }, [fetchChildren])

  const viewDetails = (child: MissingChild) => {
    setSelectedChild(child)
    setSelectedMissingChildId(child.id)
    setDetailOpen(true)
  }

  const runMatch = (child: MissingChild) => {
    setSelectedMissingChildId(child.id)
    navigateTo('face-compare')
  }

  const getPhotos = (photosStr: string): string[] => {
    try { return JSON.parse(photosStr || '[]') } catch { return [] }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <UserX className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Missing Children</h1>
              <p className="text-sm text-muted-foreground">Track and manage missing child reports</p>
            </div>
          </div>
          <Button onClick={() => navigateTo('report-missing')} className="min-h-[44px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
            <UserX className="h-4 w-4 mr-2" /> Report Missing
          </Button>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name, location, or case number..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="investigating">Investigating</TabsTrigger>
          <TabsTrigger value="matched">Matched</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        {['all', 'open', 'investigating', 'matched', 'closed'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {loading ? (
              <TableSkeleton />
            ) : children.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/40" />
                  <h3 className="mt-4 text-lg font-semibold text-muted-foreground">No Missing Children Found</h3>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    {search ? 'Try adjusting your search terms' : 'No reports match this filter'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead className="hidden sm:table-cell">Gender</TableHead>
                        <TableHead className="hidden md:table-cell">Last Seen</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Priority</TableHead>
                        <TableHead className="hidden lg:table-cell">Case #</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {children.map((child, idx) => {
                        const photos = getPhotos(child.photos)
                        const sCfg = statusConfig[child.status] || statusConfig.open
                        const pCfg = priorityConfig[child.priority] || priorityConfig.normal
                        return (
                          <motion.tr
                            key={child.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => viewDetails(child)}
                          >
                            <TableCell>
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-amber-100 text-amber-700 text-xs dark:bg-amber-900/40 dark:text-amber-300">
                                  {child.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">{child.fullName}</TableCell>
                            <TableCell>{child.age}</TableCell>
                            <TableCell className="hidden sm:table-cell">{child.gender}</TableCell>
                            <TableCell className="hidden md:table-cell max-w-[180px] truncate">{child.lastSeenLocation}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={sCfg.className}>{sCfg.label}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <Badge variant="outline" className={pCfg.className}>{pCfg.label}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">{child.caseNumber}</TableCell>
                            <TableCell>
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => viewDetails(child)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:text-emerald-700" onClick={() => runMatch(child)}>
                                  <Brain className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-amber-600" />
              {selectedChild?.fullName}
            </DialogTitle>
            <DialogDescription>Missing child report details</DialogDescription>
          </DialogHeader>
          {selectedChild && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Age</p><p className="font-medium">{selectedChild.age}</p></div>
                <div><p className="text-muted-foreground text-xs">Gender</p><p className="font-medium">{selectedChild.gender}</p></div>
                <div><p className="text-muted-foreground text-xs">Last Seen</p><p className="font-medium">{selectedChild.lastSeenLocation}</p></div>
                <div><p className="text-muted-foreground text-xs">Date Missing</p><p className="font-medium">{new Date(selectedChild.dateMissing).toLocaleDateString()}</p></div>
                <div><p className="text-muted-foreground text-xs">Case Number</p><p className="font-mono text-xs">{selectedChild.caseNumber}</p></div>
                <div><p className="text-muted-foreground text-xs">Status</p>
                  <Badge variant="outline" className={(statusConfig[selectedChild.status] || statusConfig.open).className}>
                    {(statusConfig[selectedChild.status] || statusConfig.open).label}
                  </Badge>
                </div>
                <div><p className="text-muted-foreground text-xs">Guardian</p><p className="font-medium">{selectedChild.parentGuardianName}</p></div>
                <div><p className="text-muted-foreground text-xs">Guardian Phone</p><p className="font-medium">{selectedChild.parentGuardianPhone}</p></div>
              </div>
              {selectedChild.clothingDescription && (
                <div><p className="text-muted-foreground text-xs">Clothing</p><p className="text-sm">{selectedChild.clothingDescription}</p></div>
              )}
              {selectedChild.medicalConditions && (
                <div><p className="text-muted-foreground text-xs">Medical Conditions</p><p className="text-sm">{selectedChild.medicalConditions}</p></div>
              )}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { runMatch(selectedChild); setDetailOpen(false) }}>
                  <Brain className="h-4 w-4 mr-2" /> Run AI Match
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
