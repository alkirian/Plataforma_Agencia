/**
 * ESLint Import Rules Configuration
 *
 * Prevents common import resolution errors and enforces consistent import patterns.
 * Designed to work with the existing ESLint 9.x configuration.
 */

export const importRules = {
  rules: {
    // Import resolution and path rules
    'import/no-unresolved': [
      'error',
      {
        ignore: [
          '^@', // Ignore path aliases (handled by TypeScript)
          '\\.(css|scss|sass|less|styl|stylus|svg|png|jpg|jpeg|gif|webp)$',
        ],
      },
    ],

    // Prevent importing non-existent named exports
    'import/named': 'error',

    // Ensure default imports correspond to modules with default exports
    'import/default': 'error',

    // Prevent importing Node.js modules that don't exist
    'import/no-nodejs-modules': 'off', // Allow Node.js modules in frontend

    // Prevent duplicate imports from same module
    'import/no-duplicates': [
      'error',
      {
        considerQueryString: true,
      },
    ],

    // Import order and grouping
    'import/order': [
      'error',
      {
        groups: [
          ['builtin', 'external'], // Node built-ins and npm packages
          ['internal'], // Internal aliases (@shared, @components, etc.)
          ['parent', 'sibling'], // Relative imports
          ['index'], // Index imports
        ],
        pathGroups: [
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@shared/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@components/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@features/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
        'newlines-between': 'always',
      },
    ],

    // Require file extensions for non-JS files
    'import/extensions': [
      'error',
      'never',
      {
        css: 'always',
        scss: 'always',
        svg: 'always',
        png: 'always',
        jpg: 'always',
        jpeg: 'always',
        gif: 'always',
        webp: 'always',
      },
    ],

    // Prevent importing packages not listed in package.json
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/*.test.{js,jsx,ts,tsx}',
          '**/*.spec.{js,jsx,ts,tsx}',
          '**/tests/**/*',
          '**/test-utils/**/*',
          '**/*.config.{js,ts}',
          '**/scripts/**/*',
        ],
      },
    ],

    // Prevent imports from internal modules
    'import/no-internal-modules': 'off', // Allow for barrel exports

    // Require modules to be in specific locations
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // Prevent shared modules from importing feature-specific modules
          {
            target: './src/shared/**/*',
            from: './src/features/**/*',
            message: 'Shared modules should not import from features',
          },
          {
            target: './src/shared/**/*',
            from: './src/dashboard/**/*',
            message: 'Shared modules should not import from dashboard',
          },
          {
            target: './src/shared/**/*',
            from: './src/schedule/**/*',
            message: 'Shared modules should not import from schedule',
          },
          // Prevent direct imports to deep component paths when barrel exports exist
          {
            target: './src/**/*',
            from: './src/components/ui/**/*',
            except: ['./src/components/ui/index.js'],
            message: 'Import UI components from @components/ui instead of direct paths',
          },
        ],
      },
    ],

    // Custom rules for path aliases
    'import/no-relative-parent-imports': 'off', // Allow relative imports for now

    // Prevent cyclical dependencies
    'import/no-cycle': [
      'error',
      {
        maxDepth: 10,
        ignoreExternal: true,
      },
    ],

    // Ensure all imports are at top of file
    'import/first': 'error',

    // Ensure newline after imports
    'import/newline-after-import': [
      'error',
      {
        count: 1,
      },
    ],

    // Prevent webpack loader syntax in imports
    'import/no-webpack-loader-syntax': 'error',

    // Prefer default exports for single-export modules
    'import/prefer-default-export': 'off', // Allow named exports

    // Prevent imports of modules with no exports
    'import/no-empty-named-blocks': 'error',
  },

  // Settings for import resolution
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },

    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],

    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },

    // Path mapping for aliases
    'import/alias': {
      map: [
        ['@', './src'],
        ['@features', './src/features'],
        ['@shared', './src/shared'],
        ['@app', './src/app'],
        ['@infrastructure', './src/infrastructure'],
        ['@components', './src/components'],
        ['@pages', './src/pages'],
        ['@hooks', './src/hooks'],
        ['@api', './src/api'],
        ['@lib', './src/lib'],
        ['@styles', './src/styles'],
        ['@types', './src/types'],
        ['@utils', './src/utils'],
        ['@services', './src/services'],
        ['@stores', './src/stores'],
        ['@contexts', './src/contexts'],
      ],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
  },
}

// Custom rule to warn about complex relative imports
export const customImportRule = {
  'no-complex-relative-imports': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Prevent overly complex relative imports that should use path aliases',
        category: 'Best Practices',
      },
      schema: [
        {
          type: 'object',
          properties: {
            maxDepth: {
              type: 'integer',
              minimum: 1,
            },
          },
          additionalProperties: false,
        },
      ],
    },

    create(context) {
      const maxDepth = context.options[0]?.maxDepth || 2

      return {
        ImportDeclaration(node) {
          const importPath = node.source.value

          if (typeof importPath === 'string' && importPath.startsWith('./')) {
            const depth = (importPath.match(/\.\.\//g) || []).length

            if (depth > maxDepth) {
              context.report({
                node,
                message: `Relative import with depth ${depth} should use path alias instead: "${importPath}"`,
              })
            }
          }
        },
      }
    },
  },
}
