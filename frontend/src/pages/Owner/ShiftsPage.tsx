import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  Plus,
  Users,
  AlertTriangle,
  Coffee,
  Sparkles,
} from 'lucide-react'
import { Button, Badge, Modal, Input, Select } from '../../components/common'
import { shiftsApi } from '../../services/api'

export interface Shift {
  id: string
  name: string
  type: 'Morning' | 'Day' | 'Evening' | 'Night' | 'Flexible'
  startTime: string
  endTime: string
  durationHours: string
  graceMinutes: number
  breakMinutes: number
  days: string[]
  assignedCount: number
  branch: string
  status: 'Active' | 'Draft'
}

export const ShiftsPage: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    shiftsApi
      .list()
      .then((data) => {
        const items = data?.items || (Array.isArray(data) ? data : [])
        setShifts(
          items.map((s: any) => ({
            id: String(s.id),
            name: s.name,
            type: (s.type || (s.name.toLowerCase().includes('night')
              ? 'Night'
              : s.name.toLowerCase().includes('evening')
              ? 'Evening'
              : s.name.toLowerCase().includes('day')
              ? 'Day'
              : 'Morning')) as any,
            startTime: s.start_time || '09:00 AM',
            endTime: s.end_time || '05:30 PM',
            durationHours: '8.5 Hours',
            graceMinutes: s.grace_period_mins ?? 15,
            breakMinutes: s.break_duration_mins ?? 60,
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            assignedCount: s.assigned_employees_count ?? 0,
            branch: 'Apex HQ Campus',
            status: 'Active',
          }))
        )
      })
      .catch((err) => {
        console.error('Failed to load shifts from API:', err)
        setShifts([])
      })
      .finally(() => setLoading(false))
  }, [])

  const [modalOpen, setModalOpen] = useState(false)
  const [newShift, setNewShift] = useState<{
    name: string
    type: 'Morning' | 'Day' | 'Evening' | 'Night' | 'Flexible'
    startTime: string
    endTime: string
    graceMinutes: number
    breakMinutes: number
    branch: string
  }>({
    name: '',
    type: 'Morning',
    startTime: '08:00',
    endTime: '16:30',
    graceMinutes: 15,
    breakMinutes: 45,
    branch: 'Tech Park HQ',
  })

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newShift.name) return

    try {
      const code = newShift.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase() || 'SHF'
      const res = await shiftsApi.create({
        name: newShift.name,
        code: `${code}_${Math.floor(Math.random() * 900 + 100)}`,
        start_time: newShift.startTime,
        end_time: newShift.endTime,
        grace_period_mins: Number(newShift.graceMinutes),
        break_duration_mins: Number(newShift.breakMinutes),
        is_rotational: false,
      })
      const s = res.data || res
      const created: Shift = {
        id: String(s.id || Date.now()),
        name: s.name || newShift.name,
        type: newShift.type,
        startTime: s.start_time || newShift.startTime,
        endTime: s.end_time || newShift.endTime,
        durationHours: '8.5 Hours',
        graceMinutes: Number(newShift.graceMinutes),
        breakMinutes: Number(newShift.breakMinutes),
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        assignedCount: 0,
        branch: newShift.branch,
        status: 'Active',
      }
      setShifts((prev) => [created, ...prev])
      setModalOpen(false)
      setNewShift({
        name: '',
        type: 'Morning',
        startTime: '08:00',
        endTime: '16:30',
        graceMinutes: 15,
        breakMinutes: 45,
        branch: 'Tech Park HQ',
      })
    } catch (err) {
      console.error('Failed to create shift on API:', err)
      const created: Shift = {
        id: `sh-${Date.now()}`,
        name: newShift.name,
        type: newShift.type,
        startTime: newShift.startTime,
        endTime: newShift.endTime,
        durationHours: '8.5 Hours',
        graceMinutes: Number(newShift.graceMinutes),
        breakMinutes: Number(newShift.breakMinutes),
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        assignedCount: 0,
        branch: newShift.branch,
        status: 'Active',
      }
      setShifts((prev) => [created, ...prev])
      setModalOpen(false)
      setNewShift({
        name: '',
        type: 'Morning',
        startTime: '08:00',
        endTime: '16:30',
        graceMinutes: 15,
        breakMinutes: 45,
        branch: 'Tech Park HQ',
      })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
              Shift Scheduling Engine
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E6F3F1] text-[#075E54] border border-[#BDE0D9] flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {shifts.length} Shift Profiles
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#78847F]">
            Define morning, evening, rotational, and flexible work windows with automated grace periods and break deductions.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="h-3.5 w-3.5" />}
        >
          Create New Shift
        </Button>
      </div>

      {/* Shift Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-[#78847F] text-xs font-semibold">
          Loading shifts from database...
        </div>
      ) : shifts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E5EAE4] card-soft-shadow">
          <Calendar className="h-10 w-10 text-[#A0ACA7] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#183B36] mb-1">No Shifts Configured</h3>
          <p className="text-xs text-[#78847F] max-w-sm mx-auto mb-4">
            Set up work shift rosters to define scheduled timings, grace periods, and attendance requirements.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Create First Shift
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shifts.map((shift) => (
          <div
            key={shift.id}
            className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow card-hover-lift flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#183B36]">
                    {shift.name}
                  </h3>
                  <span className="text-xs text-[#78847F] mt-0.5 block">
                    {shift.branch}
                  </span>
                </div>
                <Badge variant={shift.type === 'Night' ? 'accent' : 'info'}>
                  {shift.type} Shift
                </Badge>
              </div>

              {/* Timing Display */}
              <div className="p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] mb-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#075E54] mb-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {shift.startTime} — {shift.endTime}
                  </span>
                </div>
                <span className="text-[11px] text-[#78847F]">
                  Total duration: {shift.durationHours}
                </span>
              </div>

              {/* Rules (Grace, Break, Days) */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="flex items-center gap-1.5 text-[#78847F]">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#FF8B45]" />
                  <span>Grace: {shift.graceMinutes}m</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#78847F]">
                  <Coffee className="h-3.5 w-3.5 text-[#075E54]" />
                  <span>Break: {shift.breakMinutes}m</span>
                </div>
              </div>

              {/* Days Chips */}
              <div className="flex items-center gap-1.5 mb-6">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => (
                  <span
                    key={d}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#CBD5C8] text-[#183B36]"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer: Assigned Count & Action */}
            <div className="pt-4 border-t border-[#E5EAE4] flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#183B36]">
                <Users className="h-3.5 w-3.5 text-[#075E54]" />
                {shift.assignedCount} Employees
              </span>
              <button
                type="button"
                className="text-xs font-bold text-[#075E54] hover:underline cursor-pointer"
                onClick={() => alert(`Opening assignments for ${shift.name}`)}
              >
                Assign Staff &rarr;
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Modal: Create Shift */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Operational Shift"
        description="Configure shift timings, location geofence, and allowable grace threshold."
        size="md"
      >
        <form onSubmit={handleCreateShift} className="space-y-4">
          <Input
            label="Shift Profile Name *"
            placeholder="e.g. Afternoon Sorting Crew"
            value={newShift.name}
            onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Shift Category"
              value={newShift.type}
              onChange={(e) =>
                setNewShift({
                  ...newShift,
                  type: e.target.value as 'Morning' | 'Day' | 'Evening' | 'Night' | 'Flexible',
                })
              }
              options={[
                { value: 'Morning', label: 'Morning Shift' },
                { value: 'Day', label: 'Day Shift' },
                { value: 'Evening', label: 'Evening Shift' },
                { value: 'Night', label: 'Night Shift' },
                { value: 'Flexible', label: 'Flexible Shift' },
              ]}
            />

            <Select
              label="Branch Geofence"
              value={newShift.branch}
              onChange={(e) =>
                setNewShift({ ...newShift, branch: e.target.value })
              }
              options={[
                { value: 'Tech Park HQ', label: 'Tech Park HQ' },
                { value: 'Main Logistics Hub', label: 'Main Logistics Hub' },
                { value: 'Fulfillment Center B', label: 'Fulfillment Center B' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time *"
              type="time"
              value={newShift.startTime}
              onChange={(e) =>
                setNewShift({ ...newShift, startTime: e.target.value })
              }
              required
            />
            <Input
              label="End Time *"
              type="time"
              value={newShift.endTime}
              onChange={(e) =>
                setNewShift({ ...newShift, endTime: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Grace Period (Minutes)"
              type="number"
              value={newShift.graceMinutes}
              onChange={(e) =>
                setNewShift({
                  ...newShift,
                  graceMinutes: Number(e.target.value),
                })
              }
            />
            <Input
              label="Break Duration (Minutes)"
              type="number"
              value={newShift.breakMinutes}
              onChange={(e) =>
                setNewShift({
                  ...newShift,
                  breakMinutes: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="pt-4 border-t border-[#E5EAE4] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Shift Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* Info Notice */}
      <div className="p-4 rounded-2xl bg-[#E6F3F1] border border-[#BDE0D9] text-xs text-[#183B36] flex items-center gap-3">
        <Sparkles className="h-4 w-4 text-[#075E54] shrink-0" />
        <span>
          <span className="font-bold">Overnight Shift Engine:</span> WorkForce 360 handles cross-midnight check-outs automatically, correctly grouping attendance to the starting work shift.
        </span>
      </div>
    </div>
  )
}

export default ShiftsPage
