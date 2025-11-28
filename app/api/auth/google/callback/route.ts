// app/api/auth/google/callback/route.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { AuthenticationService } from '@/utils/authenticationService';
import { authErrorHandler } from '@/utils/authErrorHandler';
import { userRepository } from '@/utils/userRepository';
import { logWithTimestamp } from '@/utils/logUtils';

export const dynamic = 'force-dynamic';

// 只在生产环境使用 Edge Runtime
export const runtime = process.env.NODE_ENV === 'production' ? 'edge' : 'nodejs';

// Initialize authentication service
const authService = new AuthenticationService(
  userRepository,
  process.env.JWT_SECRET
);

// CSRF state validation
const validateState = (state: string | null, expectedOrigin: string): boolean => {
  if (!state) return false;
  
  try {
    const stateData = JSON.parse(state);
    // Basic validation - in production, you'd want more robust CSRF protection
    return stateData.timestamp && 
           (Date.now() - stateData.timestamp) < 600000 && // 10 minutes
           stateData.origin === expectedOrigin;
  } catch {
    return false;
  }
};

// Verify Google OAuth token and get user info
const verifyGoogleToken = async (code: string, redirectUri: string): Promise<{
  email: string;
  name: string;
  googleId: string;
  accessToken: string;
} | null> => {
  try {
    logWithTimestamp('Exchanging Google OAuth code for token');

    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      })
    });

    if (!tokenResponse.ok) {
      logWithTimestamp('Google token exchange failed:', tokenResponse.status);
      return null;
    }

    const tokenData = await tokenResponse.json() as any;
    logWithTimestamp('Google token exchange successful');

    // 2. Get user information
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });

    if (!userResponse.ok) {
      logWithTimestamp('Google user info fetch failed:', userResponse.status);
      return null;
    }

    const userData = await userResponse.json() as any;
    logWithTimestamp('Google user info retrieved for:', userData.email);

    return {
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      googleId: userData.id,
      accessToken: tokenData.access_token
    };

  } catch (error) {
    logWithTimestamp('Google token verification error:', error);
    return null;
  }
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Parse state to get locale and validate CSRF
    let locale = 'en';
    let stateData: any = {};
    
    try {
      stateData = state ? JSON.parse(state) : {};
      locale = stateData.locale || 'en';
    } catch (error) {
      logWithTimestamp('Error parsing OAuth state:', error);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://flux-ai-img.com'
        : 'http://localhost:3000');

    // Handle OAuth errors
    if (error) {
      logWithTimestamp('Google OAuth error:', error);
      const errorParam = error === 'access_denied' ? 'user_cancelled' : 'oauth_error';
      return Response.redirect(`${baseUrl}/${locale}/auth?error=${errorParam}`);
    }

    // Validate required parameters
    if (!code) {
      logWithTimestamp('Missing authorization code');
      return Response.redirect(`${baseUrl}/${locale}/auth?error=invalid_request`);
    }

    // Basic CSRF protection
    const expectedOrigin = new URL(baseUrl).origin;
    if (!validateState(state, expectedOrigin)) {
      logWithTimestamp('Invalid OAuth state - possible CSRF attack');
      return Response.redirect(`${baseUrl}/${locale}/auth?error=invalid_state`);
    }

    // Construct redirect URI
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    logWithTimestamp('Processing Google OAuth callback with redirect URI:', redirectUri);

    // Verify Google token and get user data
    const googleUserData = await verifyGoogleToken(code, redirectUri);
    if (!googleUserData) {
      logWithTimestamp('Failed to verify Google token');
      return Response.redirect(`${baseUrl}/${locale}/auth?error=google_verification_failed`);
    }

    // Attempt login with Google using AuthenticationService
    const loginResult = await authService.loginWithGoogle(
      googleUserData.accessToken,
      googleUserData.email
    );

    if (loginResult.success && loginResult.token && loginResult.user) {
      logWithTimestamp('Google OAuth login successful for user:', loginResult.user.id);

      // Set secure cookies
      const cookieStore = cookies();
      const isProduction = process.env.NODE_ENV === 'production';
      
      cookieStore.set('token', loginResult.token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      });

      // Prepare user data for redirect
      const userData = {
        userId: loginResult.user.id,
        id: loginResult.user.id,
        email: loginResult.user.email,
        name: loginResult.user.name,
        points: loginResult.user.points,
        isGoogleUser: loginResult.user.isGoogleUser
      };

      // Redirect to success page
      const successUrl = `${baseUrl}/${locale}/auth/success?user=${encodeURIComponent(JSON.stringify(userData))}`;
      return Response.redirect(successUrl);

    } else {
      // Handle authentication failure
      logWithTimestamp('Google OAuth authentication failed:', loginResult.error?.code);
      
      let errorParam = 'google_auth_failed';
      if (loginResult.error?.code === 'EMAIL_ALREADY_EXISTS') {
        errorParam = 'email_exists';
      } else if (loginResult.error?.code === 'GOOGLE_AUTH_FAILED') {
        errorParam = 'google_verification_failed';
      }

      return Response.redirect(`${baseUrl}/${locale}/auth?error=${errorParam}`);
    }

  } catch (error) {
    logWithTimestamp('Google OAuth callback error:', error);
    
    // Handle unexpected errors
    const authError = authErrorHandler.handleAuthError(error, 'google-oauth-callback');
    
    // Extract locale from URL if possible
    let locale = 'en';
    try {
      const url = new URL(request.url);
      const state = url.searchParams.get('state');
      if (state) {
        const stateData = JSON.parse(state);
        locale = stateData.locale || 'en';
      }
    } catch {
      // Use default locale
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://flux-ai-img.com'
        : 'http://localhost:3000');

    return Response.redirect(`${baseUrl}/${locale}/auth?error=system_error`);
  }
}
