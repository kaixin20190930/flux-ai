#!/usr/bin/env node

/**
 * 简单的 HTTP 服务器，用于托管测试页面
 * 避免 file:// 协议的 CORS 问题
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

const server = http.createServer((req, res) => {
  // 只处理根路径和 test.html
  let filePath = req.url === '/' ? '/test.html' : req.url;
  filePath = path.join(__dirname, filePath);

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  // 读取并返回文件
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }

    // 设置正确的 Content-Type
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
    }[ext] || 'text/plain';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 测试服务器已启动！`);
  console.log(`\n📋 访问地址：`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`\n💡 提示：`);
  console.log(`   1. 确保 Worker 正在运行（npx wrangler dev）`);
  console.log(`   2. 在浏览器中打开上面的地址`);
  console.log(`   3. 开始测试！\n`);
});
