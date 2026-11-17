import React, { useState, useEffect } from 'react'
import { MapPin, Camera, Navigation, Clock, ShieldAlert, Save } from 'lucide-react'
import { Button, Input } from '../common'

interface AttendanceData {
  require_gps: boolean
  require_selfie: boolean
  geofence_radius_meters: number
  grace_period_mins: number
  auto_half_day_under_hours: number
  strict_geofence: boolean
}

interface AttendanceSettingsProps {
  initialData: AttendanceData
  onSave: (data: AttendanceData) => Promise<void>
  saving: boolean
}

export const AttendanceSettings: React.FC<AttendanceSettingsProps> = ({
  initialData,
  onSave,
  saving,
}) => {
  const [formData, setFormData] = useState<AttendanceData>(initialData)

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
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#183B36]">Attendance & Geofencing Rules</h2>
          <p className="text-xs text-[#78847F]">
            Define mobile clock-in parameters, biometric facial telemetry, and punctuality rules.
          </p>
        </div>
      </div>

      {/* Geofence Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            label="Default Geofence Punch Radius (meters)"
            type="number"
            min={10}
            max={5000}
            value={String(formData.geofence_radius_meters || 500)}
            onChange={(e) =>
              setFormData({ ...formData, geofence_radius_meters: Number(e.target.value) })
            }
            helperText="Maximum allowed distance from facility coordinates to validate clock-in."
            leftIcon={<Navigation className="h-4 w-4 text-[#78847F]" />}
          />
        </div>

        <div>
          <Input
            label="Late Arrival Grace Period (minutes)"
            type="number"
            min={0}
            max={120}
            value={String(formData.grace_period_mins || 15)}
            onChange={(e) =>
              setFormData({ ...formData, grace_period_mins: Number(e.target.value) })
            }
            helperText="Grace window after scheduled shift start before check-in is flagged as Late."
            leftIcon={<Clock className="h-4 w-4 text-[#78847F]" />}
          />
        </div>
      </div>

      {/* Punctuality and Half-Day Threshold */}
      <div className="p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] space-y-4">
        <h3 className="text-xs font-bold text-[#183B36] uppercase tracking-wider">
          Punctuality & Half-Day Rules
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Auto Half-Day Threshold (hours)"
            type="number"
            step="0.5"
            min={1}
            max={12}
            value={String(formData.auto_half_day_under_hours || 4.0)}
            onChange={(e) =>
              setFormData({ ...formData, auto_half_day_under_hours: Number(e.target.value) })
            }
            helperText="Shifts worked under this duration automatically get recorded as Half-Day."
          />

          <div className="flex flex-col justify-center space-y-1 text-xs text-[#78847F]">
            <span className="font-semibold text-[#183B36]">Punctuality Compliance</span>
            <p className="text-[11px]">
              Employees punching after the {formData.grace_period_mins}-minute grace period are marked
              with the "Late" badge and counted in executive attendance analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Restrictions */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#183B36] uppercase tracking-wider">
          Mobile Punch Telemetry & Restrictions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex items-start gap-3 p-4 rounded-2xl border border-[#E5EAE4] bg-white hover:bg-[#F5F7F1] cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={formData.require_gps}
              onChange={(e) => setFormData({ ...formData, require_gps: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded accent-[#075E54]"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#183B36] flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-[#075E54]" />
                Enforce GPS
              </span>
              <p className="text-[11px] text-[#78847F]">
                Requires live hardware coordinates check on every punch.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-2xl border border-[#E5EAE4] bg-white hover:bg-[#F5F7F1] cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={formData.require_selfie}
              onChange={(e) => setFormData({ ...formData, require_selfie: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded accent-[#075E54]"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#183B36] flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-[#075E54]" />
                Require Selfie
              </span>
              <p className="text-[11px] text-[#78847F]">
                Requires front-camera facial capture to prevent buddy punching.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-2xl border border-[#E5EAE4] bg-white hover:bg-[#F5F7F1] cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={formData.strict_geofence}
              onChange={(e) => setFormData({ ...formData, strict_geofence: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded accent-[#075E54]"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#183B36] flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-[#FF8B45]" />
                Strict Geofence
              </span>
              <p className="text-[11px] text-[#78847F]">
                Out-of-bounds punch attempts will be outright rejected.
              </p>
            </div>
          </label>
        </div>
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
          {saving ? 'Saving Rules...' : 'Save Attendance Rules'}
        </Button>
      </div>
    </form>
  )
}
