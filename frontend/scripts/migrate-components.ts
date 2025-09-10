#!/usr/bin/env node

/**
 * Automated Component Migration Tool
 * 
 * Helps migrate common patterns to use base components automatically.
 * Provides safe transformations with backup and validation.
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface MigrationRule {
  name: string
  pattern: RegExp
  replacement: string | ((match: string, ...groups: string[]) => string)
  imports?: string[]
  description: string
  risk: 'low' | 'medium' | 'high'
  validation?: (content: string) => boolean
}

interface MigrationResult {
  file: string
  changes: number
  rules: string[]
  backup?: string
  errors?: string[]
}

interface MigrationSummary {
  filesProcessed: number
  filesChanged: number
  totalChanges: number
  errors: string[]
  results: MigrationResult[]
}

// Common migration patterns
const MIGRATION_RULES: MigrationRule[] = [
  // Button migrations
  {
    name: 'simple-buttons',
    pattern: /<button\s+([^>]*className\s*=\s*["']([^"']*(?:px-\d+|py-\d+|btn|button)[^"']*?)["'][^>]*)>\s*(.*?)\s*<\/button>/gs,
    replacement: (match, attrs, className, children) => {
      const variant = className.includes('bg-blue') || className.includes('primary') ? 'primary' : 'secondary'
      const size = className.includes('text-sm') ? 'sm' : 'md'
      
      // Extract other attributes
      const otherAttrs = attrs.replace(/className\s*=\s*["'][^"']*["']/, '').trim()
      
      return `<Button variant="${variant}" size="${size}" ${otherAttrs}>${children.trim()}</Button>`
    },
    imports: ['import { Button } from "@components/ui/Button"'],
    description: 'Convert simple styled buttons to Button component',
    risk: 'low'
  },
  
  // Modal action buttons (very common pattern)
  {
    name: 'modal-action-buttons',
    pattern: /<div\s+className\s*=\s*["'][^"']*(?:flex|justify-end|gap-)[^"']*["']>\s*<button\s+[^>]*>([^<]*)<\/button>\s*<button\s+[^>]*>([^<]*)<\/button>\s*<\/div>/gs,
    replacement: `<div className="flex justify-end gap-3 pt-6">
  <Button variant="secondary">$1</Button>
  <Button variant="primary">$2</Button>
</div>`,
    imports: ['import { Button } from "@components/ui/Button"'],
    description: 'Convert modal action button pairs to Button components',
    risk: 'low'
  },

  // Loading spinners
  {
    name: 'loading-spinners',
    pattern: /<div\s+className\s*=\s*["'][^"']*animate-spin[^"']*["'][^>]*(?:\/>|><\/div>)/gs,
    replacement: '<LoadingSpinner size="sm" />',
    imports: ['import { LoadingSpinner } from "@components/ui/LoadingSpinner"'],
    description: 'Replace inline loading spinners with LoadingSpinner component',
    risk: 'low'
  },

  // Conditional loading patterns
  {
    name: 'conditional-loading',
    pattern: /\{\s*(\w+)\s*\?\s*<div\s+className\s*=\s*["'][^"']*animate-spin[^"']*["'][^>]*(?:\/>|><\/div>)\s*:\s*(.*?)\s*\}/gs,
    replacement: '{$1 ? <LoadingSpinner size="sm" /> : $2}',
    imports: ['import { LoadingSpinner } from "@components/ui/LoadingSpinner"'],
    description: 'Replace conditional loading spinner patterns',
    risk: 'medium'
  },

  // Simple status badges
  {
    name: 'status-badges',
    pattern: /<(?:span|div)\s+className\s*=\s*["'][^"']*(?:bg-green|bg-red|bg-yellow|bg-blue)-\d+[^"']*text-(?:white|xs)[^"']*["']>\s*(.*?)\s*<\/(?:span|div)>/gs,
    replacement: (match, content) => {
      const variant = match.includes('bg-green') ? 'success' : 
                    match.includes('bg-red') ? 'danger' :
                    match.includes('bg-yellow') ? 'warning' : 'info'
      return `<Badge variant="${variant}" size="sm">${content}</Badge>`
    },
    imports: ['import { Badge } from "@components/ui/Badge"'],
    description: 'Convert simple colored badges to Badge component',
    risk: 'low'
  },

  // Form inputs with consistent styling
  {
    name: 'form-inputs',
    pattern: /<input\s+([^>]*type\s*=\s*["'](?:text|email|password|number)["'][^>]*className\s*=\s*["'][^"']*(?:border|rounded|px-\d+)[^"']*["'][^>]*)\/>/gs,
    replacement: (match, attrs) => {
      // Extract key attributes
      const typeMatch = attrs.match(/type\s*=\s*["']([^"']+)["']/)
      const placeholderMatch = attrs.match(/placeholder\s*=\s*["']([^"']+)["']/)
      const requiredMatch = attrs.match(/required/)
      const disabledMatch = attrs.match(/disabled/)
      
      const type = typeMatch ? typeMatch[1] : 'text'
      const placeholder = placeholderMatch ? ` placeholder="${placeholderMatch[1]}"` : ''
      const required = requiredMatch ? ' required' : ''
      const disabled = disabledMatch ? ' disabled' : ''
      
      // Remove className and type, placeholder, required, disabled from original attrs
      const otherAttrs = attrs
        .replace(/className\s*=\s*["'][^"']*["']/, '')
        .replace(/type\s*=\s*["'][^"']*["']/, '')
        .replace(/placeholder\s*=\s*["'][^"']*["']/, '')
        .replace(/\s*required\s*/, '')
        .replace(/\s*disabled\s*/, '')
        .trim()
      
      return `<Input type="${type}"${placeholder}${required}${disabled} ${otherAttrs} />`
    },
    imports: ['import { Input } from "@components/ui/Input"'],
    description: 'Convert styled form inputs to Input component',
    risk: 'medium'
  }
]

// Create backup of a file
function createBackup(filePath: string): string {
  const backupPath = `${filePath}.backup.${Date.now()}`
  fs.copyFileSync(filePath, backupPath)
  return backupPath
}

// Add imports to a file if they don't exist
function addImports(content: string, imports: string[]): string {
  const lines = content.split('\n')
  const importLines = lines.filter(line => line.trim().startsWith('import'))
  const lastImportIndex = importLines.length > 0 ? 
    lines.findIndex(line => line.trim().startsWith('import')) + importLines.length - 1 : 
    -1

  const existingImports = importLines.join('\n')
  const newImports = imports.filter(imp => !existingImports.includes(imp))
  
  if (newImports.length === 0) return content

  // Insert new imports after existing imports or at the beginning
  const insertIndex = lastImportIndex >= 0 ? lastImportIndex + 1 : 0
  lines.splice(insertIndex, 0, ...newImports, '')

  return lines.join('\n')
}

// Apply a single migration rule to content
function applyRule(content: string, rule: MigrationRule): { content: string; changes: number } {
  let changes = 0
  let newContent = content

  if (typeof rule.replacement === 'function') {
    newContent = content.replace(rule.pattern, (...args) => {
      changes++
      return rule.replacement.call(null, ...args)
    })
  } else {
    newContent = content.replace(rule.pattern, (match, ...groups) => {
      changes++
      return rule.replacement as string
    })
  }

  // Add required imports if changes were made
  if (changes > 0 && rule.imports) {
    newContent = addImports(newContent, rule.imports)
  }

  return { content: newContent, changes }
}

// Migrate a single file
async function migrateFile(filePath: string, rules: MigrationRule[]): Promise<MigrationResult> {
  const originalContent = fs.readFileSync(filePath, 'utf-8')
  let content = originalContent
  
  const result: MigrationResult = {
    file: filePath,
    changes: 0,
    rules: [],
    errors: []
  }

  // Apply each rule
  for (const rule of rules) {
    try {
      const { content: newContent, changes } = applyRule(content, rule)
      
      if (changes > 0) {
        content = newContent
        result.changes += changes
        result.rules.push(rule.name)
        console.log(`  ✅ Applied ${rule.name}: ${changes} changes`)
      }
    } catch (error) {
      result.errors?.push(`Rule ${rule.name}: ${error}`)
      console.warn(`  ⚠️ Rule ${rule.name} failed: ${error}`)
    }
  }

  // Only write file if changes were made
  if (result.changes > 0) {
    try {
      // Create backup
      result.backup = createBackup(filePath)
      
      // Write modified content
      fs.writeFileSync(filePath, content)
      
      console.log(`  📝 Updated ${filePath} (${result.changes} changes)`)
    } catch (error) {
      result.errors?.push(`Write failed: ${error}`)
    }
  }

  return result
}

// Validate TypeScript compilation after migration
async function validateTypeScript(): Promise<boolean> {
  try {
    console.log('🔍 Validating TypeScript compilation...')
    await execAsync('npx tsc --noEmit')
    console.log('✅ TypeScript validation passed')
    return true
  } catch (error) {
    console.error('❌ TypeScript validation failed:', error)
    return false
  }
}

// Main migration function
async function runMigration(
  pattern = 'src/**/*.{tsx,jsx}',
  ruleNames?: string[],
  dryRun = false
): Promise<MigrationSummary> {
  console.log(`🚀 Starting component migration...`)
  console.log(`📁 Pattern: ${pattern}`)
  console.log(`🔧 Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)

  const files = await glob(pattern, {
    cwd: process.cwd(),
    ignore: [
      '**/node_modules/**',
      '**/dist/**', 
      '**/*.test.*',
      '**/*.spec.*',
      '**/components/ui/**' // Don't migrate base components
    ]
  })

  console.log(`📂 Found ${files.length} files to process`)

  // Filter rules if specific names provided
  const activeRules = ruleNames 
    ? MIGRATION_RULES.filter(rule => ruleNames.includes(rule.name))
    : MIGRATION_RULES

  console.log(`📋 Using ${activeRules.length} migration rules:`)
  activeRules.forEach(rule => {
    console.log(`   • ${rule.name} (${rule.risk} risk): ${rule.description}`)
  })

  const summary: MigrationSummary = {
    filesProcessed: 0,
    filesChanged: 0,
    totalChanges: 0,
    errors: [],
    results: []
  }

  // Process each file
  for (const file of files) {
    console.log(`\n📄 Processing: ${file}`)
    summary.filesProcessed++

    try {
      if (dryRun) {
        // Dry run: just test patterns without writing
        const content = fs.readFileSync(file, 'utf-8')
        let totalChanges = 0
        const rules: string[] = []

        for (const rule of activeRules) {
          const matches = content.match(rule.pattern)
          if (matches) {
            totalChanges += matches.length
            rules.push(rule.name)
          }
        }

        if (totalChanges > 0) {
          console.log(`  🔍 Would apply ${totalChanges} changes (${rules.join(', ')})`)
          summary.totalChanges += totalChanges
          summary.filesChanged++
        }

        summary.results.push({
          file,
          changes: totalChanges,
          rules
        })
      } else {
        // Live run: apply changes
        const result = await migrateFile(file, activeRules)
        summary.results.push(result)

        if (result.changes > 0) {
          summary.filesChanged++
          summary.totalChanges += result.changes
        }

        if (result.errors && result.errors.length > 0) {
          summary.errors.push(...result.errors)
        }
      }
    } catch (error) {
      const errorMessage = `Failed to process ${file}: ${error}`
      console.error(`❌ ${errorMessage}`)
      summary.errors.push(errorMessage)
    }
  }

  // Validation step (only for live runs)
  if (!dryRun && summary.filesChanged > 0) {
    const isValid = await validateTypeScript()
    if (!isValid) {
      console.warn('⚠️ TypeScript validation failed. Consider reviewing changes.')
    }
  }

  return summary
}

// Generate migration report
function generateReport(summary: MigrationSummary, dryRun: boolean): string {
  const timestamp = new Date().toISOString().split('T')[0]
  
  let report = `# 🔄 Component Migration Report\n\n`
  report += `**Date**: ${timestamp}\n`
  report += `**Mode**: ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}\n\n`

  report += `## 📊 Summary\n\n`
  report += `- **Files Processed**: ${summary.filesProcessed}\n`
  report += `- **Files Changed**: ${summary.filesChanged}\n`
  report += `- **Total Changes**: ${summary.totalChanges}\n`
  report += `- **Errors**: ${summary.errors.length}\n\n`

  if (summary.errors.length > 0) {
    report += `### ❌ Errors\n\n`
    summary.errors.forEach(error => {
      report += `- ${error}\n`
    })
    report += `\n`
  }

  const changedFiles = summary.results.filter(r => r.changes > 0)
  if (changedFiles.length > 0) {
    report += `### ✅ Changed Files\n\n`
    changedFiles.forEach(result => {
      report += `#### ${result.file}\n`
      report += `- **Changes**: ${result.changes}\n`
      report += `- **Rules Applied**: ${result.rules.join(', ')}\n`
      if (result.backup) {
        report += `- **Backup**: ${result.backup}\n`
      }
      report += `\n`
    })
  }

  if (dryRun) {
    report += `## 🚀 Next Steps\n\n`
    report += `This was a dry run. To apply these changes:\n\n`
    report += `\`\`\`bash\n`
    report += `npm run migrate-components\n`
    report += `\`\`\`\n\n`
  } else {
    report += `## ✅ Migration Complete\n\n`
    report += `Changes have been applied. Review the modified files and run tests.\n\n`
    if (summary.filesChanged > 0) {
      report += `**Important**: Backup files have been created. Remove them after validation.\n\n`
    }
  }

  return report
}

// CLI interface
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const pattern = args.find(arg => arg.startsWith('--pattern='))?.split('=')[1] || 'src/**/*.{tsx,jsx}'
  const rules = args.find(arg => arg.startsWith('--rules='))?.split('=')[1]?.split(',')

  try {
    const summary = await runMigration(pattern, rules, dryRun)
    const report = generateReport(summary, dryRun)
    
    // Save report
    const reportPath = path.join(process.cwd(), `MIGRATION_REPORT_${Date.now()}.md`)
    fs.writeFileSync(reportPath, report)
    
    console.log(`\n📄 Report saved to: ${reportPath}`)
    console.log(`\n📊 Migration Summary:`)
    console.log(`   • ${summary.filesProcessed} files processed`)
    console.log(`   • ${summary.filesChanged} files changed`)
    console.log(`   • ${summary.totalChanges} total changes`)
    
    if (summary.errors.length > 0) {
      console.log(`   • ${summary.errors.length} errors occurred`)
    }

    if (dryRun) {
      console.log(`\n🔍 Dry run complete. Use --no-dry-run to apply changes.`)
    } else if (summary.filesChanged > 0) {
      console.log(`\n✅ Migration complete! Review changes and run tests.`)
    } else {
      console.log(`\n💡 No changes needed. All patterns already use base components.`)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Export for programmatic usage
export { runMigration, MIGRATION_RULES, generateReport }

// CLI execution
if (require.main === module) {
  main()
}