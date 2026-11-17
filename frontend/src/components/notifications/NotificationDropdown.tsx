import React, { useEffect, useState } from 'react'
import { CheckCheck, ExternalLink } from 'lucide-react'
import { NotificationList } from './NotificationList'
import { NotificationService, type NotificationRecord } from '../../services/NotificationService'

export interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  onNavigateToNotifications?: () => void
  onUnreadCountChange?: (count: number) => void
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onNavigateToNotifications,
  onUnreadCountChange,
}) => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadRecentNotifications = async () => {
    try {
      setLoading(true)
      const data = await NotificationService.list({ page: 1, page_size: 5 })
      const items = data.items || []
      setNotifications(items)
      const unread = data.unread_count ?? items.filter((n) => !n.is_read).length
      setUnreadCount(unread)
      if (onUnreadCountChange) onUnreadCountChange(unread)
    } catch (err) {
      console.error('Failed to load recent notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadRecentNotifications()
    }
  }, [isOpen])

  const handleToggleRead = async (id: number) => {
    try {
      await NotificationService.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
      if (onUnreadCountChange) onUnreadCountChange(Math.max(0, unreadCount - 1))
    } catch (err) {
      console.error('Failed to mark read:', err)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await NotificationService.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      if (onUnreadCountChange) onUnreadCountChange(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between pb-3 border-b border-[#E5EAE4] mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#183B36]">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0E6] text-[#FF8B45] border border-[#FFD4BA]">
              {unreadCount} Unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-[10px] font-semibold text-[#075E54] hover:underline cursor-pointer flex items-center gap-1"
          >
            <CheckCheck className="h-3 w-3" /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto space-y-2">
        <NotificationList
          notifications={notifications}
          onToggleRead={handleToggleRead}
          onDelete={handleDelete}
          isLoading={loading}
          compact
        />
      </div>

      <div className="pt-3 mt-3 border-t border-[#E5EAE4] text-center">
        <button
          onClick={() => {
            onClose()
            if (onNavigateToNotifications) onNavigateToNotifications()
          }}
          className="text-xs font-bold text-[#075E54] hover:underline cursor-pointer inline-flex items-center gap-1"
        >
          View Full Notifications Center <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

export default NotificationDropdown
