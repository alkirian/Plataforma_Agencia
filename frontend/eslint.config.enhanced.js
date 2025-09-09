import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'
// import importPlugin from 'eslint-plugin-import' // Removed due to ESLint 9.x compatibility

// Custom rules for architectural enforcement
const architecturalRules = {
  // Prevent component duplication
  'no-duplicate-buttons': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Prevent creating duplicate button components',
        category: 'Architecture',
      },
      messages: {
        duplicateButton:
          'Use the existing Button component from @/components/ui/Button instead of creating {{elementType}}',
        useBaseButton:
          'Import Button from @/components/ui/Button rather than creating inline buttons',
      },
    },
    create(context) {
      return {
        JSXElement(node) {
          if (node.openingElement.name.name === 'button') {
            const hasClassName = node.openingElement.attributes.some(
              attr => attr.name && attr.name.name === 'className'
            )
            if (hasClassName) {
              context.report({
                node,
                messageId: 'duplicateButton',
                data: { elementType: 'button element' },
              })
            }
          }
        },
        JSXFragment(node) {
          // Check for multiple button definitions in same file
          const buttons = node.children.filter(
            child => child.type === 'JSXElement' && child.openingElement.name.name === 'button'
          )
          if (buttons.length > 1) {
            buttons.slice(1).forEach(button => {
              context.report({
                node: button,
                messageId: 'useBaseButton',
              })
            })
          }
        },
      }
    },
  },
}

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
      'scripts/**/*',
      'public/**/*',
      '**/.tsbuildinfo',
      'coverage/**/*',
    ],
  },
  // Base JavaScript/TypeScript configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
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
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
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
      // import: importPlugin, // Disabled due to ESLint 9.x compatibility
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

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
      'react/jsx-closing-bracket-location': 'error',
      'react/jsx-closing-tag-location': 'error',

      // Component Architecture Rules
      'react/jsx-pascal-case': [
        'error',
        {
          allowAllCaps: false,
          allowNamespace: false,
          allowLeadingUnderscore: false,
        },
      ],

      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],

      // Prevent common anti-patterns
      'react/jsx-no-bind': [
        'warn',
        {
          ignoreRefs: true,
          allowArrowFunctions: true,
          allowFunctions: false,
          allowBind: false,
        },
      ],

      'react/no-array-index-key': 'warn',
      'react/no-unused-state': 'error',
      'react/prefer-stateless-function': 'warn',

      // React Refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Import organization rules disabled due to ESLint 9.x compatibility issues
      // TODO: Re-enable when eslint-plugin-import supports ESLint 9.x

      // General code quality
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'no-magic-numbers': [
        'warn',
        {
          ignore: [-1, 0, 1, 2, 100, 1000],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
        },
      ],

      // Error Prevention
      'no-implicit-coercion': 'error',
      'no-implicit-globals': 'error',
      'no-implied-eval': 'error',
      'no-invalid-this': 'error',
      'no-iterator': 'error',
      'no-labels': 'error',
      'no-lone-blocks': 'error',
      'no-loop-func': 'error',
      'no-multi-spaces': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-octal-escape': 'error',
      'no-proto': 'error',
      'no-return-assign': 'error',
      'no-script-url': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'no-void': 'error',
      'no-warning-comments': [
        'warn',
        {
          terms: ['todo', 'fixme', 'hack'],
          location: 'start',
        },
      ],

      // Prettier integration
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: false,
          tabWidth: 2,
          trailingComma: 'es5',
          printWidth: 100,
          arrowParens: 'avoid',
          endOfLine: 'lf',
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
      // Import resolver disabled due to ESLint 9.x compatibility
    },
  },
  // TypeScript specific configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: '.',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      react,
      prettier,
      // import: importPlugin, // Disabled due to ESLint 9.x compatibility
    },
    rules: {
      // Disable conflicting JS rules
      'no-unused-vars': 'off',
      'no-undef': 'off', // TypeScript handles this
      'no-redeclare': 'off',
      'no-use-before-define': 'off',

      // TypeScript specific rules - Strict Mode
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@typescript-eslint/no-confusing-void-expression': 'error',
      '@typescript-eslint/no-duplicate-enum-values': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      '@typescript-eslint/no-mixed-enums': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/prefer-function-type': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',

      // Stricter rules for production readiness
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: false,
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Enhanced type checking for production readiness
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // Import/Export organization
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // React + TypeScript
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  // Component Duplication Prevention Rules
  {
    files: ['src/components/**/*.{ts,tsx,js,jsx}'],
    rules: {
      // Prevent DOM button elements when Button component exists
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "JSXElement[openingElement.name.name='button'][openingElement.attributes.length>0]",
          message:
            'Use the Button component from @/components/ui/Button instead of raw button elements with attributes',
        },
        {
          selector:
            "JSXElement[openingElement.name.name='input'][openingElement.attributes.length>0] > JSXAttribute[name.name='type'][value.value='button']",
          message:
            'Use the Button component from @/components/ui/Button instead of input[type="button"]',
        },
      ],

      // Component naming conventions
      'react/jsx-pascal-case': [
        'error',
        {
          allowAllCaps: false,
          allowNamespace: false,
          allowLeadingUnderscore: false,
        },
      ],

      // Prevent inline styles that should be in components
      'react/forbid-component-props': [
        'error',
        {
          forbid: [
            {
              propName: 'style',
              message: 'Use Tailwind classes or styled components instead of inline styles',
            },
          ],
        },
      ],

      // Enforce proper component structure
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
    },
  },
  // UI Base Components - Stricter Rules
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      // Stricter TypeScript for base components
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',

      // Props validation
      'react/prop-types': 'off', // We use TypeScript
      'react/require-default-props': 'off', // TypeScript handles defaults

      // Performance - Force memoization for base components
      'react/display-name': 'error',
    },
  },
  // Feature Components - Architecture Rules
  {
    files: [
      'src/components/{dashboard,schedule,documents,auth,ai,contextSources,ideas,client,settings,notifications}/**/*.{ts,tsx,js,jsx}',
    ],
    rules: {
      // Import restrictions disabled due to ESLint 9.x compatibility
      // TODO: Re-enable when eslint-plugin-import supports ESLint 9.x

      // Enforce feature-based organization (basic pattern restriction)
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../../*'],
              message: 'Avoid deep relative imports. Use absolute imports with @ aliases instead.',
            },
          ],
        },
      ],

      // Prevent creating new base components in feature folders
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'ExportDefaultDeclaration > ArrowFunctionExpression[params.0.name=/^(Button|Input|Modal|Card|Icon)Props$/]',
          message: 'Base UI components should be created in src/components/ui/ folder',
        },
      ],
    },
  },
  // Migration-specific rules (temporary overrides for JS files)
  {
    files: ['**/*.{js,jsx}'],
    rules: {
      // More lenient during migration
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': 'off', // TS rules don't apply to JS
    },
  },
  // Hook-specific rules
  {
    files: ['src/hooks/**/*.{ts,tsx}', 'src/**/use*.{ts,tsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error', // Hooks should have explicit return types
    },
  },
  // API and service files - Stricter error handling
  {
    files: ['src/api/**/*.{ts,tsx}', 'src/services/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // API responses might need any initially
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }], // Stricter for services
      'prefer-promise-reject-errors': 'error',
    },
  },
  // Type definition files
  {
    files: ['src/types/**/*.ts', '**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // Type files may need any during migration
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/no-empty-interface': [
        'error',
        {
          allowSingleExtends: true,
        },
      ],
    },
  },
  // Test files
  {
    files: ['**/*.{test,spec}.{ts,tsx,js,jsx}', '**/__tests__/**/*.{ts,tsx,js,jsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-magic-numbers': 'off',
      'no-console': 'off',
    },
  },
]
