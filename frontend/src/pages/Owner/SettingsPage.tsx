import React, { useState, useEffect } from 'react'
import {
  Building2,
  User,
  MapPin,
  Clock,
  Bell,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'

import {
  OrganizationSettings,
  ProfileSettings,
  AttendanceSettings,
  ShiftSettings,
  NotificationSettings,
  SecuritySettings,
} from '../../components/settings'

import { settingsApi, authApi } from '../../services/api'

type SettingsTab = 'org' | 'profile' | 'attendance' | 'shift' | 'notifications' | 'security'

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('org')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Full settings data loaded from backend
  const [settingsData, setSettingsData] = useState<any>(null)
  // Current user loaded from auth API
  const [currentUser, setCurrentUser] = useState<any>(null)

  const showSuccess = (msg: string) => {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(null), 3500)
  }

  const loadData = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const [settingsRes, userRes] = await Promise.all([
        settingsApi.getAll(),
        authApi.getMe(),
      ])
      if (settingsRes.data) {
        setSettingsData(settingsRes.data)
      }
      if (userRes.data) {
        setCurrentUser(userRes.data)
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err)
      setErrorMessage(
        err.response?.data?.message || 'Failed to load organization settings from server.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handlers for each subcomponent
  const handleSaveOrganization = async (orgData: any) => {
    setSaving(true)
    setErrorMessage(null)
    try {
      const res = await settingsApi.saveAll({ organization: orgData })
      if (res.data) {
        setSettingsData(res.data)
      }
      showSuccess('Organization profile and address updated successfully.')
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save organization settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async (profileData: any) => {
    setSaving(true)
    setErrorMessage(null)
    try {
      const res = await authApi.updateProfile(profileData)
      if (res.data) {
        setCurrentUser(res.data)
        // Also update stored user in localStorage
        const stored = localStorage.getItem('wf360_user')
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            localStorage.setItem('wf360_user', JSON.stringify({ ...parsed, ...res.data }))
          } catch (e) {
            // Ignore JSON parse error
          }
        }
      }
      showSuccess('Owner profile credentials updated successfully.')
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAttendance = async (attendanceData: any) => {
    setSaving(true)
    setErrorMessage(null)
    try {
      const res = await settingsApi.saveAll({ attendance: attendanceData })
      if (res.data) {
        setSettingsData(res.data)
      }
      showSuccess('Attendance geofencing and mobile punch rules updated.')
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save attendance rules.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveShift = async (shiftData: any) => {
    setSaving(true)
    setErrorMessage(null)
    try {
      const res = await settingsApi.saveAll({ shift: shiftData })
      if (res.data) {
        setSettingsData(res.data)
      }
      showSuccess('Shift policies and enterprise working days updated.')
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save shift policies.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async (notifData: any) => {
    setSaving(true)
    setErrorMessage(null)
    try {
      const res = await settingsApi.saveAll({ notifications: notifData })
      if (res.data) {
        setSettingsData(res.data)
      }
      showSuccess('Notification dispatch preferences updated.')
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save notification preferences.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSecurity = async (secData: any) => {
    setSaving(true)
    setErrorMessage(null)
    try {
      const res = await settingsApi.saveAll({ security: secData })
      if (res.data) {
        setSettingsData(res.data)
      }
      showSuccess('Security authentication and 2FA policies saved.')
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save security policies.')
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'org', label: 'Organization', icon: <Building2 className="h-4 w-4" /> },
    { id: 'profile', label: 'Owner Profile', icon: <User className="h-4 w-4" /> },
    { id: 'attendance', label: 'Attendance Rules', icon: <MapPin className="h-4 w-4" /> },
    { id: 'shift', label: 'Shift Policies', icon: <Clock className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { id: 'security', label: 'Security & Auth', icon: <Shield className="h-4 w-4" /> },
  ]

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#075E54]" />
        <span className="text-xs font-semibold text-[#78847F]">
          Loading organization settings and security policies...
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
            Settings & Governance
          </h1>
          <p className="text-xs sm:text-sm text-[#78847F] mt-0.5">
            Configure organization policies, attendance geofence thresholds, and security parameters.
          </p>
        </div>

        {successToast && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold shadow-xs animate-in fade-in duration-150">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-2xl border border-[#E5EAE4] card-soft-shadow">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === tab.id
                ? 'bg-[#075E54] text-white shadow-xs'
                : 'text-[#78847F] hover:bg-[#F5F7F1] hover:text-[#183B36]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5EAE4] card-soft-shadow">
        {activeTab === 'org' && (
          <OrganizationSettings
            initialData={
              settingsData?.organization || {
                name: 'Apex Technologies Inc.',
                contact_email: 'owner@apextechnologies.com',
                contact_phone: '+1 (555) 019-2834',
                address: '100 Innovation Boulevard, Tech Park Suite 400',
                city: 'Chicago',
                state: 'IL',
                country: 'United States',
              }
            }
            onSave={handleSaveOrganization}
            saving={saving}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileSettings
            initialData={
              currentUser || {
                first_name: 'Marcus',
                last_name: 'Vance',
                email: 'owner@apextechnologies.com',
                phone: '+1 (555) 019-2834',
                role: 'owner',
              }
            }
            onSave={handleSaveProfile}
            onSwitchToSecurity={() => setActiveTab('security')}
            saving={saving}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceSettings
            initialData={
              settingsData?.attendance || {
                require_gps: true,
                require_selfie: true,
                geofence_radius_meters: 500,
                grace_period_mins: 15,
                auto_half_day_under_hours: 4.0,
                strict_geofence: true,
              }
            }
            onSave={handleSaveAttendance}
            saving={saving}
          />
        )}

        {activeTab === 'shift' && (
          <ShiftSettings
            initialData={
              settingsData?.shift || {
                default_working_hours: 8.5,
                break_duration_mins: 45,
                working_days: 'Monday,Tuesday,Wednesday,Thursday,Friday',
                allow_overtime: true,
              }
            }
            onSave={handleSaveShift}
            saving={saving}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationSettings
            initialData={
              settingsData?.notifications || {
                email_notifications: true,
                in_app_notifications: true,
                leave_alerts: true,
                attendance_alerts: true,
                subscription_reminders: true,
              }
            }
            onSave={handleSaveNotifications}
            saving={saving}
          />
        )}

        {activeTab === 'security' && (
          <SecuritySettings
            initialData={
              settingsData?.security || {
                two_factor_auth: false,
                session_timeout_mins: 60,
              }
            }
            onSave={handleSaveSecurity}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}

export default SettingsPage
