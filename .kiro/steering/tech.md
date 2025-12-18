# Tech Stack

## Framework & Runtime
- **Next.js 14.2.5** with App Router
- **React 18.3.1** with Server Components
- **TypeScript 5.5.4** (strict mode enabled)
- **Node.js** runtime (target: ES2015)

## Authentication & Database
- **NextAuth v5** (beta.30) with database sessions (NOT JWT)
- **Prisma ORM** with PostgreSQL (Neon)
- **@auth/prisma-adapter** for NextAuth integration
- **bcryptjs** for password hashing
- Session strategy: `database` (not JWT-based)

## AI & Image Generation
- **Replicate API** for Flux model inference
- Models: flux-schnell, flux-dev, flux-pro, flux-1.1-pro, flux-1.1-ultra

## Styling & UI
- **Tailwind CSS** with custom configuration
- **Framer Motion** for animations
- **Radix UI** components (tabs, slots)
- **Lucide React** icons
- **class-variance-authority** and **clsx** for conditional styling

## Payment & Analytics
- **Stripe** for payment processing
- **Recharts** for data visualization
- Custom performance monitoring utilities

## Internationalization
- Custom i18n implementation with locale routing
- 20+ language JSON files in `app/i18n/locales/`
- Dynamic locale params: `/[locale]/...`

## Testing
- **Jest** with jsdom environment
- **@testing-library/react** for component testing
- **@testing-library/user-event** for interaction testing

## Build & Deployment
- **Vercel** (primary deployment target)
- **Cloudflare Workers/Pages** (alternative with Wrangler)
- **Railway** (database hosting option)

## Common Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:3000)

# Building
npm run build                  # Production build
npm run build:clean            # Build with custom ignore script
npm run build:cloudflare       # Build for Cloudflare

# Type Checking & Linting
npm run type-check             # Run TypeScript compiler
npm run lint                   # Run ESLint

# Database
npm run prisma:generate        # Generate Prisma client
npm run prisma:migrate         # Deploy migrations (production)
npm run prisma:migrate:dev     # Run migrations (development)
npm run prisma:studio          # Open Prisma Studio

# Testing
npm test                       # Run Jest tests
npm run test:watch             # Run tests in watch mode
npm run test:coverage          # Generate coverage report

# Environment Validation
npm run validate-env           # Check environment variables
npm run validate-env:verbose   # Verbose env validation
npm run validate-env:fix       # Auto-fix env issues

# Deployment
npm run deploy:vercel          # Deploy to Vercel
npm run deploy:cloudflare      # Deploy to Cloudflare
npm run verify:production-ready # Pre-deployment checks
```

## Key Dependencies

- **axios**: HTTP client for API calls
- **jose**: JWT operations (edge-compatible)
- **iron-session**: Secure session management
- **date-fns**: Date manipulation
- **js-cookie**: Client-side cookie handling
- **pg**: PostgreSQL client
