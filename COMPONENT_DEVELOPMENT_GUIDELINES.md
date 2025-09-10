# Component Development Guidelines & TSX-First Standards

**Version**: 1.0  
**Date**: September 2025  
**Status**: Phase 3 Governance Framework  

## 🎯 TSX-First Development Policy

### Core Principle
**All new React components MUST be created as `.tsx` files**

### The Scope Rule Application
- **Shared components** (used by 2+ features) → **MUST be TSX**
- **Feature-specific components** (used by 1 feature) → **SHOULD be TSX**
- **Legacy JSX components** → **Migrate to TSX when touched**

---

## 📋 Component Creation Standards

### 1. File Extensions & Naming

```typescript
✅ CORRECT
MyComponent.tsx           // PascalCase, TSX extension
useCustomHook.ts         // camelCase for hooks, TS for non-JSX
MyComponent.stories.tsx  // Stories should be TSX
MyComponent.test.tsx     // Tests should be TSX

❌ INCORRECT  
MyComponent.jsx          // JSX is discouraged for new components
my-component.tsx         // kebab-case not allowed
MyComponent.js           // JavaScript not allowed for components
```

### 2. Interface Definitions

Every TSX component MUST have properly typed props:

```typescript
// ✅ CORRECT - Explicit interface
interface MyComponentProps {
  title: string
  isVisible?: boolean
  onClick?: () => void
  children?: React.ReactNode
}

const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  isVisible = true, 
  onClick,
  children 
}) => {
  return (
    <div className={isVisible ? 'block' : 'hidden'}>
      <h2>{title}</h2>
      {children}
      {onClick && <button onClick={onClick}>Action</button>}
    </div>
  )
}

export default MyComponent
export type { MyComponentProps }
```

### 3. ForwardRef Best Practices

For components that need ref forwarding:

```typescript
// ✅ CORRECT - Typed forwardRef
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', children, onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`btn btn-${variant}`}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
export type { ButtonProps }
```

---

## 🏗️ Architecture Patterns

### Component Placement Rules (Scope Rules)

```
src/
├── shared/
│   └── components/       # ← 2+ features → MUST be TSX
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── LoadingSpinner.tsx
├── features/
│   └── dashboard/
│       └── components/   # ← 1 feature → SHOULD be TSX
│           └── DashboardChart.tsx
└── components/           # ← Legacy location → Migrate to TSX
    └── *.jsx            # ← TO BE MIGRATED
```

### Import/Export Standards

```typescript
// ✅ CORRECT - Named exports with types
export { default } from './Button'
export type { ButtonProps } from './Button'

// ✅ CORRECT - Type-only imports
import type { ButtonProps } from '@shared/components/Button'
import Button from '@shared/components/Button'

// ❌ INCORRECT - Mixed imports
import Button, { ButtonProps } from '@shared/components/Button'
```

---

## 🔧 Development Workflows

### New Component Checklist

- [ ] Component is created as `.tsx` file
- [ ] Props interface is defined and exported
- [ ] Component follows naming conventions
- [ ] Proper error boundaries considered
- [ ] Accessibility attributes included
- [ ] Component placed in correct directory per Scope Rules
- [ ] Types are exported separately
- [ ] Tests created as `.test.tsx`

### Migration Checklist (JSX → TSX)

- [ ] Rename `.jsx` to `.tsx`
- [ ] Add props interface
- [ ] Add type annotations for complex logic
- [ ] Update imports to use type-only where appropriate
- [ ] Fix any TypeScript errors
- [ ] Update tests to `.test.tsx`
- [ ] Verify component still works correctly

---

## 🚫 Anti-Patterns to Avoid

### ❌ Bad Practices

```typescript
// ❌ Any types
const MyComponent = (props: any) => { ... }

// ❌ No interface definition
const MyComponent = ({ title, onClick }) => { ... }

// ❌ Inline complex types
const MyComponent: React.FC<{
  title: string
  data: { id: number; name: string }[]
  callbacks: { onSave: () => void; onCancel: () => void }
}> = ({ ... }) => { ... }

// ❌ Default exports without type exports
export default MyComponent
// Missing: export type { MyComponentProps }
```

### ✅ Good Practices

```typescript
// ✅ Explicit, clean interfaces
interface MyComponentProps {
  title: string
  data: UserData[]
  callbacks: ComponentCallbacks
}

interface UserData {
  id: number
  name: string
}

interface ComponentCallbacks {
  onSave: () => void
  onCancel: () => void
}

const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  data, 
  callbacks 
}) => {
  // Implementation
}

export default MyComponent
export type { MyComponentProps, UserData, ComponentCallbacks }
```

---

## 🛠️ Tooling & Automation

### ESLint Rules Applied

- TSX-first enforcement warnings for JSX files in shared directories
- TypeScript strict mode enabled for better type safety
- Import organization rules for clean dependency management

### Available Scripts

```bash
# Quality checks (includes TSX validation)
npm run quality:check

# Component type checking
npm run type-check

# Migration assistance  
npm run migration:component MyComponent

# Automated linting fixes
npm run lint:fix
```

### IDE Configuration

**VS Code Settings** (recommended):

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.associations": {
    "*.tsx": "typescriptreact",
    "*.jsx": "javascriptreact"
  }
}
```

---

## 📊 Success Metrics

### Phase 3 Governance KPIs

- **0% new JSX components** in shared directories
- **90%+ TypeScript coverage** in component interfaces
- **100% type export coverage** for shared components
- **Zero TypeScript errors** in TSX files

### Migration Progress Tracking

Current Status:
- JSX Files: 107
- TSX Files: 24
- **Target**: 80%+ TSX adoption by end of Phase 4

---

## 🔄 Continuous Improvement

### Monthly Reviews
- Analyze component duplication reports
- Review TypeScript coverage metrics
- Update guidelines based on team feedback
- Identify new opportunities for TSX migration

### Team Training
- Weekly TSX patterns review
- Best practices sharing sessions
- Code review focus on type safety
- Architecture decision documentation

---

## 📞 Support & Questions

For questions about:
- **Component Architecture**: Review Scope Rules documentation
- **TypeScript Issues**: Check TSConfig and ESLint configuration  
- **Migration Help**: Use available scripts and team support
- **Governance Exceptions**: Discuss with architecture team

---

*This document is a living standard that evolves with our TSX-first development practices.*