import { Env } from './types';
import { WorkerConfigManager, createWorkerResponse, createWorkerErrorResponse, createWorkerSuccessResponse } from './utils/workerConfig';
import { WorkerAuthService } from './services/authService';
import { WorkerErrorHandler } from './utils/workerErrorHandler';
import { handleGetUserPoints } from './handlers/getUserPoints';
import { handleUpdateUserPoints } from './handlers/updateUserPoints';
import { handleInsertTransaction } from './handlers/insertTransaction';
import { handleUpdateUserPointsForPurchase } from './handlers/updateUserPointsForPurchase';
import { handleGetTransaction } from './handlers/getTransaction';
import { handleGetGenerationRecord } from './handlers/getGenerationRecord';
import { handleUpdateGenerationRecord } from './handlers/updateGenerationRecord';
import { handleCheckRateLimit } from './handlers/checkRateLimit';
import { handleCheckAndConsumePoints } from './handlers/checkAndConsumePoints';
import { handleRecordGeneration } from './handlers/recordGeneration';
import { handleRecordToolUsage } from './handlers/recordToolUsage';
import { runDatabaseMigrations } from '@/utils/migrations';
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        try {
            // 初始化配置管理器和服务
            const configManager = new WorkerConfigManager(env);
            const logger = configManager.getLogger();
            const errorHandler = new WorkerErrorHandler(env);
            const requestId = errorHandler.generateRequestId();
            
            const origin = request.headers.get('Origin');
            const corsHeaders = configManager.getCorsHeaders(origin || undefined);
            const url = new URL(request.url);
            
            // 记录请求开始
            logger.requestStart(requestId, request.method, request.url);
            const startTime = Date.now();

            // 处理 OPTIONS 请求 (预检请求)
            if (request.method === 'OPTIONS') {
                const response = handleOptions(corsHeaders);
                logger.requestEnd(requestId, request.method, request.url, 200, Date.now() - startTime);
                return response;
            }
            
            // 初始化认证服务
            const authService = new WorkerAuthService(env);

            // 主页欢迎信息
            if (url.pathname === '/') {
                const welcomeData = {
                    message: 'Flux AI Cloudflare Worker',
                    version: '2.0.0',
                    environment: configManager.getConfig().environment,
                    timestamp: new Date().toISOString()
                };
                return createWorkerSuccessResponse(welcomeData, corsHeaders);
            }

            // 处理注册请求
            if (url.pathname === '/register' && request.method === 'POST') {
                const requestData = await request.json() as any;
                const result = await logger.measureTime('auth-register', async () => {
                    return await authService.register(requestData);
                }, requestId);
                
                logger.authEvent('register', result.success, result.user?.id, requestId);
                
                const status = result.success ? 201 : 400;
                const response = result.success 
                    ? createWorkerSuccessResponse(result, corsHeaders)
                    : createWorkerErrorResponse(
                        result.error?.message || '注册失败',
                        status,
                        result.error?.code,
                        corsHeaders
                    );
                
                logger.requestEnd(requestId, request.method, request.url, status, Date.now() - startTime, result.user?.id);
                return response;
            }

            // 处理登录请求
            if (url.pathname === '/login' && request.method === 'POST') {
                const requestData = await request.json() as any;
                const result = await logger.measureTime('auth-login', async () => {
                    return await authService.login(requestData);
                }, requestId);
                
                logger.authEvent('login', result.success, result.user?.id, requestId);
                
                const status = result.success ? 200 : 401;
                const response = result.success 
                    ? createWorkerSuccessResponse(result, corsHeaders)
                    : createWorkerErrorResponse(
                        result.error?.message || '登录失败',
                        status,
                        result.error?.code,
                        corsHeaders
                    );
                
                logger.requestEnd(requestId, request.method, request.url, status, Date.now() - startTime, result.user?.id);
                return response;
            }
            
            // 处理令牌验证请求
            if (url.pathname === '/verify-token' && request.method === 'POST') {
                const { token } = await request.json() as any;
                const result = await logger.measureTime('auth-verify-token', async () => {
                    return await authService.verifyToken(token);
                }, requestId);
                
                logger.authEvent('token-verify', result.success, result.user?.id, requestId);
                
                const status = result.success ? 200 : 401;
                const response = result.success 
                    ? createWorkerSuccessResponse(result, corsHeaders)
                    : createWorkerErrorResponse(
                        result.error?.message || '令牌验证失败',
                        status,
                        result.error?.code,
                        corsHeaders
                    );
                
                logger.requestEnd(requestId, request.method, request.url, status, Date.now() - startTime, result.user?.id);
                return response;
            }

        // 处理登录请求
        if (url.pathname === '/getuserpoints' && request.method === 'POST') {
            return handleGetUserPoints(request, env);
        }

        // 处理登录请求
        if (url.pathname === '/updateuserpoints' && request.method === 'POST') {
            return handleUpdateUserPoints(request, env);
        }

        if (url.pathname === '/updateuserpurchase' && request.method === 'POST') {
            return handleUpdateUserPointsForPurchase(request, env);
        }

        if (url.pathname === '/inserttransaction' && request.method === 'POST') {
            return handleInsertTransaction(request, env);
        }
        if (url.pathname === '/gettransaction' && request.method === 'POST') {
            return handleGetTransaction(request, env);
        }

        if (url.pathname === '/getGenerationRecord' && request.method === 'POST') {
            return handleGetGenerationRecord(request, env);
        }
        if (url.pathname === '/updateGenerationRecord' && request.method === 'POST') {
            return handleUpdateGenerationRecord(request, env);
        }
        if (url.pathname === '/checkRateLimit' && request.method === 'POST') {
            return handleCheckRateLimit(request, env);
        }

        if (url.pathname === '/checkAndConsumePoints' && request.method === 'POST') {
            return handleCheckAndConsumePoints(request, env);
        }
        if (url.pathname === '/recordGeneration' && request.method === 'POST') {
            return handleRecordGeneration(request, env);
        }
        if (url.pathname === '/recordToolUsage' && request.method === 'POST') {
            return handleRecordToolUsage(request, env);
        }

            // 数据库迁移初始化
            if (url.pathname === '/init-db' && request.method === 'POST') {
                try {
                    await logger.measureTime('db-migration', async () => {
                        await runDatabaseMigrations(env);
                    }, requestId);
                    
                    logger.info('Database migrations completed successfully', undefined, { requestId });
                    const response = createWorkerSuccessResponse({
                        message: 'Database migrations completed successfully'
                    }, corsHeaders);
                    
                    logger.requestEnd(requestId, request.method, request.url, 200, Date.now() - startTime);
                    return response;
                } catch (error) {
                    const workerError = errorHandler.handleError(error, {
                        operation: 'db-migration',
                        requestUrl: request.url
                    }, requestId);
                    
                    const response = createWorkerErrorResponse(
                        workerError.message,
                        500,
                        workerError.code,
                        corsHeaders
                    );
                    
                    logger.requestEnd(requestId, request.method, request.url, 500, Date.now() - startTime);
                    return response;
                }
            }
            
            // 配置诊断端点（仅开发环境）
            if (url.pathname === '/diagnostics' && request.method === 'GET' && configManager.isDevelopment()) {
                const diagnostics = {
                    config: configManager.getDiagnostics(),
                    requestId,
                    timestamp: new Date().toISOString()
                };
                
                const response = createWorkerSuccessResponse(diagnostics, corsHeaders);
                logger.requestEnd(requestId, request.method, request.url, 200, Date.now() - startTime);
                return response;
            }

            // 404 未找到的响应
            const response = createWorkerErrorResponse('Not Found', 404, 'NOT_FOUND', corsHeaders);
            logger.requestEnd(requestId, request.method, request.url, 404, Date.now() - startTime);
            return response;
            
        } catch (error) {
            const errorHandler = new WorkerErrorHandler(env);
            const workerError = errorHandler.handleError(error, {
                operation: 'worker-request',
                requestUrl: request.url
            });
            
            return createWorkerErrorResponse(
                workerError.message,
                500,
                workerError.code
            );
        }
    }
};

// 处理 CORS 预检请求
function handleOptions(corsHeaders: Record<string, string>): Response {
    return new Response(null, {
        headers: {
            ...corsHeaders,
            'Access-Control-Max-Age': '86400'  // 预检请求的缓存时间
        }
    });
}
