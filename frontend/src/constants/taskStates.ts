import type { TaskState } from '@schedule/types'

// Canonical domain (internal) uses ASCII/English kebab-case
// UI labels (Spanish) live here; backend mapping uses ASCII Spanish codes

export interface TaskStateInfo {
  label: string // Spanish label for UI
  color: string
  bg: string
  externalCode: string // Spanish ASCII code used by backend/api
}

export const TASK_STATE_INFO: Record<TaskState, TaskStateInfo> = {
  planned: {
    label: 'Planificación',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)',
    externalCode: 'planificacion',
  },
  pending: {
    label: 'Pendiente',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    externalCode: 'pendiente',
  },
  'in-design': {
    label: 'En Diseño',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.1)',
    externalCode: 'en-diseno',
  },
  'in-review': {
    label: 'En Revisión',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)',
    externalCode: 'en-revision',
  },
  'waiting-approval': {
    label: 'Esperando Aprobación',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.1)',
    externalCode: 'esperando-aprobacion',
  },
  approved: {
    label: 'Aprobado',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    externalCode: 'aprobado',
  },
  'needs-changes': {
    label: 'Requiere Cambios',
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.1)',
    externalCode: 'requiere-cambios',
  },
  'ready-to-publish': {
    label: 'Listo para Publicar',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.1)',
    externalCode: 'listo-publicar',
  },
  published: {
    label: 'Publicado',
    color: '#047857',
    bg: 'rgba(4, 120, 87, 0.1)',
    externalCode: 'publicado',
  },
  completed: {
    label: 'Completado',
    color: '#065f46',
    bg: 'rgba(6, 95, 70, 0.1)',
    externalCode: 'completado',
  },
  paused: {
    label: 'Pausado',
    color: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.1)',
    externalCode: 'pausado',
  },
  cancelled: {
    label: 'Cancelado',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    externalCode: 'cancelado',
  },
}

export const TASK_STATE_ORDER: readonly TaskState[] = [
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

// Mapping helpers for API boundaries
export const toExternalTaskState = (state: string | undefined | null): string | undefined => {
  if (!state) return undefined
  const key = state.toLowerCase() as TaskState
  if (TASK_STATE_INFO[key]) return TASK_STATE_INFO[key].externalCode
  // Accept some Spanish legacy inputs
  const normalized = (state || '').toLowerCase()
  const legacyMap: Record<string, TaskState> = {
    planificacion: 'planned',
    pendiente: 'pending',
    'en-diseno': 'in-design',
    'en-diseño': 'in-design',
    'en-revision': 'in-review',
    'en-revisión': 'in-review',
    'esperando-aprobacion': 'waiting-approval',
    aprobado: 'approved',
    'requiere-cambios': 'needs-changes',
    'listo-publicar': 'ready-to-publish',
    publicado: 'published',
    completado: 'completed',
    pausado: 'paused',
    cancelado: 'cancelled',
  }
  const mapped = legacyMap[normalized]
  return mapped ? TASK_STATE_INFO[mapped].externalCode : undefined
}

export const fromExternalTaskState = (external: string | undefined | null): TaskState => {
  const normalized = (external || '').toLowerCase()
  const reverse = Object.entries(TASK_STATE_INFO).reduce<Record<string, TaskState>>(
    (acc, [k, v]) => {
      acc[v.externalCode] = k as TaskState
      return acc
    },
    {}
  )
  if (reverse[normalized]) return reverse[normalized]
  // Accept English inputs as pass-through
  if ((TASK_STATE_ORDER as readonly string[]).includes(normalized)) return normalized as TaskState
  return 'pending'
}

// Priorities (canonical EN, UI labels ES)
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export const PRIORITY_INFO: Record<Priority, { label: string }> = {
  low: { label: 'Baja' },
  medium: { label: 'Media' },
  high: { label: 'Alta' },
  urgent: { label: 'Urgente' },
}

// Re-exports suited for schedule module
export const TASK_STATES = TASK_STATE_INFO // legacy name compatibility
export type { TaskState }
