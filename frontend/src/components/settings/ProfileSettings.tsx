import React, { useState, useEffect } from 'react'
import { User, Save, Mail, ShieldCheck, KeyRound, Image as ImageIcon } from 'lucide-react'
import { Button, Input, PhoneInput } from '../common'

interface UserProfileData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  avatar_url?: string
  role?: string
}

interface ProfileSettingsProps {
  initialData: UserProfileData
  onSave: (data: { first_name: string; last_name: string; phone?: string; avatar_url?: string }) => Promise<void>
  onSwitchToSecurity: () => void
  saving: boolean
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  initialData,
  onSave,
  onSwitchToSecurity,
  saving,
}) => {
  const [formData, setFormData] = useState({
    first_name: initialData.first_name || '',
    last_name: initialData.last_name || '',
    phone: initialData.phone || '',
    avatar_url: initialData.avatar_url || '',
  })

  useEffect(() => {
    setFormData({
      first_name: initialData.first_name || '',
      last_name: initialData.last_name || '',
      phone: initialData.phone || '',
      avatar_url: initialData.avatar_url || '',
    })
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const initials = `${formData.first_name?.[0] || 'O'}${formData.last_name?.[0] || 'W'}`.toUpperCase()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-[#E5EAE4]">
        <div className="w-10 h-10 rounded-xl bg-[#075E54]/10 flex items-center justify-center text-[#075E54]">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#183B36]">Account & Profile Settings</h2>
          <p className="text-xs text-[#78847F]">
            Manage your personal profile details, contact information, and authentication credentials.
          </p>
        </div>
      </div>

      {/* Avatar Card */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]">
        <div className="relative">
          {formData.avatar_url ? (
            <img
              src={formData.avatar_url}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#075E54]"
              onError={(e) => {
                ;(e.target as HTMLElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-lg">
              {initials}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#183B36]">
              {formData.first_name} {formData.last_name}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#075E54] bg-[#075E54]/10 px-2 py-0.5 rounded-full">
              <ShieldCheck className="h-3 w-3" />
              {initialData.role ? initialData.role.toUpperCase() : 'ORGANIZATION OWNER'}
            </span>
          </div>
          <p className="text-xs text-[#78847F]">{initialData.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          required
          placeholder="First name"
        />
        <Input
          label="Last Name"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          required
          placeholder="Last name"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Primary Email Address"
          type="email"
          value={initialData.email || ''}
          disabled
          helperText="Verified corporate address used for owner access."
          leftIcon={<Mail className="h-4 w-4 text-[#78847F]" />}
        />
        <PhoneInput
          label="Direct Phone / Mobile"
          value={formData.phone}
          onChange={(val) => setFormData({ ...formData, phone: val })}
          showTypeBadge
        />
      </div>

      <Input
        label="Profile Photo / Avatar URL"
        value={formData.avatar_url}
        onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
        placeholder="https://cdn.example.com/avatar.jpg"
        leftIcon={<ImageIcon className="h-4 w-4 text-[#78847F]" />}
        helperText="Direct image URL for your profile avatar."
      />

      {/* Password Change Shortcut */}
      <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900">Security Credentials & Password</h4>
            <p className="text-[11px] text-amber-700">
              Need to rotate or update your password? Access security parameters.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSwitchToSecurity}
          className="border-amber-300 text-amber-900 hover:bg-amber-100/50 cursor-pointer text-xs"
        >
          Change Password
        </Button>
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
          {saving ? 'Saving Profile...' : 'Save Profile Changes'}
        </Button>
      </div>
    </form>
  )
}
