/**
 * Tests for usePoints hook
 * 
 * Requirements: 8.2, 8.4
 */

import { renderHook, waitFor } from '@testing-library/react'
import { usePoints } from '../usePoints'
import { useSession } from 'next-auth/react'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}))

describe('usePoints', () => {
  const mockUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 0 points when no session exists', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      update: mockUpdate
    })

    const { result } = renderHook(() => usePoints())

    expect(result.current.points).toBe(0)
    expect(result.current.hasSession).toBe(false)
  })

  it('should return points from session when user is logged in', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          points: 50
        }
      },
      update: mockUpdate
    })

    const { result } = renderHook(() => usePoints())

    expect(result.current.points).toBe(50)
    expect(result.current.hasSession).toBe(true)
  })

  it('should call update when refreshPoints is called', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          points: 50
        }
      },
      update: mockUpdate
    })

    const { result } = renderHook(() => usePoints())

    await result.current.refreshPoints()

    expect(mockUpdate).toHaveBeenCalled()
  })

  it('should set isRefreshing to false after refresh completes', async () => {
    const mockUpdateFn = jest.fn().mockResolvedValue(undefined)

    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          points: 50
        }
      },
      update: mockUpdateFn
    })

    const { result } = renderHook(() => usePoints())

    // Initially not refreshing
    expect(result.current.isRefreshing).toBe(false)

    // Start refresh
    await result.current.refreshPoints()

    // Should no longer be refreshing after completion
    expect(result.current.isRefreshing).toBe(false)
    expect(mockUpdateFn).toHaveBeenCalled()
  })

  it('should return null when refreshing without a session', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      update: mockUpdate
    })

    const { result } = renderHook(() => usePoints())

    const refreshResult = await result.current.refreshPoints()

    expect(refreshResult).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
