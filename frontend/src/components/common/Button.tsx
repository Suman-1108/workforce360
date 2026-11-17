import React from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2'

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 shadow-sm',
  }

  const variantStyles = {
    primary:
      'bg-[#075E54] hover:bg-[#064e46] text-white focus:ring-[#075E54] shadow-sm hover:shadow active:scale-[0.98]',
    accent:
      'bg-[#FF8B45] hover:bg-[#F07A32] text-white focus:ring-[#FF8B45] shadow-sm hover:shadow active:scale-[0.98]',
    secondary:
      'bg-[#E6F3F1] hover:bg-[#D4ECE8] text-[#075E54] focus:ring-[#075E54] active:scale-[0.98]',
    outline:
      'border border-[#CBD5C8] hover:border-[#075E54] bg-white text-[#183B36] hover:text-[#075E54] focus:ring-[#075E54]',
    ghost:
      'text-[#183B36] hover:bg-[#EAEFE9] focus:ring-[#CBD5C8]',
  }

  return (
    <button
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0">{rightIcon}</span>
      )}
    </button>
  )
}
