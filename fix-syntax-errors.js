#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 修复语法错误...');

// 获取所有 API 路由文件
let apiRoutes = [];
try {
    const result = execSync('find app/api -name "route.ts" -type f', { encoding: 'utf8' });
    apiRoutes = result.trim().split('\n').filter(Boolean);
} catch (error) {
    console.log('⚠️  无法自动查找 API 路由');
    process.exit(1);
}

apiRoutes.forEach(routePath => {
    if (fs.existsSync(routePath)) {
        let content = fs.readFileSync(routePath, 'utf8');

        // 修复语法错误：确保在文件末尾正确添加 export 语句
        // 移除错误的添加
        content = content.replace(/}\nexport const dynamic = 'force-dynamic'/g, '}');
        content = content.replace(/}\nexport const runtime = 'nodejs'/g, '}');
        content = content.replace(/}\nexport const runtime = 'edge'/g, '}');
        content = content.replace(/\\nexport const dynamic = 'force-dynamic'/g, '');
        content = content.replace(/\\nexport const runtime = 'nodejs'/g, '');
        content = content.replace(/\\nexport const runtime = 'edge'/g, '');

        // 检查是否已经有正确的 export 语句
        const hasRuntime = content.includes("export const runtime = 'nodejs'") || content.includes("export const runtime = 'edge'");
        const hasDynamic = content.includes("export const dynamic = 'force-dynamic'");

        if (!hasRuntime || !hasDynamic) {
            const lines = content.split('\n');

            // 找到合适的插入位置（在所有 import 之后，第一个 export function 之前）
            let insertIndex = 0;
            let foundImports = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (line.startsWith('import ') || line.startsWith('export ') && !line.includes('function')) {
                    foundImports = true;
                    continue;
                }

                if (foundImports && (line.startsWith('export async function') || line.startsWith('export function'))) {
                    insertIndex = i;
                    break;
                }
            }

            // 确定使用哪个 runtime
            const needsNodejs = content.includes('crypto') ||
                content.includes('next-auth') ||
                content.includes('bcrypt') ||
                content.includes('jsonwebtoken') ||
                content.includes('fs') ||
                content.includes('path') ||
                content.includes('process.env');

            const runtime = needsNodejs ? 'nodejs' : 'edge';

            // 插入 runtime 和 dynamic 配置
            if (!hasRuntime) {
                lines.splice(insertIndex, 0, `export const runtime = '${runtime}'`);
                insertIndex++;
            }

            if (!hasDynamic) {
                lines.splice(insertIndex, 0, "export const dynamic = 'force-dynamic'");
                insertIndex++;
            }

            // 添加空行分隔
            if (insertIndex < lines.length && lines[insertIndex].trim() !== '') {
                lines.splice(insertIndex, 0, '');
            }

            content = lines.join('\n');
        }

        fs.writeFileSync(routePath, content);
        console.log(`✅ 修复了 ${routePath}`);
    }
});

console.log('\\n🎉 语法错误修复完成！');
console.log('\\n🔧 现在可以尝试构建:');
console.log('npm run build');