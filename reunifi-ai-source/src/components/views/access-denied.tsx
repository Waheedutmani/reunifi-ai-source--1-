'use client'

import { motion } from 'framer-motion'
import { Shield, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import { getFallbackView } from '@/lib/rbac'

export function AccessDeniedView() {
  const currentUser = useAppStore((s) => s.currentUser)
  const navigateTo = useAppStore((s) => s.navigateTo)

  const handleGoBack = () => {
    if (currentUser) {
      const fallback = getFallbackView(currentUser.role)
      navigateTo(fallback as 'dashboard')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <Card className="max-w-md w-full border-destructive/20">
        <CardContent className="py-16 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30"
          >
            <Shield className="h-10 w-10 text-rose-600 dark:text-rose-400" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              You don&apos;t have permission to access this page. Contact your administrator if you believe this is an error.
            </p>
            <p className="mt-4 text-xs text-muted-foreground/60">
              Current role: <span className="font-semibold">{currentUser?.role || 'unknown'}</span>
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={handleGoBack}
              className="mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
