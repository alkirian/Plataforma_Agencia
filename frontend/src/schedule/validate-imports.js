// Simple validation script to check critical imports work
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

console.log('🔍 Validating schedule module imports...')

// List of critical files and their imports to validate
const testFiles = [
  {
    file: 'components/calendar/CalendarToolbar.jsx',
    imports: [
      { from: '../modals/ExportModal', resolved: 'components/modals/ExportModal.jsx' },
      { from: './SearchBar', resolved: 'components/calendar/SearchBar.jsx' },
    ],
  },
  {
    file: 'components/modals/TaskPopover.jsx',
    imports: [
      { from: '../forms/TaskForm', resolved: 'components/forms/TaskForm.jsx' },
      { from: '../ai/TaskIdeasAI', resolved: 'components/ai/TaskIdeasAI.jsx' },
    ],
  },
]

let errors = 0

testFiles.forEach(({ file, imports }) => {
  console.log(`\n📁 Testing ${file}:`)

  const baseDir = resolve(__dirname, dirname(file))

  imports.forEach(({ from, resolved }) => {
    let targetPath

    if (from.startsWith('./') || from.startsWith('../')) {
      // Relative import
      targetPath = resolve(baseDir, from + '.jsx')
    } else {
      // Check if it's already absolute
      targetPath = resolve(__dirname, resolved)
    }

    if (existsSync(targetPath)) {
      console.log(`  ✅ ${from} -> ${targetPath}`)
    } else {
      console.log(`  ❌ ${from} -> ${targetPath} (NOT FOUND)`)
      errors++
    }
  })
})

console.log(`\n${errors === 0 ? '✅' : '❌'} Import validation complete: ${errors} errors found`)
process.exit(errors)
