import {getUserFromLocalStorage} from './authUtils';
import {NextRequest} from 'next/server';
import {Env} from '@/worker/types';
import {logWithTimestamp} from "@/utils/logUtils";

// import os from 'os';


export interface User {
    userId: string;
    name: string;
    email: string;
    points: number;
    subscription_type: string | null;
    subscription_start_date: string | null;
    subscription_end_date: string | null;
    // 添加其他可能的用户属性
}

export interface Data2 {
    points: number;
}

interface Transaction {
    client_reference_id: string;
    amount_total: number
    points_added: number;
    session_id: string
    // 添加其他可能的用户属性
}

// ✅ 使用 Prisma 替代 Cloudflare Workers
export { getUserPoints } from './prismaUtils';

// ✅ 使用 Prisma 替代 Cloudflare Workers
export { updateUserPoints } from './prismaUtils';

// ✅ 使用 Prisma 替代 Cloudflare Workers
export { updateUserPurchase } from './prismaUtils';

// ✅ 使用 Prisma 替代 Cloudflare Workers
export { insertTransaction } from './prismaUtils';

// ✅ 使用 Prisma 替代 Cloudflare Workers
export { getTransaction } from './prismaUtils';

// ✅ 使用 Prisma 替代 Cloudflare Workers
// 注意：新版本的签名不同，需要 userId 而不是 token
export { checkAndConsumePoints } from './prismaUtils';

// ✅ 使用 Prisma 替代 Cloudflare Workers
export { recordGeneration } from './prismaUtils';

// ✅ 使用 Prisma 替代 Cloudflare Workers
export { recordToolUsage } from './prismaUtils';

// ✅ 使用 Prisma 替代 Cloudflare Workers
export { getGenerationRecord } from './prismaUtils';

// ✅ 使用 Prisma 替代 Cloudflare Workers
export { updateGenerationRecord } from './prismaUtils';

// ✅ 使用 Prisma 替代 Cloudflare Workers
export { checkRateLimit } from './prismaUtils';
