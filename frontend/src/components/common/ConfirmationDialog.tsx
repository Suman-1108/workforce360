import React from 'react'
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

export interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'success'
  isLoading?: boolean
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const icons = {
    danger: <AlertTriangle className="h-6 w-6 text-rose-600" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    info: <Info className="h-6 w-6 text-[#075E54]" />,
    success: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
  }

  const iconBg = {
    danger: 'bg-rose-50 border-rose-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-[#E6F3F1] border-[#BDE0D9]',
    success: 'bg-emerald-50 border-emerald-200',
  }

  const confirmVariant = variant === 'danger' ? 'accent' : 'primary'

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={`h-14 w-14 rounded-2xl flex items-center justify-center border mb-4 ${iconBg[variant]}`}
        >
          {icons[variant]}
        </div>

        <h3 className="text-lg font-bold text-[#183B36] mb-2">{title}</h3>
        <p className="text-sm text-[#78847F] mb-6 leading-relaxed">{message}</p>

        <div className="flex items-center justify-center gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
