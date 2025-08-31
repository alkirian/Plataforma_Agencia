#!/usr/bin/env node
/**
 * Professional Console.log Cleanup Script
 */

const fs = require('fs');
const path = require('path');

class ConsoleLogCleaner {
  constructor() {
    this.stats = {
      totalFiles: 0,
      converted: 0,
      removed: 0
    };
  }

  async run(directory) {
    console.log('🧹 Starting console.log cleanup...\n');
    
    const files = this.findJavaScriptFiles(directory);
    console.log(`📁 Found ${files.length} files\n`);

    for (const file of files) {
      await this.processFile(file);
    }

    this.printReport();
    return this.stats;
  }

  findJavaScriptFiles(directory) {
    const files = [];
    
    const traverse = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(item)) {
          traverse(itemPath);
        } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(item)) {
          files.push(itemPath);
        }
      }
    };
    
    traverse(directory);
    return files;
  }

  async processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      let hasChanges = false;
      let fileStats = { converted: 0, removed: 0 };

      // Check if we need to add logger import
      const needsLogger = /console\.(log|info|debug|warn|error)/.test(content);
      const hasLoggerImport = content.includes('from \'../utils/logger\'') || 
                             content.includes('from \'../../utils/logger\'') ||
                             content.includes('from \'./utils/logger\'');

      if (needsLogger && !hasLoggerImport) {
        const relativePath = this.getLoggerImportPath(filePath);
        const importStatement = `import logger from '${relativePath}';`;
        
        const lines = content.split('\n');
        let insertIndex = 0;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ') || (lines[i].trim().startsWith('const ') && lines[i].includes('require'))) {
            insertIndex = i + 1;
          } else if (lines[i].trim() && !lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('/*')) {
            break;
          }
        }
        
        lines.splice(insertIndex, 0, importStatement);
        content = lines.join('\n');
        hasChanges = true;
      }

      // Context-specific replacements
      const contexts = {
        api: {
          pattern: /console\.log\([^)]*\[API[^\]]*\][^)]*\)/gi,
          replacement: (match) => match.replace('console.log', 'logger.api')
        },
        auth: {
          pattern: /console\.log\([^)]*\[AUTH[^\]]*\][^)]*\)/gi,
          replacement: (match) => match.replace('console.log', 'logger.auth')
        },
        boot: {
          pattern: /console\.log\([^)]*\[BOOT[^\]]*\][^)]*\)/gi,
          replacement: (match) => match.replace('console.log', 'logger.boot')
        },
        profile: {
          pattern: /console\.log\([^)]*\[PROFILE[^\]]*\][^)]*\)/gi,
          replacement: (match) => match.replace('console.log', 'logger.profile')
        },
        agency: {
          pattern: /console\.log\([^)]*\[AGENCY[^\]]*\][^)]*\)/gi,
          replacement: (match) => match.replace('console.log', 'logger.agency')
        },
        callback: {
          pattern: /console\.log\([^)]*\[CALLBACK[^\]]*\][^)]*\)/gi,
          replacement: (match) => match.replace('console.log', 'logger.callback')
        },
        authguard: {
          pattern: /console\.log\([^)]*\[AUTHGUARD[^\]]*\][^)]*\)/gi,
          replacement: (match) => match.replace('console.log', 'logger.authGuard')
        }
      };

      // Apply context-specific replacements
      for (const [contextName, contextConfig] of Object.entries(contexts)) {
        const matches = content.match(contextConfig.pattern);
        if (matches) {
          content = content.replace(contextConfig.pattern, (match) => {
            fileStats.converted++;
            return contextConfig.replacement(match);
          });
          hasChanges = true;
        }
      }

      // Convert remaining console methods
      content = content.replace(/console\.error\(/g, (match) => {
        fileStats.converted++;
        return 'logger.error(';
      });
      
      content = content.replace(/console\.warn\(/g, (match) => {
        fileStats.converted++;
        return 'logger.warn(';
      });

      content = content.replace(/console\.info\(/g, (match) => {
        fileStats.converted++;
        return 'logger.info(';
      });

      // Handle remaining console.log
      content = content.replace(/console\.log\(/g, (match, offset) => {
        const surrounding = content.substring(Math.max(0, offset - 100), offset + 100);
        
        if (surrounding.includes('catch') || surrounding.includes('error') || surrounding.includes('Error')) {
          fileStats.converted++;
          hasChanges = true;
          return 'logger.error(';
        }
        
        fileStats.converted++;
        hasChanges = true;
        return 'logger.debug(';
      });

      // Remove commented console.logs
      content = content.replace(/\/\/\s*console\.(log|warn|error|info|debug)[^;\n]*/g, (match) => {
        fileStats.removed++;
        hasChanges = true;
        return '// [Removed console.log]';
      });

      if (hasChanges) {
        this.stats.totalFiles++;
        this.stats.converted += fileStats.converted;
        this.stats.removed += fileStats.removed;

        fs.writeFileSync(filePath, content, 'utf8');

        const relativePath = path.relative(process.cwd(), filePath);
        console.log(`✨ ${relativePath}`);
        console.log(`   📊 Converted: ${fileStats.converted}, Removed: ${fileStats.removed}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  getLoggerImportPath(filePath) {
    const depth = filePath.split(path.sep).length - path.resolve('frontend/src').split(path.sep).length;
    const upDirs = '../'.repeat(Math.max(1, depth - 1));
    return `${upDirs}utils/logger`;
  }

  printReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📈 CLEANUP REPORT');
    console.log('='.repeat(50));
    console.log(`🗂️  Files processed: ${this.stats.totalFiles}`);
    console.log(`📝 Console.logs converted: ${this.stats.converted}`);
    console.log(`🗑️  Console.logs removed: ${this.stats.removed}`);
    console.log(`🎯 Total improvements: ${this.stats.converted + this.stats.removed}`);
    console.log('\n✅ Cleanup completed successfully!');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const directory = args[0] || './frontend/src';
  
  if (!fs.existsSync(directory)) {
    console.error(`❌ Directory not found: ${directory}`);
    process.exit(1);
  }

  const cleaner = new ConsoleLogCleaner();
  
  try {
    await cleaner.run(directory);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ConsoleLogCleaner;