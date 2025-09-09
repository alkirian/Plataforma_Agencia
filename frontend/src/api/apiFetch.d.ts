// src/api/apiFetch.d.ts
export interface ApiFetchOptions extends RequestInit {
  headers?: Record<string, string>
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
}

export declare function apiFetch(endpoint: string, options?: ApiFetchOptions): Promise<any>

export declare function setActiveAgencyIdForAPI(agencyId: string | null): void
export declare function getActiveAgencyIdFromAPI(): string | null
