#!/usr/bin/env node

/**
 * Component Health Monitoring System
 * 
 * Monitors component usage, performance, and adherence to architectural principles.
 * Generates health reports and identifies areas for improvement.
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

interface ComponentHealth {
  name: string
  path: string
  usage: ComponentUsage
  performance: PerformanceMetrics
  quality: QualityMetrics
  architecture: ArchitectureCompliance
  score: number
  recommendations: string[]
}

interface ComponentUsage {
  totalImports: number
  uniqueFiles: number
  features: string[]
  growth: number // month-over-month percentage
  lastUsed: Date
}

interface PerformanceMetrics {
  bundleSize: number
  renderComplexity: number
  dependencies: number
  treeShakeable: boolean
  renderTime?: number
}

interface QualityMetrics {
  testCoverage: number
  typeStrength: number
  documentation: boolean
  accessibility: number
  propValidation: boolean
}

interface ArchitectureCompliance {
  scopeRule: boolean
  followsPatterns: boolean
  hasVariants: boolean
  extensible: boolean
  violations: string[]
}

interface HealthReport {
  timestamp: Date
  components: ComponentHealth[]
  summary: {
    averageScore: number
    healthyComponents: number
    criticalComponents: number
    topPerformers: string[]
    needsAttention: string[]
  }
  trends: {
    usageGrowth: number
    qualityTrend: number
    architectureCompliance: number
  }
}

// Base components to monitor
const BASE_COMPONENTS = [
  'components/ui/Button.tsx',
  'components/ui/Modal.tsx', 
  'components/ui/Input.tsx',
  'components/ui/LoadingSpinner.tsx',
  'components/ui/Badge.tsx',
  'components/ui/Card.tsx',
  'components/ui/Icon.tsx',
  'components/ui/Tooltip.tsx',
  'components/ui/Avatar.tsx'
]

// Analyze component usage across the codebase
async function analyzeComponentUsage(componentName: string): Promise<ComponentUsage> {
  const importPattern = new RegExp(`import.*${componentName}.*from`, 'g')
  
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*']
  })

  let totalImports = 0
  const uniqueFiles = new Set<string>()
  const features = new Set<string>()

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8')
      const matches = content.match(importPattern)
      
      if (matches) {
        totalImports += matches.length
        uniqueFiles.add(file)
        
        // Extract feature name from path
        const featureMatch = file.match(/features\/([^\/]+)/)
        if (featureMatch) {
          features.add(featureMatch[1])
        }
      }
    } catch (error) {
      console.warn(`Could not read ${file}: ${error}`)
    }
  }

  return {
    totalImports,
    uniqueFiles: uniqueFiles.size,
    features: Array.from(features),
    growth: 0, // Would need historical data
    lastUsed: new Date() // Simplified - would need git history
  }
}

// Analyze component performance characteristics
function analyzePerformance(componentPath: string): PerformanceMetrics {
  try {
    const fullPath = path.join(process.cwd(), 'src', componentPath)
    const content = fs.readFileSync(fullPath, 'utf-8')
    
    // Calculate bundle size (simplified - in real scenario, use bundler analysis)
    const bundleSize = Buffer.byteLength(content, 'utf8')
    
    // Analyze render complexity (count of JSX elements, hooks, etc.)
    const jsxElements = (content.match(/<\w+/g) || []).length
    const hooks = (content.match(/use\w+\s*\(/g) || []).length
    const conditionals = (content.match(/\?|&&|\|\|/g) || []).length
    const renderComplexity = jsxElements + hooks * 2 + conditionals
    
    // Count dependencies
    const importLines = content.match(/^import.*from.*$/gm) || []
    const dependencies = importLines.length
    
    // Check if tree-shakeable (exports individual functions/components)
    const hasNamedExports = /export\s+(?:const|function|class)\s+\w+/.test(content)
    const hasDefaultExport = /export\s+default/.test(content)
    const treeShakeable = hasNamedExports && !hasDefaultExport
    
    return {
      bundleSize,
      renderComplexity,
      dependencies,
      treeShakeable
    }
  } catch (error) {
    console.warn(`Could not analyze performance for ${componentPath}: ${error}`)
    return {
      bundleSize: 0,
      renderComplexity: 0,
      dependencies: 0,
      treeShakeable: false
    }
  }
}

// Analyze component quality metrics
function analyzeQuality(componentPath: string): QualityMetrics {
  try {
    const fullPath = path.join(process.cwd(), 'src', componentPath)
    const content = fs.readFileSync(fullPath, 'utf-8')
    
    // Check for test files
    const testPath = fullPath.replace(/\.(tsx|ts)$/, '.test.$1')
    const hasTests = fs.existsSync(testPath)
    const testCoverage = hasTests ? 80 : 0 // Simplified
    
    // Analyze TypeScript usage
    const hasInterfaces = /interface\s+\w+/.test(content)
    const hasTypedProps = /:\s*\w+Props/.test(content)
    const hasReturnType = /\):\s*(JSX\.Element|React\.FC)/.test(content)
    const typeStrength = (hasInterfaces ? 1 : 0) + (hasTypedProps ? 1 : 0) + (hasReturnType ? 1 : 0)
    
    // Check documentation
    const hasJSDoc = /\/\*\*[\s\S]*?\*\//.test(content)
    const hasExamples = /@example/.test(content)
    const documentation = hasJSDoc && hasExamples
    
    // Basic accessibility check
    const hasAriaLabels = /aria-label|aria-labelledby|aria-describedby/.test(content)
    const hasRoles = /role\s*=/.test(content)
    const hasKeyboardSupport = /onKeyDown|tabIndex/.test(content)
    const accessibility = (hasAriaLabels ? 1 : 0) + (hasRoles ? 1 : 0) + (hasKeyboardSupport ? 1 : 0)
    
    // Check prop validation
    const propValidation = hasInterfaces && hasTypedProps
    
    return {
      testCoverage,
      typeStrength: (typeStrength / 3) * 100,
      documentation,
      accessibility: (accessibility / 3) * 100,
      propValidation
    }
  } catch (error) {
    console.warn(`Could not analyze quality for ${componentPath}: ${error}`)
    return {
      testCoverage: 0,
      typeStrength: 0,
      documentation: false,
      accessibility: 0,
      propValidation: false
    }
  }
}

// Check architectural compliance
async function analyzeArchitecture(componentPath: string, usage: ComponentUsage): Promise<ArchitectureCompliance> {
  const violations: string[] = []
  
  try {
    const fullPath = path.join(process.cwd(), 'src', componentPath)
    const content = fs.readFileSync(fullPath, 'utf-8')
    
    // Check Scope Rule compliance
    const isBaseComponent = componentPath.includes('/ui/')
    const usedByMultipleFeatures = usage.features.length > 1
    const scopeRule = isBaseComponent ? usedByMultipleFeatures : usage.features.length <= 1
    
    if (!scopeRule) {
      violations.push(`Scope Rule violation: ${isBaseComponent ? 'Base component not used by multiple features' : 'Feature component used cross-feature'}`)
    }
    
    // Check if follows established patterns
    const hasForwardRef = /forwardRef/.test(content)
    const hasVariants = /variant\s*[?:=]/.test(content)
    const hasProperInterface = /interface\s+\w+Props/.test(content)
    const followsPatterns = hasForwardRef && hasProperInterface
    
    if (!followsPatterns) {
      violations.push('Does not follow established component patterns')
    }
    
    // Check extensibility
    const hasVariantSystem = /variant.*=.*{/.test(content)
    const hasClassNameProp = /className\?:?\s*string/.test(content)
    const extensible = hasVariantSystem && hasClassNameProp
    
    if (!extensible) {
      violations.push('Component not easily extensible')
    }
    
    return {
      scopeRule,
      followsPatterns,
      hasVariants,
      extensible,
      violations
    }
  } catch (error) {
    violations.push(`Analysis error: ${error}`)
    return {
      scopeRule: false,
      followsPatterns: false,
      hasVariants: false,
      extensible: false,
      violations
    }
  }
}

// Calculate overall health score
function calculateHealthScore(
  usage: ComponentUsage,
  performance: PerformanceMetrics, 
  quality: QualityMetrics,
  architecture: ArchitectureCompliance
): number {
  const weights = {
    usage: 0.3,
    performance: 0.2,
    quality: 0.3,
    architecture: 0.2
  }
  
  // Usage score (based on adoption and growth)
  const usageScore = Math.min(100, (usage.totalImports * 5) + (usage.features.length * 20))
  
  // Performance score (lower complexity is better)
  const performanceScore = Math.max(0, 100 - (performance.renderComplexity * 2) - (performance.dependencies * 5))
  
  // Quality score
  const qualityScore = (
    quality.testCoverage * 0.3 +
    quality.typeStrength * 0.3 +
    (quality.documentation ? 20 : 0) +
    quality.accessibility * 0.2 +
    (quality.propValidation ? 20 : 0)
  )
  
  // Architecture score
  const architectureScore = (
    (architecture.scopeRule ? 25 : 0) +
    (architecture.followsPatterns ? 25 : 0) +
    (architecture.hasVariants ? 25 : 0) +
    (architecture.extensible ? 25 : 0)
  )
  
  return (
    usageScore * weights.usage +
    performanceScore * weights.performance +
    qualityScore * weights.quality +
    architectureScore * weights.architecture
  )
}

// Generate recommendations based on analysis
function generateRecommendations(
  usage: ComponentUsage,
  performance: PerformanceMetrics,
  quality: QualityMetrics, 
  architecture: ArchitectureCompliance
): string[] {
  const recommendations: string[] = []
  
  // Usage recommendations
  if (usage.totalImports < 5 && usage.features.length <= 1) {
    recommendations.push('Low usage - consider promoting to other features or consolidating')
  }
  
  // Performance recommendations
  if (performance.renderComplexity > 20) {
    recommendations.push('High render complexity - consider breaking into smaller components')
  }
  
  if (performance.dependencies > 10) {
    recommendations.push('Many dependencies - review if all are necessary')
  }
  
  if (!performance.treeShakeable) {
    recommendations.push('Not tree-shakeable - prefer named exports over default exports')
  }
  
  // Quality recommendations
  if (quality.testCoverage < 70) {
    recommendations.push('Add comprehensive unit tests')
  }
  
  if (quality.typeStrength < 80) {
    recommendations.push('Improve TypeScript type coverage and definitions')
  }
  
  if (!quality.documentation) {
    recommendations.push('Add JSDoc documentation with examples')
  }
  
  if (quality.accessibility < 60) {
    recommendations.push('Improve accessibility with ARIA labels and keyboard support')
  }
  
  // Architecture recommendations
  architecture.violations.forEach(violation => {
    recommendations.push(`Architecture: ${violation}`)
  })
  
  return recommendations
}

// Monitor a single component
async function monitorComponent(componentPath: string): Promise<ComponentHealth> {
  const name = path.basename(componentPath, path.extname(componentPath))
  
  console.log(`📊 Analyzing ${name}...`)
  
  const usage = await analyzeComponentUsage(name)
  const performance = analyzePerformance(componentPath)
  const quality = analyzeQuality(componentPath)
  const architecture = await analyzeArchitecture(componentPath, usage)
  
  const score = calculateHealthScore(usage, performance, quality, architecture)
  const recommendations = generateRecommendations(usage, performance, quality, architecture)
  
  return {
    name,
    path: componentPath,
    usage,
    performance,
    quality,
    architecture,
    score,
    recommendations
  }
}

// Generate comprehensive health report
async function generateHealthReport(): Promise<HealthReport> {
  console.log('🏥 Starting component health analysis...')
  
  const components: ComponentHealth[] = []
  
  // Monitor base components
  for (const componentPath of BASE_COMPONENTS) {
    try {
      const health = await monitorComponent(componentPath)
      components.push(health)
    } catch (error) {
      console.warn(`Failed to analyze ${componentPath}: ${error}`)
    }
  }
  
  // Calculate summary statistics
  const scores = components.map(c => c.score)
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
  const healthyComponents = components.filter(c => c.score >= 70).length
  const criticalComponents = components.filter(c => c.score < 50).length
  
  const topPerformers = components
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(c => c.name)
  
  const needsAttention = components
    .filter(c => c.score < 60)
    .map(c => c.name)
  
  return {
    timestamp: new Date(),
    components,
    summary: {
      averageScore,
      healthyComponents,
      criticalComponents,
      topPerformers,
      needsAttention
    },
    trends: {
      usageGrowth: 0, // Would need historical data
      qualityTrend: 0,
      architectureCompliance: (components.filter(c => c.architecture.scopeRule).length / components.length) * 100
    }
  }
}

// Format health report as markdown
function formatHealthReport(report: HealthReport): string {
  const { timestamp, components, summary, trends } = report
  
  let output = `# 🏥 Component Health Report\n\n`
  output += `**Generated**: ${timestamp.toISOString().split('T')[0]}\n`
  output += `**Components Analyzed**: ${components.length}\n\n`
  
  output += `## 📊 Health Summary\n\n`
  output += `- **Average Health Score**: ${Math.round(summary.averageScore)}/100\n`
  output += `- **Healthy Components**: ${summary.healthyComponents}/${components.length} (${Math.round((summary.healthyComponents/components.length) * 100)}%)\n`
  output += `- **Critical Components**: ${summary.criticalComponents}\n`
  output += `- **Architecture Compliance**: ${Math.round(trends.architectureCompliance)}%\n\n`
  
  if (summary.topPerformers.length > 0) {
    output += `### 🏆 Top Performers\n\n`
    summary.topPerformers.forEach((name, i) => {
      const component = components.find(c => c.name === name)!
      output += `${i + 1}. **${name}** (${Math.round(component.score)}/100)\n`
    })
    output += `\n`
  }
  
  if (summary.needsAttention.length > 0) {
    output += `### ⚠️ Needs Attention\n\n`
    summary.needsAttention.forEach(name => {
      const component = components.find(c => c.name === name)!
      output += `- **${name}** (${Math.round(component.score)}/100)\n`
    })
    output += `\n`
  }
  
  output += `## 📋 Detailed Analysis\n\n`
  
  // Sort components by score (descending)
  const sortedComponents = components.sort((a, b) => b.score - a.score)
  
  sortedComponents.forEach((component, index) => {
    const statusEmoji = component.score >= 70 ? '✅' : component.score >= 50 ? '⚠️' : '❌'
    
    output += `### ${index + 1}. ${component.name} ${statusEmoji}\n\n`
    output += `**Overall Score**: ${Math.round(component.score)}/100\n\n`
    
    output += `#### Usage Metrics\n`
    output += `- **Total Imports**: ${component.usage.totalImports}\n`
    output += `- **Files Using**: ${component.usage.uniqueFiles}\n`
    output += `- **Features**: ${component.usage.features.join(', ') || 'None'}\n\n`
    
    output += `#### Quality Metrics\n`
    output += `- **Test Coverage**: ${component.quality.testCoverage}%\n`
    output += `- **Type Strength**: ${Math.round(component.quality.typeStrength)}%\n`
    output += `- **Documentation**: ${component.quality.documentation ? '✅' : '❌'}\n`
    output += `- **Accessibility**: ${Math.round(component.quality.accessibility)}%\n\n`
    
    output += `#### Architecture Compliance\n`
    output += `- **Scope Rule**: ${component.architecture.scopeRule ? '✅' : '❌'}\n`
    output += `- **Pattern Compliance**: ${component.architecture.followsPatterns ? '✅' : '❌'}\n`
    output += `- **Extensible**: ${component.architecture.extensible ? '✅' : '❌'}\n\n`
    
    if (component.recommendations.length > 0) {
      output += `#### 💡 Recommendations\n\n`
      component.recommendations.forEach(rec => {
        output += `- ${rec}\n`
      })
      output += `\n`
    }
    
    output += `---\n\n`
  })
  
  output += `## 🎯 Action Items\n\n`
  
  const criticalComponents = sortedComponents.filter(c => c.score < 50)
  if (criticalComponents.length > 0) {
    output += `### 🚨 Critical (Score < 50)\n\n`
    criticalComponents.forEach(component => {
      output += `- **${component.name}**: Focus on ${component.recommendations.slice(0, 2).join(' and ')}\n`
    })
    output += `\n`
  }
  
  const warningComponents = sortedComponents.filter(c => c.score >= 50 && c.score < 70)
  if (warningComponents.length > 0) {
    output += `### ⚠️ Needs Improvement (Score 50-69)\n\n`
    warningComponents.forEach(component => {
      output += `- **${component.name}**: ${component.recommendations[0] || 'Review architecture compliance'}\n`
    })
    output += `\n`
  }
  
  output += `## 📈 Next Steps\n\n`
  output += `1. **Immediate**: Address critical components with score < 50\n`
  output += `2. **Short-term**: Improve components with score 50-69\n`
  output += `3. **Ongoing**: Monitor usage trends and maintain documentation\n`
  output += `4. **Long-term**: Establish automated health monitoring in CI/CD\n\n`
  
  return output
}

// Main execution function
async function main(): Promise<void> {
  try {
    const report = await generateHealthReport()
    const markdown = formatHealthReport(report)
    
    // Save report
    const outputPath = path.join(process.cwd(), 'COMPONENT_HEALTH_REPORT.md')
    fs.writeFileSync(outputPath, markdown)
    
    console.log(`\n✅ Health analysis complete!`)
    console.log(`📄 Report saved to: ${outputPath}`)
    console.log(`\n📊 Health Summary:`)
    console.log(`   • Average Score: ${Math.round(report.summary.averageScore)}/100`)
    console.log(`   • Healthy Components: ${report.summary.healthyComponents}/${report.components.length}`)
    console.log(`   • Critical Issues: ${report.summary.criticalComponents}`)
    
    if (report.summary.criticalComponents > 0) {
      console.log(`\n🚨 ${report.summary.criticalComponents} components need immediate attention!`)
    }
    
  } catch (error) {
    console.error('❌ Health analysis failed:', error)
    process.exit(1)
  }
}

// Export for programmatic usage
export { generateHealthReport, formatHealthReport, monitorComponent }

// CLI execution
if (require.main === module) {
  main()
}