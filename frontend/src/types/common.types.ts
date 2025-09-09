// Common utility types
export type UUID = string
export type ISO8601Date = string
export type UnixTimestamp = number

// Status types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T = unknown, E = Error> {
  data?: T
  error?: E
  loading: boolean
  success: boolean
}

// Event handler types
export type EventHandler<T = Event> = (event: T) => void
export type ChangeHandler<T = unknown> = (value: T) => void

// File types
export interface FileWithPreview extends File {
  preview?: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface FileUploadState {
  file: File
  progress: UploadProgress
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

// Search and filter types
export interface SearchParams {
  query: string
  filters?: Record<string, unknown>
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
}

// Theme types
export type Theme = 'light' | 'dark' | 'cyber'

export interface ThemeConfig {
  theme: Theme
  primaryColor: string
  accentColor: string
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  fontFamily: string
}

// Notification types - Basic toast notifications
export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  actions?: Array<{
    label: string
    handler: () => void
  }>
}

// Task reminder notification types - For useNotifications hook
export type TaskReminderType = 'overdue' | 'due-today' | 'due-tomorrow' | 'upcoming'
export type TaskReminderPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'pendiente' | 'en_progreso' | 'revision' | 'publicado' | 'completado'

export interface TaskData {
  id: string
  title: string
  scheduled_at: string
  status: TaskStatus
  description?: string
  content?: unknown
}

export interface TaskReminder {
  id: string
  type: TaskReminderType
  priority: TaskReminderPriority
  title: string
  message: string
  taskId: string
  clientName: string
  task: TaskData
  createdAt: Date
  isRead?: boolean
}

export interface NotificationStats {
  total: number
  overdue: number
  dueToday: number
  upcoming: number
}

export interface GroupedNotifications {
  high: TaskReminder[]
  medium: TaskReminder[]
  low: TaskReminder[]
}

export interface NotificationState {
  notifications: TaskReminder[]
  groupedNotifications: GroupedNotifications
  stats: NotificationStats
  isEnabled: boolean
}

export interface LocalStorageNotificationData {
  readNotifications: Set<string>
  toastShownNotifications: Set<string>
  deletedNotifications: Set<string>
}

// Calendar and Schedule types
export type TaskStateKey =
  | 'planificacion'
  | 'pendiente'
  | 'en-diseño'
  | 'en-revision'
  | 'esperando-aprobacion'
  | 'aprobado'
  | 'requiere-cambios'
  | 'listo-publicar'
  | 'publicado'
  | 'completado'
  | 'pausado'
  | 'cancelado'

export interface TaskStateConfig {
  color: string
  bg: string
  name: string
  description: string
  icon: string
}

export interface ScheduleItem {
  id: string
  title: string
  scheduled_at: string
  status: TaskStateKey
  description?: string
  channel?: string
  priority?: string
  content?: unknown
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  extendedProps: {
    status: TaskStateKey
    description?: string
    channel?: string
    priority?: string
    originalData: ScheduleItem
    isTemporary?: boolean
  }
}

export interface CalendarEventStats {
  total: number
  byStatus: Partial<Record<TaskStateKey, number>>
}

export interface UseCalendarEventsReturn {
  events: CalendarEvent[]
  loading: boolean
  error: string | null
  loadEvents: () => Promise<void>
  createEvent: (eventData: Partial<ScheduleItem>) => Promise<ScheduleItem>
  updateEvent: (eventId: string, updateData: Partial<ScheduleItem>) => Promise<ScheduleItem>
  deleteEvent: (eventId: string) => Promise<void>
  moveEvent: (eventId: string, newStart: Date, newEnd?: Date) => Promise<void>
  eventStats: CalendarEventStats
  refresh: () => Promise<void>
}

// Permission types
export type Permission =
  | 'clients:read'
  | 'clients:write'
  | 'clients:delete'
  | 'documents:read'
  | 'documents:write'
  | 'documents:delete'
  | 'tasks:read'
  | 'tasks:write'
  | 'tasks:delete'
  | 'agency:admin'

export interface UserPermissions {
  permissions: Permission[]
  role: 'owner' | 'admin' | 'member'
}

// Validation types
export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface FormErrors {
  [key: string]: string | ValidationError[]
}

// API key types for external integrations
export interface APIKeyConfig {
  openai?: string
  anthropic?: string
  google?: string
}

// Feature flags
export interface FeatureFlags {
  aiAssistant: boolean
  documentAI: boolean
  advancedAnalytics: boolean
  integrations: boolean
  customBranding: boolean
}

// Analytics types
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, unknown>
  timestamp?: ISO8601Date
  userId?: string
  sessionId?: string
}

// Keyboard shortcut types
export interface KeyboardShortcut {
  key: string
  modifiers: Array<'ctrl' | 'cmd' | 'alt' | 'shift'>
  description: string
  handler: () => void
  disabled?: boolean
}

// Generic utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type Required<T, K extends keyof T> = Omit<T, K> & Pick<T, K>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Environment types
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  VITE_API_URL: string
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
  VITE_APP_VERSION: string
}
