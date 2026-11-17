import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
  icon: React.ReactNode
  variant?: 'teal' | 'orange' | 'emerald' | 'amber' | 'rose' | 'purple'
  trend?: {
    value: string
    isPositive?: boolean
    label?: string
  }
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  variant = 'teal',
  trend,
  className = '',
}) => {
  const iconVariants = {
    teal: 'bg-[#E6F3F1] text-[#075E54] border-[#BDE0D9]',
    orange: 'bg-[#FFF0E6] text-[#FF8B45] border-[#FFD4BA]',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }

  return (
    <div
      className={`
        bg-white rounded-3xl p-4 sm:p-6 border border-[#E5EAE4] card-soft-shadow card-hover-lift
        flex flex-col justify-between ${className}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider block mb-1">
            {label}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#183B36] tracking-tight">
              {value}
            </span>
            {subValue && (
              <span className="text-xs font-semibold text-[#78847F]">
                {subValue}
              </span>
            )}
          </div>
        </div>

        <div
          className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${iconVariants[variant]} shrink-0`}
        >
          {icon}
        </div>
      </div>

      {trend && (
        <div className="pt-3 border-t border-[#E5EAE4]/80 flex items-center gap-1.5 text-xs">
          <span
            className={`flex items-center gap-0.5 font-bold px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{trend.value}</span>
          </span>
          {trend.label && (
            <span className="text-[#78847F] text-[11px]">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  )
}
