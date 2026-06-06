'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Shield,
  Bell,
  Brain,
  Save,
  Globe,
  Lock,
  Cpu,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/store/app-store'
import { useToast } from '@/hooks/use-toast'

// ─── View ────────────────────────────────────────────────────────────
export function SettingsView() {
  const { currentUser } = useAppStore()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  // General Settings
  const [platformName, setPlatformName] = useState('Reunifi AI')
  const [supportEmail, setSupportEmail] = useState('support@reunifi.ai')
  const [timezone, setTimezone] = useState('UTC+0')

  // Security Settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState('30')
  const [ipWhitelist, setIpWhitelist] = useState(false)

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(true)
  const [matchAlerts, setMatchAlerts] = useState(true)
  const [caseUpdates, setCaseUpdates] = useState(true)
  const [systemAlerts, setSystemAlerts] = useState(false)

  // AI Settings
  const [autoMatching, setAutoMatching] = useState(true)
  const [matchThreshold, setMatchThreshold] = useState('70')
  const [maxDailyScans, setMaxDailyScans] = useState('500')
  const [modelVersion, setModelVersion] = useState('v2.1')

  // Admin-only guard
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

  const handleSave = async () => {
    setSaving(true)
    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSaving(false)
    toast({
      title: 'Settings Saved',
      description: 'All system settings have been updated successfully.',
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <Settings className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground">System Settings</h1>
            <p className="text-sm text-muted-foreground">Configure platform preferences and security</p>
          </div>
        </div>
      </motion.div>

      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-base">General Settings</CardTitle>
            </div>
            <CardDescription>Platform name, contact information, and regional settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input
                  id="platform-name"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <CardTitle className="text-base">Security Settings</CardTitle>
            </div>
            <CardDescription>Authentication, session management, and access control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-xs text-muted-foreground">Require 2FA for all admin accounts</p>
              </div>
              <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
              </div>
              <Input
                id="session-timeout"
                type="number"
                className="w-24"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>IP Whitelist</Label>
                <p className="text-xs text-muted-foreground">Restrict access to approved IP addresses</p>
              </div>
              <Switch checked={ipWhitelist} onCheckedChange={setIpWhitelist} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <CardTitle className="text-base">Notification Settings</CardTitle>
            </div>
            <CardDescription>Control how and when alerts are sent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Send alerts via email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-xs text-muted-foreground">Send SMS alerts for emergency cases</p>
              </div>
              <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Match Alerts</Label>
                <p className="text-xs text-muted-foreground">Notify when AI finds a potential match</p>
              </div>
              <Switch checked={matchAlerts} onCheckedChange={setMatchAlerts} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Case Updates</Label>
                <p className="text-xs text-muted-foreground">Notify on case status changes</p>
              </div>
              <Switch checked={caseUpdates} onCheckedChange={setCaseUpdates} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>System Alerts</Label>
                <p className="text-xs text-muted-foreground">Server errors and maintenance notifications</p>
              </div>
              <Switch checked={systemAlerts} onCheckedChange={setSystemAlerts} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-base">AI Settings</CardTitle>
            </div>
            <CardDescription>Fine-tune the facial recognition and matching engine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Matching</Label>
                <p className="text-xs text-muted-foreground">Automatically run AI matching on new reports</p>
              </div>
              <Switch checked={autoMatching} onCheckedChange={setAutoMatching} />
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="match-threshold">Match Threshold (%)</Label>
                <Input
                  id="match-threshold"
                  type="number"
                  value={matchThreshold}
                  onChange={(e) => setMatchThreshold(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-scans">Max Daily Scans</Label>
                <Input
                  id="max-scans"
                  type="number"
                  value={maxDailyScans}
                  onChange={(e) => setMaxDailyScans(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model-version">Model Version</Label>
                <Input
                  id="model-version"
                  value={modelVersion}
                  onChange={(e) => setModelVersion(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="flex justify-stretch sm:justify-end"
      >
        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-w-[140px] min-h-[44px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
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
      </motion.div>
    </div>
  )
}
