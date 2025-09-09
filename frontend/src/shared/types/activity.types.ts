/**
 * Activity Feed TypeScript interfaces
 * Used by ActivityFeed component and related hooks
 */

export interface ActivityAuthor {
  id: string
  full_name: string
  email?: string
  avatar?: string
}

export interface ActivityDetails {
  file_name?: string
  title?: string
  description?: string
  [key: string]: any
}

export type ActivityType =
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DELETED'
  | 'SCHEDULE_ITEM_CREATED'
  | 'CLIENT_CREATED'
  | 'CLIENT_UPDATED'

export interface ActivityEvent {
  id: string
  action_type: ActivityType
  client_id: string
  client_name?: string
  author?: ActivityAuthor
  details: string | ActivityDetails
  created_at: string
  updated_at: string
}

export interface ActivityFeedProps {
  limit?: number
}

export interface UseActivityFeedReturn {
  items: ActivityEvent[]
  isLoading: boolean
  error: Error | null
  hasNextPage: boolean
  fetchNextPage: () => void
  isFetchingNextPage: boolean
}

export interface ActivityTypeConfig {
  icon: React.ComponentType<{ className?: string }>
  text: (actor: string, client: string, meta: ActivityDetails) => string
}
