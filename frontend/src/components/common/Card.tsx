import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean
  padded?: boolean
  header?: React.ReactNode
  footer?: React.ReactNode
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverLift = false,
  padded = true,
  header,
  footer,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`
        bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden
        ${hoverLift ? 'card-hover-lift' : ''}
        ${className}
      `}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-[#E5EAE4] bg-[#FBFDFB]">
          {header}
        </div>
      )}
      <div className={padded ? 'p-6' : ''}>{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-[#E5EAE4] bg-[#FBFDFB]">
          {footer}
        </div>
      )}
    </div>
  )
}
