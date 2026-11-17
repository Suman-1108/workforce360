import React from 'react'
import { Users, Building, AlertTriangle } from 'lucide-react'

export interface UsageProgressProps {
  employeesUsed: number
  employeeLimit: number
  branchesUsed: number
  branchLimit: number
  onUpgradeClick?: () => void
}

export const UsageProgress: React.FC<UsageProgressProps> = ({
  employeesUsed,
  employeeLimit,
  branchesUsed,
  branchLimit,
  onUpgradeClick,
}) => {
  const isEmpUnlimited = employeeLimit <= 0 || employeeLimit >= 99999
  const isBranchUnlimited = branchLimit <= 0 || branchLimit >= 99999

  const empPercent = isEmpUnlimited
    ? 20
    : Math.min(100, Math.round((employeesUsed / employeeLimit) * 100))

  const branchPercent = isBranchUnlimited
    ? 30
    : Math.min(100, Math.round((branchesUsed / branchLimit) * 100))

  const isNearLimit = (!isEmpUnlimited && empPercent >= 80) || (!isBranchUnlimited && branchPercent >= 80)
  const isAtLimit = (!isEmpUnlimited && empPercent >= 100) || (!isBranchUnlimited && branchPercent >= 100)

  return (
    <div className="space-y-4">
      {/* Alert Banner if approaching or at quota */}
      {isNearLimit && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs border ${
            isAtLimit
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">
              {isAtLimit
                ? 'Plan Quota Limit Reached! Further employee enrollments require a tier upgrade.'
                : 'Approaching plan quota (over 80% utilized). Consider upgrading your plan.'}
            </span>
          </div>

          {onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white border shadow-2xs hover:bg-neutral-50 cursor-pointer shrink-0"
            >
              Upgrade Now
            </button>
          )}
        </div>
      )}

      {/* Employee Usage Meter */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-[#183B36] mb-1.5">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-[#075E54]" />
            Active Employee Allocation
          </span>
          <span>
            {employeesUsed} / {isEmpUnlimited ? 'Unlimited' : employeeLimit}{' '}
            {!isEmpUnlimited && `(${empPercent}%)`}
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#E5EAE4] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              empPercent >= 90 ? 'bg-rose-500' : empPercent >= 75 ? 'bg-[#FF8B45]' : 'bg-[#075E54]'
            }`}
            style={{ width: `${empPercent}%` }}
          />
        </div>
      </div>

      {/* Branch Usage Meter */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-[#183B36] mb-1.5">
          <span className="flex items-center gap-1.5">
            <Building className="h-4 w-4 text-[#FF8B45]" />
            Branch Geofencing Perimeter Limit
          </span>
          <span>
            {branchesUsed} / {isBranchUnlimited ? 'Unlimited' : branchLimit}{' '}
            {!isBranchUnlimited && `(${branchPercent}%)`}
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#E5EAE4] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              branchPercent >= 90 ? 'bg-rose-500' : 'bg-[#FF8B45]'
            }`}
            style={{ width: `${branchPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default UsageProgress
