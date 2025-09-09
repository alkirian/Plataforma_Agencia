import type { Client, ClientInsert, ClientUpdate } from './supabase.types'

// Re-export the base types from supabase.types
export type { Client, ClientInsert, ClientUpdate }

// Extended client types for the frontend
export interface ClientWithStats extends Client {
  document_count: number
  task_count: number
  recent_activity?: ISO8601Date
  total_revenue?: number
}

export interface ClientFormData extends Omit<ClientInsert, 'agency_id'> {
  avatar?: File
}

export interface ClientUpdateFormData extends Partial<ClientFormData> {
  id: string
}

export interface ClientListItem {
  id: string
  name: string
  company: string | null
  industry: string | null
  email: string | null
  avatar_url: string | null
  document_count: number
  task_count: number
  last_activity: string | null
  created_at: string
}

export interface ClientDetailData extends ClientWithStats {
  recent_documents: Array<{
    id: string
    file_name: string
    created_at: string
  }>
  recent_tasks: Array<{
    id: string
    title: string
    status: string
    created_at: string
  }>
}

export interface ClientSearchFilters {
  industry?: string
  hasDocuments?: boolean
  hasTasks?: boolean
  createdAfter?: string
  createdBefore?: string
}

export interface ClientSortOptions {
  field: 'name' | 'company' | 'created_at' | 'document_count' | 'task_count'
  direction: 'asc' | 'desc'
}

// Client avatar handling
export interface ClientAvatarUpload {
  file: File
  preview: string
}

// Client industry options
export const CLIENT_INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Real Estate',
  'Hospitality',
  'Transportation',
  'Entertainment',
  'Non-profit',
  'Government',
  'Other',
] as const

export type ClientIndustry = (typeof CLIENT_INDUSTRIES)[number]

// Import from common types
import type { ISO8601Date } from './common.types'
