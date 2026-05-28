import React from 'react';
import {
  UserIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClipboardIcon,
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { CyberButton } from '../ui/Button';

export const ProfileTab = ({
  profile,
  fullName,
  setFullName,
  avatarBase64,
  setAvatarBase64,
  savingProfile,
  avatarColMissing,
  handleSaveProfile,
  onAvatarFileSelect,
  copyToClipboard,
  sqlAvatarSetup,
  t,
}) => {
  const handleDragOver = e => {
    e.preventDefault();
  };

  const handleDrop = e => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onAvatarFileSelect(file);
    }
  };

  const handleFileInputChange = e => {
    const file = e.target.files?.[0];
    if (file) {
      onAvatarFileSelect(file);
    }
    e.target.value = '';
  };

  return (
    <Card className='surface'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-lg text-text-primary'>
          <UserIcon className='h-5 w-5' />
          {t.profile.title}
        </CardTitle>
        <p className='text-xs text-text-muted mt-1'>{t.profile.desc}</p>
      </CardHeader>
      <CardContent className='space-y-6 pt-4'>
        <form onSubmit={handleSaveProfile} className='space-y-6'>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className='flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-surface-soft border border-border-subtle transition duration-200 hover:border-border-strong w-full'
          >
            <div className='relative group flex-shrink-0'>
              {avatarBase64 ? (
                <img
                  src={avatarBase64}
                  alt='User Avatar Preview'
                  className='h-20 w-20 rounded-full object-cover border-2 border-border-strong shadow-md'
                />
              ) : (
                <div className='h-20 w-20 rounded-full bg-surface-strong border-2 border-border-subtle flex items-center justify-center font-bold text-xl text-text-muted uppercase'>
                  {fullName ? fullName.charAt(0) : 'U'}
                </div>
              )}
              <label className='absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'>
                <span className='text-[10px] font-bold text-white uppercase tracking-wider'>
                  {t.profile.uploadBtn}
                </span>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleFileInputChange}
                  className='hidden'
                />
              </label>
            </div>

            <div className='space-y-1.5 text-center sm:text-left flex-1'>
              <label className='block text-xs font-semibold uppercase tracking-wider text-text-primary'>
                {t.profile.avatarLabel}
              </label>
              <p className='text-xs text-text-muted leading-relaxed'>
                {avatarBase64 ? t.profile.dbApplied : t.profile.dragDrop}
              </p>
              <div className='flex gap-2 justify-center sm:justify-start'>
                <button
                  type='button'
                  onClick={() => document.getElementById('avatar-input').click()}
                  className='px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-border-subtle text-text-primary hover:bg-surface-strong transition'
                >
                  {t.profile.uploadBtn}
                </button>
                {avatarBase64 && (
                  <button
                    type='button'
                    onClick={() => setAvatarBase64('')}
                    className='px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition'
                  >
                    {t.profile.removeBtn}
                  </button>
                )}
              </div>
              <input
                id='avatar-input'
                type='file'
                accept='image/*'
                onChange={handleFileInputChange}
                className='hidden'
              />
            </div>
          </div>

          {/* Inputs */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-bold text-text-muted uppercase tracking-wider mb-2'>
                {t.profile.nameLabel}
              </label>
              <Input
                type='text'
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className='input-cyber font-medium'
              />
            </div>
            <div>
              <label className='block text-xs font-bold text-text-muted uppercase tracking-wider mb-2'>
                {t.profile.roleLabel}
              </label>
              <div className='p-2.5 rounded-xl bg-surface-soft border border-border-subtle flex items-center justify-between text-sm font-semibold capitalize text-text-primary'>
                <span>
                  {profile?.role === 'admin' ? t.team.adminRole : t.team.memberRole}
                </span>
                <ShieldCheckIcon className='h-5 w-5 text-text-muted' />
              </div>
            </div>
          </div>

          <div className='flex justify-between items-center pt-2'>
            <div className='text-[11px] text-text-muted font-mono'>
              {t.profile.userId}: {profile?.id}
            </div>
            <CyberButton type='submit' disabled={savingProfile} loading={savingProfile}>
              {savingProfile ? t.profile.saving : t.profile.saveBtn}
            </CyberButton>
          </div>
        </form>

        {/* SQL Warning Panel */}
        {avatarColMissing && (
          <div className='rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-3 mt-4 text-xs text-text-muted leading-relaxed'>
            <div className='flex items-center gap-2 text-yellow-500 font-semibold uppercase tracking-wider'>
              <ExclamationTriangleIcon className='h-5 w-5 flex-shrink-0' />
              <span>{t.profile.dbTip}</span>
            </div>
            <p>{t.profile.dbTipDesc}</p>
            <div className='relative mt-2 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] p-2.5 text-yellow-500/90 flex justify-between items-center'>
              <pre>{sqlAvatarSetup}</pre>
              <button
                type='button'
                onClick={() => copyToClipboard(sqlAvatarSetup)}
                className='p-1 rounded bg-surface border border-white/10 hover:bg-surface-strong text-text-primary transition'
                title='Copiar SQL'
              >
                <ClipboardIcon className='h-3.5 w-3.5' />
              </button>
            </div>
            <p className='text-[10px] italic'>{t.profile.dbLocalOnly}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
