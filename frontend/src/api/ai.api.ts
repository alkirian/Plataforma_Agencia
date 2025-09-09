import { apiClient } from './api-client'
import type { ApiResponse } from '../types/api.types'

/**
 * Type-safe API functions for AI operations
 */

export interface IdeaPromptData {
  userPrompt?: string
  sessionId?: string
  previousIdeas?: any[]
  includeContext?: boolean
  [key: string]: any
}

export interface ChatData {
  userPrompt: string
  chatHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
  includeContext?: boolean
  [key: string]: any
}

export interface ChatHistoryParams {
  limit?: number
  before?: string
}

export interface IdeaListParams {
  month?: number
  year?: number
  sessionId?: string
}

export interface IdeaFeedbackValue {
  value: 'like' | 'dislike' | 'clear'
}

export const aiApi = {
  /**
   * Generate ideas using AI for a specific client
   */
  async generateIdeas(clientId: string, promptData: IdeaPromptData): Promise<ApiResponse<any>> {
    if (!clientId || clientId === 'undefined') {
      throw new Error('Client ID is required for idea generation')
    }

    const response = await apiClient.post<ApiResponse<any>>(
      `/clients/${clientId}/generate-ideas`,
      promptData
    )

    return response?.data ?? response
  },

  /**
   * Get conversational chat response with AI
   */
  async getChatResponse(clientId: string, chatData: ChatData): Promise<ApiResponse<any>> {
    if (!clientId || clientId === 'undefined') {
      throw new Error('Client ID is required for chat response')
    }

    const response = await apiClient.post<ApiResponse<any>>(`/clients/${clientId}/chat`, chatData)

    return response?.data ?? response
  },

  /**
   * List paginated chat history
   */
  async getChatHistory(
    clientId: string,
    params: ChatHistoryParams = {}
  ): Promise<ApiResponse<any>> {
    if (!clientId || clientId === 'undefined') {
      throw new Error('Client ID is required for chat history')
    }

    const searchParams = new URLSearchParams()
    if (params.limit) searchParams.set('limit', String(params.limit))
    if (params.before) searchParams.set('before', params.before)

    const queryString = searchParams.toString()
    const endpoint = `/clients/${clientId}/chat/history${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get<ApiResponse<any>>(endpoint)
    return response?.data ?? response
  },

  /**
   * Send like/dislike/clear feedback for a specific idea
   */
  async sendIdeaFeedback(
    clientId: string,
    ideaId: string,
    feedback: IdeaFeedbackValue
  ): Promise<ApiResponse<any>> {
    if (!clientId || clientId === 'undefined') {
      throw new Error('Client ID is required for idea feedback')
    }

    const response = await apiClient.post<ApiResponse<any>>(
      `/clients/${clientId}/ideas/${ideaId}/feedback`,
      feedback
    )

    return response?.data ?? response
  },

  /**
   * List persisted ideas (optional)
   */
  async listIdeas(clientId: string, params: IdeaListParams = {}): Promise<ApiResponse<any>> {
    if (!clientId || clientId === 'undefined') {
      throw new Error('Client ID is required for listing ideas')
    }

    const searchParams = new URLSearchParams()
    if (params.month) searchParams.set('month', String(params.month))
    if (params.year) searchParams.set('year', String(params.year))
    if (params.sessionId) searchParams.set('sessionId', params.sessionId)

    const queryString = searchParams.toString()
    const endpoint = `/clients/${clientId}/ideas${queryString ? `?${queryString}` : ''}`

    const response = await apiClient.get<ApiResponse<any>>(endpoint)
    return response?.data ?? response
  },
}

// Legacy exports for backward compatibility
export const generateIdeas = aiApi.generateIdeas
export const getChatResponse = aiApi.getChatResponse
export const getChatHistory = aiApi.getChatHistory
export const sendIdeaFeedback = aiApi.sendIdeaFeedback
export const listIdeas = aiApi.listIdeas

// Back-compat default export for code importing `api/ai` as a function
// Provides `generateIdeas` as the default export without breaking named exports
export default aiApi.generateIdeas
