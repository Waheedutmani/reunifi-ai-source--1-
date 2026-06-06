'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ImagePlus,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ZoomIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

interface PhotoFile {
  dataUrl: string
  name: string
  size: number
  width: number
  height: number
  quality: 'high' | 'medium' | 'low'
  uploadProgress: number
}

interface EnhancedImageUploadProps {
  photos: PhotoFile[]
  onPhotosChange: (photos: PhotoFile[]) => void
  maxPhotos?: number
  maxFileSize?: number
  disabled?: boolean
  accentColor?: string
  darkAccentColor?: string
}

const MIN_DIMENSION = 200
const LOW_QUALITY_DIMENSION = 400

export function checkImageQuality(
  width: number,
  height: number,
  fileSize: number
): 'high' | 'medium' | 'low' {
  const pixels = width * height
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) return 'low'
  if (width < LOW_QUALITY_DIMENSION || height < LOW_QUALITY_DIMENSION) return 'medium'
  if (pixels < 500000 && fileSize < 100000) return 'medium'
  return 'high'
}

export type { PhotoFile }

export function EnhancedImageUpload({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  maxFileSize = 5 * 1024 * 1024,
  disabled = false,
  accentColor = 'emerald',
  darkAccentColor = 'emerald',
}: EnhancedImageUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [processingFiles, setProcessingFiles] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const remaining = maxPhotos - photos.length

      if (remaining <= 0) {
        toast({
          title: 'Limit Reached',
          description: `You can upload a maximum of ${maxPhotos} photos`,
          variant: 'destructive',
        })
        return
      }

      setProcessingFiles(true)
      const toProcess = fileArray.slice(0, remaining)
      const newPhotos: PhotoFile[] = []

      for (let i = 0; i < toProcess.length; i++) {
        const file = toProcess[i]

        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid File',
            description: `"${file.name}" is not an image file`,
            variant: 'destructive',
          })
          continue
        }

        if (file.size > maxFileSize) {
          toast({
            title: 'File Too Large',
            description: `"${file.name}" exceeds the ${Math.round(maxFileSize / 1024 / 1024)}MB limit`,
            variant: 'destructive',
          })
          continue
        }

        // Read image and get dimensions
        const imageInfo = await new Promise<{ dataUrl: string; width: number; height: number }>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            const img = new Image()
            img.onload = () => {
              resolve({
                dataUrl: reader.result as string,
                width: img.naturalWidth,
                height: img.naturalHeight,
              })
            }
            img.onerror = () => {
              resolve({
                dataUrl: reader.result as string,
                width: 0,
                height: 0,
              })
            }
            img.src = reader.result as string
          }
          reader.readAsDataURL(file)
        })

        const quality = checkImageQuality(imageInfo.width, imageInfo.height, file.size)

        if (quality === 'low') {
          toast({
            title: 'Low Quality Image',
            description: `"${file.name}" (${imageInfo.width}×${imageInfo.height}) is very low quality. AI matching works best with higher resolution photos.`,
            variant: 'destructive',
          })
        } else if (quality === 'medium') {
          toast({
            title: 'Image Quality Warning',
            description: `"${file.name}" has medium quality. For better AI matching results, use photos with at least ${LOW_QUALITY_DIMENSION}px resolution.`,
          })
        }

        // Simulate upload progress animation
        const photoFile: PhotoFile = {
          dataUrl: imageInfo.dataUrl,
          name: file.name,
          size: file.size,
          width: imageInfo.width,
          height: imageInfo.height,
          quality,
          uploadProgress: 0,
        }

        newPhotos.push(photoFile)
      }

      // Animate progress for each photo
      const allPhotos = [...photos, ...newPhotos]
      onPhotosChange(allPhotos)

      // Simulate upload progress
      for (let step = 0; step <= 100; step += 10) {
        await new Promise((resolve) => setTimeout(resolve, 50))
        const updatedPhotos = allPhotos.map((p, idx) => {
          const newPhotoStartIndex = allPhotos.length - newPhotos.length
          if (idx >= newPhotoStartIndex) {
            const photoIdx = idx - newPhotoStartIndex
            const targetProgress = Math.min(step + photoIdx * 5, 100)
            return { ...p, uploadProgress: targetProgress }
          }
          return { ...p, uploadProgress: 100 }
        })
        onPhotosChange(updatedPhotos)
      }

      // Final progress to 100%
      onPhotosChange(allPhotos.map((p) => ({ ...p, uploadProgress: 100 })))

      setProcessingFiles(false)
    },
    [photos, maxPhotos, maxFileSize, toast, onPhotosChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      if (!disabled) processFiles(e.dataTransfer.files)
    },
    [processFiles, disabled]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index))
  }

  const qualityBadge = (quality: 'high' | 'medium' | 'low') => {
    const config = {
      high: { icon: CheckCircle2, label: 'HD', className: 'bg-emerald-500/20 text-emerald-400' },
      medium: { icon: AlertTriangle, label: 'MD', className: 'bg-amber-500/20 text-amber-400' },
      low: { icon: AlertTriangle, label: 'SD', className: 'bg-rose-500/20 text-rose-400' },
    }
    const cfg = config[quality]
    const Icon = cfg.icon
    return (
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${cfg.className}`}>
        <Icon className="h-2.5 w-2.5" />
        {cfg.label}
      </span>
    )
  }

  const colorClasses: Record<string, { border: string; bg: string; hoverBg: string; text: string; dragBorder: string; dragBg: string }> = {
    emerald: {
      border: 'border-emerald-300 dark:border-emerald-700',
      bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      hoverBg: 'hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
      text: 'text-emerald-400 dark:text-emerald-500',
      dragBorder: 'border-emerald-500 dark:border-emerald-400',
      dragBg: 'bg-emerald-100/50 dark:bg-emerald-900/30',
    },
    cyan: {
      border: 'border-cyan-300 dark:border-cyan-700',
      bg: 'bg-cyan-50/50 dark:bg-cyan-950/20',
      hoverBg: 'hover:border-cyan-400 dark:hover:border-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/30',
      text: 'text-cyan-400 dark:text-cyan-500',
      dragBorder: 'border-cyan-500 dark:border-cyan-400',
      dragBg: 'bg-cyan-100/50 dark:bg-cyan-900/30',
    },
  }

  const colors = colorClasses[accentColor] || colorClasses.emerald

  return (
    <div className="space-y-3">
      {/* Photo Previews */}
      <AnimatePresence>
        {photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap gap-3"
          >
            {photos.map((photo, index) => (
              <motion.div
                key={`photo-${index}-${photo.name}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="relative group"
              >
                <div
                  className={`relative rounded-xl border overflow-hidden cursor-pointer transition-shadow hover:shadow-lg ${
                    photo.quality === 'low'
                      ? 'border-rose-300 dark:border-rose-700 ring-1 ring-rose-500/30'
                      : photo.quality === 'medium'
                        ? 'border-amber-200 dark:border-amber-800'
                        : 'border-border'
                  }`}
                  onClick={() => setPreviewIndex(index)}
                >
                  <img
                    src={photo.dataUrl}
                    alt={`Photo ${index + 1}`}
                    className="h-24 w-24 object-cover"
                  />

                  {/* Upload progress overlay */}
                  {photo.uploadProgress < 100 && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                      <span className="text-[9px] text-white font-medium">{photo.uploadProgress}%</span>
                    </div>
                  )}

                  {/* Hover zoom icon */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Quality badge */}
                <div className="absolute top-1 left-1">
                  {qualityBadge(photo.quality)}
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removePhoto(index)
                  }}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-rose-600"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* File info */}
                <div className="mt-1 text-center">
                  <p className="text-[9px] text-muted-foreground truncate max-w-[96px]">
                    {photo.name}
                  </p>
                  <p className="text-[8px] text-muted-foreground/60">
                    {photo.width}×{photo.height}
                  </p>
                </div>

                {/* Upload progress bar */}
                {photo.uploadProgress < 100 && (
                  <Progress value={photo.uploadProgress} className="h-1 mt-1" />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop Zone */}
      {photos.length < maxPhotos && (
        <motion.div
          animate={isDragOver ? { scale: 1.02 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !processingFiles && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 cursor-pointer transition-all duration-300 upload-zone-3d ${
            isDragOver
              ? `${colors.dragBorder} ${colors.dragBg} drag-active`
              : `${colors.border} ${colors.bg} ${colors.hoverBg}`
          } ${disabled || processingFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {processingFiles ? (
            <>
              <Loader2 className={`h-8 w-8 ${colors.text} animate-spin`} />
              <p className="text-sm text-muted-foreground">Processing images...</p>
            </>
          ) : (
            <>
              <motion.div
                animate={isDragOver ? { scale: 1.2, rotate: 5 } : { scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <ImagePlus className={`h-8 w-8 ${colors.text}`} />
              </motion.div>
              <p className="text-sm text-muted-foreground">
                {isDragOver ? 'Drop images here' : 'Click to upload or drag & drop'}
              </p>
              <p className="text-xs text-muted-foreground/60">
                Images up to {Math.round(maxFileSize / 1024 / 1024)}MB • Min {MIN_DIMENSION}×{MIN_DIMENSION}px recommended • {photos.length}/{maxPhotos} uploaded
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files)
              e.target.value = ''
            }}
            className="hidden"
            disabled={disabled || processingFiles}
          />
        </motion.div>
      )}

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewIndex !== null && photos[previewIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos[previewIndex].dataUrl}
                alt={`Preview ${previewIndex + 1}`}
                className="w-full rounded-xl shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setPreviewIndex(null)}
                className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white font-medium">{photos[previewIndex].name}</p>
                  <p className="text-[10px] text-white/60">
                    {photos[previewIndex].width}×{photos[previewIndex].height} • {(photos[previewIndex].size / 1024).toFixed(0)}KB
                  </p>
                </div>
                {qualityBadge(photos[previewIndex].quality)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
