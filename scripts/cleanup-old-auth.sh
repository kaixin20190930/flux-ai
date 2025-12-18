#!/bin/bash

# Cleanup script for old authentication system
# This script removes all old auth-related files

echo "🧹 Starting cleanup of old authentication system..."

# Create backup directory
BACKUP_DIR="backup-old-auth-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup in $BACKUP_DIR..."

# Backup files before deletion
cp -r utils/*auth* "$BACKUP_DIR/" 2>/dev/null || true
cp -r utils/memoryStore.ts "$BACKUP_DIR/" 2>/dev/null || true
cp -r hooks/*auth* "$BACKUP_DIR/" 2>/dev/null || true
cp -r hooks/*Auth* "$BACKUP_DIR/" 2>/dev/null || true

echo "✅ Backup created"

# Remove old auth utilities
echo "🗑️  Removing old auth utilities..."

rm -f utils/unifiedAuthManager.ts
rm -f utils/authStateDebugger.ts
rm -f utils/authSyncManager.ts
rm -f utils/authErrorHandler.ts
rm -f utils/authenticationService.ts
rm -f utils/authSync.ts
rm -f utils/memoryStore.ts
rm -f utils/authManager.ts
rm -f utils/authHelpers.ts
rm -f utils/globalAuthRefresh.ts
rm -f utils/authDebug.ts
rm -f utils/authMigrations.ts
rm -f utils/authUtils.ts
rm -f utils/loginDebug.ts
rm -f utils/sessionManager.ts
rm -f utils/userRepository.ts

# Remove old auth hooks
echo "🗑️  Removing old auth hooks..."

rm -f hooks/useUnifiedAuth.ts
rm -f hooks/useAuthDebug.ts
rm -f hooks/useUnifiedAuthManager.ts
rm -f hooks/useAuth.ts

# Remove old auth tests
echo "🗑️  Removing old auth tests..."

rm -f utils/__tests__/auth.integration.test.ts
rm -f utils/__tests__/auth-state-sync.integration.test.ts
rm -f utils/__tests__/auth-api.integration.test.ts
rm -f utils/__tests__/authStateDebugger.test.ts
rm -f utils/__tests__/authenticationService.test.ts
rm -f utils/__tests__/complete-flows.integration.test.tsx
rm -f utils/__tests__/crossTabSync.test.ts
rm -f utils/__tests__/statePersistence.test.ts
rm -f utils/__tests__/storageErrorHandler.test.ts
rm -f utils/__tests__/tokenValidation.manual.test.ts

# Remove debug components
echo "🗑️  Removing debug components..."

rm -rf components/debug

# Remove old API routes (we'll recreate them)
echo "🗑️  Backing up old API routes..."

mkdir -p "$BACKUP_DIR/api"
cp -r app/api/auth "$BACKUP_DIR/api/" 2>/dev/null || true

# Keep the auth page structure, just remove the old routes
# We'll recreate them with NextAuth

# Remove test and diagnostic files
echo "🗑️  Removing test and diagnostic files..."

rm -f test-*.html
rm -f test-*.js
rm -f test-*.sh
rm -f diagnose-*.html
rm -f diagnose-*.js
rm -f fix-*.js
rm -f fix-*.html
rm -f 一键修复*.js
rm -f scripts/diagnose-*.ts
rm -f scripts/test-auth-*.ts
rm -f scripts/manual-test-helper.ts

# Remove old documentation
echo "🗑️  Removing old documentation..."

rm -f *AUTH*.md
rm -f *LOGIN*.md
rm -f *COOKIE*.md
rm -f *FIX*.md
rm -f *PHASE*.md
rm -f *SECURITY*.md
rm -f 认证*.md
rm -f 修复*.md
rm -f 注册登录*.md
rm -f 最终*.md
rm -f 完整*.md
rm -f 立即*.md

echo "✅ Cleanup complete!"
echo "📦 Backup saved in: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "1. Install new dependencies: npm install next-auth@beta @auth/prisma-adapter @prisma/client bcryptjs"
echo "2. Install dev dependencies: npm install -D prisma @types/bcryptjs"
echo "3. Initialize Prisma: npx prisma init"
