import React from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { Button } from '../common'

export interface PlanItem {
  id: number
  name: string
  code: string
  price_monthly: number
  price_yearly: number
  currency: string
  max_employees: number
  max_branches: number
  has_selfie_verification: boolean
  has_rotational_shifts: boolean
  has_uniform_tracking: boolean
  has_analytics_export: boolean
  has_custom_geofence: boolean
  has_api_access: boolean
  features?: any
}

export interface PlanComparisonProps {
  plans: PlanItem[]
  currentPlanCode: string
  billingCycle: 'monthly' | 'yearly'
  onSelectPlan: (planCode: string) => void
  isLoading?: boolean
}

export const PlanComparison: React.FC<PlanComparisonProps> = ({
  plans,
  currentPlanCode,
  billingCycle,
  onSelectPlan,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-96 rounded-3xl bg-white border border-[#E5EAE4] animate-pulse p-6" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((p) => {
        const isCurrent = p.code.toLowerCase() === currentPlanCode.toLowerCase()
        const price =
          billingCycle === 'yearly'
            ? `$${Math.round(p.price_yearly)}`
            : `$${Math.round(p.price_monthly)}`
        const period = billingCycle === 'yearly' ? '/year' : '/month'

        const featureList = [
          { text: 'GPS Location Verification', included: true },
          {
            text: p.max_branches <= 0 || p.max_branches >= 99999
              ? 'Unlimited Geofenced Branches'
              : `${p.max_branches} Geofenced Branch${p.max_branches > 1 ? 'es' : ''}`,
            included: true,
          },
          { text: 'Facial Camera Selfie Verification', included: p.has_selfie_verification },
          { text: 'Rotational & Overnight Shifts', included: p.has_rotational_shifts },
          { text: 'Uniform & PPE Distribution Tracking', included: p.has_uniform_tracking },
          { text: 'Punctuality Analytics & CSV Export', included: p.has_analytics_export },
          { text: 'Custom Geofence Radius & Polygons', included: p.has_custom_geofence },
          { text: 'REST API & Webhooks Access', included: p.has_api_access },
        ]

        return (
          <div
            key={p.code}
            className={`rounded-3xl p-6 transition-all flex flex-col justify-between ${
              isCurrent
                ? 'bg-white border-2 border-[#075E54] card-soft-shadow relative'
                : 'bg-white border border-[#E5EAE4] card-soft-shadow hover:border-[#BDE0D9]'
            }`}
          >
            {isCurrent && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#075E54] text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs">
                Active Plan
              </span>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-extrabold text-[#183B36]">{p.name}</h3>
              </div>

              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-black text-[#183B36]">{price}</span>
                <span className="text-xs text-[#78847F]">{period}</span>
              </div>

              <div className="py-2.5 px-3 rounded-xl bg-[#F5F7F1] border border-[#E5EAE4] text-xs font-semibold text-[#183B36] mb-4">
                <div>
                  {p.max_employees <= 0 || p.max_employees >= 99999
                    ? 'Unlimited Active Employees'
                    : `Up to ${p.max_employees} Employees`}
                </div>
                <div className="text-[11px] text-[#78847F] font-normal">
                  {p.max_branches <= 0 || p.max_branches >= 99999
                    ? 'Unlimited Branches'
                    : `${p.max_branches} Physical Branch`}
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2.5 mb-6 text-xs">
                {featureList.map((feat, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 ${
                      feat.included ? 'text-[#183B36]' : 'text-[#A0ACA7] line-through'
                    }`}
                  >
                    {feat.included ? (
                      <CheckCircle2 className="h-4 w-4 text-[#075E54] shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 text-[#CBD5C8] shrink-0 mt-0.5" />
                    )}
                    <span>{feat.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {isCurrent ? (
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Current Active Plan
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => onSelectPlan(p.code)}
                >
                  Choose {p.name}
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default PlanComparison
