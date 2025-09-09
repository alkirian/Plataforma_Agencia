/**
 * Base TypeScript interfaces for Client entity and related types
 * Used across the dashboard components
 */

export interface Contact {
  id?: string
  name?: string
  email?: string
  phone?: string
  position?: string
  notes?: string
}

export interface SocialLinks {
  [platform: string]: string
}

export interface Client {
  id: string
  name: string
  industry?: string | null
  website?: string | null
  social_links?: SocialLinks | null
  meta?: Record<string, any> | null
  created_at: string
  updated_at: string
  contacts?: Contact[]
}

export interface ClientCreatePayload {
  name: string
  industry?: string | null
}

export interface ClientUpdatePayload {
  name?: string
  industry?: string | null
  website?: string | null
  social_links?: SocialLinks | null
  meta?: Record<string, any> | null
}

export interface ClientMetaUpdatePayload {
  website?: string | null
  social_links?: SocialLinks | null
  meta?: Record<string, any> | null
}

// API Response types
export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

export interface ClientsListResponse extends ApiResponse<Client[]> {}
export interface ClientResponse extends ApiResponse<Client> {}

// Form types
export interface ClientFormData {
  name: string
  industry: string
  website: string
  socials: SocialLinks
  contacts: Contact[]
}

// Industry constants
export const INDUSTRIES = [
  'Tecnología',
  'Retail',
  'Servicios',
  'Salud',
  'Educación',
  'Finanzas',
  'Manufactura',
  'Construcción',
  'Agricultura',
  'Turismo',
  'Marketing',
  'Otro',
] as const

export type Industry = (typeof INDUSTRIES)[number]

// Form data interface for client creation
export interface ClientCreationFormData {
  name: string
  industry: string
  website: string
  socials: SocialLinks
  contacts: Contact[]
}
