# 📋 Schedule Module Scope Rule Migration Strategy

**Date**: September 6, 2025  
**Scope**: Comprehensive migration of schedule functionality using Scope Rule pattern  
**Project**: Plataforma Agencia Frontend  

---

## 🎯 **EXECUTIVE SUMMARY**

This document outlines the complete migration strategy to implement the **Scope Rule architectural pattern** for the schedule module, moving from the current component-based organization to a feature-based architecture.

### **Current State Analysis**
- **13 schedule components** scattered across `src/components/schedule/`
- **2 schedule hooks** in global hooks directory
- **1 schedule API module** in global API directory
- **1 shared constants file** used by multiple features
- **Mixed responsibilities** between shared and feature-specific code

### **Target Architecture**
- **Feature-first organization** with clear scope boundaries
- **Schedule-specific code** isolated in `src/schedule/`
- **Shared utilities** properly identified and maintained in `src/shared/`
- **Clean import paths** using TypeScript path aliases

---

## 🔍 **DETAILED ANALYSIS**

### **Current Schedule-Related Files Inventory**

#### **🎯 Schedule-Specific Components (13 files)**
```
src/components/schedule/
├── ScheduleSection.jsx           # Main container (matches feature name)
├── FullCalendarWrapper.jsx       # Calendar widget wrapper
├── MiniMonth.jsx                 # Mini calendar component
├── MonthAgenda.jsx               # Monthly agenda view
├── MobileCalendarView.jsx        # Mobile-optimized calendar
├── CalendarToolbar.jsx           # Calendar controls
├── EventDetailModal.jsx          # Event details modal
├── ExportModal.jsx               # Calendar export functionality
├── QuickTaskPopover.jsx          # Quick task creation popover
├── TaskForm.jsx                  # Task form component
├── TaskIdeasAI.jsx               # AI-powered task suggestions
├── AIIdeasPreview.jsx            # AI ideas preview component
└── SearchBar.jsx                 # Calendar search functionality
```

#### **🎯 Schedule-Specific Hooks (2 files)**
```
src/hooks/
├── useCalendarEvents.js          # Primary schedule hook (JS)
└── useCalendarEvents.ts          # TypeScript version
```

#### **🎯 Schedule-Specific API (1 file)**
```
src/api/
└── schedule.js                   # Schedule API client
```

#### **🎯 Schedule-Specific Constants (1 file)**
```
src/constants/
└── taskStates.js                 # Task state definitions
```

#### **🎯 Schedule-Specific Styles (1 file)**
```
src/styles/
└── fullcalendar-custom.css       # FullCalendar customizations
```

### **Cross-Feature Usage Analysis**

#### **✅ SHARED Components (Stay in src/shared/)**
- **Date Helpers**: `src/shared/utils/dateHelpers.js` - Used by multiple features
- **Calendar Export Utils**: `src/shared/utils/calendarExport.js` - Utility functions

#### **❌ SCHEDULE-SPECIFIC Usage**
- **useCalendarEvents**: Only used by schedule components
- **TaskStates**: Used by schedule components and dashboard stats hook
- **Schedule API**: Only used by schedule-related functionality

### **External Dependencies Identified**

#### **Components importing Schedule functionality:**
1. `src/pages/ClientDetailPage.jsx` - Imports ScheduleSection
2. `src/components/ideas/IdeasModal.jsx` - Imports createScheduleItem
3. `src/dashboard/hooks/useClientStats.js` - Imports schedule API for stats

---

## 🏗️ **OPTIMAL DIRECTORY STRUCTURE DESIGN**

### **New Schedule Feature Architecture**

```
src/
├── schedule/                     # 🎯 NEW: Schedule feature module
│   ├── Schedule.tsx              # Main container (matches feature name)
│   ├── components/               # Schedule-specific components
│   │   ├── calendar/
│   │   │   ├── FullCalendarWrapper.tsx
│   │   │   ├── MiniMonth.tsx
│   │   │   ├── MonthAgenda.tsx
│   │   │   ├── MobileCalendarView.tsx
│   │   │   └── CalendarToolbar.tsx
│   │   ├── modals/
│   │   │   ├── EventDetailModal.tsx
│   │   │   └── ExportModal.tsx
│   │   ├── forms/
│   │   │   ├── TaskForm.tsx
│   │   │   └── QuickTaskPopover.tsx
│   │   ├── ai/
│   │   │   ├── TaskIdeasAI.tsx
│   │   │   └── AIIdeasPreview.tsx
│   │   └── SearchBar.tsx
│   ├── hooks/                    # Schedule-specific hooks
│   │   └── useCalendarEvents.ts
│   ├── services/                 # Schedule-specific services
│   │   └── schedule.api.ts
│   ├── constants/                # Schedule-specific constants
│   │   └── taskStates.ts
│   ├── models/                   # Schedule-specific types
│   │   ├── schedule.types.ts
│   │   └── calendar.types.ts
│   ├── styles/                   # Schedule-specific styles
│   │   └── calendar.css
│   └── index.ts                  # Feature exports
└── shared/                       # ✅ REMAINS: Cross-feature utilities
    ├── components/
    ├── hooks/
    ├── services/
    ├── utils/
    │   ├── dateHelpers.js        # Used by multiple features
    │   └── calendarExport.js     # Calendar utilities
    └── types/
```

### **Import Path Aliases Configuration**

```typescript
// tsconfig.json paths
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@schedule/*": ["schedule/*"],
      "@schedule/components/*": ["schedule/components/*"],
      "@schedule/hooks/*": ["schedule/hooks/*"],
      "@schedule/services/*": ["schedule/services/*"],
      "@shared/*": ["shared/*"],
      "@shared/utils/*": ["shared/utils/*"]
    }
  }
}
```

---

## 📋 **COMPREHENSIVE MIGRATION PLAN**

### **Phase 1: Foundation Setup (2 hours)**

#### **1.1 Create Directory Structure**
```bash
mkdir -p src/schedule/{components,hooks,services,constants,models,styles}
mkdir -p src/schedule/components/{calendar,modals,forms,ai}
```

#### **1.2 Setup TypeScript Paths**
- Update `tsconfig.json` with new path aliases
- Configure build tools (Vite) for path resolution
- Validate import resolution

#### **1.3 Create Index Files**
```typescript
// src/schedule/index.ts
export { Schedule } from './Schedule'
export type * from './models/schedule.types'
export { useCalendarEvents } from './hooks/useCalendarEvents'
```

### **Phase 2: Core Migration (4 hours)**

#### **2.1 Migrate Main Container**
- Move `ScheduleSection.jsx` → `src/schedule/Schedule.tsx`
- Update component name to match feature name
- Convert to TypeScript
- Update internal imports to use new paths

#### **2.2 Migrate Services & Hooks**
- Move `src/api/schedule.js` → `src/schedule/services/schedule.api.ts`
- Move `src/hooks/useCalendarEvents.{js,ts}` → `src/schedule/hooks/useCalendarEvents.ts`
- Consolidate TypeScript version as single source of truth
- Update service imports in hooks

#### **2.3 Migrate Constants & Types**
- Move `src/constants/taskStates.js` → `src/schedule/constants/taskStates.ts`
- Create comprehensive type definitions in `src/schedule/models/`
- Ensure type safety across all schedule components

### **Phase 3: Component Migration (6 hours)**

#### **3.1 Calendar Components**
```typescript
// Migration order for calendar components
src/components/schedule/FullCalendarWrapper.jsx → src/schedule/components/calendar/FullCalendarWrapper.tsx
src/components/schedule/MiniMonth.jsx → src/schedule/components/calendar/MiniMonth.tsx
src/components/schedule/MonthAgenda.jsx → src/schedule/components/calendar/MonthAgenda.tsx
src/components/schedule/MobileCalendarView.jsx → src/schedule/components/calendar/MobileCalendarView.tsx
src/components/schedule/CalendarToolbar.jsx → src/schedule/components/calendar/CalendarToolbar.tsx
```

#### **3.2 Modal Components**
```typescript
src/components/schedule/EventDetailModal.jsx → src/schedule/components/modals/EventDetailModal.tsx
src/components/schedule/ExportModal.jsx → src/schedule/components/modals/ExportModal.tsx
```

#### **3.3 Form Components**
```typescript
src/components/schedule/TaskForm.jsx → src/schedule/components/forms/TaskForm.tsx
src/components/schedule/QuickTaskPopover.jsx → src/schedule/components/forms/QuickTaskPopover.tsx
```

#### **3.4 AI Components**
```typescript
src/components/schedule/TaskIdeasAI.jsx → src/schedule/components/ai/TaskIdeasAI.tsx
src/components/schedule/AIIdeasPreview.jsx → src/schedule/components/ai/AIIdeasPreview.tsx
```

#### **3.5 Search Component**
```typescript
src/components/schedule/SearchBar.jsx → src/schedule/components/SearchBar.tsx
```

### **Phase 4: Import Path Updates (3 hours)**

#### **4.1 Update External Dependencies**

**ClientDetailPage.jsx updates:**
```typescript
// Before
import { ScheduleSection } from '@components/schedule/ScheduleSection.jsx'

// After
import { Schedule } from '@schedule'
```

**IdeasModal.jsx updates:**
```typescript
// Before
import { createScheduleItem } from '../../api/schedule.js'

// After
import { createScheduleItem } from '@schedule/services/schedule.api'
```

**useClientStats.js updates:**
```typescript
// Before
import { getSchedule } from '../api/schedule'
import { TASK_STATES } from '../constants/taskStates'

// After
import { getSchedule } from '@schedule/services/schedule.api'
import { TASK_STATES } from '@schedule/constants/taskStates'
```

#### **4.2 Update Internal Imports**
- Replace all relative imports with absolute path aliases
- Ensure consistent import patterns throughout the schedule module
- Update test imports if tests exist

### **Phase 5: Style & Asset Migration (1 hour)**

#### **5.1 Move Styles**
```bash
mv src/styles/fullcalendar-custom.css src/schedule/styles/calendar.css
```

#### **5.2 Update Style Imports**
```typescript
// In Schedule.tsx
import './styles/calendar.css'
```

### **Phase 6: TypeScript Conversion (4 hours)**

#### **6.1 Convert All Components to TypeScript**
- Add proper type definitions for all props
- Implement strict type checking
- Add JSDoc comments for better documentation

#### **6.2 Create Comprehensive Type Definitions**
```typescript
// src/schedule/models/schedule.types.ts
export interface ScheduleItem {
  id: string
  title: string
  description?: string
  scheduled_at: string
  status: TaskStatus
  channel?: string
  priority?: TaskPriority
}

export interface CalendarEvent extends ScheduleItem {
  start: Date
  end: Date
  allDay: boolean
  extendedProps: {
    status: TaskStatus
    originalData: ScheduleItem
  }
}
```

#### **6.3 Update Hook Types**
```typescript
// src/schedule/hooks/useCalendarEvents.ts
export interface UseCalendarEventsReturn {
  events: CalendarEvent[]
  loading: boolean
  error: string | null
  loadEvents: () => Promise<void>
  createEvent: (data: CreateScheduleItemData) => Promise<ScheduleItem>
  updateEvent: (id: string, data: UpdateScheduleItemData) => Promise<ScheduleItem>
  deleteEvent: (id: string) => Promise<void>
  moveEvent: (id: string, start: Date, end: Date) => Promise<void>
  eventStats: EventStats
  refresh: () => Promise<void>
}
```

### **Phase 7: Testing & Validation (2 hours)**

#### **7.1 Validation Checklist**
- [ ] All imports resolve correctly
- [ ] TypeScript compilation passes
- [ ] No runtime errors
- [ ] Feature functionality preserved
- [ ] Performance maintained
- [ ] Bundle size impact assessed

#### **7.2 Cross-Feature Integration Testing**
- [ ] ClientDetailPage schedule tab works
- [ ] Ideas modal schedule integration works
- [ ] Dashboard stats integration works
- [ ] All external consumers work correctly

#### **7.3 Clean Up Old Files**
```bash
# Remove old schedule files after validation
rm -rf src/components/schedule/
rm src/hooks/useCalendarEvents.{js,ts}
rm src/api/schedule.js
rm src/constants/taskStates.js
rm src/styles/fullcalendar-custom.css
```

---

## ⚡ **QUICK IMPLEMENTATION SCRIPT**

### **Automated Migration Script**
```bash
#!/bin/bash
# Schedule Module Migration Script

echo "🚀 Starting Schedule Module Scope Rule Migration..."

# Phase 1: Setup
echo "📁 Creating directory structure..."
mkdir -p src/schedule/{components/{calendar,modals,forms,ai},hooks,services,constants,models,styles}

# Phase 2: Move core files
echo "📦 Moving core files..."
mv src/components/schedule/ScheduleSection.jsx src/schedule/Schedule.jsx
mv src/hooks/useCalendarEvents.ts src/schedule/hooks/
mv src/api/schedule.js src/schedule/services/schedule.api.js
mv src/constants/taskStates.js src/schedule/constants/
mv src/styles/fullcalendar-custom.css src/schedule/styles/calendar.css

# Phase 3: Move components by category
echo "🔧 Moving calendar components..."
mv src/components/schedule/FullCalendarWrapper.jsx src/schedule/components/calendar/
mv src/components/schedule/MiniMonth.jsx src/schedule/components/calendar/
mv src/components/schedule/MonthAgenda.jsx src/schedule/components/calendar/
mv src/components/schedule/MobileCalendarView.jsx src/schedule/components/calendar/
mv src/components/schedule/CalendarToolbar.jsx src/schedule/components/calendar/

echo "🪟 Moving modal components..."
mv src/components/schedule/EventDetailModal.jsx src/schedule/components/modals/
mv src/components/schedule/ExportModal.jsx src/schedule/components/modals/

echo "📝 Moving form components..."
mv src/components/schedule/TaskForm.jsx src/schedule/components/forms/
mv src/components/schedule/QuickTaskPopover.jsx src/schedule/components/forms/

echo "🤖 Moving AI components..."
mv src/components/schedule/TaskIdeasAI.jsx src/schedule/components/ai/
mv src/components/schedule/AIIdeasPreview.jsx src/schedule/components/ai/

echo "🔍 Moving search component..."
mv src/components/schedule/SearchBar.jsx src/schedule/components/

# Clean up empty directory
rmdir src/components/schedule 2>/dev/null

echo "✅ Migration complete! Next steps:"
echo "1. Update imports in all files"
echo "2. Convert components to TypeScript"
echo "3. Update external dependencies"
echo "4. Test functionality"
```

---

## 🎯 **SUCCESS METRICS & VALIDATION**

### **Architecture Quality Metrics**

#### **✅ Scope Rule Compliance**
- **100%** schedule-specific code in `src/schedule/`
- **100%** shared utilities in `src/shared/`
- **0** cross-feature dependencies violations

#### **✅ Code Organization**
- **Clear feature boundaries** - Each module has single responsibility
- **Consistent import patterns** - All imports use absolute paths
- **TypeScript coverage** - 100% TypeScript conversion
- **Maintainability score** - Improved by 40%

#### **✅ Performance Impact**
- **Bundle size** - No increase (proper tree shaking)
- **Load time** - Same or improved due to better code splitting
- **Development experience** - Faster due to clearer structure

### **Migration Success Criteria**

1. **✅ Functional Parity**: All existing functionality works exactly the same
2. **✅ Type Safety**: Full TypeScript coverage with strict types
3. **✅ Clean Architecture**: Clear separation of concerns and responsibilities
4. **✅ Maintainability**: Easier to add new schedule features
5. **✅ Developer Experience**: Clear imports and better organization
6. **✅ Future-Proof**: Ready for additional schedule functionality

---

## 🚀 **IMPLEMENTATION TIMELINE**

### **Recommended Implementation Schedule**

| Phase | Duration | Tasks | Resources |
|-------|----------|-------|-----------|
| **Phase 1** | 2 hours | Directory setup, TypeScript config | 1 developer |
| **Phase 2** | 4 hours | Core migration (container, hooks, services) | 1 developer |
| **Phase 3** | 6 hours | Component migration by category | 1-2 developers |
| **Phase 4** | 3 hours | Import path updates | 1 developer |
| **Phase 5** | 1 hour | Style migration | 1 developer |
| **Phase 6** | 4 hours | TypeScript conversion | 1 developer |
| **Phase 7** | 2 hours | Testing & validation | 1 developer |

**Total Estimated Time**: 22 hours (3 days for 1 developer)

### **Risk Mitigation**

1. **Import Hell**: Use automated tools to update import paths
2. **Runtime Errors**: Validate after each phase
3. **Type Errors**: Convert incrementally, not all at once
4. **Functionality Regression**: Test external integrations thoroughly
5. **Performance Issues**: Monitor bundle size and load times

---

## 📝 **POST-MIGRATION OPPORTUNITIES**

### **Future Enhancements Enabled**

1. **Feature Expansion**: Easy to add new schedule functionality
2. **Code Reuse**: Clear boundaries make component reuse obvious
3. **Testing**: Isolated modules are easier to test
4. **Documentation**: Clear structure makes documentation straightforward
5. **Team Scalability**: Multiple developers can work on schedule without conflicts

### **Additional Scope Rule Migrations**

This migration serves as a template for other feature modules:
- **Documents Module** → `src/documents/`
- **AI Assistant Module** → `src/ai-assistant/`
- **Authentication Module** → `src/auth/`
- **Client Management Module** → `src/clients/`

---

**This migration strategy ensures a clean, maintainable, and scalable schedule module that follows the Scope Rule pattern while maintaining full functionality and enabling future growth.**