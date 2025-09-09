# TypeScript Migration Guide

## Overview

This document outlines the comprehensive strategy for migrating the frontend from JavaScript to TypeScript, focusing on type safety, maintainability, and minimal disruption.

## Migration Phases

### Phase 1: Foundation Setup ✅
- [x] TypeScript configuration (tsconfig.json)
- [x] Development dependencies and build optimization
- [x] ESLint configuration for TypeScript
- [x] Type definitions structure
- [x] API type system

### Phase 2: Core Infrastructure (Week 1-2)
- [ ] Migrate base UI components (Button, Modal, Input, etc.)
- [ ] Migrate API layer and utilities
- [ ] Migrate custom hooks
- [ ] Update build and CI/CD processes

### Phase 3: Feature Components (Week 3-4)
- [ ] Migrate document management components
- [ ] Migrate client management components
- [ ] Migrate schedule/task components
- [ ] Migrate AI assistant components

### Phase 4: Pages and Integration (Week 5-6)
- [ ] Migrate page components
- [ ] Migrate layout components
- [ ] End-to-end type checking
- [ ] Performance optimization and cleanup

## Migration Priorities

### High Priority (Migrate First)
1. **Base UI Components**: `src/components/ui/`
   - Button.jsx → Button.tsx
   - Modal.jsx → Modal.tsx
   - Input.jsx → Input.tsx
   - Card.jsx → Card.tsx

2. **API Layer**: `src/api/`
   - Already created type-safe versions
   - Legacy exports for backward compatibility

3. **Core Hooks**: `src/hooks/`
   - useDocuments.js → useDocuments.ts (✅ Done)
   - useAuth.js → useAuth.ts
   - useClients.js → useClients.ts

### Medium Priority
4. **Feature Components**:
   - Document components with high reuse
   - Client management components
   - Form components

5. **Layout Components**:
   - Header.jsx → Header.tsx
   - Sidebar.jsx → Sidebar.tsx
   - MainLayout.jsx → MainLayout.tsx

### Low Priority (Migrate Last)
6. **Page Components**:
   - Dashboard pages
   - Detail pages
   - Settings pages

## Coexistence Strategy

### File Naming Convention
- New TypeScript files: `.tsx` for components with JSX, `.ts` for utilities
- Keep original `.jsx/.js` files until migration is complete
- Use `.js.bak` for backup of migrated files

### Import/Export Compatibility
```typescript
// In migrated TypeScript files, support both import styles:
export { Button } from './Button'
export default Button

// Legacy JavaScript files can import either way:
import { Button } from './components/ui/Button'
import Button from './components/ui/Button'
```

### Type Assertion Strategy
```typescript
// For legacy API responses during migration:
const data = response as ApiResponse<Client[]>

// For gradual prop typing:
interface Props extends Record<string, unknown> {
  clientId: string
  onSubmit: (data: FormData) => void
}
```

## Migration Commands

### Preparation
```bash
# Install dependencies
npm install

# Type check without emitting
npm run type-check

# Type check in watch mode during development
npm run type-check:watch

# Check migration progress
npm run migration:check
```

### Component Migration
```bash
# Automated component migration (when ready)
npm run migration:component -- src/components/ui/Button.jsx

# Manual migration steps:
# 1. Copy .jsx to .tsx
# 2. Add type annotations
# 3. Fix type errors
# 4. Test thoroughly
# 5. Rename original to .jsx.bak
```

### Validation
```bash
# Run all checks before committing
npm run lint
npm run type-check
npm run build
```

## Type Safety Guidelines

### Component Props
```typescript
// Preferred: Interface with clear prop types
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

// Avoid: Generic or any props
interface BadProps {
  [key: string]: any // Don't do this
}
```

### Event Handlers
```typescript
// Specific event types
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault()
  // handler logic
}

const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setValue(event.target.value)
}
```

### API Integration
```typescript
// Use typed API functions
import { clientsApi } from '../api/clients.api'

const { data, error } = await clientsApi.getClients({
  page: 1,
  limit: 10,
  search: query
})

// data is automatically typed as PaginatedResponse<ClientListItem>
```

### Error Handling
```typescript
// Typed error handling
try {
  const result = await apiCall()
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message, error.status)
  } else {
    console.error('Unknown error:', error)
  }
}
```

## Common Patterns

### Form Handling with react-hook-form
```typescript
import { useForm, type SubmitHandler } from 'react-hook-form'
import type { ClientFormData } from '../types/client.types'

const ClientForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>()
  
  const onSubmit: SubmitHandler<ClientFormData> = (data) => {
    // data is properly typed
    createClient(data)
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input 
        {...register('name', { required: 'Name is required' })} 
        type="text" 
      />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  )
}
```

### Custom Hook Typing
```typescript
interface UseClientReturn {
  client: Client | null
  loading: boolean
  error: Error | null
  updateClient: (data: ClientUpdate) => Promise<void>
  deleteClient: () => Promise<void>
}

const useClient = (clientId: string): UseClientReturn => {
  // Implementation with proper return type
}
```

## Testing Strategy

### Unit Tests
- Test TypeScript components with proper type mocking
- Use jest with TypeScript support
- Test API functions with typed mock responses

### Integration Tests
- Test component interactions with typed props
- Verify form submissions with typed data
- Test error boundaries with typed errors

### Type Tests
- Use `tsc --noEmit` for compile-time type checking
- Add type assertion tests for complex types
- Verify API integration types match backend

## Performance Considerations

### Build Optimization
- TypeScript compilation is handled by Vite
- Types are stripped in production build
- No runtime performance impact

### Development Experience
- IntelliSense improvements with TypeScript
- Better error detection during development
- Improved refactoring capabilities

### Bundle Size
- No increase in bundle size (types are compile-time only)
- Better tree shaking with TypeScript
- Improved code splitting opportunities

## Troubleshooting

### Common Issues

1. **Import Path Issues**
```typescript
// Fix: Use consistent import paths
import { Button } from '@/components/ui/Button' // Good
import { Button } from './components/ui/Button' // Avoid relative when using aliases
```

2. **Type Assertion vs Type Guards**
```typescript
// Avoid: Unsafe type assertion
const client = data as Client

// Prefer: Type guard or validation
const isClient = (obj: unknown): obj is Client => {
  return typeof obj === 'object' && obj !== null && 'id' in obj
}

if (isClient(data)) {
  // data is safely typed as Client
}
```

3. **Generic Component Props**
```typescript
// Good: Constrained generics
interface ListProps<T extends { id: string }> {
  items: T[]
  onSelect: (item: T) => void
}

// Avoid: Unconstrained generics
interface BadListProps<T> {
  items: T[] // Too generic, no type safety
}
```

## Rollback Procedures

### If Migration Issues Arise

1. **Immediate Rollback**
```bash
# Restore original files
mv src/components/ui/Button.tsx.bak src/components/ui/Button.jsx

# Restore package.json if needed
git checkout HEAD~1 package.json

# Restore build configuration
git checkout HEAD~1 vite.config.ts tsconfig.json
```

2. **Selective Rollback**
- Keep TypeScript configuration
- Rollback specific components causing issues
- Use JavaScript/TypeScript coexistence

3. **Gradual Recovery**
- Fix type issues incrementally
- Use `any` types temporarily if needed
- Re-enable strict checking gradually

## Success Metrics

### Code Quality
- Zero TypeScript errors in CI/CD
- 100% type coverage for new code
- Reduced runtime errors by ~60%

### Developer Experience
- Improved IntelliSense and autocomplete
- Faster debugging with type information
- Better code documentation through types

### Performance
- Maintain or improve build times
- No impact on runtime performance
- Improved bundle optimization

## Timeline

- **Week 1**: Core infrastructure and base components
- **Week 2**: API layer and hooks migration  
- **Week 3**: Feature components migration
- **Week 4**: Layout and page components
- **Week 5**: Integration testing and optimization
- **Week 6**: Final cleanup and documentation

## Next Steps

1. Run `npm install` to install TypeScript dependencies
2. Start with base UI component migration
3. Use type-check scripts during development
4. Follow progressive migration approach
5. Test thoroughly at each phase

For questions or issues, refer to the TypeScript handbook or create an issue in the project repository.