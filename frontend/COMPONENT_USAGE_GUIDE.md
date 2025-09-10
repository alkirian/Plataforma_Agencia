# 🎯 Component Usage Guide
**Quick Reference for Developers**

This guide helps you choose the right components and follow architectural best practices quickly.

---

## 🚀 **Quick Decision Tree**

### "Should I create a new component?"
```
1. Does a base component exist? 
   ✅ Use existing → Go to Usage Examples
   ❌ No → Continue to step 2

2. Will this be used in 2+ features?
   ✅ Yes → Create in /shared/components/
   ❌ No → Create in /features/[name]/components/

3. Is it a specialized version of existing?
   ✅ Yes → Extend base component
   ❌ No → Create following patterns below
```

---

## 📦 **Base Components Reference**

### Button Component
**Location**: `@components/ui/Button`  
**Use for**: All interactive buttons

```tsx
// ✅ CORRECT
import { Button } from "@components/ui/Button"

<Button variant="primary" size="md" onClick={handleSubmit}>
  Save Changes
</Button>

// ❌ AVOID
<button className="px-4 py-2 bg-blue-500">Save</button>
```

**Quick Variants:**
- `primary` `secondary` `ghost` `danger` `success` `warning` `info`
- Sizes: `sm` `md` `lg` `xl`
- Props: `loading` `disabled` `icon` `cyber`

### Modal Component  
**Location**: `@components/ui/Modal`  
**Use for**: All overlay dialogs

```tsx
// ✅ CORRECT
import { Modal } from "@components/ui/Modal"

<Modal open={isOpen} onClose={closeModal} title="Edit Profile">
  <p>Modal content here</p>
</Modal>

// ❌ AVOID
<div className="fixed inset-0 z-50 bg-black/80">
  <div className="modal-content">...</div>
</div>
```

### LoadingSpinner Component
**Location**: `@components/ui/LoadingSpinner`  
**Use for**: All loading states

```tsx
// ✅ CORRECT
import { LoadingSpinner } from "@components/ui/LoadingSpinner"

{isLoading ? <LoadingSpinner size="sm" /> : <DataComponent />}

// ❌ AVOID
<div className="animate-spin w-4 h-4 border-2 border-white rounded-full" />
```

### Badge Component
**Location**: `@components/ui/Badge`  
**Use for**: Status indicators, tags, counts

```tsx
// ✅ CORRECT - Multiple specialized variants
import { Badge, StatusBadge, NotificationBadge } from "@components/ui/Badge"

<Badge variant="success">Active</Badge>
<StatusBadge status="pending" showDot />
<NotificationBadge count={5} position="top-right" />

// ❌ AVOID
<span className="bg-green-500 text-white px-2 py-1 rounded">Active</span>
```

### Input Component
**Location**: `@components/ui/Input`  
**Use for**: Form inputs with consistent styling

```tsx
// ✅ CORRECT
import { Input } from "@components/ui/Input"

<Input
  type="email"
  placeholder="Enter email"
  variant="outlined"
  required
/>

// ❌ AVOID (unless very simple)
<input className="border rounded px-3 py-2" type="email" />
```

### Card Component
**Location**: `@components/ui/Card`  
**Use for**: Content containers with consistent styling

```tsx
// ✅ CORRECT
import { Card } from "@components/ui/Card"

<Card variant="default" className="p-6">
  <Card.Header>
    <h3>Card Title</h3>
  </Card.Header>
  <Card.Content>
    <p>Card content</p>
  </Card.Content>
</Card>

// ❌ AVOID
<div className="bg-surface-soft border rounded-lg p-4">...</div>
```

---

## 🔧 **Specialized Component Patterns**

### Modal Action Buttons
```tsx
// ✅ RECOMMENDED - Consistent pattern
import { Button } from "@components/ui/Button"

<div className="flex justify-end gap-3 pt-6">
  <Button variant="secondary" onClick={onCancel}>
    Cancel
  </Button>
  <Button variant="primary" onClick={onConfirm} loading={isSubmitting}>
    Confirm
  </Button>
</div>
```

### Loading Button States
```tsx
// ✅ RECOMMENDED - Built into Button
<Button variant="primary" loading={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save Changes'}
</Button>

// ❌ AVOID - Manual loading implementation
<button disabled={isSubmitting}>
  {isSubmitting ? <Spinner /> : 'Save Changes'}
</button>
```

### Form Input with Validation
```tsx
// ✅ RECOMMENDED - Consistent validation styling
<Input
  type="email"
  error={errors.email?.message}
  variant={errors.email ? "error" : "outlined"}
  placeholder="Enter your email"
  {...register("email")}
/>
```

---

## ⚠️ **Common Anti-Patterns to Avoid**

### ❌ Direct HTML Elements
```tsx
// DON'T DO THIS
<button className="px-4 py-2 bg-blue-500 rounded">Click me</button>
<div className="fixed inset-0 bg-black/50">Modal</div>
<input className="border rounded p-2" />
<span className="bg-green-500 text-white px-2 py-1">Status</span>

// DO THIS INSTEAD
<Button variant="primary">Click me</Button>
<Modal open={isOpen}>Modal</Modal>
<Input variant="outlined" />
<Badge variant="success">Status</Badge>
```

### ❌ Custom Component Duplication
```tsx
// DON'T CREATE THESE
const CustomButton = () => <button className="...">
const MyModal = () => <div className="fixed...">
const Spinner = () => <div className="animate-spin...">

// USE BASE COMPONENTS INSTEAD
import { Button, Modal, LoadingSpinner } from "@components/ui"
```

### ❌ Cross-Feature Imports
```tsx
// DON'T DO THIS - Violates Scope Rules
import { ClientCard } from "../../features/clients/components/ClientCard"

// DO THIS INSTEAD - Move to shared if used by 2+ features
import { ClientCard } from "@shared/components/ClientCard"
```

---

## 📋 **Quick Checklist Before Creating Components**

### Before Creating Any Component:
- [ ] Checked if base component exists
- [ ] Determined usage scope (1 feature vs 2+ features)  
- [ ] Considered extending existing component first
- [ ] Verified it's not just styled HTML elements

### For New Components:
- [ ] Uses TypeScript with proper interfaces
- [ ] Follows established patterns (forwardRef, variants)
- [ ] Has proper JSDoc documentation
- [ ] Includes accessibility attributes
- [ ] Has className prop for extensibility

### Before Submitting PR:
- [ ] No ESLint warnings about component usage
- [ ] Component reuses base components where possible
- [ ] Follows Scope Rules for placement
- [ ] Added to appropriate export files

---

## 🎯 **Examples by Use Case**

### Form with Validation
```tsx
import { Button, Input, Modal } from "@components/ui"

const EditProfileModal = ({ open, onClose, onSave }) => (
  <Modal open={open} onClose={onClose} title="Edit Profile">
    <form onSubmit={handleSubmit(onSave)}>
      <Input
        label="Full Name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        type="email"
        label="Email"
        error={errors.email?.message}
        {...register("email")}
      />
      <div className="flex justify-end gap-3 pt-6">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  </Modal>
)
```

### Status Display
```tsx
import { Badge, Card, LoadingSpinner } from "@components/ui"

const TaskCard = ({ task, loading }) => (
  <Card>
    <Card.Header className="flex justify-between items-center">
      <h3>{task.title}</h3>
      <Badge variant={task.status === 'completed' ? 'success' : 'warning'}>
        {task.status}
      </Badge>
    </Card.Header>
    <Card.Content>
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <p>{task.description}</p>
      )}
    </Card.Content>
  </Card>
)
```

### Interactive Lists
```tsx
import { Button, Badge, LoadingSpinner } from "@components/ui"

const ClientList = ({ clients, onEdit, loading }) => (
  <div className="space-y-2">
    {loading ? (
      <LoadingSpinner size="md" />
    ) : (
      clients.map(client => (
        <div key={client.id} className="flex justify-between items-center p-4 border rounded">
          <div>
            <h4>{client.name}</h4>
            <Badge variant={client.active ? 'success' : 'neutral'}>
              {client.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEdit(client)}>
            Edit
          </Button>
        </div>
      ))
    )}
  </div>
)
```

---

## 🚨 **When You Must Create Custom Components**

### Acceptable Cases:
1. **Complex Business Logic**: Feature-specific components with unique behavior
2. **Third-party Integration**: Wrappers around external libraries  
3. **Performance Optimization**: Highly optimized components for specific use cases
4. **Design System Extensions**: New patterns not covered by base components

### Required Pattern:
```tsx
// ✅ CORRECT - Extends base components
import { Button, Card } from "@components/ui"

export const FeatureSpecificComponent = ({ specialProp, ...props }) => (
  <Card variant="default" {...props}>
    <FeatureSpecificLogic specialProp={specialProp} />
    <Button variant="primary">Feature Action</Button>
  </Card>
)
```

---

## 📞 **Getting Help**

### Questions About Component Usage:
1. Check this guide first
2. Review base component documentation
3. Ask in component design sessions (weekly)
4. Create GitHub discussion for architectural questions

### ESLint Errors:
- `no-restricted-syntax`: Use suggested base component
- `no-restricted-imports`: Check Scope Rules compliance
- Run `npm run component:duplication` for analysis

### Architecture Reviews:
- All new components require architectural review
- Use `npm run architecture:validate` before PR
- Component health reports available via `npm run component:health`

---

*This guide is updated regularly. Last updated: September 2025*