import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  CheckCircle2,
  XCircle,
  Users,
  Building2,
  Edit3,
  Layers,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import { Button, Badge, Modal } from '../../components/common'
import { superAdminApi } from '../../services/api'

export interface SuperAdminPlan {
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
  features: string[]
  is_active: boolean
  active_subscribers: number
  monthly_revenue: number
}

const FALLBACK_PLANS: SuperAdminPlan[] = [
  {
    id: 1,
    name: 'Starter Tier',
    code: 'starter',
    price_monthly: 29,
    price_yearly: 290,
    currency: 'USD',
    max_employees: 25,
    max_branches: 1,
    has_selfie_verification: false,
    has_rotational_shifts: false,
    has_uniform_tracking: false,
    has_analytics_export: false,
    has_custom_geofence: false,
    has_api_access: false,
    features: [
      'Up to 25 Active Employees',
      'Single Branch Geofencing',
      'Standard Morning/Evening Shifts',
      'Basic Leave Request Workflow',
    ],
    is_active: true,
    active_subscribers: 0,
    monthly_revenue: 0,
  },
  {
    id: 2,
    name: 'Professional Tier',
    code: 'professional',
    price_monthly: 79,
    price_yearly: 790,
    currency: 'USD',
    max_employees: 200,
    max_branches: -1,
    has_selfie_verification: true,
    has_rotational_shifts: true,
    has_uniform_tracking: true,
    has_analytics_export: true,
    has_custom_geofence: false,
    has_api_access: false,
    features: [
      'Up to 200 Active Employees',
      'Unlimited Geofenced Branches',
      'GPS & Camera Selfie Verification',
      'Rotational & Overnight Shifts',
      'Uniform & Gear Tracking',
    ],
    is_active: true,
    active_subscribers: 1,
    monthly_revenue: 79,
  },
  {
    id: 3,
    name: 'Enterprise Tier',
    code: 'enterprise',
    price_monthly: 199,
    price_yearly: 1990,
    currency: 'USD',
    max_employees: -1,
    max_branches: -1,
    has_selfie_verification: true,
    has_rotational_shifts: true,
    has_uniform_tracking: true,
    has_analytics_export: true,
    has_custom_geofence: true,
    has_api_access: true,
    features: [
      'Unlimited Employees & Branches',
      'Custom Geofence Radius & Boundaries',
      'Automated Razorpay Billing & Webhooks',
      'Full Audit Logging & Tenant Isolation',
    ],
    is_active: true,
    active_subscribers: 0,
    monthly_revenue: 0,
  },
]

export const SuperAdminSubscriptionsPage: React.FC = () => {
  const [plans, setPlans] = useState<SuperAdminPlan[]>(FALLBACK_PLANS)
  const [isLoading, setIsLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<SuperAdminPlan | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const fetchPlans = async () => {
    setIsLoading(true)
    try {
      const data = await superAdminApi.listPlans()
      if (Array.isArray(data) && data.length > 0) {
        setPlans(data)
      }
    } catch {
      // keep fallback
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const totalSubscribers = plans.reduce((sum, p) => sum + (p.active_subscribers || 0), 0)
  const totalMRR = plans.reduce((sum, p) => sum + (p.monthly_revenue || 0), 0)
  const totalARR = Math.round(totalMRR * 12 * 100) / 100
  const activePlansCount = plans.filter((p) => p.is_active).length

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlan) return
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const updated = await superAdminApi.updatePlan(editingPlan.id, {
        name: editingPlan.name,
        price_monthly: Number(editingPlan.price_monthly),
        price_yearly: Number(editingPlan.price_yearly),
        max_employees: Number(editingPlan.max_employees),
        max_branches: Number(editingPlan.max_branches),
        has_selfie_verification: editingPlan.has_selfie_verification,
        has_rotational_shifts: editingPlan.has_rotational_shifts,
        has_uniform_tracking: editingPlan.has_uniform_tracking,
        has_analytics_export: editingPlan.has_analytics_export,
        has_custom_geofence: editingPlan.has_custom_geofence,
        has_api_access: editingPlan.has_api_access,
        is_active: editingPlan.is_active,
      })
      setPlans((prev) =>
        prev.map((p) =>
          p.id === editingPlan.id
            ? {
                ...p,
                ...(updated || editingPlan),
              }
            : p
        )
      )
      setSaveMessage(`Saved changes to ${editingPlan.name}.`)
      setTimeout(() => {
        setEditingPlan(null)
        setSaveMessage(null)
      }, 900)
    } catch {
      setSaveMessage('Failed to save plan changes. Please check backend connectivity.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
              SaaS Subscription Plans
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Billing Catalog
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#78847F]">
            Manage global pricing tiers, employee seat quotas, and feature entitlements synced live with MongoDB.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchPlans}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Refresh Catalog
        </Button>
      </div>

      {/* Revenue & Tier KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              Active Tiers
            </span>
            <div className="h-10 w-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#183B36]">{activePlansCount}</div>
          <span className="text-[11px] text-[#78847F]">of {plans.length} configured plans</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              Active Subscriptions
            </span>
            <div className="h-10 w-10 rounded-2xl bg-[#FFF0E6] text-[#FF8B45] flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#183B36]">{totalSubscribers}</div>
          <span className="text-[11px] text-emerald-700 font-semibold">Live paying organizations</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              Monthly Recurring (MRR)
            </span>
            <div className="h-10 w-10 rounded-2xl bg-[#E6F3F1] text-[#075E54] flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#075E54]">${totalMRR.toFixed(2)}</div>
          <span className="text-[11px] text-emerald-700 font-semibold">Across all active plans</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              Annualized Run Rate (ARR)
            </span>
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700">${totalARR.toFixed(2)}</div>
          <span className="text-[11px] text-[#78847F]">Projected 12-month revenue</span>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isPro = plan.code === 'professional'
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl p-6 border card-soft-shadow flex flex-col justify-between transition-all ${
                isPro ? 'border-purple-300 ring-2 ring-purple-100' : 'border-[#E5EAE4]'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-[#183B36]">{plan.name}</h3>
                      {isPro && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          Popular
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-[#78847F] uppercase">
                      code: {plan.code}
                    </span>
                  </div>
                  <Badge variant={plan.is_active ? 'success' : 'neutral'} dot>
                    {plan.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                {/* Pricing */}
                <div className="p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#075E54]">
                      ${plan.price_monthly}
                    </span>
                    <span className="text-xs text-[#78847F] font-medium">/ month</span>
                  </div>
                  <div className="text-[11px] text-[#78847F] mt-1">
                    Annual billing: <span className="font-bold text-[#183B36]">${plan.price_yearly}/yr</span>
                  </div>
                </div>

                {/* Quotas & Live Subscribers */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-2xl bg-[#FBFDFB] border border-[#E5EAE4]">
                    <span className="text-[10px] font-bold uppercase text-[#78847F] block">
                      Employee Quota
                    </span>
                    <span className="font-extrabold text-[#183B36] flex items-center gap-1 mt-0.5">
                      <Users className="h-3.5 w-3.5 text-[#075E54]" />
                      {plan.max_employees === -1 ? 'Unlimited' : `${plan.max_employees} seats`}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FBFDFB] border border-[#E5EAE4]">
                    <span className="text-[10px] font-bold uppercase text-[#78847F] block">
                      Branch Quota
                    </span>
                    <span className="font-extrabold text-[#183B36] flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3.5 w-3.5 text-purple-600" />
                      {plan.max_branches === -1 ? 'Unlimited' : `${plan.max_branches} branch`}
                    </span>
                  </div>
                </div>

                {/* Feature Entitlement Flags */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78847F] block">
                    Entitlement Flags
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {[
                      { label: 'Selfie Check-In', enabled: plan.has_selfie_verification },
                      { label: 'Rotational Shifts', enabled: plan.has_rotational_shifts },
                      { label: 'Uniform Tracking', enabled: plan.has_uniform_tracking },
                      { label: 'Analytics Export', enabled: plan.has_analytics_export },
                      { label: 'Custom Geofence', enabled: plan.has_custom_geofence },
                      { label: 'API Access', enabled: plan.has_api_access },
                    ].map((flag) => (
                      <div
                        key={flag.label}
                        className={`flex items-center gap-1.5 ${
                          flag.enabled ? 'text-[#183B36] font-semibold' : 'text-[#9AA5A0]'
                        }`}
                      >
                        {flag.enabled ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                        )}
                        <span>{flag.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer: Subscribers + Edit Action */}
              <div className="mt-6 pt-4 border-t border-[#E5EAE4] flex items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="font-bold text-[#183B36]">{plan.active_subscribers}</span>
                  <span className="text-[#78847F]"> orgs &bull; </span>
                  <span className="font-bold text-[#075E54]">${plan.monthly_revenue}/mo</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSaveMessage(null)
                    setEditingPlan({ ...plan })
                  }}
                  leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                >
                  Edit Plan
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit Plan Modal */}
      <Modal
        isOpen={Boolean(editingPlan)}
        onClose={() => setEditingPlan(null)}
        title={`Edit ${editingPlan?.name || 'Subscription Plan'}`}
        description="Update pricing, seat quotas, and module entitlements in real time."
        size="md"
      >
        {editingPlan && (
          <form onSubmit={handleSavePlan} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#183B36] mb-1">Plan Name</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full rounded-xl border border-[#CBD5C8] px-3 py-2 text-xs text-[#183B36]"
                  required
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#183B36] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_active}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                    className="rounded border-[#CBD5C8] text-[#075E54]"
                  />
                  <span>Plan Active &amp; Publicly Selectable</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#183B36] mb-1">Monthly Price ($)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editingPlan.price_monthly}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, price_monthly: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-[#CBD5C8] px-3 py-2 text-xs text-[#183B36]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#183B36] mb-1">Yearly Price ($)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editingPlan.price_yearly}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, price_yearly: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-[#CBD5C8] px-3 py-2 text-xs text-[#183B36]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#183B36] mb-1">
                  Max Employees (-1 = Unlimited)
                </label>
                <input
                  type="number"
                  min={-1}
                  value={editingPlan.max_employees}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, max_employees: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-[#CBD5C8] px-3 py-2 text-xs text-[#183B36]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#183B36] mb-1">
                  Max Branches (-1 = Unlimited)
                </label>
                <input
                  type="number"
                  min={-1}
                  value={editingPlan.max_branches}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, max_branches: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-[#CBD5C8] px-3 py-2 text-xs text-[#183B36]"
                  required
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] space-y-2">
              <span className="text-[11px] font-bold uppercase text-[#78847F] block">
                Feature Entitlements
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(
                  [
                    ['has_selfie_verification', 'Selfie Verification'],
                    ['has_rotational_shifts', 'Rotational Shifts'],
                    ['has_uniform_tracking', 'Uniform Tracking'],
                    ['has_analytics_export', 'Analytics Export'],
                    ['has_custom_geofence', 'Custom Geofence'],
                    ['has_api_access', 'API Access'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="inline-flex items-center gap-2 text-[#183B36] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingPlan[key])}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, [key]: e.target.checked })
                      }
                      className="rounded border-[#CBD5C8] text-[#075E54]"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {saveMessage && (
              <div className="p-3 rounded-xl bg-[#E6F3F1] border border-[#BDE0D9] text-xs font-semibold text-[#075E54]">
                {saveMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingPlan(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default SuperAdminSubscriptionsPage
