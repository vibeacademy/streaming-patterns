#!/usr/bin/env node
/* eslint-env node */
/**
 * Bundle Size Check Script
 *
 * Analyzes dist/ directory and reports bundle sizes against configured budgets.
 * Run after `npm run build` to verify bundle sizes are within limits.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Budget configuration (in bytes)
const BUDGETS = {
  'vendor': { limit: 150 * 1024, gzipped: true, pattern: /vendor-.*\.js$/ },
  'router': { limit: 40 * 1024, gzipped: true, pattern: /router-.*\.js$/ },
  'main': { limit: 30 * 1024, gzipped: true, pattern: /index-.*\.js$/ },
  'pattern-chunks': { limit: 40 * 1024, gzipped: true, pattern: /ChainOfReasoning.*\.js$/ },
  'total-js': { limit: 250 * 1024, gzipped: true, type: 'js' },
  'total-css': { limit: 50 * 1024, gzipped: true, type: 'css' },
};

/**
 * Get file size (optionally gzipped)
 */
async function getFileSize(filePath, gzipped = false) {
  const content = fs.readFileSync(filePath);
  if (gzipped) {
    const compressed = await gzipAsync(content);
    return compressed.length;
  }
  return content.length;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Get all files in directory recursively
 */
function getAllFiles(dir, ext) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, ext));
    } else if (item.endsWith(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Main analysis function
 */
async function analyzeBundle() {
  const distDir = path.join(__dirname, '..', 'dist');

  if (!fs.existsSync(distDir)) {
    console.error('❌ Error: dist/ directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  console.log('📊 Bundle Size Analysis\n');
  console.log('=' .repeat(70));

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Check individual chunk budgets
  for (const [name, budget] of Object.entries(BUDGETS)) {
    if (budget.pattern) {
      const files = getAllFiles(path.join(distDir, 'assets'), '.js')
        .filter(f => budget.pattern.test(path.basename(f)));

      for (const file of files) {
        const size = await getFileSize(file, budget.gzipped);
        const limit = budget.limit;
        const percentage = (size / limit * 100).toFixed(1);
        const status = size <= limit ? '✅' : '❌';
        const fileName = path.basename(file);

        console.log(`\n${name.toUpperCase()}: ${fileName}`);
        console.log(`  Size: ${formatBytes(size)} ${budget.gzipped ? '(gzipped)' : ''}`);
        console.log(`  Limit: ${formatBytes(limit)}`);
        console.log(`  Usage: ${percentage}%`);
        console.log(`  Status: ${status} ${size <= limit ? 'PASS' : 'FAIL'}`);

        if (size <= limit) {
          results.passed.push({ name, size, limit });
        } else {
          results.failed.push({ name, size, limit, file: fileName });
        }

        // Warning at 90% budget
        if (size > limit * 0.9 && size <= limit) {
          results.warnings.push({ name, size, limit, percentage });
        }
      }
    } else if (budget.type) {
      // Check total size for type
      const ext = `.${budget.type}`;
      const files = getAllFiles(path.join(distDir, 'assets'), ext);
      let totalSize = 0;

      for (const file of files) {
        const size = await getFileSize(file, budget.gzipped);
        totalSize += size;
      }

      const limit = budget.limit;
      const percentage = (totalSize / limit * 100).toFixed(1);
      const status = totalSize <= limit ? '✅' : '❌';

      console.log(`\n${name.toUpperCase()}`);
      console.log(`  Total Size: ${formatBytes(totalSize)} ${budget.gzipped ? '(gzipped)' : ''}`);
      console.log(`  Limit: ${formatBytes(limit)}`);
      console.log(`  Usage: ${percentage}%`);
      console.log(`  Files: ${files.length}`);
      console.log(`  Status: ${status} ${totalSize <= limit ? 'PASS' : 'FAIL'}`);

      if (totalSize <= limit) {
        results.passed.push({ name, size: totalSize, limit });
      } else {
        results.failed.push({ name, size: totalSize, limit });
      }

      if (totalSize > limit * 0.9 && totalSize <= limit) {
        results.warnings.push({ name, size: totalSize, limit, percentage });
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 Summary\n');
  console.log(`  Checks Passed: ${results.passed.length}`);
  console.log(`  Checks Failed: ${results.failed.length}`);
  console.log(`  Warnings: ${results.warnings.length}`);

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings (>90% budget):');
    for (const warning of results.warnings) {
      console.log(`  - ${warning.name}: ${warning.percentage}% of budget`);
    }
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Checks:');
    for (const fail of results.failed) {
      const overage = fail.size - fail.limit;
      console.log(`  - ${fail.name}: ${formatBytes(overage)} over budget`);
      if (fail.file) {
        console.log(`    File: ${fail.file}`);
      }
    }
    console.log('\n💡 Tip: Consider code splitting, tree shaking, or removing unused dependencies.');
    process.exit(1);
  }

  console.log('\n✅ All bundle size checks passed!\n');
  process.exit(0);
}

// Run analysis
analyzeBundle().catch(error => {
  console.error('❌ Error analyzing bundle:', error);
  process.exit(1);
});
