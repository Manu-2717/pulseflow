'use client'

import { useEffect } from 'react'
import { reportClientError } from '@/lib/client-error'

export function RuntimeMonitor() {
  useEffect(() => {
    const report = () => reportClientError('runtime')
    window.addEventListener('error', report)
    window.addEventListener('unhandledrejection', report)
    return () => {
      window.removeEventListener('error', report)
      window.removeEventListener('unhandledrejection', report)
    }
  }, [])
  return null
}
