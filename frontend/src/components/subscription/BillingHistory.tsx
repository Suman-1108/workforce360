import React from 'react'
import { ShieldCheck, CreditCard, ExternalLink } from 'lucide-react'

export interface BillingHistoryProps {
  onManagePaymentMethods?: () => void
}

export const BillingHistory: React.FC<BillingHistoryProps> = ({
  onManagePaymentMethods,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#E5EAE4] mb-4">
          <div className="h-9 w-9 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#183B36]">Payment Integration</h3>
            <span className="text-[11px] text-[#78847F]">Razorpay HMAC-SHA256 Gateway</span>
          </div>
        </div>

        <p className="text-xs text-[#78847F] leading-relaxed mb-4">
          All transactions are processed with bank-grade 256-bit encryption. Auto-debit orders and tax receipts are synced immediately via verified webhook events.
        </p>

        <div className="p-3.5 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#78847F] flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-[#075E54]" /> Payment Partner
            </span>
            <span className="font-bold text-[#183B36]">Razorpay Enterprise</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#78847F]">Currency Standards</span>
            <span className="font-bold text-[#183B36]">INR (₹) / USD ($)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#78847F]">Tax Compliance</span>
            <span className="font-semibold text-emerald-700">GST Invoice Ready</span>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-[#E5EAE4] flex items-center justify-between">
        <span className="text-xs text-[#78847F]">Manage payment cards?</span>
        <button
          onClick={
            onManagePaymentMethods ||
            (() => alert('Opening Razorpay secure payment settings...'))
          }
          className="text-xs font-bold text-[#075E54] hover:underline cursor-pointer flex items-center gap-1"
        >
          Customer Portal <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

export default BillingHistory
