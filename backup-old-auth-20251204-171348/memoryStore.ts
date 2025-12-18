/**
 * Global memory store for development
 * This ensures data persists across requests in Node.js runtime
 */

import { User } from './userRepository';

// Use Node.js global object to ensure true global state across module reloads
declare global {
  var __memoryStore: {
    users: Map<string, User>;
    usersByEmail: Map<string, string>;
    initialized: boolean;
  } | undefined;
}

// Initialize global store if it doesn't exist
if (!global.__memoryStore) {
  global.__memoryStore = {
    users: new Map<string, User>(),
    usersByEmail: new Map<string, string>(),
    initialized: false
  };
}

const globalStore = global.__memoryStore;

export class MemoryStore {
  /**
   * Save user to memory store
   */
  static saveUser(user: User): void {
    globalStore.users.set(user.id, user);
    globalStore.usersByEmail.set(user.email.toLowerCase(), user.id);
    console.log(`[MemoryStore] Saved user: ${user.email} (${user.id})`);
    console.log(`[MemoryStore] Total users: ${globalStore.users.size}`);
  }

  /**
   * Get user by ID
   */
  static getUserById(id: string): User | null {
    const user = globalStore.users.get(id);
    console.log(`[MemoryStore] Get user by ID ${id}: ${user ? 'found' : 'not found'}`);
    return user || null;
  }

  /**
   * Get user by email
   */
  static getUserByEmail(email: string): User | null {
    const userId = globalStore.usersByEmail.get(email.toLowerCase());
    if (!userId) {
      console.log(`[MemoryStore] Get user by email ${email}: not found`);
      return null;
    }
    const user = globalStore.users.get(userId);
    console.log(`[MemoryStore] Get user by email ${email}: ${user ? 'found' : 'not found'}`);
    return user || null;
  }

  /**
   * Update user
   */
  static updateUser(id: string, updates: Partial<User>): User | null {
    const user = globalStore.users.get(id);
    if (!user) {
      console.log(`[MemoryStore] Update user ${id}: not found`);
      return null;
    }

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    globalStore.users.set(id, updatedUser);
    
    // Update email mapping if email changed
    if (updates.email && updates.email !== user.email) {
      globalStore.usersByEmail.delete(user.email.toLowerCase());
      globalStore.usersByEmail.set(updates.email.toLowerCase(), id);
    }

    console.log(`[MemoryStore] Updated user: ${id}`);
    return updatedUser;
  }

  /**
   * Delete user
   */
  static deleteUser(id: string): boolean {
    const user = globalStore.users.get(id);
    if (!user) {
      return false;
    }

    globalStore.users.delete(id);
    globalStore.usersByEmail.delete(user.email.toLowerCase());
    console.log(`[MemoryStore] Deleted user: ${id}`);
    return true;
  }

  /**
   * Get all users
   */
  static getAllUsers(): User[] {
    return Array.from(globalStore.users.values());
  }

  /**
   * Clear all data (for testing)
   */
  static clear(): void {
    globalStore.users.clear();
    globalStore.usersByEmail.clear();
    console.log('[MemoryStore] Cleared all data');
  }

  /**
   * Get store statistics
   */
  static getStats(): { totalUsers: number; emails: string[] } {
    return {
      totalUsers: globalStore.users.size,
      emails: Array.from(globalStore.usersByEmail.keys())
    };
  }
}

// Initialize with some test users for development (only once)
if (process.env.NODE_ENV === 'development' && !globalStore.initialized) {
  const testUsers: User[] = [
    {
      id: '1',
      email: 'test@example.com',
      password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // 'password' hashed with SHA-256
      name: 'Test User',
      points: 100,
      isGoogleUser: false,
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      email: 'admin@example.com',
      password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // 'password' hashed with SHA-256
      name: 'Admin User',
      points: 1000,
      isGoogleUser: false,
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  testUsers.forEach(user => MemoryStore.saveUser(user));
  globalStore.initialized = true;
  console.log('[MemoryStore] Initialized with test users');
}
