// Core Schedule Types and Interfaces
// ===================================

import type { ReactNode } from 'react'

/**
 * Task State Configuration
 */
export interface TaskStateConfig {
  color: string
  bg: string
  name: string
  description: string
  icon: string
}

/**
 * Task State Types - Union Type for type safety
 */
export type TaskState =
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

/**
 * Social Media Channels
 */
export type SocialChannel = 'IG' | 'FB' | 'TikTok' | 'LinkedIn' | 'WhatsApp'

/**
 * Priority Levels
 */
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

/**
 * Calendar View Types
 */
export type CalendarView =
  | 'dayGridMonth'
  | 'dayGridWeek'
  | 'timeGridWeek'
  | 'timeGridDay'
  | 'listMonth'
  | 'listWeek'

/**
 * State Group Categories
 */
export type StateGroup = 'planeacion' | 'ejecucion' | 'aprobacion' | 'finalizacion' | 'especiales'

/**
 * Base Schedule Item (from database/API)
 */
export interface ScheduleItem {
  id: string
  title: string
  description?: string
  copy?: string
  status: TaskState
  channel: SocialChannel
  priority?: Priority
  scheduled_at: string // ISO date string
  created_at: string
  updated_at: string
  client_id: string
  user_id?: string

  // Optional metadata
  hashtags?: string[]
  mentions?: string[]
  media_urls?: string[]
  engagement_stats?: {
    likes?: number
    comments?: number
    shares?: number
  }
}

/**
 * Schedule Item Creation Payload
 */
export interface CreateScheduleItemPayload {
  title: string
  description?: string
  copy?: string
  status: TaskState
  channel: SocialChannel
  priority?: Priority
  scheduled_at: string // ISO date string
  hashtags?: string[]
  mentions?: string[]
}

/**
 * Schedule Item Update Payload
 */
export interface UpdateScheduleItemPayload extends Partial<CreateScheduleItemPayload> {
  id?: never // Prevent ID updates
}

/**
 * FullCalendar Event (transformed from ScheduleItem)
 */
export interface FullCalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  extendedProps: {
    status: TaskState
    description?: string
    copy?: string
    channel: SocialChannel
    priority?: Priority
    originalData: ScheduleItem
    isTemporary?: boolean
  }
  // FullCalendar specific props
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  classNames?: string[]
}

/**
 * Calendar Event Statistics
 */
export interface EventStatistics {
  total: number
  byStatus: Record<TaskState, number>
  byChannel: Record<SocialChannel, number>
  byPriority: Record<Priority, number>
}

/**
 * Calendar Date Click Info
 */
export interface DateClickInfo {
  date: Date
  dateStr: string
  allDay: boolean
  jsEvent: MouseEvent
  view: {
    type: CalendarView
    title: string
  }
  clickCoords?: {
    x: number
    y: number
  }
}

/**
 * Calendar Event Click Info
 */
export interface EventClickInfo {
  event: FullCalendarEvent
  jsEvent: MouseEvent
  view: {
    type: CalendarView
    title: string
  }
}

/**
 * Calendar Event Drop Info (drag & drop)
 */
export interface EventDropInfo {
  event: FullCalendarEvent
  oldEvent: FullCalendarEvent
  delta: {
    years: number
    months: number
    days: number
    hours: number
    minutes: number
    seconds: number
  }
  revert: () => void
  jsEvent: MouseEvent
  view: {
    type: CalendarView
    title: string
  }
}

/**
 * Quick Task Form Data
 */
export interface QuickTaskFormData {
  title: string
  date: string // YYYY-MM-DD format
  time: string // HH:mm format
  status: TaskState
  copy?: string
  channel: SocialChannel
}

/**
 * Schedule Form Data (full form)
 */
export interface ScheduleFormData extends QuickTaskFormData {
  description?: string
  priority?: Priority
  hashtags?: string[]
  mentions?: string[]
}

/**
 * Task State Transitions
 */
export type TaskStateTransitions = {
  [key in TaskState]: TaskState[]
}

/**
 * Calendar Navigation
 */
export interface CalendarNavigation {
  currentDate: Date
  currentView: CalendarView
  onDateChange: (date: Date) => void
  onViewChange: (view: CalendarView) => void
  onNavigate: (date: Date) => void
}

/**
 * API Response Types
 */
export interface ScheduleAPIResponse {
  data: ScheduleItem[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface SingleScheduleAPIResponse {
  data: ScheduleItem
}

/**
 * Error Types
 */
export interface ScheduleError {
  message: string
  code?: string
  field?: string
}

/**
 * Loading States
 */
export interface LoadingStates {
  loading: boolean
  creating: boolean
  updating: boolean
  deleting: boolean
  moving: boolean
}

/**
 * Popover Position
 */
export interface PopoverPosition {
  x: number
  y: number
}

/**
 * Click Coordinates
 */
export interface ClickCoordinates {
  x: number
  y: number
  clientX: number
  clientY: number
}

/**
 * Calendar Dimensions
 */
export interface CalendarDimensions {
  width: number
  height: number
  aspectRatio?: number
}

/**
 * Export Options
 */
export interface CalendarExportOptions {
  format: 'ics' | 'csv' | 'json'
  dateRange: {
    start: Date
    end: Date
  }
  includeFields: Array<keyof ScheduleItem>
  filename?: string
}

/**
 * Search Filters
 */
export interface ScheduleFilters {
  search?: string
  status?: TaskState[]
  channel?: SocialChannel[]
  priority?: Priority[]
  dateRange?: {
    start: Date
    end: Date
  }
}

/**
 * Calendar Options
 */
export interface CalendarOptions {
  height: string | number
  aspectRatio?: number
  headerToolbar?: object
  buttonText?: Record<string, string>
  locale?: string
  firstDay?: number
  weekends?: boolean
  businessHours?: object
  eventDisplay?: string
  displayEventTime?: boolean
  displayEventEnd?: boolean
  eventTimeFormat?: object
  slotDuration?: string
  slotMinTime?: string
  slotMaxTime?: string
}

/**
 * Component Props Types
 */
export interface ScheduleSectionProps {
  clientId: string
}

export interface FullCalendarWrapperProps {
  events: FullCalendarEvent[]
  currentDate: Date
  currentView: CalendarView
  loading: boolean
  onDateChange: (start: Date, end?: Date, view?: CalendarView) => void
  onViewChange: (viewType: CalendarView) => void
  onEventClick: (event: FullCalendarEvent) => void
  onDateClick: (date: Date, clickInfo?: DateClickInfo) => void
  onEventDrop: (event: FullCalendarEvent) => void
  height: string | number
  clientName?: string
}

export interface TaskPopoverProps {
  isOpen: boolean
  onClose: () => void
  clickCoords: ClickCoordinates | null
  selectedDate: Date | null
  clientId: string
  onCreateTask: (taskData: CreateScheduleItemPayload) => Promise<void>
}

export interface TaskFormProps {
  initialData?: Partial<ScheduleFormData>
  onSubmit: (data: ScheduleFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  submitText?: string
}

export interface MiniMonthProps {
  currentDate: Date
  onNavigate: (date: Date) => void
  events: FullCalendarEvent[]
}

export interface MonthAgendaProps {
  events: FullCalendarEvent[]
  currentDate: Date
  loading: boolean
  onEventClick: (event: FullCalendarEvent) => void
}

/**
 * Hook Return Types
 */
export interface UseCalendarEventsReturn {
  // State
  events: FullCalendarEvent[]
  loading: boolean
  error: string | null

  // Actions
  loadEvents: () => Promise<void>
  createEvent: (eventData: CreateScheduleItemPayload) => Promise<ScheduleItem>
  updateEvent: (eventId: string, updateData: UpdateScheduleItemPayload) => Promise<ScheduleItem>
  deleteEvent: (eventId: string) => Promise<void>
  moveEvent: (eventId: string, newStart: Date, newEnd?: Date) => Promise<void>

  // Utilities
  eventStats: EventStatistics
  refresh: () => Promise<void>
}

export interface UseTaskDraftsReturn {
  drafts: Record<string, Partial<ScheduleFormData>>
  saveDraft: (key: string, data: Partial<ScheduleFormData>) => void
  loadDraft: (key: string) => Partial<ScheduleFormData> | null
  clearDraft: (key: string) => void
  clearAllDrafts: () => void
}

/**
 * Utility Types
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Theme Types for Calendar Styling
 */
export interface CalendarTheme {
  primary: string
  secondary: string
  success: string
  warning: string
  error: string
  background: string
  surface: string
  text: {
    primary: string
    secondary: string
    muted: string
  }
  border: {
    primary: string
    secondary: string
    subtle: string
  }
}

/**
 * Animation Types
 */
export interface AnimationConfig {
  duration: number
  ease: string
  delay?: number
}

export interface MotionVariants {
  initial: object
  animate: object
  exit?: object
  transition?: AnimationConfig
}
