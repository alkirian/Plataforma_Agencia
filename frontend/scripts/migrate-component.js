#!/usr/bin/env node

/**
 * Automated TypeScript Component Migration Script
 * 
 * Usage: node scripts/migrate-component.js <component-path>
 * Example: node scripts/migrate-component.js src/components/ui/Button.jsx
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const COMPONENT_PATTERNS = {
  // React imports
  reactImport: /^import\s+React(,\s*\{[^}]*\})?\s+from\s+['"]react['"];?\s*$/gm,
  
  // Component props destructuring
  propsPattern: /export\s+(?:const|function)\s+(\w+)\s*=?\s*\(\s*\{([^}]*)\}\s*(?::\s*\w+)?\s*\)\s*(?::\s*\w+)?\s*=?>/,
  
  // Event handlers
  eventHandler: /(on\w+)\s*=\s*\{([^}]*)\}/g,
  
  // State hooks
  useState: /const\s+\[([^,]+),\s*([^\]]+)\]\s*=\s*useState\(([^)]*)\)/g,
  
  // Effect hooks
  useEffect: /useEffect\(\s*\(\s*\)\s*=>\s*\{/g,
  
  // Props access
  propsAccess: /(\w+)\.(\w+)/g
}

const TYPE_MAPPINGS = {
  // Common prop types to TypeScript
  'string': 'string',
  'number': 'number',
  'boolean': 'boolean',
  'array': 'unknown[]',
  'object': 'Record<string, unknown>',
  'function': '(...args: unknown[]) => unknown',
  'node': 'React.ReactNode',
  'element': 'React.ReactElement'
}

async function readFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message)
    process.exit(1)
  }
}

async function writeFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content, 'utf-8')
    console.log(`✅ Written: ${filePath}`)
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error.message)
    process.exit(1)
  }
}

function extractComponentName(filePath) {
  const basename = path.basename(filePath, path.extname(filePath))
  return basename
}

function analyzeProps(content) {
  const propsMatch = content.match(COMPONENT_PATTERNS.propsPattern)
  
  if (!propsMatch) {
    return { componentName: '', props: [] }
  }
  
  const componentName = propsMatch[1]
  const propsString = propsMatch[2]
  
  if (!propsString.trim()) {
    return { componentName, props: [] }
  }
  
  // Extract individual props
  const props = propsString
    .split(',')
    .map(prop => prop.trim())
    .filter(prop => prop.length > 0)
    .map(prop => {
      // Handle destructuring with defaults: { name = 'default' }
      const [propName, defaultValue] = prop.split('=').map(p => p.trim())
      
      // Infer basic types from default values
      let type = 'unknown'
      if (defaultValue) {
        if (defaultValue === 'true' || defaultValue === 'false') {
          type = 'boolean'
        } else if (!isNaN(Number(defaultValue))) {
          type = 'number'
        } else if (defaultValue.startsWith("'") || defaultValue.startsWith('"')) {
          type = 'string'
        } else if (defaultValue === '[]') {
          type = 'unknown[]'
        } else if (defaultValue === '{}') {
          type = 'Record<string, unknown>'
        }
      }
      
      return {
        name: propName,
        type,
        optional: !!defaultValue,
        defaultValue
      }
    })
  
  return { componentName, props }
}

function generatePropsInterface(componentName, props) {
  if (props.length === 0) {
    return ''
  }
  
  const interfaceName = `${componentName}Props`
  const propsDefinition = props
    .map(prop => {
      const optional = prop.optional ? '?' : ''
      return `  ${prop.name}${optional}: ${prop.type}`
    })
    .join('\n')
  
  return `interface ${interfaceName} {
${propsDefinition}
}

`
}

function addTypeImports(content) {
  const hasReactImport = /import\s+React/.test(content)
  const hasReactTypeImport = /import.*\bReact\b.*from\s+['"]react['"]/.test(content)
  
  let imports = []
  
  // Add React types if component uses JSX
  if (content.includes('return (') || content.includes('<')) {
    if (!hasReactTypeImport) {
      imports.push("import type { FC, ReactNode, HTMLAttributes } from 'react'")
    }
  }
  
  // Add common type imports based on usage
  if (content.includes('onClick') || content.includes('onSubmit')) {
    imports.push("import type { MouseEvent, FormEvent } from 'react'")
  }
  
  if (content.includes('onChange') || content.includes('onInput')) {
    imports.push("import type { ChangeEvent } from 'react'")
  }
  
  return imports.length > 0 ? imports.join('\n') + '\n\n' : ''
}

function convertEventHandlers(content) {
  return content.replace(/onClick\s*=\s*\{([^}]*)\}/g, (match, handler) => {
    return `onClick={(event: MouseEvent<HTMLButtonElement>) => ${handler}}`
  })
  .replace(/onChange\s*=\s*\{([^}]*)\}/g, (match, handler) => {
    return `onChange={(event: ChangeEvent<HTMLInputElement>) => ${handler}}`
  })
  .replace(/onSubmit\s*=\s*\{([^}]*)\}/g, (match, handler) => {
    return `onSubmit={(event: FormEvent<HTMLFormElement>) => ${handler}}`
  })
}

function updateComponentSignature(content, componentName, props) {
  if (props.length === 0) {
    return content.replace(
      new RegExp(`(export\\s+(?:const|function)\\s+${componentName}\\s*=?\\s*)\\([^)]*\\)`, 'g'),
      `$1(): JSX.Element`
    )
  }
  
  const interfaceName = `${componentName}Props`
  return content.replace(
    new RegExp(`(export\\s+(?:const|function)\\s+${componentName}\\s*=?\\s*)\\([^)]*\\)`, 'g'),
    `$1({ ${props.map(p => p.name).join(', ')} }: ${interfaceName})`
  )
}

async function migrateComponent(filePath) {
  console.log(`🔄 Migrating: ${filePath}`)
  
  // Validate file exists and is .jsx/.js
  const ext = path.extname(filePath)
  if (!['.jsx', '.js'].includes(ext)) {
    console.error('❌ File must be .jsx or .js')
    return
  }
  
  const content = await readFile(filePath)
  const componentName = extractComponentName(filePath)
  const { props } = analyzeProps(content)
  
  console.log(`📋 Component: ${componentName}`)
  console.log(`📋 Props found: ${props.map(p => p.name).join(', ') || 'none'}`)
  
  // Generate TypeScript version
  let tsContent = content
  
  // Add type imports
  const typeImports = addTypeImports(content)
  if (typeImports) {
    tsContent = typeImports + tsContent
  }
  
  // Generate props interface
  const propsInterface = generatePropsInterface(componentName, props)
  if (propsInterface) {
    // Insert interface after imports
    const importEndIndex = tsContent.lastIndexOf('\n\n')
    const beforeImports = tsContent.substring(0, importEndIndex + 2)
    const afterImports = tsContent.substring(importEndIndex + 2)
    tsContent = beforeImports + propsInterface + afterImports
  }
  
  // Update component signature
  tsContent = updateComponentSignature(tsContent, componentName, props)
  
  // Convert common event handlers
  tsContent = convertEventHandlers(tsContent)
  
  // Create output paths
  const tsFilePath = filePath.replace(/\.(jsx|js)$/, '.tsx')
  const backupPath = filePath + '.bak'
  
  try {
    // Create backup of original
    await fs.copyFile(filePath, backupPath)
    console.log(`💾 Backup created: ${backupPath}`)
    
    // Write TypeScript version
    await writeFile(tsFilePath, tsContent)
    
    // Remove original file
    await fs.unlink(filePath)
    console.log(`🗑️  Removed: ${filePath}`)
    
    console.log(`✅ Migration completed: ${filePath} → ${tsFilePath}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

async function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    console.error('❌ Usage: node scripts/migrate-component.js <component-path>')
    console.error('   Example: node scripts/migrate-component.js src/components/ui/Button.jsx')
    process.exit(1)
  }
  
  const fullPath = path.resolve(filePath)
  
  try {
    await fs.access(fullPath)
  } catch {
    console.error(`❌ File not found: ${fullPath}`)
    process.exit(1)
  }
  
  await migrateComponent(fullPath)
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}