#!/bin/bash

# 加载 .env.local 文件
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | grep -v '^$' | xargs)
fi

# 运行验证脚本
npx tsx scripts/final-system-verification.ts
