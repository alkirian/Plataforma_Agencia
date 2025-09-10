module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'jsx-a11y'],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    
    // === COMPONENT ARCHITECTURE RULES ===
    
    // Prevent direct button usage - encourage Button component
    'no-restricted-syntax': [
      'error',
      {
        selector: 'JSXElement[openingElement.name.name="button"]:not([openingElement.attributes.0.name.name="data-allow-direct-button"])',
        message: 'Use <Button> component instead of direct <button>. Import from @components/ui/Button. If this is intentional, add data-allow-direct-button prop.'
      },
      // Prevent direct modal/overlay creation
      {
        selector: 'JSXElement > JSXElement[openingElement.name.name="div"][openingElement.attributes.*.value.value*="fixed"][openingElement.attributes.*.value.value*="inset-0"]',
        message: 'Use <Modal> component instead of direct overlay div. Import from @components/ui/Modal.'
      },
      // Prevent inline loading spinners
      {
        selector: 'JSXElement[openingElement.name.name="div"][openingElement.attributes.*.value.value*="animate-spin"]',
        message: 'Use <LoadingSpinner> component instead of inline spinner. Import from @components/ui/LoadingSpinner.'
      },
      // Prevent direct input styling
      {
        selector: 'JSXElement[openingElement.name.name="input"][openingElement.attributes.*.name.name="className"]:not([openingElement.attributes.0.name.name="data-allow-direct-input"])',
        message: 'Consider using <Input> component for consistent styling. Import from @components/ui/Input. If this is a special case, add data-allow-direct-input prop.'
      }
    ],

    // === SCOPE RULES ENFORCEMENT ===
    
    // Prevent cross-feature imports
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/features/*/!(components/ui)/**'],
            message: 'Cross-feature imports violate Scope Rules. Move shared code to /shared/ directory or use @shared/ alias.'
          },
          // Prevent direct React imports in TSX files (prefer React.FC pattern)
          {
            group: ['react'],
            importNames: ['default'],
            message: 'Use named React imports or React.FC pattern instead of default import for better tree-shaking.'
          }
        ]
      }
    ],

    // === TYPE SAFETY RULES ===
    
    // Require explicit return types for components
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true
      }
    ],

    // Enforce consistent component prop interfaces
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

    // === ACCESSIBILITY RULES ===
    
    // Ensure interactive elements are accessible
    'jsx-a11y/interactive-supports-focus': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    
    // === PERFORMANCE RULES ===
    
    // Prevent unnecessary re-renders
    'react-hooks/exhaustive-deps': 'error',
    
    // === MAINTAINABILITY RULES ===
    
    // Limit component complexity
    'complexity': ['warn', 15],
    'max-lines-per-function': ['warn', { max: 50, skipComments: true, skipBlankLines: true }],
    
    // Enforce consistent naming
    '@typescript-eslint/naming-convention': [
      'error',
      // Component names must be PascalCase
      {
        selector: 'function',
        filter: {
          regex: '^[A-Z].*Component$|^[A-Z].*$',
          match: true
        },
        format: ['PascalCase']
      },
      // Hook names must start with 'use'
      {
        selector: 'function',
        filter: {
          regex: '^use[A-Z].*$',
          match: true
        },
        format: ['camelCase']
      },
      // Interface names should start with I or end with Props/State
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^(I[A-Z]|.*Props|.*State|.*Config|.*Options)$',
          match: true
        }
      }
    ],

    // === COMPONENT DOCUMENTATION ===
    
    // Require JSDoc for exported components (warning for now)
    'valid-jsdoc': 'off', // Use @typescript-eslint version instead
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // === IMPORTS ORGANIZATION ===
    
    // Prevent circular dependencies
    'import/no-cycle': 'off', // Would need eslint-plugin-import
    
    // === BEST PRACTICES ===
    
    // Prevent console.log in production
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    
    // Enforce consistent component patterns
    'react/jsx-fragments': ['error', 'syntax'], // Use <> instead of React.Fragment
    'react/jsx-boolean-value': ['error', 'never'], // Use shorthand boolean props
    
    // Prevent direct style objects (encourage CSS classes)
    'react/forbid-dom-props': [
      'warn',
      {
        forbid: [
          {
            propName: 'style',
            message: 'Use CSS classes instead of inline styles for consistency. If necessary, use data-allow-inline-style prop.'
          }
        ]
      }
    ]
  },

  // Override rules for specific file patterns
  overrides: [
    {
      // Allow direct HTML elements in test files
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      rules: {
        'no-restricted-syntax': 'off',
        'react/forbid-dom-props': 'off'
      }
    },
    {
      // More relaxed rules for config files
      files: ['**/*.config.{js,ts}', '**/vite.config.{js,ts}'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        'no-console': 'off'
      }
    },
    {
      // Special rules for legacy components during migration
      files: ['**/legacy/**/*.{tsx,jsx}'],
      rules: {
        'no-restricted-syntax': 'warn', // Allow but warn during migration
        'no-restricted-imports': 'warn'
      }
    },
    {
      // Base UI components have different rules
      files: ['**/components/ui/**/*.{tsx,ts}'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'error', // Stricter for base components
        'complexity': ['error', 10], // Lower complexity for reusable components
        'max-lines-per-function': ['error', { max: 40, skipComments: true, skipBlankLines: true }]
      }
    }
  ]
}