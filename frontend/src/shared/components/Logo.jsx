import React from 'react'
import logoUrl from '@/assets/logo.png'

export const Logo = ({
  size = 35,
  // Celeste → blanco → azul gradient by default
  fill = 'linear-gradient(135deg, #5BE7FF 0%, #FFFFFF 40%, #005DFF 100%)',
  className = '',
}) => {
  const style = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    background: fill,
    WebkitMaskImage: `url(${logoUrl})`,
    maskImage: `url(${logoUrl})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    display: 'inline-block',
  }

  return <span aria-hidden='true' style={style} className={className} />
}

export default Logo
