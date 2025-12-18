/**
 * Points Hook
 * 
 * Custom hook for managing and refreshing user points display
 * Requirements: 8.2, 8.4
 */

'use client'

import { useSession } from 'next-auth/react'
import { useState, useCallback } from 'react'

export function usePoints() {
  const { data: session, update } = useSession()
  const [isRefreshing, setIsRefreshing] = useState(false)

  /**
   * Refresh points from the database
   * Requirement 8.4: When displaying points THEN the system SHALL fetch the current value from the database
   */
  const refreshPoints = useCallback(async () => {
    if (!session?.user?.id) {
      return null
    }

    setIsRefreshing(true)
    try {
      // Trigger session update which will fetch fresh points from database
      await update()
      return session.user.points
    } catch (error) {
      console.error('Error refreshing points:', error)
      return null
    } finally {
      setIsRefreshing(false)
    }
  }, [session?.user?.id, session?.user?.points, update])

  return {
    points: session?.user?.points ?? 0,
    isRefreshing,
    refreshPoints,
    hasSession: !!session?.user
  }
}
