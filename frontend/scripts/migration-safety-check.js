#!/usr/bin/env node

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { join, extname, relative, dirname } from 'path'
import { execSync } from 'child_process'

/**
 * Migration Safety Check System
 * Validates TypeScript migration progress and prevents breaking changes
 */

class MigrationSafetyChecker {
  constructor(srcDir = './src') {
    this.srcDir = srcDir
    this.migrationProgress = {
      total: 0,
      migrated: 0,
      inProgress: 0,
      pending: 0,
      errors: [],
      warnings: []
    }
    this.breakingChanges = []
    this.rollbackPlan = []
    this.compatibility = {
      jsFiles: [],
      tsFiles: [],
      mixedImports: [],
      typeErrors: []
    }
  }

  /**
   * Run complete migration safety analysis
   */
  async analyze() {
    console.log('🔍 Running migration safety analysis...')
    
    try {
      // 1. Analyze current file state
      this.analyzeFileStructure()
      
      // 2. Check TypeScript compatibility
      await this.checkTypeScriptCompatibility()
      
      // 3. Validate import/export compatibility
      this.checkImportExportCompatibility()
      
      // 4. Check for breaking changes
      this.detectBreakingChanges()
      
      // 5. Validate build compatibility
      await this.checkBuildCompatibility()
      
      // 6. Generate migration report
      this.generateMigrationReport()
      
      // 7. Create rollback plan
      this.createRollbackPlan()
      
      return this.migrationProgress
      
    } catch (error) {
      console.error('❌ Migration analysis failed:', error)
      throw error
    }
  }

  /**
   * Analyze current file structure and migration progress
   */
  analyzeFileStructure() {
    console.log('📁 Analyzing file structure...')
    
    const files = this.getAllSourceFiles()
    this.migrationProgress.total = files.length

    for (const file of files) {
      const ext = extname(file)
      const content = readFileSync(file, 'utf-8')
      
      if (ext === '.ts' || ext === '.tsx') {
        this.migrationProgress.migrated++
        this.compatibility.tsFiles.push(file)
        
        // Check if TS file has any JS-style patterns
        if (this.hasJavaScriptPatterns(content)) {
          this.migrationProgress.warnings.push({
            type: 'js_patterns_in_ts',
            file: relative(process.cwd(), file),
            message: 'TypeScript file contains JavaScript patterns that should be modernized'
          })
        }
      } else if (ext === '.js' || ext === '.jsx') {
        // Check if JS file is ready for migration
        const migrationReadiness = this.assessMigrationReadiness(content, file)
        
        if (migrationReadiness.ready) {
          this.migrationProgress.inProgress++
        } else {
          this.migrationProgress.pending++
        }
        
        this.compatibility.jsFiles.push({
          file: relative(process.cwd(), file),
          readiness: migrationReadiness
        })
      }
    }
  }

  /**
   * Check TypeScript compilation compatibility
   */
  async checkTypeScriptCompatibility() {
    console.log('🔧 Checking TypeScript compatibility...')
    
    try {
      // Check with regular tsconfig
      const regularCheck = await this.runTypeScriptCheck('./tsconfig.json')
      
      // Check with strict tsconfig
      const strictCheck = await this.runTypeScriptCheck('./tsconfig.production.json')
      
      this.migrationProgress.typeErrors = {
        regular: regularCheck.errors,
        strict: strictCheck.errors
      }
      
      if (strictCheck.errors.length > 0) {
        this.migrationProgress.warnings.push({
          type: 'strict_mode_errors',
          message: `${strictCheck.errors.length} errors in strict mode`,
          details: strictCheck.errors.slice(0, 5) // Show first 5
        })
      }
      
    } catch (error) {
      this.migrationProgress.errors.push({
        type: 'typescript_check_failed',
        message: error.message
      })
    }
  }

  /**
   * Check import/export compatibility between JS and TS files
   */
  checkImportExportCompatibility() {
    console.log('🔄 Checking import/export compatibility...')
    
    const allFiles = [...this.compatibility.jsFiles.map(f => f.file), ...this.compatibility.tsFiles]
    
    for (const filePath of allFiles) {
      const content = readFileSync(join(process.cwd(), filePath), 'utf-8')
      const imports = this.extractImports(content)
      
      for (const importPath of imports) {
        const resolved = this.resolveImportPath(importPath, filePath)
        
        if (resolved && this.isCrossPlatformImport(filePath, resolved)) {
          this.compatibility.mixedImports.push({
            from: filePath,
            to: resolved,
            importPath
          })
        }
      }
    }
  }

  /**
   * Detect potential breaking changes
   */
  detectBreakingChanges() {
    console.log('⚠️  Detecting breaking changes...')
    
    // Check for common breaking change patterns
    const breakingPatterns = [
      {
        pattern: /PropTypes\./g,
        severity: 'high',
        message: 'PropTypes usage detected - migrate to TypeScript interfaces'
      },
      {
        pattern: /defaultProps\s*=/g,
        severity: 'medium', 
        message: 'defaultProps usage - consider default parameters instead'
      },
      {
        pattern: /\.propTypes\s*=/g,
        severity: 'medium',
        message: 'Component.propTypes - migrate to TypeScript props interface'
      },
      {
        pattern: /require\s*\(/g,
        severity: 'low',
        message: 'CommonJS require() - should migrate to ES6 imports'
      },
      {
        pattern: /module\.exports/g,
        severity: 'medium',
        message: 'CommonJS exports - should migrate to ES6 exports'
      }
    ]

    for (const jsFile of this.compatibility.jsFiles) {
      const content = readFileSync(join(process.cwd(), jsFile.file), 'utf-8')
      
      for (const { pattern, severity, message } of breakingPatterns) {
        const matches = content.match(pattern)
        if (matches) {
          this.breakingChanges.push({
            file: jsFile.file,
            severity,
            pattern: pattern.source,
            message,
            occurrences: matches.length
          })
        }
      }
    }
  }

  /**
   * Check build compatibility with current migration state
   */
  async checkBuildCompatibility() {
    console.log('🏗️  Checking build compatibility...')
    
    try {
      // Test JavaScript build
      execSync('npm run build:js', { stdio: 'pipe', cwd: process.cwd() })
      
      // Test TypeScript build if possible
      try {
        execSync('npm run type-check', { stdio: 'pipe', cwd: process.cwd() })
      } catch (typeError) {
        this.migrationProgress.errors.push({
          type: 'type_check_failed',
          message: 'TypeScript type checking failed',
          details: typeError.message
        })
      }
      
    } catch (buildError) {
      this.migrationProgress.errors.push({
        type: 'build_failed',
        message: 'Build process failed',
        details: buildError.message
      })
    }
  }

  /**
   * Generate comprehensive migration report
   */
  generateMigrationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      progress: {
        total: this.migrationProgress.total,
        migrated: this.migrationProgress.migrated,
        inProgress: this.migrationProgress.inProgress, 
        pending: this.migrationProgress.pending,
        percentage: Math.round((this.migrationProgress.migrated / this.migrationProgress.total) * 100)
      },
      compatibility: this.compatibility,
      breakingChanges: this.breakingChanges,
      errors: this.migrationProgress.errors,
      warnings: this.migrationProgress.warnings,
      recommendations: this.generateRecommendations()
    }

    // Write detailed report
    writeFileSync('migration-report.json', JSON.stringify(report, null, 2))
    
    // Console summary
    this.printMigrationSummary(report)
  }

  /**
   * Create rollback plan for failed migrations
   */
  createRollbackPlan() {
    this.rollbackPlan = [
      {
        step: 'Backup current state',
        command: 'git stash push -m "Pre-migration backup"',
        description: 'Save current changes before rollback'
      },
      {
        step: 'Reset to last stable state',
        command: 'git reset --hard HEAD~1',
        description: 'Revert to previous commit'
      },
      {
        step: 'Clean build artifacts',
        command: 'npm run clean && npm install',
        description: 'Clean up any corrupted build state'
      },
      {
        step: 'Verify functionality',
        command: 'npm run dev',
        description: 'Start development server to verify rollback'
      }
    ]

    writeFileSync('rollback-plan.json', JSON.stringify(this.rollbackPlan, null, 2))
  }

  /**
   * Helper methods
   */

  getAllSourceFiles() {
    const files = []
    const traverse = (dir) => {
      const items = readdirSync(dir)
      for (const item of items) {
        const fullPath = join(dir, item)
        const stat = statSync(fullPath)
        if (stat.isDirectory() && !['node_modules', 'dist', 'build'].includes(item)) {
          traverse(fullPath)
        } else if (['.js', '.jsx', '.ts', '.tsx'].includes(extname(fullPath))) {
          files.push(fullPath)
        }
      }
    }
    traverse(this.srcDir)
    return files
  }

  hasJavaScriptPatterns(content) {
    const jsPatterns = [
      /var\s+\w+/g,
      /function\s+\w+\s*\(/g,
      /\.propTypes\s*=/g,
      /PropTypes\./g,
      /require\s*\(/g,
      /module\.exports/g
    ]
    return jsPatterns.some(pattern => pattern.test(content))
  }

  assessMigrationReadiness(content, file) {
    const issues = []
    const warnings = []

    // Check for React imports
    if (!content.includes('import React') && content.includes('React.')) {
      issues.push('Missing React import')
    }

    // Check for PropTypes
    if (content.includes('PropTypes')) {
      issues.push('Uses PropTypes - needs interface migration')
    }

    // Check for CommonJS
    if (content.includes('require(') || content.includes('module.exports')) {
      issues.push('Uses CommonJS - needs ES6 migration')
    }

    // Check for var declarations
    if (content.match(/var\s+\w+/g)) {
      warnings.push('Uses var declarations')
    }

    return {
      ready: issues.length === 0,
      issues,
      warnings,
      complexity: this.calculateComplexity(content)
    }
  }

  calculateComplexity(content) {
    const lines = content.split('\n').length
    const functions = (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length
    const components = (content.match(/const\s+[A-Z]\w*\s*=|function\s+[A-Z]\w*/g) || []).length
    
    return { lines, functions, components }
  }

  async runTypeScriptCheck(configPath) {
    try {
      execSync(`npx tsc --noEmit --project ${configPath}`, { stdio: 'pipe' })
      return { success: true, errors: [] }
    } catch (error) {
      const output = error.stdout ? error.stdout.toString() : error.message
      const errors = this.parseTypeScriptErrors(output)
      return { success: false, errors }
    }
  }

  parseTypeScriptErrors(output) {
    const lines = output.split('\n')
    const errors = []
    
    for (const line of lines) {
      const errorMatch = line.match(/(.+\.tsx?)\((\d+),(\d+)\):\s*error\s*TS(\d+):\s*(.+)/)
      if (errorMatch) {
        errors.push({
          file: errorMatch[1],
          line: parseInt(errorMatch[2]),
          column: parseInt(errorMatch[3]),
          code: errorMatch[4],
          message: errorMatch[5]
        })
      }
    }
    
    return errors
  }

  extractImports(content) {
    const imports = []
    const importRegex = /import\s+.+\s+from\s+['"]([^'"]+)['"]/g
    let match
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1])
    }
    
    return imports
  }

  resolveImportPath(importPath, fromFile) {
    // Simple resolution - in real implementation would use more sophisticated logic
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const fromDir = dirname(fromFile)
      const resolved = join(fromDir, importPath)
      return resolved
    }
    return null
  }

  isCrossPlatformImport(fromFile, toFile) {
    const fromExt = extname(fromFile)
    const toExt = extname(toFile)
    
    const jsExtensions = ['.js', '.jsx']
    const tsExtensions = ['.ts', '.tsx']
    
    return (
      (jsExtensions.includes(fromExt) && tsExtensions.includes(toExt)) ||
      (tsExtensions.includes(fromExt) && jsExtensions.includes(toExt))
    )
  }

  generateRecommendations() {
    const recommendations = []
    
    if (this.migrationProgress.pending > 0) {
      recommendations.push({
        priority: 'high',
        action: 'migrate_pending_files',
        message: `Migrate ${this.migrationProgress.pending} pending JavaScript files to TypeScript`,
        files: this.compatibility.jsFiles.filter(f => !f.readiness.ready).map(f => f.file)
      })
    }

    if (this.breakingChanges.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'fix_breaking_changes',
        message: `Address ${this.breakingChanges.length} potential breaking changes`,
        details: this.breakingChanges
      })
    }

    if (this.compatibility.mixedImports.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'resolve_mixed_imports',
        message: `Resolve ${this.compatibility.mixedImports.length} cross-platform imports`,
        details: this.compatibility.mixedImports
      })
    }

    return recommendations
  }

  printMigrationSummary(report) {
    console.log('\n📋 MIGRATION SAFETY REPORT')
    console.log('=' .repeat(50))
    
    console.log(`\n📊 Progress: ${report.progress.percentage}% complete`)
    console.log(`✅ Migrated: ${report.progress.migrated} files`)
    console.log(`🔄 In Progress: ${report.progress.inProgress} files`)
    console.log(`⏳ Pending: ${report.progress.pending} files`)
    
    if (report.errors.length > 0) {
      console.log(`\n❌ Errors: ${report.errors.length}`)
      report.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.type}: ${error.message}`)
      })
    }
    
    if (report.warnings.length > 0) {
      console.log(`\n⚠️  Warnings: ${report.warnings.length}`)
      report.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning.type}: ${warning.message}`)
      })
    }

    if (report.breakingChanges.length > 0) {
      console.log(`\n🚨 Breaking Changes: ${report.breakingChanges.length}`)
      const highSeverity = report.breakingChanges.filter(c => c.severity === 'high')
      if (highSeverity.length > 0) {
        console.log(`   High severity: ${highSeverity.length}`)
      }
    }

    console.log(`\n📄 Full report: migration-report.json`)
    console.log(`🔄 Rollback plan: rollback-plan.json`)
    
    // Safety assessment
    const safetyScore = this.calculateSafetyScore(report)
    console.log(`\n🛡️  Migration Safety Score: ${safetyScore}/100`)
    
    if (safetyScore >= 80) {
      console.log('✅ Migration appears safe to continue')
    } else if (safetyScore >= 60) {
      console.log('⚠️  Migration has some risks - proceed with caution')
    } else {
      console.log('❌ Migration is high risk - address issues before proceeding')
    }
  }

  calculateSafetyScore(report) {
    let score = 100
    
    // Penalize errors
    score -= report.errors.length * 15
    
    // Penalize high severity breaking changes
    const highSeverityChanges = report.breakingChanges.filter(c => c.severity === 'high').length
    score -= highSeverityChanges * 10
    
    // Penalize medium severity breaking changes
    const mediumSeverityChanges = report.breakingChanges.filter(c => c.severity === 'medium').length
    score -= mediumSeverityChanges * 5
    
    // Penalize mixed imports
    score -= Math.min(report.compatibility.mixedImports.length * 2, 20)
    
    // Bonus for high migration completion
    if (report.progress.percentage > 80) {
      score += 10
    }
    
    return Math.max(0, Math.min(100, score))
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new MigrationSafetyChecker()
  
  checker.analyze().then(result => {
    const safetyScore = checker.calculateSafetyScore({
      errors: result.errors,
      warnings: result.warnings,
      breakingChanges: checker.breakingChanges,
      compatibility: checker.compatibility,
      progress: {
        percentage: Math.round((result.migrated / result.total) * 100)
      }
    })
    
    if (safetyScore < 60) {
      console.log('\n❌ Migration safety check failed')
      process.exit(1)
    }
    
    console.log('\n✅ Migration safety check passed')
  }).catch(error => {
    console.error('❌ Migration safety check failed:', error)
    process.exit(1)
  })
}

export default MigrationSafetyChecker