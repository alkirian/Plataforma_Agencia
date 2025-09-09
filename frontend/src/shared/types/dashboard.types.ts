/**
 * Dashboard-specific TypeScript interfaces
 * Used by dashboard components and features
 */

import type { Client, Contact } from './client.types'

// Dashboard component props
export interface DashboardProps {
  clients?: Client[]
  isLoading?: boolean
  error?: string | null
}

// Welcome empty state props
export interface WelcomeEmptyStateProps {
  onCreateClient: () => void
  userName?: string
}

// Activity feed types
export interface ActivityItem {
  id: string
  type:
    | 'client_created'
    | 'client_updated'
    | 'contact_added'
    | 'document_uploaded'
    | 'meeting_scheduled'
  title: string
  description?: string
  timestamp: string
  clientId?: string
  clientName?: string
  userId?: string
  userName?: string
  metadata?: Record<string, any>
}

export interface DashboardActivityFeedProps {
  activities: ActivityItem[]
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
}

// TODO: These modal types were removed as part of modal cleanup
// Client creation now uses dedicated page route instead of modal

// Contacts editor types
export interface ContactsEditorProps {
  value: Contact[]
  onChange: (contacts: Contact[]) => void
  maxContacts?: number
  allowEmpty?: boolean
}

// Social links section types
export interface SocialLinksConfig {
  platform: string
  label: string
  placeholder: string
  icon?: string
  baseUrl?: string
}

export interface SocialLinksSectionProps {
  register: any // react-hook-form register function
  setValue: any // react-hook-form setValue function
  watch?: any // react-hook-form watch function
  socialLinks?: Record<string, string>
}

// Step indicator types
export interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  steps?: Array<{ label: string; description?: string }>
  variant?: 'default' | 'compact'
}

// Hook return types for dashboard functionality
// (Client creation hook types removed with modal cleanup)
