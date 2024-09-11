import {Env} from './types';
import {handleRegister} from './handlers/register';
import {handleLogin} from './handlers/login';

const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:3001',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
};
export default {
    async fetch(request: Request, env: Env): Promise<Response> {

        if (request.method === 'OPTIONS') {
            return new Promise((resolve) => resolve(new Response(null, {
                headers: corsHeaders
            })));
        }
        const url = new URL(request.url);

        if (url.pathname === '/') {
            return new Promise((resolve) => resolve(new Response('Welcome to my Cloudflare Worker!', {
                headers: {...corsHeaders, 'Content-Type': 'text/plain'}
            })));
        }

        if (url.pathname === '/register' && request.method === 'POST') {
            return handleCORSResponse(await handleRegister(request, env));
        }

        if (url.pathname === '/login' && request.method === 'POST') {
            return handleCORSResponse(await handleLogin(request, env));
        }

        return new Promise((resolve) => resolve(new Response('Not Found', {status: 404})));
    },
};

function handleCORSResponse(response: Response): Response {
    // 将 CORS 头添加到所有响应中
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
    });

    // 使用 response.clone() 来创建一个新的 Response 对象
    const newResponse = response.clone();

    // 使用 Object.defineProperty 来设置 headers
    Object.defineProperty(newResponse, 'headers', {
        value: newHeaders,
        writable: true
    });

    return newResponse;
}