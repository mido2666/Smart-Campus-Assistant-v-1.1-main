#!/usr/bin/env node

/**
 * Bundle analysis script for performance optimization
 * Analyzes bundle size and provides optimization recommendations
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundle() {
  log('🔍 Analyzing bundle size...', 'cyan');
  
  const distPath = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distPath)) {
    log('❌ Dist folder not found. Please run "npm run build" first.', 'red');
    process.exit(1);
  }

  // Analyze JavaScript files
  const jsFiles = [];
  const cssFiles = [];
  const otherFiles = [];
  
  function scanDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativeItemPath = path.join(relativePath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath, relativeItemPath);
      } else {
        const ext = path.extname(item);
        const size = stat.size;
        
        if (ext === '.js') {
          jsFiles.push({ name: relativeItemPath, size, type: 'JavaScript' });
        } else if (ext === '.css') {
          cssFiles.push({ name: relativeItemPath, size, type: 'CSS' });
        } else {
          otherFiles.push({ name: relativeItemPath, size, type: 'Other' });
        }
      }
    }
  }
  
  scanDirectory(distPath);
  
  // Sort by size (largest first)
  jsFiles.sort((a, b) => b.size - a.size);
  cssFiles.sort((a, b) => b.size - a.size);
  otherFiles.sort((a, b) => b.size - a.size);
  
  // Calculate totals
  const totalJsSize = jsFiles.reduce((sum, file) => sum + file.size, 0);
  const totalCssSize = cssFiles.reduce((sum, file) => sum + file.size, 0);
  const totalOtherSize = otherFiles.reduce((sum, file) => sum + file.size, 0);
  const totalSize = totalJsSize + totalCssSize + totalOtherSize;
  
  // Display results
  log('\n📊 Bundle Analysis Results', 'bright');
  log('=' .repeat(50), 'blue');
  
  log(`\n📦 Total Bundle Size: ${formatBytes(totalSize)}`, 'green');
  log(`   JavaScript: ${formatBytes(totalJsSize)} (${((totalJsSize / totalSize) * 100).toFixed(1)}%)`, 'yellow');
  log(`   CSS: ${formatBytes(totalCssSize)} (${((totalCssSize / totalSize) * 100).toFixed(1)}%)`, 'yellow');
  log(`   Other: ${formatBytes(totalOtherSize)} (${((totalOtherSize / totalSize) * 100).toFixed(1)}%)`, 'yellow');
  
  // JavaScript files analysis
  log('\n📄 JavaScript Files (Top 10):', 'cyan');
  log('-'.repeat(60), 'blue');
  jsFiles.slice(0, 10).forEach((file, index) => {
    const percentage = ((file.size / totalJsSize) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(percentage / 2));
    log(`${(index + 1).toString().padStart(2)}. ${file.name.padEnd(30)} ${formatBytes(file.size).padStart(10)} ${percentage.padStart(5)}% ${bar}`, 'white');
  });
  
  // CSS files analysis
  if (cssFiles.length > 0) {
    log('\n🎨 CSS Files:', 'cyan');
    log('-'.repeat(60), 'blue');
    cssFiles.forEach((file, index) => {
      const percentage = ((file.size / totalCssSize) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(percentage / 2));
      log(`${(index + 1).toString().padStart(2)}. ${file.name.padEnd(30)} ${formatBytes(file.size).padStart(10)} ${percentage.padStart(5)}% ${bar}`, 'white');
    });
  }
  
  // Other files analysis
  if (otherFiles.length > 0) {
    log('\n📁 Other Files (Top 5):', 'cyan');
    log('-'.repeat(60), 'blue');
    otherFiles.slice(0, 5).forEach((file, index) => {
      const percentage = ((file.size / totalOtherSize) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(percentage / 2));
      log(`${(index + 1).toString().padStart(2)}. ${file.name.padEnd(30)} ${formatBytes(file.size).padStart(10)} ${percentage.padStart(5)}% ${bar}`, 'white');
    });
  }
  
  // Performance recommendations
  log('\n💡 Optimization Recommendations:', 'magenta');
  log('=' .repeat(50), 'blue');
  
  const recommendations = [];
  
  // Check for large JavaScript files
  const largeJsFiles = jsFiles.filter(file => file.size > 500 * 1024); // 500KB
  if (largeJsFiles.length > 0) {
    recommendations.push(`⚠️  Large JavaScript files detected (>500KB): ${largeJsFiles.map(f => f.name).join(', ')}`);
    recommendations.push('   Consider code splitting or lazy loading for these files.');
  }
  
  // Check for large CSS files
  const largeCssFiles = cssFiles.filter(file => file.size > 100 * 1024); // 100KB
  if (largeCssFiles.length > 0) {
    recommendations.push(`⚠️  Large CSS files detected (>100KB): ${largeCssFiles.map(f => f.name).join(', ')}`);
    recommendations.push('   Consider CSS purging or splitting stylesheets.');
  }
  
  // Check total bundle size
  if (totalSize > 2 * 1024 * 1024) { // 2MB
    recommendations.push('⚠️  Total bundle size is large (>2MB). Consider:');
    recommendations.push('   - Implementing more aggressive code splitting');
    recommendations.push('   - Using dynamic imports for non-critical features');
    recommendations.push('   - Optimizing images and assets');
  }
  
  // Check for too many chunks
  if (jsFiles.length > 20) {
    recommendations.push('⚠️  Many JavaScript chunks detected. Consider:');
    recommendations.push('   - Consolidating smaller chunks');
    recommendations.push('   - Using more strategic chunk splitting');
  }
  
  // Check for unused dependencies
  recommendations.push('🔍 Consider analyzing unused dependencies:');
  recommendations.push('   - Run "npm run analyze:deps" to find unused packages');
  recommendations.push('   - Use bundle analyzer tools like webpack-bundle-analyzer');
  
  if (recommendations.length === 0) {
    log('✅ Bundle looks well optimized!', 'green');
  } else {
    recommendations.forEach(rec => log(rec, 'yellow'));
  }
  
  // Performance score
  let score = 100;
  if (totalSize > 2 * 1024 * 1024) score -= 20;
  if (largeJsFiles.length > 0) score -= 15;
  if (largeCssFiles.length > 0) score -= 10;
  if (jsFiles.length > 20) score -= 10;
  if (totalSize < 500 * 1024) score += 10; // Bonus for small bundles
  
  const scoreColor = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
  log(`\n🏆 Performance Score: ${score}/100`, scoreColor);
  
  // Generate report file
  const report = {
    timestamp: new Date().toISOString(),
    totalSize,
    totalJsSize,
    totalCssSize,
    totalOtherSize,
    jsFiles: jsFiles.map(f => ({ name: f.name, size: f.size })),
    cssFiles: cssFiles.map(f => ({ name: f.name, size: f.size })),
    otherFiles: otherFiles.map(f => ({ name: f.name, size: f.size })),
    recommendations,
    score,
  };
  
  const reportPath = path.join(__dirname, '..', 'bundle-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 Detailed report saved to: ${reportPath}`, 'cyan');
  
  return report;
}

// Run analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    analyzeBundle();
  } catch (error) {
    log(`❌ Error during analysis: ${error.message}`, 'red');
    process.exit(1);
  }
}

export { analyzeBundle };
