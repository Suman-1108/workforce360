import React, { useState, useEffect } from 'react'
import {
  X,
  UserCheck,
  Building,
  MapPin,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button, Input, Avatar } from '../common'
import { uniformsApi, employeesApi, departmentsApi, organizationApi } from '../../services/api'
import type { UniformOutfit, ClothingComponent } from './UniformOutfitCard'

interface UniformAssignmentModalProps {
  isOpen: boolean
  outfit: UniformOutfit | null
  onClose: () => void
  onSuccess: () => void
  selectedItems?: ClothingComponent[]
}

type AssignmentMode = 'single' | 'department' | 'branch' | 'multi'

export const UniformAssignmentModal: React.FC<UniformAssignmentModalProps> = ({
  isOpen,
  outfit,
  onClose,
  onSuccess,
  selectedItems,
}) => {
  const [mode, setMode] = useState<AssignmentMode>('single')
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)

  // Form selections
  const [selectedEmpId, setSelectedEmpId] = useState<number | ''>('')
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('')
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('')
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([])

  const [selectedSize, setSelectedSize] = useState<string>('L')
  const [quantity, setQuantity] = useState<number>(1)
  const [distributionDate, setDistributionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState<string>('Standard workforce uniform allocation')

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setLoadingData(true)
      setErrorMsg(null)
      setSuccessMsg(null)
      Promise.all([
        employeesApi.list({ status: 'Active' }),
        departmentsApi.list(),
        organizationApi.listBranches(),
      ])
        .then(([empRes, deptRes, branchRes]) => {
          const emps = empRes?.items || (Array.isArray(empRes) ? empRes : [])
          setEmployees(emps)
          if (emps.length > 0 && !selectedEmpId) {
            setSelectedEmpId(emps[0].id)
          }

          const depts = deptRes?.items || (Array.isArray(deptRes) ? deptRes : [])
          setDepartments(depts)
          if (depts.length > 0 && !selectedDeptId) {
            setSelectedDeptId(depts[0].id)
          }

          const brs = branchRes?.items || (Array.isArray(branchRes) ? branchRes : [])
          setBranches(brs)
          if (brs.length > 0 && !selectedBranchId) {
            setSelectedBranchId(brs[0].id)
          }
        })
        .catch((err) => console.error('Failed to load assignment dependencies:', err))
        .finally(() => setLoadingData(false))
    }
  }, [isOpen])

  if (!isOpen || !outfit) return null

  const availableStock =
    outfit.available_stock ?? Math.max(0, outfit.total_stock - outfit.distributed_stock)

  // Calculate target employee count based on mode
  let targetCount = 1
  if (mode === 'single') {
    targetCount = 1
  } else if (mode === 'department') {
    targetCount = employees.filter((e) => Number(e.department_id) === Number(selectedDeptId)).length
  } else if (mode === 'branch') {
    targetCount = employees.filter((e) => Number(e.branch_id) === Number(selectedBranchId)).length
  } else if (mode === 'multi') {
    targetCount = selectedEmpIds.length
  }

  const unitsNeeded = targetCount * quantity
  const isStockInsufficient = unitsNeeded > availableStock

  const handleToggleEmp = (id: number) => {
    if (selectedEmpIds.includes(id)) {
      setSelectedEmpIds(selectedEmpIds.filter((x) => x !== id))
    } else {
      setSelectedEmpIds([...selectedEmpIds, id])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (targetCount === 0) {
      setErrorMsg('No employees selected for uniform allocation.')
      return
    }

    if (isStockInsufficient) {
      setErrorMsg(
        `Insufficient warehouse stock. Required: ${unitsNeeded} sets, but only ${availableStock} are available.`
      )
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'single') {
        if (!selectedEmpId) {
          setErrorMsg('Please select an employee.')
          setSubmitting(false)
          return
        }
        await uniformsApi.issue({
          employee_id: Number(selectedEmpId),
          uniform_item_id: Number(outfit.id),
          size: selectedSize,
          quantity: quantity,
          notes: notes,
        })
      } else if (mode === 'department') {
        await uniformsApi.bulkIssue({
          uniform_item_id: Number(outfit.id),
          department_id: Number(selectedDeptId),
          size: selectedSize,
          quantity: quantity,
          issued_date: distributionDate,
          notes: notes,
        })
      } else if (mode === 'branch') {
        await uniformsApi.bulkIssue({
          uniform_item_id: Number(outfit.id),
          branch_id: Number(selectedBranchId),
          size: selectedSize,
          quantity: quantity,
          issued_date: distributionDate,
          notes: notes,
        })
      } else if (mode === 'multi') {
        await uniformsApi.bulkIssue({
          uniform_item_id: Number(outfit.id),
          employee_ids: selectedEmpIds,
          size: selectedSize,
          quantity: quantity,
          issued_date: distributionDate,
          notes: notes,
        })
      }

      setSuccessMsg(`Successfully issued ${unitsNeeded} uniform set(s) across ${targetCount} staff member(s).`)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1200)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to issue uniform.')
    } finally {
      setSubmitting(false)
    }
  }

  const sizes = (outfit.sizes_available || 'S, M, L, XL, 2XL')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E5EAE4] shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#E5EAE4] bg-[#FBFDFB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#075E54]/10 text-[#075E54] flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#183B36] leading-tight">
                Assign Uniform Ensemble
              </h2>
              <p className="text-xs text-[#78847F]">
                Allocate kit to individual personnel, bulk department cohorts, or facility branches.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#78847F] hover:bg-[#F5F7F1] hover:text-[#183B36] cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {/* Selected Outfit Card Summary */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]">
            <img
              src={
                outfit.model_image_url ||
                'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop&q=80'
              }
              alt={outfit.name}
              className="w-16 h-16 rounded-xl object-cover bg-white border border-[#E5EAE4] shrink-0"
            />
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/80 text-[#FF8B45]">
                  {outfit.code || `UNIF-${outfit.id}`}
                </span>
                <span className="text-xs font-bold text-[#075E54] bg-[#075E54]/10 px-2 py-0.5 rounded-full">
                  {outfit.category}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-[#183B36] truncate">{outfit.name}</h3>
              <div className="flex items-center gap-3 text-[11px] text-[#78847F]">
                <span>Warehouse Stock: <strong className="text-[#183B36]">{availableStock}</strong> available</span>
                <span>&bull;</span>
                <span>Colors: <strong>{outfit.colors || 'Standard'}</strong></span>
              </div>
              {selectedItems && selectedItems.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                  <span className="text-[10px] uppercase font-bold text-[#78847F]">Selected Items:</span>
                  {selectedItems.map((it, i) => (
                    <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#CBD5C8] text-[#183B36]">
                      {it.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Assignment Mode Pills */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#78847F]">
              Assignment Strategy
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'single', label: 'Single Staff', icon: <UserCheck className="h-4 w-4" /> },
                { id: 'department', label: 'By Department', icon: <Building className="h-4 w-4" /> },
                { id: 'branch', label: 'By Branch Hub', icon: <MapPin className="h-4 w-4" /> },
                { id: 'multi', label: 'Custom Multi-Staff', icon: <Users className="h-4 w-4" /> },
              ].map((m) => {
                const isSelected = mode === m.id
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setMode(m.id as any)}
                    className={`flex items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#075E54] text-white border-[#075E54] shadow-xs'
                        : 'bg-[#F5F7F1] text-[#78847F] border-[#E5EAE4] hover:bg-[#EAEFE8] hover:text-[#183B36]'
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mode Selection Controls */}
          <div className="p-4 rounded-2xl border border-[#E5EAE4] bg-white space-y-4">
            {mode === 'single' && (
              <div>
                <label className="block text-xs font-semibold text-[#183B36] mb-1">
                  Select Active Personnel
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(Number(e.target.value))}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#CBD5C8] bg-white text-[#183B36]"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user ? `${emp.user.first_name} ${emp.user.last_name}` : `Staff #${emp.id}`} ({emp.employee_id_number}) &mdash; {emp.designation}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === 'department' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#183B36] mb-1">
                  Select Target Department
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#CBD5C8] bg-white text-[#183B36]"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code || 'DEPT'})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[#075E54] font-semibold block">
                  &bull; This will automatically issue uniforms to {targetCount} active employee(s) in this department.
                </span>
              </div>
            )}

            {mode === 'branch' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#183B36] mb-1">
                  Select Physical Branch Facility
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#CBD5C8] bg-white text-[#183B36]"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city}, {b.state}) &mdash; Radius: {b.radius_meters}m
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[#075E54] font-semibold block">
                  &bull; This will issue uniforms to {targetCount} personnel stationed at this facility branch.
                </span>
              </div>
            )}

            {mode === 'multi' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#183B36]">
                    Select Personnel ({selectedEmpIds.length} Selected)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedEmpIds(
                        selectedEmpIds.length === employees.length ? [] : employees.map((e) => e.id)
                      )
                    }
                    className="text-[11px] font-bold text-[#075E54] hover:underline cursor-pointer"
                  >
                    {selectedEmpIds.length === employees.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-[#E5EAE4] border border-[#E5EAE4] rounded-xl scrollbar-thin">
                  {employees.map((emp) => {
                    const isChecked = selectedEmpIds.includes(emp.id)
                    const name = emp.user ? `${emp.user.first_name} ${emp.user.last_name}` : `Staff #${emp.id}`
                    return (
                      <label
                        key={emp.id}
                        className="flex items-center gap-3 p-2.5 hover:bg-[#F5F7F1] cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleEmp(emp.id)}
                          className="h-4 w-4 rounded accent-[#075E54]"
                        />
                        <Avatar name={name} size="xs" />
                        <div className="text-xs">
                          <span className="font-bold text-[#183B36] block">{name}</span>
                          <span className="text-[10px] text-[#78847F]">
                            {emp.employee_id_number} &bull; {emp.designation}
                          </span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sizing, Quantity, and Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#183B36] mb-1">
                Uniform Size Allocation
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#CBD5C8] bg-white text-[#183B36]"
              >
                {sizes.map((sz) => (
                  <option key={sz} value={sz}>
                    Size {sz}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Sets per Employee"
              type="number"
              min={1}
              max={10}
              value={String(quantity)}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              required
            />

            <Input
              label="Distribution Date"
              type="date"
              value={distributionDate}
              onChange={(e) => setDistributionDate(e.target.value)}
              required
              leftIcon={<Calendar className="h-4 w-4 text-[#78847F]" />}
            />
          </div>

          <Input
            label="Issuance Condition / Batch Audit Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Annual uniform kit distribution; Brand new condition"
          />

          {/* Live Inventory Stock Calculator Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
              isStockInsufficient
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-[#075E54]/5 border-[#075E54]/15 text-[#183B36]'
            }`}
          >
            <div>
              <span className="font-bold block">
                Allocation Calculation: {targetCount} Staff &times; {quantity} set(s) = {unitsNeeded} Total Units
              </span>
              <span className="text-[11px] text-[#78847F]">
                Warehouse Available Stock: {availableStock} units
              </span>
            </div>

            <span
              className={`font-mono font-bold px-3 py-1 rounded-full text-xs ${
                isStockInsufficient ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {isStockInsufficient ? 'Deficit: Needs Restock' : 'Stock Verified'}
            </span>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-[#E5EAE4] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-bold border-[#CBD5C8] text-[#183B36] hover:bg-[#F5F7F1] cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting || loadingData}
              disabled={loadingData || isStockInsufficient || targetCount === 0}
              leftIcon={<UserCheck className="h-4 w-4" />}
              className="bg-[#075E54] hover:bg-[#075E54]/90 text-white cursor-pointer px-5 disabled:opacity-50"
            >
              {submitting
                ? 'Executing Issuance...'
                : `Confirm Issuance (${unitsNeeded} Units)`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
