import {NextRequest, NextResponse} from 'next/server';
import {getGenerationData} from '../../../utils/cookieUtils';
import {getUserFromCookie, checkUserLoginStatus} from '../../../utils/authUtils';
import {getUserPoints, User} from '../../../utils/userUtils';
import {logWithTimestamp} from '../../../utils/logUtils';

const MAX_DAILY_GENERATIONS = 3;

// 移除edge runtime以提高稳定性
// export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        // 获取免费生成次数
        const generationData = getGenerationData();
        const today = new Date().toDateString();
        
        let remainingFreeGenerations;
        if (generationData.date !== today) {
            remainingFreeGenerations = MAX_DAILY_GENERATIONS;
        } else {
            remainingFreeGenerations = Math.max(0, MAX_DAILY_GENERATIONS - generationData.count);
        }

        // 检查用户登录状态
        let user: User | null = null;
        let userPoints: number = 0;

        const JWT_SECRET = process.env.JWT_SECRET;
        if (JWT_SECRET) {
            try {
                // 首先进行基本的JWT验证
                user = await checkUserLoginStatus(req, JWT_SECRET);
                
                if (user) {
                    logWithTimestamp('API: Basic JWT verification successful:', { 
                        hasUser: !!user, 
                        userId: user?.userId
                    });
                    
                    // 如果JWT验证成功，尝试获取用户点数（但不影响登录状态）
                    if (user.userId) {
                        const userId = parseInt(user.userId);
                        if (!isNaN(userId)) {
                            try {
                                // 添加超时处理
                                const pointsPromise = getUserPoints(userId);
                                const timeoutPromise = new Promise<null>((_, reject) => {
                                    setTimeout(() => reject(new Error('Timeout')), 5000); // 5秒超时
                                });
                                
                                const points = await Promise.race([pointsPromise, timeoutPromise]);
                                userPoints = points !== null ? points : 0;
                                logWithTimestamp('API: User points retrieved:', { userId, userPoints });
                            } catch (pointsError) {
                                // 点数获取失败不影响认证状态
                                logWithTimestamp('API: Failed to get user points, using default:', pointsError);
                                userPoints = 0;
                            }
                        } else {
                            logWithTimestamp('API: Invalid userId format:', user.userId);
                        }
                    }
                } else {
                    logWithTimestamp('API: JWT verification failed, user not logged in');
                }
            } catch (error) {
                // 认证失败时记录错误但不抛出
                logWithTimestamp('API: Authentication failed:', error);
                user = null;
                userPoints = 0;
            }
        } else {
            logWithTimestamp('API: JWT_SECRET not configured');
        }

        const response = {
            remainingFreeGenerations,
            isLoggedIn: !!user,
            userPoints,
            userId: user?.userId || null
        };
        
        logWithTimestamp('API: Returning response:', response);
        return Response.json(response);
    } catch (error) {
        console.error('Error in getRemainingGenerations:', error);
        logWithTimestamp('API: Error occurred:', error);
        
        // 返回默认值而不是错误，确保前端不会卡住
        return Response.json({
            remainingFreeGenerations: MAX_DAILY_GENERATIONS,
            isLoggedIn: false,
            userPoints: 0,
            userId: null
        });
    }
}