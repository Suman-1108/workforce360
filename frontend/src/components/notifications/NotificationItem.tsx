import React from 'react'
import {
  MapPin,
  Coffee,
  Calendar,
  CreditCard,
  ShieldAlert,
  Users,
  CheckCircle2,
  Trash2,
  Clock,
  DollarSign,
} from 'lucide-react'
import { Badge } from '../common'
import type { NotificationRecord } from '../../services/NotificationService'

export interface NotificationItemProps {
  notification: NotificationRecord
  onToggleRead: (id: number) => void
  onDelete: (id: number) => void
  compact?: boolean
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onToggleRead,
  onDelete,
  compact = false,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'attendance':
        return <MapPin className="h-4 w-4 text-[#075E54]" />
      case 'leave':
        return <Coffee className="h-4 w-4 text-[#FF8B45]" />
      case 'shift':
        return <Calendar className="h-4 w-4 text-purple-600" />
      case 'subscription':
        return <CreditCard className="h-4 w-4 text-emerald-600" />
      case 'payment':
        return <DollarSign className="h-4 w-4 text-emerald-700" />
      case 'employee':
        return <Users className="h-4 w-4 text-blue-600" />
      default:
        return <ShieldAlert className="h-4 w-4 text-amber-600" />
    }
  }

  const formatTimestamp = (isoDate: string) => {
    try {
      const d = new Date(isoDate)
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoDate
    }
  }

  return (
    <div
      className={`rounded-2xl border transition-all flex items-start justify-between gap-3.5 ${
        compact ? 'p-3 text-xs' : 'p-4 text-xs'
      } ${
        notification.is_read
          ? 'bg-white border-[#E5EAE4]'
          : 'bg-[#F9FAF8] border-[#BDE0D9] shadow-2xs'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`rounded-xl bg-[#F5F7F1] flex items-center justify-center shrink-0 border border-[#E5EAE4] mt-0.5 ${
            compact ? 'h-8 w-8' : 'h-9 w-9'
          }`}
        >
          {getCategoryIcon(notification.category)}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-[#183B36] truncate">{notification.title}</span>
            <Badge variant="neutral" size="sm">
              {notification.category}
            </Badge>
            {!notification.is_read && (
              <span className="h-2 w-2 rounded-full bg-[#FF8B45] shrink-0" />
            )}
          </div>

          <p className="text-[#78847F] leading-relaxed mb-2 line-clamp-2">
            {notification.message}
          </p>

          <span className="text-[10px] font-medium text-[#A0ACA7] flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimestamp(notification.created_at)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onToggleRead(notification.id)}
          title={notification.is_read ? 'Mark as Unread' : 'Mark as Read'}
          className="p-1.5 rounded-lg text-[#78847F] hover:bg-[#F5F7F1] hover:text-[#075E54] cursor-pointer transition-colors"
          aria-label="Toggle read status"
        >
          <CheckCircle2
            className={`h-4 w-4 ${notification.is_read ? 'text-[#CBD5C8]' : 'text-[#075E54]'}`}
          />
        </button>
        <button
          onClick={() => onDelete(notification.id)}
          title="Delete Notification"
          className="p-1.5 rounded-lg text-[#78847F] hover:bg-rose-50 hover:text-rose-600 cursor-pointer transition-colors"
          aria-label="Delete notification"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default NotificationItem
