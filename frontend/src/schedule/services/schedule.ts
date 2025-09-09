// src/schedule/services/schedule.ts
import { apiClient } from '@api/api-client'
import type { TaskState } from '@schedule/types'
import { toExternalTaskState } from '@constants'

interface RawSchedulePayload {
  title?: string
  copy?: string
  description?: string
  scheduled_at?: Date | string
  status?: string
  priority?: string
  channel?: string
  [key: string]: any
}

interface NormalizedSchedulePayload {
  title?: string
  description?: string | null
  scheduled_at?: string
  status?: string
  priority?: string
  channel?: string
}

interface ScheduleItem {
  id: string
  title: string
  description?: string | null
  scheduled_at: string
  status: TaskState
  priority?: string
  channel?: string
}

interface ApiResponse<T = any> {
  data?: T
  items?: T
  records?: T
}

// Normaliza/limpia el payload según el esquema del backend
const normalizeSchedulePayload = (raw: RawSchedulePayload = {}): NormalizedSchedulePayload => {
  const out: NormalizedSchedulePayload = {}

  // Título
  if (typeof raw.title === 'string') {
    const t = raw.title.trim()
    if (t) out.title = t
  }

  // Descripción/copy (opcionales)
  // TEMPORAL: mapear copy a description hasta que se ejecute la migración
  if (typeof raw.copy === 'string') {
    const c = raw.copy.trim()
    if (c) out.description = c
    else out.description = null
  } else if (typeof raw.description === 'string') {
    const d = raw.description.trim()
    if (d) out.description = d
    else out.description = null
  }

  // Fecha/hora ISO 8601
  if (raw.scheduled_at instanceof Date) {
    out.scheduled_at = raw.scheduled_at.toISOString()
  } else if (typeof raw.scheduled_at === 'string') {
    // Aceptar strings ya ISO o convertibles a Date
    const dt = new Date(raw.scheduled_at)
    out.scheduled_at = isNaN(dt.getTime()) ? raw.scheduled_at : dt.toISOString()
  }

  // Estado: aceptar valores conocidos (en español, también variantes en minúsculas)
  if (typeof raw.status === 'string') {
    const s = raw.status.trim()
    // Mantener en español/minúsculas si viene así; el backend normaliza a mayúsculas donde aplica
    const allowed = new Set([
      'planificacion',
      'pendiente',
      'en-diseño',
      'en-revision',
      'esperando-aprobacion',
      'aprobado',
      'requiere-cambios',
      'listo-publicar',
      'publicado',
      'completado',
      'pausado',
      'cancelado',
    ])
    out.status = (allowed.has(s) ? s : 'pendiente') as TaskState
  }

  // Asegurar estado en formato externo (ES ASCII)
  if (typeof raw.status === 'string') {
    const external = toExternalTaskState(raw.status.trim())
    if (external) out.status = external
  }

  // Prioridad: mapear a valores permitidos por el schema
  if (typeof raw.priority === 'string') {
    const p = raw.priority.trim()
    const map: Record<string, string> = {
      // inglés a minúsculas
      LOW: 'low',
      Low: 'low',
      low: 'low',
      MEDIUM: 'medium',
      Medium: 'medium',
      medium: 'medium',
      HIGH: 'high',
      High: 'high',
      high: 'high',
      URGENT: 'urgente',
      Urgent: 'urgente',
      urgent: 'urgente',
      // español
      baja: 'baja',
      Baja: 'Baja',
      media: 'media',
      Media: 'Media',
      alta: 'alta',
      Alta: 'Alta',
      urgente: 'urgente',
      Urgente: 'Urgente',
    }
    out.priority =
      map[p] ||
      ([
        'low',
        'medium',
        'high',
        'baja',
        'media',
        'alta',
        'urgente',
        'Baja',
        'Media',
        'Alta',
        'Urgente',
      ].includes(p)
        ? p
        : 'medium')
  }

  // Canal (opcional, máx 50)
  if (typeof raw.channel === 'string') {
    out.channel = raw.channel.slice(0, 50)
  }

  // Ignorar otras claves no soportadas por el schema
  return out
}

// Normaliza la respuesta del backend a un array consistente
const toArray = (resp: any): ScheduleItem[] => {
  if (Array.isArray(resp)) return resp
  if (Array.isArray(resp?.data)) return resp.data
  if (Array.isArray(resp?.data?.items)) return resp.data.items
  if (Array.isArray(resp?.items)) return resp.items
  if (Array.isArray(resp?.records)) return resp.records
  return []
}

/**
 * Obtiene los ítems del cronograma para un cliente específico.
 */
export const getSchedule = async (clientId: string): Promise<ScheduleItem[]> => {
  const resp = await apiClient.get(`/clients/${clientId}/schedule`)
  return toArray(resp)
}

/**
 * Crea un nuevo ítem en el cronograma.
 */
export const createScheduleItem = async (
  clientId: string,
  itemData: RawSchedulePayload
): Promise<ScheduleItem> => {
  const payload = normalizeSchedulePayload(itemData)
  const resp = await apiClient.post(`/clients/${clientId}/schedule`, payload)
  return resp?.data ?? resp
}

/**
 * Obtiene un ítem específico del cronograma.
 */
export const getScheduleItem = async (clientId: string, itemId: string): Promise<ScheduleItem> => {
  const resp = await apiClient.get(`/clients/${clientId}/schedule/${itemId}`)
  return resp?.data ?? resp
}

/**
 * Actualiza un ítem del cronograma.
 */
export const updateScheduleItem = async (
  clientId: string,
  itemId: string,
  updateData: Partial<RawSchedulePayload>
): Promise<ScheduleItem> => {
  const payload = normalizeSchedulePayload(updateData)
  const resp = await apiClient.put(`/clients/${clientId}/schedule/${itemId}`, payload)
  return resp?.data ?? resp
}

/**
 * Elimina un ítem del cronograma.
 */
export const deleteScheduleItem = async (
  clientId: string,
  itemId: string
): Promise<{ success: boolean }> => {
  const resp = await apiClient.delete(`/clients/${clientId}/schedule/${itemId}`)
  return resp?.data ?? resp ?? { success: true }
}
