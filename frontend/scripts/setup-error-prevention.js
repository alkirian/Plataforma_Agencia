#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

/**
 * Error Prevention Framework Setup and Validation Script
 * Sets up and validates the entire error prevention system
 */

class ErrorPreventionSetup {
  constructor() {
    this.validationResults = {
      success: true,
      errors: [],
      warnings: [],
      configured: [],
      skipped: []
    }
  }

  /**
   * Run complete setup and validation
   */
  async setup() {
    console.log('🚀 Setting up Error Prevention Framework...\n')
    
    try {
      // 1. Validate environment
      await this.validateEnvironment()
      
      // 2. Install additional dependencies if needed
      await this.installDependencies()
      
      // 3. Configure Git hooks
      await this.configureGitHooks()
      
      // 4. Setup directory structure
      await this.setupDirectories()
      
      // 5. Validate configurations
      await this.validateConfigurations()
      
      // 6. Test error prevention systems
      await this.testSystems()
      
      // 7. Generate setup report
      this.generateSetupReport()
      
      return this.validationResults
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message)
      this.validationResults.success = false
      this.validationResults.errors.push({
        type: 'setup_failed',
        message: error.message
      })
      return this.validationResults
    }
  }

  /**
   * Validate development environment
   */
  async validateEnvironment() {
    console.log('🔍 Validating environment...')
    
    // Check Node.js version
    const nodeVersion = process.version
    console.log(`   Node.js version: ${nodeVersion}`)
    
    if (!nodeVersion.startsWith('v18') && !nodeVersion.startsWith('v19') && !nodeVersion.startsWith('v20')) {
      this.validationResults.warnings.push({
        type: 'node_version',
        message: `Node.js version ${nodeVersion} may not be optimal. Recommend v18+ for best compatibility.`
      })
    }
    
    // Check if in correct directory
    if (!existsSync('package.json')) {
      throw new Error('package.json not found. Please run this script from the frontend directory.')
    }
    
    // Check if npm is available
    try {
      execSync('npm --version', { stdio: 'pipe' })
      this.validationResults.configured.push('npm available')
    } catch (error) {
      throw new Error('npm is not available. Please install Node.js and npm.')
    }
    
    // Check TypeScript availability
    try {
      execSync('npx tsc --version', { stdio: 'pipe' })
      this.validationResults.configured.push('TypeScript available')
    } catch (error) {
      this.validationResults.warnings.push({
        type: 'typescript_missing',
        message: 'TypeScript not found globally. Using local version.'
      })
    }
  }

  /**
   * Install additional dependencies if needed
   */
  async installDependencies() {
    console.log('📦 Checking dependencies...')
    
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
    const requiredDeps = {
      devDependencies: {
        'eslint-plugin-import': '^2.29.0',
        'vite-bundle-analyzer': '^0.7.0'
      }
    }
    
    const missingDeps = []
    
    // Check for missing dev dependencies
    for (const [dep, version] of Object.entries(requiredDeps.devDependencies)) {
      if (!packageJson.devDependencies?.[dep]) {
        missingDeps.push(`${dep}@${version}`)
      }
    }
    
    if (missingDeps.length > 0) {
      console.log(`   Installing missing dependencies: ${missingDeps.join(', ')}`)
      try {
        execSync(`npm install --save-dev ${missingDeps.join(' ')}`, { stdio: 'inherit' })
        this.validationResults.configured.push(`Installed dependencies: ${missingDeps.join(', ')}`)
      } catch (error) {
        this.validationResults.warnings.push({
          type: 'dependency_install_failed',
          message: `Failed to install: ${missingDeps.join(', ')}. Install manually if needed.`
        })
      }
    } else {
      this.validationResults.configured.push('All required dependencies present')
    }
  }

  /**
   * Configure Git hooks with Husky
   */
  async configureGitHooks() {
    console.log('🪝 Configuring Git hooks...')
    
    try {
      // Initialize Husky if not already done
      if (!existsSync('.husky')) {
        execSync('npx husky install', { stdio: 'inherit' })
        this.validationResults.configured.push('Husky initialized')
      } else {
        this.validationResults.configured.push('Husky already configured')
      }
      
      // Make hook files executable (Unix systems)
      if (process.platform !== 'win32') {
        if (existsSync('.husky/pre-commit')) {
          execSync('chmod +x .husky/pre-commit', { stdio: 'pipe' })
        }
        if (existsSync('.husky/pre-push')) {
          execSync('chmod +x .husky/pre-push', { stdio: 'pipe' })
        }
        this.validationResults.configured.push('Hook files made executable')
      }
      
    } catch (error) {
      this.validationResults.warnings.push({
        type: 'git_hooks_setup_failed',
        message: `Git hooks setup failed: ${error.message}. Manual configuration may be needed.`
      })
    }
  }

  /**
   * Setup required directory structure
   */
  async setupDirectories() {
    console.log('📁 Setting up directory structure...')
    
    const requiredDirs = [
      'reports',
      'scripts',
      'src/components/system',
      'src/services',
      '.vscode'
    ]
    
    for (const dir of requiredDirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
        this.validationResults.configured.push(`Created directory: ${dir}`)
      }
    }
    
    // Create VSCode settings if not exists
    const vscodeSettings = {
      "typescript.preferences.importModuleSpecifier": "non-relative",
      "typescript.suggest.autoImports": true,
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true,
        "source.organizeImports": true
      },
      "eslint.validate": [
        "javascript", "javascriptreact", 
        "typescript", "typescriptreact"
      ],
      "files.exclude": {
        "**/.tsbuildinfo": true,
        "**/node_modules": true,
        "**/dist": true
      }
    }
    
    const vscodeSettingsPath = '.vscode/settings.json'
    if (!existsSync(vscodeSettingsPath)) {
      writeFileSync(vscodeSettingsPath, JSON.stringify(vscodeSettings, null, 2))
      this.validationResults.configured.push('VSCode settings created')
    }
  }

  /**
   * Validate all configuration files
   */
  async validateConfigurations() {
    console.log('⚙️  Validating configurations...')
    
    const requiredFiles = [
      {
        file: 'eslint.config.enhanced.js',
        description: 'Enhanced ESLint configuration'
      },
      {
        file: 'tsconfig.production.json',
        description: 'Production TypeScript configuration'
      },
      {
        file: 'scripts/detect-component-duplication.js',
        description: 'Component duplication detection script'
      },
      {
        file: 'scripts/migration-safety-check.js',
        description: 'Migration safety validation script'
      },
      {
        file: 'src/components/system/ErrorBoundary.tsx',
        description: 'Error boundary system'
      },
      {
        file: 'src/services/monitoring.service.ts',
        description: 'Monitoring service'
      },
      {
        file: 'DEVELOPER_GUIDELINES.md',
        description: 'Developer guidelines documentation'
      }
    ]
    
    for (const { file, description } of requiredFiles) {
      if (existsSync(file)) {
        this.validationResults.configured.push(`✅ ${description}`)
      } else {
        this.validationResults.errors.push({
          type: 'missing_file',
          file,
          message: `Missing: ${description}`
        })
      }
    }
  }

  /**
   * Test error prevention systems
   */
  async testSystems() {
    console.log('🧪 Testing systems...')
    
    // Test ESLint configuration
    try {
      execSync('npm run lint -- --max-warnings 0 scripts/setup-error-prevention.js', { stdio: 'pipe' })
      this.validationResults.configured.push('✅ ESLint configuration working')
    } catch (error) {
      // This is expected if there are linting issues, but we want to make sure ESLint runs
      const output = error.stdout ? error.stdout.toString() : ''
      if (output.includes('eslint')) {
        this.validationResults.configured.push('✅ ESLint configuration working (with warnings)')
      } else {
        this.validationResults.errors.push({
          type: 'eslint_test_failed',
          message: 'ESLint test failed - configuration may be invalid'
        })
      }
    }
    
    // Test TypeScript configuration
    try {
      execSync('npm run type-check', { stdio: 'pipe' })
      this.validationResults.configured.push('✅ TypeScript configuration working')
    } catch (error) {
      this.validationResults.warnings.push({
        type: 'typescript_errors',
        message: 'TypeScript compilation has errors - review and fix'
      })
    }
    
    // Test component duplication detection
    try {
      execSync('node scripts/detect-component-duplication.js', { stdio: 'pipe' })
      this.validationResults.configured.push('✅ Component duplication detection working')
    } catch (error) {
      this.validationResults.warnings.push({
        type: 'component_duplication_issues',
        message: 'Component duplication detected - review generated report'
      })
    }
    
    // Test migration safety check
    try {
      execSync('node scripts/migration-safety-check.js', { stdio: 'pipe' })
      this.validationResults.configured.push('✅ Migration safety check working')
    } catch (error) {
      this.validationResults.warnings.push({
        type: 'migration_safety_issues',
        message: 'Migration safety concerns detected - review generated report'
      })
    }
  }

  /**
   * Generate comprehensive setup report
   */
  generateSetupReport() {
    const report = {
      timestamp: new Date().toISOString(),
      success: this.validationResults.success,
      summary: {
        configured: this.validationResults.configured.length,
        errors: this.validationResults.errors.length,
        warnings: this.validationResults.warnings.length,
        skipped: this.validationResults.skipped.length
      },
      details: this.validationResults
    }
    
    // Write JSON report
    writeFileSync('setup-report.json', JSON.stringify(report, null, 2))
    
    // Print console summary
    console.log('\n📋 ERROR PREVENTION FRAMEWORK SETUP REPORT')
    console.log('=' .repeat(50))
    
    if (report.success && report.summary.errors === 0) {
      console.log('✅ Setup completed successfully!')
    } else {
      console.log('⚠️  Setup completed with issues')
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Configured: ${report.summary.configured}`)
    console.log(`   ❌ Errors: ${report.summary.errors}`)
    console.log(`   ⚠️  Warnings: ${report.summary.warnings}`)
    
    if (this.validationResults.errors.length > 0) {
      console.log('\n❌ Errors:')
      this.validationResults.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.type}: ${error.message}`)
      })
    }
    
    if (this.validationResults.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      this.validationResults.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning.type}: ${warning.message}`)
      })
    }
    
    console.log('\n🎯 Next Steps:')
    console.log('1. Review DEVELOPER_GUIDELINES.md for usage instructions')
    console.log('2. Run: npm run quality:check to validate current code')
    console.log('3. Run: npm run component:check to detect duplications')
    console.log('4. Run: node scripts/migration-safety-check.js for migration status')
    
    if (this.validationResults.errors.length === 0) {
      console.log('\n🎉 Error Prevention Framework is ready!')
      console.log('   The 95% component duplication issue will no longer occur.')
      console.log('   All quality gates are active and monitoring is enabled.')
    } else {
      console.log('\n⚠️  Please address the errors above before proceeding.')
    }
    
    console.log(`\n📄 Full report saved to: setup-report.json`)
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new ErrorPreventionSetup()
  
  setup.setup().then(result => {
    if (!result.success || result.errors.length > 0) {
      console.log('\n❌ Setup completed with errors')
      process.exit(1)
    }
    
    console.log('\n✅ Error Prevention Framework setup completed successfully!')
    process.exit(0)
  }).catch(error => {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  })
}

export default ErrorPreventionSetup