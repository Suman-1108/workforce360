import React, { useState } from 'react'
import { Check, Sparkles, Info } from 'lucide-react'
import { Button } from '../common/Button'

export interface PricingSectionProps {
  onPlanSelect?: (planName: string) => void
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  onPlanSelect,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      name: 'Starter Tier',
      tagline: 'Ideal for emerging teams and local single-branch businesses.',
      priceMonthly: 29,
      priceYearly: 24,
      popular: false,
      badge: 'Self-Serve',
      features: [
        'Up to 25 Active Employees',
        'Single Branch Geofencing',
        'Standard Morning/Evening Shifts',
        'Basic Leave Request Workflow',
        'Email Support (24h response)',
        '30-Day Attendance Logs',
      ],
      ctaText: 'Start 14-Day Free Trial',
      ctaVariant: 'outline' as const,
    },
    {
      name: 'Professional Tier',
      tagline: 'For high-growth organizations with multi-branch or factory shifts.',
      priceMonthly: 79,
      priceYearly: 64,
      popular: true,
      badge: 'Most Popular',
      features: [
        'Up to 200 Active Employees',
        'Unlimited Geofenced Branches',
        'GPS & Camera Selfie Verification',
        'Rotational & Overnight Shifts',
        'Multi-Tier Manager Approvals',
        'Uniform & Gear Tracking',
        'Real-Time Analytics & CSV/Excel Exports',
        'Priority Technical Support',
      ],
      ctaText: 'Choose Professional',
      ctaVariant: 'primary' as const,
    },
    {
      name: 'Enterprise Tier',
      tagline: 'For large operations requiring custom SLA, SSO, and dedicated support.',
      priceMonthly: 199,
      priceYearly: 159,
      popular: false,
      badge: 'Custom Scale',
      features: [
        'Unlimited Employees & Branches',
        'Custom Geofence Radius & Polygonal Boundaries',
        'Custom SSO / SAML Authentication',
        'Automated Razorpay Billing & Webhooks',
        'Full Audit Logging & Tenant Data Isolation',
        'Dedicated Account Manager',
        'Custom Payroll API Integrations',
        '99.9% Uptime Guarantee SLA',
      ],
      ctaText: 'Contact Enterprise Sales',
      ctaVariant: 'accent' as const,
    },
  ]

  return (
    <section id="pricing" className="py-24 bg-[#F5F7F1] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#075E54] bg-[#E6F3F1] px-3.5 py-1.5 rounded-full inline-block mb-3 border border-[#BDE0D9]">
            Transparent Subscriptions
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#183B36] tracking-tight">
            Predictable Plans for Every Scale
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#78847F]">
            Transparent pricing with no hidden hardware costs. Switch or cancel at any time.
          </p>

          {/* Sample Content Disclaimer Alert */}
          <div className="inline-flex items-center gap-2 mt-4 px-3.5 py-1.5 rounded-full bg-white border border-[#CBD5C8] text-xs font-medium text-[#78847F]">
            <Info className="h-3.5 w-3.5 text-[#FF8B45]" />
            <span>Sample Plan Rates — Subject to Organization Customization</span>
          </div>
        </div>

        {/* Monthly / Yearly Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <span
            className={`text-sm font-semibold cursor-pointer ${
              billingCycle === 'monthly' ? 'text-[#183B36]' : 'text-[#78847F]'
            }`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly Billing
          </span>

          <button
            type="button"
            onClick={() =>
              setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')
            }
            className="w-14 h-8 rounded-full bg-[#075E54] p-1 transition-colors relative cursor-pointer focus:outline-none"
            aria-label="Toggle billing cycle"
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>

          <span
            className={`text-sm font-semibold cursor-pointer flex items-center gap-1.5 ${
              billingCycle === 'yearly' ? 'text-[#183B36]' : 'text-[#78847F]'
            }`}
            onClick={() => setBillingCycle('yearly')}
          >
            <span>Annual Billing</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0E6] text-[#FF8B45] border border-[#FFD4BA]">
              Save 20%
            </span>
          </span>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const price =
              billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly

            return (
              <div
                key={plan.name}
                className={`
                  rounded-4xl p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 relative bg-white
                  ${
                    plan.popular
                      ? 'border-2 border-[#075E54] shadow-xl scale-102 lg:-translate-y-2'
                      : 'border border-[#E5EAE4] card-soft-shadow hover:border-[#075E54]/40'
                  }
                `}
              >
                {/* Popular Ribbon Tag */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#075E54] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>{plan.badge}</span>
                  </div>
                )}

                <div>
                  {/* Plan Name & Tagline */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-[#183B36]">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-[#78847F] mt-2 leading-relaxed min-h-[32px]">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price Block */}
                  <div className="flex items-baseline gap-1 mb-8 pb-6 border-b border-[#E5EAE4]">
                    <span className="text-4xl sm:text-5xl font-black text-[#183B36]">
                      ${price}
                    </span>
                    <span className="text-sm font-medium text-[#78847F]">
                      / organization / month
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3.5 mb-8">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#183B36] block mb-2">
                      Included Capabilities:
                    </span>
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3 text-left">
                        <div className="h-5 w-5 rounded-full bg-[#E6F3F1] text-[#075E54] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span className="text-xs sm:text-sm text-[#183B36] font-medium leading-tight">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Call to Action Button */}
                <div className="pt-4 border-t border-[#E5EAE4]">
                  <Button
                    variant={plan.ctaVariant}
                    size="lg"
                    fullWidth
                    onClick={() => onPlanSelect?.(plan.name)}
                    className="py-3.5 font-semibold text-sm"
                  >
                    {plan.ctaText}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
