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
  Save,
  Shirt,
  FileCheck,
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

  // Form State with Comprehensive Employee Details
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    phone: '',
    gender: 'Female',
    dateOfBirth: '1995-04-12',
    bloodGroup: 'O+',

    // Employment Details
    employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    department: 'Operations',
    designation: 'Operations Specialist',
    branch: 'Apex HQ Campus',
    shiftName: 'Standard Day Shift',
    salary: '85000',
    joiningDate: new Date().toISOString().slice(0, 10),
    employmentType: 'Full-time' as EmploymentType,
    reportingManager: 'Organization Owner',

    // Contact & Uniform Details
    street: '',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60601',
    emergencyName: '',
    emergencyRelation: 'Spouse',
    emergencyPhone: '',
    shirtSize: 'M',
    pantsSize: '32',
    shoeSize: '9',
  })

  const validatePersonalStep = (): boolean => {
    setErrorMessage('')
    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter the employee Full Name in Personal Information.')
      return false
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setErrorMessage('Please enter a valid Work Email address in Personal Information.')
      return false
    }
    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 7) {
      setErrorMessage('Please enter a valid Mobile Number in Personal Information.')
      return false
    }
    return true
  }

  const validateEmploymentStep = (): boolean => {
    setErrorMessage('')
    if (!formData.employeeId.trim()) {
      setErrorMessage('Please specify an Employee ID in Employment Details.')
      return false
    }
    if (!formData.designation.trim()) {
      setErrorMessage('Please enter the Designation / Job Role in Employment Details.')
      return false
    }
    if (!formData.joiningDate) {
      setErrorMessage('Please select a Joining Date in Employment Details.')
      return false
    }
    return true
  }

  const handleManualSave = async () => {
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
        salary: formData.salary ? Number(formData.salary) : undefined,
        emergency_contact: formData.emergencyPhone?.trim() || undefined,
        department_id: 1,
        branch_id: 1,
        shift_name: formData.shiftName,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postalCode,
        uniform_shirt: formData.shirtSize,
        uniform_pants: formData.pantsSize,
        uniform_shoes: formData.shoeSize,
        blood_group: formData.bloodGroup,
      })

      setIsLoading(false)
      window.dispatchEvent(new Event('wf360:refresh-counts'))
      setSuccessMessage(
        `Employee ${formData.fullName} (${formData.employeeId}) successfully enrolled! Credentials and "Verified Employee Documents Upload" link have been sent to ${formData.email.trim()}.`
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
      }, 2000)
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
      {/* Top Navigation Bar */}
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

      {/* Page Header with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
            Add New Employee
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="accent"
            size="md"
            isLoading={isLoading}
            onClick={handleManualSave}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Employee
          </Button>
        </div>
      </div>

      {/* Notification Banners */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-4xl border border-[#E5EAE4] card-soft-shadow overflow-hidden">
        {/* Step Navigation Tabs — Freely clickable */}
        <div className="flex border-b border-[#E5EAE4] bg-[#FBFDFB]">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`
              flex-1 py-4 px-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer
              ${
                activeTab === 'personal'
                  ? 'border-[#075E54] text-[#075E54] bg-white'
                  : 'border-transparent text-[#78847F] hover:text-[#183B36] hover:bg-white/50'
              }
            `}
          >
            <User className="h-4 w-4" />
            <span>1. Personal Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('employment')}
            className={`
              flex-1 py-4 px-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer
              ${
                activeTab === 'employment'
                  ? 'border-[#075E54] text-[#075E54] bg-white'
                  : 'border-transparent text-[#78847F] hover:text-[#183B36] hover:bg-white/50'
              }
            `}
          >
            <Briefcase className="h-4 w-4" />
            <span>2. Employment Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`
              flex-1 py-4 px-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer
              ${
                activeTab === 'contact'
                  ? 'border-[#075E54] text-[#075E54] bg-white'
                  : 'border-transparent text-[#78847F] hover:text-[#183B36] hover:bg-white/50'
              }
            `}
          >
            <PhoneCall className="h-4 w-4" />
            <span>3. Contact &amp; Documents</span>
          </button>
        </div>

        {/* Form Body — Enter key disabled to prevent auto-submitting */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleManualSave()
          }}
          onKeyDown={(e) => {
            // Prevent accidental submit when typing details and pressing Enter
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
              e.preventDefault()
            }
          }}
          className="p-6 sm:p-10 space-y-6"
        >
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
                  placeholder="maya.lin@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
                <PhoneInput
                  label="Mobile Number *"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
                <Select
                  label="Blood Group"
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  options={[
                    { value: 'O+', label: 'O Positive (O+)' },
                    { value: 'O-', label: 'O Negative (O-)' },
                    { value: 'A+', label: 'A Positive (A+)' },
                    { value: 'A-', label: 'A Negative (A-)' },
                    { value: 'B+', label: 'B Positive (B+)' },
                    { value: 'B-', label: 'B Negative (B-)' },
                    { value: 'AB+', label: 'AB Positive (AB+)' },
                    { value: 'AB-', label: 'AB Negative (AB-)' },
                  ]}
                />

                <div className="p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]">
                  <span className="text-xs font-bold text-[#183B36] block">
                    Facial Verification Camera Enrollment
                  </span>
                  <span className="text-[11px] text-[#78847F]">
                    Baseline selfie captured during employee's first live punch on the Employee Portal.
                  </span>
                </div>
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
                  placeholder="e.g. Operations Specialist"
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
                    { value: 'Operations', label: 'Operations' },
                    { value: 'Engineering', label: 'Engineering' },
                    { value: 'Logistics', label: 'Logistics' },
                    { value: 'Customer Care', label: 'Customer Care' },
                    { value: 'HR & People', label: 'HR & People' },
                  ]}
                />

                <Select
                  label="Assigned Shift"
                  value={formData.shiftName}
                  onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })}
                  options={[
                    { value: 'Standard Day Shift', label: 'Standard Day Shift (09:00 AM – 06:00 PM)' },
                    { value: 'Morning Shift', label: 'Morning Shift (06:00 AM – 02:30 PM)' },
                    { value: 'Evening Shift', label: 'Evening Shift (02:00 PM – 10:30 PM)' },
                    { value: 'Night Shift', label: 'Night Shift (10:00 PM – 06:30 AM)' },
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Select
                  label="Branch Geofence"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  options={[
                    { value: 'Apex HQ Campus', label: 'Apex HQ Campus (500m radius)' },
                    { value: 'Main Logistics Hub', label: 'Main Logistics Hub (1000m radius)' },
                    { value: 'Fulfillment Center B', label: 'Fulfillment Center B (800m radius)' },
                  ]}
                />

                <Input
                  label="Annual Salary ($)"
                  type="number"
                  placeholder="e.g. 85000"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                />

                <Input
                  label="Joining Date *"
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  required
                />
              </div>

              <Input
                label="Reporting Manager"
                placeholder="e.g. Organization Owner"
                value={formData.reportingManager}
                onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
              />
            </div>
          )}

          {/* TAB 3: Contact & Documents */}
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

              {/* Uniform Sizing Section */}
              <div className="pt-4 border-t border-[#E5EAE4]">
                <div className="flex items-center gap-2 mb-3">
                  <Shirt className="h-4 w-4 text-[#FF8B45]" />
                  <h4 className="text-xs font-bold text-[#183B36] uppercase tracking-wider">
                    Uniform & Safety Gear Sizing
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <Select
                    label="Polo / Shirt Size"
                    value={formData.shirtSize}
                    onChange={(e) => setFormData({ ...formData, shirtSize: e.target.value })}
                    options={[
                      { value: 'S', label: 'Size S (Small)' },
                      { value: 'M', label: 'Size M (Medium)' },
                      { value: 'L', label: 'Size L (Large)' },
                      { value: 'XL', label: 'Size XL (Extra Large)' },
                      { value: 'XXL', label: 'Size XXL' },
                    ]}
                  />

                  <Select
                    label="Work Trousers / Cargo Waist"
                    value={formData.pantsSize}
                    onChange={(e) => setFormData({ ...formData, pantsSize: e.target.value })}
                    options={[
                      { value: '28', label: 'Waist 28"' },
                      { value: '30', label: 'Waist 30"' },
                      { value: '32', label: 'Waist 32"' },
                      { value: '34', label: 'Waist 34"' },
                      { value: '36', label: 'Waist 36"' },
                      { value: '38', label: 'Waist 38"' },
                    ]}
                  />

                  <Select
                    label="Safety Boots Size"
                    value={formData.shoeSize}
                    onChange={(e) => setFormData({ ...formData, shoeSize: e.target.value })}
                    options={[
                      { value: '7', label: 'US 7' },
                      { value: '8', label: 'US 8' },
                      { value: '9', label: 'US 9' },
                      { value: '10', label: 'US 10' },
                      { value: '11', label: 'US 11' },
                      { value: '12', label: 'US 12' },
                    ]}
                  />
                </div>
              </div>

              {/* Verified Documents Upload Email Notification Card */}
              <div className="p-4 rounded-2xl bg-[#E6F3F1] border border-[#BDE0D9] space-y-2">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-[#075E54]" />
                  <span className="text-xs font-bold text-[#075E54] uppercase tracking-wider">
                    Verified Employee Documents Upload Email
                  </span>
                </div>
                <p className="text-xs text-[#183B36] leading-relaxed">
                  Upon saving, a welcome email is instantly delivered to <strong>{formData.email || 'the employee'}</strong> containing their login password and a secure direct link to the <strong>Verified Employee Documents Upload</strong> portal to submit:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#5A6B65] pt-1">
                  <div>&bull; Government Photo ID (Passport / License)</div>
                  <div>&bull; Signed Employment Agreement & Code of Conduct</div>
                  <div>&bull; GPS Geofence & Facial Selfie Privacy Consent</div>
                  <div>&bull; Safety Equipment & Uniform Sizing Acknowledgment</div>
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
              {activeTab !== 'contact' && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => {
                    if (activeTab === 'personal') {
                      if (validatePersonalStep()) setActiveTab('employment')
                    } else if (activeTab === 'employment') {
                      if (validateEmploymentStep()) setActiveTab('contact')
                    }
                  }}
                >
                  Next Tab &rarr;
                </Button>
              )}

              <Button
                type="button"
                variant="accent"
                size="lg"
                isLoading={isLoading}
                onClick={handleManualSave}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Save & Enroll Employee
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEmployeePage
