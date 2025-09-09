import { apiClient } from './api-client'
import type { ApiResponse } from '../types/api.types'

/**
 * Type-safe API functions for agency management
 */

export interface AgencyData {
  name: string
  description?: string
}

export interface AgencyUpdateData {
  name?: string
  description?: string
  [key: string]: any
}

export interface Agency {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  [key: string]: any
}

export const agenciesApi = {
  /**
   * Get the current user's agency
   */
  async getMyAgency(): Promise<ApiResponse<Agency>> {
    try {
      if (import.meta.env.DEV) {
        console.log('🔍 Calling /agencies/my-agency...')
      }

      const response = await apiClient.get<ApiResponse<Agency>>('/agencies/my-agency')

      if (import.meta.env.DEV) {
        console.log('✅ getMyAgency response:', response)
      }

      return response
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('❌ getMyAgency error:', error)
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          stack: error.stack,
        })
      }
      throw new Error(`Error fetching user agency: ${error.message}`)
    }
  },

  /**
   * Create a new agency
   */
  async createAgency(agencyData: AgencyData): Promise<ApiResponse<Agency>> {
    try {
      const response = await apiClient.post<ApiResponse<Agency>>('/agencies', agencyData)
      return response
    } catch (error: any) {
      throw new Error(`Error creating agency: ${error.message}`)
    }
  },

  /**
   * Update an agency
   */
  async updateAgency(agencyId: string, updateData: AgencyUpdateData): Promise<ApiResponse<Agency>> {
    try {
      const response = await apiClient.put<ApiResponse<Agency>>(`/agencies/${agencyId}`, updateData)
      return response
    } catch (error: any) {
      throw new Error(`Error updating agency: ${error.message}`)
    }
  },

  /**
   * Get agency by ID
   */
  async getAgencyById(agencyId: string): Promise<ApiResponse<Agency>> {
    try {
      const response = await apiClient.get<ApiResponse<Agency>>(`/agencies/${agencyId}`)
      return response
    } catch (error: any) {
      throw new Error(`Error fetching agency: ${error.message}`)
    }
  },
}

// Legacy exports for backward compatibility
export const getMyAgency = agenciesApi.getMyAgency
export const createAgency = agenciesApi.createAgency
export const updateAgency = agenciesApi.updateAgency
export const getAgencyById = agenciesApi.getAgencyById
