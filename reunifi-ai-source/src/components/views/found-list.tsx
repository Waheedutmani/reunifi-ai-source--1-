'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Eye, Brain, Users, Heart, MapPin } from 'lucide-react'
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

interface FoundChild {
  id: string
  estimatedName: string | null
  estimatedAge: number
  gender: string
  foundLocation: string
  foundDate: string
  healthStatus: string
  status: string
  photos: string
  rescueDetails?: string
  shelterInfo?: string
  identificationMarks?: string
  registrar?: { id: string; name: string }
}

const statusConfig: Record<string, { label: string; className: string }> = {
  unidentified: { label: 'Unidentified', className: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800' },
  identified: { label: 'Identified', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' },
  reunited: { label: 'Reunited', className: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800' },
}

const healthConfig: Record<string, { label: string; className: string }> = {
  stable: { label: 'Stable', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300' },
  critical: { label: 'Critical', className: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300' },
  injured: { label: 'Injured', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300' },
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function FoundListView() {
  const navigateTo = useAppStore((s) => s.navigateTo)
  const setSelectedFoundChildId = useAppStore((s) => s.setSelectedFoundChildId)
  const [children, setChildren] = useState<FoundChild[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedChild, setSelectedChild] = useState<FoundChild | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchChildren = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (activeTab !== 'all') params.set('status', activeTab)
      if (search) params.set('search', search)
      const res = await fetch(`/api/found?${params}`)
      if (res.ok) {
        const json = await res.json()
        setChildren(json.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch found children:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, search])

  useEffect(() => { fetchChildren() }, [fetchChildren])

  const viewDetails = (child: FoundChild) => {
    setSelectedChild(child)
    setSelectedFoundChildId(child.id)
    setDetailOpen(true)
  }

  const runMatch = (child: FoundChild) => {
    setSelectedFoundChildId(child.id)
    navigateTo('face-compare')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Heart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Found Children</h1>
              <p className="text-sm text-muted-foreground">Manage found child registrations</p>
            </div>
          </div>
          <Button onClick={() => navigateTo('register-found')} className="min-h-[44px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
            <Heart className="h-4 w-4 mr-2" /> Register Found
          </Button>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="search" placeholder="Search by name or location..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unidentified">Unidentified</TabsTrigger>
          <TabsTrigger value="identified">Identified</TabsTrigger>
          <TabsTrigger value="reunited">Reunited</TabsTrigger>
        </TabsList>

        {['all', 'unidentified', 'identified', 'reunited'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {loading ? (
              <TableSkeleton />
            ) : children.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/40" />
                  <h3 className="mt-4 text-lg font-semibold text-muted-foreground">No Found Children</h3>
                  <p className="mt-1 text-sm text-muted-foreground/70">No records match this filter</p>
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
                        <TableHead>Est. Age</TableHead>
                        <TableHead className="hidden sm:table-cell">Gender</TableHead>
                        <TableHead className="hidden md:table-cell">Found Location</TableHead>
                        <TableHead className="hidden md:table-cell">Health</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {children.map((child, idx) => {
                        const sCfg = statusConfig[child.status] || statusConfig.unidentified
                        const hCfg = healthConfig[child.healthStatus] || healthConfig.stable
                        const name = child.estimatedName || 'Unidentified'
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
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-900/40 dark:text-emerald-300">
                                  {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">{name}</TableCell>
                            <TableCell>{child.estimatedAge}</TableCell>
                            <TableCell className="hidden sm:table-cell">{child.gender}</TableCell>
                            <TableCell className="hidden md:table-cell max-w-[180px] truncate">{child.foundLocation}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className={hCfg.className}>{hCfg.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={sCfg.className}>{sCfg.label}</Badge>
                            </TableCell>
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
              <Heart className="h-5 w-5 text-emerald-600" />
              {selectedChild?.estimatedName || 'Unidentified Child'}
            </DialogTitle>
            <DialogDescription>Found child registration details</DialogDescription>
          </DialogHeader>
          {selectedChild && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Est. Age</p><p className="font-medium">{selectedChild.estimatedAge}</p></div>
                <div><p className="text-muted-foreground text-xs">Gender</p><p className="font-medium">{selectedChild.gender}</p></div>
                <div><p className="text-muted-foreground text-xs">Found Location</p><p className="font-medium">{selectedChild.foundLocation}</p></div>
                <div><p className="text-muted-foreground text-xs">Found Date</p><p className="font-medium">{new Date(selectedChild.foundDate).toLocaleDateString()}</p></div>
                <div><p className="text-muted-foreground text-xs">Health Status</p>
                  <Badge variant="outline" className={(healthConfig[selectedChild.healthStatus] || healthConfig.stable).className}>
                    {(healthConfig[selectedChild.healthStatus] || healthConfig.stable).label}
                  </Badge>
                </div>
                <div><p className="text-muted-foreground text-xs">Status</p>
                  <Badge variant="outline" className={(statusConfig[selectedChild.status] || statusConfig.unidentified).className}>
                    {(statusConfig[selectedChild.status] || statusConfig.unidentified).label}
                  </Badge>
                </div>
              </div>
              {selectedChild.rescueDetails && (
                <div><p className="text-muted-foreground text-xs">Rescue Details</p><p className="text-sm">{selectedChild.rescueDetails}</p></div>
              )}
              {selectedChild.shelterInfo && (
                <div><p className="text-muted-foreground text-xs">Shelter Info</p><p className="text-sm">{selectedChild.shelterInfo}</p></div>
              )}
              {selectedChild.identificationMarks && (
                <div><p className="text-muted-foreground text-xs">Identification Marks</p><p className="text-sm">{selectedChild.identificationMarks}</p></div>
              )}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { runMatch(selectedChild); setDetailOpen(false) }}>
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
