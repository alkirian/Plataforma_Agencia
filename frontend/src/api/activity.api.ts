import { apiClient } from './api-client'
import type { ApiResponse } from '../types/api.types'

/**
 * Type-safe API functions for activity management
 */

export interface ActivityFeedOptions {
  limit?: number
}

export interface AgencyActivityFeedOptions {
  limit?: number
  cursor?: string
}

export interface ActivityItem {
  id: string
  type: string
  action: string
  description: string
  created_at: string
  client_id?: string
  user_id?: string
  metadata?: Record<string, any>
  [key: string]: any
}

export const activityApi = {
  /**
   * Get activity feed for a specific client
   */
  async getClientActivityFeed(
    clientId: string,
    options: ActivityFeedOptions = {}
  ): Promise<ApiResponse<ActivityItem[]>> {
    const { limit = 50 } = options

    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())

    const queryString = params.toString()
    const endpoint = `/clients/${clientId}/activity-feed${queryString ? '?' + queryString : ''}`

    return apiClient.get<ApiResponse<ActivityItem[]>>(endpoint)
  },

  /**
   * Get global activity feed for the current agency (dashboard)
   */
  async getAgencyActivityFeed(
    options: AgencyActivityFeedOptions = {}
  ): Promise<ApiResponse<ActivityItem[]>> {
    const { limit = 20, cursor } = options

    const params = new URLSearchParams()
    if (limit) params.append('limit', String(limit))
    if (cursor) params.append('cursor', cursor)

    const queryString = params.toString()
    const endpoint = `/activity-feed${queryString ? '?' + queryString : ''}`

    return apiClient.get<ApiResponse<ActivityItem[]>>(endpoint)
  },
}

// Legacy exports for backward compatibility
export const getClientActivityFeed = activityApi.getClientActivityFeed
export const getAgencyActivityFeed = activityApi.getAgencyActivityFeed
