import React, { useState, useEffect } from 'react'
import { Clock, Calendar, Save, Zap } from 'lucide-react'
import { Button, Input } from '../common'

interface ShiftData {
  default_working_hours: number
  break_duration_mins: number
  working_days: string
  allow_overtime: boolean
}

interface ShiftSettingsProps {
  initialData: ShiftData
  onSave: (data: ShiftData) => Promise<void>
  saving: boolean
}

const ALL_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export const ShiftSettings: React.FC<ShiftSettingsProps> = ({
  initialData,
  onSave,
  saving,
}) => {
  const [formData, setFormData] = useState<ShiftData>(initialData)

  useEffect(() => {
    setFormData(initialData)
  }, [initialData])

  const selectedDays = (formData.working_days || '')
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean)

  const handleDayToggle = (day: string) => {
    let nextDays: string[]
    if (selectedDays.includes(day)) {
      nextDays = selectedDays.filter((d) => d !== day)
    } else {
      nextDays = [...selectedDays, day]
    }
    setFormData({ ...formData, working_days: nextDays.join(',') })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-[#E5EAE4]">
        <div className="w-10 h-10 rounded-xl bg-[#075E54]/10 flex items-center justify-center text-[#075E54]">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#183B36]">Shift & Working Hours Policies</h2>
          <p className="text-xs text-[#78847F]">
            Configure organization default shift duration, meal breaks, and enterprise working calendar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Default Standard Working Hours / Shift"
          type="number"
          step="0.5"
          min={1}
          max={24}
          value={String(formData.default_working_hours || 8.5)}
          onChange={(e) =>
            setFormData({ ...formData, default_working_hours: Number(e.target.value) })
          }
          helperText="Standard shift duration (e.g. 8.5 hrs = 8h work + 30m buffer)."
          leftIcon={<Clock className="h-4 w-4 text-[#78847F]" />}
        />

        <Input
          label="Default Meal & Rest Break (minutes)"
          type="number"
          min={0}
          max={180}
          value={String(formData.break_duration_mins || 45)}
          onChange={(e) =>
            setFormData({ ...formData, break_duration_mins: Number(e.target.value) })
          }
          helperText="Standard break allocation deducted or monitored per shift."
        />
      </div>

      {/* Working Days */}
      <div className="p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#075E54]" />
            <span className="text-xs font-bold text-[#183B36]">Standard Enterprise Working Days</span>
          </div>
          <span className="text-xs font-semibold text-[#075E54]">
            {selectedDays.length} Days / Week
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
          {ALL_DAYS.map((day) => {
            const isChecked = selectedDays.includes(day)
            return (
              <button
                type="button"
                key={day}
                onClick={() => handleDayToggle(day)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors text-center ${
                  isChecked
                    ? 'bg-[#075E54] text-white border-[#075E54] shadow-xs'
                    : 'bg-white text-[#78847F] border-[#E5EAE4] hover:border-[#075E54]/40'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Shift Policies */}
      <div className="p-4 rounded-2xl border border-[#E5EAE4] bg-white space-y-3">
        <h3 className="text-xs font-bold text-[#183B36] uppercase tracking-wider flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#FF8B45]" />
          Shift Governance Policies
        </h3>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.allow_overtime}
            onChange={(e) => setFormData({ ...formData, allow_overtime: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded accent-[#075E54]"
          />
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#183B36]">
              Permit Overtime Compensation & Extended Shift Tracking
            </span>
            <p className="text-[11px] text-[#78847F]">
              Allow shifts exceeding {formData.default_working_hours} hours to calculate automatic
              overtime increments for payroll export.
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
          {saving ? 'Saving Policies...' : 'Save Shift Policies'}
        </Button>
      </div>
    </form>
  )
}
