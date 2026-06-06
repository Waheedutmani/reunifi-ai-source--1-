'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  Shield,
  UserPlus,
  Ban,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  MoreVertical,
  Pencil,
  Trash2,
  KeyRound,
  UserCog,
  X,
  Upload,
  Camera,
  RefreshCw,
  ChevronDown,
  UserCheck,
  UserX,
  ShieldCheck,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAppStore } from '@/store/app-store'
import { useToast } from '@/hooks/use-toast'

// ─── Types ───────────────────────────────────────────────────────────
interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  phone?: string | null
  avatar?: string | null
  organization?: string | null
  verified: boolean
  active: boolean
  lastLogin?: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    missingReports: number
    foundReports: number
    assignedCases: number
  }
}

interface UserStats {
  total: number
  totalActive: number
  totalInactive: number
  roleCounts: Array<{ role: string; count: number }>
  recentRegistrations: number
}

interface AddUserForm {
  name: string
  email: string
  password: string
  phone: string
  role: string
  avatar: string
  active: boolean
}

// ─── Role Badge Config ───────────────────────────────────────────────
const roleConfig: Record<string, { label: string; className: string; icon: typeof Users }> = {
  admin: { label: 'Admin', className: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800', icon: Shield },
  police: { label: 'Police', className: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800', icon: ShieldCheck },
  ngo: { label: 'NGO', className: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800', icon: UserCheck },
  rescue: { label: 'Rescue', className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800', icon: UserCheck },
  parent: { label: 'Parent', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800', icon: Users },
}

// ─── Safe Fetch ──────────────────────────────────────────────────────
async function safeFetch(url: string, options?: RequestInit, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timeoutId)
  }
}

async function safeJsonParse<T = Record<string, unknown>>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('Server returned non-JSON response. Please try again.')
  }
  return res.json() as Promise<T>
}

// ─── Format Date Helper ──────────────────────────────────────────────
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return 'Unknown'
  }
}

function formatTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never'
  try {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateStr)
  } catch {
    return 'Unknown'
  }
}

// ─── Initial Form State ──────────────────────────────────────────────
const INITIAL_FORM: AddUserForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'parent',
  avatar: '',
  active: true,
}

// ─── View ────────────────────────────────────────────────────────────
export function UsersView() {
  const { currentUser } = useAppStore()
  const { toast } = useToast()

  // Data states
  const [users, setUsers] = useState<UserRecord[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)

  // Form states
  const [form, setForm] = useState<AddUserForm>(INITIAL_FORM)
  const [editForm, setEditForm] = useState<Partial<UserRecord>>({})
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ─── Fetch Users ─────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await safeFetch(`/api/admin/users?${params.toString()}`)
      if (res.ok) {
        const data = await safeJsonParse(res)
        setUsers(data.data || [])
        setStats({
          total: data.total || 0,
          totalActive: data.totalActive || 0,
          totalInactive: data.totalInactive || 0,
          roleCounts: data.roleCounts || [],
          recentRegistrations: data.recentRegistrations || 0,
        })
      } else {
        // Use fallback mock data
        setUsers([
          { id: '1', name: 'Admin User', email: 'admin@reunifi.ai', role: 'admin', verified: true, active: true, lastLogin: new Date().toISOString(), createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', _count: { missingReports: 0, foundReports: 0, assignedCases: 5 } },
          { id: '2', name: 'Officer Mensah', email: 'police@reunifi.ai', role: 'police', verified: true, active: true, lastLogin: new Date(Date.now() - 3600000).toISOString(), createdAt: '2024-01-05T00:00:00Z', updatedAt: '2024-01-05T00:00:00Z', _count: { missingReports: 12, foundReports: 0, assignedCases: 8 } },
          { id: '3', name: 'NGO Worker Amina', email: 'ngo@reunifi.ai', role: 'ngo', verified: true, active: true, lastLogin: new Date(Date.now() - 86400000).toISOString(), createdAt: '2024-01-10T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z', _count: { missingReports: 5, foundReports: 3, assignedCases: 0 } },
          { id: '4', name: 'Rescue Kofi', email: 'rescue@reunifi.ai', role: 'rescue', verified: false, active: true, lastLogin: null, createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z', _count: { missingReports: 0, foundReports: 7, assignedCases: 0 } },
          { id: '5', name: 'Parent Adwoa', email: 'parent@reunifi.ai', role: 'parent', verified: true, active: false, lastLogin: new Date(Date.now() - 604800000).toISOString(), createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z', _count: { missingReports: 1, foundReports: 0, assignedCases: 0 } },
        ])
        setStats({ total: 5, totalActive: 4, totalInactive: 1, roleCounts: [{ role: 'admin', count: 1 }, { role: 'police', count: 1 }, { role: 'ngo', count: 1 }, { role: 'rescue', count: 1 }, { role: 'parent', count: 1 }], recentRegistrations: 2 })
      }
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, roleFilter, statusFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Safety: force loading to finish after 8 seconds to prevent infinite spinners
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (loading) setLoading(false)
    }, 8000)
    return () => clearTimeout(safetyTimer)
  }, [loading])

  // ─── Add User ────────────────────────────────────────────────────
  const handleAddUser = async () => {
    if (!form.name || !form.email || !form.password || !form.role) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const res = await safeFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, adminUserId: currentUser?.id }),
      })

      const data = await safeJsonParse(res)
      if (res.ok) {
        toast({ title: 'User Created', description: `${form.name} has been added as ${roleConfig[form.role]?.label || form.role}` })
        setForm(INITIAL_FORM)
        setAddDialogOpen(false)
        fetchUsers()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to create user', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Edit User ───────────────────────────────────────────────────
  const handleEditUser = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const res = await safeFetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          role: editForm.role,
          active: editForm.active,
          verified: editForm.verified,
          adminUserId: currentUser?.id,
        }),
      })

      const data = await safeJsonParse(res)
      if (res.ok) {
        toast({ title: 'User Updated', description: `${editForm.name || selectedUser.name} has been updated` })
        setEditDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to update user', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Delete User ─────────────────────────────────────────────────
  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const res = await safeFetch(`/api/admin/users?id=${selectedUser.id}&adminUserId=${currentUser?.id}`, {
        method: 'DELETE',
      })

      const data = await safeJsonParse(res)
      if (res.ok) {
        toast({ title: 'User Deleted', description: `${selectedUser.name} has been removed from the system` })
        setDeleteDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to delete user', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Reset Password ─────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await safeFetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, newPassword, adminUserId: currentUser?.id }),
      })

      const data = await safeJsonParse(res)
      if (res.ok) {
        toast({ title: 'Password Reset', description: `Password has been reset for ${selectedUser.name}` })
        setResetPasswordDialogOpen(false)
        setSelectedUser(null)
        setNewPassword('')
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to reset password', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Toggle Active ──────────────────────────────────────────────
  const handleToggleActive = async (user: UserRecord) => {
    try {
      const res = await safeFetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, active: !user.active, adminUserId: currentUser?.id }),
      })
      if (res.ok) {
        toast({ title: 'Status Updated', description: `${user.name} has been ${!user.active ? 'activated' : 'deactivated'}` })
        fetchUsers()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    }
  }

  // ─── Admin-only guard ────────────────────────────────────────────
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

  // ─── Get user initials ───────────────────────────────────────────
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30">
              <Users className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">User Management</h1>
              <p className="text-sm text-muted-foreground">Manage platform users, roles, and access</p>
            </div>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white gap-2">
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-cyan-500" />
                  Add New User
                </DialogTitle>
                <DialogDescription>Create a new user account. All fields marked with * are required.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Profile Image Upload */}
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground/30">
                      <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-lg">
                        {form.name ? getInitials(form.name) : <Camera className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Profile Image</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        placeholder="Image URL (optional)"
                        value={form.avatar}
                        onChange={(e) => setForm(p => ({ ...p, avatar: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Full Name *</Label>
                    <Input
                      placeholder="John Doe"
                      value={form.name}
                      onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email *</Label>
                    <Input
                      type="email"
                      placeholder="john@reunifi.ai"
                      value={form.email}
                      onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Password & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Password *</Label>
                    <Input
                      type="password"
                      placeholder="Min 6 characters"
                      value={form.password}
                      onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone Number</Label>
                    <Input
                      type="tel"
                      placeholder="+233 000 000 000"
                      value={form.phone}
                      onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Role & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Role *</Label>
                    <Select value={form.role} onValueChange={(role) => setForm(p => ({ ...p, role }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="police">Police Officer</SelectItem>
                        <SelectItem value="ngo">NGO Staff</SelectItem>
                        <SelectItem value="rescue">Rescue Worker</SelectItem>
                        <SelectItem value="parent">Parent / Guardian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Account Status</Label>
                    <div className="flex items-center gap-3 pt-2">
                      <Switch
                        checked={form.active}
                        onCheckedChange={(active) => setForm(p => ({ ...p, active }))}
                      />
                      <span className="text-sm">{form.active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => { setForm(INITIAL_FORM); setAddDialogOpen(false) }}>
                  Reset Form
                </Button>
                <Button
                  onClick={handleAddUser}
                  disabled={submitting}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                >
                  {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* ─── Stats Cards ─────────────────────────────────────────── */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
        >
          <Card className="glass-card border-0 rounded-xl">
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto text-cyan-500 mb-1" />
              <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-0 rounded-xl">
            <CardContent className="p-4 text-center">
              <UserCheck className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalActive}</p>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-0 rounded-xl">
            <CardContent className="p-4 text-center">
              <UserX className="h-5 w-5 mx-auto text-gray-500 mb-1" />
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.totalInactive}</p>
              <p className="text-xs text-muted-foreground">Disabled Users</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-0 rounded-xl">
            <CardContent className="p-4 text-center">
              <ShieldCheck className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.roleCounts.length}</p>
              <p className="text-xs text-muted-foreground">Total Roles</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-0 rounded-xl col-span-2 sm:col-span-1">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto text-rose-500 mb-1" />
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.recentRegistrations}</p>
              <p className="text-xs text-muted-foreground">New (7 days)</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Search & Filter Bar ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="police">Police</SelectItem>
            <SelectItem value="ngo">NGO</SelectItem>
            <SelectItem value="rescue">Rescue</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchUsers} className="shrink-0">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </motion.div>

      {/* ─── Users Table ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="glass-card border-0 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Platform Users</CardTitle>
                <CardDescription>{users.length} user{users.length !== 1 ? 's' : ''} found</CardDescription>
              </div>
              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800">
                Admin Only
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40 hidden md:block" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No users found matching your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, idx) => {
                      const rcfg = roleConfig[user.role] || roleConfig.parent
                      const RoleIcon = rcfg.icon
                      return (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="hover:bg-muted/50 transition-colors group"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-border">
                                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                                <AvatarFallback className="text-xs bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{user.name}</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground md:hidden">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate">{user.email}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${rcfg.className} gap-1`}>
                              <RoleIcon className="h-3 w-3" />
                              {rcfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <button onClick={() => handleToggleActive(user)} className="focus:outline-none">
                              <Badge
                                variant="outline"
                                className={`cursor-pointer transition-colors ${
                                  user.active
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-900/60'
                                    : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700/60'
                                }`}
                              >
                                {user.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </button>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(user.lastLogin)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setEditForm({
                                      name: user.name,
                                      email: user.email,
                                      phone: user.phone,
                                      role: user.role,
                                      active: user.active,
                                      verified: user.verified,
                                    })
                                    setEditDialogOpen(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setNewPassword('')
                                    setResetPasswordDialogOpen(true)
                                  }}
                                >
                                  <KeyRound className="h-4 w-4 mr-2" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Edit User Dialog ────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-cyan-500" />
              Edit User
            </DialogTitle>
            <DialogDescription>Update user information and role assignment</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input value={editForm.name || ''} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={editForm.email || ''} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input value={editForm.phone || ''} onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Role</Label>
                  <Select value={editForm.role} onValueChange={(role) => setEditForm(p => ({ ...p, role }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="police">Police Officer</SelectItem>
                      <SelectItem value="ngo">NGO Staff</SelectItem>
                      <SelectItem value="rescue">Rescue Worker</SelectItem>
                      <SelectItem value="parent">Parent / Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <Switch checked={editForm.active ?? true} onCheckedChange={(active) => setEditForm(p => ({ ...p, active }))} />
                  <span className="text-sm">{editForm.active ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={editForm.verified ?? false} onCheckedChange={(verified) => setEditForm(p => ({ ...p, verified }))} />
                  <span className="text-sm">Verified</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedUser(null) }}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={submitting} className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white">
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete User Dialog ──────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>This action cannot be undone. All associated data will be removed.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email} • {roleConfig[selectedUser.role]?.label}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSelectedUser(null) }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={submitting}>
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Reset Password Dialog ───────────────────────────────── */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-500" />
              Reset Password
            </DialogTitle>
            <DialogDescription>Set a new password for this user. They will be notified.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">New Password *</Label>
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setResetPasswordDialogOpen(false); setSelectedUser(null); setNewPassword('') }}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-white">
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <KeyRound className="h-4 w-4 mr-1" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
