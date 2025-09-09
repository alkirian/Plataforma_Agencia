/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_API_URL: string
  readonly VITE_APP_VERSION: string
  readonly NODE_ENV: 'development' | 'production' | 'test'
  // TypeScript migration feature flags
  readonly __TS_MIGRATION__: boolean
  readonly __DEV__: boolean
  readonly __PROD__: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global type declarations for better IDE support
declare global {
  const __DEV__: boolean
  const __PROD__: boolean
  const __TS_MIGRATION__: boolean

  // Additional Vite environment declarations
  interface Window {
    // Add any global window properties here
  }
}

// Supabase client type declarations
declare module '../supabaseClient' {
  import type { SupabaseClient } from '@supabase/supabase-js'
  const supabase: SupabaseClient
  export default supabase
}

// Utility function declarations for JS files
declare module '../lib/utils' {
  export function cn(...args: any[]): string
  export function formatDate(date: string | Date): string
  export function formatFileSize(size: number): string
  export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T
  export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T
}

export {}
