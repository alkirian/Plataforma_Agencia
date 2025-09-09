# 📅 Schedule Module Developer Guidelines
**Plataforma Agencia - Schedule Feature Development**  
**Version**: 1.0  
**Updated**: September 6, 2025  

---

## 🎯 **OVERVIEW**

This guide provides **comprehensive instructions** for developing and maintaining the Schedule feature module following the successful Scope Rules migration. The Schedule module serves as the **reference implementation** for all future feature modules.

---

## 🏗️ **MODULE STRUCTURE**

### **📁 Complete Directory Layout**
```
src/features/schedule/
├── components/                    # UI Components
│   ├── ScheduleSection.jsx       # 🎯 Main container component
│   ├── calendar/                 # Calendar-related components
│   │   ├── CalendarToolbar.jsx   # Calendar controls & navigation
│   │   ├── FullCalendarWrapper.jsx # Main calendar display
│   │   ├── MiniMonth.jsx         # Mini month picker
│   │   ├── MobileCalendarView.jsx # Mobile-optimized view
│   │   ├── MonthAgenda.jsx       # Month event list
│   │   ├── SearchBar.jsx         # Event search functionality
│   │   └── index.ts              # Barrel exports
│   ├── modals/                   # Modal dialogs
│   │   ├── EventDetailModal.jsx  # Event details & editing
│   │   ├── ExportModal.jsx       # Calendar export options
│   │   ├── QuickTaskPopover.jsx  # Quick task creation
│   │   └── index.ts              # Barrel exports
│   ├── forms/                    # Form components
│   │   ├── TaskForm.jsx          # Comprehensive task form
│   │   └── index.ts              # Barrel exports
│   ├── ai/                       # AI-related components
│   │   ├── AIIdeasPreview.jsx    # AI-generated ideas preview
│   │   ├── TaskIdeasAI.jsx       # AI task generation
│   │   └── index.ts              # Barrel exports
│   └── index.ts                  # Main component exports
├── hooks/                        # React hooks
│   ├── useCalendarEvents.js      # 🎯 Main calendar state management
│   ├── useTaskDrafts.js          # Task draft persistence
│   └── index.ts                  # Hook exports
├── services/                     # Business logic & API
│   ├── schedule.js               # 🎯 Schedule API service
│   └── index.ts                  # Service exports
├── constants/                    # Module constants
│   ├── taskStates.js             # Task state definitions
│   └── index.ts                  # Constants exports
├── models/                       # TypeScript types
│   ├── schedule.types.ts         # 🎯 Comprehensive type definitions
│   └── index.ts                  # Type exports
├── styles/                       # Module-specific styles
│   └── index.ts                  # Style exports
└── index.ts                      # 🎯 Main module barrel export
```

### **🔄 Import/Export Flow**
```typescript
// External consumers import from main barrel
import { ScheduleSection, useCalendarEvents } from '@src/features/schedule'

// Internal components use relative imports or sub-barrels
import { EventDetailModal } from '../modals'
import { TaskForm } from '../forms'
```

---

## 🎯 **CORE COMPONENTS GUIDE**

### **1. ScheduleSection.jsx** 🎯 **Main Container**

#### **Purpose & Responsibility**
- Primary schedule feature entry point
- Manages overall schedule state and context
- Coordinates between calendar, modals, and forms

#### **Key Props Interface**
```javascript
interface ScheduleSectionProps {
  clientId: string              // Required: Client context
  initialView?: CalendarView    // Optional: Default calendar view
  onEventCreate?: (event) => void // Optional: Event creation callback
  className?: string            // Optional: Additional styling
}
```

#### **Usage Example**
```jsx
// In ClientDetailPage.jsx
import { ScheduleSection } from '@src/features/schedule'

<ScheduleSection 
  clientId={clientId}
  initialView="dayGridMonth"
  onEventCreate={handleEventCreate}
  className="schedule-container"
/>
```

#### **State Management**
```javascript
const ScheduleSection = ({ clientId, initialView, onEventCreate }) => {
  // Main calendar state
  const {
    events,
    loading,
    currentDate,
    currentView,
    createEvent,
    updateEvent,
    deleteEvent
  } = useCalendarEvents(clientId)
  
  // UI state
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showQuickTask, setShowQuickTask] = useState(false)
  
  // ... component implementation
}
```

### **2. useCalendarEvents Hook** 🎯 **Core State Management**

#### **Purpose & Responsibility**
- Manages all calendar event CRUD operations
- Handles data transformations (API ↔ FullCalendar)
- Provides loading states and error handling
- Manages calendar navigation and view state

#### **Complete API Surface**
```typescript
interface UseCalendarEventsReturn {
  // State
  events: FullCalendarEvent[]        // Transformed events for display
  loading: boolean                   // Global loading state
  error: string | null               // Error messages
  currentDate: Date                  // Current calendar date
  currentView: CalendarView          // Current calendar view
  
  // CRUD Operations
  loadEvents: () => Promise<void>    // Refresh events from API
  createEvent: (data: CreateScheduleItemPayload) => Promise<ScheduleItem>
  updateEvent: (id: string, data: UpdateScheduleItemPayload) => Promise<ScheduleItem>
  deleteEvent: (id: string) => Promise<void>
  moveEvent: (id: string, newStart: Date, newEnd?: Date) => Promise<void>
  
  // Navigation
  setCurrentDate: (date: Date) => void
  setCurrentView: (view: CalendarView) => void
  navigateToDate: (date: Date) => void
  
  // Utilities
  eventStats: EventStatistics        // Event counts by status/channel
  refresh: () => Promise<void>       // Force refresh
  getEventById: (id: string) => FullCalendarEvent | null
}
```

#### **Usage Patterns**
```javascript
// Basic usage
const { events, loading, createEvent } = useCalendarEvents(clientId)

// Advanced usage with navigation
const {
  events,
  loading,
  currentDate,
  setCurrentDate,
  createEvent,
  updateEvent,
  deleteEvent
} = useCalendarEvents(clientId, {
  initialView: 'dayGridMonth',
  autoRefresh: true,
  onError: handleError
})

// Creating events
const handleCreateEvent = async (eventData) => {
  try {
    const newEvent = await createEvent({
      title: eventData.title,
      scheduled_at: eventData.date,
      status: 'planificacion',
      channel: 'IG',
      description: eventData.description
    })
    console.log('Event created:', newEvent)
  } catch (error) {
    console.error('Failed to create event:', error)
  }
}
```

### **3. Calendar Components** 📅

#### **FullCalendarWrapper.jsx**
```javascript
// Primary calendar display component
const FullCalendarWrapper = ({
  events,                           // Array of FullCalendarEvent
  currentDate,                      // Display date
  currentView,                      // Calendar view type
  loading,                         // Loading state
  onDateChange,                    // Date navigation callback
  onViewChange,                    // View change callback
  onEventClick,                    // Event click handler
  onDateClick,                     // Empty date click handler
  onEventDrop,                     // Drag & drop handler
  height = 'auto'                  // Calendar height
}) => {
  // FullCalendar integration with optimal configuration
}
```

#### **CalendarToolbar.jsx**
```javascript
// Calendar navigation and view controls
const CalendarToolbar = ({
  currentDate,                     // Current calendar date
  currentView,                     // Current view type
  onNavigate,                      // Navigation handler
  onViewChange,                    // View change handler
  onToday,                         // Go to today handler
  eventStats,                      // Event statistics
  loading                          // Loading indicator
}) => {
  // Toolbar with prev/next, view selector, stats
}
```

#### **MiniMonth.jsx**
```javascript
// Compact month picker component
const MiniMonth = ({
  currentDate,                     // Selected date
  onNavigate,                      // Date selection handler
  events,                         // Events for highlighting
  highlightToday = true           // Highlight today's date
}) => {
  // Compact month view with event indicators
}
```

### **4. Modal Components** 🪟

#### **EventDetailModal.jsx**
```javascript
// Comprehensive event details and editing
const EventDetailModal = ({
  isOpen,                         // Modal visibility
  onClose,                        // Close handler
  event,                          // FullCalendarEvent or null
  onUpdate,                       // Update handler
  onDelete,                       // Delete handler
  loading = false                 // Action loading state
}) => {
  // Full event details with edit capabilities
}
```

#### **QuickTaskPopover.jsx**
```javascript
// Quick task creation from calendar clicks
const QuickTaskPopover = ({
  isOpen,                         // Popover visibility
  onClose,                        // Close handler
  clickCoords,                    // Click coordinates for positioning
  selectedDate,                   // Pre-selected date
  clientId,                       // Client context
  onCreateTask                    // Task creation handler
}) => {
  // Minimal form for quick task creation
}
```

### **5. Form Components** 📝

#### **TaskForm.jsx**
```javascript
// Comprehensive task creation/editing form
const TaskForm = ({
  initialData = {},               // Pre-populated form data
  onSubmit,                       // Form submission handler
  onCancel,                       // Cancel handler
  loading = false,                // Submission loading
  submitText = 'Crear Tarea'     // Submit button text
}) => {
  // Complete form with all schedule fields
  // - Title, description, copy
  // - Date & time selection
  // - Status, channel, priority
  // - Hashtags and mentions
}
```

---

## 🔧 **DEVELOPMENT WORKFLOWS**

### **🆕 Adding New Components**

#### **Step 1: Determine Placement**
```bash
# Calendar-related component
src/features/schedule/components/calendar/NewCalendarComponent.jsx

# Modal dialog
src/features/schedule/components/modals/NewModal.jsx

# Form component  
src/features/schedule/components/forms/NewForm.jsx

# AI-related component
src/features/schedule/components/ai/NewAIComponent.jsx
```

#### **Step 2: Create Component**
```jsx
// src/features/schedule/components/calendar/NewCalendarComponent.jsx
import React from 'react'
import { useCalendarEvents } from '../../hooks'
import type { ScheduleItem } from '../../models'

interface NewCalendarComponentProps {
  clientId: string
  onEventSelect?: (event: ScheduleItem) => void
}

const NewCalendarComponent: React.FC<NewCalendarComponentProps> = ({
  clientId,
  onEventSelect
}) => {
  const { events, loading } = useCalendarEvents(clientId)
  
  return (
    <div className="new-calendar-component">
      {/* Component implementation */}
    </div>
  )
}

export default NewCalendarComponent
```

#### **Step 3: Update Barrel Exports**
```typescript
// src/features/schedule/components/calendar/index.ts
export { default as CalendarToolbar } from './CalendarToolbar.jsx'
export { default as FullCalendarWrapper } from './FullCalendarWrapper.jsx'
export { default as NewCalendarComponent } from './NewCalendarComponent.jsx' // ✅ Add here

// src/features/schedule/components/index.ts
export * from './calendar'  // ✅ Already includes NewCalendarComponent
```

#### **Step 4: Add TypeScript Types (if needed)**
```typescript
// src/features/schedule/models/schedule.types.ts
export interface NewCalendarComponentProps {
  clientId: string
  onEventSelect?: (event: ScheduleItem) => void
  // Additional props...
}
```

### **🔄 Modifying Existing Components**

#### **Safe Modification Process**
```bash
# 1. Understand component scope and dependencies
grep -r "ComponentName" src/features/schedule/ --include="*.jsx" --include="*.js"

# 2. Check TypeScript usage
grep -r "ComponentName" src/features/schedule/models/ --include="*.ts"

# 3. Verify external usage
grep -r "ComponentName" src/ --exclude-dir=features/schedule --include="*.jsx" --include="*.js"
```

#### **Backward Compatibility Guidelines**
```javascript
// ✅ SAFE: Add optional props
const ExistingComponent = ({
  existingProp,
  newOptionalProp = defaultValue  // ✅ Safe addition
}) => {
  // Implementation
}

// ✅ SAFE: Add new methods to hooks
const useCalendarEvents = (clientId) => {
  // Existing API
  const existingMethods = { ... }
  
  // New optional methods
  const newMethod = useCallback(() => { ... }, [])
  
  return {
    ...existingMethods,
    newMethod  // ✅ Safe addition
  }
}

// ❌ UNSAFE: Change required prop types
const ExistingComponent = ({
  existingProp: NewType  // ❌ Breaking change
}) => { ... }

// ❌ UNSAFE: Remove existing props
const ExistingComponent = ({
  // existingProp removed  // ❌ Breaking change
}) => { ... }
```

### **🎯 Hook Development**

#### **Creating New Hooks**
```javascript
// src/features/schedule/hooks/useNewHook.js
import { useState, useEffect, useCallback } from 'react'
import { scheduleApi } from '../services'
import type { ScheduleItem } from '../models'

export const useNewHook = (clientId: string, options = {}) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await scheduleApi.getData(clientId)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [clientId])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}
```

#### **Update Hook Barrel Export**
```typescript
// src/features/schedule/hooks/index.ts
export { useCalendarEvents } from './useCalendarEvents'
export { useTaskDrafts } from './useTaskDrafts'
export { useNewHook } from './useNewHook'  // ✅ Add new hook
```

### **🔧 Service Layer Development**

#### **Extending Schedule API**
```javascript
// src/features/schedule/services/schedule.js

// ✅ Add new API methods
export const scheduleApi = {
  // Existing methods...
  getSchedule,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  
  // ✅ New methods
  duplicateEvent: async (eventId) => {
    const response = await apiFetch(`/api/schedule/${eventId}/duplicate`, {
      method: 'POST'
    })
    return response.data
  },
  
  exportCalendar: async (clientId, options) => {
    const response = await apiFetch(`/api/clients/${clientId}/schedule/export`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
    return response.data
  }
}
```

---

## 📊 **TYPESCRIPT INTEGRATION**

### **🎯 Type Development Guidelines**

#### **Adding New Types**
```typescript
// src/features/schedule/models/schedule.types.ts

// ✅ Add new domain types
export interface CalendarTemplate {
  id: string
  name: string
  description?: string
  defaultSettings: CalendarOptions
  created_at: string
}

export type TemplateCategory = 'social_media' | 'content_marketing' | 'events' | 'custom'

// ✅ Add new component prop types
export interface CalendarTemplatePickerProps {
  templates: CalendarTemplate[]
  selectedTemplate?: string
  onTemplateSelect: (template: CalendarTemplate) => void
  category?: TemplateCategory
}

// ✅ Add new hook return types
export interface UseTemplatesReturn {
  templates: CalendarTemplate[]
  loading: boolean
  error: string | null
  selectTemplate: (templateId: string) => Promise<void>
  createTemplate: (template: Partial<CalendarTemplate>) => Promise<CalendarTemplate>
}
```

#### **Type Import Patterns**
```typescript
// ✅ INTERNAL: Use relative imports for internal types
import type { ScheduleItem, TaskState } from '../models'

// ✅ EXTERNAL: Use absolute imports for external types  
import type { ReactNode } from 'react'
import type { BaseEntity } from '@src/shared/types'

// ✅ CONSUMER: Import from module barrel
import type { 
  ScheduleItem, 
  UseCalendarEventsReturn,
  CalendarOptions
} from '@src/features/schedule'
```

### **🔒 Type Safety Best Practices**

#### **Strict Typing**
```typescript
// ✅ GOOD: Strict event handlers
interface EventHandlers {
  onEventClick: (event: FullCalendarEvent) => void
  onDateClick: (date: Date, info: DateClickInfo) => void
  onEventDrop: (event: FullCalendarEvent, delta: TimeDelta) => void
}

// ✅ GOOD: Discriminated unions
type APIResponseState = 
  | { status: 'loading'; data?: never; error?: never }
  | { status: 'success'; data: ScheduleItem[]; error?: never }
  | { status: 'error'; data?: never; error: string }

// ❌ BAD: Loose typing
interface LooseEventHandlers {
  onClick: (data: any) => void     // ❌ No type safety
  onUpdate: (stuff: unknown) => void // ❌ No intellisense
}
```

#### **Generic Utilities**
```typescript
// Create reusable type utilities
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Usage examples
type CreateEventPayload = Optional<ScheduleItem, 'id' | 'created_at' | 'updated_at'>
type EventFormData = RequiredFields<Partial<ScheduleItem>, 'title' | 'scheduled_at'>
```

---

## 🧪 **TESTING GUIDELINES**

### **🎯 Testing Strategy**

#### **Component Testing**
```javascript
// tests/features/schedule/components/ScheduleSection.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ScheduleSection } from '@src/features/schedule'
import { mockCalendarEvents } from '../__mocks__/calendarData'

// Mock the hook
jest.mock('@src/features/schedule/hooks/useCalendarEvents')

describe('ScheduleSection', () => {
  beforeEach(() => {
    useCalendarEvents.mockReturnValue({
      events: mockCalendarEvents,
      loading: false,
      createEvent: jest.fn()
    })
  })
  
  it('should render calendar with events', () => {
    render(<ScheduleSection clientId="client-123" />)
    
    expect(screen.getByTestId('schedule-calendar')).toBeInTheDocument()
    expect(screen.getByText('Event 1')).toBeInTheDocument()
  })
  
  it('should handle event creation', async () => {
    const createEvent = jest.fn()
    useCalendarEvents.mockReturnValue({
      events: [],
      loading: false,
      createEvent
    })
    
    render(<ScheduleSection clientId="client-123" />)
    
    fireEvent.click(screen.getByTestId('add-event-button'))
    fireEvent.change(screen.getByLabelText('Event Title'), {
      target: { value: 'New Event' }
    })
    fireEvent.click(screen.getByText('Create'))
    
    await waitFor(() => {
      expect(createEvent).toHaveBeenCalledWith({
        title: 'New Event',
        // ... other expected data
      })
    })
  })
})
```

#### **Hook Testing**
```javascript
// tests/features/schedule/hooks/useCalendarEvents.test.js
import { renderHook, act } from '@testing-library/react-hooks'
import { useCalendarEvents } from '@src/features/schedule'
import * as scheduleApi from '@src/features/schedule/services'

jest.mock('@src/features/schedule/services')

describe('useCalendarEvents', () => {
  it('should load events on mount', async () => {
    const mockEvents = [{ id: '1', title: 'Test Event' }]
    scheduleApi.getSchedule.mockResolvedValue(mockEvents)
    
    const { result, waitForNextUpdate } = renderHook(() =>
      useCalendarEvents('client-123')
    )
    
    expect(result.current.loading).toBe(true)
    
    await waitForNextUpdate()
    
    expect(result.current.loading).toBe(false)
    expect(result.current.events).toEqual(mockEvents)
    expect(scheduleApi.getSchedule).toHaveBeenCalledWith('client-123')
  })
  
  it('should create new events', async () => {
    const mockEvent = { id: '1', title: 'New Event' }
    scheduleApi.createScheduleItem.mockResolvedValue(mockEvent)
    
    const { result } = renderHook(() => useCalendarEvents('client-123'))
    
    await act(async () => {
      await result.current.createEvent({
        title: 'New Event',
        scheduled_at: '2025-09-07T10:00:00Z'
      })
    })
    
    expect(scheduleApi.createScheduleItem).toHaveBeenCalled()
  })
})
```

#### **Service Testing**
```javascript
// tests/features/schedule/services/schedule.test.js
import { scheduleApi } from '@src/features/schedule/services'
import { apiFetch } from '@src/api/apiFetch'

jest.mock('@src/api/apiFetch')

describe('scheduleApi', () => {
  beforeEach(() => {
    apiFetch.mockClear()
  })
  
  it('should fetch schedule data', async () => {
    const mockResponse = { data: [{ id: '1', title: 'Event' }] }
    apiFetch.mockResolvedValue(mockResponse)
    
    const result = await scheduleApi.getSchedule('client-123')
    
    expect(apiFetch).toHaveBeenCalledWith('/api/clients/client-123/schedule')
    expect(result).toEqual(mockResponse.data)
  })
  
  it('should create schedule items', async () => {
    const mockEvent = { title: 'New Event', scheduled_at: '2025-09-07T10:00:00Z' }
    const mockResponse = { data: { id: '1', ...mockEvent } }
    apiFetch.mockResolvedValue(mockResponse)
    
    const result = await scheduleApi.createScheduleItem('client-123', mockEvent)
    
    expect(apiFetch).toHaveBeenCalledWith('/api/clients/client-123/schedule', {
      method: 'POST',
      body: JSON.stringify(mockEvent)
    })
    expect(result).toEqual(mockResponse.data)
  })
})
```

### **🎯 Test Organization**
```
tests/
└── features/
    └── schedule/
        ├── __mocks__/
        │   ├── calendarData.js      # Mock data for tests
        │   └── apiResponses.js      # Mock API responses
        ├── components/
        │   ├── ScheduleSection.test.jsx
        │   ├── calendar/
        │   │   ├── FullCalendarWrapper.test.jsx
        │   │   └── CalendarToolbar.test.jsx
        │   └── modals/
        │       └── EventDetailModal.test.jsx
        ├── hooks/
        │   ├── useCalendarEvents.test.js
        │   └── useTaskDrafts.test.js
        ├── services/
        │   └── schedule.test.js
        └── integration/
            └── scheduleFlow.test.jsx    # End-to-end user flows
```

---

## 🚀 **PERFORMANCE OPTIMIZATION**

### **📦 Component Optimization**

#### **Memoization Strategies**
```javascript
// ✅ Memoize expensive calculations
const ScheduleSection = ({ clientId }) => {
  const { events } = useCalendarEvents(clientId)
  
  // Memoize expensive transformations
  const eventStats = useMemo(() => 
    calculateEventStatistics(events), [events]
  )
  
  const groupedEvents = useMemo(() =>
    groupEventsByDate(events), [events]
  )
  
  return (
    <div>
      <CalendarStats stats={eventStats} />
      <Calendar events={groupedEvents} />
    </div>
  )
}

// ✅ Memoize callback props
const CalendarWrapper = ({ onEventClick, onDateClick }) => {
  const memoizedEventClick = useCallback((event) => {
    onEventClick?.(event)
  }, [onEventClick])
  
  const memoizedDateClick = useCallback((dateInfo) => {
    onDateClick?.(dateInfo.date, dateInfo)
  }, [onDateClick])
  
  return (
    <FullCalendar
      onEventClick={memoizedEventClick}
      onDateClick={memoizedDateClick}
    />
  )
}
```

#### **Lazy Loading**
```javascript
// ✅ Lazy load heavy components
const EventDetailModal = lazy(() => 
  import('./modals/EventDetailModal.jsx')
)

const ExportModal = lazy(() =>
  import('./modals/ExportModal.jsx')
)

const ScheduleSection = () => {
  return (
    <div>
      <Suspense fallback={<LoadingSpinner />}>
        {showEventModal && (
          <EventDetailModal {...modalProps} />
        )}
      </Suspense>
    </div>
  )
}
```

### **🔄 Data Optimization**

#### **Efficient API Calls**
```javascript
// ✅ Optimize data fetching
const useCalendarEvents = (clientId, options = {}) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Debounce rapid calls
  const debouncedLoadEvents = useMemo(() =>
    debounce(async (id, opts) => {
      setLoading(true)
      try {
        const data = await scheduleApi.getSchedule(id, opts)
        setEvents(data)
      } finally {
        setLoading(false)
      }
    }, 300), []
  )
  
  // Cache frequently accessed data
  const cachedEvents = useMemo(() => {
    return events.map(event => ({
      ...event,
      formattedDate: formatDate(event.scheduled_at),
      statusColor: getStatusColor(event.status)
    }))
  }, [events])
  
  return { events: cachedEvents, loading, debouncedLoadEvents }
}
```

#### **State Optimization**
```javascript
// ✅ Minimize re-renders
const useScheduleState = () => {
  // Split state to minimize re-renders
  const [events, setEvents] = useState([])
  const [uiState, setUIState] = useState({
    selectedEvent: null,
    showModal: false,
    loading: false
  })
  
  // Use reducers for complex state
  const [calendarState, dispatch] = useReducer(calendarReducer, {
    currentDate: new Date(),
    currentView: 'dayGridMonth',
    filters: {}
  })
  
  return {
    events,
    setEvents,
    uiState,
    setUIState,
    calendarState,
    dispatch
  }
}
```

---

## 🔧 **DEBUGGING & TROUBLESHOOTING**

### **🐛 Common Issues & Solutions**

#### **1. Import Path Issues**
```bash
# Problem: Module not found errors
Error: Cannot resolve '@src/features/schedule/components'

# Solution: Check path aliases in vite.config.ts
resolve: {
  alias: {
    '@src': path.resolve(__dirname, 'src')
  }
}

# Verify barrel exports exist
ls src/features/schedule/components/index.ts
```

#### **2. TypeScript Errors**
```typescript
// Problem: Type not found
Error: Cannot find type 'ScheduleItem'

// Solution: Check type imports
import type { ScheduleItem } from '@src/features/schedule'

// Verify type exports in barrel
// src/features/schedule/models/index.ts
export * from './schedule.types'
```

#### **3. Hook Dependencies**
```javascript
// Problem: Infinite re-renders
// Caused by missing dependencies

// ❌ BAD: Missing dependencies
useEffect(() => {
  loadEvents(clientId, filters)
}, []) // Missing clientId, filters

// ✅ GOOD: Complete dependencies
useEffect(() => {
  loadEvents(clientId, filters)
}, [clientId, filters]) // Include all dependencies

// ✅ GOOD: Use useCallback for stable references
const loadEvents = useCallback(async () => {
  // Load logic
}, [clientId, filters])

useEffect(() => {
  loadEvents()
}, [loadEvents])
```

#### **4. Calendar Rendering Issues**
```javascript
// Problem: Calendar not displaying events
// Check data transformation

// ✅ Verify FullCalendar event format
const transformToFullCalendarEvents = (scheduleItems) => {
  return scheduleItems.map(item => ({
    id: item.id,
    title: item.title,
    start: new Date(item.scheduled_at),  // Must be Date object
    end: new Date(item.scheduled_at),    // Must be Date object
    allDay: false,
    extendedProps: {
      originalData: item,
      status: item.status,
      channel: item.channel
    }
  }))
}
```

### **🔍 Debugging Tools**

#### **Development Helpers**
```javascript
// Add debugging utilities to development builds
if (process.env.NODE_ENV === 'development') {
  window.__SCHEDULE_DEBUG__ = {
    events: () => console.log('Current events:', events),
    state: () => console.log('Hook state:', { loading, error }),
    api: scheduleApi
  }
}

// Use React Developer Tools profiler
// Wrap components with profiler in development
const ProfiledScheduleSection = process.env.NODE_ENV === 'development' 
  ? React.memo(ScheduleSection) 
  : ScheduleSection
```

#### **Error Boundaries**
```jsx
// Add error boundaries for better error handling
const ScheduleErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<ScheduleErrorFallback />}
      onError={(error, errorInfo) => {
        console.error('Schedule module error:', error, errorInfo)
        // Send to error reporting service
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Usage
<ScheduleErrorBoundary>
  <ScheduleSection clientId={clientId} />
</ScheduleErrorBoundary>
```

---

## 📋 **MAINTENANCE PROCEDURES**

### **🔄 Regular Maintenance Tasks**

#### **Weekly Code Health Checks**
```bash
# Check for unused imports
npx unimport --scan src/features/schedule/

# Check TypeScript coverage
npx typescript-coverage-report --project ./tsconfig.json

# Run schedule-specific tests
npm test -- --testPathPattern=schedule

# Check bundle impact
npm run build:analyze
```

#### **Monthly Architecture Review**
```bash
# Review component dependencies
npx madge --circular --extensions js,jsx,ts,tsx src/features/schedule/

# Check for architectural violations
npm run lint:architecture

# Review performance metrics
npm run lighthouse:schedule
```

### **🚀 Update Procedures**

#### **Updating Dependencies**
```bash
# Update schedule-specific dependencies
npm update @fullcalendar/react @fullcalendar/daygrid

# Test schedule functionality after updates
npm run test:schedule

# Visual regression testing
npm run test:visual:schedule
```

#### **API Changes**
```javascript
// When backend API changes, update service layer
// 1. Update types in schedule.types.ts
// 2. Update API calls in schedule.js
// 3. Update component integrations
// 4. Add backward compatibility if needed

// Example: Adding new field to ScheduleItem
export interface ScheduleItem {
  // Existing fields...
  newField?: string  // Optional for backward compatibility
}

// Update API service
export const createScheduleItem = async (clientId, itemData) => {
  const payload = {
    ...itemData,
    // Handle new field conditionally
    ...(itemData.newField && { new_field: itemData.newField })
  }
  
  return await apiFetch(`/api/clients/${clientId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
```

---

## 🎯 **BEST PRACTICES SUMMARY**

### **✅ DO's**

#### **Architecture**
- ✅ Keep components within appropriate subdirectories
- ✅ Use barrel exports for clean imports
- ✅ Maintain clear separation between UI and logic
- ✅ Follow TypeScript-first development approach

#### **Component Design**
- ✅ Make components composable and reusable
- ✅ Use proper prop interfaces with TypeScript
- ✅ Implement proper error handling and loading states
- ✅ Memoize expensive calculations and callbacks

#### **State Management**
- ✅ Use custom hooks for complex state logic
- ✅ Keep state as close to consumers as possible
- ✅ Use proper dependency arrays in useEffect
- ✅ Implement optimistic updates for better UX

#### **Performance**
- ✅ Lazy load heavy components
- ✅ Debounce expensive operations
- ✅ Use React.memo for pure components
- ✅ Optimize re-renders with proper key props

### **❌ DON'Ts**

#### **Architecture**
- ❌ Don't import from other feature modules directly
- ❌ Don't put components in wrong subdirectories
- ❌ Don't expose internal implementation details
- ❌ Don't mix business logic with UI components

#### **Development**
- ❌ Don't use `any` type in TypeScript
- ❌ Don't create circular dependencies
- ❌ Don't ignore ESLint warnings
- ❌ Don't skip proper error handling

#### **Performance**
- ❌ Don't create objects/functions in render
- ❌ Don't use array indices as keys
- ❌ Don't forget to cleanup side effects
- ❌ Don't ignore React DevTools warnings

---

## 🎉 **CONCLUSION**

The Schedule module represents the **gold standard** for feature module development in our application. By following these guidelines, developers can:

### **🚀 Achieve Excellence**
- **Consistent Architecture**: All schedule-related code follows proven patterns
- **Type Safety**: Complete TypeScript integration prevents runtime errors
- **Performance**: Optimized components and state management
- **Maintainability**: Clear structure makes changes and debugging easier

### **📈 Enable Growth**
- **Scalable Patterns**: Template for other feature modules
- **Team Productivity**: Clear guidelines reduce onboarding time
- **Code Quality**: Enforced best practices maintain high standards
- **Future-Ready**: Architecture supports long-term evolution

### **🎯 Next Steps**
1. **Apply Guidelines**: Use this guide for all schedule module development
2. **Share Knowledge**: Train team members on these patterns
3. **Continuous Improvement**: Update guidelines based on learnings
4. **Template Migration**: Apply patterns to other feature modules

The Schedule module migration success demonstrates that **well-architected, maintainable frontend code is achievable**. These guidelines ensure that success continues and scales across our entire application.

---

**Guidelines Version**: 1.0  
**Last Updated**: September 6, 2025  
**Next Review**: October 6, 2025  
**Maintained By**: Frontend Architecture Team