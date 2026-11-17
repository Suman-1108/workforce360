import React from 'react'
import { Bell } from 'lucide-react'
import { NotificationItem } from './NotificationItem'
import type { NotificationRecord } from '../../services/NotificationService'

export interface NotificationListProps {
  notifications: NotificationRecord[]
  onToggleRead: (id: number) => void
  onDelete: (id: number) => void
  isLoading?: boolean
  compact?: boolean
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onToggleRead,
  onDelete,
  isLoading = false,
  compact = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3 py-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-white rounded-2xl border border-[#E5EAE4] animate-pulse p-4"
          />
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-[#E5EAE4] card-soft-shadow">
        <Bell className="h-10 w-10 text-[#CBD5C8] mx-auto mb-2" />
        <h3 className="text-sm font-bold text-[#183B36]">No Notifications Found</h3>
        <p className="text-xs text-[#78847F] mt-1">
          You are all caught up! No alerts match your current filter.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notifications.map((item) => (
        <NotificationItem
          key={item.id}
          notification={item}
          onToggleRead={onToggleRead}
          onDelete={onDelete}
          compact={compact}
        />
      ))}
    </div>
  )
}

export default NotificationList
