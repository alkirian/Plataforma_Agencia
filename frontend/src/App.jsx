// src/App.jsx

import { useState, useEffect, Suspense, lazy } from 'react'
import { useTheme } from '@shared/hooks/useTheme'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { Onboarding } from '@components/Onboarding.jsx'
import { MainLayout } from '@shared/components/layout/MainLayout.tsx'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'
import './App.css'

// Lazy loading de páginas para mejor performance
const WelcomePage = lazy(() =>
  import('@auth/pages/WelcomePage.tsx').then(module => ({ default: module.WelcomePage }))
)
const DashboardPage = lazy(() =>
  import('./dashboard/DashboardPage.jsx').then(module => ({ default: module.DashboardPage }))
)
const ClientDetailPage = lazy(() =>
  import('@pages/ClientDetailPage.jsx').then(module => ({ default: module.ClientDetailPage }))
)
const ClientCreatePage = lazy(() =>
  import('@pages/ClientCreatePage.jsx').then(module => ({ default: module.ClientCreatePage }))
)
const SettingsPage = lazy(() =>
  import('@pages/SettingsPage.jsx').then(module => ({ default: module.SettingsPage }))
)
const InviteAcceptPage = lazy(() =>
  import('@pages/InviteAcceptPage.jsx').then(module => ({ default: module.InviteAcceptPage }))
)

// Componente de loading
const PageLoader = () => (
  <div className='min-h-screen flex items-center justify-center'>
    <LoadingSpinner size='lg' variant='primary' />
  </div>
)

// Componente para la lógica de la aplicación principal post-autenticación
const MainApp = ({ session, profile }) => {
  // ✅ CORRECCIÓN #2: Añadimos una guarda para asegurarnos que la sesión no es nula.
  if (!session) {
    return <Navigate to='/' /> // O mostrar un loader
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/welcome'
  }

  return (
    <BrowserRouter>
      <MainLayout userEmail={session.user.email} onLogout={handleLogout} profile={profile}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path='/dashboard' element={<DashboardPage />} />
            <Route path='/clients/new' element={<ClientCreatePage />} />
            <Route path='/clients/:id' element={<ClientDetailPage />} />
            <Route path='/settings' element={<SettingsPage />} />
            <Route path='*' element={<Navigate to='/dashboard' />} />
          </Routes>
        </Suspense>
      </MainLayout>
    </BrowserRouter>
  )
}

// Componente Raíz que gestiona el estado de autenticación
function App() {
  // Inicializa tema oscuro por defecto
  useTheme('dark')
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // ✅ CORRECCIÓN #1: Movemos getProfile aquí, fuera y antes del useEffect.
  const getProfile = async user => {
    try {
      // No necesitamos setLoading(true) aquí, ya se maneja fuera.
      const { data, error } = await supabase.from('profiles').select(`*`).eq('id', user.id)
      if (error) throw error
      setProfile(data?.[0] || null)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al obtener el perfil:', error)
      }
    } finally {
      // El loading general se desactiva en el handleSession
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleSession = session => {
      setSession(session)
      if (session) {
        localStorage.setItem('authToken', session.access_token)
        getProfile(session.user) // Ahora 'getProfile' es visible aquí
      } else {
        localStorage.removeItem('authToken')
        setProfile(null)
        setLoading(false)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session)
    })

    const onProfileRefresh = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) getProfile(session.user)
      })
    }
    window.addEventListener('profile:refresh', onProfileRefresh)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('profile:refresh', onProfileRefresh)
    }
  }, [])

  // Public invite route short-circuit to ensure access without auth gating
  const path = window.location.pathname
  if (path.startsWith('/invite/')) {
    return (
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path='/invite/:token' element={<InviteAcceptPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    )
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner size='lg' variant='primary' />
      </div>
    )
  }
  if (!session) {
    return (
      <Suspense fallback={<PageLoader />}>
        <WelcomePage />
      </Suspense>
    )
  }
  if (!profile) {
    return <Onboarding session={session} onProfileComplete={() => getProfile(session.user)} />
  }

  return <MainApp session={session} profile={profile} />
}

export default App
