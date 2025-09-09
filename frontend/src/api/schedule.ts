// src/api/schedule.ts
import { apiFetch } from './apiFetch.js'
import type {
  ScheduleItem,
  CreateScheduleItemPayload,
  UpdateScheduleItemPayload,
  ScheduleAPIResponse,
  SingleScheduleAPIResponse,
  TaskState,
  Priority,
  SocialChannel,
} from '../schedule/models'

interface RawSchedulePayload {
  title?: string
  description?: string
  copy?: string
  scheduled_at?: string | Date
  status?: string
  priority?: string
  channel?: string
  [key: string]: any
}

// Normaliza/limpia el payload según el esquema del backend
const normalizeSchedulePayload = (
  raw: RawSchedulePayload = {}
): Partial<CreateScheduleItemPayload> => {
  const out: Partial<CreateScheduleItemPayload> = {}

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
    else out.description = undefined
  } else if (typeof raw.description === 'string') {
    const d = raw.description.trim()
    if (d) out.description = d
    else out.description = undefined
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
    out.status = allowed.has(s) ? (s as TaskState) : 'pendiente'
  }

  // Prioridad: mapear a valores permitidos por el schema
  if (typeof raw.priority === 'string') {
    const p = raw.priority.trim()
    const priorityMap: Record<string, Priority> = {
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
      URGENT: 'urgent',
      Urgent: 'urgent',
      urgent: 'urgent',
    }
    out.priority =
      priorityMap[p] ||
      (['low', 'medium', 'high', 'urgent'].includes(p as Priority) ? (p as Priority) : 'medium')
  }

  // Canal (opcional, máx 50)
  if (typeof raw.channel === 'string') {
    const channelMap: Record<string, SocialChannel> = {
      IG: 'IG',
      Instagram: 'IG',
      FB: 'FB',
      Facebook: 'FB',
      TikTok: 'TikTok',
      LinkedIn: 'LinkedIn',
      WhatsApp: 'WhatsApp',
    }
    out.channel = channelMap[raw.channel] || (raw.channel.slice(0, 50) as SocialChannel)
  }

  // Ignorar otras claves no soportadas por el schema
  return out
}

// Normaliza la respuesta del backend a un array consistente
const toArray = (resp: any): ScheduleItem[] => {
  if (Array.isArray(resp)) return resp as ScheduleItem[]
  if (Array.isArray(resp?.data)) return resp.data as ScheduleItem[]
  if (Array.isArray(resp?.data?.items)) return resp.data.items as ScheduleItem[]
  if (Array.isArray(resp?.items)) return resp.items as ScheduleItem[]
  if (Array.isArray(resp?.records)) return resp.records as ScheduleItem[]
  return []
}

/**
 * Obtiene los ítems del cronograma para un cliente específico.
 * @param clientId - El UUID del cliente.
 * @returns La lista de ítems del cronograma.
 */
export const getSchedule = async (clientId: string): Promise<ScheduleItem[]> => {
  const resp = await apiFetch(`/clients/${clientId}/schedule`)
  return toArray(resp)
}

/**
 * Crea un nuevo ítem en el cronograma.
 * @param clientId - El UUID del cliente.
 * @param itemData - Los datos del nuevo ítem.
 * @returns El ítem recién creado.
 */
export const createScheduleItem = async (
  clientId: string,
  itemData: CreateScheduleItemPayload
): Promise<ScheduleItem> => {
  const payload = normalizeSchedulePayload(itemData)
  const resp = await apiFetch(`/clients/${clientId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return (resp?.data ?? resp) as ScheduleItem
}

/**
 * Obtiene un ítem específico del cronograma.
 * @param clientId - El UUID del cliente.
 * @param itemId - El ID del ítem del cronograma.
 * @returns Los datos del ítem.
 */
export const getScheduleItem = async (clientId: string, itemId: string): Promise<ScheduleItem> => {
  const resp = await apiFetch(`/clients/${clientId}/schedule/${itemId}`)
  return (resp?.data ?? resp) as ScheduleItem
}

/**
 * Actualiza un ítem del cronograma.
 * @param clientId - El UUID del cliente.
 * @param itemId - El ID del ítem del cronograma.
 * @param updateData - Los datos a actualizar.
 * @returns El ítem actualizado.
 */
export const updateScheduleItem = async (
  clientId: string,
  itemId: string,
  updateData: UpdateScheduleItemPayload
): Promise<ScheduleItem> => {
  const payload = normalizeSchedulePayload(updateData)
  const resp = await apiFetch(`/clients/${clientId}/schedule/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return (resp?.data ?? resp) as ScheduleItem
}

/**
 * Elimina un ítem del cronograma.
 * @param clientId - El UUID del cliente.
 * @param itemId - El ID del ítem del cronograma.
 * @returns Confirmación de eliminación.
 */
export const deleteScheduleItem = async (
  clientId: string,
  itemId: string
): Promise<{ success: boolean }> => {
  const resp = await apiFetch(`/clients/${clientId}/schedule/${itemId}`, {
    method: 'DELETE',
  })
  return (resp?.data ?? resp ?? { success: true }) as { success: boolean }
}
