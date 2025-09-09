#!/usr/bin/env node

/**
 * Import Validation Script
 * 
 * Validates all import paths across the codebase to prevent resolution errors.
 * Checks for:
 * - Broken relative imports
 * - Inconsistent path alias usage
 * - Missing files/modules
 * - Duplicate component exports
 * - Mixed JS/TS imports
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const config = {
  rootDir: path.join(__dirname, '..'),
  srcDir: path.join(__dirname, '..', 'src'),
  extensions: ['js', 'jsx', 'ts', 'tsx'],
  aliasMap: {
    '@': './src',
    '@features': './src/features',
    '@shared': './src/shared',
    '@app': './src/app',
    '@infrastructure': './src/infrastructure',
    '@components': './src/components',
    '@pages': './src/pages',
    '@hooks': './src/hooks',
    '@api': './src/api',
    '@lib': './src/lib',
    '@styles': './src/styles',
    '@types': './src/types',
    '@utils': './src/utils',
    '@services': './src/services',
    '@stores': './src/stores',
    '@contexts': './src/contexts'
  },
  ignorePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.d.ts',
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/*.spec.tsx',
    '**/*.test.tsx'
  ]
};

class ImportValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fileCache = new Map();
    this.stats = {
      totalFiles: 0,
      totalImports: 0,
      brokenImports: 0,
      inconsistentImports: 0,
      duplicateComponents: 0
    };
  }

  log(level, message, file = null, line = null) {
    const entry = {
      level,
      message,
      file: file ? path.relative(config.rootDir, file) : null,
      line
    };

    if (level === 'error') {
      this.errors.push(entry);
    } else if (level === 'warning') {
      this.warnings.push(entry);
    }

    console.log(`[${level.toUpperCase()}] ${message}${file ? ` (${entry.file}${line ? `:${line}` : ''})` : ''}`);
  }

  // Get all source files
  getSourceFiles() {
    const patterns = config.extensions.map(ext => `${config.srcDir}/**/*.${ext}`);
    let files = [];
    
    patterns.forEach(pattern => {
      files = files.concat(glob.sync(pattern, { ignore: config.ignorePatterns }));
    });
    
    return [...new Set(files)];
  }

  // Parse imports from file content
  parseImports(content, filePath) {
    const imports = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Match various import patterns
      const importPatterns = [
        /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
        /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
      ];
      
      importPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          imports.push({
            importPath: match[1],
            line: index + 1,
            fullLine: line.trim(),
            isRelative: match[1].startsWith('.'),
            isAlias: match[1].startsWith('@'),
            isNodeModule: !match[1].startsWith('.') && !match[1].startsWith('@')
          });
        }
      });
    });
    
    return imports;
  }

  // Resolve path alias to actual path
  resolveAlias(importPath) {
    for (const [alias, actualPath] of Object.entries(config.aliasMap)) {
      if (importPath.startsWith(alias)) {
        return importPath.replace(alias, actualPath);
      }
    }
    return importPath;
  }

  // Check if file exists (considering multiple extensions)
  fileExists(filePath) {
    if (this.fileCache.has(filePath)) {
      return this.fileCache.get(filePath);
    }

    // Normalize path
    const normalizedPath = path.resolve(config.rootDir, filePath);
    
    // Check exact path first
    if (fs.existsSync(normalizedPath)) {
      this.fileCache.set(filePath, true);
      return true;
    }

    // Try with different extensions
    for (const ext of config.extensions) {
      const pathWithExt = `${normalizedPath}.${ext}`;
      if (fs.existsSync(pathWithExt)) {
        this.fileCache.set(filePath, true);
        return true;
      }
    }

    // Try index files
    for (const ext of config.extensions) {
      const indexPath = path.join(normalizedPath, `index.${ext}`);
      if (fs.existsSync(indexPath)) {
        this.fileCache.set(filePath, true);
        return true;
      }
    }

    this.fileCache.set(filePath, false);
    return false;
  }

  // Validate a single import
  validateImport(importObj, filePath) {
    const { importPath, line, isRelative, isAlias, isNodeModule } = importObj;
    
    // Skip node modules
    if (isNodeModule) {
      return true;
    }

    let resolvedPath;
    
    if (isRelative) {
      // Relative import - resolve relative to current file
      const fileDir = path.dirname(filePath);
      resolvedPath = path.resolve(fileDir, importPath);
    } else if (isAlias) {
      // Alias import - resolve using alias map
      resolvedPath = path.resolve(config.rootDir, this.resolveAlias(importPath));
    } else {
      // Absolute import from src
      resolvedPath = path.resolve(config.srcDir, importPath);
    }

    // Check if resolved path exists
    const relativePath = path.relative(config.rootDir, resolvedPath);
    if (!this.fileExists(relativePath)) {
      this.log('error', `Broken import: "${importPath}" resolves to "${relativePath}" which doesn't exist`, filePath, line);
      this.stats.brokenImports++;
      return false;
    }

    return true;
  }

  // Check for import consistency issues
  checkImportConsistency(imports, filePath) {
    const relativeToSameModule = imports.filter(imp => 
      imp.isRelative && imp.importPath.includes('../')
    );
    
    const aliasToSameModule = imports.filter(imp => 
      imp.isAlias && imp.importPath.startsWith('@/')
    );

    // Check for mixed relative/alias patterns
    if (relativeToSameModule.length > 0 && aliasToSameModule.length > 0) {
      this.log('warning', 
        `Mixed import styles detected: ${relativeToSameModule.length} relative, ${aliasToSameModule.length} alias`, 
        filePath
      );
      this.stats.inconsistentImports++;
    }

    // Check for overly complex relative imports
    const complexRelativeImports = imports.filter(imp => 
      imp.isRelative && imp.importPath.split('../').length > 3
    );
    
    if (complexRelativeImports.length > 0) {
      complexRelativeImports.forEach(imp => {
        this.log('warning', `Complex relative import could use alias: "${imp.importPath}"`, filePath, imp.line);
      });
    }
  }

  // Find duplicate component definitions
  findDuplicateComponents() {
    const components = new Map();
    const files = this.getSourceFiles();
    
    files.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const exports = this.parseExports(content);
        
        exports.forEach(exportName => {
          if (!components.has(exportName)) {
            components.set(exportName, []);
          }
          components.get(exportName).push(filePath);
        });
      } catch (error) {
        this.log('warning', `Could not read file: ${error.message}`, filePath);
      }
    });

    // Report duplicates
    for (const [componentName, files] of components.entries()) {
      if (files.length > 1 && !componentName.startsWith('use')) { // Exclude hooks from duplicate check
        this.log('warning', `Duplicate component "${componentName}" found in ${files.length} files:`);
        files.forEach(file => {
          console.log(`  - ${path.relative(config.rootDir, file)}`);
        });
        this.stats.duplicateComponents++;
      }
    }
  }

  // Parse exports from file content
  parseExports(content) {
    const exports = [];
    const exportPatterns = [
      /export\s+(?:const|let|var|function|class)\s+(\w+)/g,
      /export\s+\{\s*([^}]+)\s*\}/g,
      /export\s+default\s+(\w+)/g
    ];

    exportPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1].includes(',')) {
          // Handle destructured exports
          const names = match[1].split(',').map(name => name.trim().replace(/\s+as\s+\w+/, ''));
          exports.push(...names);
        } else {
          exports.push(match[1]);
        }
      }
    });

    return [...new Set(exports)]; // Remove duplicates
  }

  // Main validation function
  async validate() {
    console.log('🔍 Starting import validation...\n');
    
    const files = this.getSourceFiles();
    this.stats.totalFiles = files.length;
    
    console.log(`Found ${files.length} source files to validate\n`);

    // Validate imports in each file
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const imports = this.parseImports(content, filePath);
        this.stats.totalImports += imports.length;

        // Validate each import
        imports.forEach(importObj => {
          this.validateImport(importObj, filePath);
        });

        // Check consistency
        this.checkImportConsistency(imports, filePath);
        
      } catch (error) {
        this.log('error', `Could not process file: ${error.message}`, filePath);
      }
    }

    // Find duplicate components
    this.findDuplicateComponents();

    // Generate report
    this.generateReport();
  }

  // Generate validation report
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 IMPORT VALIDATION REPORT');
    console.log('='.repeat(80));
    
    // Statistics
    console.log('\n📈 STATISTICS:');
    console.log(`  Total files scanned: ${this.stats.totalFiles}`);
    console.log(`  Total imports found: ${this.stats.totalImports}`);
    console.log(`  Broken imports: ${this.stats.brokenImports}`);
    console.log(`  Inconsistent imports: ${this.stats.inconsistentImports}`);
    console.log(`  Duplicate components: ${this.stats.duplicateComponents}`);
    
    // Errors summary
    if (this.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.errors.length}):`);
      this.errors.forEach(error => {
        console.log(`  - ${error.message} (${error.file}${error.line ? `:${error.line}` : ''})`);
      });
    }

    // Warnings summary
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach(warning => {
        console.log(`  - ${warning.message} (${warning.file}${warning.line ? `:${warning.line}` : ''})`);
      });
    }

    // Success message
    if (this.errors.length === 0) {
      console.log('\n✅ No critical import errors found!');
    } else {
      console.log('\n🚨 Critical import errors detected! Please fix before deployment.');
    }

    // Save detailed report
    this.saveDetailedReport();
    
    // Return exit code
    return this.errors.length > 0 ? 1 : 0;
  }

  // Save detailed JSON report
  saveDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      errors: this.errors,
      warnings: this.warnings,
      config: {
        rootDir: config.rootDir,
        srcDir: config.srcDir,
        extensions: config.extensions,
        aliasMap: config.aliasMap
      }
    };

    const reportPath = path.join(config.rootDir, 'import-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${path.relative(config.rootDir, reportPath)}`);
  }
}

// CLI execution
if (require.main === module) {
  const validator = new ImportValidator();
  validator.validate().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = ImportValidator;