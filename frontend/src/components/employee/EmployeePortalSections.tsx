import React, { useState, useEffect } from 'react'
import {
  Coffee,
  Utensils,
  Shirt,
  ClipboardList,
  LifeBuoy,
  Lock,
  Unlock,
  Landmark,
  Wallet,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react'
import { Button, Badge } from '../common'
import { leavesApi, portalApi } from '../../services/api'

// =============================================================================
// 1. TEA BREAK, LUNCH BREAK & TODAY'S UNIFORM SECTION (shown on Today tab)
// =============================================================================

export const BreaksAndUniformSection: React.FC = () => {
  const [breaksData, setBreaksData] = useState<{
    active_break: any | null
    breaks: any[]
    total_minutes: number
  }>({ active_break: null, breaks: [], total_minutes: 0 })
  const [breakSeconds, setBreakSeconds] = useState(0)
  const [breakBusy, setBreakBusy] = useState(false)
  const [breakError, setBreakError] = useState<string | null>(null)

  const [uniformToday, setUniformToday] = useState<any | null>(null)

  const loadData = async () => {
    try {
      const [brk, uni] = await Promise.all([
        portalApi.getTodayBreaks().catch(() => null),
        portalApi.getUniformToday().catch(() => null),
      ])
      if (brk) {
        setBreaksData(brk)
        if (brk.active_break?.start_time) {
          const diff = Math.max(
            0,
            Math.floor((Date.now() - new Date(brk.active_break.start_time).getTime()) / 1000)
          )
          setBreakSeconds(diff)
        } else {
          setBreakSeconds(0)
        }
      }
      if (uni) setUniformToday(uni)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!breaksData.active_break) return
    const timer = setInterval(() => setBreakSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [breaksData.active_break])

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handleStartBreak = async (type: 'Tea Break' | 'Lunch Break') => {
    setBreakBusy(true)
    setBreakError(null)
    try {
      await portalApi.startBreak({ break_type: type })
      await loadData()
    } catch (err: any) {
      setBreakError(err?.response?.data?.detail || err?.response?.data?.message || 'Could not start break.')
    } finally {
      setBreakBusy(false)
    }
  }

  const handleEndBreak = async () => {
    setBreakBusy(true)
    setBreakError(null)
    try {
      await portalApi.endBreak()
      await loadData()
    } catch (err: any) {
      setBreakError(err?.response?.data?.detail || err?.response?.data?.message || 'Could not end break.')
    } finally {
      setBreakBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Tea Break & Lunch Break Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#183B36] flex items-center gap-2">
              <Coffee className="h-4 w-4 text-[#FF8B45]" />
              Tea Break &amp; Lunch Break
            </h3>
            <p className="text-xs text-[#78847F] mt-0.5">
              Log your scheduled tea and lunch breaks during your shift.
            </p>
          </div>
          <Badge variant={breaksData.active_break ? 'warning' : 'neutral'} dot>
            {breaksData.active_break ? `On ${breaksData.active_break.break_type}` : `${breaksData.total_minutes}m today`}
          </Badge>
        </div>

        {breaksData.active_break ? (
          <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] space-y-3 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C]">
              Active {breaksData.active_break.break_type}
            </span>
            <div className="text-3xl font-black font-mono text-[#EA580C]">
              {formatTimer(breakSeconds)}
            </div>
            <Button
              variant="accent"
              size="sm"
              fullWidth
              isLoading={breakBusy}
              onClick={handleEndBreak}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              End {breaksData.active_break.break_type} &amp; Resume Shift
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={breakBusy}
              onClick={() => handleStartBreak('Tea Break')}
              className="p-4 rounded-2xl bg-[#FFF8F3] hover:bg-[#FFF0E6] border border-[#FFD4BA] text-left transition cursor-pointer group"
            >
              <div className="h-9 w-9 rounded-xl bg-[#FF8B45]/15 text-[#EA580C] flex items-center justify-center mb-2">
                <Coffee className="h-4.5 w-4.5" />
              </div>
              <div className="text-sm font-extrabold text-[#183B36]">Tea Break</div>
              <div className="text-[11px] text-[#78847F]">Tap to start break</div>
            </button>

            <button
              type="button"
              disabled={breakBusy}
              onClick={() => handleStartBreak('Lunch Break')}
              className="p-4 rounded-2xl bg-[#F2FAF8] hover:bg-[#E6F3F1] border border-[#BDE0D9] text-left transition cursor-pointer group"
            >
              <div className="h-9 w-9 rounded-xl bg-[#075E54]/15 text-[#075E54] flex items-center justify-center mb-2">
                <Utensils className="h-4.5 w-4.5" />
              </div>
              <div className="text-sm font-extrabold text-[#183B36]">Lunch Break</div>
              <div className="text-[11px] text-[#78847F]">Tap to start break</div>
            </button>
          </div>
        )}

        {breakError && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {breakError}
          </div>
        )}

        {/* Today's Break History */}
        <div className="pt-2 border-t border-[#E5EAE4] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#78847F]">
            <span>Today&apos;s Break Log</span>
            <span>Total: {breaksData.total_minutes} mins</span>
          </div>
          {breaksData.breaks.length === 0 ? (
            <p className="text-xs text-[#78847F] italic py-1">No breaks logged yet today.</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {breaksData.breaks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-[#F5F7F1] border border-[#E5EAE4]"
                >
                  <div className="flex items-center gap-2">
                    {b.break_type === 'Tea Break' ? (
                      <Coffee className="h-3.5 w-3.5 text-[#EA580C]" />
                    ) : (
                      <Utensils className="h-3.5 w-3.5 text-[#075E54]" />
                    )}
                    <span className="font-bold text-[#183B36]">{b.break_type}</span>
                    <span className="text-[11px] text-[#78847F]">
                      {b.start_time ? new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      {b.end_time ? ` – ${new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' (Active)'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[#075E54]">{b.duration_minutes}m</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Today's Uniform Schedule Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#183B36] flex items-center gap-2">
              <Shirt className="h-4 w-4 text-[#075E54]" />
              Today&apos;s Uniform &amp; Dress Code
            </h3>
            <p className="text-xs text-[#78847F] mt-0.5">
              Official uniform schedule published by your Organization Owner.
            </p>
          </div>
          <Badge variant="success" dot>
            {uniformToday?.date || 'Today'}
          </Badge>
        </div>

        <div className="p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#075E54]">
              Assigned Outfit Today
            </span>
            <div className="text-lg font-extrabold text-[#183B36] mt-0.5">
              {uniformToday?.uniform_title || 'Standard Operations Polo & Safety Gear'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-[#E5EAE4]">
              <span className="text-[10px] font-bold uppercase text-[#78847F] block">Dress Code</span>
              <span className="font-bold text-[#183B36]">{uniformToday?.dress_code || 'Smart Field Uniform'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#E5EAE4]">
              <span className="text-[10px] font-bold uppercase text-[#78847F] block">Color Theme</span>
              <span className="font-bold text-[#075E54]">{uniformToday?.color_theme || 'Forest Green & White'}</span>
            </div>
          </div>

          <div className="text-xs">
            <span className="text-[10px] font-bold uppercase text-[#78847F] block mb-1">
              Required Gear / Items
            </span>
            <p className="text-[#183B36] font-medium bg-white p-2.5 rounded-xl border border-[#E5EAE4]">
              {uniformToday?.items_required || 'Company Polo Shirt, ID Lanyard, Safety Footwear'}
            </p>
          </div>

          {uniformToday?.notes && (
            <div className="text-[11px] text-[#075E54] bg-[#E6F3F1] px-3 py-2 rounded-xl border border-[#BDE0D9] font-medium">
              <span className="font-bold">Note:</span> {uniformToday.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// 2. EMPLOYEE LEAVE APPLICATION & HISTORY TAB
// =============================================================================

export const EmployeeLeaveSection: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [leaveTypeId, setLeaveTypeId] = useState<number>(1)
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadLeaves = async () => {
    try {
      const [typesRes, reqRes] = await Promise.all([
        leavesApi.getTypes().catch(() => null),
        leavesApi.list().catch(() => null),
      ])
      const typesList = typesRes?.data || typesRes || []
      if (Array.isArray(typesList) && typesList.length > 0) {
        setLeaveTypes(typesList)
        setLeaveTypeId((prev) => (typesList.some((t: any) => t.id === prev) ? prev : typesList[0].id))
      }
      const reqList = reqRes?.data?.items || reqRes?.items || reqRes?.data || []
      if (Array.isArray(reqList)) {
        setRequests(reqList)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadLeaves()
  }, [])

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)
    try {
      await leavesApi.apply({
        leave_type_id: Number(leaveTypeId),
        start_date: startDate,
        end_date: endDate,
        reason,
      })
      setReason('')
      setFeedback({ type: 'success', text: 'Leave request submitted for Owner/Manager approval!' })
      await loadLeaves()
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.response?.data?.message || err?.response?.data?.detail || 'Failed to submit leave request.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Apply Leave Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5EAE4] card-soft-shadow space-y-5">
        <div>
          <h2 className="text-xl font-extrabold text-[#183B36] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#075E54]" />
            Apply for Leave
          </h2>
          <p className="text-xs text-[#78847F] mt-1">
            Submit a leave application directly to your organization&apos;s Owner &amp; HR portal.
          </p>
        </div>

        <form onSubmit={handleApplyLeave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#183B36] mb-1.5">Leave Type</label>
              <select
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(Number(e.target.value))}
                className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs font-semibold text-[#183B36]"
              >
                {(leaveTypes.length > 0
                  ? leaveTypes
                  : [
                      { id: 1, name: 'Casual Leave (CL)', days_allowed_per_year: 12 },
                      { id: 2, name: 'Medical / Sick Leave (SL)', days_allowed_per_year: 10 },
                      { id: 3, name: 'Earned Privilege Leave (PL)', days_allowed_per_year: 18 },
                    ]
                ).map((lt: any) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name} ({lt.days_allowed_per_year} days/yr)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#183B36] mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs text-[#183B36]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#183B36] mb-1.5">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs text-[#183B36]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#183B36] mb-1.5">Reason for Leave</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe your leave reason..."
              required
              className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-4 py-3 text-xs text-[#183B36]"
            />
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'bg-[#E6F3F1] text-[#075E54] border border-[#BDE0D9]'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<Send className="h-4 w-4" />}>
              Submit Leave Application
            </Button>
          </div>
        </form>
      </div>

      {/* My Submitted Leave Requests */}
      <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden">
        <div className="p-6 border-b border-[#E5EAE4] flex items-center justify-between">
          <h3 className="text-base font-bold text-[#183B36]">My Leave Applications</h3>
          <Badge variant="neutral">{requests.length} Total</Badge>
        </div>
        {requests.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#78847F]">
            You haven&apos;t applied for any leave yet.
          </div>
        ) : (
          <div className="divide-y divide-[#E5EAE4]">
            {requests.map((r: any) => (
              <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#183B36]">
                      {r.leave_type_name || r.leave_type || 'Leave Request'}
                    </span>
                    <span className="text-[11px] font-semibold text-[#075E54] bg-[#E6F3F1] px-2 py-0.5 rounded-full">
                      {r.total_days || 1} day(s)
                    </span>
                  </div>
                  <div className="text-xs text-[#78847F]">
                    {r.start_date} &rarr; {r.end_date} &bull; {r.reason}
                  </div>
                  {r.rejection_reason && (
                    <div className="text-[11px] text-rose-600 font-medium">
                      Owner Note: {r.rejection_reason}
                    </div>
                  )}
                </div>
                <Badge
                  variant={
                    r.status === 'Approved'
                      ? 'success'
                      : r.status === 'Rejected'
                      ? 'danger'
                      : 'warning'
                  }
                  dot
                >
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// 3. DAILY WORK UPDATES TAB
// =============================================================================

export const EmployeeWorkUpdatesSection: React.FC = () => {
  const [updates, setUpdates] = useState<any[]>([])
  const [taskTitle, setTaskTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [hoursSpent, setHoursSpent] = useState(2)
  const [progressStatus, setProgressStatus] = useState<'In Progress' | 'Completed' | 'Blocked'>('Completed')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const loadUpdates = async () => {
    try {
      const list = await portalApi.listWorkUpdates()
      if (Array.isArray(list)) setUpdates(list)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadUpdates()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMsg(null)
    try {
      await portalApi.createWorkUpdate({
        task_title: taskTitle,
        summary,
        hours_spent: Number(hoursSpent),
        progress_status: progressStatus,
      })
      setTaskTitle('')
      setSummary('')
      setHoursSpent(2)
      setMsg('Daily work update submitted to Owner dashboard!')
      await loadUpdates()
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || 'Failed to save work update.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5EAE4] card-soft-shadow space-y-5">
        <div>
          <h2 className="text-xl font-extrabold text-[#183B36] flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#075E54]" />
            Daily Work Update
          </h2>
          <p className="text-xs text-[#78847F] mt-1">
            Share your daily task progress, hours logged, and blockers with your Owner &amp; Manager.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-[#183B36] mb-1.5">Task / Work Title</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Site Inspection & Inventory Sync"
                required
                className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs text-[#183B36]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#183B36] mb-1.5">Hours Spent</label>
              <input
                type="number"
                min={0.5}
                max={24}
                step={0.5}
                value={hoursSpent}
                onChange={(e) => setHoursSpent(Number(e.target.value))}
                required
                className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs text-[#183B36]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#183B36] mb-1.5">Status</label>
              <select
                value={progressStatus}
                onChange={(e) => setProgressStatus(e.target.value as any)}
                className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs font-semibold text-[#183B36]"
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#183B36] mb-1.5">Work Details &amp; Summary</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe completed deliverables, milestones, or blockers..."
              required
              className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-4 py-3 text-xs text-[#183B36]"
            />
          </div>

          {msg && (
            <div className="p-3 rounded-xl bg-[#E6F3F1] border border-[#BDE0D9] text-xs font-semibold text-[#075E54]">
              {msg}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<Send className="h-4 w-4" />}>
              Post Work Update
            </Button>
          </div>
        </form>
      </div>

      {/* Work Update Timeline */}
      <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden">
        <div className="p-6 border-b border-[#E5EAE4] flex items-center justify-between">
          <h3 className="text-base font-bold text-[#183B36]">Recent Work Updates</h3>
          <Badge variant="neutral">{updates.length} Logged</Badge>
        </div>

        {updates.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#78847F]">
            No daily work updates submitted yet.
          </div>
        ) : (
          <div className="divide-y divide-[#E5EAE4]">
            {updates.map((u) => (
              <div key={u.id} className="p-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#183B36]">{u.task_title}</span>
                    <span className="text-[11px] font-mono font-bold text-[#075E54] bg-[#E6F3F1] px-2 py-0.5 rounded-full">
                      {u.hours_spent}h
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#78847F]">{u.date}</span>
                    <Badge
                      variant={
                        u.progress_status === 'Completed'
                          ? 'success'
                          : u.progress_status === 'Blocked'
                          ? 'danger'
                          : 'warning'
                      }
                      dot
                    >
                      {u.progress_status}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-[#4A5A55] leading-relaxed">{u.summary}</p>
                {u.owner_feedback && (
                  <div className="p-3 rounded-xl bg-[#F5F7F1] border border-[#CBD5C8] text-xs text-[#183B36] flex items-start gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-[#075E54] shrink-0 mt-0.5" />
                    <span>
                      <span className="font-bold text-[#075E54]">Owner Feedback:</span> {u.owner_feedback}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// 4. COMPLAINTS & RAISE SUPPORT TICKET TAB
// =============================================================================

export const EmployeeSupportSection: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([])
  const [category, setCategory] = useState<'Workplace' | 'Payroll' | 'HR' | 'Uniform & Gear' | 'IT & Equipment' | 'Safety' | 'Other'>('Workplace')
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const loadTickets = async () => {
    try {
      const list = await portalApi.listTickets()
      if (Array.isArray(list)) setTickets(list)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMsg(null)
    try {
      const created = await portalApi.createTicket({ category, priority, subject, description })
      setSubject('')
      setDescription('')
      setMsg(`Support ticket ${created?.ticket_number || ''} raised and routed to your Owner & HR team.`)
      await loadTickets()
    } catch (err: any) {
      setMsg(err?.response?.data?.detail || 'Failed to submit complaint/support ticket.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5EAE4] card-soft-shadow space-y-5">
        <div>
          <h2 className="text-xl font-extrabold text-[#183B36] flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-[#FF8B45]" />
            Complaints &amp; Support Desk
          </h2>
          <p className="text-xs text-[#78847F] mt-1">
            Raise a workplace complaint, payroll inquiry, or support ticket directly with management.
          </p>
        </div>

        <form onSubmit={handleRaiseTicket} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#183B36] mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs font-semibold text-[#183B36]"
              >
                <option value="Workplace">Workplace</option>
                <option value="Payroll">Payroll</option>
                <option value="HR">HR</option>
                <option value="Uniform & Gear">Uniform &amp; Gear</option>
                <option value="IT & Equipment">IT &amp; Equipment</option>
                <option value="Safety">Safety</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#183B36] mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs font-semibold text-[#183B36]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#183B36] mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief title of your complaint or support request"
              required
              className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-4 py-2.5 text-xs text-[#183B36]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#183B36] mb-1.5">Detailed Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the issue in detail so your Owner/HR can resolve it quickly..."
              required
              className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-4 py-3 text-xs text-[#183B36]"
            />
          </div>

          {msg && (
            <div className="p-3 rounded-xl bg-[#E6F3F1] border border-[#BDE0D9] text-xs font-semibold text-[#075E54]">
              {msg}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<Send className="h-4 w-4" />}>
              Raise Support Ticket
            </Button>
          </div>
        </form>
      </div>

      {/* My Raised Tickets */}
      <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden">
        <div className="p-6 border-b border-[#E5EAE4] flex items-center justify-between">
          <h3 className="text-base font-bold text-[#183B36]">My Raised Complaints &amp; Tickets</h3>
          <Badge variant="neutral">{tickets.length} Total</Badge>
        </div>

        {tickets.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#78847F]">
            No complaints or support tickets raised yet.
          </div>
        ) : (
          <div className="divide-y divide-[#E5EAE4]">
            {tickets.map((t) => (
              <div key={t.id} className="p-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#F5F7F1] text-[#075E54] border border-[#CBD5C8]">
                      {t.ticket_number}
                    </span>
                    <span className="font-bold text-sm text-[#183B36]">{t.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {t.category} &bull; {t.priority}
                    </span>
                    <Badge
                      variant={
                        t.status === 'Resolved' || t.status === 'Closed'
                          ? 'success'
                          : t.status === 'In Review'
                          ? 'warning'
                          : 'danger'
                      }
                      dot
                    >
                      {t.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-[#4A5A55]">{t.description}</p>
                {t.owner_response && (
                  <div className="p-3 rounded-xl bg-[#E6F3F1] border border-[#BDE0D9] text-xs text-[#183B36]">
                    <span className="font-bold text-[#075E54]">Owner / HR Response:</span> {t.owner_response}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// 5. PIN-PROTECTED SALARY DETAILS & COMPANY BANK ACCOUNT VAULT TAB
// =============================================================================

export const EmployeeFinanceVaultSection: React.FC = () => {
  const [vaultStatus, setVaultStatus] = useState<{
    has_pin_set: boolean
    company_bank_name?: string
    payroll_cycle?: string
  }>({ has_pin_set: false })
  const [pinInput, setPinInput] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [unlockedData, setUnlockedData] = useState<{
    company_bank: any
    salary: any
  } | null>(null)
  const [showAcctNumber, setShowAcctNumber] = useState(false)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadStatus = async () => {
    try {
      const st = await portalApi.getFinanceStatus()
      if (st) setVaultStatus(st)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const handleSetInitialPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    if (!/^\d{4,6}$/.test(newPin)) {
      setError('PIN must be 4 to 6 numeric digits.')
      return
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match.')
      return
    }
    setBusy(true)
    try {
      await portalApi.setFinancePin(newPin)
      setSuccessMsg('Security PIN set! Enter your PIN below to unlock Salary & Company Bank details.')
      setNewPin('')
      setConfirmPin('')
      await loadStatus()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to set security PIN.')
    } finally {
      setBusy(false)
    }
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await portalApi.unlockFinanceVault(pinInput)
      setUnlockedData({
        company_bank: res.company_bank,
        salary: res.salary,
      })
      setPinInput('')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Incorrect PIN. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleCopyAccount = (val: string) => {
    navigator.clipboard?.writeText(val).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const maskAcct = (num?: string) => {
    if (!num) return '••••-••••-••••'
    const clean = num.replace(/\s+/g, '')
    if (clean.length <= 4) return clean
    return `•••• •••• ${clean.slice(-4)}`
  }

  if (!unlockedData) {
    return (
      <div className="max-w-lg mx-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-4xl p-6 sm:p-8 border border-[#E5EAE4] card-soft-shadow text-center space-y-5">
          <div className="h-16 w-16 rounded-3xl bg-[#E6F3F1] text-[#075E54] flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-[#183B36]">
              Salary &amp; Company Bank Vault
            </h2>
            <p className="text-xs text-[#78847F] mt-1">
              {vaultStatus.has_pin_set
                ? 'Enter your 4–6 digit Security PIN to view confidential salary details and company bank account information.'
                : 'No Security PIN is configured yet. Create a 4–6 digit PIN to lock and unlock your salary & company bank details.'}
            </p>
          </div>

          {!vaultStatus.has_pin_set ? (
            <form onSubmit={handleSetInitialPin} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-bold text-[#183B36] mb-1">
                  Create 4–6 Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4–6 digits"
                  required
                  className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-4 py-3 text-center text-lg font-mono tracking-[0.4em] text-[#183B36]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#183B36] mb-1">
                  Confirm Security PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Re-enter PIN"
                  required
                  className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-4 py-3 text-center text-lg font-mono tracking-[0.4em] text-[#183B36]"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" fullWidth isLoading={busy} leftIcon={<KeyRound className="h-4 w-4" />}>
                Set Security PIN
              </Button>
            </form>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-4">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • •"
                required
                className="w-full rounded-2xl border-2 border-[#CBD5C8] focus:border-[#075E54] bg-[#F5F7F1] px-4 py-3.5 text-center text-2xl font-mono tracking-[0.5em] text-[#183B36] focus:outline-none"
              />

              {successMsg && (
                <div className="p-3 rounded-xl bg-[#E6F3F1] border border-[#BDE0D9] text-xs text-[#075E54] font-semibold">
                  {successMsg}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center justify-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" fullWidth isLoading={busy} leftIcon={<Unlock className="h-4 w-4" />}>
                Unlock Salary &amp; Bank Details
              </Button>
            </form>
          )}

          <div className="pt-2 text-[11px] text-[#78847F] flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#075E54]" />
            <span>Protected with PBKDF2-SHA256 PIN verification</span>
          </div>
        </div>
      </div>
    )
  }

  const sal = unlockedData.salary
  const bank = unlockedData.company_bank
  const curr = sal?.currency || 'USD'

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Unlocked Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#E6F3F1] border border-[#BDE0D9] rounded-3xl px-6 py-4">
        <div className="flex items-center gap-2.5 text-xs font-bold text-[#075E54]">
          <Unlock className="h-4 w-4" />
          <span>Salary &amp; Company Bank Vault Unlocked via Security PIN</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setUnlockedData(null)
            setShowAcctNumber(false)
          }}
          leftIcon={<Lock className="h-3.5 w-3.5" />}
        >
          Lock Vault
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Breakdown Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#183B36] flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#075E54]" />
                My Salary Details
              </h3>
              <p className="text-xs text-[#78847F] mt-0.5">
                {sal?.pay_frequency || 'Monthly'} Compensation Breakdown
              </p>
            </div>
            <Badge variant={sal?.payment_status === 'Paid' ? 'success' : 'warning'} dot>
              {sal?.payment_status || 'Paid'}
            </Badge>
          </div>

          <div className="p-5 rounded-2xl bg-[#183B36] text-white flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                Net Take-Home Pay
              </span>
              <div className="text-3xl font-black mt-1">
                {curr} {Number(sal?.net_salary || 0).toLocaleString()}
              </div>
            </div>
            <div className="text-right text-[11px] text-emerald-200">
              <div>Gross: {curr} {Number(sal?.gross_salary || 0).toLocaleString()}</div>
              <div>Last Paid: {sal?.last_paid_date || '--'}</div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#075E54]">Earnings</div>
            {[
              { label: 'Basic Salary', val: sal?.basic_salary },
              { label: 'HRA Allowance', val: sal?.hra_allowance },
              { label: 'Transport Allowance', val: sal?.transport_allowance },
              { label: 'Other Allowances', val: sal?.other_allowances },
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-1 border-b border-[#F0F3EE]">
                <span className="text-[#78847F]">{row.label}</span>
                <span className="font-mono font-bold text-[#183B36]">
                  +{curr} {Number(row.val || 0).toLocaleString()}
                </span>
              </div>
            ))}

            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 pt-2">Deductions</div>
            {[
              { label: 'Income Tax', val: sal?.tax_deduction },
              { label: 'Provident Fund (PF)', val: sal?.pf_deduction },
              { label: 'Other Deductions', val: sal?.other_deductions },
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-1 border-b border-[#F0F3EE] last:border-0">
                <span className="text-[#78847F]">{row.label}</span>
                <span className="font-mono font-bold text-rose-600">
                  -{curr} {Number(row.val || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Company Bank Account Details Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#183B36] flex items-center gap-2">
                <Landmark className="h-4 w-4 text-purple-600" />
                Company Bank Account Details
              </h3>
              <p className="text-xs text-[#78847F] mt-0.5">
                Official organization payroll &amp; reimbursement banking info.
              </p>
            </div>
            <Badge variant="success" dot>
              PIN Verified
            </Badge>
          </div>

          <div className="p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#78847F] block">Account Number</span>
                <span className="text-lg font-mono font-black text-[#183B36] tracking-wider">
                  {showAcctNumber ? bank?.account_number : maskAcct(bank?.account_number)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowAcctNumber((v) => !v)}
                  className="p-2 rounded-xl bg-white border border-[#CBD5C8] text-[#183B36] hover:bg-[#E6F3F1] cursor-pointer"
                  title={showAcctNumber ? 'Hide Account Number' : 'Reveal Account Number'}
                >
                  {showAcctNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyAccount(bank?.account_number || '')}
                  className="p-2 rounded-xl bg-white border border-[#CBD5C8] text-[#183B36] hover:bg-[#E6F3F1] cursor-pointer"
                  title="Copy Account Number"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            {copied && (
              <span className="text-[11px] font-bold text-[#075E54] block">Copied to clipboard!</span>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              { label: 'Bank Name', value: bank?.bank_name },
              { label: 'Account Holder', value: bank?.account_holder_name },
              { label: 'IFSC / Routing Code', value: bank?.ifsc_or_routing },
              { label: 'Branch Name', value: bank?.branch_name },
              { label: 'Account Type', value: bank?.account_type },
              { label: 'Payroll Cycle', value: bank?.payroll_cycle },
              { label: 'UPI / Payment Ref', value: bank?.upi_or_payment_ref || '—' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-[#F0F3EE] last:border-0">
                <span className="text-[#78847F]">{item.label}</span>
                <span className="font-bold text-[#183B36] text-right">{item.value}</span>
              </div>
            ))}
          </div>

          {sal?.employee_bank_name && (
            <div className="p-3.5 rounded-2xl bg-[#FBFDFB] border border-[#E5EAE4] text-xs space-y-1">
              <div className="text-[10px] font-bold uppercase text-[#075E54] flex items-center gap-1">
                <Clock className="h-3 w-3" /> Your Linked Payout Account
              </div>
              <div className="font-bold text-[#183B36]">
                {sal.employee_bank_name} &bull; {sal.employee_account_number}
              </div>
              {sal.employee_ifsc && <div className="text-[11px] text-[#78847F]">IFSC/SWIFT: {sal.employee_ifsc}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
