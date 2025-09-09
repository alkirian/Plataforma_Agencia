import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Building2, Users, Globe, Link2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { ContactsEditor } from '../components/clients/ContactsEditor'

import { getClients, createClient, updateClientMeta, upsertClientContacts } from '../api/clients'

const industries = [
  'Tecnología',
  'Retail',
  'Servicios',
  'Salud',
  'Educación',
  'Finanzas',
  'Manufactura',
  'Construcción',
  'Agricultura',
  'Turismo',
  'Marketing',
  'Otro',
]

/**
 * Unified Client Creation Page
 *
 * A single, beautiful form for creating clients with all fields visible at once
 * Features:
 * - Unified form layout with logical field grouping
 * - Enhanced visual design with better spacing and typography
 * - Comprehensive form validation and error handling
 * - Auto-save functionality to prevent data loss
 * - Mobile-optimized responsive design
 * - Full accessibility compliance with ARIA labels
 * - Professional visual hierarchy and modern aesthetics
 */
export const ClientCreatePage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [submitting, setSubmitting] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)

  // Form management
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      industry: '',
      website: '',
      socials: {},
      contacts: [],
    },
    mode: 'onChange',
  })

  // Fetch existing clients for name validation
  const { data: clientsResp } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  })

  const existingNames = React.useMemo(() => {
    return (clientsResp?.data || []).map(c => c.name?.toLowerCase().trim()).filter(Boolean)
  }, [clientsResp])

  const nameVal = watch('name')
  const nameExists = React.useMemo(() => {
    const n = String(nameVal || '')
      .toLowerCase()
      .trim()
    if (!n) return false
    return existingNames.includes(n)
  }, [existingNames, nameVal])

  // Auto-save functionality
  useEffect(() => {
    const formData = watch()
    if (!formData.name || nameExists) return

    const timeoutId = setTimeout(() => {
      setAutoSaving(true)
      // Simulate auto-save (could save to localStorage or draft API)
      localStorage.setItem('client-draft', JSON.stringify(formData))
      setTimeout(() => setAutoSaving(false), 500)
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [watch, nameExists])

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('client-draft')
    if (draft) {
      try {
        const data = JSON.parse(draft)
        reset(data)
      } catch (e) {
        console.warn('Could not load draft:', e)
      }
    }
  }, [reset])

  // Unified client creation mutation
  const createClientMutation = useMutation({
    mutationFn: async formData => {
      // Create the basic client first
      const clientResponse = await createClient({
        name: formData.name.trim(),
        industry: formData.industry || null,
      })

      const client = clientResponse?.data
      if (!client?.id) throw new Error('Failed to create client')

      // Add additional metadata if provided
      const website = normalizeUrl(formData.website) || null
      const socials = formData.socials || {}
      const normalizedSocials = Object.fromEntries(
        Object.entries(socials || {}).map(([k, v]) => [k, normalizeUrl(v)])
      )

      if (website || Object.keys(normalizedSocials).length > 0) {
        await updateClientMeta(client.id, {
          website,
          social_links: normalizedSocials,
        })
      }

      // Add contacts if provided
      const contacts = (formData.contacts || []).filter(c => c.name || c.email || c.phone)
      if (contacts.length) {
        await upsertClientContacts(client.id, contacts)
      }

      return client
    },
    onSuccess: client => {
      localStorage.removeItem('client-draft')
      toast.success('Cliente creado exitosamente')
      navigate(`/clients/${client.id}`)
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: error => {
      toast.error(error.message || 'Error al crear el cliente')
    },
  })

  // Unified form submission
  const handleFormSubmit = async data => {
    if (nameExists) {
      toast.error('Ya existe un cliente con ese nombre')
      return
    }

    setSubmitting(true)
    try {
      await createClientMutation.mutateAsync(data)
    } finally {
      setSubmitting(false)
    }
  }

  // URL normalization utility
  const normalizeUrl = val => {
    if (!val) return ''
    let v = String(val).trim()
    if (!v) return ''
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v
    return v
  }

  const canSubmit = () => {
    const name = String(watch('name') || '').trim()
    return name.length >= 2 && name.length <= 100 && !nameExists && !submitting
  }

  return (
    <div className='min-h-screen bg-[color:var(--color-app-bg)] py-6 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-4xl mx-auto'>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='mb-8'
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => navigate('/dashboard')}
                className='text-text-muted hover:text-text-primary'
                aria-label='Volver al dashboard'
              >
                <ArrowLeft size={18} />
                Volver
              </Button>

              <div>
                <h1 className='text-3xl font-bold text-text-primary'>Crear nuevo cliente</h1>
                <p className='text-text-muted mt-1'>Configura un nuevo cliente paso a paso</p>
              </div>
            </div>

            {autoSaving && (
              <div className='flex items-center gap-2 text-sm text-text-muted'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                Guardando borrador...
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <UnifiedClientForm
            register={register}
            setValue={setValue}
            watch={watch}
            handleSubmit={handleSubmit}
            onSubmit={handleFormSubmit}
            nameExists={nameExists}
            canSubmit={canSubmit()}
            submitting={submitting}
            errors={errors}
            navigate={navigate}
          />
        </motion.div>
      </div>
    </div>
  )
}

/**
 * Unified Client Creation Form
 *
 * A beautiful, single-page form with all client information fields
 * Features logical grouping, enhanced accessibility, and modern design
 */
const UnifiedClientForm = ({
  register,
  setValue,
  watch,
  handleSubmit,
  onSubmit,
  nameExists,
  canSubmit,
  submitting,
  errors,
  navigate,
}) => {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
      {/* Basic Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader className='pb-4 pt-6'>
            <CardTitle className='flex items-center gap-3'>
              <div className='p-2.5 bg-[color:var(--color-accent-blue)]/10 rounded-xl'>
                <Building2 className='w-6 h-6 text-[color:var(--color-accent-blue)]' />
              </div>
              <div>
                <h2 className='text-xl font-semibold text-text-primary'>Información básica</h2>
                <p className='text-sm text-text-muted mt-0.5'>Datos esenciales del cliente</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Client Name - Required Field */}
            <div className='space-y-3'>
              <label
                htmlFor='client-name'
                className='block text-sm font-semibold text-text-primary'
              >
                Nombre del cliente
                <span className='text-red-500 ml-1' aria-label='Campo requerido'>
                  *
                </span>
              </label>
              <Input
                id='client-name'
                type='text'
                placeholder='Ej. Acme Corporation, María García, Restaurante El Buen Sabor'
                className={`text-lg h-12 ${nameExists ? 'border-red-500 focus:border-red-500' : ''}`}
                {...register('name', {
                  required: 'El nombre del cliente es requerido',
                  minLength: { value: 2, message: 'El nombre debe tener al menos 2 caracteres' },
                  maxLength: { value: 100, message: 'El nombre no puede exceder 100 caracteres' },
                })}
                aria-describedby='name-help name-error'
                aria-invalid={nameExists || !!errors.name ? 'true' : 'false'}
              />
              {nameExists && (
                <div
                  id='name-error'
                  className='flex items-center gap-2 text-sm text-red-500'
                  role='alert'
                >
                  <span className='w-1.5 h-1.5 bg-red-500 rounded-full' />
                  Ya existe un cliente con ese nombre en tu agencia
                </div>
              )}
              {errors.name && (
                <div className='flex items-center gap-2 text-sm text-red-500' role='alert'>
                  <span className='w-1.5 h-1.5 bg-red-500 rounded-full' />
                  {errors.name.message}
                </div>
              )}
              <p id='name-help' className='text-sm text-text-muted'>
                Este nombre debe ser único dentro de tu agencia
              </p>
            </div>

            {/* Industry */}
            <div className='space-y-3'>
              <label
                htmlFor='client-industry'
                className='block text-sm font-semibold text-text-primary'
              >
                Industria o sector
                <span className='text-text-muted font-normal ml-2'>(opcional)</span>
              </label>
              <Input
                id='client-industry'
                list='industry-list'
                type='text'
                placeholder='Ej. Tecnología, Retail, Restauración, Servicios...'
                className='h-12'
                {...register('industry')}
                aria-describedby='industry-help'
              />
              <datalist id='industry-list'>
                {industries.map(industry => (
                  <option key={industry} value={industry} />
                ))}
              </datalist>
              <p id='industry-help' className='text-sm text-text-muted'>
                Ayuda a categorizar y personalizar nuestros servicios para este cliente
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Digital Presence Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader className='pb-4 pt-6'>
            <CardTitle className='flex items-center gap-3'>
              <div className='p-2.5 bg-[color:var(--color-accent-blue)]/10 rounded-xl'>
                <Globe className='w-6 h-6 text-[color:var(--color-accent-blue)]' />
              </div>
              <div>
                <h2 className='text-xl font-semibold text-text-primary'>Presencia digital</h2>
                <p className='text-sm text-text-muted mt-0.5'>Sitio web y redes sociales</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              {/* Website */}
              <div className='space-y-3'>
                <label
                  htmlFor='client-website'
                  className='flex items-center gap-2 text-sm font-semibold text-text-primary'
                >
                  <Link2 className='w-4 h-4' />
                  Sitio web
                  <span className='text-text-muted font-normal'>(opcional)</span>
                </label>
                <Input
                  id='client-website'
                  type='url'
                  placeholder='https://www.ejemplo.com'
                  className='h-11'
                  {...register('website')}
                  aria-describedby='website-help'
                />
                <p id='website-help' className='text-sm text-text-muted'>
                  Incluye https:// al inicio de la URL
                </p>
              </div>

              {/* Social Media Grid */}
              <div>
                <h3 className='text-base font-semibold text-text-primary mb-4 flex items-center gap-2'>
                  Redes sociales
                  <span className='text-text-muted text-sm font-normal'>(opcionales)</span>
                </h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {[
                    { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/company/...' },
                    { key: 'instagram', label: 'Instagram', placeholder: 'instagram.com/...' },
                    { key: 'facebook', label: 'Facebook', placeholder: 'facebook.com/...' },
                    { key: 'x', label: 'X (Twitter)', placeholder: 'x.com/...' },
                    { key: 'youtube', label: 'YouTube', placeholder: 'youtube.com/c/...' },
                    { key: 'tiktok', label: 'TikTok', placeholder: 'tiktok.com/@...' },
                  ].map(social => (
                    <div key={social.key} className='space-y-2'>
                      <label
                        htmlFor={`social-${social.key}`}
                        className='block text-xs font-medium text-text-primary capitalize'
                      >
                        {social.label}
                      </label>
                      <Input
                        id={`social-${social.key}`}
                        type='url'
                        placeholder={social.placeholder}
                        className='h-10 text-sm'
                        onChange={e => setValue(`socials.${social.key}`, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contacts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader className='pb-4 pt-6'>
            <CardTitle className='flex items-center gap-3'>
              <div className='p-2.5 bg-[color:var(--color-accent-blue)]/10 rounded-xl'>
                <Users className='w-6 h-6 text-[color:var(--color-accent-blue)]' />
              </div>
              <div>
                <h2 className='text-xl font-semibold text-text-primary'>Contactos</h2>
                <p className='text-sm text-text-muted mt-0.5'>Personas clave del cliente</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <p className='text-sm text-text-muted'>
                Agrega las personas de contacto principales para este cliente. Puedes añadir más
                contactos después.
              </p>
              <ContactsEditor
                value={watch('contacts') || []}
                onChange={val => setValue('contacts', val)}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Form Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className='sticky bottom-6 z-10'
      >
        <Card className='border-2 border-[color:var(--color-accent-blue)]/20 bg-[color:var(--color-app-bg)]/95 backdrop-blur-sm'>
          <CardContent className='py-6'>
            <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
              <div className='text-center sm:text-left'>
                <p className='text-sm font-medium text-text-primary'>
                  {canSubmit ? 'Listo para crear el cliente' : 'Complete el nombre para continuar'}
                </p>
                <p className='text-xs text-text-muted mt-1'>
                  Todos los campos opcionales pueden editarse después
                </p>
              </div>

              <div className='flex items-center gap-3'>
                <Button
                  type='button'
                  variant='ghost'
                  size='lg'
                  onClick={() => navigate('/dashboard')}
                  disabled={submitting}
                  className='min-w-[100px]'
                >
                  Cancelar
                </Button>

                <Button
                  type='submit'
                  variant='primary'
                  size='lg'
                  disabled={!canSubmit}
                  loading={submitting}
                  className='min-w-[160px] font-semibold'
                  icon={<Save size={18} />}
                >
                  {submitting ? 'Creando cliente...' : 'Crear cliente'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </form>
  )
}

export default ClientCreatePage
