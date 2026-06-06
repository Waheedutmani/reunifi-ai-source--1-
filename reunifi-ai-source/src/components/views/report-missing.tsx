'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Loader2,
  Upload,
  AlertTriangle,
  UserX,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { EnhancedImageUpload, type PhotoFile } from '@/components/ui/enhanced-upload'

export function ReportMissingView() {
  const currentUser = useAppStore((s) => s.currentUser)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const { toast } = useToast()

  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [lastSeenLocation, setLastSeenLocation] = useState('')
  const [dateMissing, setDateMissing] = useState('')
  const [lastSeenDate, setLastSeenDate] = useState('')
  const [parentGuardianName, setParentGuardianName] = useState('')
  const [parentGuardianPhone, setParentGuardianPhone] = useState('')
  const [parentGuardianEmail, setParentGuardianEmail] = useState('')
  const [clothingDescription, setClothingDescription] = useState('')
  const [medicalConditions, setMedicalConditions] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [priority, setPriority] = useState('normal')
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName || !age || !gender || !lastSeenLocation || !dateMissing || !parentGuardianName || !parentGuardianPhone) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    if (!currentUser?.id) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to submit a report',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/missing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          age: parseInt(age),
          gender,
          lastSeenLocation,
          dateMissing,
          lastSeenDate: lastSeenDate || dateMissing,
          parentGuardianName,
          parentGuardianPhone,
          parentGuardianEmail: parentGuardianEmail || undefined,
          clothingDescription: clothingDescription || undefined,
          medicalConditions: medicalConditions || undefined,
          emergencyContact: emergencyContact || undefined,
          priority,
          photos: photos.map((p) => p.dataUrl),
          reportedBy: currentUser.id,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit report')
      }

      toast({
        title: 'Report Submitted',
        description: `Missing child report for ${fullName} has been filed successfully`,
      })
      navigateTo('missing-list')
    } catch (err) {
      toast({
        title: 'Submission Failed',
        description:
          err instanceof Error ? err.message : 'Failed to submit report',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30">
              <UserX className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">
                Report Missing Child
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Fill in the details to file a missing child report. Fields
                marked with * are required.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Child Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Child Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Enter child's full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">
                    Age <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    max="18"
                    placeholder="Enter age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    disabled={loading}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Gender <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="border-emerald-200 focus:border-emerald-500 dark:border-emerald-800">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastSeenLocation">
                    Last Seen Location{' '}
                    <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="lastSeenLocation"
                    placeholder="e.g., Central Park, New York"
                    value={lastSeenLocation}
                    onChange={(e) => setLastSeenLocation(e.target.value)}
                    disabled={loading}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateMissing">
                    Date Missing <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="dateMissing"
                    type="date"
                    value={dateMissing}
                    onChange={(e) => setDateMissing(e.target.value)}
                    disabled={loading}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastSeenDate">Last Seen Date</Label>
                  <Input
                    id="lastSeenDate"
                    type="date"
                    value={lastSeenDate}
                    onChange={(e) => setLastSeenDate(e.target.value)}
                    disabled={loading}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800"
                  />
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Parent / Guardian Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parentGuardianName">
                    Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="parentGuardianName"
                    placeholder="Enter parent/guardian name"
                    value={parentGuardianName}
                    onChange={(e) => setParentGuardianName(e.target.value)}
                    disabled={loading}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentGuardianPhone">
                    Phone <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="parentGuardianPhone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={parentGuardianPhone}
                    onChange={(e) => setParentGuardianPhone(e.target.value)}
                    disabled={loading}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentGuardianEmail">Email</Label>
                  <Input
                    id="parentGuardianEmail"
                    type="email"
                    placeholder="guardian@example.com"
                    value={parentGuardianEmail}
                    onChange={(e) => setParentGuardianEmail(e.target.value)}
                    disabled={loading}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    placeholder="Emergency contact number"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    disabled={loading}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Additional Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="clothingDescription">
                    Clothing Description
                  </Label>
                  <Textarea
                    id="clothingDescription"
                    placeholder="Describe what the child was last seen wearing..."
                    value={clothingDescription}
                    onChange={(e) => setClothingDescription(e.target.value)}
                    disabled={loading}
                    rows={3}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800 resize-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="medicalConditions">
                    Medical Conditions
                  </Label>
                  <Textarea
                    id="medicalConditions"
                    placeholder="Any known medical conditions or special needs..."
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    disabled={loading}
                    rows={3}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="border-emerald-200 focus:border-emerald-500 dark:border-emerald-800">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  {priority === 'critical' && (
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Critical priority will trigger immediate alerts</span>
                    </div>
                  )}
                  {priority === 'high' && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>High priority reports are escalated to field teams</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Upload - Enhanced */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Photos
              </h3>
              <EnhancedImageUpload
                photos={photos}
                onPhotosChange={setPhotos}
                maxPhotos={5}
                maxFileSize={5 * 1024 * 1024}
                disabled={loading}
                accentColor="emerald"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge
                  variant="outline"
                  className="text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
                >
                  {priority === 'critical'
                    ? 'Critical Priority'
                    : priority === 'high'
                      ? 'High Priority'
                      : 'Normal Priority'}
                </Badge>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigateTo('dashboard')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md btn-3d-glow-emerald btn-3d-shimmer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
