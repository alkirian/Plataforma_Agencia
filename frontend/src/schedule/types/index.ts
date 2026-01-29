// Schedule and Task Types (canonical EN values)

export type TaskState =
  | 'planned'
  | 'pending'
  | 'in-design'
  | 'in-review'
  | 'waiting-approval'
  | 'approved'
  | 'needs-changes'
  | 'ready-to-publish'
  | 'published'
  | 'completed'
  | 'paused'
  | 'cancelled'

export type SocialChannel =
  | 'IG'
  | 'FB'
  | 'TW'
  | 'LI'
  | 'TK'
  | 'YT'
  | 'TikTok'
  | 'LinkedIn'
  | 'WhatsApp'

export type Priority = 'baja' | 'media' | 'alta' | 'urgente'

export type CalendarView =
  | 'dayGridMonth'
  | 'timeGridWeek'
  | 'timeGridDay'
  | 'listWeek'
  | 'listMonth'

// FullCalendar Event
export interface FullCalendarEvent {
  id: string
  title: string
  start: Date | string
  end?: Date | string
  allDay?: boolean
  extendedProps?: Record<string, any>
  resource?: any
  status?: TaskState
}

// Schedule Forms
export interface ScheduleFormData {
  title: string
  date: string
  time: string
  copy?: string
  channel: SocialChannel
  status: TaskState
  priority?: Priority
}

export interface QuickTaskFormData {
  title: string
  date: string
  time: string
  copy?: string
  channel: SocialChannel
  status: TaskState
}

// Loading States
export interface LoadingStates {
  loading: boolean
  creating: boolean
  updating: boolean
  deleting: boolean
  moving?: boolean
}

// Schedule Item (main entity)
export interface ScheduleItem {
  id: string
  title: string
  copy?: string
  channel: SocialChannel
  status: TaskState
  priority?: Priority
  scheduled_at: string
  client_id: string
  created_at: string
  updated_at: string
}

// Constants arrays for type guards - exported as values
export const TASK_STATES_KEYS = [
  'planned',
  'pending',
  'in-design',
  'in-review',
  'waiting-approval',
  'approved',
  'needs-changes',
  'ready-to-publish',
  'published',
  'completed',
  'paused',
  'cancelled',
] as const

export const SOCIAL_CHANNELS_KEYS = [
  'IG',
  'FB',
  'TW',
  'LI',
  'TK',
  'YT',
  'TikTok',
  'LinkedIn',
  'WhatsApp',
] as const

export const PRIORITY_KEYS = ['baja', 'media', 'alta', 'urgente'] as const

export const CALENDAR_VIEW_KEYS = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'listWeek',
  'listMonth',
] as const

// Default values
export const DEFAULT_SCHEDULE_FORM_DATA: ScheduleFormData = {
  title: '',
  date: '',
  time: '09:00',
  copy: '',
  channel: 'IG',
  status: 'pending',
  priority: 'media',
}

export const DEFAULT_QUICK_TASK_DATA: QuickTaskFormData = {
  title: '',
  date: '',
  time: '09:00',
  copy: '',
  channel: 'IG',
  status: 'pending',
}

export const DEFAULT_LOADING_STATES: LoadingStates = {
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  moving: false,
}

// Type guards
export const isTaskState = (value: string): value is TaskState => {
  return (TASK_STATES_KEYS as readonly string[]).includes(value)
}

export const isSocialChannel = (value: string): value is SocialChannel => {
  return (SOCIAL_CHANNELS_KEYS as readonly string[]).includes(value)
}

export const isPriority = (value: string): value is Priority => {
  return (PRIORITY_KEYS as readonly string[]).includes(value)
}

export const isCalendarView = (value: string): value is CalendarView => {
  return (CALENDAR_VIEW_KEYS as readonly string[]).includes(value)
}

// Utility types
export type ScheduleItemWithoutDates = Omit<ScheduleItem, 'created_at' | 'updated_at'>
export type ScheduleItemPreview = Pick<
  ScheduleItem,
  'id' | 'title' | 'status' | 'scheduled_at' | 'channel'
>
export type ScheduleItemSummary = Pick<
  ScheduleItem,
  'id' | 'title' | 'status' | 'channel' | 'priority'
>

// Event handlers
export type ScheduleEventHandler = () => void
export type ScheduleEventHandlerWithEvent = (event: FullCalendarEvent) => void
export type ScheduleAsyncHandler = () => Promise<void>
export type ScheduleAsyncHandlerWithPayload<P> = (payload: P) => Promise<void>

// API Payload types
export interface CreateScheduleItemPayload {
  title: string
  description?: string
  copy?: string
  scheduled_at?: string
  status?: TaskState
  priority?: Priority
  channel?: SocialChannel
}

export interface UpdateScheduleItemPayload {
  title?: string
  description?: string
  copy?: string
  scheduled_at?: string
  status?: TaskState
  priority?: Priority
  channel?: SocialChannel
}

// API Response types
export interface ScheduleAPIResponse {
  data: ScheduleItem[]
  success: boolean
  message?: string
}

export interface SingleScheduleAPIResponse {
  data: ScheduleItem
  success: boolean
  message?: string
}

// Task State Configuration Types
export interface TaskStateConfig {
  color: string
  bg: string
  name: string
  description: string
  group?: StateGroup
  icon?: string
}

export type StateGroup = 'planning' | 'design' | 'review' | 'publishing' | 'completed' | 'inactive'

export interface TaskStateTransitions {
  [key: string]: TaskState[]
}
