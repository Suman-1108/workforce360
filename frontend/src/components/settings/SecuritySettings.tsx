import React, { useState, useEffect } from 'react'
import {
  Shield,
  KeyRound,
  Lock,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react'
import { Button, Input } from '../common'
import { authApi } from '../../services/api'

interface SecurityData {
  two_factor_auth: boolean
  session_timeout_mins: number
}

interface SecuritySettingsProps {
  initialData: SecurityData
  onSave: (data: SecurityData) => Promise<void>
  saving: boolean
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  initialData,
  onSave,
  saving,
}) => {
  const [formData, setFormData] = useState<SecurityData>(initialData)
  const [sessions, setSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  // Password change local state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    setFormData(initialData)
  }, [initialData])

  useEffect(() => {
    const fetchSessions = async () => {
      setLoadingSessions(true)
      try {
        const res = await authApi.getSessions()
        if (res.data) {
          setSessions(res.data)
        }
      } catch (err) {
        console.error('Failed to load sessions:', err)
      } finally {
        setLoadingSessions(false)
      }
    }
    fetchSessions()
  }, [])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (passwordForm.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters long.')
      return
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    setPasswordLoading(true)
    try {
      await authApi.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
      })
      setPasswordSuccess(true)
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      setTimeout(() => setPasswordSuccess(false), 4000)
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.message || err.response?.data?.detail || 'Failed to update password.'
      )
    } finally {
      setPasswordLoading(false)
    }
  }

  const handlePolicySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="space-y-8">
      {/* Policy and 2FA */}
      <form onSubmit={handlePolicySubmit} className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E5EAE4]">
          <div className="w-10 h-10 rounded-xl bg-[#075E54]/10 flex items-center justify-center text-[#075E54]">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#183B36]">Security Policy & Two-Factor Authentication</h2>
            <p className="text-xs text-[#78847F]">
              Enforce multi-factor authentication and session inactivity expiration thresholds.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-start gap-3 p-4 rounded-2xl border border-[#E5EAE4] bg-white hover:bg-[#F5F7F1] cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={formData.two_factor_auth}
              onChange={(e) => setFormData({ ...formData, two_factor_auth: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded accent-[#075E54]"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#183B36] flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-[#075E54]" />
                Enforce Two-Factor Authentication (2FA)
              </span>
              <p className="text-[11px] text-[#78847F]">
                Require an email OTP code whenever logging in from an unrecognized device.
              </p>
            </div>
          </label>

          <Input
            label="Inactivity Session Timeout (minutes)"
            type="number"
            min={5}
            max={1440}
            value={String(formData.session_timeout_mins || 60)}
            onChange={(e) =>
              setFormData({ ...formData, session_timeout_mins: Number(e.target.value) })
            }
            helperText="Automatically end browser session after this period of inactivity."
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={saving}
            leftIcon={<Save className="h-4 w-4" />}
            className="bg-[#075E54] hover:bg-[#075E54]/90 text-white cursor-pointer px-5 py-2.5"
          >
            {saving ? 'Saving Security Policy...' : 'Save Security Policy'}
          </Button>
        </div>
      </form>

      {/* Password Change Form */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5EAE4] card-soft-shadow space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E5EAE4]">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#183B36]">Rotate Account Password</h3>
            <p className="text-xs text-[#78847F]">
              Enter your existing password and choose a robust cryptographic passphrase.
            </p>
          </div>
        </div>

        {passwordError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Password updated successfully! Next login will require your new password.</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.current_password}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, current_password: e.target.value })
            }
            required
            placeholder="••••••••••••"
            leftIcon={<Lock className="h-4 w-4 text-[#78847F]" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New Password"
              type="password"
              value={passwordForm.new_password}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, new_password: e.target.value })
              }
              required
              placeholder="••••••••••••"
              leftIcon={<Lock className="h-4 w-4 text-[#78847F]" />}
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
              }
              required
              placeholder="••••••••••••"
              leftIcon={<Lock className="h-4 w-4 text-[#78847F]" />}
            />
          </div>

          <div className="p-3 rounded-xl bg-[#F5F7F1] border border-[#E5EAE4] text-[11px] text-[#78847F] space-y-1">
            <span className="font-semibold text-[#183B36]">Password Security Standards:</span>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Must be at least 8 characters long</li>
              <li>Encrypted using cryptographic PBKDF2-HMAC-SHA256 with 120,000 salt iterations</li>
            </ul>
          </div>

          <Button
            type="submit"
            variant="outline"
            size="sm"
            isLoading={passwordLoading}
            className="border-[#075E54] text-[#075E54] hover:bg-[#075E54]/5 cursor-pointer font-bold text-xs"
          >
            {passwordLoading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>
      </div>

      {/* Active Sessions & Audit */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5EAE4] card-soft-shadow space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5EAE4]">
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-[#075E54]" />
            <h3 className="text-sm font-bold text-[#183B36]">Active Sessions & Login Audit</h3>
          </div>
          <span className="text-[11px] text-[#78847F]">Hardware and location trace</span>
        </div>

        {loadingSessions ? (
          <div className="p-4 text-center text-xs text-[#78847F]">Loading active sessions...</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      sess.is_current ? 'bg-[#075E54] text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {sess.device.includes('Mobile') ? (
                      <Smartphone className="h-4 w-4" />
                    ) : (
                      <Laptop className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#183B36]">{sess.device}</span>
                      {sess.is_current && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#78847F]">
                      {sess.browser} • {sess.location} ({sess.ip_address})
                    </p>
                  </div>
                </div>

                <div className="text-right sm:text-right">
                  <span className="text-[11px] font-semibold text-[#183B36] block">
                    {sess.status}
                  </span>
                  <span className="text-[10px] text-[#78847F]">
                    Last active: {new Date(sess.last_active).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
