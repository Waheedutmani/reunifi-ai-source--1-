'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Loader2,
  Upload,
  Heart,
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

export function RegisterFoundView() {
  const currentUser = useAppStore((s) => s.currentUser)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const { toast } = useToast()

  const [estimatedName, setEstimatedName] = useState('')
  const [estimatedAge, setEstimatedAge] = useState('')
  const [gender, setGender] = useState('')
  const [foundLocation, setFoundLocation] = useState('')
  const [foundDate, setFoundDate] = useState('')
  const [healthStatus, setHealthStatus] = useState('stable')
  const [rescueDetails, setRescueDetails] = useState('')
  const [shelterInfo, setShelterInfo] = useState('')
  const [identificationMarks, setIdentificationMarks] = useState('')
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!estimatedAge || !gender || !foundLocation || !foundDate) {
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
        description: 'You must be logged in to register a found child',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimatedName: estimatedName || undefined,
          estimatedAge: parseInt(estimatedAge),
          gender,
          foundLocation,
          foundDate,
          healthStatus,
          rescueDetails: rescueDetails || undefined,
          shelterInfo: shelterInfo || undefined,
          identificationMarks: identificationMarks || undefined,
          photos: photos.map((p) => p.dataUrl),
          registeredBy: currentUser.id,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to register found child')
      }

      toast({
        title: 'Registration Successful',
        description: estimatedName
          ? `${estimatedName}'s record has been created`
          : 'Found child record has been created',
      })
      navigateTo('found-list')
    } catch (err) {
      toast({
        title: 'Registration Failed',
        description:
          err instanceof Error ? err.message : 'Failed to register found child',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const healthStatusColors: Record<string, string> = {
    stable: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700',
    critical: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-300 dark:border-rose-700',
    injured: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700',
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Heart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl text-foreground">
                Register Found Child
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Record details of a found child to help with identification and
                reunification. Fields marked with * are required.
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
                  <Label htmlFor="estimatedName">Estimated Name</Label>
                  <Input
                    id="estimatedName"
                    placeholder="If known, enter child's name"
                    value={estimatedName}
                    onChange={(e) => setEstimatedName(e.target.value)}
                    disabled={loading}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedAge">
                    Estimated Age <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="estimatedAge"
                    type="number"
                    min="0"
                    max="18"
                    placeholder="Enter estimated age"
                    value={estimatedAge}
                    onChange={(e) => setEstimatedAge(e.target.value)}
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
                  <Label htmlFor="foundLocation">
                    Found Location <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="foundLocation"
                    placeholder="e.g., Near railway station, Sector 5"
                    value={foundLocation}
                    onChange={(e) => setFoundLocation(e.target.value)}
                    disabled={loading}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="foundDate">
                    Found Date <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="foundDate"
                    type="date"
                    value={foundDate}
                    onChange={(e) => setFoundDate(e.target.value)}
                    disabled={loading}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="healthStatus">Health Status</Label>
                  <Select value={healthStatus} onValueChange={setHealthStatus}>
                    <SelectTrigger className="border-emerald-200 focus:border-emerald-500 dark:border-emerald-800">
                      <SelectValue placeholder="Select health status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stable">Stable</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="injured">Injured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Rescue & Identification Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Rescue & Identification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="rescueDetails">Rescue Details</Label>
                  <Textarea
                    id="rescueDetails"
                    placeholder="Describe how and where the child was found..."
                    value={rescueDetails}
                    onChange={(e) => setRescueDetails(e.target.value)}
                    disabled={loading}
                    rows={3}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shelterInfo">Shelter Information</Label>
                  <Input
                    id="shelterInfo"
                    placeholder="Current shelter or care facility"
                    value={shelterInfo}
                    onChange={(e) => setShelterInfo(e.target.value)}
                    disabled={loading}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="identificationMarks">
                    Identification Marks
                  </Label>
                  <Textarea
                    id="identificationMarks"
                    placeholder="Scars, birthmarks, tattoos, or other distinguishing features..."
                    value={identificationMarks}
                    onChange={(e) => setIdentificationMarks(e.target.value)}
                    disabled={loading}
                    rows={3}
                    className="border-emerald-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-emerald-800 resize-none"
                  />
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge
                  variant="outline"
                  className={healthStatusColors[healthStatus] || ''}
                >
                  {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
                </Badge>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigateTo('dashboard')}
                  disabled={loading}
                  className="min-h-[44px] flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-h-[44px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md btn-3d-glow-emerald btn-3d-shimmer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Register Child
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
