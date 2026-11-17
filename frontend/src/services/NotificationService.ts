import { api } from './api'

export interface NotificationRecord {
  id: number
  tenant_id: number
  user_id?: number | null
  title: string
  message: string
  category: 'Employee' | 'Attendance' | 'Leave' | 'Shift' | 'Subscription' | 'Payment' | 'System'
  severity: 'info' | 'warning' | 'success' | 'error'
  is_read: boolean
  data?: any
  created_at: string
  read_at?: string | null
}

export interface NotificationListResult {
  items: NotificationRecord[]
  total: number
  unread_count: number
  page: number
  page_size: number
}

export const NotificationService = {
  list: async (params?: {
    category?: string
    unread_only?: boolean
    page?: number
    page_size?: number
  }): Promise<NotificationListResult> => {
    const res = await api.get('/notifications', { params })
    return res.data
  },

  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const res = await api.get('/notifications/unread-count')
    return res.data
  },

  markRead: async (id: number): Promise<NotificationRecord> => {
    const res = await api.patch(`/notifications/${id}/read`)
    return res.data
  },

  markAllRead: async (): Promise<{ marked_read_count: number }> => {
    const res = await api.patch('/notifications/read-all')
    return res.data
  },

  deleteNotification: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`)
  },
}

export default NotificationService
