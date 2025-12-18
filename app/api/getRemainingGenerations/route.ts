import {NextRequest} from 'next/server';
import {logWithTimestamp} from '../../../utils/logUtils';
import {usageTrackingService} from '../../../utils/usageTrackingService';

export const dynamic = 'force-dynamic';

// Helper function to verify JWT token and get user from Worker
async function getUserFromToken(token: string | null): Promise<{ id: number; points: number } | null> {
    if (!token) return null;
    
    try {
        const workerUrl = process.env.NODE_ENV === 'production'
            ? 'https://flux-ai-worker.liukai19911010.workers.dev'
            : 'http://localhost:8787';
            
        const response = await fetch(`${workerUrl}/auth/verify-token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) return null;
        
        const data = await response.json() as { success?: boolean; user?: { id: number; points: number } };
        // Worker returns data.user directly, not data.data.user
        if (data.success && data.user) {
            return {
                id: data.user.id,
                points: data.user.points || 0,
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}

export async function GET(req: NextRequest) {
    try {
        // Get client information
        const ipAddress = req.headers.get('x-forwarded-for') || 
                         req.headers.get('x-real-ip') || 
                         'unknown';
        const fingerprintHash = req.headers.get('x-fingerprint-hash') || null;
        
        // Get JWT token from Authorization header or cookie
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '') || req.cookies.get('auth_token')?.value || null;
        
        // Verify token and get user
        const user = await getUserFromToken(token);
        
        // 调试日志
        logWithTimestamp('Auth token check:', {
            hasToken: !!token,
            hasUser: !!user,
            userId: user?.id,
        });
        
        const isLoggedIn = !!user;
        const userId = user?.id || null;
        let userPoints: number = user?.points || 0;

        // Check usage limits using multi-layer tracking
        let remainingFreeGenerations = 0;
        let trackingMethod = 'unknown';
        
        try {
            // Check if IP or fingerprint is blocked
            const [ipBlocked, fingerprintBlocked] = await Promise.all([
                usageTrackingService.isIPBlocked(ipAddress),
                fingerprintHash ? usageTrackingService.isFingerprintBlocked(fingerprintHash) : Promise.resolve(false)
            ]);

            if (ipBlocked || fingerprintBlocked) {
                logWithTimestamp('Access blocked:', { ipBlocked, fingerprintBlocked });
                return Response.json({
                    remainingFreeGenerations: 0,
                    isLoggedIn,
                    userPoints,
                    userId,
                    blocked: true,
                    reason: 'Your access has been temporarily restricted due to suspicious activity.'
                });
            }

            // Check usage limits
            const usageCheck = await usageTrackingService.checkUsageLimit(
                fingerprintHash,
                ipAddress,
                userId ? String(userId) : null
            );

            remainingFreeGenerations = usageCheck.remaining;
            trackingMethod = usageCheck.trackingMethod;

            logWithTimestamp('Usage check result:', {
                allowed: usageCheck.allowed,
                remaining: usageCheck.remaining,
                trackingMethod: usageCheck.trackingMethod,
                details: usageCheck.details
            });

        } catch (error) {
            logWithTimestamp('Error checking usage limits:', error);
            // Fail secure: deny free generations on error
            remainingFreeGenerations = 0;
        }

        const response = {
            remainingFreeGenerations,
            isLoggedIn,
            userPoints,
            userId,
            trackingMethod,
            securityEnabled: true
        };
        
        logWithTimestamp('Returning response:', response);
        return Response.json(response);

    } catch (error) {
        console.error('Error in getRemainingGenerations:', error);
        logWithTimestamp('API error:', error);
        
        // Fail secure: return zero free generations on error
        return Response.json({
            remainingFreeGenerations: 0,
            isLoggedIn: false,
            userPoints: 0,
            userId: null,
            error: 'Unable to verify usage limits. Please try again later.'
        }, { status: 500 });
    }
}