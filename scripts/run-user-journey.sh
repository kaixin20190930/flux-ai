#!/bin/bash

# 加载 .env.local 文件
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | grep -v '^$' | xargs)
fi

# 运行用户旅程测试
npx tsx scripts/test-user-journey.ts
