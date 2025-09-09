import React, { type ChangeEvent } from 'react'
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form'
import type { ClientCreationFormData } from '@shared/types'

/**
 * SocialLinksSection Component
 * SCOPE: Used only by ClientCreationModal (single usage) - stays local to dashboard
 * PERFORMANCE: Memoized to prevent unnecessary re-renders
 *
 * Renders social media and website input fields
 */
const SOCIAL_PLATFORMS = [
  'linkedin',
  'instagram',
  'facebook',
  'x',
  'youtube',
  'tiktok',
  'whatsapp',
] as const

interface SocialLinksSectionProps {
  register: UseFormRegister<ClientCreationFormData>
  setValue: UseFormSetValue<ClientCreationFormData>
}

export const SocialLinksSection = React.memo<SocialLinksSectionProps>(({ register, setValue }) => {
  const baseInputClassName =
    'w-full rounded-md border border-[color:var(--color-border-subtle)] bg-surface-soft px-3 py-2 text-text-primary placeholder-text-muted focus:border-[color:var(--color-accent-blue)] focus:outline-none transition-colors'

  return (
    <div>
      <h3 className='font-semibold text-text-primary mb-2'>Sitio web y redes (opcional)</h3>
      <div className='space-y-3'>
        <div>
          <label className='mb-1 block text-sm text-text-muted'>Sitio web</label>
          <input
            type='url'
            className={baseInputClassName}
            placeholder='https://www.miweb.com'
            {...register('website')}
          />
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {SOCIAL_PLATFORMS.map(platform => (
            <div key={platform}>
              <label className='mb-1 block text-xs capitalize text-text-muted'>
                {platform === 'x' ? 'X (Twitter)' : platform}
              </label>
              <input
                type='url'
                className={baseInputClassName}
                placeholder={`URL de ${platform === 'x' ? 'X (Twitter)' : platform}`}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setValue(`socials.${platform}` as any, e.target.value)
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

SocialLinksSection.displayName = 'SocialLinksSection'

export default SocialLinksSection
