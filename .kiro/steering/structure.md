# Project Structure

## Root Configuration Files
- `next.config.js` - Next.js configuration (webpack, images, ESLint)
- `tsconfig.json` - TypeScript configuration (strict mode, path aliases)
- `tailwind.config.js` - Tailwind CSS configuration
- `middleware.ts` - Next.js middleware for route protection
- `prisma/schema.prisma` - Database schema definition

## App Directory (`app/`)
Next.js 14 App Router structure with internationalization:

### Routing Pattern
- `app/[locale]/` - Internationalized routes (20+ languages)
- `app/[locale]/layout.tsx` - Root layout with Header/Footer
- `app/[locale]/page.tsx` - Home page
- `app/api/` - API routes (NOT internationalized)

### Key Routes
- `app/[locale]/auth/` - Authentication pages
- `app/[locale]/create/` - Image generation interface
- `app/[locale]/flux-tools/` - Image manipulation tools
- `app/[locale]/pricing/` - Pricing and payment
- `app/[locale]/hub/` - User dashboard
- `app/dashboard/` - Admin dashboard (no locale)
- `app/admin/` - Admin panel (no locale)

### API Routes (`app/api/`)
- `auth/[...nextauth]/` - NextAuth handlers
- `auth/register/` - User registration
- `generate/` - Main image generation endpoint
- `fluxToolsGenerate/` - Flux tools generation
- `getRemainingGenerations/` - Check usage limits
- `history/` - Generation history
- `points/` - Points management
- `webhook/` - Stripe webhooks
- `admin/` - Admin endpoints (metrics, analytics, alerts)

## Components (`components/`)
Organized by feature:

- `components/` - Core UI components (Header, Footer, Hero, etc.)
- `components/admin/` - Admin dashboard components
- `components/dashboard/` - User dashboard components
- `components/editor/` - Image editing components
- `components/flux-tools/` - Flux tool interfaces
- `components/image-search/` - Image search functionality
- `components/mobile/` - Mobile-optimized components
- `components/providers/` - React context providers
- `components/social/` - Social sharing components
- `components/ui/` - Reusable UI primitives (card, tabs)

## Library Code (`lib/`)
Core business logic:

- `lib/auth.ts` - NextAuth configuration (database sessions)
- `lib/prisma.ts` - Prisma client singleton
- `lib/points.ts` - Points system logic
- `lib/auth-utils.ts` - Authentication utilities
- `lib/env-validator.ts` - Environment variable validation
- `lib/__tests__/` - Unit tests for library code

## Utilities (`utils/`)
Helper functions and services:

- `utils/db.ts` - Database utilities
- `utils/pointsSystem.ts` - Points calculation
- `utils/usageTrackingService.ts` - Usage tracking and rate limiting
- `utils/performanceMonitor.ts` - Performance metrics
- `utils/authUtils.ts` - Auth helper functions
- `utils/cookieUtils.ts` - Cookie management
- `utils/errorHandler.ts` - Error handling
- `utils/stripe.ts` - Stripe integration

## Hooks (`hooks/`)
Custom React hooks:

- `hooks/useImageGeneration.tsx` - Image generation state management
- `hooks/usePoints.ts` - Points balance management
- `hooks/useAutoLogout.tsx` - Auto-logout functionality
- `hooks/useTools.ts` - Tool configuration management
- `hooks/__tests__/` - Hook tests

## Internationalization (`app/i18n/`)
- `app/i18n/locales/` - JSON translation files (en.json, zh.json, etc.)
- `app/i18n/settings.ts` - Locale configuration
- `app/i18n/utils.ts` - i18n helper functions
- `app/i18n/languageConfig.ts` - Language metadata

## Types (`types/`)
TypeScript type definitions:

- `types/next-auth.d.ts` - NextAuth type extensions
- `types/database.ts` - Database types
- `types/editHistory.ts` - Edit history types
- `types/social.ts` - Social sharing types

## Scripts (`scripts/`)
Maintenance and deployment scripts:

- `scripts/setup-*.sh` - Setup scripts
- `scripts/test-*.ts` - Testing utilities
- `scripts/verify-*.ts` - Validation scripts
- `scripts/deploy-*.js` - Deployment scripts
- `scripts/run-*-migration.ts` - Database migrations

## Worker (`worker/`)
Cloudflare Workers implementation (alternative backend):

- `worker/index.ts` - Worker entry point
- `worker/handlers/` - Request handlers
- `worker/services/` - Worker services
- `worker/wrangler.toml` - Cloudflare configuration

## Public Assets (`public/`)
Static files:

- `public/pictures/` - Images and examples
- `public/icons/` - SVG icons
- `public/constants/constants.ts` - Shared constants
- `public/types/type.ts` - Shared types

## Path Aliases
Use `@/` prefix for imports:
```typescript
import { auth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
```

## Important Conventions
- Server Components by default (use `'use client'` when needed)
- API routes use `export const dynamic = 'force-dynamic'` for dynamic rendering
- All protected routes check authentication via `auth()` from NextAuth
- Points deduction uses Prisma transactions for consistency
- Error handling uses custom error handlers with logging
