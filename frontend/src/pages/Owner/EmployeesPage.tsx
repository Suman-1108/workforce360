import React, { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Download,
  Search,
  Filter,
  Eye,
  Building,
  Calendar,
  Sparkles,
} from 'lucide-react'
import type { Employee, EmployeeStatus } from '../../types/employee'
import { Button, Badge, Avatar } from '../../components/common'
import { employeesApi } from '../../services/api'

export interface EmployeesPageProps {
  onAddEmployeeClick: () => void
  onViewEmployee: (employee: Employee) => void
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({
  onAddEmployeeClick,
  onViewEmployee,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  useEffect(() => {
    setLoading(true)
    employeesApi
      .list()
      .then((res) => {
        const items = res?.items || res?.data?.items || (Array.isArray(res) ? res : [])
        const mapped: Employee[] = items.map((it: any) => ({
          id: String(it.id),
          employeeId: it.employee_id_number || `EMP-${it.id}`,
          fullName:
            it.full_name ||
            it.name ||
            `${it.first_name || ''} ${it.last_name || ''}`.trim() ||
            'Unknown Employee',
          email: it.email || '',
          phone: it.phone || '+1 (555) 000-0000',
          department: it.department_name || 'General Operations',
          designation: it.designation || 'Team Member',
          branch: it.branch_name || 'Apex HQ Campus',
          joiningDate: it.joining_date || '2026-01-01',
          employmentType: it.employment_type || 'Full-time',
          status: (it.status as EmployeeStatus) || 'Active',
          avatarUrl:
            it.avatar_url ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          reportingManager: 'Organization Owner',
          assignedShift: {
            name: 'Standard Day Shift',
            timing: '09:00 AM - 06:00 PM',
            graceMinutes: 15,
            breakMinutes: 45,
          },
          address: {
            street: it.branch_name || 'Apex HQ Campus',
            city: 'Headquarters',
            state: '',
            postalCode: '',
          },
          emergencyContact: {
            name: 'Emergency Contact',
            relation: 'Family',
            phone: it.emergency_contact || 'Not provided',
          },
          leaveBalance: {
            annual: { total: 18, used: 4 },
            medical: { total: 10, used: 1 },
            casual: { total: 12, used: 2 },
          },
        }))
        setEmployees(mapped)
      })
      .catch((err) => {
        console.error('Failed to load employees:', err)
        setEmployees([])
      })
      .finally(() => setLoading(false))
  }, [])

  // Unique departments for filter
  const departments = ['All', ...Array.from(new Set(employees.map((e) => e.department)))]
  const statuses = ['All', 'Active', 'On Leave', 'Inactive', 'Probation']

  // Filtering
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDept =
      departmentFilter === 'All' || emp.department === departmentFilter

    const matchesStatus =
      statusFilter === 'All' || emp.status === statusFilter

    return matchesSearch && matchesDept && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Employee ID',
      'Full Name',
      'Email',
      'Phone',
      'Department',
      'Designation',
      'Branch',
      'Joining Date',
      'Employment Type',
      'Status',
    ]

    const rows = filteredEmployees.map((e) => [
      `"${e.employeeId}"`,
      `"${e.fullName}"`,
      `"${e.email}"`,
      `"${e.phone}"`,
      `"${e.department}"`,
      `"${e.designation}"`,
      `"${e.branch}"`,
      `"${e.joiningDate}"`,
      `"${e.employmentType}"`,
      `"${e.status}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `workforce360_employees_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusBadge = (status: EmployeeStatus) => {
    switch (status) {
      case 'Active':
        return <Badge variant="success" dot>Active</Badge>
      case 'On Leave':
        return <Badge variant="accent" dot>On Leave</Badge>
      case 'Probation':
        return <Badge variant="warning" dot>Probation</Badge>
      default:
        return <Badge variant="neutral" dot>Inactive</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
              Employee Directory
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E6F3F1] text-[#075E54] border border-[#BDE0D9] flex items-center gap-1">
              <Users className="h-3 w-3" />
              {filteredEmployees.length} Members
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#78847F]">
            Manage organization staff profiles, designated roles, geofence permissions, and shift schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onAddEmployeeClick}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Add New Employee
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#E5EAE4] card-soft-shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-center">
          {/* Search Box (6 cols) */}
          <div className="lg:col-span-6 relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78847F]" />
            <input
              type="text"
              placeholder="Search by name, employee ID, or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full bg-[#F5F7F1] text-xs text-[#183B36] placeholder-[#A0ACA7] pl-10 pr-4 py-2.5 rounded-full border border-[#CBD5C8] focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54]"
            />
          </div>

          {/* Department Filter (3 cols) */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 bg-[#F5F7F1] px-3.5 py-1.5 rounded-full border border-[#CBD5C8]">
              <Building className="h-3.5 w-3.5 text-[#78847F] shrink-0" />
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full bg-transparent text-xs text-[#183B36] font-medium focus:outline-none cursor-pointer"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === 'All' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Filter (3 cols) */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 bg-[#F5F7F1] px-3.5 py-1.5 rounded-full border border-[#CBD5C8]">
              <Filter className="h-3.5 w-3.5 text-[#78847F] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full bg-transparent text-xs text-[#183B36] font-medium focus:outline-none cursor-pointer"
              >
                {statuses.map((st) => (
                  <option key={st} value={st}>
                    {st === 'All' ? 'All Statuses' : st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Employee Table Card */}
      <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5EAE4] bg-[#FBFDFB]">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#78847F]">
                  Employee
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#78847F]">
                  ID
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#78847F]">
                  Department & Role
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#78847F]">
                  Branch Location
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#78847F]">
                  Joined
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#78847F]">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#78847F] text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAE4]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#78847F]">
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <Sparkles className="h-4 w-4 text-[#075E54] animate-spin" />
                      <span>Loading employees from live database...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-[#F5F7F1]/60 transition-colors group"
                  >
                    {/* Employee Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.fullName} size="sm" status="online" />
                        <div>
                          <div className="font-bold text-xs text-[#183B36] group-hover:text-[#075E54] transition-colors">
                            {emp.fullName}
                          </div>
                          <div className="text-[11px] text-[#78847F]">
                            {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Employee ID */}
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-[#183B36]">
                      {emp.employeeId}
                    </td>

                    {/* Department & Role */}
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-[#183B36]">
                        {emp.designation}
                      </div>
                      <div className="text-[11px] text-[#78847F]">
                        {emp.department} &bull; {emp.employmentType}
                      </div>
                    </td>

                    {/* Branch */}
                    <td className="px-6 py-4 text-xs text-[#183B36]">
                      <span className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-[#075E54]" />
                        {emp.branch}
                      </span>
                    </td>

                    {/* Joining Date */}
                    <td className="px-6 py-4 text-xs text-[#78847F]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {emp.joiningDate}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {getStatusBadge(emp.status)}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewEmployee(emp)}
                        leftIcon={<Eye className="h-3.5 w-3.5 text-[#075E54]" />}
                        className="text-xs font-semibold hover:bg-[#E6F3F1] text-[#075E54]"
                      >
                        Profile
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#78847F]">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-8 w-8 text-[#A0ACA7] mb-2" />
                      <span className="text-xs font-semibold">
                        No employees found matching the filters.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#E5EAE4] bg-[#FBFDFB] flex items-center justify-between text-xs text-[#78847F]">
            <span>
              Showing {((currentPage - 1) * pageSize) + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredEmployees.length)} of{' '}
              {filteredEmployees.length} employees
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-3 font-semibold text-[#183B36]">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Geofence Notice Banner */}
      <div className="p-4 rounded-2xl bg-[#FFF0E6] border border-[#FFD4BA] flex items-center gap-3 text-xs text-[#183B36]">
        <Sparkles className="h-4 w-4 text-[#FF8B45] shrink-0" />
        <span>
          <span className="font-bold">Automated Attendance Ready:</span> Each active employee can immediately use the mobile Employee Portal to log geofenced check-ins and camera selfies for their assigned shift.
        </span>
      </div>
    </div>
  )
}

export default EmployeesPage
