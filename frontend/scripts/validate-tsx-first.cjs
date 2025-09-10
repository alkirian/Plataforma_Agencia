#!/usr/bin/env node

/**
 * TSX-First Validation Script
 * Validates adherence to TSX-first development standards
 * Phase 3 Governance Tool
 */

const fs = require('fs')
const path = require('path')

// __dirname is already available in CommonJS

// Configuration
const CONFIG = {
  srcDir: path.resolve(__dirname, '../src'),
  sharedDirs: ['src/shared/components', 'src/components'],
  excludeDirs: ['node_modules', 'dist', 'build', '.git'],
  violations: {
    CRITICAL: 'CRITICAL', // JSX in shared components
    WARNING: 'WARNING',   // JSX in feature components
    INFO: 'INFO'          // General recommendations
  }
}

class TSXFirstValidator {
  constructor() {
    this.violations = []
    this.stats = {
      totalJSX: 0,
      totalTSX: 0,
      sharedJSX: 0,
      featureJSX: 0,
      criticalViolations: 0,
      warnings: 0
    }
  }

  findFiles(dir, extensions = ['.jsx', '.tsx'], files = []) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        const relativePath = path.relative(CONFIG.srcDir, fullPath)
        
        if (entry.isDirectory() && !CONFIG.excludeDirs.includes(entry.name)) {
          this.findFiles(fullPath, extensions, files)
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push({
            fullPath,
            relativePath,
            name: entry.name,
            extension: path.extname(entry.name)
          })
        }
      }
    } catch (error) {
      console.warn(`⚠️  Cannot read directory: ${dir}`)
    }
    
    return files
  }

  isSharedComponent(filePath) {
    return CONFIG.sharedDirs.some(dir => 
      filePath.includes(dir.replace('src/', ''))
    )
  }

  isFeatureComponent(filePath) {
    return filePath.includes('features/') && filePath.includes('components/')
  }

  analyzeFile(file) {
    const isJSX = file.extension === '.jsx'
    const isTSX = file.extension === '.tsx'

    // Update statistics
    if (isJSX) this.stats.totalJSX++
    if (isTSX) this.stats.totalTSX++

    // Check violations
    if (isJSX) {
      if (this.isSharedComponent(file.relativePath)) {
        this.stats.sharedJSX++
        this.stats.criticalViolations++
        this.violations.push({
          type: CONFIG.violations.CRITICAL,
          file: file.relativePath,
          message: 'JSX file in shared components directory - MUST be TSX',
          rule: 'TSX_FIRST_SHARED_COMPONENTS',
          priority: 1
        })
      } else if (this.isFeatureComponent(file.relativePath)) {
        this.stats.featureJSX++
        this.stats.warnings++
        this.violations.push({
          type: CONFIG.violations.WARNING,
          file: file.relativePath,
          message: 'JSX file in feature components - SHOULD be TSX',
          rule: 'TSX_FIRST_FEATURE_COMPONENTS',
          priority: 2
        })
      } else {
        // Other JSX files (pages, etc.)
        this.violations.push({
          type: CONFIG.violations.INFO,
          file: file.relativePath,
          message: 'Consider migrating to TSX for better type safety',
          rule: 'TSX_FIRST_GENERAL',
          priority: 3
        })
      }
    }

    return { isJSX, isTSX }
  }

  checkForTypedProps(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Simple heuristics to check for proper typing
      const hasInterface = /interface\s+\w+Props/.test(content)
      const hasTypeAnnotation = /:\s*React\.FC</.test(content) || /:\s*FC</.test(content)
      const hasPropsSpread = /\{\s*\.\.\.props\s*\}/.test(content)
      
      return {
        hasInterface,
        hasTypeAnnotation,
        hasPropsSpread,
        score: (hasInterface ? 1 : 0) + (hasTypeAnnotation ? 1 : 0) + (hasPropsSpread ? 0.5 : 0)
      }
    } catch (error) {
      return { hasInterface: false, hasTypeAnnotation: false, hasPropsSpread: false, score: 0 }
    }
  }

  generateReport() {
    const total = this.stats.totalJSX + this.stats.totalTSX
    const tsxPercentage = total > 0 ? ((this.stats.totalTSX / total) * 100).toFixed(1) : 0

    console.log('\n📊 TSX-First Validation Report')
    console.log('='.repeat(50))
    
    // Statistics Summary
    console.log('\n📈 Statistics:')
    console.log(`   Total Components: ${total}`)
    console.log(`   TSX Files: ${this.stats.totalTSX} (${tsxPercentage}%)`)
    console.log(`   JSX Files: ${this.stats.totalJSX} (${(100 - tsxPercentage).toFixed(1)}%)`)
    console.log(`   
   🎯 TSX Adoption: ${tsxPercentage}% ${tsxPercentage >= 80 ? '✅' : tsxPercentage >= 60 ? '⚠️' : '❌'}`)

    // Violation Summary
    console.log(`\n🚨 Violations:`)
    console.log(`   Critical: ${this.stats.criticalViolations} (JSX in shared components)`)
    console.log(`   Warnings: ${this.stats.warnings} (JSX in features)`)
    console.log(`   Total: ${this.violations.length}`)

    // Critical Violations (must fix)
    const criticalViolations = this.violations.filter(v => v.type === CONFIG.violations.CRITICAL)
    if (criticalViolations.length > 0) {
      console.log('\n🔴 CRITICAL VIOLATIONS (Must Fix):')
      criticalViolations.forEach(violation => {
        console.log(`   ❌ ${violation.file}`)
        console.log(`      ${violation.message}`)
      })
    }

    // Warnings (should fix)
    const warnings = this.violations.filter(v => v.type === CONFIG.violations.WARNING)
    if (warnings.length > 0 && warnings.length <= 10) { // Limit output
      console.log('\n🟡 WARNINGS (Should Fix):')
      warnings.slice(0, 10).forEach(violation => {
        console.log(`   ⚠️  ${violation.file}`)
      })
      if (warnings.length > 10) {
        console.log(`   ... and ${warnings.length - 10} more`)
      }
    }

    // Success criteria check
    console.log('\n🎯 Phase 3 Governance Compliance:')
    console.log(`   ✅ No JSX in shared components: ${this.stats.sharedJSX === 0 ? 'PASS' : 'FAIL'}`)
    console.log(`   📊 TSX adoption rate: ${tsxPercentage >= 60 ? 'GOOD' : 'NEEDS IMPROVEMENT'}`)
    console.log(`   🔧 Overall compliance: ${this.getComplianceLevel()}`)

    return {
      passed: this.stats.criticalViolations === 0,
      score: tsxPercentage,
      violations: this.violations,
      stats: this.stats
    }
  }

  getComplianceLevel() {
    if (this.stats.criticalViolations === 0 && this.stats.totalTSX / (this.stats.totalTSX + this.stats.totalJSX) >= 0.8) {
      return 'EXCELLENT ✅'
    } else if (this.stats.criticalViolations === 0 && this.stats.totalTSX / (this.stats.totalTSX + this.stats.totalJSX) >= 0.6) {
      return 'GOOD 👍'
    } else if (this.stats.criticalViolations <= 5) {
      return 'NEEDS WORK ⚠️'
    } else {
      return 'POOR ❌'
    }
  }

  async validate() {
    console.log('🔍 Starting TSX-First validation...\n')
    
    const files = this.findFiles(CONFIG.srcDir, ['.jsx', '.tsx'])
    
    console.log(`Found ${files.length} React component files`)
    
    // Analyze each file
    for (const file of files) {
      this.analyzeFile(file)
    }

    // Generate and display report
    const report = this.generateReport()

    // Exit with appropriate code
    if (process.argv.includes('--strict') && !report.passed) {
      console.log('\n❌ Validation failed due to critical violations')
      process.exit(1)
    }

    console.log('\n✅ Validation complete\n')
    return report
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new TSXFirstValidator()
  validator.validate().catch(error => {
    console.error('❌ Validation failed:', error)
    process.exit(1)
  })
}

module.exports = TSXFirstValidator