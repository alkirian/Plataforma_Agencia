import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default [
  {
    ignores: [
      'dist',
      'build',
      'node_modules',
      '*.config.js',
      '*.config.ts',
      'vite.config.ts',
      'tailwind.config.js',
      'postcss.config.js',
      '**/*.js.bak',
      '**/*.jsx.bak',
      '.eslintrc.js', // Ignore legacy ESLint config
      '**/*.min.js',
      'coverage',
      'scripts'
    ],
  },
  // Base JavaScript/TypeScript configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        navigator: 'readonly',
        AbortController: 'readonly',
        crypto: 'readonly',
        Blob: 'readonly',
        CustomEvent: 'readonly',
        getComputedStyle: 'readonly',
        requestAnimationFrame: 'readonly',
        require: 'readonly',
        FileReader: 'readonly',
        Event: 'readonly'
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      react,
      prettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      // React hooks rules disabled due to ESLint 9.x compatibility issues
      // TODO: Re-enable when eslint-plugin-react-hooks supports ESLint 9.x
      // ...reactHooks.configs.recommended.rules,
      
      // React specific rules
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react/prop-types': 'off', // We use TypeScript for prop validation
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-unknown-property': 'error',
      'react/self-closing-comp': 'error',
      
      // React Refresh
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      
      // General code quality
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true 
      }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      
      // Prettier integration
      'prettier/prettier': ['error', {
        singleQuote: true,
        semi: false,
        tabWidth: 2,
        trailingComma: 'es5',
        printWidth: 100,
        arrowParens: 'avoid',
        endOfLine: 'lf'
      }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // TypeScript specific configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      react,
      prettier,
    },
    rules: {
      // Disable conflicting JS rules
      'no-unused-vars': 'off',
      'no-undef': 'off', // TypeScript handles this
      
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true 
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports'
      }],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      
      // Enhanced type checking (will be enabled after migration)
      '@typescript-eslint/strict-boolean-expressions': 'off', // Enable after migration
      '@typescript-eslint/no-floating-promises': 'off', // Enable after migration
      '@typescript-eslint/require-await': 'off', // Enable after migration
      '@typescript-eslint/prefer-readonly': 'off', // Enable after migration
      
      // Import/Export organization
      '@typescript-eslint/no-import-type-side-effects': 'error',
      
      // React + TypeScript
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  // Migration-specific rules (temporary overrides)
  {
    files: ['**/*.{js,jsx}'], // Only JavaScript files during migration
    rules: {
      // Allow more flexible patterns during migration
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true 
      }],
      'no-console': 'warn', // More lenient during migration
      // Add other migration-friendly overrides as needed
    },
  },
  // Hook and custom component patterns
  // Disabled due to ESLint 9.x compatibility issues
  // TODO: Re-enable when eslint-plugin-react-hooks supports ESLint 9.x
  // {
  //   files: ['src/hooks/**/*.{ts,tsx}', 'src/**/use*.{ts,tsx}'],
  //   rules: {
  //     'react-hooks/rules-of-hooks': 'error',
  //     'react-hooks/exhaustive-deps': 'error',
  //   },
  // },
  // API and service files
  {
    files: ['src/api/**/*.{ts,tsx}', 'src/services/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // API responses might need any
      'no-console': ['error', { allow: ['warn', 'error'] }], // Stricter for services
    },
  },
  // Type definition files
  {
    files: ['src/types/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Type files may need any
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    },
  },
]