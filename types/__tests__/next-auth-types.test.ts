/**
 * Type Safety Tests for NextAuth Extensions
 * 
 * These tests verify that our custom NextAuth type extensions work correctly
 * Requirements: 2.4, 9.2
 */

import { Session } from 'next-auth'

describe('NextAuth Type Extensions', () => {
  it('should have correct Session type with user id and points', () => {
    // This test verifies type safety at compile time
    const mockSession: Session = {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        points: 50,
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }

    // Type assertions to verify the types are correct
    expect(mockSession.user.id).toBeDefined()
    expect(typeof mockSession.user.id).toBe('string')
    expect(mockSession.user.points).toBeDefined()
    expect(typeof mockSession.user.points).toBe('number')
  })

  it('should allow optional user properties', () => {
    const mockSession: Session = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        points: 100,
        // name and image are optional from DefaultSession
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }

    expect(mockSession.user.id).toBe('test-user-id')
    expect(mockSession.user.points).toBe(100)
  })

  it('should handle session with all user properties', () => {
    const mockSession: Session = {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        points: 75,
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }

    expect(mockSession.user.id).toBe('test-user-id')
    expect(mockSession.user.name).toBe('Test User')
    expect(mockSession.user.email).toBe('test@example.com')
    expect(mockSession.user.image).toBe('https://example.com/avatar.jpg')
    expect(mockSession.user.points).toBe(75)
  })
})
