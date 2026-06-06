'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  UserCircle,
  Mail,
  Phone,
  Building2,
  Shield,
  Camera,
  Save,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/app-store'
import { useToast } from '@/hooks/use-toast'
import { getRoleInfo } from '@/lib/rbac'

export function ProfileView() {
  const { currentUser } = useAppStore()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  // Profile form state
  const [name, setName] = useState(currentUser?.name || '')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [phone, setPhone] = useState(currentUser?.phone || '')
  const [organization, setOrganization] = useState(currentUser?.organization || '')

  const roleInfo = getRoleInfo(currentUser?.role || 'parent')
  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  const handleSave = async () => {
    setSaving(true)
    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
    toast({
      title: 'Profile Updated',
      description: 'Your profile information has been saved.',
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <UserCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your personal information</p>
          </div>
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="glass-profile glass-card-shimmer glass-card-glow-emerald border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Profile Information</CardTitle>
            <CardDescription>Update your personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-emerald-200 dark:border-emerald-800">
                  <AvatarFallback className={`text-xl font-bold ${roleInfo.bgColor} ${roleInfo.color}`}>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background"
                >
                  <Camera className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{currentUser?.name || 'User'}</h3>
                <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                <Badge variant="outline" className={`mt-1 ${roleInfo.bgColor} ${roleInfo.color} border-current/20`}>
                  {roleInfo.label}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="flex items-center gap-2">
                  <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email" className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone" className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="profile-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-org" className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Organization
                </Label>
                <Input
                  id="profile-org"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Your organization"
                />
              </div>
            </div>

            <div className="flex justify-stretch sm:justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="min-w-[120px] min-h-[44px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="glass-profile glass-card-glow-rose border-0 rounded-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <CardTitle className="text-base">Security</CardTitle>
            </div>
            <CardDescription>Manage your account security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border gap-3">
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
              </div>
              <Button variant="outline" size="sm" className="min-h-[44px]">
                Change Password
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border gap-3">
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm" className="min-h-[44px]">
                Enable 2FA
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border gap-3">
              <div>
                <p className="text-sm font-medium">Active Sessions</p>
                <p className="text-xs text-muted-foreground">1 active session on this device</p>
              </div>
              <Button variant="outline" size="sm" className="min-h-[44px] text-destructive hover:text-destructive">
                Sign Out Other Devices
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
