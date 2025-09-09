#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname, relative } from 'path'
import { createHash } from 'crypto'

/**
 * Component Duplication Detection Script
 * Prevents the 95% button duplication issue from recurring
 */

class ComponentAnalyzer {
  constructor(srcDir = './src') {
    this.srcDir = srcDir
    this.components = new Map()
    this.duplicates = new Map()
    this.violations = []
    
    // Patterns that indicate component duplication
    this.duplicationPatterns = {
      buttons: [
        /button.*className.*=.*["'][^"']*btn[^"']*["']/gi,
        /className.*=.*["'][^"']*button[^"']*["']/gi,
        /<button[^>]*className/gi,
        /styled\.button/gi,
        /const.*Button.*=.*\(/gi,
        /export.*Button.*=/gi,
      ],
      modals: [
        /className.*=.*["'][^"']*modal[^"']*["']/gi,
        /<div[^>]*className.*modal/gi,
        /const.*Modal.*=.*\(/gi,
        /export.*Modal.*=/gi,
      ],
      inputs: [
        /className.*=.*["'][^"']*input[^"']*["']/gi,
        /<input[^>]*className/gi,
        /const.*Input.*=.*\(/gi,
        /export.*Input.*=/gi,
      ],
      cards: [
        /className.*=.*["'][^"']*card[^"']*["']/gi,
        /<div[^>]*className.*card/gi,
        /const.*Card.*=.*\(/gi,
        /export.*Card.*=/gi,
      ]
    }

    // Base UI components that should be used instead
    this.baseComponents = {
      buttons: '@/components/ui/Button',
      modals: '@/components/ui/Modal', 
      inputs: '@/components/ui/Input',
      cards: '@/components/ui/Card',
    }
  }

  /**
   * Get all React component files
   */
  getComponentFiles(dir = this.srcDir) {
    const files = []
    
    const traverse = (currentDir) => {
      const items = readdirSync(currentDir)
      
      for (const item of items) {
        const fullPath = join(currentDir, item)
        const stat = statSync(fullPath)
        
        if (stat.isDirectory()) {
          if (item !== 'node_modules' && item !== 'dist' && item !== 'build') {
            traverse(fullPath)
          }
        } else if (this.isComponentFile(fullPath)) {
          files.push(fullPath)
        }
      }
    }
    
    traverse(dir)
    return files
  }

  /**
   * Check if file is a React component
   */
  isComponentFile(filePath) {
    const ext = extname(filePath)
    const validExtensions = ['.jsx', '.tsx', '.js', '.ts']
    if (!validExtensions.includes(ext)) return false
    
    const content = readFileSync(filePath, 'utf-8')
    return content.includes('React') || 
           content.includes('jsx') || 
           content.includes('JSX') ||
           content.match(/<[A-Z][a-zA-Z0-9]*/)
  }

  /**
   * Analyze a single component file
   */
  analyzeFile(filePath) {
    const content = readFileSync(filePath, 'utf-8')
    const relativePath = relative(process.cwd(), filePath)
    
    // Check for duplication patterns
    for (const [componentType, patterns] of Object.entries(this.duplicationPatterns)) {
      for (const pattern of patterns) {
        const matches = content.match(pattern)
        if (matches && matches.length > 0) {
          // Skip if it's the base UI component itself
          if (this.isBaseUIComponent(filePath, componentType)) {
            continue
          }
          
          this.violations.push({
            file: relativePath,
            type: componentType,
            matches: matches.length,
            pattern: pattern.source,
            suggestion: `Use ${this.baseComponents[componentType]} instead`,
            lines: this.findMatchingLines(content, pattern)
          })
        }
      }
    }
    
    // Calculate file hash for similarity detection
    const hash = createHash('md5').update(content).digest('hex')
    const componentName = this.extractComponentName(content, filePath)
    
    if (componentName) {
      if (this.components.has(componentName)) {
        const existing = this.components.get(componentName)
        if (existing.hash !== hash) {
          this.duplicates.set(componentName, [existing, { filePath: relativePath, hash, content }])
        }
      } else {
        this.components.set(componentName, { filePath: relativePath, hash, content })
      }
    }
  }

  /**
   * Check if file is a base UI component that should be exempt
   */
  isBaseUIComponent(filePath, componentType) {
    const uiComponentPaths = [
      'src/components/ui/Button',
      'src/components/ui/Modal',
      'src/components/ui/Input',
      'src/components/ui/Card'
    ]
    
    return uiComponentPaths.some(path => filePath.includes(path))
  }

  /**
   * Find line numbers where pattern matches
   */
  findMatchingLines(content, pattern) {
    const lines = content.split('\n')
    const matchingLines = []
    
    lines.forEach((line, index) => {
      if (line.match(pattern)) {
        matchingLines.push(index + 1)
      }
    })
    
    return matchingLines
  }

  /**
   * Extract component name from file content
   */
  extractComponentName(content, filePath) {
    // Try to find export default component name
    const exportDefaultMatch = content.match(/export\s+default\s+(\w+)/)
    if (exportDefaultMatch) {
      return exportDefaultMatch[1]
    }
    
    // Try to find const ComponentName = 
    const constComponentMatch = content.match(/(?:const|function)\s+([A-Z]\w*)\s*=/)
    if (constComponentMatch) {
      return constComponentMatch[1]
    }
    
    // Fallback to filename
    const filename = filePath.split('/').pop().replace(/\.(jsx?|tsx?)$/, '')
    if (filename.match(/^[A-Z]/)) {
      return filename
    }
    
    return null
  }

  /**
   * Generate duplication report
   */
  generateReport() {
    console.log('\n🔍 COMPONENT DUPLICATION ANALYSIS REPORT')
    console.log('=' .repeat(50))
    
    if (this.violations.length === 0 && this.duplicates.size === 0) {
      console.log('✅ No component duplication detected!')
      return { success: true, violations: 0, duplicates: 0 }
    }

    // Report pattern violations
    if (this.violations.length > 0) {
      console.log(`\n⚠️  PATTERN VIOLATIONS DETECTED: ${this.violations.length}`)
      console.log('-'.repeat(30))
      
      const groupedViolations = this.violations.reduce((acc, violation) => {
        if (!acc[violation.type]) acc[violation.type] = []
        acc[violation.type].push(violation)
        return acc
      }, {})
      
      for (const [type, violations] of Object.entries(groupedViolations)) {
        console.log(`\n📊 ${type.toUpperCase()} (${violations.length} violations):`)
        violations.forEach(violation => {
          console.log(`   📄 ${violation.file}`)
          console.log(`      Lines: ${violation.lines.join(', ')}`)
          console.log(`      💡 ${violation.suggestion}`)
        })
      }
    }

    // Report duplicate components
    if (this.duplicates.size > 0) {
      console.log(`\n🔄 DUPLICATE COMPONENTS DETECTED: ${this.duplicates.size}`)
      console.log('-'.repeat(30))
      
      for (const [componentName, duplicates] of this.duplicates) {
        console.log(`\n🔀 Component: ${componentName}`)
        duplicates.forEach((duplicate, index) => {
          console.log(`   ${index + 1}. 📄 ${duplicate.filePath}`)
        })
      }
    }

    // Summary and recommendations
    console.log('\n📋 RECOMMENDATIONS')
    console.log('-'.repeat(20))
    console.log('1. Refactor duplicate components to use base UI components')
    console.log('2. Import from @/components/ui/ instead of creating inline components')
    console.log('3. Run: npm run component:refactor to apply automated fixes')
    console.log('4. Set up pre-commit hooks to prevent future duplications')
    
    return { 
      success: false, 
      violations: this.violations.length, 
      duplicates: this.duplicates.size,
      details: {
        violations: this.violations,
        duplicates: Array.from(this.duplicates.entries())
      }
    }
  }

  /**
   * Run the complete analysis
   */
  async analyze() {
    console.log('🔍 Analyzing component duplication...')
    
    const files = this.getComponentFiles()
    console.log(`📄 Found ${files.length} component files`)
    
    for (const file of files) {
      this.analyzeFile(file)
    }
    
    return this.generateReport()
  }

  /**
   * Generate automated refactoring suggestions
   */
  generateRefactorScript() {
    const script = this.violations.map(violation => {
      return `// ${violation.file}:${violation.lines.join(',')}\n` +
             `// TODO: Replace with ${violation.suggestion}\n` +
             `// Pattern found: ${violation.pattern}\n`
    }).join('\n')

    return script
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new ComponentAnalyzer()
  
  analyzer.analyze().then(result => {
    if (!result.success) {
      process.exit(1)
    }
  }).catch(error => {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  })
}

export default ComponentAnalyzer