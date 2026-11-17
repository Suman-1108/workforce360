import React, { useState, useEffect } from 'react'
import {
  Building2,
  DollarSign,
  Users,
  ShieldCheck,
  Search,
  Power,
  Sparkles,
} from 'lucide-react'
import { Button, Badge } from '../../components/common'
import { superAdminApi } from '../../services/api'

export interface TenantOrg {
  id: string
  name: string
  tenantCode: string
  ownerName: string
  ownerEmail: string
  plan: 'Starter' | 'Professional' | 'Enterprise'
  employeeCount: number
  joinedDate: string
  status: 'Active' | 'Suspended'
}

export const SuperAdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    total_tenants: 1,
    active_tenants: 1,
    total_employees: 1,
    mrr: 79.0,
    arr: 948.0,
  })

  const [tenants, setTenants] = useState<TenantOrg[]>([
    {
      id: '1',
      name: 'Apex Global Technologies',
      tenantCode: 'apex',
      ownerName: 'Marcus Sterling',
      ownerEmail: 'owner@apextechnologies.com',
      plan: 'Professional',
      employeeCount: 1,
      joinedDate: '2026-11-16',
      status: 'Active',
    },
  ])

  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    superAdminApi.getStats().then((res) => {
      if (res) setStats(res)
    }).catch(() => {})

    superAdminApi.listTenants().then((items) => {
      if (items && items.length > 0) {
        const mapped: TenantOrg[] = items.map((it: any) => ({
          id: String(it.id),
          name: it.name,
          tenantCode: it.subdomain || `ORG-${it.id}`,
          ownerName: it.name,
          ownerEmail: it.contact_email,
          plan: (it.plan_name?.replace(' Tier', '') as any) || 'Professional',
          employeeCount: it.employee_count,
          joinedDate: it.created_at.slice(0, 10),
          status: it.status === 'active' ? 'Active' : 'Suspended',
        }))
        setTenants(mapped)
      }
    }).catch(() => {})
  }, [])

  const handleToggleStatus = async (id: string) => {
    const current = tenants.find((t) => t.id === id)
    if (!current) return
    const newStatus = current.status === 'Active' ? 'suspended' : 'active'
    try {
      await superAdminApi.updateTenantStatus(Number(id), newStatus)
      setTenants((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: newStatus === 'active' ? 'Active' : 'Suspended' }
            : t
        )
      )
    } catch {
      // fallback local toggle
      setTenants((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: t.status === 'Active' ? 'Suspended' : 'Active' }
            : t
        )
      )
    }
  }

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tenantCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
              Super Admin Platform Console
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Platform Scope
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#78847F]">
            Global SaaS tenant governance, multi-tenant database isolation monitoring, and recurring subscription telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => alert('Onboarding new tenant organization wizard')}
          >
            Provision Tenant
          </Button>
        </div>
      </div>

      {/* Global Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              Total Organizations
            </span>
            <div className="h-10 w-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#183B36]">{stats.total_tenants}</div>
          <span className="text-[11px] text-emerald-700 font-semibold">
            {stats.active_tenants} active tenant orgs
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              Platform MRR
            </span>
            <div className="h-10 w-10 rounded-2xl bg-[#E6F3F1] text-[#075E54] flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#075E54]">${stats.mrr}</div>
          <span className="text-[11px] text-emerald-700 font-semibold">
            ARR: ${stats.arr}
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              Subscribed Seats
            </span>
            <div className="h-10 w-10 rounded-2xl bg-[#FFF0E6] text-[#FF8B45] flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#183B36]">{stats.total_employees}</div>
          <span className="text-[11px] text-[#78847F]">Active billable employees</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              System Uptime
            </span>
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700">99.98%</div>
          <span className="text-[11px] text-[#78847F]">FastAPI + MongoDB Atlas</span>
        </div>
      </div>

      {/* Tenant Organizations Table Card */}
      <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden">
        <div className="p-6 border-b border-[#E5EAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#183B36]">
              Provisioned Tenant Organizations
            </h3>
            <p className="text-xs text-[#78847F] mt-0.5">
              Enforce strict tenant data isolation, billing tiers, and account suspension.
            </p>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78847F]" />
            <input
              type="text"
              placeholder="Search by tenant name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F5F7F1] text-xs text-[#183B36] pl-10 pr-4 py-2 rounded-full border border-[#CBD5C8] focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5EAE4] bg-[#FBFDFB]">
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                  Organization
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                  Tenant Code
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                  Owner Contact
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                  Subscription Plan
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                  Seats
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                  Status
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F] text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAE4]">
              {filteredTenants.map((t) => (
                <tr key={t.id} className="hover:bg-[#F5F7F1]/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#183B36]">{t.name}</div>
                    <div className="text-[11px] text-[#78847F]">
                      Joined {t.joinedDate}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-[#075E54]">
                    {t.tenantCode}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[#183B36]">{t.ownerName}</div>
                    <div className="text-[11px] text-[#78847F]">{t.ownerEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        t.plan === 'Enterprise'
                          ? 'accent'
                          : t.plan === 'Professional'
                          ? 'info'
                          : 'neutral'
                      }
                    >
                      {t.plan}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#183B36]">
                    {t.employeeCount} staff
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={t.status === 'Active' ? 'success' : 'danger'} dot>
                      {t.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant={t.status === 'Active' ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleStatus(t.id)}
                      leftIcon={<Power className="h-3 w-3" />}
                      className="text-xs"
                    >
                      {t.status === 'Active' ? 'Suspend' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminDashboardPage
