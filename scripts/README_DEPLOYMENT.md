# Deployment Scripts

This directory contains scripts for verifying production readiness and deployment.

## Scripts Overview

### 1. verify-production-readiness.ts

Checks if your application is ready for production deployment.

**Usage**:
```bash
npm run verify:production-ready
# or
npx tsx scripts/verify-production-readiness.ts
```

**What it checks**:
- ✅ All required environment variables are set
- ✅ NEXTAUTH_SECRET is strong enough (32+ characters)
- ✅ Database URL includes SSL configuration
- ✅ NEXTAUTH_URL uses HTTPS (not localhost)
- ✅ Prisma schema and migrations exist
- ✅ Prisma Client is generated
- ✅ NextAuth configuration is complete
- ✅ Security measures are in place (bcrypt, password hashing)
- ✅ All required files exist
- ✅ All dependencies are installed

**Exit codes**:
- `0`: Ready for production
- `1`: Not ready (critical issues found)

**Example output**:
```
🚀 Production Readiness Verification
====================================

✅ READY FOR PRODUCTION DEPLOYMENT

Next steps:
1. Review the deployment guide
2. Set up production environment variables
3. Run database migrations
4. Deploy to your hosting platform
5. Run post-deployment verification
```

### 2. verify-production-deployment.ts

Tests your production deployment after it's live.

**Usage**:
```bash
PRODUCTION_URL=https://yourdomain.com npm run verify:production-deployed
# or
PRODUCTION_URL=https://yourdomain.com npx tsx scripts/verify-production-deployment.ts
```

**What it tests**:
- ✅ Health endpoint is responding
- ✅ HTTPS is configured
- ✅ NextAuth providers are available (Google, Credentials)
- ✅ Session endpoint works
- ✅ Registration endpoint validates input
- ✅ Protected routes require authentication
- ✅ Response times are acceptable
- ✅ Security headers are configured

**Exit codes**:
- `0`: All tests passed
- `1`: Some tests failed

**Example output**:
```
📊 PRODUCTION DEPLOYMENT VERIFICATION REPORT
============================================

✅ Passed: 8/8 (100.0%)

✅ Health Endpoint (245ms)
   Health endpoint responding
✅ HTTPS
   Application is using HTTPS
✅ Auth Providers (312ms)
   Auth providers configured: google, credentials
...

✅ ALL TESTS PASSED - DEPLOYMENT SUCCESSFUL
```

## Quick Start

### Before Deployment

1. **Check readiness**:
   ```bash
   npm run verify:production-ready
   ```

2. **Fix any issues** identified by the script

3. **Set up environment variables** on your hosting platform

4. **Run database migrations**:
   ```bash
   export DATABASE_URL="your-production-url"
   npm run prisma:migrate
   ```

### After Deployment

1. **Verify deployment**:
   ```bash
   PRODUCTION_URL=https://yourdomain.com npm run verify:production-deployed
   ```

2. **Check results** and fix any failing tests

3. **Manual testing** - Follow the checklist in `PRODUCTION_DEPLOYMENT_CHECKLIST.md`

## Environment Variables

Both scripts respect these environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your application URL
- `NEXTAUTH_SECRET`: Secret for NextAuth
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `PRODUCTION_URL`: (verify-production-deployment only) URL to test

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Verify production readiness
        run: npm run verify:production-ready
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
          GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
      
      - name: Deploy to Vercel
        run: npm run deploy:vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      
      - name: Verify deployment
        run: npm run verify:production-deployed
        env:
          PRODUCTION_URL: https://yourdomain.com
```

## Troubleshooting

### Script fails with "Module not found"

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate
```

### "Environment variable not set" errors

```bash
# Check which variables are missing
npm run verify:production-ready

# Set them in your environment or .env file
export DATABASE_URL="postgresql://..."
export NEXTAUTH_URL="https://yourdomain.com"
export NEXTAUTH_SECRET="your-secret"
```

### "Prisma Client not generated"

```bash
# Generate Prisma Client
npm run prisma:generate
```

### Verification script times out

```bash
# Check if your production URL is accessible
curl https://yourdomain.com/api/health

# Increase timeout (edit script if needed)
# Default timeout is 10 seconds
```

## Related Documentation

- **Deployment Guide**: `.kiro/specs/modern-auth-system/DEPLOYMENT_GUIDE.md`
- **Deployment Checklist**: `.kiro/specs/modern-auth-system/PRODUCTION_DEPLOYMENT_CHECKLIST.md`
- **Quick Start**: `PRODUCTION_DEPLOYMENT_QUICK_START.md`
- **Task Summary**: `.kiro/specs/modern-auth-system/TASK_28_DEPLOYMENT_SUMMARY.md`

## Support

For issues or questions:
1. Check the full deployment guide
2. Review the deployment checklist
3. Check error logs from the scripts
4. Verify environment variables are set correctly

