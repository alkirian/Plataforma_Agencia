// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { apiFetch, setActiveAgencyIdForAPI, getActiveAgencyIdFromAPI } from '../api/apiFetch'
import { getMyAgency } from '../api/agencies'
import logger from '@shared/utils/logger'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(undefined) // undefined = loading, null = no session
  const [memberships, setMemberships] = useState([])
  const [activeAgencyId, setActiveAgencyId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authResolved, setAuthResolved] = useState(false)

  // Inicializar autenticación
  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      try {
        // Obtener sesión actual
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          logger.error('Error getting session', { error: error.message })
        }

        if (isMounted) {
          setSession(currentSession)

          if (currentSession?.user) {
            setUser(currentSession.user)
            await loadUserData(currentSession.user)
          }

          setLoading(false)
          setAuthResolved(true)
        }
      } catch (error) {
        logger.error('Error initializing auth', { error: error.message })
        if (isMounted) {
          setLoading(false)
          setAuthResolved(true)
        }
      }
    }

    initAuth()

    // Listener para cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      logger.debug('Auth state change', { event, hasSession: !!newSession })

      if (!isMounted) return

      setSession(newSession)

      if (newSession?.user) {
        setUser(newSession.user)
        await loadUserData(newSession.user)
      } else {
        setUser(null)
        setProfile(null)
        setMemberships([])
        setActiveAgencyId(null)
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  // Cargar datos del usuario
  const loadUserData = async user => {
    try {
      // Cargar agencia activa
      const storedAgencyId = getActiveAgencyIdFromAPI()
      if (storedAgencyId) {
        setActiveAgencyId(storedAgencyId)
      }

      // Obtener memberships del usuario
      try {
        const response = await getMyAgency()
        if (response && response.data) {
          setMemberships([response.data])

          if (!storedAgencyId) {
            setActiveAgencyId(response.data.id)
            setActiveAgencyIdForAPI(response.data.id)
          }
        }
      } catch (error) {
        logger.debug('No agency found for user', { error: error.message })
        setMemberships([])
      }
    } catch (error) {
      logger.error('Error loading user data', {
        error: error.message,
        userId: user.id,
      })
    } finally {
      // IMPORTANTE: Siempre marcar como resuelto, incluso si hay errores
      setLoading(false)
      setAuthResolved(true)
    }
  }

  // Función de logout
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        logger.error('Error during logout', { error: error.message })
        throw error
      }

      // Limpiar estado local
      setUser(null)
      setProfile(null)
      setSession(null)
      setMemberships([])
      setActiveAgencyId(null)
      setActiveAgencyIdForAPI(null)

      logger.info('User logged out successfully')
    } catch (error) {
      logger.error('Logout failed', { error: error.message })
      throw error
    }
  }

  // Cambiar agencia activa
  const switchAgency = agencyId => {
    setActiveAgencyId(agencyId)
    setActiveAgencyIdForAPI(agencyId)
    logger.info('Switched active agency', { agencyId })
  }

  const value = {
    user,
    profile,
    session,
    memberships,
    activeAgencyId,
    loading,
    authResolved,
    logout,
    switchAgency,
    // Helper computed properties
    isAuthenticated: !!session,
    hasAgency: memberships.length > 0,
    userData: profile || user?.user_metadata || {},
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
