import React, { useState, useEffect } from 'react'
import {
  CheckCheck,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { Button, Badge } from '../../components/common'
import { NotificationList } from '../../components/notifications/NotificationList'
import {
  NotificationService,
  type NotificationRecord,
} from '../../services/NotificationService'

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await NotificationService.list({
        category: filterCategory === 'all' ? undefined : filterCategory,
        unread_only: showUnreadOnly,
        page,
        page_size: pageSize,
      })
      setNotifications(data.items || [])
      setTotalCount(data.total ?? 0)
      setUnreadCount(data.unread_count ?? 0)
    } catch (err) {
      console.error('Failed to fetch notifications from backend:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [filterCategory, showUnreadOnly, page])

  const handleToggleRead = async (id: number) => {
    try {
      const updated = await NotificationService.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: updated.is_read } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      console.error('Failed to toggle read state:', err)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await NotificationService.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setTotalCount((c) => Math.max(0, c - 1))
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  const categories = [
    'all',
    'Attendance',
    'Leave',
    'Shift',
    'Employee',
    'Subscription',
    'Payment',
    'System',
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
              Notifications Center
            </h1>
            {unreadCount > 0 && (
              <Badge variant="accent" dot>
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#78847F]">
            Audit geofence triggers, employee leave requests, shift rotations, and subscription alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleMarkAllRead}
              leftIcon={<CheckCheck className="h-4 w-4" />}
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-[#E5EAE4] card-soft-shadow">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setFilterCategory(cat)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize cursor-pointer transition-colors ${
                filterCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-[#075E54] text-white shadow-xs'
                  : 'text-[#78847F] hover:bg-[#F5F7F1] hover:text-[#183B36]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setShowUnreadOnly(!showUnreadOnly)
            setPage(1)
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
            showUnreadOnly
              ? 'bg-[#FFF0E6] text-[#FF8B45] border-[#FFD4BA]'
              : 'bg-white text-[#78847F] border-[#E5EAE4] hover:text-[#183B36]'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Unread Only</span>
        </button>
      </div>

      {/* Notifications List */}
      <NotificationList
        notifications={notifications}
        onToggleRead={handleToggleRead}
        onDelete={handleDelete}
        isLoading={loading}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-[#E5EAE4] text-xs">
          <span className="text-[#78847F]">
            Showing Page <span className="font-bold text-[#183B36]">{page}</span> of{' '}
            <span className="font-bold text-[#183B36]">{totalPages}</span> ({totalCount} total)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-[#E5EAE4] text-[#183B36] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7F1] cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-[#E5EAE4] text-[#183B36] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F7F1] cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
