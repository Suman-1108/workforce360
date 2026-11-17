import React, { useState, useEffect } from 'react'
import { Bell, Mail, Calendar, AlertTriangle, CreditCard, Save } from 'lucide-react'
import { Button } from '../common'

interface NotificationData {
  email_notifications: boolean
  in_app_notifications: boolean
  leave_alerts: boolean
  attendance_alerts: boolean
  subscription_reminders: boolean
}

interface NotificationSettingsProps {
  initialData: NotificationData
  onSave: (data: NotificationData) => Promise<void>
  saving: boolean
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  initialData,
  onSave,
  saving,
}) => {
  const [formData, setFormData] = useState<NotificationData>(initialData)

  useEffect(() => {
    setFormData(initialData)
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-[#E5EAE4]">
        <div className="w-10 h-10 rounded-xl bg-[#075E54]/10 flex items-center justify-center text-[#075E54]">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#183B36]">Notification & Dispatch Preferences</h2>
          <p className="text-xs text-[#78847F]">
            Control real-time alerts, email dispatches, and executive summary notifications.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Email Master Toggle */}
        <label className="flex items-start gap-3.5 p-4 rounded-2xl border border-[#E5EAE4] bg-white hover:bg-[#F5F7F1] cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={formData.email_notifications}
            onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded accent-[#075E54]"
          />
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#183B36] flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#075E54]" />
              Master Email Notifications
            </span>
            <p className="text-[11px] text-[#78847F]">
              Receive transactional email dispatches for important tenant activities and audits.
            </p>
          </div>
        </label>

        {/* In-App Notifications */}
        <label className="flex items-start gap-3.5 p-4 rounded-2xl border border-[#E5EAE4] bg-white hover:bg-[#F5F7F1] cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={formData.in_app_notifications}
            onChange={(e) => setFormData({ ...formData, in_app_notifications: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded accent-[#075E54]"
          />
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#183B36] flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-[#075E54]" />
              In-App Notification Feed & Topbar Badge
            </span>
            <p className="text-[11px] text-[#78847F]">
              Display real-time notification drop-down alerts and unread badge count in the dashboard header.
            </p>
          </div>
        </label>

        {/* Leave Notifications */}
        <label className="flex items-start gap-3.5 p-4 rounded-2xl border border-[#E5EAE4] bg-white hover:bg-[#F5F7F1] cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={formData.leave_alerts}
            onChange={(e) => setFormData({ ...formData, leave_alerts: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded accent-[#075E54]"
          />
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#183B36] flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#075E54]" />
              Leave Applications & Status Alerts
            </span>
            <p className="text-[11px] text-[#78847F]">
              Trigger instant notifications when staff apply for annual, sick, or casual leave.
            </p>
          </div>
        </label>

        {/* Attendance Notifications */}
        <label className="flex items-start gap-3.5 p-4 rounded-2xl border border-[#E5EAE4] bg-white hover:bg-[#F5F7F1] cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={formData.attendance_alerts}
            onChange={(e) => setFormData({ ...formData, attendance_alerts: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded accent-[#075E54]"
          />
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#183B36] flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-[#FF8B45]" />
              Attendance Violations & Geofence Breaches
            </span>
            <p className="text-[11px] text-[#78847F]">
              Alert owners immediately if an employee attempts a punch-in beyond the authorized radius.
            </p>
          </div>
        </label>

        {/* Subscription Reminders */}
        <label className="flex items-start gap-3.5 p-4 rounded-2xl border border-[#E5EAE4] bg-white hover:bg-[#F5F7F1] cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={formData.subscription_reminders}
            onChange={(e) =>
              setFormData({ ...formData, subscription_reminders: e.target.checked })
            }
            className="mt-0.5 h-4 w-4 rounded accent-[#075E54]"
          />
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#183B36] flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-[#075E54]" />
              Subscription Renewal & Billing Receipts
            </span>
            <p className="text-[11px] text-[#78847F]">
              Receive renewal countdown notifications, invoices, and plan capacity warnings.
            </p>
          </div>
        </label>
      </div>

      <div className="pt-4 border-t border-[#E5EAE4] flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={saving}
          leftIcon={<Save className="h-4 w-4" />}
          className="bg-[#075E54] hover:bg-[#075E54]/90 text-white cursor-pointer px-5 py-2.5"
        >
          {saving ? 'Saving Preferences...' : 'Save Notification Preferences'}
        </Button>
      </div>
    </form>
  )
}
