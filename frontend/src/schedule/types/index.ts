// Schedule and Task Types
export type TaskState = 'pendiente' | 'aprobado' | 'publicado' | 'cancelado'
export type SocialChannel = 'IG' | 'FB' | 'TW' | 'LI' | 'TK' | 'YT'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'

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
export const TASK_STATES_KEYS = ['pendiente', 'aprobado', 'publicado', 'cancelado'] as const
export const SOCIAL_CHANNELS_KEYS = ['IG', 'FB', 'TW', 'LI', 'TK', 'YT'] as const
export const PRIORITY_KEYS = ['low', 'medium', 'high', 'urgent'] as const
export const CALENDAR_VIEW_KEYS = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'listWeek',
] as const

// Default values
export const DEFAULT_SCHEDULE_FORM_DATA: ScheduleFormData = {
  title: '',
  date: '',
  time: '09:00',
  copy: '',
  channel: 'IG',
  status: 'pendiente',
  priority: 'medium',
}

export const DEFAULT_QUICK_TASK_DATA: QuickTaskFormData = {
  title: '',
  date: '',
  time: '09:00',
  copy: '',
  channel: 'IG',
  status: 'pendiente',
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
  return TASK_STATES_KEYS.includes(value as TaskState)
}

export const isSocialChannel = (value: string): value is SocialChannel => {
  return SOCIAL_CHANNELS_KEYS.includes(value as SocialChannel)
}

export const isPriority = (value: string): value is Priority => {
  return PRIORITY_KEYS.includes(value as Priority)
}

export const isCalendarView = (value: string): value is CalendarView => {
  return CALENDAR_VIEW_KEYS.includes(value as CalendarView)
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
