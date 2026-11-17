import React from 'react'

export interface ChartCardProps {
  title: string
  subtitle?: string
  badge?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  minHeight?: string
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  badge,
  action,
  children,
  className = '',
  minHeight = 'min-h-[300px]',
}) => {
  return (
    <div
      className={`
        bg-white rounded-3xl p-4 sm:p-6 border border-[#E5EAE4] card-soft-shadow
        flex flex-col justify-between ${className}
      `}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#183B36] tracking-tight">
              {title}
            </h3>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs text-[#78847F] mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>

      <div className={`w-full ${minHeight} flex items-center justify-center`}>
        {children}
      </div>
    </div>
  )
}
