import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // TypeScript path resolution from tsconfig.json
    tsconfigPaths(),
    // TypeScript type checking during development
    // TypeScript checking only - ESLint disabled due to vite-plugin-checker incompatibility with ESLint 9.x
    // Use npm run lint for ESLint checking instead
    checker({
      typescript: true,
      overlay: {
        initialIsOpen: false,
        position: 'tl'
      }
    })
  ],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    // Enable HMR for TypeScript files
    hmr: {
      overlay: true
    }
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      // New Scope Rules aliases
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@app': path.resolve(__dirname, './src/app'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@auth': path.resolve(__dirname, './src/auth'),
      // Legacy aliases (to be deprecated after migration)
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@api': path.resolve(__dirname, './src/api'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@schedule': path.resolve(__dirname, './src/schedule'),
      '@constants': path.resolve(__dirname, './src/constants')
      ,
      // Back-compat for imports without '@' prefix
      'api': path.resolve(__dirname, './src/api'),
      'components': path.resolve(__dirname, './src/components')
    }
  },
  build: {
    // TypeScript build configuration
    target: 'es2020',
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      output: {
        // Vendor chunk splitting for better caching
        manualChunks: {
          // Core React ecosystem
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI Framework components
          'vendor-ui': ['framer-motion', '@headlessui/react', 'lucide-react'],
          // Data management and API
          'vendor-data': ['@tanstack/react-query', '@supabase/supabase-js'],
          // Form handling and notifications
          'vendor-forms': ['react-hook-form', 'react-hot-toast'],
          // Calendar functionality
          'vendor-calendar': [
            '@fullcalendar/react',
            '@fullcalendar/core',
            '@fullcalendar/daygrid',
            '@fullcalendar/timegrid',
            '@fullcalendar/interaction',
            '@fullcalendar/list'
          ],
          // Utility libraries
          'vendor-utils': ['clsx', 'tailwind-merge', 'date-fns']
        }
      }
    },
    // TypeScript-specific build optimizations
    minify: 'esbuild',
    chunkSizeWarningLimit: 600,
    reportCompressedSize: true,
    // Enable CSS code splitting
    cssCodeSplit: true
  },
  // Optimize dependencies for TypeScript
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'framer-motion',
      '@supabase/supabase-js'
    ],
    // Force TypeScript compilation for certain dependencies
    esbuildOptions: {
      target: 'es2020'
    }
  },
  // TypeScript-specific optimizations
  esbuild: {
    // Remove console logs in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  // TypeScript-specific environment variables
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
    __PROD__: process.env.NODE_ENV === 'production',
    __TS_MIGRATION__: true
  },
  // CSS processing
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/styles/variables.scss";'
      }
    }
  }
})
