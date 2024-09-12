import {Env} from './types';
import {handleRegister} from './handlers/register';
import {handleLogin} from './handlers/login';
import {logWithTimestamp} from "@/utils/logUtils";


const corsHeaders = {
    'Access-Control-Allow-Origin': '*',  // 根据请求设置允许的源
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true', // 如果需要处理凭证（例如 cookies）
    'Vary': 'Origin',
};
export default {
    async fetch(request: Request, env: Env): Response {

        logWithTimestamp('request url is:' + request.url);
        // 处理 OPTIONS 请求 (预检请求)
        if (request.method === 'OPTIONS') {
            return handleOptions();
        }
        const url = new URL(request.url);

        // 主页欢迎信息
        if (url.pathname === '/') {
            return new Response('Welcome to my Cloudflare Worker!!!!', {
                headers: corsHeaders
            });
        }

        // 处理注册请求
        if (url.pathname === '/register' && request.method === 'POST') {
            const response = await handleRegister(request, env);
            return handleCORSResponse(response);
        }

        // 处理登录请求
        if (url.pathname === '/login' && request.method === 'POST') {
            const response = await handleLogin(request, env);
            return handleCORSResponse(response);
        }

        // 404 未找到的响应
        return new Response('Not Found', {status: 404, headers: corsHeaders});
    },
};

// 处理 CORS 预检请求
function handleOptions(): Response {
    return new Response(null, {
        headers: corsHeaders,
    }) as any;
}

// 处理 CORS 响应头
function handleCORSResponse(response: Response): Response {
    // 创建新的 Response，并添加 CORS 头
    return new Response(response.body, {
        ...response, // 保留原响应的状态码、状态文本等
        headers: {
            ...Object.fromEntries(response.headers), // 复制原有的 headers
            ...corsHeaders // 添加 CORS 头
        }
    }) as any;

}
