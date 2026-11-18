import React, { useState, useEffect } from 'react'
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Download,
} from 'lucide-react'
import { Button, Badge, Avatar } from '../../components/common'
import { leavesApi } from '../../services/api'

export interface LeaveRequest {
  id: string
  employeeName: string
  employeeId: string
  department: string
  leaveType: string
  startDate: string
  endDate: string
  daysCount: number
  reason: string
  appliedOn: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

export const LeavePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'balances' | 'holidays'>('pending')
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeaves = () => {
    setLoading(true)
    leavesApi
      .list()
      .then((data) => {
        const items = data?.items || (Array.isArray(data) ? data : [])
        setRequests(
          items.map((lv: any) => ({
            id: String(lv.id),
            employeeName:
              lv.employee_name ||
              (lv.employee?.user
                ? `${lv.employee.user.first_name} ${lv.employee.user.last_name}`
                : 'Staff Member'),
            employeeId: lv.employee_id_number || `EMP-${lv.employee_id}`,
            department: lv.department_name || lv.employee?.department?.name || 'General Operations',
            leaveType: lv.leave_type_name || lv.leave_type?.name || 'Annual Leave',
            startDate: String(lv.start_date || ''),
            endDate: String(lv.end_date || ''),
            daysCount: lv.total_days || 1,
            reason: lv.reason || 'Personal leave request',
            appliedOn: String(lv.applied_on || lv.created_at || '2026-11-17').slice(0, 10),
            status: lv.status || 'Pending',
          }))
        )
      })
      .catch((err) => {
        console.error('Failed to load leaves from API:', err)
        setRequests([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLeaves()
  }, [])

  const holidays = [
    { name: 'Thanksgiving Holiday', date: 'Nov 26, 2026', type: 'Public Holiday', day: 'Thursday' },
    { name: 'Day After Thanksgiving', date: 'Nov 27, 2026', type: 'Company Holiday', day: 'Friday' },
    { name: 'Christmas Eve (Half Day)', date: 'Dec 24, 2026', type: 'Company Observance', day: 'Thursday' },
    { name: 'Christmas Day', date: 'Dec 25, 2026', type: 'Public Holiday', day: 'Friday' },
    { name: "New Year's Day", date: 'Jan 01, 2027', type: 'Public Holiday', day: 'Friday' },
  ]

  const handleAction = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )
    try {
      await leavesApi.action(Number(id), newStatus)
      fetchLeaves()
      window.dispatchEvent(new Event('wf360:refresh-counts'))
    } catch (err) {
      console.error('Failed to update leave action on backend:', err)
    }
  }

  const pendingRequests = requests.filter((r) => r.status === 'Pending')
  const historyRequests = requests.filter((r) => r.status !== 'Pending')

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
              Leave & Absence Management
            </h1>
            <Badge variant="accent" dot>
              {pendingRequests.length} Pending Actions
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#78847F]">
            Review self-service employee leave applications, approve requests, and audit balance quotas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert('Downloading Leave Ledger CSV...')}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Export Leave Ledger
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5EAE4] bg-white rounded-3xl p-1.5 border card-soft-shadow">
        {[
          { id: 'pending', label: `Pending Approvals (${pendingRequests.length})` },
          { id: 'history', label: `Approval History (${historyRequests.length})` },
          { id: 'balances', label: 'Quota Categories & Balances' },
          { id: 'holidays', label: 'Company Holiday Calendar' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`
              flex-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center
              ${
                activeTab === tab.id
                  ? 'bg-[#075E54] text-white shadow-xs'
                  : 'text-[#78847F] hover:text-[#183B36] hover:bg-[#F5F7F1]'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content for TAB 1: Pending Requests */}
      {activeTab === 'pending' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {loading ? (
            <div className="bg-white rounded-3xl p-12 border border-[#E5EAE4] text-center text-[#78847F] text-xs font-semibold">
              Loading leave requests from database...
            </div>
          ) : pendingRequests.length > 0 ? (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <Avatar name={req.employeeName} size="md" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-[#183B36]">
                        {req.employeeName}
                      </span>
                      <span className="text-xs text-[#78847F]">
                        ({req.employeeId} &bull; {req.department})
                      </span>
                      <Badge variant="info" size="sm">
                        {req.leaveType}
                      </Badge>
                    </div>

                    <p className="text-xs text-[#183B36] font-medium mb-1">
                      Requested Duration:{' '}
                      <span className="font-bold text-[#075E54]">
                        {req.startDate} to {req.endDate} ({req.daysCount} {req.daysCount > 1 ? 'days' : 'day'})
                      </span>
                    </p>

                    <p className="text-xs text-[#78847F] italic bg-[#F5F7F1] p-2.5 rounded-xl border border-[#E5EAE4] inline-block">
                      "{req.reason}"
                    </p>

                    <span className="text-[10px] text-[#78847F] block mt-2">
                      Submitted on: {req.appliedOn}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(req.id, 'Rejected')}
                    leftIcon={<XCircle className="h-4 w-4 text-rose-600" />}
                    className="text-rose-700 hover:bg-rose-50 border-rose-200"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAction(req.id, 'Approved')}
                    leftIcon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  >
                    Approve Leave
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-[#E5EAE4] text-center text-[#78847F]">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#183B36] mb-1">
                Zero Pending Requests
              </h3>
              <p className="text-xs">
                All employee leave applications have been reviewed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Content for TAB 2: History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden animate-in fade-in duration-150">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5EAE4] bg-[#FBFDFB]">
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                  Employee
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                  Type
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                  Duration
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                  Reason
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAE4]">
              {historyRequests.map((req) => (
                <tr key={req.id} className="hover:bg-[#F5F7F1]/60 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#183B36]">
                    {req.employeeName}
                  </td>
                  <td className="px-6 py-4">{req.leaveType}</td>
                  <td className="px-6 py-4">
                    {req.startDate} to {req.endDate} ({req.daysCount}d)
                  </td>
                  <td className="px-6 py-4 text-[#78847F] max-w-xs truncate">
                    {req.reason}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={req.status === 'Approved' ? 'success' : 'danger'}>
                      {req.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Content for TAB 3: Balances */}
      {activeTab === 'balances' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
            <span className="text-xs font-bold uppercase tracking-wider text-[#075E54] bg-[#E6F3F1] px-2.5 py-1 rounded-full">
              Annual Paid Leave
            </span>
            <div className="text-3xl font-extrabold text-[#183B36] mt-4">
              18 Days
            </div>
            <p className="text-xs text-[#78847F] mt-1 leading-relaxed">
              Standard yearly earned paid time off. Carries over up to 5 days into following calendar year.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF8B45] bg-[#FFF0E6] px-2.5 py-1 rounded-full">
              Medical / Sick Leave
            </span>
            <div className="text-3xl font-extrabold text-[#183B36] mt-4">
              10 Days
            </div>
            <p className="text-xs text-[#78847F] mt-1 leading-relaxed">
              Requires certified medical practitioner note for absences exceeding 2 consecutive work days.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
              Casual & Emergency Leave
            </span>
            <div className="text-3xl font-extrabold text-[#183B36] mt-4">
              7 Days
            </div>
            <p className="text-xs text-[#78847F] mt-1 leading-relaxed">
              Flexible allowance for family emergencies, personal administrative tasks, or sudden personal obligations.
            </p>
          </div>
        </div>
      )}

      {/* Content for TAB 4: Holidays */}
      {activeTab === 'holidays' && (
        <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden animate-in fade-in duration-150">
          <div className="p-6 border-b border-[#E5EAE4] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#183B36]">
                Official Corporate Holiday Schedule (2026 - 2027)
              </h3>
              <p className="text-xs text-[#78847F] mt-0.5">
                Paid off-days automatically recognized by the attendance engine.
              </p>
            </div>
            <Badge variant="info">5 Upcoming</Badge>
          </div>

          <div className="divide-y divide-[#E5EAE4]">
            {holidays.map((h, i) => (
              <div key={i} className="p-4 sm:px-6 flex items-center justify-between text-xs hover:bg-[#F5F7F1]/60">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#E6F3F1] text-[#075E54] flex items-center justify-center font-bold">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-[#183B36] block">
                      {h.name}
                    </span>
                    <span className="text-[11px] text-[#78847F]">
                      {h.type} &bull; {h.day}
                    </span>
                  </div>
                </div>

                <span className="font-mono font-bold text-xs text-[#075E54]">
                  {h.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LeavePage
