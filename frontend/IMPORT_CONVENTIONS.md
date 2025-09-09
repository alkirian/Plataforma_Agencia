# Import Conventions & Guidelines

**Date**: September 6, 2025  
**Version**: 1.0  
**Status**: Active  

This document establishes standardized import conventions to prevent import resolution errors and maintain consistency across the codebase.

## 📋 Table of Contents

- [Core Principles](#core-principles)
- [Path Aliases](#path-aliases)
- [Import Patterns](#import-patterns)
- [Best Practices](#best-practices)
- [Common Mistakes](#common-mistakes)
- [Validation Tools](#validation-tools)
- [Migration Guidelines](#migration-guidelines)

---

## 🎯 Core Principles

### 1. **Consistency First**
All imports should follow the same pattern across the entire codebase.

### 2. **Alias Over Relative**
Prefer path aliases over complex relative imports (`../../../`).

### 3. **Explicit Over Implicit**
Always be explicit about what you're importing and from where.

### 4. **Future-Proof**
Use patterns that scale and won't break during refactoring.

---

## 🗂️ Path Aliases

The following path aliases are configured in both `tsconfig.json` and `vite.config.ts`:

### **Primary Aliases** (Preferred)
```typescript
// Core aliases - use these first
'@/*'           → './src/*'              // Root source directory
'@shared/*'     → './src/shared/*'       // Shared components, hooks, utils
'@features/*'   → './src/features/*'     // Feature modules
'@app/*'        → './src/app/*'          // App-level components

// Infrastructure
'@api/*'        → './src/api/*'          // API clients and services
'@lib/*'        → './src/lib/*'          // Third-party library configurations
'@types/*'      → './src/types/*'        // TypeScript type definitions
```

### **Legacy Aliases** (Transitioning)
```typescript
// These will be deprecated after migration
'@components/*' → './src/components/*'   // UI components
'@pages/*'      → './src/pages/*'        // Page components
'@hooks/*'      → './src/hooks/*'        // React hooks
'@styles/*'     → './src/styles/*'       // CSS/SCSS files
'@utils/*'      → './src/utils/*'        // Utility functions
'@services/*'   → './src/services/*'     // Business logic services
'@stores/*'     → './src/stores/*'       // State management
'@contexts/*'   → './src/contexts/*'     // React contexts
```

---

## 📦 Import Patterns

### ✅ **Recommended Patterns**

#### **1. External Dependencies First**
```typescript
// External libraries
import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'

// Path aliases
import { Button, Modal } from '@shared/components/ui'
import { useDocuments } from '@shared/hooks'
import { apiClient } from '@shared/services'

// Relative imports (only for same directory/immediate children)
import { LocalComponent } from './LocalComponent'
import { SubComponent } from './components/SubComponent'
```

#### **2. Import Order (ESLint enforced)**
```typescript
// 1. Node built-ins and external packages
import fs from 'fs'
import React from 'react'
import axios from 'axios'

// 2. Internal aliases (grouped by importance)
import { SharedComponent } from '@shared/components'
import { FeatureHook } from '@auth'
import { ApiService } from '@api/clients'

// 3. Relative imports
import { LocalUtil } from '../utils'
import { SiblingComponent } from './SiblingComponent'

// 4. Index imports
import './styles.css'
```

### ❌ **Avoid These Patterns**

#### **1. Deep Relative Imports**
```typescript
// ❌ Hard to maintain, breaks easily
import { Button } from '../../../components/ui/Button'
import { useAuth } from '../../../../hooks/useAuth'

// ✅ Use aliases instead
import { Button } from '@shared/components/ui'
import { useAuth } from '@shared/hooks'
```

#### **2. Mixed Import Styles**
```typescript
// ❌ Inconsistent pattern
import { ComponentA } from '@shared/components/ui'
import { ComponentB } from '../../../components/ui/ComponentB'

// ✅ Consistent pattern
import { ComponentA, ComponentB } from '@shared/components/ui'
```

#### **3. Importing from Barrel Exports' Internals**
```typescript
// ❌ Bypasses barrel exports
import { Button } from '@shared/components/ui/Button'

// ✅ Use barrel exports
import { Button } from '@shared/components/ui'
```

---

## 🏗️ Best Practices

### **1. Component Imports**

```typescript
// UI Components
import { Button, Modal, Input } from '@shared/components/ui'

// Feature Components
import { AuthForm } from '@auth/components'
import { DocumentList } from '@features/documents/components'

// Layout Components
import { Header, Sidebar } from '@shared/components/layout'
```

### **2. Hook Imports**

```typescript
// Shared Hooks
import { useTheme, useClickOutside } from '@shared/hooks'

// Feature Hooks
import { useAuth } from '@auth/hooks'
import { useDocuments } from '@features/documents/hooks'

// Legacy Hook (during migration)
import { useNotifications } from '@hooks/useNotifications'
```

### **3. API/Service Imports**

```typescript
// API Clients
import { apiClient } from '@api/api-client'
import { documentsApi } from '@api/documents'

// Services
import { authService } from '@shared/services/auth'
import { notificationService } from '@shared/services/notifications'
```

### **4. Type Imports**

```typescript
// Always use type-only imports for types
import type { User, Agency } from '@shared/types/auth'
import type { DocumentV2, DocumentStats } from '@shared/types/documents'
import type { ComponentProps } from '@shared/types/components'
```

### **5. Asset Imports**

```typescript
// Images and static assets
import logoUrl from '@/assets/logo.png'
import iconSprite from '@/assets/icons/sprite.svg'

// Styles
import '@/styles/globals.css'
import styles from './Component.module.css'
```

---

## 🚫 Common Mistakes

### **1. Circular Dependencies**
```typescript
// ❌ Can cause circular imports
// ComponentA imports ComponentB
// ComponentB imports ComponentA
```
**Solution**: Extract shared logic to a separate module.

### **2. Inconsistent File Extensions**
```typescript
// ❌ Mixed extensions
import { Hook } from '@hooks/useHook.js'    // .js extension
import { Other } from '@hooks/useOther'     // no extension

// ✅ Consistent pattern (no extensions for TypeScript)
import { Hook, Other } from '@hooks'
```

### **3. Import from Non-Existent Paths**
```typescript
// ❌ Path doesn't exist
import { Component } from '@shared/components/NonExistent'

// ✅ Verify path exists
import { Component } from '@shared/components/ui'
```

### **4. Importing Entire Libraries**
```typescript
// ❌ Imports entire library
import * as lodash from 'lodash'

// ✅ Import only what you need
import { debounce, throttle } from 'lodash'
```

---

## 🔧 Validation Tools

### **1. Import Validation Script**
```bash
# Run the comprehensive import validation
npm run validate:imports

# This checks for:
# - Broken import paths
# - Inconsistent patterns
# - Missing files
# - Circular dependencies
```

### **2. ESLint Rules**
The following ESLint rules are enforced:

- `import/no-unresolved` - Prevents imports of non-existent modules
- `import/order` - Enforces import order
- `import/no-duplicates` - Prevents duplicate imports
- `import/no-cycle` - Prevents circular dependencies
- `import/extensions` - Enforces extension conventions

### **3. TypeScript Integration**
Path aliases are configured in `tsconfig.json` to provide IDE support and type checking.

### **4. Pre-commit Hooks**
```bash
# Automatically run validation before commits
npm run pre-commit
```

---

## 📋 Migration Guidelines

### **Phase 1: Fix Critical Errors** ✅
- [x] Fix broken import paths in shared components
- [x] Update relative imports to use aliases
- [x] Resolve missing module errors

### **Phase 2: Standardize Patterns** 🔄
- [ ] Convert all `../../../` imports to aliases
- [ ] Standardize component imports to use barrel exports
- [ ] Migrate from legacy aliases to new structure

### **Phase 3: Optimize Structure** 📋
- [ ] Implement barrel exports for all feature modules
- [ ] Create consistent index files
- [ ] Optimize import performance

### **Migration Commands**
```bash
# Find complex relative imports
npm run find:complex-imports

# Convert relative to alias imports
npm run migrate:imports

# Validate all imports after migration
npm run validate:imports --fix
```

---

## 📊 Import Health Metrics

### **Current Status** (Sept 6, 2025)
- ✅ **Shared Components**: Fixed critical import errors
- ⚠️  **Legacy Hooks**: Some still using old patterns
- ❌ **Feature Modules**: Need barrel export implementation
- ⚠️  **API Layer**: Mixed import patterns

### **Success Criteria**
- Zero broken import paths
- < 5% relative imports with depth > 2
- 100% TypeScript path alias coverage
- All components importable via barrel exports

---

## 🔄 Continuous Monitoring

### **Daily Checks**
- Run `npm run validate:imports` before deployment
- Monitor TypeScript errors for import issues
- Check ESLint warnings for import violations

### **Weekly Reviews**
- Analyze import patterns in new code
- Update conventions based on team feedback
- Review and refactor complex import chains

### **Monthly Audits**
- Full codebase import analysis
- Performance impact assessment
- Dependency graph optimization

---

## 🆘 Troubleshooting

### **Import Not Found**
1. Check if the file exists at the path
2. Verify the export exists in the target file
3. Check if path alias is correctly configured
4. Ensure file extension matches configuration

### **Circular Dependency**
1. Use the import validation script to identify cycles
2. Extract shared logic to separate modules
3. Consider using dependency injection
4. Implement lazy loading where appropriate

### **Performance Issues**
1. Avoid importing entire libraries
2. Use tree-shaking compatible imports
3. Implement code splitting for large modules
4. Monitor bundle size impact

---

## 📚 Resources

- [TypeScript Path Mapping](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping)
- [Vite Path Aliases](https://vitejs.dev/config/shared-options.html#resolve-alias)
- [ESLint Import Plugin](https://github.com/import-js/eslint-plugin-import)
- [Import Validation Script](./scripts/validate-imports.js)

---

**Last Updated**: September 6, 2025  
**Next Review**: September 20, 2025  
**Maintained by**: Development Team