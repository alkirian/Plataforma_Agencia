import { apiClient } from './api-client'
import type { ApiResponse, PaginatedResponse, QueryParams } from '../types/api.types'
import type {
  Client,
  ClientInsert,
  ClientUpdate,
  ClientWithStats,
  ClientListItem,
  ClientDetailData,
  ClientSearchFilters,
} from '../types/client.types'

/**
 * Type-safe API functions for client management
 */

export const clientsApi = {
  /**
   * Get all clients with optional filtering and pagination
   */
  async getClients(
    params?: QueryParams & ClientSearchFilters
  ): Promise<PaginatedResponse<ClientListItem>> {
    const searchParams = new URLSearchParams()

    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.industry) searchParams.append('industry', params.industry)
    if (params?.hasDocuments !== undefined)
      searchParams.append('hasDocuments', params.hasDocuments.toString())
    if (params?.hasTasks !== undefined) searchParams.append('hasTasks', params.hasTasks.toString())
    if (params?.createdAfter) searchParams.append('createdAfter', params.createdAfter)
    if (params?.createdBefore) searchParams.append('createdBefore', params.createdBefore)

    const query = searchParams.toString()
    const endpoint = query ? `/clients?${query}` : '/clients'

    return apiClient.get<PaginatedResponse<ClientListItem>>(endpoint)
  },

  /**
   * Get client by ID with detailed information
   */
  async getClientById(clientId: string): Promise<ApiResponse<ClientDetailData>> {
    return apiClient.get<ApiResponse<ClientDetailData>>(`/clients/${clientId}`)
  },

  /**
   * Create new client
   */
  async createClient(clientData: ClientInsert): Promise<ApiResponse<Client>> {
    return apiClient.post<ApiResponse<Client>>('/clients', clientData)
  },

  /**
   * Update client by ID
   */
  async updateClient(clientId: string, updates: ClientUpdate): Promise<ApiResponse<Client>> {
    return apiClient.patch<ApiResponse<Client>>(`/clients/${clientId}`, updates)
  },

  /**
   * Delete client by ID
   */
  async deleteClient(clientId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/clients/${clientId}`)
  },

  /**
   * Get client statistics and analytics
   */
  async getClientStats(clientId: string): Promise<ApiResponse<ClientWithStats>> {
    return apiClient.get<ApiResponse<ClientWithStats>>(`/clients/${clientId}/stats`)
  },

  /**
   * Upload client avatar
   */
  async uploadAvatar(clientId: string, file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const formData = new FormData()
    formData.append('avatar', file)

    return apiClient.request<ApiResponse<{ avatar_url: string }>>(`/clients/${clientId}/avatar`, {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type to let browser set boundary for FormData
        'Content-Type': undefined,
      } as any,
    })
  },

  /**
   * Search clients by query
   */
  async searchClients(query: string, limit = 10): Promise<ApiResponse<ClientListItem[]>> {
    const searchParams = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    })

    return apiClient.get<ApiResponse<ClientListItem[]>>(`/clients/search?${searchParams}`)
  },

  /**
   * Get client activity feed
   */
  async getClientActivity(clientId: string, limit = 20): Promise<ApiResponse<any[]>> {
    return apiClient.get<ApiResponse<any[]>>(`/clients/${clientId}/activity?limit=${limit}`)
  },

  /**
   * Update client metadata (website and social_links)
   */
  async updateClientMeta(
    clientId: string,
    { website, social_links }: { website?: string; social_links?: Record<string, string> }
  ): Promise<ApiResponse<Client>> {
    return apiClient.patch<ApiResponse<Client>>(`/clients/${clientId}`, { website, social_links })
  },

  /**
   * Client contacts management
   */
  contacts: {
    /**
     * List client contacts
     */
    async list(clientId: string): Promise<ApiResponse<any[]>> {
      return apiClient.get<ApiResponse<any[]>>(`/clients/${clientId}/contacts`)
    },

    /**
     * Upsert client contacts
     */
    async upsert(clientId: string, contacts: any[]): Promise<ApiResponse<any[]>> {
      return apiClient.post<ApiResponse<any[]>>(`/clients/${clientId}/contacts`, { contacts })
    },

    /**
     * Delete client contact
     */
    async delete(clientId: string, contactId: string): Promise<ApiResponse<void>> {
      return apiClient.delete<ApiResponse<void>>(`/clients/${clientId}/contacts/${contactId}`)
    },
  },

  /**
   * Client preferences management
   */
  preferences: {
    /**
     * Get all client preferences (client_id -> { color })
     */
    async getAll(): Promise<ApiResponse<Record<string, any>>> {
      return apiClient.get<ApiResponse<Record<string, any>>>('/clients/preferences')
    },

    /**
     * Set client preference (e.g. color)
     */
    async set(clientId: string, preference: any): Promise<ApiResponse<any>> {
      return apiClient.put<ApiResponse<any>>(`/clients/${clientId}/preferences`, preference)
    },

    /**
     * Delete client preference (reset to default)
     */
    async delete(clientId: string): Promise<ApiResponse<void>> {
      return apiClient.delete<ApiResponse<void>>(`/clients/${clientId}/preferences`)
    },
  },
}

// Legacy exports for backward compatibility during migration
export const getClients = clientsApi.getClients
export const getClientById = clientsApi.getClientById
export const createClient = clientsApi.createClient
export const updateClient = clientsApi.updateClient
export const deleteClient = clientsApi.deleteClient

// Additional legacy exports from clients.js
export const updateClientMeta = clientsApi.updateClientMeta
export const listClientContacts = clientsApi.contacts.list
export const upsertClientContacts = clientsApi.contacts.upsert
export const deleteClientContact = clientsApi.contacts.delete
export const getClientPreferences = clientsApi.preferences.getAll
export const setClientPreference = clientsApi.preferences.set
export const deleteClientPreference = clientsApi.preferences.delete
