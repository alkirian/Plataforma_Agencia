#!/usr/bin/env node

/**
 * Component Duplication Detection Script
 * 
 * Scans the codebase for duplicated component patterns and generates
 * actionable recommendations for consolidation.
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

interface DuplicationReport {
  type: 'button' | 'modal' | 'input' | 'loading' | 'card' | 'badge'
  locations: ComponentLocation[]
  similarity: number
  recommendation: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  effort: 'easy' | 'medium' | 'complex'
  impact: string
}

interface ComponentLocation {
  file: string
  line: number
  context: string
  pattern: string
}

interface AnalysisResult {
  reports: DuplicationReport[]
  summary: {
    totalIssues: number
    criticalIssues: number
    potentialSavings: string
    topRecommendations: string[]
  }
}

// Detection patterns for different component types
const DETECTION_PATTERNS = {
  button: {
    patterns: [
      /(<button[^>]*className[^>]*>|const\s+\w*[Bb]utton\s*=)/g,
      /(className\s*=\s*["'][^"']*(?:btn|button|px-\d+\s+py-\d+)[^"']*["'])/g,
      /onClick\s*=\s*\{[^}]*\}/g
    ],
    baseComponent: 'components/ui/Button.tsx',
    recommendation: 'Replace with <Button> component from @components/ui/Button'
  },
  modal: {
    patterns: [
      /(fixed\s+inset-0|z-\d+.*backdrop|modal|overlay)/g,
      /(className\s*=\s*["'][^"']*(?:fixed|inset-0|backdrop-blur)[^"']*["'])/g,
      /(portal|createPortal|z-50|z-40)/gi
    ],
    baseComponent: 'components/ui/Modal.tsx',
    recommendation: 'Use <Modal> component from @components/ui/Modal'
  },
  input: {
    patterns: [
      /(<input[^>]*className[^>]*>|const\s+\w*[Ii]nput\s*=)/g,
      /(className\s*=\s*["'][^"']*(?:border|rounded|px-\d+)[^"']*["'])/g,
      /(type\s*=\s*["'](?:text|email|password|number)["'])/g
    ],
    baseComponent: 'components/ui/Input.tsx',
    recommendation: 'Use <Input> component from @components/ui/Input'
  },
  loading: {
    patterns: [
      /(animate-spin|loading|spinner|w-\d+\s+h-\d+.*border.*rounded-full)/g,
      /(className\s*=\s*["'][^"']*animate-spin[^"']*["'])/g,
      /(\{.*loading.*\?.*:.*\})/g
    ],
    baseComponent: 'components/ui/LoadingSpinner.tsx',
    recommendation: 'Use <LoadingSpinner> component from @components/ui/LoadingSpinner'
  },
  card: {
    patterns: [
      /(bg-(?:surface|gray|white).*border.*rounded)/g,
      /(className\s*=\s*["'][^"']*(?:bg-surface|border.*rounded)[^"']*["'])/g,
      /(p-\d+.*bg-)/g
    ],
    baseComponent: 'components/ui/Card.tsx',
    recommendation: 'Use <Card> component from @components/ui/Card'
  },
  badge: {
    patterns: [
      /(badge|status|tag|pill)/gi,
      /(className\s*=\s*["'][^"']*(?:rounded-full|inline-flex.*text-xs)[^"']*["'])/g,
      /(bg-(?:green|red|yellow|blue|gray)-\d+.*text-(?:white|xs))/g
    ],
    baseComponent: 'components/ui/Badge.tsx',
    recommendation: 'Use <Badge> component from @components/ui/Badge'
  }
}

// Calculate similarity between two code snippets
function calculateSimilarity(code1: string, code2: string): number {
  const words1 = code1.toLowerCase().split(/\s+/)
  const words2 = code2.toLowerCase().split(/\s+/)
  const commonWords = words1.filter(word => words2.includes(word))
  const totalWords = new Set([...words1, ...words2]).size
  
  return (commonWords.length / totalWords) * 100
}

// Extract context around a match
function extractContext(content: string, index: number, contextSize = 50): string {
  const start = Math.max(0, index - contextSize)
  const end = Math.min(content.length, index + contextSize)
  return content.slice(start, end).trim()
}

// Get line number for a given index in text
function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length
}

// Analyze a single file for component patterns
async function analyzeFile(filePath: string): Promise<ComponentLocation[]> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const locations: ComponentLocation[] = []

  Object.entries(DETECTION_PATTERNS).forEach(([type, config]) => {
    config.patterns.forEach((pattern, patternIndex) => {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const location: ComponentLocation = {
          file: filePath,
          line: getLineNumber(content, match.index),
          context: extractContext(content, match.index, 100),
          pattern: match[0]
        }
        locations.push(location)
        
        // Reset regex lastIndex to avoid infinite loops
        if (!pattern.global) break
      }
      // Reset pattern for next file
      pattern.lastIndex = 0
    })
  })

  return locations
}

// Check if base component exists and is being used
function checkBaseComponentUsage(baseComponentPath: string): boolean {
  const fullPath = path.join(process.cwd(), 'src', baseComponentPath)
  return fs.existsSync(fullPath)
}

// Generate priority based on count and impact
function calculatePriority(count: number, type: string): 'critical' | 'high' | 'medium' | 'low' {
  const thresholds = {
    button: { critical: 50, high: 20, medium: 10 },
    modal: { critical: 8, high: 4, medium: 2 },
    loading: { critical: 15, high: 8, medium: 4 },
    input: { critical: 12, high: 6, medium: 3 },
    card: { critical: 20, high: 10, medium: 5 },
    badge: { critical: 25, high: 12, medium: 6 }
  }

  const threshold = thresholds[type as keyof typeof thresholds] || { critical: 10, high: 5, medium: 2 }
  
  if (count >= threshold.critical) return 'critical'
  if (count >= threshold.high) return 'high'
  if (count >= threshold.medium) return 'medium'
  return 'low'
}

// Estimate effort based on complexity
function estimateEffort(locations: ComponentLocation[], type: string): 'easy' | 'medium' | 'complex' {
  const avgContextLength = locations.reduce((sum, loc) => sum + loc.context.length, 0) / locations.length
  const uniquePatterns = new Set(locations.map(loc => loc.pattern)).size
  
  // Simple heuristics
  if (type === 'loading' && uniquePatterns <= 3) return 'easy'
  if (type === 'button' && avgContextLength < 100) return 'easy'
  if (type === 'modal' && locations.length <= 5) return 'medium'
  
  return uniquePatterns > 5 || avgContextLength > 200 ? 'complex' : 'medium'
}

// Main analysis function
async function analyzeDuplication(): Promise<AnalysisResult> {
  console.log('🔍 Scanning for component duplication patterns...')
  
  // Get all TypeScript/JSX files
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*']
  })

  console.log(`📁 Found ${files.length} files to analyze`)

  const allLocations: Record<string, ComponentLocation[]> = {}

  // Analyze each file
  for (const file of files) {
    const locations = await analyzeFile(file)
    
    // Group by component type
    Object.keys(DETECTION_PATTERNS).forEach(type => {
      const typeLocations = locations.filter(loc => 
        DETECTION_PATTERNS[type as keyof typeof DETECTION_PATTERNS].patterns.some(pattern => 
          pattern.test(loc.pattern)
        )
      )
      
      if (typeLocations.length > 0) {
        if (!allLocations[type]) allLocations[type] = []
        allLocations[type].push(...typeLocations)
      }
    })
  }

  // Generate reports
  const reports: DuplicationReport[] = []

  Object.entries(allLocations).forEach(([type, locations]) => {
    if (locations.length === 0) return

    const config = DETECTION_PATTERNS[type as keyof typeof DETECTION_PATTERNS]
    const baseExists = checkBaseComponentUsage(config.baseComponent)
    const priority = calculatePriority(locations.length, type)
    const effort = estimateEffort(locations, type)
    
    // Calculate overall similarity
    const similarities = locations.map(loc1 => 
      locations.map(loc2 => calculateSimilarity(loc1.context, loc2.context))
        .reduce((sum, sim) => sum + sim, 0) / locations.length
    )
    const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length

    reports.push({
      type: type as any,
      locations: locations.slice(0, 10), // Limit for readability
      similarity: Math.round(avgSimilarity),
      recommendation: baseExists 
        ? config.recommendation 
        : `Create base component at ${config.baseComponent}`,
      priority,
      effort,
      impact: `${locations.length} instances found across ${new Set(locations.map(l => l.file)).size} files`
    })
  })

  // Sort by priority and count
  reports.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority] || 
           b.locations.length - a.locations.length
  })

  // Generate summary
  const criticalIssues = reports.filter(r => r.priority === 'critical').length
  const totalIssues = reports.length
  const totalDuplications = reports.reduce((sum, r) => sum + r.locations.length, 0)
  
  const summary = {
    totalIssues,
    criticalIssues,
    potentialSavings: `~${Math.round(totalDuplications * 0.6)} lines of code`,
    topRecommendations: reports.slice(0, 3).map(r => r.recommendation)
  }

  return { reports, summary }
}

// Generate report output
function generateReport(result: AnalysisResult): string {
  const { reports, summary } = result
  const timestamp = new Date().toISOString().split('T')[0]
  
  let output = `# 🔍 Component Duplication Analysis Report\n\n`
  output += `**Generated**: ${timestamp}\n`
  output += `**Scope**: Frontend component patterns\n\n`
  
  output += `## 📊 Summary\n\n`
  output += `- **Total Issues**: ${summary.totalIssues}\n`
  output += `- **Critical Priority**: ${summary.criticalIssues}\n`
  output += `- **Potential Savings**: ${summary.potentialSavings}\n\n`
  
  if (summary.topRecommendations.length > 0) {
    output += `### 🎯 Top Recommendations\n\n`
    summary.topRecommendations.forEach((rec, i) => {
      output += `${i + 1}. ${rec}\n`
    })
    output += `\n`
  }
  
  output += `## 🚨 Detailed Findings\n\n`
  
  reports.forEach((report, index) => {
    const priorityEmoji = {
      critical: '🔥',
      high: '⚡',
      medium: '⚠️',
      low: '💡'
    }
    
    output += `### ${index + 1}. ${report.type.toUpperCase()} Components ${priorityEmoji[report.priority]}\n\n`
    output += `- **Priority**: ${report.priority.toUpperCase()}\n`
    output += `- **Effort**: ${report.effort}\n`
    output += `- **Impact**: ${report.impact}\n`
    output += `- **Similarity**: ${report.similarity}%\n`
    output += `- **Recommendation**: ${report.recommendation}\n\n`
    
    if (report.locations.length > 0) {
      output += `#### Sample Locations:\n\n`
      report.locations.slice(0, 5).forEach(location => {
        output += `- \`${location.file}:${location.line}\`\n`
        output += `  \`\`\`\n  ${location.context.slice(0, 80)}...\n  \`\`\`\n\n`
      })
      
      if (report.locations.length > 5) {
        output += `_...and ${report.locations.length - 5} more locations_\n\n`
      }
    }
    
    output += `---\n\n`
  })
  
  output += `## 🛠️ Next Steps\n\n`
  output += `1. **Address Critical Issues**: Focus on ${reports.filter(r => r.priority === 'critical').length} critical priority items\n`
  output += `2. **Quick Wins**: Start with "${reports.find(r => r.effort === 'easy')?.type}" components (easy effort)\n`
  output += `3. **Measure Progress**: Re-run this analysis after migrations\n`
  output += `4. **Prevent Regression**: Set up ESLint rules to catch new duplications\n\n`
  
  return output
}

// Main execution
async function main(): Promise<void> {
  try {
    const result = await analyzeDuplication()
    const report = generateReport(result)
    
    // Write report to file
    const outputPath = path.join(process.cwd(), 'DUPLICATION_ANALYSIS.md')
    fs.writeFileSync(outputPath, report)
    
    console.log(`\n✅ Analysis complete!`)
    console.log(`📄 Report saved to: ${outputPath}`)
    console.log(`\n📊 Quick Summary:`)
    console.log(`   • ${result.summary.totalIssues} total issues found`)
    console.log(`   • ${result.summary.criticalIssues} critical priority`)
    console.log(`   • ${result.summary.potentialSavings} potential code reduction`)
    
    if (result.summary.criticalIssues > 0) {
      console.log(`\n🚨 ${result.summary.criticalIssues} critical issues require immediate attention!`)
      process.exit(1) // Exit with error code to fail CI if desired
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }
}

// CLI execution
if (require.main === module) {
  main()
}

export { analyzeDuplication, generateReport }