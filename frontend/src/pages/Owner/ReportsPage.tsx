import React, { useState, useEffect } from 'react'
import {
  Download,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Button, Badge } from '../../components/common'
import { ChartCard } from '../../components/dashboard'
import { reportsApi } from '../../services/api'

export const ReportsPage: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<'this_month' | 'last_month' | 'quarter'>('this_month')

  const defaultMonthlyReportData = [
    { week: 'Week 1', onTime: 94, late: 4, absent: 2 },
    { week: 'Week 2', onTime: 92, late: 6, absent: 2 },
    { week: 'Week 3', onTime: 91, late: 7, absent: 2 },
    { week: 'Week 4', onTime: 93, late: 5, absent: 2 },
  ]

  const [weeklyData, setWeeklyData] = useState(defaultMonthlyReportData)

  useEffect(() => {
    reportsApi
      .getWeeklyAttendance()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setWeeklyData(data)
        }
      })
      .catch((err) => console.error('Failed to load weekly attendance:', err))
  }, [selectedRange])

  const handleDownload = (reportName: string, format: 'csv' | 'xlsx') => {
    const csvContent =
      'data:text/csv;charset=utf-8,Metric,Week1,Week2,Week3,Week4\nOnTime,94%,92%,91%,93%\nLate,4%,6%,7%,5%\nAbsent,2%,2%,2%,2%\n'
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `workforce360_${reportName.toLowerCase().replace(/\s+/g, '_')}_${selectedRange}.${format}`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const reportsCatalog = [
    {
      title: 'Daily Master Attendance Telemetry',
      description: 'Includes GPS geofence timestamps, facial selfie validation IDs, and working durations.',
      metrics: '148 Active Records Daily',
      format: 'CSV / Excel',
    },
    {
      title: 'Late Arrivals & Punctuality Audit',
      description: 'Tracks recurring grace-period overages, tardiness patterns, and shift delay reasons.',
      metrics: '8 Incidents Recorded This Week',
      format: 'CSV / PDF',
    },
    {
      title: 'Department Absenteeism & Leave Ledger',
      description: 'Summary of annual, medical, and casual leave consumption per operational unit.',
      metrics: '12 Leaves Consumed in Nov',
      format: 'CSV / Excel',
    },
    {
      title: 'Shift Overtime & Payroll Hours',
      description: 'Payroll-ready export calculating total regular hours, break deductions, and authorized overtime.',
      metrics: '2,420 Hours Clocked',
      format: 'CSV / Excel',
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
              Reports & Operational Analytics
            </h1>
            <Badge variant="info">
              Payroll & Audit Ready
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#78847F]">
            Export verified workforce telemetry, late arrival metrics, and payroll-ready timesheets.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#E5EAE4] card-soft-shadow">
          <Calendar className="h-4 w-4 text-[#075E54] ml-2" />
          <select
            value={selectedRange}
            onChange={(e) =>
              setSelectedRange(e.target.value as 'this_month' | 'last_month' | 'quarter')
            }
            className="text-xs font-bold text-[#183B36] bg-transparent focus:outline-none cursor-pointer pr-2"
          >
            <option value="this_month">Current Month (November 2026)</option>
            <option value="last_month">Last Month (October 2026)</option>
            <option value="quarter">Q4 2026 Overview</option>
          </select>
        </div>
      </div>

      {/* Analytics Chart */}
      <ChartCard
        title="Punctuality & Shift Adherence Percentage"
        subtitle="Weekly distribution of on-time check-ins vs late arrivals"
      >
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5EAE4" />
              <XAxis dataKey="week" stroke="#78847F" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#78847F" fontSize={11} tickLine={false} axisLine={false} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E5EAE4',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="onTime" name="On-Time Attendance %" fill="#075E54" radius={[6, 6, 0, 0]} />
              <Bar dataKey="late" name="Late Arrivals %" fill="#FF8B45" radius={[6, 6, 0, 0]} />
              <Bar dataKey="absent" name="Absenteeism %" fill="#E5EAE4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Reports Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportsCatalog.map((rep, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-2xl bg-[#E6F3F1] text-[#075E54] flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F5F7F1] text-[#183B36] border border-[#CBD5C8]">
                  {rep.format}
                </span>
              </div>

              <h3 className="text-base font-bold text-[#183B36] mb-1.5">
                {rep.title}
              </h3>
              <p className="text-xs text-[#78847F] leading-relaxed mb-4">
                {rep.description}
              </p>
            </div>

            <div className="pt-4 border-t border-[#E5EAE4] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#075E54]">
                {rep.metrics}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(rep.title, 'csv')}
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                >
                  Download CSV
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ReportsPage
