/**
 * NextAuth Type Extensions
 * 
 * Extends NextAuth.js types to include custom user properties (points)
 * Requirements: 2.4, 9.2
 * 
 * This file extends the default NextAuth types to include:
 * - User points balance in session
 * - User ID in session
 * - Points field in User and AdapterUser interfaces
 */

import { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Extended Session interface
   * 
   * Returned by `auth()`, `useSession()`, `getSession()` and received as a prop 
   * on the `SessionProvider` React Context
   * 
   * Requirement 2.4: Prisma SHALL generate TypeScript types automatically from the schema
   * Requirement 9.2: NextAuth callbacks SHALL use NextAuth's callback configuration
   */
  interface Session {
    user: {
      /** User's unique identifier from database */
      id: string
      /** User's current points balance */
      points: number
    } & DefaultSession["user"]
  }

  /**
   * Extended User interface
   * 
   * Used in callbacks and returned from authorize() in credentials provider
   */
  interface User {
    /** User's points balance (optional during creation) */
    points?: number
  }
}

declare module "@auth/core/adapters" {
  /**
   * Extended AdapterUser interface
   * 
   * Used by Prisma adapter when creating/updating users
   */
  interface AdapterUser {
    /** User's points balance (optional, defaults to 50 on creation) */
    points?: number
  }
}
