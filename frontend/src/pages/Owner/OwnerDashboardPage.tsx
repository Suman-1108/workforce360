import React, { useState, useEffect } from 'react'
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Coffee,
  Calendar,
  Sparkles,
  Download,
  Plus,
  MapPin,
  CheckCircle2,
  XCircle,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  Layers,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { StatCard, ChartCard, DataTable, type Column } from '../../components/dashboard'
import { Button, Badge, Avatar, Modal } from '../../components/common'
import { reportsApi, leavesApi } from '../../services/api'

export interface OwnerDashboardPageProps {
  onNavigateToEmployees?: () => void
  onNavigateToAttendance?: () => void
  onNavigateToShifts?: () => void
  onNavigateToLeave?: () => void
}

interface RecentAttendanceRecord extends Record<string, unknown> {
  id: string
  name: string
  avatar?: string
  department: string
  shift: string
  time: string
  geofenceStatus: 'Verified' | 'Out of Bounds'
  selfieVerified: boolean
  status: 'Present' | 'Late' | 'Early Out' | 'Absent'
}

interface PendingLeaveRecord extends Record<string, unknown> {
  id: number
  name: string
  avatar?: string
  department: string
  type: string
  dates: string
  days: number
  reason: string
}

interface ShiftRosterItem {
  id: number
  name: string
  type: string
  start_time: string
  end_time: string
  count: number
}

interface WidgetPreferences {
  weeklyTrends: boolean
  departmentAllocation: boolean
  attendanceStream: boolean
  pendingLeaves: boolean
  shiftRosters: boolean
}

const DEFAULT_WIDGET_PREFS: WidgetPreferences = {
  weeklyTrends: true,
  departmentAllocation: true,
  attendanceStream: true,
  pendingLeaves: true,
  shiftRosters: true,
}

export const OwnerDashboardPage: React.FC<OwnerDashboardPageProps> = ({
  onNavigateToEmployees,
  onNavigateToAttendance,
  onNavigateToShifts,
  onNavigateToLeave,
}) => {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days'>('7days')
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false)

  // Widget visibility preferences persisted in localStorage
  const [widgetPrefs, setWidgetPrefs] = useState<WidgetPreferences>(() => {
    try {
      const saved = localStorage.getItem('wf360_dashboard_widgets')
      return saved ? JSON.parse(saved) : DEFAULT_WIDGET_PREFS
    } catch {
      return DEFAULT_WIDGET_PREFS
    }
  })

  // 1. KPI Summary Data from backend
  const [summaryData, setSummaryData] = useState({
    total_employees: 0,
    present_today: 0,
    absent_today: 0,
    late_arrivals: 0,
    on_leave: 0,
    active_shifts: 0,
    on_time_compliance_rate: 95.0,
  })

  // 2. 7-Day Attendance Trends for Recharts AreaChart
  const [dailyTrendsData, setDailyTrendsData] = useState<
    { day: string; date: string; present: number; late: number; absent: number }[]
  >([])

  // 3. Department distribution for Recharts BarChart
  const [departmentData, setDepartmentData] = useState<{ name: string; count: number }[]>([])

  // 4. Live Attendance Activity Stream
  const [attendanceRecords, setAttendanceRecords] = useState<RecentAttendanceRecord[]>([])

  // 5. Pending Leave Approvals
  const [leaveRequests, setLeaveRequests] = useState<PendingLeaveRecord[]>([])

  // 6. Shift distribution
  const [shiftRosters, setShiftRosters] = useState<ShiftRosterItem[]>([])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [summaryRes, trendsRes, deptRes, activityRes, leavesRes, shiftsRes] = await Promise.allSettled([
        reportsApi.getSummary(),
        reportsApi.getDailyTrends(),
        reportsApi.getDepartmentDistribution(),
        reportsApi.getRecentActivity(),
        leavesApi.list({ status: 'Pending' }),
        reportsApi.getShiftDistribution(),
      ])

      // 1. Summary
      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        setSummaryData(summaryRes.value)
      }

      // 2. Trends
      if (trendsRes.status === 'fulfilled' && Array.isArray(trendsRes.value)) {
        setDailyTrendsData(trendsRes.value)
      }

      // 3. Departments
      if (deptRes.status === 'fulfilled' && Array.isArray(deptRes.value)) {
        setDepartmentData(deptRes.value)
      }

      // 4. Recent Activity
      if (activityRes.status === 'fulfilled' && Array.isArray(activityRes.value)) {
        setAttendanceRecords(activityRes.value)
      }

      // 5. Pending Leaves
      if (leavesRes.status === 'fulfilled' && leavesRes.value) {
        const rawLeaves = leavesRes.value.items || (Array.isArray(leavesRes.value) ? leavesRes.value : [])
        const formattedLeaves: PendingLeaveRecord[] = rawLeaves.map((l: any) => {
          const empUser = l.employee?.user
          const empName = empUser
            ? `${empUser.first_name} ${empUser.last_name}`
            : l.employee?.designation
            ? `Staff (${l.employee.designation})`
            : `Employee #${l.employee_id}`
          const deptName = l.employee?.department?.name || 'Operations'
          const leaveTypeName = l.leave_type?.name || 'Leave'
          const startDateStr = l.start_date || ''
          const endDateStr = l.end_date || ''
          return {
            id: l.id,
            name: empName,
            avatar: empUser?.avatar_url,
            department: deptName,
            type: leaveTypeName,
            dates: startDateStr === endDateStr ? startDateStr : `${startDateStr} to ${endDateStr}`,
            days: l.total_days || 1,
            reason: l.reason || 'General request',
          }
        })
        setLeaveRequests(formattedLeaves)
      }

      // 6. Shifts
      if (shiftsRes.status === 'fulfilled' && Array.isArray(shiftsRes.value)) {
        setShiftRosters(shiftsRes.value)
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [dateRange])

  // Save widget preferences
  const handleToggleWidget = (key: keyof WidgetPreferences) => {
    setWidgetPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem('wf360_dashboard_widgets', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }

  // Handle Leave Actions (Approve / Reject)
  const handleApproveLeave = async (id: number) => {
    try {
      await leavesApi.action(id, 'Approved')
      setLeaveRequests((prev) => prev.filter((r) => r.id !== id))
      // Refresh summary
      reportsApi.getSummary().then((res) => {
        if (res) setSummaryData(res)
      })
    } catch (err) {
      console.error('Failed to approve leave request:', err)
    }
  }

  const handleRejectLeave = async (id: number) => {
    try {
      await leavesApi.action(id, 'Rejected', 'Request declined by organization owner.')
      setLeaveRequests((prev) => prev.filter((r) => r.id !== id))
      // Refresh summary
      reportsApi.getSummary().then((res) => {
        if (res) setSummaryData(res)
      })
    } catch (err) {
      console.error('Failed to reject leave request:', err)
    }
  }

  // Attendance Columns
  const attendanceColumns: Column<RecentAttendanceRecord>[] = [
    {
      key: 'name',
      header: 'Employee',
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar name={item.name} size="sm" />
          <div>
            <div className="font-bold text-[#183B36]">{item.name}</div>
            <div className="text-[10px] text-[#78847F]">{item.department}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'shift',
      header: 'Shift Window',
      render: (item) => <span className="font-medium text-[#183B36]">{item.shift}</span>,
    },
    {
      key: 'time',
      header: 'Check-In Timestamp',
      render: (item) => (
        <div className="font-mono text-xs font-semibold text-[#183B36]">{item.time}</div>
      ),
    },
    {
      key: 'geofenceStatus',
      header: 'GPS Geofence',
      render: (item) => (
        <Badge variant={item.geofenceStatus === 'Verified' ? 'info' : 'danger'} dot>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {item.geofenceStatus}
          </span>
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          variant={
            item.status === 'Present'
              ? 'success'
              : item.status === 'Late'
              ? 'warning'
              : 'danger'
          }
          dot
        >
          {item.status}
        </Badge>
      ),
    },
  ]

  // Formatted current date string
  const currentDateFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header with Action Shortcuts & Customization */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
              Organization Overview
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E6F3F1] text-[#075E54] border border-[#BDE0D9] flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#FF8B45]" />
              Real-time Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#78847F]">
            Today is {currentDateFormatted} &bull; Active telemetry synced with MySQL backend.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Selector */}
          <div className="flex items-center bg-white border border-[#CBD5C8] rounded-full p-1 text-xs font-semibold text-[#183B36]">
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                dateRange === 'today' ? 'bg-[#075E54] text-white shadow-xs' : 'text-[#78847F] hover:text-[#183B36]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('7days')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                dateRange === '7days' ? 'bg-[#075E54] text-white shadow-xs' : 'text-[#78847F] hover:text-[#183B36]'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateRange('30days')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                dateRange === '30days' ? 'bg-[#075E54] text-white shadow-xs' : 'text-[#78847F] hover:text-[#183B36]'
              }`}
            >
              30 Days
            </button>
          </div>

          {/* Customize Widgets Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomizeModalOpen(true)}
            leftIcon={<SlidersHorizontal className="h-3.5 w-3.5 text-[#075E54]" />}
            className="cursor-pointer"
          >
            Customize
          </Button>

          {/* Refresh Data Button */}
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-[#CBD5C8] text-[#183B36] hover:bg-[#F5F7F1] cursor-pointer transition-colors"
            title="Refresh analytics data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#075E54]' : ''}`} />
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToAttendance}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Export Attendance
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateToEmployees}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* 6 Core Operational KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Staff"
          value={summaryData.total_employees}
          icon={<Users className="h-5 w-5" />}
          variant="teal"
          trend={{ value: `${summaryData.total_employees} active`, isPositive: true, label: 'workforce' }}
        />
        <StatCard
          label="Present Today"
          value={summaryData.present_today}
          subValue={
            summaryData.total_employees > 0
              ? `${Math.round((summaryData.present_today / summaryData.total_employees) * 100)}%`
              : '0%'
          }
          icon={<UserCheck className="h-5 w-5" />}
          variant="emerald"
          trend={{ value: 'Live', isPositive: true, label: 'verified' }}
        />
        <StatCard
          label="Absent Today"
          value={summaryData.absent_today}
          icon={<UserX className="h-5 w-5" />}
          variant="rose"
          trend={{ value: 'Daily', isPositive: summaryData.absent_today === 0, label: 'unmarked' }}
        />
        <StatCard
          label="Late Arrivals"
          value={summaryData.late_arrivals}
          subValue="Grace"
          icon={<Clock className="h-5 w-5" />}
          variant="amber"
          trend={{ value: '15m grace', isPositive: false }}
        />
        <StatCard
          label="On Leave"
          value={summaryData.on_leave}
          subValue="Approved"
          icon={<Coffee className="h-5 w-5" />}
          variant="orange"
          trend={{ value: 'Scheduled', isPositive: true }}
        />
        <StatCard
          label="Active Shifts"
          value={summaryData.active_shifts}
          subValue="Facility"
          icon={<Calendar className="h-5 w-5" />}
          variant="purple"
          trend={{ value: 'Configured', isPositive: true }}
        />
      </div>

      {/* Primary Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Attendance Area Chart (8 Cols) */}
        {widgetPrefs.weeklyTrends && (
          <div className={widgetPrefs.departmentAllocation ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <ChartCard
              title="Weekly Attendance & Punctuality Trends"
              subtitle="Real-time validated attendance telemetry across branches"
              badge={
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {summaryData.on_time_compliance_rate}% Compliance
                </span>
              }
            >
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dailyTrendsData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#075E54" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#075E54" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF8B45" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#FF8B45" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EAE4" />
                    <XAxis
                      dataKey="day"
                      stroke="#78847F"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#78847F"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1px solid #E5EAE4',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="present"
                      name="Present Staff"
                      stroke="#075E54"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#presentGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="late"
                      name="Late Arrivals"
                      stroke="#FF8B45"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#lateGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        )}

        {/* Department Distribution Bar Chart (4 Cols) */}
        {widgetPrefs.departmentAllocation && (
          <div className={widgetPrefs.weeklyTrends ? 'lg:col-span-4' : 'lg:col-span-12'}>
            <ChartCard
              title="Department Allocation"
              subtitle="Staff headcount by business department"
            >
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentData}
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5EAE4" />
                    <XAxis type="number" stroke="#78847F" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#183B36"
                      fontSize={11}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1px solid #E5EAE4',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" name="Staff Members" fill="#075E54" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        )}
      </div>

      {/* Two-Column Operational Widgets: Recent Attendance + Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Live Attendance Feed (7 Cols) */}
        {widgetPrefs.attendanceStream && (
          <div className={widgetPrefs.pendingLeaves || widgetPrefs.shiftRosters ? 'lg:col-span-7' : 'lg:col-span-12'}>
            <DataTable
              title="Live Geofenced Attendance Stream"
              subtitle="Latest mobile GPS and selfie check-in verifications"
              columns={attendanceColumns}
              data={attendanceRecords}
              keyExtractor={(item) => item.id}
              searchKey="name"
              searchPlaceholder="Search checked-in staff..."
              pageSize={5}
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToAttendance}
                  rightIcon={<Eye className="h-3.5 w-3.5" />}
                >
                  View Full Feed
                </Button>
              }
            />
          </div>
        )}

        {/* Pending Leave Requests & Shifts Widget (5 Cols) */}
        {(widgetPrefs.pendingLeaves || widgetPrefs.shiftRosters) && (
          <div className={widgetPrefs.attendanceStream ? 'lg:col-span-5 space-y-6' : 'lg:col-span-12 space-y-6'}>
            {/* Pending Leave Approvals Card */}
            {widgetPrefs.pendingLeaves && (
              <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
                <div className="flex items-center justify-between pb-4 border-b border-[#E5EAE4] mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#183B36] tracking-tight">
                      Pending Leave Approvals
                    </h3>
                    <p className="text-xs text-[#78847F] mt-0.5">
                      Requires organizational owner action
                    </p>
                  </div>
                  <Badge variant="accent">{leaveRequests.length} Pending</Badge>
                </div>

                {leaveRequests.length > 0 ? (
                  <div className="space-y-3.5">
                    {leaveRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] text-xs hover:border-[#CBD5C8] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={req.name} size="xs" />
                            <div>
                              <span className="font-bold text-[#183B36]">{req.name}</span>
                              <span className="text-[10px] text-[#78847F] ml-1.5">
                                ({req.department})
                              </span>
                            </div>
                          </div>
                          <Badge variant="info" size="sm">
                            {req.type}
                          </Badge>
                        </div>

                        <p className="text-[11px] text-[#78847F] mb-3 italic">
                          "{req.reason}"
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-[#E5EAE4]/60">
                          <span className="text-[11px] font-semibold text-[#183B36]">
                            {req.dates} ({req.days} {req.days > 1 ? 'days' : 'day'})
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleRejectLeave(req.id)}
                              className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer flex items-center gap-1"
                            >
                              <XCircle className="h-3 w-3" /> Reject
                            </button>
                            <button
                              onClick={() => handleApproveLeave(req.id)}
                              className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Approve
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#78847F] text-xs">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                    <span className="font-semibold block">All requests reviewed!</span>
                    <span>No pending approvals in queue.</span>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-[#E5EAE4] text-center">
                  <button
                    onClick={onNavigateToLeave}
                    className="text-xs font-semibold text-[#075E54] hover:underline cursor-pointer"
                  >
                    View Complete Leave Ledger →
                  </button>
                </div>
              </div>
            )}

            {/* Active Shift Rosters Card */}
            {widgetPrefs.shiftRosters && (
              <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5EAE4] mb-3">
                  <h3 className="text-base font-bold text-[#183B36] tracking-tight">
                    Current Shift Rosters
                  </h3>
                  <button
                    onClick={onNavigateToShifts}
                    className="text-xs font-semibold text-[#075E54] hover:underline cursor-pointer"
                  >
                    Manage Shifts
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  {shiftRosters.length > 0 ? (
                    shiftRosters.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-[#183B36]">{s.name}</div>
                          <div className="text-[11px] text-[#78847F]">
                            {s.start_time} - {s.end_time} &bull; Type: {s.type}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-[#075E54] block">
                            {s.count} Staff
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            Active
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-[#78847F]">
                      <Calendar className="h-6 w-6 text-[#78847F] mx-auto mb-1 opacity-50" />
                      <span>No active shifts configured.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customize Widgets Modal */}
      <Modal
        isOpen={customizeModalOpen}
        onClose={() => setCustomizeModalOpen(false)}
        title="Customize Dashboard Layout"
        description="Choose which analytics widgets and feeds appear on your Organization Overview."
        size="sm"
      >
        <div className="space-y-3 py-2">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] cursor-pointer hover:bg-white transition-colors">
            <div className="flex items-center gap-2.5">
              <Layers className="h-4 w-4 text-[#075E54]" />
              <span className="text-xs font-bold text-[#183B36]">Weekly Attendance & Trends Chart</span>
            </div>
            <input
              type="checkbox"
              checked={widgetPrefs.weeklyTrends}
              onChange={() => handleToggleWidget('weeklyTrends')}
              className="accent-[#075E54] h-4 w-4 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] cursor-pointer hover:bg-white transition-colors">
            <div className="flex items-center gap-2.5">
              <Layers className="h-4 w-4 text-[#075E54]" />
              <span className="text-xs font-bold text-[#183B36]">Department Allocation Chart</span>
            </div>
            <input
              type="checkbox"
              checked={widgetPrefs.departmentAllocation}
              onChange={() => handleToggleWidget('departmentAllocation')}
              className="accent-[#075E54] h-4 w-4 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] cursor-pointer hover:bg-white transition-colors">
            <div className="flex items-center gap-2.5">
              <Layers className="h-4 w-4 text-[#075E54]" />
              <span className="text-xs font-bold text-[#183B36]">Live Geofence Attendance Stream</span>
            </div>
            <input
              type="checkbox"
              checked={widgetPrefs.attendanceStream}
              onChange={() => handleToggleWidget('attendanceStream')}
              className="accent-[#075E54] h-4 w-4 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] cursor-pointer hover:bg-white transition-colors">
            <div className="flex items-center gap-2.5">
              <Layers className="h-4 w-4 text-[#075E54]" />
              <span className="text-xs font-bold text-[#183B36]">Pending Leave Approvals Queue</span>
            </div>
            <input
              type="checkbox"
              checked={widgetPrefs.pendingLeaves}
              onChange={() => handleToggleWidget('pendingLeaves')}
              className="accent-[#075E54] h-4 w-4 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] cursor-pointer hover:bg-white transition-colors">
            <div className="flex items-center gap-2.5">
              <Layers className="h-4 w-4 text-[#075E54]" />
              <span className="text-xs font-bold text-[#183B36]">Active Shift Rosters Card</span>
            </div>
            <input
              type="checkbox"
              checked={widgetPrefs.shiftRosters}
              onChange={() => handleToggleWidget('shiftRosters')}
              className="accent-[#075E54] h-4 w-4 rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E5EAE4] flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCustomizeModalOpen(false)}
            className="cursor-pointer"
          >
            Save Preferences
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default OwnerDashboardPage
