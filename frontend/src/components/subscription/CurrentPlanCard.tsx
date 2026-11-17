import React from 'react'
import { Sparkles, Calendar, XCircle, CheckCircle2 } from 'lucide-react'
import { Badge, Button } from '../common'

export interface CurrentPlanCardProps {
  planName: string
  planCode: string
  status: string
  billingCycle: string
  price: string
  startDate: string
  renewalDate: string
  isAutoRenew: boolean
  onCancelClick?: () => void
  onUpgradeClick?: () => void
}

export const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({
  planName,
  status,
  billingCycle,
  price,
  startDate,
  renewalDate,
  isAutoRenew,
  onCancelClick,
  onUpgradeClick,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#E5EAE4] mb-5">
          <div>
            <span className="text-[11px] font-bold text-[#78847F] uppercase tracking-wider block">
              Active Enterprise Tier
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-xl font-extrabold text-[#183B36]">{planName}</h2>
              <Badge
                variant={status === 'active' ? 'success' : status === 'trialing' ? 'info' : 'danger'}
                size="sm"
              >
                {status}
              </Badge>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-[#075E54]">{price}</span>
            <span className="text-xs text-[#78847F] block capitalize">/{billingCycle}</span>
          </div>
        </div>

        {/* Date Milestones */}
        <div className="grid grid-cols-2 gap-3.5 text-xs mb-5">
          <div className="p-3 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]">
            <span className="text-[#78847F] block mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#075E54]" /> Started On
            </span>
            <span className="font-bold text-[#183B36]">{startDate || 'Nov 01, 2026'}</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]">
            <span className="text-[#78847F] block mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#FF8B45]" /> Next Renewal
            </span>
            <span className="font-bold text-[#183B36]">{renewalDate || 'Dec 01, 2026'}</span>
          </div>
        </div>

        {/* Auto renew indicator */}
        <div className="flex items-center justify-between text-xs text-[#78847F] mb-4 p-2.5 rounded-xl bg-[#F5F7F1]/50 border border-[#E5EAE4]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Automatic Renewal
          </span>
          <span className="font-bold text-[#183B36]">
            {isAutoRenew ? 'Enabled (Razorpay Auto-Debit)' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-[#E5EAE4] flex items-center justify-between gap-3">
        {onCancelClick && status !== 'canceled' && (
          <button
            onClick={onCancelClick}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1"
          >
            <XCircle className="h-3.5 w-3.5" /> Cancel Renewal
          </button>
        )}

        {onUpgradeClick && (
          <Button
            variant="primary"
            size="sm"
            onClick={onUpgradeClick}
            leftIcon={<Sparkles className="h-3.5 w-3.5" />}
          >
            Change / Upgrade Tier
          </Button>
        )}
      </div>
    </div>
  )
}

export default CurrentPlanCard
