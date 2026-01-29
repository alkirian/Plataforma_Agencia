// src/App.jsx

import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import { Onboarding } from '@components/Onboarding.jsx'
import { MainLayout } from '@shared/components/layout/MainLayout.tsx'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'
import { DocumentsDesignShowcase } from './documents/components/DocumentsDesignShowcase.jsx'
import { ProductiveDashboard } from './documents/components/ProductiveDashboard.jsx'
import { CalendarViewProvider } from '@shared/contexts/CalendarViewContext'
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
const CronogramaPage = lazy(() =>
  import('@pages/CronogramaPage.jsx').then(module => ({ default: module.CronogramaPage }))
)
const ClienteWorkspaceLayout = lazy(() =>
  import('./layouts/ClienteWorkspaceLayout.jsx').then(module => ({
    default: module.ClienteWorkspaceLayout,
  }))
)
const ScheduleRedirectPage = lazy(() =>
  import('@pages/ScheduleRedirectPage.jsx').then(module => ({
    default: module.ScheduleRedirectPage,
  }))
)
const Documents = lazy(() =>
  import('./documents/Documents.jsx').then(module => ({ default: module.Documents }))
)

// Componente de loading
const PageLoader = () => (
  <div className='min-h-screen flex items-center justify-center'>
    <LoadingSpinner size='lg' variant='primary' />
  </div>
)

// Componente para la lógica de la aplicación principal post-autenticación
const MainApp = ({ session, profile }) => {
  // ✅ CORRECCIÓN #2: Añadimos una guarda para aseg urarnos que la sesión no es nula.
  if (!session) {
    return <Navigate to='/' /> // O mostrar un loader
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/welcome'
  }

  return (
    <CalendarViewProvider>
      <BrowserRouter>
        <AppRoutes session={session} profile={profile} onLogout={handleLogout} />
      </BrowserRouter>
    </CalendarViewProvider>
  )
}

// Componente interno para acceder a useLocation
const AppRoutes = ({ session, profile, onLogout }) => {
  const location = useLocation()
  // Detectar rutas de workspace (calendario y documentos)
  const isCalendarRoute =
    location.pathname.includes('/cronograma') ||
    location.pathname.includes('/calendario') ||
    location.pathname.includes('/documentos') ||
    (location.pathname.startsWith('/clients/') && !location.pathname.includes('/new'))

  return (
    <MainLayout
      userEmail={session.user.email}
      onLogout={onLogout}
      profile={profile}
      fullHeight={isCalendarRoute}
    >
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path='/dashboard' element={<DashboardPage />} />
          <Route path='/clients/new' element={<ClientCreatePage />} />
          {/* Nested routes para workspace de cliente */}
          <Route path='/clients/:id' element={<ClienteWorkspaceLayout />}>
            <Route index element={<Navigate to='calendario' replace />} />
            <Route path='calendario' element={<CronogramaPage />} />
            <Route path='documentos' element={<Documents />} />
          </Route>
          <Route path='/schedule' element={<ScheduleRedirectPage />} />
          <Route path='/settings' element={<SettingsPage />} />
          <Route path='/design/documents' element={<DocumentsDesignShowcase />} />
          <Route path='/design/dashboard' element={<ProductiveDashboard />} />
          <Route path='*' element={<Navigate to='/dashboard' />} />
        </Routes>
      </Suspense>
    </MainLayout>
  )
}

// Componente Raíz que gestiona el estado de autenticación
function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // ✅ CORRECCIÓN #1: Movemos getProfile aquí, fuera y antes del useEffect.
  const getProfile = async user => {
    try {
      // No necesitamos setLoading(true) aquí, ya se maneja fuera.
      const { data, error } = await supabase.from('profiles').select(`*`).eq('id', user.id)
      if (error) throw error
      const userProfile = data?.[0] || null
      setProfile(userProfile)
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

  // Si el usuario tiene profile pero no tiene agencia, mostrar Onboarding para crear/unirse a una
  if (!profile.agency_id) {
    return (
      <Onboarding
        session={session}
        onProfileComplete={() => getProfile(session.user)}
        existingProfile={profile}
      />
    )
  }

  return <MainApp session={session} profile={profile} />
}

export default App
