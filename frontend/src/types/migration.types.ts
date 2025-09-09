// TypeScript migration and component optimization types

// Migration status tracking
export type MigrationStatus = 'pending' | 'in_progress' | 'completed' | 'needs_review'

export interface ComponentMigrationInfo {
  filePath: string
  originalExtension: '.js' | '.jsx'
  targetExtension: '.ts' | '.tsx'
  migrationStatus: MigrationStatus
  complexityScore: number
  dependencies: string[]
  typesCoverage: number
  lastModified: string
  estimatedEffort: 'low' | 'medium' | 'high'
}

// Component duplication analysis
export interface DuplicateComponent {
  name: string
  files: string[]
  similarityScore: number
  category: 'button' | 'modal' | 'form' | 'layout' | 'other'
  refactorPriority: 'high' | 'medium' | 'low'
}

export interface ComponentOptimization {
  componentName: string
  currentInstances: number
  proposedStructure: 'atomic' | 'molecular' | 'organism'
  reusabilityScore: number
  recommendations: string[]
}

// TypeScript configuration for progressive enhancement
export interface TypeScriptConfig {
  strictMode: boolean
  allowJsFiles: boolean
  checkJsFiles: boolean
  skipLibCheck: boolean
  incremental: boolean
  baselineAccuracy: number
}

// Development tools integration
export interface DevToolsState {
  typeCheckingEnabled: boolean
  hotReloadWorking: boolean
  eslintIntegration: boolean
  prettierIntegration: boolean
  testCoverage: number
}

// Code quality metrics
export interface CodeQualityMetrics {
  typesCoverage: number
  eslintErrors: number
  eslintWarnings: number
  testCoverage: number
  bundleSize: number
  performanceScore: number
}

// Migration progress tracking
export interface MigrationProgress {
  totalFiles: number
  migratedFiles: number
  pendingFiles: number
  completionPercentage: number
  estimatedTimeRemaining: string
  blockers: string[]
}

// Feature flag for gradual rollout
export interface MigrationFeatureFlags {
  enableTypeScriptFiles: boolean
  enableStrictMode: boolean
  enableBundleOptimization: boolean
  enableComponentOptimization: boolean
  enableAdvancedLinting: boolean
}

// Error tracking during migration
export interface MigrationError {
  file: string
  line: number
  column: number
  message: string
  severity: 'error' | 'warning' | 'info'
  category: 'type' | 'syntax' | 'lint' | 'dependency'
}

export interface MigrationReport {
  timestamp: string
  phase: 'foundation' | 'components' | 'optimization' | 'validation'
  progress: MigrationProgress
  errors: MigrationError[]
  metrics: CodeQualityMetrics
  recommendations: string[]
}
