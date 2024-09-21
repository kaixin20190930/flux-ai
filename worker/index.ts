import {Env} from './types';
import {handleRegister} from './handlers/register';
import {handleLogin} from './handlers/login';
import {logWithTimestamp} from "@/utils/logUtils";

const allowedOrigins = [
    'http://localhost:3000',          // 本地开发环境
    'https://flux-ai-img.com'  // 生产环境
]
export default {
    async fetch(request: Request, env: Env): Promise<Response> {

        const origin = request.headers.get('Origin')

        const corsHeaders = {
            'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
            'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Credentials': 'true',
        };

        logWithTimestamp('get request :' + request.url);

        // 处理 OPTIONS 请求 (预检请求)
        if (request.method === 'OPTIONS') {
            return new Promise((resolve) => resolve(handleOptions(request)));
        }
        const url = new URL(request.url);

        // 主页欢迎信息
        if (url.pathname === '/') {
            return new Promise((resolve) => resolve(new Response('Welcome to my Cloudflare Worker!!!!', {
                headers: corsHeaders
            })));
        }

        // 处理注册请求
        if (url.pathname === '/register' && request.method === 'POST') {
            // const response = await handleRegister(request, env);
            return handleRegister(request, env);
        }

        // 处理登录请求
        if (url.pathname === '/login' && request.method === 'POST') {
            return handleLogin(request, env);
        }

        // 404 未找到的响应
        return new Promise((resolve) => resolve(new Response('Not Found', {status: 404, headers: corsHeaders})));
    }
    ,
};

// 处理 CORS 预检请求
function handleOptions(request: Request) {
    const origin = request.headers.get('Origin')
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '86400'  // 预检请求的缓存时间
        }
    });
}
