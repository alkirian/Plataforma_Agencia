// src/api/agencies.js
import { apiFetch } from './apiFetch'

/**
 * API functions for agency management
 */

/**
 * Get the current user's agency
 * @returns {Promise<Object>} The user's agency data
 */
export const getMyAgency = async () => {
  try {
    console.log('🔍 Calling /agencies/my-agency...')
    const response = await apiFetch('/agencies/my-agency')
    console.log('✅ getMyAgency response:', response)
    return response
  } catch (error) {
    console.error('❌ getMyAgency error:', error)
    console.error('❌ Error details:', {
      message: error.message,
      status: error.status,
      stack: error.stack,
    })
    throw new Error(`Error fetching user agency: ${error.message}`)
  }
}

/**
 * Create a new agency
 * @param {Object} agencyData - The agency data
 * @param {string} agencyData.name - Agency name
 * @param {string} [agencyData.description] - Agency description
 * @returns {Promise<Object>} The created agency
 */
export const createAgency = async agencyData => {
  try {
    const response = await apiFetch('/agencies', {
      method: 'POST',
      body: JSON.stringify(agencyData),
    })
    return response
  } catch (error) {
    throw new Error(`Error creating agency: ${error.message}`)
  }
}

/**
 * Update an agency
 * @param {string} agencyId - Agency ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} The updated agency
 */
export const updateAgency = async (agencyId, updateData) => {
  try {
    const response = await apiFetch(`/agencies/${agencyId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
    return response
  } catch (error) {
    throw new Error(`Error updating agency: ${error.message}`)
  }
}

/**
 * Get agency by ID
 * @param {string} agencyId - Agency ID
 * @returns {Promise<Object>} The agency data
 */
export const getAgencyById = async agencyId => {
  try {
    const response = await apiFetch(`/agencies/${agencyId}`)
    return response
  } catch (error) {
    throw new Error(`Error fetching agency: ${error.message}`)
  }
}
