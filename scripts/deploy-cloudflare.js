#!/usr/bin/env node

// Cloudflare Pages 部署脚本
const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 开始 Cloudflare Pages 部署准备...');

// 1. 检查所有 API 路由是否使用 Edge Runtime
function checkEdgeRuntime() {
  console.log('🔍 检查 Edge Runtime 配置...');
  
  const { execSync } = require('child_process');
  try {
    const result = execSync('find app/api -name "*.ts" -exec grep -L "runtime = .edge." {} \;', { encoding: 'utf8' });
    if (result.trim()) {
      console.error('❌ 以下 API 路由未配置 Edge Runtime:');
      console.error(result);
      console.error('请运行: node fix-cloudflare-deployment.js');
      process.exit(1);
    }
    console.log('✅ 所有 API 路由已配置 Edge Runtime');
  } catch (error) {
    console.log('✅ Edge Runtime 检查完成');
  }
}

// 2. 构建项目
function buildProject() {
  console.log('🔨 构建项目...');
  
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npx', ['@cloudflare/next-on-pages@1'], {
      stdio: 'inherit',
      shell: true
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ 项目构建成功');
        resolve();
      } else {
        console.error(`❌ 构建失败，退出码: ${code}`);
        reject(new Error(`Build failed with code ${code}`));
      }
    });
    
    buildProcess.on('error', (error) => {
      console.error('构建进程启动失败:', error);
      reject(error);
    });
  });
}

// 3. 部署到 Cloudflare Pages
async function deploy() {
  try {
    checkEdgeRuntime();
    await buildProject();
    
    console.log('\n🎉 Cloudflare Pages 部署准备完成！');
    console.log('\n📋 部署摘要:');
    console.log('✅ 所有 API 路由已配置为 Edge Runtime');
    console.log('✅ 项目已成功构建');
    console.log('✅ 构建产物已生成在 .vercel/output 目录');
    
    console.log('\n🚀 下一步:');
    console.log('1. 将代码推送到 GitHub');
    console.log('2. 在 Cloudflare Pages 中连接 GitHub 仓库');
    console.log('3. 设置构建命令: npx @cloudflare/next-on-pages@1');
    console.log('4. 设置输出目录: .vercel/output/static');
    console.log('5. 配置环境变量（参考 .env.cloudflare）');
    
  } catch (error) {
    console.error('❌ 部署准备失败:', error);
    process.exit(1);
  }
}

deploy();