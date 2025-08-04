#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 综合修复所有构建错误的脚本
class ComprehensiveBuildFixer {
  constructor() {
    this.fixes = [];
  }

  // 修复 FluxModelsComparison.tsx 中的类型错误
  fixFluxModelsComparisonTypes() {
    const file = 'components/FluxModelsComparison.tsx';
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      
      // 修复 map 函数中的隐式 any 类型
      content = content.replace(
        /model\.suitableFor\.map\(\(use, idx\) =>/g,
        'model.suitableFor.map((use: string, idx: number) =>'
      );
      
      fs.writeFileSync(file, content);
      console.log(`✅ Fixed FluxModelsComparison.tsx type errors`);
    }
  }

  // 修复 next.config.js 中的过时配置
  fixNextConfig() {
    const configFile = 'next.config.js';
    if (fs.existsSync(configFile)) {
      let content = fs.readFileSync(configFile, 'utf8');
      
      // 移除过时的 experimental 配置
      content = content.replace(/experimental:\s*\{[^}]*runtime[^}]*\}/gs, 'experimental: {}');
      content = content.replace(/experimental:\s*\{[^}]*edge[^}]*\}/gs, 'experimental: {}');
      
      fs.writeFileSync(configFile, content);
      console.log(`✅ Fixed next.config.js deprecated options`);
    }
  }

  // 修复 bcryptjs crypto 模块问题
  fixBcryptjsCryptoIssue() {
    const webpackConfigFile = 'next.config.js';
    if (fs.existsSync(webpackConfigFile)) {
      let content = fs.readFileSync(webpackConfigFile, 'utf8');
      
      // 添加 webpack 配置来解决 crypto 模块问题
      if (!content.includes('webpack:')) {
        const webpackConfig = `
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },`;
        
        // 在 module.exports 中添加 webpack 配置
        content = content.replace(
          /module\.exports\s*=\s*\{/,
          `module.exports = {${webpackConfig}`
        );
        
        fs.writeFileSync(webpackConfigFile, content);
        console.log(`✅ Fixed bcryptjs crypto module issue`);
      }
    }
  }

  // 修复所有 React Hook 依赖警告
  fixReactHookDependencies() {
    const files = [
      'app/[locale]/about/page.tsx',
      'components/admin/PerformanceDashboard.tsx',
      'components/image-search/SavedImages.tsx',
      'components/image-search/SearchHistory.tsx',
      'components/mobile/NetworkStatusIndicator.tsx'
    ];

    files.forEach(file => {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        const originalContent = content;
        
        // 修复 useEffect 依赖问题
        // 为 router 添加依赖
        content = content.replace(
          /useEffect\(\(\) => \{[^}]*router[^}]*\}, \[\]\)/gs,
          (match) => match.replace('[]', '[router]')
        );
        
        // 为 fetchPerformanceData 添加依赖
        content = content.replace(
          /useEffect\(\(\) => \{[^}]*fetchPerformanceData[^}]*\}, \[\]\)/gs,
          (match) => match.replace('[]', '[fetchPerformanceData]')
        );
        
        // 为 loadSavedImages 添加依赖
        content = content.replace(
          /useEffect\(\(\) => \{[^}]*loadSavedImages[^}]*\}, \[\]\)/gs,
          (match) => match.replace('[]', '[loadSavedImages]')
        );
        
        // 为 loadSearchHistory 添加依赖
        content = content.replace(
          /useEffect\(\(\) => \{[^}]*loadSearchHistory[^}]*\}, \[\]\)/gs,
          (match) => match.replace('[]', '[loadSearchHistory]')
        );
        
        // 为 connectionType 和 isOnline 添加依赖
        content = content.replace(
          /useEffect\(\(\) => \{[^}]*(?:connectionType|isOnline)[^}]*\}, \[\]\)/gs,
          (match) => match.replace('[]', '[connectionType, isOnline]')
        );
        
        if (content !== originalContent) {
          fs.writeFileSync(file, content);
          console.log(`✅ Fixed React Hook dependencies in ${file}`);
        }
      }
    });
  }

  // 修复图片 alt 属性缺失问题
  fixImageAltAttributes() {
    const files = [
      'components/image-search/ImageSearch.tsx'
    ];

    files.forEach(file => {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        const originalContent = content;
        
        // 为缺失 alt 属性的 img 标签添加 alt
        content = content.replace(
          /<img([^>]*?)(?<!alt=["'][^"']*["'])>/g,
          '<img$1 alt="">'
        );
        
        if (content !== originalContent) {
          fs.writeFileSync(file, content);
          console.log(`✅ Fixed missing alt attributes in ${file}`);
        }
      }
    });
  }

  // 更新 browserslist 数据库
  updateBrowserslist() {
    try {
      console.log('🔄 Updating browserslist database...');
      execSync('npx update-browserslist-db@latest', { stdio: 'inherit' });
      console.log('✅ Updated browserslist database');
    } catch (error) {
      console.log('⚠️  Could not update browserslist database');
    }
  }

  // 修复所有剩余的类型错误
  fixRemainingTypeErrors() {
    // 搜索所有可能的类型错误
    try {
      const result = execSync('grep -r "implicitly has.*any.*type" --include="*.tsx" --include="*.ts" components/ app/ hooks/ 2>/dev/null || true', { encoding: 'utf8' });
      
      if (result.trim()) {
        console.log('🔍 Found potential type errors, fixing...');
        
        const lines = result.split('\n').filter(line => line.trim());
        const files = new Set();
        
        lines.forEach(line => {
          const match = line.match(/^([^:]+):/);
          if (match) {
            files.add(match[1]);
          }
        });
        
        files.forEach(file => {
          if (fs.existsSync(file)) {
            let content = fs.readFileSync(file, 'utf8');
            const originalContent = content;
            
            // 修复常见的隐式 any 类型错误
            content = content.replace(/\.map\(\(([^,]+), ([^)]+)\) =>/g, '.map(($1: any, $2: number) =>');
            content = content.replace(/\.forEach\(\(([^,]+), ([^)]+)\) =>/g, '.forEach(($1: any, $2: number) =>');
            content = content.replace(/\.filter\(\(([^,]+), ([^)]+)\) =>/g, '.filter(($1: any, $2: number) =>');
            
            if (content !== originalContent) {
              fs.writeFileSync(file, content);
              console.log(`✅ Fixed implicit any types in ${file}`);
            }
          }
        });
      }
    } catch (error) {
      console.log('⚠️  Could not search for type errors');
    }
  }

  // 运行所有修复
  runAllFixes() {
    console.log('🔧 开始综合修复所有构建错误...');
    
    this.fixFluxModelsComparisonTypes();
    this.fixNextConfig();
    this.fixBcryptjsCryptoIssue();
    this.fixReactHookDependencies();
    this.fixImageAltAttributes();
    this.fixRemainingTypeErrors();
    this.updateBrowserslist();
    
    console.log('\\n✨ 所有修复完成！');
    console.log('\\n🔍 运行最终构建测试...');
    
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('\\n🎉 构建成功！所有错误已修复！');
    } catch (error) {
      console.log('\\n⚠️  仍有构建错误，让我们检查详细信息...');
      
      // 尝试获取具体错误信息
      try {
        const buildOutput = execSync('npm run build 2>&1', { encoding: 'utf8' });
        const errorLines = buildOutput.split('\\n').filter(line => 
          line.includes('Type error:') || 
          line.includes('Error:') || 
          line.includes('Failed to compile')
        );
        
        if (errorLines.length > 0) {
          console.log('\\n🔍 剩余错误:');
          errorLines.slice(0, 10).forEach(line => console.log(`   ${line.trim()}`));
        }
      } catch (e) {
        console.log('   无法获取详细错误信息');
      }
    }
  }
}

// 运行修复
const fixer = new ComprehensiveBuildFixer();
fixer.runAllFixes();