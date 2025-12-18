import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createJWT } from '@/utils/auth';
import { MemoryStore } from '@/utils/memoryStore';
import { User } from '@/utils/userRepository';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// CSRF state validation
const validateState = (state: string | null, expectedOrigin: string): boolean => {
  if (!state) return false;
  
  try {
    const stateData = JSON.parse(state);
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
} | null> => {
  try {
    console.log('Exchanging Google OAuth code for token');

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
      console.error('Google token exchange failed:', tokenResponse.status);
      return null;
    }

    const tokenData = await tokenResponse.json() as any;
    console.log('Google token exchange successful');

    // 2. Get user information
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });

    if (!userResponse.ok) {
      console.error('Google user info fetch failed:', userResponse.status);
      return null;
    }

    const userData = await userResponse.json() as any;
    console.log('Google user info retrieved for:', userData.email);

    return {
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      googleId: userData.id
    };

  } catch (error) {
    console.error('Google token verification error:', error);
    return null;
  }
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Parse state to get locale
    let locale = 'en';
    try {
      const stateData = state ? JSON.parse(state) : {};
      locale = stateData.locale || 'en';
    } catch (error) {
      console.error('Error parsing OAuth state:', error);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://flux-ai-img.com'
        : 'http://localhost:3000');

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      const errorParam = error === 'access_denied' ? 'user_cancelled' : 'oauth_error';
      return Response.redirect(`${baseUrl}/${locale}/auth?error=${errorParam}`);
    }

    // Validate required parameters
    if (!code) {
      console.error('Missing authorization code');
      return Response.redirect(`${baseUrl}/${locale}/auth?error=invalid_request`);
    }

    // Basic CSRF protection
    const expectedOrigin = new URL(baseUrl).origin;
    if (!validateState(state, expectedOrigin)) {
      console.error('Invalid OAuth state - possible CSRF attack');
      return Response.redirect(`${baseUrl}/${locale}/auth?error=invalid_state`);
    }

    // Construct redirect URI
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    console.log('Processing Google OAuth callback with redirect URI:', redirectUri);

    // Verify Google token and get user data
    const googleUserData = await verifyGoogleToken(code, redirectUri);
    if (!googleUserData) {
      console.error('Failed to verify Google token');
      return Response.redirect(`${baseUrl}/${locale}/auth?error=google_verification_failed`);
    }

    // 查找或创建用户
    let user = MemoryStore.getUserByEmail(googleUserData.email);
    
    if (!user) {
      // 创建新用户
      const newUser: User = {
        id: crypto.randomUUID(),
        name: googleUserData.name,
        email: googleUserData.email,
        isGoogleUser: true,
        googleId: googleUserData.googleId,
        points: 50,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      MemoryStore.saveUser(newUser);
      user = newUser;
    } else {
      // 更新现有用户的Google信息
      user = MemoryStore.updateUser(user.id, {
        isGoogleUser: true,
        googleId: googleUserData.googleId,
        lastLoginAt: new Date()
      })!;
    }

    // 生成JWT
    const token = await createJWT(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        points: user.points,
        isGoogleUser: user.isGoogleUser
      },
      process.env.JWT_SECRET || 'default-secret-key'
    );

    // 设置cookie
    const cookieStore = cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });

    // 准备用户数据
    const userData = {
      userId: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      points: user.points,
      isGoogleUser: user.isGoogleUser
    };

    // 重定向到成功页面
    const successUrl = `${baseUrl}/${locale}/auth/success?user=${encodeURIComponent(JSON.stringify(userData))}&token=${encodeURIComponent(token)}`;
    return Response.redirect(successUrl);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    
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
