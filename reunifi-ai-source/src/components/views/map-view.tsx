'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Users, Heart, Building2, AlertTriangle, Navigation } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app-store'

interface LocationPoint {
  id: string
  name: string
  type: 'missing' | 'found' | 'shelter'
  location: string
  lat: number
  lng: number
  status?: string
  age?: number
}

// Approximate coordinates for Pakistani/Regional cities
const locationCoords: Record<string, { lat: number; lng: number }> = {
  'Lahore': { lat: 31.5204, lng: 74.3587 },
  'Karachi': { lat: 24.8607, lng: 67.0011 },
  'Islamabad': { lat: 33.6844, lng: 73.0479 },
  'Rawalpindi': { lat: 33.5651, lng: 73.0169 },
  'Faisalabad': { lat: 31.4504, lng: 73.1350 },
  'Peshawar': { lat: 34.0151, lng: 71.5249 },
  'Multan': { lat: 30.1575, lng: 71.5249 },
  'Quetta': { lat: 30.1798, lng: 66.9750 },
  'Hyderabad': { lat: 25.3960, lng: 68.3578 },
  'Sialkot': { lat: 32.4945, lng: 74.5229 },
  'Gujranwala': { lat: 32.1877, lng: 74.1945 },
  'Accra': { lat: 5.6037, lng: -0.1870 },
  'Kumasi': { lat: 6.6884, lng: -1.6244 },
  'Tamale': { lat: 9.4034, lng: -0.8393 },
}

function getCoords(location: string): { lat: number; lng: number } {
  for (const [city, coords] of Object.entries(locationCoords)) {
    if (location.toLowerCase().includes(city.toLowerCase())) return coords
  }
  // Default scatter around Lahore
  return { lat: 31.5 + (Math.random() - 0.5) * 2, lng: 74.3 + (Math.random() - 0.5) * 2 }
}

export function MapView() {
  const [points, setPoints] = useState<LocationPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [hoveredPoint, setHoveredPoint] = useState<LocationPoint | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/missing?limit=100').then(r => r.json()).catch(() => ({ data: [] })),
      fetch('/api/found?limit=100').then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([missingData, foundData]) => {
      const pts: LocationPoint[] = []

      ;(missingData.data || []).forEach((c: any) => {
        const coords = getCoords(c.lastSeenLocation || '')
        pts.push({ id: c.id, name: c.fullName, type: 'missing', location: c.lastSeenLocation, ...coords, status: c.status, age: c.age })
      })

      ;(foundData.data || []).forEach((c: any) => {
        const coords = getCoords(c.foundLocation || '')
        pts.push({ id: c.id, name: c.estimatedName || 'Unknown', type: 'found', location: c.foundLocation, ...coords, status: c.status, age: c.estimatedAge })
      })

      // Add some shelter points
      pts.push({ id: 'sh1', name: 'Child Protection Center', type: 'shelter', location: 'Lahore', ...locationCoords.Lahore })
      pts.push({ id: 'sh2', name: 'Rescue Shelter', type: 'shelter', location: 'Karachi', ...locationCoords.Karachi })
      pts.push({ id: 'sh3', name: 'Safe Home Islamabad', type: 'shelter', location: 'Islamabad', ...locationCoords.Islamabad })

      setPoints(pts)
      setLoading(false)
    })
  }, [])

  const filteredPoints = filter === 'all' ? points : points.filter(p => p.type === filter)
  const missingCount = points.filter(p => p.type === 'missing').length
  const foundCount = points.filter(p => p.type === 'found').length
  const shelterCount = points.filter(p => p.type === 'shelter').length

  // Map boundaries for the SVG
  const allLats = filteredPoints.map(p => p.lat)
  const allLngs = filteredPoints.map(p => p.lng)
  const minLat = Math.min(...allLats, 24) - 1
  const maxLat = Math.max(...allLats, 35) + 1
  const minLng = Math.min(...allLngs, 66) - 1
  const maxLng = Math.max(...allLngs, 75) + 1

  const svgWidth = 700
  const svgHeight = 500
  const toX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * (svgWidth - 40) + 20
  const toY = (lat: number) => ((maxLat - lat) / (maxLat - minLat)) * (svgHeight - 40) + 20

  const pointConfig = {
    missing: { color: '#f59e0b', bgColor: '#fef3c7', icon: Users, label: 'Missing' },
    found: { color: '#10b981', bgColor: '#d1fae5', icon: Heart, label: 'Found' },
    shelter: { color: '#14b8a6', bgColor: '#ccfbf1', icon: Building2, label: 'Shelter' },
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">Geolocation & Mapping</h1>
            <p className="text-sm text-muted-foreground">Track locations of missing, found children and shelters</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Missing', count: missingCount, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', icon: Users },
          { label: 'Found', count: foundCount, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', icon: Heart },
          { label: 'Shelters', count: shelterCount, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20', icon: Building2 },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All Points</TabsTrigger>
          <TabsTrigger value="missing">Missing</TabsTrigger>
          <TabsTrigger value="found">Found</TabsTrigger>
          <TabsTrigger value="shelter">Shelters</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Map */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <Skeleton className="h-[500px] w-full rounded-lg" />
          ) : (
            <div className="relative">
              <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/50 dark:border-emerald-800/50">
                {/* Grid lines */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={(svgHeight / 8) * i} x2={svgWidth} y2={(svgHeight / 8) * i} stroke="#d1d5db" strokeWidth="0.5" opacity="0.3" />
                ))}
                {Array.from({ length: 10 }).map((_, i) => (
                  <line key={`v${i}`} x1={(svgWidth / 10) * i} y1="0" x2={(svgWidth / 10) * i} y2={svgHeight} stroke="#d1d5db" strokeWidth="0.5" opacity="0.3" />
                ))}

                {/* Connection lines between matching locations */}
                {filteredPoints.filter(p => p.type === 'missing').map((mp) => {
                  const nearby = filteredPoints.find(fp => fp.type === 'found' && Math.abs(fp.lat - mp.lat) < 2 && Math.abs(fp.lng - mp.lng) < 2)
                  if (nearby) {
                    return (
                      <line key={`line-${mp.id}`}
                        x1={toX(mp.lng)} y1={toY(mp.lat)}
                        x2={toX(nearby.lng)} y2={toY(nearby.lat)}
                        stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                    )
                  }
                  return null
                })}

                {/* Points */}
                {filteredPoints.map((point) => {
                  const cfg = pointConfig[point.type]
                  const x = toX(point.lng)
                  const y = toY(point.lat)
                  const isHovered = hoveredPoint?.id === point.id
                  return (
                    <g key={point.id}
                      onMouseEnter={() => setHoveredPoint(point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      className="cursor-pointer"
                    >
                      {/* Pulse ring for missing */}
                      {point.type === 'missing' && (
                        <circle cx={x} cy={y} r={isHovered ? 16 : 12} fill="none" stroke={cfg.color} strokeWidth="1" opacity="0.3">
                          <animate attributeName="r" from="8" to="18" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle cx={x} cy={y} r={isHovered ? 8 : 6} fill={cfg.color} stroke="white" strokeWidth="2" className="transition-all duration-200" />
                    </g>
                  )
                })}
              </svg>

              {/* Hover Tooltip */}
              {hoveredPoint && (
                <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-3 max-w-[200px] z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pointConfig[hoveredPoint.type].color }} />
                    <span className="text-xs font-semibold">{pointConfig[hoveredPoint.type].label}</span>
                  </div>
                  <p className="text-sm font-medium">{hoveredPoint.name}</p>
                  <p className="text-xs text-muted-foreground">{hoveredPoint.location}</p>
                  {hoveredPoint.age && <p className="text-xs text-muted-foreground">Age: {hoveredPoint.age}</p>}
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 text-xs text-muted-foreground">
                {Object.entries(pointConfig).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span>{cfg.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0 border-t border-dashed border-emerald-500" />
                  <span>Possible Match</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {filteredPoints.map((point) => {
              const cfg = pointConfig[point.type]
              return (
                <div key={point.id} className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  onMouseEnter={() => setHoveredPoint(point)}
                  onMouseLeave={() => setHoveredPoint(null)}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: cfg.bgColor }}>
                    <cfg.icon className="h-4 w-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{point.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{point.location}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0" style={{ color: cfg.color, borderColor: cfg.color + '40' }}>{cfg.label}</Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
