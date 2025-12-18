/**
 * Environment Variable Validator
 * 
 * Validates that all required environment variables are present at application startup.
 * Provides clear error messages for missing variables.
 * 
 * Requirements: 1.1, 1.3, 6.1, 6.2, 6.3
 */

interface RequiredEnvVars {
  DATABASE_URL: string;
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

/**
 * Validates that all required environment variables are present.
 * 
 * @throws {Error} If any required environment variables are missing
 * @returns {RequiredEnvVars} Object containing all validated environment variables
 */
export function validateEnv(): RequiredEnvVars {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];
  
  const missing: string[] = [];
  
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n` +
      missing.map(key => `  - ${key}`).join('\n') +
      `\n\nPlease check your .env.local file.\n` +
      `See .env.example for reference.`
    );
  }
  
  // Log success in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('[Environment] All required environment variables are present');
  }
  
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  };
}
