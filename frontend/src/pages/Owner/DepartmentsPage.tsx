import React, { useState, useEffect } from 'react'
import {
  Building,
  Users,
  Plus,
  MapPin,
  ChevronRight,
} from 'lucide-react'
import { Button, Modal, Input, Avatar } from '../../components/common'
import { departmentsApi } from '../../services/api'

export interface Department {
  id: string
  name: string
  code: string
  headName: string
  headEmail: string
  employeeCount: number
  branches: string[]
  description: string
}

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    departmentsApi
      .list()
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.items || []
        setDepartments(
          items.map((d: any) => ({
            id: String(d.id),
            name: d.name,
            code: d.code || 'DEPT',
            headName: d.manager_name || 'Operations Lead',
            headEmail: `${(d.code || 'dept').toLowerCase()}@workforce360.com`,
            employeeCount: d.employee_count ?? 0,
            branches: ['Tech Park HQ', 'Main Logistics Hub'],
            description: d.description || 'Department Unit',
          }))
        )
      })
      .catch((err) => {
        console.error('Failed to load departments from API:', err)
        setDepartments([])
      })
      .finally(() => setLoading(false))
  }, [])

  const [modalOpen, setModalOpen] = useState(false)
  const [newDept, setNewDept] = useState({
    name: '',
    code: '',
    headName: '',
    headEmail: '',
    description: '',
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDept.name || !newDept.code) return

    try {
      const res = await departmentsApi.create({
        name: newDept.name,
        code: newDept.code.toUpperCase(),
        description: newDept.description || 'Department created.',
      })
      const d = res.data || res
      const created: Department = {
        id: String(d.id || Date.now()),
        name: d.name || newDept.name,
        code: d.code || newDept.code.toUpperCase(),
        headName: newDept.headName || 'Unassigned Lead',
        headEmail: newDept.headEmail || 'lead@acmeglobal.com',
        employeeCount: 0,
        branches: ['Tech Park HQ'],
        description: d.description || newDept.description || 'Department created.',
      }

      setDepartments((prev) => [...prev, created])
      window.dispatchEvent(new Event('wf360:refresh-counts'))
      setModalOpen(false)
      setNewDept({ name: '', code: '', headName: '', headEmail: '', description: '' })
    } catch (err) {
      console.error('Error creating department:', err)
      const created: Department = {
        id: `dep-${Date.now()}`,
        name: newDept.name,
        code: newDept.code.toUpperCase(),
        headName: newDept.headName || 'Unassigned Lead',
        headEmail: newDept.headEmail || 'lead@acmeglobal.com',
        employeeCount: 0,
        branches: ['Tech Park HQ'],
        description: newDept.description || 'Department created.',
      }
      setDepartments((prev) => [...prev, created])
      window.dispatchEvent(new Event('wf360:refresh-counts'))
      setModalOpen(false)
      setNewDept({ name: '', code: '', headName: '', headEmail: '', description: '' })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
              Department Structure
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E6F3F1] text-[#075E54] border border-[#BDE0D9] flex items-center gap-1">
              <Building className="h-3 w-3" />
              {departments.length} Units
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#78847F]">
            Organize branch personnel, reporting structures, manager approval tiers, and workforce allocations.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="h-3.5 w-3.5" />}
        >
          Create Department
        </Button>
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-[#78847F] text-xs font-semibold">
          Loading departments from database...
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E5EAE4] card-soft-shadow">
          <Building className="h-10 w-10 text-[#A0ACA7] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#183B36] mb-1">No Departments Yet</h3>
          <p className="text-xs text-[#78847F] max-w-sm mx-auto mb-4">
            Create departments to organize your teams, designate department heads, and assign workforce shifts.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Create First Department
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow card-hover-lift flex flex-col justify-between"
          >
            <div>
              {/* Top Code Badge & Staff Count */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#F5F7F1] border border-[#CBD5C8] text-[#183B36]">
                  {dept.code}
                </span>
                <span className="text-xs font-bold text-[#075E54] bg-[#E6F3F1] px-3 py-1 rounded-full border border-[#BDE0D9] flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {dept.employeeCount} Staff
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-lg font-bold text-[#183B36] mb-2">
                {dept.name}
              </h3>
              <p className="text-xs text-[#78847F] leading-relaxed mb-6">
                {dept.description}
              </p>

              {/* Department Head Profile */}
              <div className="p-3.5 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] mb-4">
                <span className="text-[10px] uppercase font-bold text-[#78847F] block mb-1.5">
                  Department Lead
                </span>
                <div className="flex items-center gap-3">
                  <Avatar name={dept.headName} size="xs" />
                  <div>
                    <span className="text-xs font-bold text-[#183B36] block">
                      {dept.headName}
                    </span>
                    <span className="text-[11px] text-[#78847F]">
                      {dept.headEmail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Branches */}
              <div className="space-y-1.5 mb-6">
                <span className="text-[10px] uppercase font-bold text-[#78847F] block">
                  Active Branches
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {dept.branches.map((b, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-semibold text-[#183B36] bg-white border border-[#CBD5C8] px-2.5 py-0.5 rounded-md flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3 text-[#075E54]" />
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Action */}
            <div className="pt-4 border-t border-[#E5EAE4] flex items-center justify-between">
              <button
                type="button"
                className="text-xs font-bold text-[#075E54] hover:underline flex items-center gap-1 cursor-pointer"
                onClick={() => alert(`Viewing department roster for ${dept.name}`)}
              >
                <span>View Staff Roster</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Modal: Create Department */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Department"
        description="Establish an operational organizational division."
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Department Name *"
            placeholder="e.g. Quality Assurance & Audits"
            value={newDept.name}
            onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Department Code *"
              placeholder="e.g. QAA"
              value={newDept.code}
              onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
              required
            />
            <Input
              label="Lead Manager Name"
              placeholder="e.g. Sarah Jenkins"
              value={newDept.headName}
              onChange={(e) => setNewDept({ ...newDept, headName: e.target.value })}
            />
          </div>

          <Input
            label="Lead Work Email"
            type="email"
            placeholder="s.jenkins@acmeglobal.com"
            value={newDept.headEmail}
            onChange={(e) => setNewDept({ ...newDept, headEmail: e.target.value })}
          />

          <Input
            label="Description & Mandate"
            placeholder="Brief scope of responsibilities..."
            value={newDept.description}
            onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
          />

          <div className="pt-4 border-t border-[#E5EAE4] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Establish Department
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default DepartmentsPage
