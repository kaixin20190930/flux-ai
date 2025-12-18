import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

/**
 * Server-side utility to require authentication for protected pages.
 * Redirects to /auth if user is not authenticated.
 * 
 * @returns The authenticated session
 * @throws Redirects to /auth if not authenticated
 * 
 * @example
 * ```typescript
 * // In a server component or API route
 * export default async function ProtectedPage() {
 *   const session = await requireAuth()
 *   return <div>Welcome {session.user.name}</div>
 * }
 * ```
 */
export async function requireAuth() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth")
  }
  
  return session
}

/**
 * Server-side utility to get the current session.
 * Returns null if user is not authenticated.
 * 
 * @returns The current session or null
 * 
 * @example
 * ```typescript
 * // In a server component or API route
 * export default async function Page() {
 *   const session = await getServerSession()
 *   if (session) {
 *     return <div>Logged in as {session.user.name}</div>
 *   }
 *   return <div>Not logged in</div>
 * }
 * ```
 */
export async function getServerSession() {
  return await auth()
}

/**
 * Server-side utility to check if the current user is an admin.
 * Returns false if user is not authenticated or not an admin.
 * 
 * Admin users are determined by the ADMIN_USER_IDS environment variable,
 * which should be a comma-separated list of user IDs.
 * 
 * @returns True if user is admin, false otherwise
 * 
 * @example
 * ```typescript
 * // In a server component or API route
 * export default async function AdminPage() {
 *   const isUserAdmin = await isAdmin()
 *   if (!isUserAdmin) {
 *     return <div>Access denied</div>
 *   }
 *   return <div>Admin panel</div>
 * }
 * ```
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth()
  
  if (!session?.user) {
    return false
  }
  
  const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || []
  return ADMIN_USER_IDS.includes(session.user.id)
}

/**
 * Server-side utility to require admin access for protected pages.
 * Throws an error if user is not authenticated or not an admin.
 * 
 * @returns The authenticated session
 * @throws Error if user is not admin
 * 
 * @example
 * ```typescript
 * // In a server component or API route
 * export default async function AdminOnlyPage() {
 *   const session = await requireAdmin()
 *   return <div>Welcome admin {session.user.name}</div>
 * }
 * ```
 */
export async function requireAdmin() {
  const admin = await isAdmin()
  
  if (!admin) {
    throw new Error('Admin access required')
  }
  
  return await auth()
}
