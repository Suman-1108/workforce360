export type EmployeeStatus = 'Active' | 'On Leave' | 'Inactive' | 'Probation'
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Intern'

export interface Employee {
  id: string
  employeeId: string
  fullName: string
  email: string
  phone: string
  avatar?: string
  department: string
  designation: string
  branch: string
  joiningDate: string
  status: EmployeeStatus
  employmentType: EmploymentType
  reportingManager: string
  gender: string
  dateOfBirth: string
  address: {
    street: string
    city: string
    state: string
    postalCode: string
  }
  emergencyContact: {
    name: string
    relation: string
    phone: string
  }
  assignedShift: {
    name: string
    timing: string
    graceMinutes: number
    breakMinutes: number
  }
  leaveBalance: {
    annual: { total: number; used: number }
    medical: { total: number; used: number }
    casual: { total: number; used: number }
  }
  uniformSizes?: {
    shirt: string
    pants: string
    shoes: string
  }
}
