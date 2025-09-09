// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client
        Insert: ClientInsert
        Update: ClientUpdate
      }
      documents: {
        Row: Document
        Insert: DocumentInsert
        Update: DocumentUpdate
      }
      context_sources: {
        Row: ContextSource
        Insert: ContextSourceInsert
        Update: ContextSourceUpdate
      }
      tasks: {
        Row: Task
        Insert: TaskInsert
        Update: TaskUpdate
      }
      agencies: {
        Row: Agency
        Insert: AgencyInsert
        Update: AgencyUpdate
      }
      agency_members: {
        Row: AgencyMember
        Insert: AgencyMemberInsert
        Update: AgencyMemberUpdate
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      task_status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
      task_priority: 'low' | 'medium' | 'high' | 'urgent'
      context_source_type: 'document' | 'url' | 'manual' | 'note'
      document_ai_status: 'pending' | 'processing' | 'completed' | 'error'
      member_role: 'owner' | 'admin' | 'member'
    }
  }
}

// Row Types (what comes from the database)
export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  industry: string | null
  notes: string | null
  avatar_url: string | null
  agency_id: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  client_id: string
  agency_id: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  ai_status: Database['public']['Enums']['document_ai_status']
  ai_summary: string | null
  ai_metadata: Record<string, unknown> | null
  folder_path: string | null
  created_at: string
  updated_at: string
}

export interface ContextSource {
  id: string
  agency_id: string
  client_id: string | null
  type: Database['public']['Enums']['context_source_type']
  title: string
  content: string
  metadata: Record<string, unknown> | null
  url: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  agency_id: string
  client_id: string | null
  title: string
  description: string | null
  status: Database['public']['Enums']['task_status']
  priority: Database['public']['Enums']['task_priority']
  due_date: string | null
  completed_at: string | null
  created_by: string
  assigned_to: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface Agency {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  settings: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface AgencyMember {
  id: string
  agency_id: string
  user_id: string
  role: Database['public']['Enums']['member_role']
  invited_at: string | null
  joined_at: string | null
  created_at: string
}

// Insert Types (for creating new records)
export type ClientInsert = Omit<Client, 'id' | 'created_at' | 'updated_at'>
export type DocumentInsert = Omit<Document, 'id' | 'created_at' | 'updated_at'>
export type ContextSourceInsert = Omit<ContextSource, 'id' | 'created_at' | 'updated_at'>
export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at'>
export type AgencyInsert = Omit<Agency, 'id' | 'created_at' | 'updated_at'>
export type AgencyMemberInsert = Omit<AgencyMember, 'id' | 'created_at'>

// Update Types (for partial updates)
export type ClientUpdate = Partial<Omit<Client, 'id' | 'created_at'>>
export type DocumentUpdate = Partial<Omit<Document, 'id' | 'created_at'>>
export type ContextSourceUpdate = Partial<Omit<ContextSource, 'id' | 'created_at'>>
export type TaskUpdate = Partial<Omit<Task, 'id' | 'created_at'>>
export type AgencyUpdate = Partial<Omit<Agency, 'id' | 'created_at'>>
export type AgencyMemberUpdate = Partial<Omit<AgencyMember, 'id' | 'created_at'>>

// Supabase Storage Types
export interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: {
    eTag: string
    size: number
    mimetype: string
    cacheControl: string
    lastModified: string
    contentLength: number
    httpStatusCode: number
  }
}

export interface StorageError {
  error: string
  message: string
  statusCode: string
}

// Supabase Auth Types
export interface AuthUser {
  id: string
  email: string
  phone?: string
  user_metadata: Record<string, unknown>
  app_metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
  token_type: string
  user: AuthUser
}

// RLS Policy Types
export interface RLSContext {
  user_id: string
  agency_id?: string
  role?: Database['public']['Enums']['member_role']
}
