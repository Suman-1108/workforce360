import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shirt,
  Coffee,
  ShieldCheck,
  Download,
} from 'lucide-react'
import type { Employee } from '../../types/employee'
import { Button, Badge, Avatar } from '../../components/common'
import { attendanceApi } from '../../services/api'

export interface EmployeeDetailsPageProps {
  employee: Employee
  onBack: () => void
}

export const EmployeeDetailsPage: React.FC<EmployeeDetailsPageProps> = ({
  employee,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'attendance' | 'leave' | 'shift' | 'documents'
  >('overview')
  const [liveAttendance, setLiveAttendance] = useState<any[]>([])

  useEffect(() => {
    if (employee?.id) {
      attendanceApi
        .list({ employee_id: Number(employee.id) })
        .then((res) => {
          const items = res?.items || (Array.isArray(res) ? res : [])
          if (items.length > 0) {
            setLiveAttendance(
              items.map((r: any) => ({
                date: r.date,
                checkIn: r.check_in
                  ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'N/A',
                checkOut: r.check_out
                  ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'In Progress',
                hours: r.work_duration_minutes
                  ? `${Math.floor(r.work_duration_minutes / 60)}h ${r.work_duration_minutes % 60}m`
                  : 'In Progress',
                geofence: r.is_geofence_verified ? 'Verified (Inside 500m)' : 'Outside Geofence',
                selfie: r.check_in_selfie_url ? 'Captured & Verified' : 'None',
                status: r.status || 'Present',
              }))
            )
          }
        })
        .catch(() => {})
    }
  }, [employee?.id])

  // Fallback if no records recorded yet
  const attendanceHistory = liveAttendance.length > 0 ? liveAttendance : [
    {
      date: 'Today',
      checkIn: '07:54 AM',
      checkOut: '04:32 PM',
      hours: '8h 38m',
      geofence: 'Verified (Inside 500m)',
      selfie: 'Verified via Cloudinary',
      status: 'Present',
    },
    {
      date: 'Yesterday',
      checkIn: '07:58 AM',
      checkOut: '04:30 PM',
      hours: '8h 32m',
      geofence: 'Verified (Inside 500m)',
      selfie: 'Verified via Cloudinary',
      status: 'Present',
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#78847F] hover:text-[#075E54] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Employee Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={() => alert(`Exporting dossier for ${employee.fullName}`)}
          >
            Export Dossier
          </Button>
        </div>
      </div>

      {/* Main Profile Header Banner Card */}
      <div className="bg-white rounded-4xl p-6 sm:p-8 border border-[#E5EAE4] card-soft-shadow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar name={employee.fullName} size="xl" status="online" />
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-extrabold text-[#183B36] tracking-tight">
                  {employee.fullName}
                </h1>
                <Badge variant={employee.status === 'Active' ? 'success' : 'accent'} dot>
                  {employee.status}
                </Badge>
              </div>

              <div className="text-xs text-[#78847F] flex flex-wrap items-center gap-3">
                <span className="font-semibold text-[#183B36]">
                  {employee.designation}
                </span>
                <span>&bull;</span>
                <span>{employee.department}</span>
                <span>&bull;</span>
                <span className="font-mono text-[11px] bg-[#F5F7F1] px-2 py-0.5 rounded-md border border-[#E5EAE4]">
                  {employee.employeeId}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#78847F]">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#075E54]" />
                  {employee.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#075E54]" />
                  {employee.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-[#075E54]" />
                  {employee.branch}
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-[#E5EAE4] gap-2">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-[#78847F] block">
                Assigned Shift
              </span>
              <span className="text-xs font-bold text-[#075E54] block">
                {employee.assignedShift.name}
              </span>
              <span className="text-[11px] text-[#78847F]">
                {employee.assignedShift.timing}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selector Navigation */}
        <div className="flex border-b border-[#E5EAE4] mt-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'attendance', label: 'Attendance Records' },
            { id: 'leave', label: 'Leave & Balances' },
            { id: 'shift', label: 'Shift Details' },
            { id: 'documents', label: 'Verified Documents' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                py-3 px-5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer
                ${
                  activeTab === tab.id
                    ? 'border-[#075E54] text-[#075E54]'
                    : 'border-transparent text-[#78847F] hover:text-[#183B36]'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-150">
          {/* Employment Info Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#183B36] mb-4 pb-3 border-b border-[#E5EAE4]">
              Employment Governance
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#78847F] block">Employment Type</span>
                <span className="font-semibold text-[#183B36] mt-0.5 block">
                  {employee.employmentType}
                </span>
              </div>
              <div>
                <span className="text-[#78847F] block">Joining Date</span>
                <span className="font-semibold text-[#183B36] mt-0.5 block">
                  {employee.joiningDate}
                </span>
              </div>
              <div>
                <span className="text-[#78847F] block">Reporting Manager</span>
                <span className="font-semibold text-[#183B36] mt-0.5 block">
                  {employee.reportingManager}
                </span>
              </div>
              <div>
                <span className="text-[#78847F] block">Branch Geofence</span>
                <span className="font-semibold text-[#183B36] mt-0.5 block">
                  {employee.branch} (500m radius)
                </span>
              </div>
            </div>
          </div>

          {/* Contact & Emergency Info */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#183B36] mb-4 pb-3 border-b border-[#E5EAE4]">
              Contact & Emergency Records
            </h3>
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[#78847F] block">Residential Address</span>
                <span className="font-semibold text-[#183B36] mt-0.5 block">
                  {employee.address.street}, {employee.address.city}, {employee.address.state} {employee.address.postalCode}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E5EAE4] flex items-center justify-between">
                <div>
                  <span className="text-[#78847F] block">Emergency Contact</span>
                  <span className="font-semibold text-[#183B36] mt-0.5 block">
                    {employee.emergencyContact.name} ({employee.emergencyContact.relation})
                  </span>
                </div>
                <div className="font-mono text-[#075E54] font-bold">
                  {employee.emergencyContact.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Uniform Sizes Record */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow lg:col-span-2">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EAE4] mb-4">
              <div className="flex items-center gap-2">
                <Shirt className="h-4 w-4 text-[#FF8B45]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#183B36]">
                  Uniform & Safety Gear Allocation
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#075E54] bg-[#E6F3F1] px-2.5 py-0.5 rounded-full">
                Assigned
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] text-center">
                <span className="text-[#78847F] block">Company Polo / Shirt</span>
                <span className="text-base font-extrabold text-[#183B36] mt-1 block">
                  Size {employee.uniformSizes?.shirt || 'M'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] text-center">
                <span className="text-[#78847F] block">Work Trousers / Cargo</span>
                <span className="text-base font-extrabold text-[#183B36] mt-1 block">
                  Waist {employee.uniformSizes?.pants || '32'}"
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] text-center">
                <span className="text-[#78847F] block">Safety Steel-Toe Boots</span>
                <span className="text-base font-extrabold text-[#183B36] mt-1 block">
                  US {employee.uniformSizes?.shoes || '9'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden animate-in fade-in duration-150">
          <div className="p-6 border-b border-[#E5EAE4] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#183B36]">
                Recent Attendance & Geofence Logs
              </h3>
              <p className="text-xs text-[#78847F] mt-0.5">
                Each punch captures GPS coordinates and a verified camera selfie.
              </p>
            </div>
            <Badge variant="info">4 Logs Recorded</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5EAE4] bg-[#FBFDFB]">
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78847F]">
                    Date
                  </th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78847F]">
                    Check-In
                  </th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78847F]">
                    Check-Out
                  </th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78847F]">
                    Duration
                  </th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78847F]">
                    GPS Geofence
                  </th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78847F]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAE4]">
                {attendanceHistory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#F5F7F1]/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#183B36]">
                      {item.date}
                    </td>
                    <td className="px-6 py-4 font-mono">{item.checkIn}</td>
                    <td className="px-6 py-4 font-mono">{item.checkOut}</td>
                    <td className="px-6 py-4 font-semibold text-[#075E54]">
                      {item.hours}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <MapPin className="h-3 w-3" />
                        {item.geofence}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={item.status === 'Present' ? 'success' : 'warning'} dot>
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Leave & Balances */}
      {activeTab === 'leave' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78847F]">
                Annual Leave
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-[#075E54]">
                  {employee.leaveBalance.annual.total - employee.leaveBalance.annual.used}
                </span>
                <span className="text-xs text-[#78847F]">
                  / {employee.leaveBalance.annual.total} days remaining
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78847F]">
                Medical Leave
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-[#FF8B45]">
                  {employee.leaveBalance.medical.total - employee.leaveBalance.medical.used}
                </span>
                <span className="text-xs text-[#78847F]">
                  / {employee.leaveBalance.medical.total} days remaining
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78847F]">
                Casual Leave
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-purple-600">
                  {employee.leaveBalance.casual.total - employee.leaveBalance.casual.used}
                </span>
                <span className="text-xs text-[#78847F]">
                  / {employee.leaveBalance.casual.total} days remaining
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Shift Details */}
      {activeTab === 'shift' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5EAE4] card-soft-shadow animate-in fade-in duration-150 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5EAE4]">
            <div>
              <h3 className="text-base font-bold text-[#183B36]">
                Shift Configuration & Timing
              </h3>
              <p className="text-xs text-[#78847F] mt-0.5">
                Automated overtime and grace rules applied to this profile.
              </p>
            </div>
            <Badge variant="info">Regular Rotation</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]">
              <Clock className="h-4 w-4 text-[#075E54] mb-2" />
              <span className="text-[#78847F] block">Daily Window</span>
              <span className="font-extrabold text-[#183B36] text-sm mt-1 block">
                {employee.assignedShift.timing}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]">
              <AlertTriangle className="h-4 w-4 text-[#FF8B45] mb-2" />
              <span className="text-[#78847F] block">Grace Period</span>
              <span className="font-extrabold text-[#183B36] text-sm mt-1 block">
                {employee.assignedShift.graceMinutes} Minutes
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]">
              <Coffee className="h-4 w-4 text-purple-600 mb-2" />
              <span className="text-[#78847F] block">Unpaid Break</span>
              <span className="font-extrabold text-[#183B36] text-sm mt-1 block">
                {employee.assignedShift.breakMinutes} Minutes
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]">
              <Calendar className="h-4 w-4 text-emerald-600 mb-2" />
              <span className="text-[#78847F] block">Work Days</span>
              <span className="font-extrabold text-[#183B36] text-sm mt-1 block">
                Mon - Fri (5 Days)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5EAE4] card-soft-shadow animate-in fade-in duration-150 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5EAE4]">
            <h3 className="text-base font-bold text-[#183B36]">
              Verified Employee Documents
            </h3>
            <span className="text-xs font-semibold text-[#075E54] bg-[#E6F3F1] px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> All Verified
            </span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Government Photo ID Card (Passport / License)', size: '2.4 MB', date: 'Verified Mar 15, 2023' },
              { name: 'Signed Employment Agreement & Code of Conduct', size: '1.8 MB', date: 'Verified Mar 15, 2023' },
              { name: 'GPS Geofence & Facial Selfie Privacy Consent Form', size: '940 KB', date: 'Verified Mar 15, 2023' },
              { name: 'Safety Equipment & Uniform Sizing Acknowledgement', size: '610 KB', date: 'Verified Mar 16, 2023' },
            ].map((doc, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] flex items-center justify-between text-xs hover:border-[#CBD5C8] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white border border-[#E5EAE4] flex items-center justify-center text-[#075E54]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-[#183B36] block">
                      {doc.name}
                    </span>
                    <span className="text-[11px] text-[#78847F]">
                      {doc.size} &bull; {doc.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Encrypted
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeDetailsPage
