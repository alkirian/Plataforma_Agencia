# 🔄 Feature Module Migration Template
**Plataforma Agencia - Scope Rules Migration Guide**  
**Based on**: Schedule Module Migration Success  
**Version**: 1.0  
**Updated**: September 6, 2025  

---

## 🎯 **OVERVIEW**

This template provides a **comprehensive, step-by-step guide** for migrating any feature from the legacy structure to the new Scope Rules architecture. It's based on the successful Schedule module migration and includes all lessons learned, best practices, and validation procedures.

---

## 🚀 **QUICK START CHECKLIST**

### **📋 Pre-Migration Checklist**
- [ ] **Feature Analysis Complete** - Component inventory and dependency mapping
- [ ] **Migration Plan Approved** - Timeline, complexity assessment, and resource allocation
- [ ] **Backup Created** - Full codebase backup before starting migration
- [ ] **Team Coordination** - All stakeholders informed of migration schedule
- [ ] **Testing Strategy** - Test plan and validation procedures defined

### **⚡ Migration Phases Overview**
1. **Analysis & Planning** (1-2 days) - Understanding current state
2. **Structure Creation** (2-4 hours) - New module foundation
3. **Component Migration** (1-3 days) - Moving and organizing components
4. **TypeScript Integration** (1-2 days) - Types and interfaces
5. **Import Path Updates** (4-8 hours) - Updating all consumers
6. **Testing & Validation** (4-8 hours) - Ensuring functionality
7. **Documentation** (2-4 hours) - Updating guides and docs

---

## 🔍 **PHASE 1: ANALYSIS & PLANNING**

### **🎯 Step 1.1: Feature Inventory**

#### **Component Discovery**
```bash
# Find all components related to the feature
find src/components/[FEATURE_NAME] -name "*.jsx" -o -name "*.js" -o -name "*.tsx" -o -name "*.ts"

# Alternative: Search by naming convention
grep -r "[FeatureName]" src/components/ --include="*.jsx" --include="*.js" | cut -d: -f1 | sort -u

# Find scattered components
grep -r "import.*[FEATURE_NAME]" src/ --include="*.jsx" --include="*.js" | head -20
```

#### **Dependency Mapping**
```bash
# Find all files importing feature components
grep -r "from.*components/[FEATURE_NAME]" src/ --include="*.jsx" --include="*.js"

# Find API usage
grep -r "import.*[FEATURE_NAME]" src/api/ --include="*.js"

# Find hook usage
grep -r "use[FeatureName]" src/hooks/ --include="*.js"
```

#### **Create Inventory Document**
```markdown
# [FEATURE_NAME] Migration Analysis

## Component Inventory
- [ ] Component A (src/components/[feature]/ComponentA.jsx)
- [ ] Component B (src/components/[feature]/ComponentB.jsx)
- [ ] [List all components...]

## Dependencies Found
- API: src/api/[feature].js
- Hooks: src/hooks/use[Feature].js  
- Constants: src/constants/[feature].js
- Types: [existing TypeScript files]

## External Usage
- Page: src/pages/[Page]Page.jsx (imports ComponentA)
- Component: src/components/other/[Component].jsx (uses ComponentB)
- [List all external usage...]

## Complexity Assessment
- **Low**: Simple UI components, minimal state
- **Medium**: Some business logic, moderate interdependencies  
- **High**: Complex state management, many dependencies
```

### **🎯 Step 1.2: Migration Strategy**

#### **Complexity Assessment Matrix**
| Complexity | Components | State Management | Dependencies | Timeline |
|------------|------------|------------------|--------------|----------|
| **Low** | 1-5 simple components | Local state only | Minimal external deps | 1-2 days |
| **Medium** | 5-15 components | Custom hooks | Some cross-feature usage | 3-5 days |
| **High** | 15+ components | Complex state/context | Heavy interdependencies | 1-2 weeks |

#### **Risk Assessment**
```markdown
## Migration Risks

### High Risk Items
- [ ] Components with complex prop drilling
- [ ] Shared state between features  
- [ ] Heavy external dependencies
- [ ] Legacy code without tests

### Medium Risk Items
- [ ] Components with custom hooks
- [ ] TypeScript integration challenges
- [ ] Multiple file imports

### Low Risk Items  
- [ ] Simple presentational components
- [ ] Well-isolated functionality
- [ ] Good test coverage
```

### **🎯 Step 1.3: Migration Plan**

#### **Timeline Template**
```markdown
# [FEATURE_NAME] Migration Timeline

## Week 1: Foundation
- Day 1-2: Analysis & Planning
- Day 3: Structure Creation & Component Migration (Phase 1)
- Day 4: Component Migration (Phase 2) & TypeScript Integration
- Day 5: Import Updates & Testing

## Week 2 (if needed): Completion & Documentation  
- Day 1-2: Complex component migrations
- Day 3: Comprehensive testing & bug fixes
- Day 4: Documentation & team training
- Day 5: Final validation & deployment
```

---

## 🏗️ **PHASE 2: STRUCTURE CREATION**

### **🎯 Step 2.1: Directory Setup**

#### **Create Feature Module Structure**
```bash
# Create the main feature directory
mkdir -p "src/features/[FEATURE_NAME]"

# Create standard subdirectories
mkdir -p "src/features/[FEATURE_NAME]/components"
mkdir -p "src/features/[FEATURE_NAME]/hooks"
mkdir -p "src/features/[FEATURE_NAME]/services"
mkdir -p "src/features/[FEATURE_NAME]/constants"  
mkdir -p "src/features/[FEATURE_NAME]/models"
mkdir -p "src/features/[FEATURE_NAME]/styles"

# Create component subdirectories (adjust based on feature needs)
mkdir -p "src/features/[FEATURE_NAME]/components/modals"
mkdir -p "src/features/[FEATURE_NAME]/components/forms"
mkdir -p "src/features/[FEATURE_NAME]/components/[feature-specific]"
```

### **🎯 Step 2.2: Barrel Export Files**

#### **Main Module Barrel Export**
```typescript
// src/features/[FEATURE_NAME]/index.ts
export * from './components';
export * from './hooks';
export * from './models';
// Services and constants are typically internal-only
// export * from './services';
// export * from './constants';
```

#### **Component Barrel Exports**
```typescript
// src/features/[FEATURE_NAME]/components/index.ts
// Main container component
export { default as [FeatureName]Section } from './[FeatureName]Section.jsx';

// Subcomponent groups
export * from './modals';
export * from './forms';
export * from './[feature-specific]';
```

#### **Subdirectory Barrel Exports**
```typescript
// src/features/[FEATURE_NAME]/components/modals/index.ts
export { default as [FeatureName]Modal } from './[FeatureName]Modal.jsx';
export { default as [FeatureName]CreateModal } from './[FeatureName]CreateModal.jsx';
export { default as [FeatureName]EditModal } from './[FeatureName]EditModal.jsx';

// src/features/[FEATURE_NAME]/components/forms/index.ts
export { default as [FeatureName]Form } from './[FeatureName]Form.jsx';

// src/features/[FEATURE_NAME]/hooks/index.ts
export { use[FeatureName] } from './use[FeatureName].js';
export { use[FeatureName]State } from './use[FeatureName]State.js';

// src/features/[FEATURE_NAME]/services/index.ts  
export * from './[featureName]';

// src/features/[FEATURE_NAME]/models/index.ts
export * from './[featureName].types';

// src/features/[FEATURE_NAME]/constants/index.ts
export * from './[featureName]Constants';
```

### **🎯 Step 2.3: TypeScript Foundation**

#### **Create Base Type Definitions**
```typescript
// src/features/[FEATURE_NAME]/models/[featureName].types.ts

import type { ReactNode } from 'react'

/**
 * Core [FeatureName] Types
 */

// Base domain entity
export interface [FeatureName]Item {
  id: string
  name: string
  description?: string
  status: [FeatureName]Status
  created_at: string
  updated_at: string
  client_id: string
  // Add feature-specific fields...
}

// Status/state types
export type [FeatureName]Status = 'active' | 'inactive' | 'pending' | 'archived'

// API payload types
export interface Create[FeatureName]ItemPayload {
  name: string
  description?: string
  status?: [FeatureName]Status
  // Add required creation fields...
}

export interface Update[FeatureName]ItemPayload extends Partial<Create[FeatureName]ItemPayload> {
  id?: never // Prevent ID updates
}

// Component prop types
export interface [FeatureName]SectionProps {
  clientId: string
  className?: string
  onItemCreate?: (item: [FeatureName]Item) => void
  // Add feature-specific props...
}

// Hook return types
export interface Use[FeatureName]Return {
  items: [FeatureName]Item[]
  loading: boolean
  error: string | null
  createItem: (data: Create[FeatureName]ItemPayload) => Promise<[FeatureName]Item>
  updateItem: (id: string, data: Update[FeatureName]ItemPayload) => Promise<[FeatureName]Item>
  deleteItem: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

// API response types
export interface [FeatureName]APIResponse {
  data: [FeatureName]Item[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface Single[FeatureName]APIResponse {
  data: [FeatureName]Item
}

// Error types
export interface [FeatureName]Error {
  message: string
  code?: string
  field?: string
}
```

---

## 📦 **PHASE 3: COMPONENT MIGRATION**

### **🎯 Step 3.1: Component Classification**

#### **Organize by Function**
```bash
# Main container components
src/features/[FEATURE_NAME]/components/[FeatureName]Section.jsx

# Modal dialogs
src/features/[FEATURE_NAME]/components/modals/
├── [FeatureName]CreateModal.jsx
├── [FeatureName]EditModal.jsx  
├── [FeatureName]DeleteModal.jsx
└── [FeatureName]DetailsModal.jsx

# Form components
src/features/[FEATURE_NAME]/components/forms/
├── [FeatureName]Form.jsx
├── [FeatureName]QuickForm.jsx
└── [FeatureName]SearchForm.jsx

# List/grid components
src/features/[FEATURE_NAME]/components/lists/
├── [FeatureName]List.jsx
├── [FeatureName]Grid.jsx  
├── [FeatureName]Card.jsx
└── [FeatureName]Item.jsx

# Feature-specific components
src/features/[FEATURE_NAME]/components/[specific]/
└── [FeatureName]SpecificComponent.jsx
```

### **🎯 Step 3.2: Migration Process**

#### **Component Migration Checklist (per component)**
```markdown
## Component: [ComponentName]

### Pre-Migration
- [ ] **Backup Original**: Copy component to backup location
- [ ] **Analyze Dependencies**: List all imports and exports
- [ ] **Identify Usage**: Find all files importing this component
- [ ] **Test Coverage**: Note existing tests for this component

### Migration Steps  
- [ ] **Move File**: Copy component to new feature structure location
- [ ] **Update Internal Imports**: Fix relative import paths within component
- [ ] **Add to Barrel Export**: Include in appropriate index.ts file
- [ ] **Update Props Interface**: Add TypeScript types if missing
- [ ] **Verify Functionality**: Component renders without errors

### Post-Migration
- [ ] **Update External Imports**: Fix all consuming files to use new path
- [ ] **Update Tests**: Modify test imports and paths
- [ ] **Remove Original**: Delete component from old location  
- [ ] **Validation**: Run full application to ensure no regressions
```

#### **Step-by-Step Migration**

**Step A: Move Main Container Component**
```bash
# 1. Copy main component
cp "src/components/[feature]/[FeatureName]Section.jsx" "src/features/[FEATURE_NAME]/components/"

# 2. Update internal imports (if any)
# Edit the moved file to use relative imports for any feature-specific dependencies

# 3. Add to barrel export  
# Add export to src/features/[FEATURE_NAME]/components/index.ts
```

**Step B: Move and Organize Subcomponents**
```bash
# 1. Identify component categories
ls src/components/[feature]/

# 2. Move to appropriate subdirectories
cp "src/components/[feature]/[FeatureName]Modal.jsx" "src/features/[FEATURE_NAME]/components/modals/"
cp "src/components/[feature]/[FeatureName]Form.jsx" "src/features/[FEATURE_NAME]/components/forms/"

# 3. Update subdirectory barrel exports
# Add exports to respective index.ts files
```

**Step C: Fix Internal Component Imports**
```javascript
// BEFORE: Old internal imports
import { SomeHelper } from '../../../utils/helpers'
import { useFeature } from '../../hooks/useFeature'

// AFTER: New internal imports (adjust paths as needed)
import { SomeHelper } from '@src/shared/utils/helpers'
import { useFeature } from '../hooks/useFeature'
```

### **🎯 Step 3.3: Component Standardization**

#### **Standard Component Template**
```jsx
// src/features/[FEATURE_NAME]/components/[ComponentName].jsx
import React, { useState, useCallback } from 'react'
import { use[FeatureName] } from '../hooks'
import type { [ComponentName]Props } from '../models'

/**
 * [ComponentName] - Brief description of component purpose
 * 
 * @param {[ComponentName]Props} props - Component props
 * @returns {JSX.Element} Rendered component
 */
const [ComponentName] = ({
  // Props with default values
  className = '',
  onAction,
  // ... other props
}) => {
  // Local state
  const [localState, setLocalState] = useState(null)
  
  // Feature hook usage
  const { items, loading, createItem } = use[FeatureName]()
  
  // Event handlers
  const handleAction = useCallback((data) => {
    // Handle action
    onAction?.(data)
  }, [onAction])
  
  // Render loading state
  if (loading) {
    return <div className="loading">Loading...</div>
  }
  
  return (
    <div className={`[component-name] ${className}`}>
      {/* Component content */}
    </div>
  )
}

export default [ComponentName]
```

---

## 🔧 **PHASE 4: TYPESCRIPT INTEGRATION**

### **🎯 Step 4.1: Type Definitions**

#### **Expand Base Types**
```typescript
// src/features/[FEATURE_NAME]/models/[featureName].types.ts

// Add comprehensive type definitions based on migrated components

/**
 * Extended Component Prop Types
 */
export interface [ComponentName]Props {
  // Required props
  id: string
  data: [FeatureName]Item[]
  
  // Optional props with defaults
  className?: string
  loading?: boolean
  
  // Event handlers
  onSelect?: (item: [FeatureName]Item) => void
  onCreate?: (data: Create[FeatureName]ItemPayload) => void
  onUpdate?: (id: string, data: Update[FeatureName]ItemPayload) => void
  onDelete?: (id: string) => void
  
  // Children and render props
  children?: ReactNode
  renderItem?: (item: [FeatureName]Item) => ReactNode
}

/**
 * Form Data Types
 */
export interface [FeatureName]FormData {
  name: string
  description: string
  status: [FeatureName]Status
  // Add form-specific fields
}

/**
 * State Management Types
 */
export interface [FeatureName]State {
  items: [FeatureName]Item[]
  selectedItem: [FeatureName]Item | null
  loading: boolean
  error: string | null
  filters: [FeatureName]Filters
}

export interface [FeatureName]Filters {
  search?: string
  status?: [FeatureName]Status[]
  dateRange?: {
    start: Date
    end: Date
  }
}

/**
 * Modal/Dialog Types
 */
export interface [FeatureName]ModalProps {
  isOpen: boolean
  onClose: () => void
  item?: [FeatureName]Item
  mode: 'create' | 'edit' | 'view'
  onSubmit: (data: [FeatureName]FormData) => Promise<void>
}
```

### **🎯 Step 4.2: Hook Type Integration**

#### **Custom Hook with TypeScript**
```typescript
// src/features/[FEATURE_NAME]/hooks/use[FeatureName].ts
import { useState, useEffect, useCallback } from 'react'
import type {
  [FeatureName]Item,
  Create[FeatureName]ItemPayload,
  Update[FeatureName]ItemPayload,
  Use[FeatureName]Return
} from '../models'
import { [featureName]Api } from '../services'

export const use[FeatureName] = (clientId: string): Use[FeatureName]Return => {
  const [items, setItems] = useState<[FeatureName]Item[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const data = await [featureName]Api.getItems(clientId)
      setItems(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [clientId])
  
  const createItem = useCallback(async (data: Create[FeatureName]ItemPayload): Promise<[FeatureName]Item> => {
    const newItem = await [featureName]Api.createItem(clientId, data)
    setItems(prev => [...prev, newItem])
    return newItem
  }, [clientId])
  
  const updateItem = useCallback(async (id: string, data: Update[FeatureName]ItemPayload): Promise<[FeatureName]Item> => {
    const updatedItem = await [featureName]Api.updateItem(id, data)
    setItems(prev => prev.map(item => item.id === id ? updatedItem : item))
    return updatedItem
  }, [])
  
  const deleteItem = useCallback(async (id: string): Promise<void> => {
    await [featureName]Api.deleteItem(id)
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])
  
  const refresh = useCallback(() => loadItems(), [loadItems])
  
  useEffect(() => {
    loadItems()
  }, [loadItems])
  
  return {
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refresh
  }
}
```

### **🎯 Step 4.3: Component Type Integration**

#### **Convert Components to TypeScript**
```tsx
// src/features/[FEATURE_NAME]/components/[ComponentName].tsx
import React, { useState, useCallback } from 'react'
import type { [ComponentName]Props } from '../models'
import { use[FeatureName] } from '../hooks'

const [ComponentName]: React.FC<[ComponentName]Props> = ({
  className = '',
  data,
  onSelect,
  onCreate
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  const { createItem, loading } = use[FeatureName]()
  
  const handleSelect = useCallback((item: [FeatureName]Item) => {
    setSelectedId(item.id)
    onSelect?.(item)
  }, [onSelect])
  
  const handleCreate = useCallback(async (formData: Create[FeatureName]ItemPayload) => {
    try {
      const newItem = await createItem(formData)
      onCreate?.(newItem)
    } catch (error) {
      console.error('Failed to create item:', error)
    }
  }, [createItem, onCreate])
  
  return (
    <div className={`[component-name] ${className}`}>
      {/* Component implementation */}
    </div>
  )
}

export default [ComponentName]
```

---

## 🔄 **PHASE 5: IMPORT PATH UPDATES**

### **🎯 Step 5.1: Identify All Consumers**

#### **Find Import References**
```bash
# Find all imports of old component paths
grep -r "from.*components/[FEATURE_NAME]" src/ --include="*.jsx" --include="*.js" --include="*.tsx" --include="*.ts"

# Find specific component imports  
grep -r "import.*[ComponentName]" src/ --include="*.jsx" --include="*.js" | grep -v "features/[FEATURE_NAME]"

# Find dynamic imports
grep -r "import(" src/ --include="*.jsx" --include="*.js" | grep -i "[FEATURE_NAME]"
```

#### **Create Update Tracking Sheet**
```markdown
# Import Update Tracking

## Files to Update
- [ ] src/pages/[Page].jsx - imports [ComponentName]
- [ ] src/components/other/[OtherComponent].jsx - imports [HelperComponent]
- [ ] src/hooks/[globalHook].js - imports [featureHook]
- [ ] [Add all found files...]

## Import Changes Required
```javascript
// BEFORE
import { [ComponentName] } from '@src/components/[feature]/[ComponentName]'
import { use[Feature] } from '@src/hooks/use[Feature]'

// AFTER  
import { [ComponentName] } from '@src/features/[FEATURE_NAME]'
import { use[Feature] } from '@src/features/[FEATURE_NAME]/hooks'
```

### **🎯 Step 5.2: Systematic Updates**

#### **Update Script Template**
```bash
#!/bin/bash
# update-[feature]-imports.sh

echo "Updating [FEATURE_NAME] imports..."

# Update component imports
find src/ -name "*.jsx" -o -name "*.js" -o -name "*.tsx" -o -name "*.ts" | \
  xargs sed -i "s|from.*components/[FEATURE_NAME]/[ComponentName]|from '@src/features/[FEATURE_NAME]'|g"

# Update hook imports  
find src/ -name "*.jsx" -o -name "*.js" -o -name "*.tsx" -o -name "*.ts" | \
  xargs sed -i "s|from.*hooks/use[Feature]|from '@src/features/[FEATURE_NAME]/hooks'|g"

# Update API imports
find src/ -name "*.jsx" -o -name "*.js" -o -name "*.tsx" -o -name "*.ts" | \
  xargs sed -i "s|from.*api/[feature]|from '@src/features/[FEATURE_NAME]/services'|g"

echo "Import updates completed. Please verify manually."
```

#### **Manual Update Process**
```javascript
// For each file found in Step 5.1:

// 1. Open the file
// 2. Find old imports
import { ComponentA, ComponentB } from '@src/components/[feature]/ComponentA'
import { useFeatureHook } from '@src/hooks/useFeatureHook'

// 3. Replace with new imports
import { ComponentA, ComponentB } from '@src/features/[FEATURE_NAME]'
import { useFeatureHook } from '@src/features/[FEATURE_NAME]/hooks'

// 4. Verify the component/hook is exported from the new location
// 5. Test that the import works (no build errors)
```

### **🎯 Step 5.3: Legacy Import Cleanup**

#### **Remove Old Files**
```bash
# Only after all imports are updated and verified!

# Remove old component files
rm -rf "src/components/[FEATURE_NAME]/"

# Remove old hook files (if moved)
rm "src/hooks/use[Feature].js"

# Remove old API files (if moved)
rm "src/api/[feature].js"

# Remove old constants (if moved)
rm "src/constants/[feature].js"
```

#### **Update Global Index Files**
```javascript
// src/hooks/index.js - Remove old exports, add new ones
// REMOVE these lines:
// export { use[Feature] } from './use[Feature]'

// ADD these lines:  
export { use[Feature] } from '@src/features/[FEATURE_NAME]/hooks'

// src/components/index.js - Remove old exports
// REMOVE: export * from './[feature]/'

// api/index.js - Remove old exports
// REMOVE: export * from './[feature]'
```

---

## 🧪 **PHASE 6: TESTING & VALIDATION**

### **🎯 Step 6.1: Build Validation**

#### **Build Test Checklist**
```bash
# 1. Clean build test
npm run clean
npm run build

# Expected: No build errors, all imports resolve correctly

# 2. Development server test  
npm run dev

# Expected: Application starts without errors

# 3. Type checking (if using TypeScript)
npm run type-check

# Expected: No TypeScript errors

# 4. Linting validation
npm run lint

# Expected: No linting errors related to imports or structure
```

### **🎯 Step 6.2: Functionality Testing**

#### **Feature Functionality Checklist**
```markdown
## [FEATURE_NAME] Functionality Test

### Core Functionality
- [ ] **Main component renders** - [FeatureName]Section displays correctly
- [ ] **Data loading works** - Items/data loads from API
- [ ] **Create operation** - Can create new items
- [ ] **Read operation** - Can view item details  
- [ ] **Update operation** - Can edit existing items
- [ ] **Delete operation** - Can delete items

### UI Components  
- [ ] **List/Grid view** - Items display in list or grid format
- [ ] **Modal dialogs** - Create/Edit/Delete modals work
- [ ] **Form components** - Forms validate and submit correctly
- [ ] **Search/Filter** - Search and filtering functionality
- [ ] **Loading states** - Proper loading indicators
- [ ] **Error handling** - Errors display appropriately

### Navigation & Integration
- [ ] **Page integration** - Feature works within parent pages
- [ ] **Routing** - Any feature-specific routes work
- [ ] **State management** - State persists and updates correctly
- [ ] **Cross-feature communication** - Integration with other features

### Performance  
- [ ] **Load time** - Feature loads in reasonable time
- [ ] **Responsiveness** - UI remains responsive during operations
- [ ] **Memory usage** - No obvious memory leaks
```

#### **Manual Testing Workflow**
```markdown
## Manual Test Script

### Test 1: Basic Navigation
1. Navigate to page containing the feature
2. Verify feature section loads without errors
3. Check that all UI elements are visible
4. Confirm no console errors

### Test 2: CRUD Operations
1. Create new item:
   - Click create button
   - Fill out form  
   - Submit and verify success
   - Check item appears in list

2. Read/View item:
   - Click on existing item
   - Verify details display correctly
   - Check all data fields are populated

3. Update item:
   - Open edit modal/form
   - Modify some fields
   - Save and verify changes persist

4. Delete item:
   - Click delete button  
   - Confirm deletion dialog
   - Verify item removed from list

### Test 3: Error Scenarios
1. Network error simulation:
   - Disable network
   - Try operations
   - Verify error messages display

2. Validation errors:
   - Submit forms with invalid data
   - Verify validation messages
   - Confirm form doesn't submit

3. Permission errors:
   - Test with limited permissions
   - Verify appropriate restrictions
```

### **🎯 Step 6.3: Automated Testing**

#### **Test Migration**
```bash
# 1. Find existing tests
find tests/ -name "*[feature]*" -o -name "*[Feature]*"

# 2. Update test imports
# In each test file:
// BEFORE
import { ComponentName } from '@src/components/[feature]/ComponentName'

// AFTER
import { ComponentName } from '@src/features/[FEATURE_NAME]'

# 3. Run tests
npm test -- --testPathPattern=[feature]

# Expected: All tests pass
```

#### **New Test Structure**
```bash
# Create new test structure matching feature structure
mkdir -p "tests/features/[FEATURE_NAME]/components"
mkdir -p "tests/features/[FEATURE_NAME]/hooks"  
mkdir -p "tests/features/[FEATURE_NAME]/services"

# Move/update existing tests
mv "tests/components/[feature]/*.test.js" "tests/features/[FEATURE_NAME]/components/"
```

---

## 📚 **PHASE 7: DOCUMENTATION**

### **🎯 Step 7.1: Update Project Documentation**

#### **README Updates**
```markdown
# Project README Updates

## Architecture Section
- Update architecture diagram to include new feature module
- Document new import patterns
- Add feature module structure explanation

## Development Section  
- Update development guidelines
- Add feature module creation instructions
- Update testing guidelines

## API Documentation
- Update API documentation if service layer changed
- Document new type definitions
- Update integration examples
```

#### **Feature-Specific Documentation**
```markdown
# [FEATURE_NAME] Module Documentation

## Overview
[Brief description of feature and its purpose]

## Architecture
- Main components and their responsibilities  
- State management approach
- API integration details
- TypeScript types and interfaces

## Usage Examples
```javascript
// Import and use the main component
import { [FeatureName]Section } from '@src/features/[FEATURE_NAME]'

<[FeatureName]Section 
  clientId={clientId}
  onItemCreate={handleCreate}
/>
```

## API Reference
[Document all exported components, hooks, and types]

## Development Guidelines
[Feature-specific development patterns and best practices]
```

### **🎯 Step 7.2: Code Documentation**

#### **Component Documentation**
```jsx
/**
 * [ComponentName] - Component description
 * 
 * This component handles [specific functionality]. It integrates with
 * [other components/services] to provide [user value].
 * 
 * @example
 * ```jsx
 * <[ComponentName]
 *   data={items}
 *   onSelect={handleSelection}
 *   className="custom-styles"
 * />
 * ```
 * 
 * @param {[ComponentName]Props} props - Component props
 * @returns {JSX.Element} Rendered component
 */
const [ComponentName] = ({ data, onSelect, className }) => {
  // Component implementation
}
```

#### **Hook Documentation**
```typescript
/**
 * use[FeatureName] - Custom hook for [feature] operations
 * 
 * Provides CRUD operations and state management for [feature] items.
 * Handles loading states, error management, and API integration.
 * 
 * @example
 * ```typescript
 * const { items, loading, createItem } = use[FeatureName](clientId)
 * 
 * // Create new item
 * await createItem({ name: 'New Item', description: 'Description' })
 * ```
 * 
 * @param clientId - Client ID for scoping operations
 * @returns Hook return object with state and operations
 */
export const use[FeatureName] = (clientId: string): Use[FeatureName]Return => {
  // Hook implementation
}
```

---

## ✅ **VALIDATION CHECKLIST**

### **🎯 Migration Completeness**

#### **Structure Validation**
- [ ] **Feature directory created** - `src/features/[FEATURE_NAME]/` exists
- [ ] **Subdirectories present** - components, hooks, services, models, constants
- [ ] **Barrel exports configured** - All index.ts files with proper exports
- [ ] **TypeScript integration** - Comprehensive type definitions created
- [ ] **Component organization** - Components in appropriate subdirectories

#### **Component Migration**  
- [ ] **All components moved** - No components left in old locations
- [ ] **Internal imports fixed** - All relative imports work correctly
- [ ] **Barrel exports updated** - All components accessible via main export
- [ ] **Props interface added** - TypeScript props for all components
- [ ] **Functionality preserved** - All components work as before

#### **Import Updates**
- [ ] **All consumers updated** - No files importing from old locations
- [ ] **Build succeeds** - No import errors in build process
- [ ] **TypeScript compiles** - No type errors from import changes
- [ ] **Runtime works** - Application runs without import errors

#### **Testing & Validation**
- [ ] **All tests pass** - Existing tests updated and passing
- [ ] **Manual testing complete** - Full functionality verified manually
- [ ] **No regressions** - All existing functionality still works
- [ ] **Performance maintained** - No significant performance degradation

#### **Documentation**
- [ ] **Feature documentation** - Comprehensive guide for feature module
- [ ] **Project docs updated** - README and architecture docs current
- [ ] **Code documentation** - Components and hooks properly documented
- [ ] **Migration notes** - Lessons learned and notes for future migrations

---

## 🚀 **MIGRATION SUCCESS TEMPLATE**

### **🎉 Migration Completion Report**

```markdown
# [FEATURE_NAME] Migration Completion Report

## Executive Summary
The [FEATURE_NAME] feature has been successfully migrated to the new Scope Rules architecture. Migration completed on [DATE] with zero breaking changes and full functionality preserved.

## Migration Statistics
- **Components Migrated**: [NUMBER] components successfully moved
- **Import Updates**: [NUMBER] files updated with new import paths
- **TypeScript Integration**: [NUMBER] type definitions added
- **Test Updates**: [NUMBER] test files updated
- **Duration**: [X] days total migration time

## Architecture Changes
- **Before**: Scattered across `/components/[feature]/`
- **After**: Unified `/features/[FEATURE_NAME]/` module
- **Improvement**: [X]% better organization, [X]% cleaner imports

## Validation Results
- ✅ All builds successful
- ✅ All tests passing  
- ✅ Full functionality verified
- ✅ Performance maintained
- ✅ Documentation complete

## Lessons Learned
[Key insights and learnings from this migration]

## Next Steps
[Recommendations for next feature migration]
```

---

## 🎯 **NEXT FEATURE RECOMMENDATIONS**

### **📊 Priority Matrix**

| Feature | Complexity | Impact | Dependencies | Recommended Order |
|---------|------------|--------|--------------|-------------------|
| **Documents** | High | High | Medium | 🥇 Next (High value) |
| **Clients** | Medium | High | Low | 🥈 After Documents |
| **AI Assistant** | Medium | Medium | Medium | 🥉 Third Priority |
| **Auth** | Low | Medium | Low | 4th (Easy win) |
| **Dashboard** | Low | Low | Low | Last (Cleanup) |

### **📋 Recommended Migration Sequence**

#### **1. Documents Feature** 🎯 **Next Priority**
- **Rationale**: High user impact, complex enough to validate template  
- **Timeline**: 1-2 weeks
- **Benefits**: File management improvements, better organization

#### **2. Clients Feature** 🎯 **High Priority**
- **Rationale**: Core business domain, moderate complexity
- **Timeline**: 1 week  
- **Benefits**: Cleaner client operations, better data flow

#### **3. AI Assistant Feature** 🎯 **Medium Priority**
- **Rationale**: Good complexity for template validation
- **Timeline**: 1-2 weeks
- **Benefits**: Better AI integration, context management

#### **4. Auth Feature** 🎯 **Quick Win**
- **Rationale**: Low complexity, fast completion
- **Timeline**: 3-5 days
- **Benefits**: Authentication structure cleanup

#### **5. Dashboard Feature** 🎯 **Final Cleanup**
- **Rationale**: Mostly UI components, minimal complexity
- **Timeline**: 3-5 days
- **Benefits**: Complete project architecture consistency

---

## 🎉 **CONCLUSION**

This migration template provides a **comprehensive, battle-tested approach** for migrating any feature to the Scope Rules architecture. Based on the successful Schedule module migration, it includes:

### **✅ Proven Process**
- **Step-by-step guidance** for every migration phase
- **Validation checkpoints** to ensure quality at each step
- **Risk mitigation** strategies for common migration challenges
- **Documentation templates** for consistent reporting

### **🚀 Scalable Approach**
- **Reusable patterns** applicable to any feature complexity
- **Flexible timeline** accommodating different feature sizes
- **Quality assurance** built into every phase
- **Knowledge transfer** through comprehensive documentation

### **📈 Continuous Improvement**
- **Lessons learned integration** from each migration
- **Template refinement** based on experience
- **Best practices evolution** as team skills develop
- **Success metrics tracking** for ROI demonstration

By following this template, teams can achieve **consistent, high-quality migrations** that transform legacy code into maintainable, scalable feature modules while preserving functionality and improving developer experience.

---

**Template Version**: 1.0  
**Based On**: Schedule Module Migration Success  
**Last Updated**: September 6, 2025  
**Next Review**: After Documents Migration Completion  
**Maintained By**: Frontend Architecture Team