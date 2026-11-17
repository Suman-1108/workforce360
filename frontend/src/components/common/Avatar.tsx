import React, { useState } from 'react'

export interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'busy' | 'away'
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name = 'User',
  size = 'md',
  status,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false)

  const getInitials = (text: string) => {
    const parts = text.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return text.substring(0, 2).toUpperCase()
  }

  const sizeStyles = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm font-semibold',
    lg: 'h-12 w-12 text-base font-semibold',
    xl: 'h-16 w-16 text-lg font-bold',
  }

  const statusStyles = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    busy: 'bg-rose-500',
    away: 'bg-amber-500',
  }

  const statusDotSizes = {
    xs: 'h-1.5 w-1.5 ring-1 ring-white',
    sm: 'h-2 w-2 ring-1.5 ring-white',
    md: 'h-2.5 w-2.5 ring-2 ring-white',
    lg: 'h-3 w-3 ring-2 ring-white',
    xl: 'h-3.5 w-3.5 ring-2 ring-white',
  }

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || name}
          onError={() => setImageError(true)}
          className={`rounded-full object-cover border border-[#E5EAE4] ${sizeStyles[size]}`}
        />
      ) : (
        <div
          className={`
            rounded-full bg-[#E6F3F1] text-[#075E54] flex items-center justify-center
            border border-[#CBD5C8] select-none
            ${sizeStyles[size]}
          `}
        >
          {getInitials(name)}
        </div>
      )}

      {status && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full
            ${statusStyles[status]}
            ${statusDotSizes[size]}
          `}
        />
      )}
    </div>
  )
}
