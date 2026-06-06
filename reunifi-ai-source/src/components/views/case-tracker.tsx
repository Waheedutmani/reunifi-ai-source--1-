'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FolderSearch, Plus, Clock, CheckCircle2, XCircle, Search, User, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app-store'
import { useToast } from '@/hooks/use-toast'

interface CaseItem {
  id: string
  caseNumber: string
  title: string
  status: string
  priority: string
  notes: string
  assignedTo: string | null
  missingChildId: string | null
  matchResultId: string | null
  createdAt: string
  updatedAt: string
  assignedOfficer?: { id: string; name: string } | null
  missingChild?: { id: string; fullName: string; caseNumber: string } | null
  matchResult?: { id: string; similarityScore: number } | null
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  open: { label: 'Open', className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300', icon: Clock },
  investigating: { label: 'Investigating', className: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300', icon: Search },
  matched: { label: 'Matched', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300', icon: CheckCircle2 },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400', icon: XCircle },
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300' },
  high: { label: 'High', className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300' },
  normal: { label: 'Normal', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400' },
}

export function CaseTrackerView() {
  const navigateTo = useAppStore((s) => s.navigateTo)
  const { toast } = useToast()
  const [cases, setCases] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [newStatus, setNewStatus] = useState('')

  const fetchCases = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (activeTab !== 'all') params.set('status', activeTab)
      const res = await fetch(`/api/cases?${params}`)
      if (res.ok) {
        const json = await res.json()
        setCases(json.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch cases:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { fetchCases() }, [fetchCases])

  const viewCase = (c: CaseItem) => {
    setSelectedCase(c)
    setNewStatus(c.status)
    setDetailOpen(true)
  }

  const updateCase = async () => {
    if (!selectedCase) return
    try {
      const body: any = {}
      if (newStatus !== selectedCase.status) body.status = newStatus
      if (newNote.trim()) body.notes = newNote.trim()

      const res = await fetch(`/api/cases?id=${selectedCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast({ title: 'Case Updated', description: 'Changes saved successfully' })
        setDetailOpen(false)
        fetchCases()
      } else {
        throw new Error('Update failed')
      }
    } catch {
      toast({ title: 'Update Failed', description: 'Could not update the case', variant: 'destructive' })
    }
  }

  const getNotes = (notesStr: string): { text: string; date: string }[] => {
    try { return JSON.parse(notesStr || '[]') } catch { return [] }
  }

  const stats = {
    total: cases.length,
    open: cases.filter(c => c.status === 'open').length,
    investigating: cases.filter(c => c.status === 'investigating').length,
    matched: cases.filter(c => c.status === 'matched').length,
    closed: cases.filter(c => c.status === 'closed').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/30">
            <FolderSearch className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">Case Investigation Tracker</h1>
            <p className="text-sm text-muted-foreground">Manage and track investigation cases</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open', count: stats.open, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Investigating', count: stats.investigating, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20' },
          { label: 'Matched', count: stats.matched, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Closed', count: stats.closed, color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>
                <span className="text-lg font-bold">{s.count}</span>
              </div>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="investigating">Investigating</TabsTrigger>
          <TabsTrigger value="matched">Matched</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        {['all', 'open', 'investigating', 'matched', 'closed'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : cases.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FolderSearch className="h-12 w-12 mx-auto text-muted-foreground/40" />
                  <h3 className="mt-4 text-lg font-semibold text-muted-foreground">No Cases Found</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {cases.map((c, idx) => {
                  const sCfg = statusConfig[c.status] || statusConfig.open
                  const pCfg = priorityConfig[c.priority] || priorityConfig.normal
                  const SIcon = sCfg.icon
                  const notes = getNotes(c.notes)
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => viewCase(c)}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 min-w-0">
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                c.status === 'matched' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                c.status === 'investigating' ? 'bg-teal-100 dark:bg-teal-900/30' :
                                c.status === 'open' ? 'bg-amber-100 dark:bg-amber-900/30' :
                                'bg-gray-100 dark:bg-gray-800/40'
                              }`}>
                                <SIcon className={`h-5 w-5 ${sCfg.className.split(' ')[0]}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">{c.title}</span>
                                  <Badge variant="outline" className={pCfg.className}>{pCfg.label}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{c.caseNumber}</p>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-muted-foreground">
                                  <span>Created: {new Date(c.createdAt).toLocaleDateString()}</span>
                                  {c.assignedOfficer && <span>Officer: {c.assignedOfficer.name}</span>}
                                  {notes.length > 0 && <span>{notes.length} notes</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className={sCfg.className}>{sCfg.label}</Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Case Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCase?.title}</DialogTitle>
            <DialogDescription>{selectedCase?.caseNumber}</DialogDescription>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="matched">Matched</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Priority</p>
                  <Badge variant="outline" className={(priorityConfig[selectedCase.priority] || priorityConfig.normal).className}>
                    {(priorityConfig[selectedCase.priority] || priorityConfig.normal).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Created</p>
                  <p className="font-medium">{new Date(selectedCase.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Assigned To</p>
                  <p className="font-medium">{selectedCase.assignedOfficer?.name || 'Unassigned'}</p>
                </div>
              </div>

              {selectedCase.missingChild && (
                <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 text-sm">
                  <p className="text-muted-foreground text-xs">Related Missing Child</p>
                  <p className="font-medium">{selectedCase.missingChild.fullName} ({selectedCase.missingChild.caseNumber})</p>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-sm font-medium mb-3">Timeline</p>
                <div className="space-y-3">
                  {getNotes(selectedCase.notes).map((note, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        {i < getNotes(selectedCase.notes).length - 1 && <div className="w-0.5 flex-1 bg-emerald-200 dark:bg-emerald-800 mt-1" />}
                      </div>
                      <div className="flex-1 pb-3">
                        <p className="text-sm">{note.text}</p>
                        <p className="text-[10px] text-muted-foreground">{note.date ? new Date(note.date).toLocaleString() : ''}</p>
                      </div>
                    </div>
                  ))}
                  {getNotes(selectedCase.notes).length === 0 && (
                    <p className="text-xs text-muted-foreground">No timeline entries yet</p>
                  )}
                </div>
              </div>

              {/* Add Note */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Add Note</p>
                <Textarea
                  placeholder="Add investigation note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-2 flex-col sm:flex-row">
                <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => setDetailOpen(false)}>Cancel</Button>
                <Button className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={updateCase}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
