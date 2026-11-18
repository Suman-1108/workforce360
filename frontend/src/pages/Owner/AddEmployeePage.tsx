import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  UserPlus,
  User,
  Briefcase,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Building,
  Lock,
} from 'lucide-react'
import { Button, Input, Select, PhoneInput } from '../../components/common'
import type { Employee, EmploymentType } from '../../types/employee'
import { employeesApi, organizationApi } from '../../services/api'

export interface AddEmployeePageProps {
  onBack: () => void
  onEmployeeCreated?: (employee: Partial<Employee>) => void
}

export const AddEmployeePage: React.FC<AddEmployeePageProps> = ({
  onBack,
  onEmployeeCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'employment' | 'contact'>('personal')
  const [completedSteps, setCompletedSteps] = useState<{ personal: boolean; employment: boolean }>({
    personal: false,
    employment: false,
  })
  const [orgName, setOrgName] = useState('WorkForce 360')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('wf360_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.tenant?.name) setOrgName(parsed.tenant.name)
        const ownerName = [parsed?.first_name, parsed?.last_name].filter(Boolean).join(' ').trim()
        if (ownerName) {
          setFormData((prev) => ({ ...prev, reportingManager: ownerName }))
        }
      }
    } catch {
      // ignore
    }
    organizationApi
      .getProfile()
      .then((res) => {
        const profile = res?.data ?? res
        if (profile?.name) setOrgName(profile.name)
      })
      .catch(() => {})
  }, [])

  // Form State
  const [formData, setFormData] = useState({
    // Personal
    fullName: '',
    email: '',
    phone: '',
    gender: 'Female',
    dateOfBirth: '1995-04-12',
    // Employment
    employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    department: 'Logistics',
    designation: 'Operations Specialist',
    branch: 'Tech Park HQ',
    joiningDate: new Date().toISOString().slice(0, 10),
    employmentType: 'Full-time' as EmploymentType,
    reportingManager: 'Organization Owner',
    // Contact
    street: '',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60601',
    emergencyName: '',
    emergencyRelation: 'Spouse',
    emergencyPhone: '',
  })

  const validatePersonalStep = (): boolean => {
    setErrorMessage('')
    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter the employee Full Name to continue.')
      return false
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setErrorMessage('Please enter a valid Work Email address to continue.')
      return false
    }
    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 7) {
      setErrorMessage('Please enter a valid Mobile Number to continue.')
      return false
    }
    return true
  }

  const validateEmploymentStep = (): boolean => {
    setErrorMessage('')
    if (!formData.employeeId.trim()) {
      setErrorMessage('Please specify an Employee ID to continue.')
      return false
    }
    if (!formData.designation.trim()) {
      setErrorMessage('Please enter the Designation / Job Role to continue.')
      return false
    }
    if (!formData.joiningDate) {
      setErrorMessage('Please select a Joining Date to continue.')
      return false
    }
    return true
  }

  const handleNextStep = () => {
    if (activeTab === 'personal') {
      if (!validatePersonalStep()) return
      setCompletedSteps((prev) => ({ ...prev, personal: true }))
      setActiveTab('employment')
    } else if (activeTab === 'employment') {
      if (!validateEmploymentStep()) return
      setCompletedSteps((prev) => ({ ...prev, employment: true }))
      setActiveTab('contact')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!validatePersonalStep()) {
      setActiveTab('personal')
      return
    }

    if (!validateEmploymentStep()) {
      setActiveTab('employment')
      return
    }

    setIsLoading(true)
    const names = formData.fullName.trim().split(/\s+/)
    const firstName = names[0] || 'Employee'
    const lastName = names.slice(1).join(' ') || 'Member'

    try {
      await employeesApi.create({
        first_name: firstName,
        last_name: lastName,
        email: formData.email.trim(),
        phone: formData.phone || undefined,
        employee_id_number: formData.employeeId.trim(),
        designation: formData.designation.trim(),
        employment_type: formData.employmentType,
        joining_date: formData.joiningDate,
        emergency_contact: formData.emergencyPhone?.trim() || undefined,
        department_id: 1,
        branch_id: 1,
      })
      setIsLoading(false)
      window.dispatchEvent(new Event('wf360:refresh-counts'))
      setSuccessMessage(
        `Employee ${formData.fullName} (${formData.employeeId}) enrolled! Login email & password sent to ${formData.email.trim()}.`
      )
      onEmployeeCreated?.({
        fullName: formData.fullName,
        email: formData.email.trim(),
        phone: formData.phone,
        employeeId: formData.employeeId,
        department: formData.department,
        designation: formData.designation,
        branch: formData.branch,
        joiningDate: formData.joiningDate,
        status: 'Active',
      })
      setTimeout(() => {
        onBack()
      }, 1800)
    } catch (err: any) {
      setIsLoading(false)
      const data = err.response?.data
      const fieldErrors = data?.details?.fields
        ? Object.entries(data.details.fields)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
        : ''
      const msg =
        data?.message ||
        data?.detail ||
        'Failed to enroll employee. Please verify details.'
      setErrorMessage(fieldErrors ? `${msg} (${fieldErrors})` : msg)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#78847F] hover:text-[#075E54] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Employee Directory</span>
        </button>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#E6F3F1] text-[#075E54] border border-[#BDE0D9] flex items-center gap-1.5">
          <Building className="h-3.5 w-3.5" />
          Tenant: {orgName}
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
          Add New Employee
        </h1>
        <p className="text-xs sm:text-sm text-[#78847F] mt-1">
          Enroll an employee into your tenant workspace, assign shifts, geofences, and initial leave quotas.
        </p>
      </div>

      {/* Notification Banners */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-4xl border border-[#E5EAE4] card-soft-shadow overflow-hidden">
        {/* Guided Step Progress Header (no manual skipping ahead) */}
        <div className="flex border-b border-[#E5EAE4] bg-[#FBFDFB]">
          <div
            className={`
              flex-1 py-4 px-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 select-none
              ${
                activeTab === 'personal'
                  ? 'border-[#075E54] text-[#075E54] bg-white'
                  : completedSteps.personal
                  ? 'border-emerald-500 text-emerald-700 bg-emerald-50/40'
                  : 'border-transparent text-[#78847F]'
              }
            `}
          >
            {completedSteps.personal && activeTab !== 'personal' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <User className="h-4 w-4" />
            )}
            <span>1. Personal Information</span>
          </div>

          <div
            className={`
              flex-1 py-4 px-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 select-none
              ${
                activeTab === 'employment'
                  ? 'border-[#075E54] text-[#075E54] bg-white'
                  : completedSteps.employment
                  ? 'border-emerald-500 text-emerald-700 bg-emerald-50/40'
                  : 'border-transparent text-[#A0ABA6]'
              }
            `}
          >
            {completedSteps.employment && activeTab !== 'employment' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : !completedSteps.personal && activeTab !== 'employment' ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Briefcase className="h-4 w-4" />
            )}
            <span>2. Employment Details</span>
          </div>

          <div
            className={`
              flex-1 py-4 px-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 select-none
              ${
                activeTab === 'contact'
                  ? 'border-[#075E54] text-[#075E54] bg-white'
                  : 'border-transparent text-[#A0ABA6]'
              }
            `}
          >
            {!completedSteps.employment && activeTab !== 'contact' ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <PhoneCall className="h-4 w-4" />
            )}
            <span>3. Contact &amp; Emergency</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-6">
          {/* TAB 1: Personal Info */}
          {activeTab === 'personal' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Maya Lin"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
                <Input
                  label="Work Email *"
                  type="email"
                  placeholder="maya.lin@acmeglobal.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
                <PhoneInput
                  label="Mobile Number"
                  value={formData.phone}
                  onChange={(val) => setFormData({ ...formData, phone: val })}
                  required
                  showTypeBadge
                />

                <Select
                  label="Gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  options={[
                    { value: 'Female', label: 'Female' },
                    { value: 'Male', label: 'Male' },
                    { value: 'Non-binary', label: 'Non-binary' },
                    { value: 'Other', label: 'Prefer not to say' },
                  ]}
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#183B36] block">
                    Facial Verification Camera Enrollment
                  </span>
                  <span className="text-[11px] text-[#78847F]">
                    Employee will take a baseline selfie upon first login via the Employee Portal.
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6F3F1] text-[#075E54] border border-[#BDE0D9]">
                  Cloudinary Ready
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Employment Info */}
          {activeTab === 'employment' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Employee ID *"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  required
                />
                <Input
                  label="Designation / Job Role *"
                  placeholder="e.g. Senior Operations Analyst"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Select
                  label="Department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  options={[
                    { value: 'Logistics', label: 'Logistics' },
                    { value: 'Operations', label: 'Operations' },
                    { value: 'Engineering', label: 'Engineering' },
                    { value: 'Customer Care', label: 'Customer Care' },
                    { value: 'HR & People', label: 'HR & People' },
                  ]}
                />

                <Select
                  label="Branch Geofence"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  options={[
                    { value: 'Tech Park HQ', label: 'Tech Park HQ (500m radius)' },
                    { value: 'Main Logistics Hub', label: 'Main Logistics Hub (1000m radius)' },
                    { value: 'Fulfillment Center B', label: 'Fulfillment Center B (800m radius)' },
                  ]}
                />

                <Select
                  label="Employment Type"
                  value={formData.employmentType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employmentType: e.target.value as 'Full-time' | 'Part-time' | 'Contract' | 'Intern',
                    })
                  }
                  options={[
                    { value: 'Full-time', label: 'Full-time' },
                    { value: 'Part-time', label: 'Part-time' },
                    { value: 'Contract', label: 'Contract' },
                    { value: 'Intern', label: 'Intern' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Joining Date"
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                />
                <Input
                  label="Reporting Manager"
                  placeholder="e.g. Marcus Vance"
                  value={formData.reportingManager}
                  onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* TAB 3: Contact & Emergency */}
          {activeTab === 'contact' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <Input
                label="Street Address"
                placeholder="123 Corporate Way, Suite 400"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Input
                  label="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <Input
                  label="State / Province"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
                <Input
                  label="Postal Code"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-[#E5EAE4]">
                <h4 className="text-xs font-bold text-[#183B36] uppercase tracking-wider mb-4">
                  Emergency Contact Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <Input
                    label="Contact Name"
                    placeholder="e.g. Sarah Lin"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                  />
                  <Input
                    label="Relationship"
                    placeholder="e.g. Spouse / Sibling"
                    value={formData.emergencyRelation}
                    onChange={(e) => setFormData({ ...formData, emergencyRelation: e.target.value })}
                  />
                  <PhoneInput
                    label="Emergency Phone"
                    value={formData.emergencyPhone}
                    onChange={(val) => setFormData({ ...formData, emergencyPhone: val })}
                    showTypeBadge
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-6 border-t border-[#E5EAE4] flex flex-wrap items-center justify-between gap-3">
            <div>
              {activeTab !== 'personal' ? (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => {
                    if (activeTab === 'contact') setActiveTab('employment')
                    if (activeTab === 'employment') setActiveTab('personal')
                  }}
                >
                  Previous Step
                </Button>
              ) : (
                <Button type="button" variant="ghost" size="md" onClick={onBack}>
                  Cancel
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {activeTab !== 'contact' ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleNextStep}
                >
                  Continue to Next Step
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  isLoading={isLoading}
                  leftIcon={<UserPlus className="h-4 w-4" />}
                >
                  Save & Enroll Employee
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEmployeePage
