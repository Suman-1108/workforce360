import React, { useState, useEffect } from 'react'
import {
  Activity,
  Database,
  Server,
  ShieldCheck,
  RefreshCw,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Gauge,
} from 'lucide-react'
import { Button, Badge } from '../../components/common'
import { superAdminApi } from '../../services/api'

interface TelemetryPayload {
  timestamp: string
  status: string
  database: {
    connected: boolean
    engine: string
    name: string
    version: string
    ping_latency_ms: number
    total_collections: number
    total_documents: number
  }
  runtime: {
    app_name: string
    environment: string
    api_prefix: string
    auth_algorithm: string
    rate_limit_per_min: number
    token_ttl_minutes: number
  }
  operations: {
    active_tenants: number
    total_tenants: number
    active_users: number
    total_users: number
    total_employees: number
    punches_today: number
    total_attendances: number
    pending_leaves: number
    active_shifts: number
  }
  collections: Record<string, number>
  recent_accounts: Array<{
    id: number
    name: string
    email: string
    role: string
    is_active: boolean
    last_login_at: string | null
  }>
}

export const SuperAdminTelemetryPage: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TelemetryPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTelemetry = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await superAdminApi.getTelemetry()
      if (data) {
        setTelemetry(data)
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to load live platform telemetry.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTelemetry()
  }, [])

  const collectionEntries = Object.entries(telemetry?.collections || {})
  const maxDocCount = Math.max(1, ...collectionEntries.map(([, count]) => count))

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
              Platform Telemetry
            </h1>
            <Badge
              variant={telemetry?.status === 'operational' ? 'success' : error ? 'danger' : 'neutral'}
              dot
            >
              {telemetry?.status === 'operational'
                ? 'All Systems Operational'
                : error
                ? 'Degraded'
                : 'Connecting...'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#78847F]">
            Live MongoDB cluster diagnostics, collection storage counts, API security posture, and operational counters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {telemetry?.timestamp && (
            <span className="text-[11px] text-[#78847F] hidden sm:inline">
              Updated: {new Date(telemetry.timestamp).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={fetchTelemetry}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Infrastructure KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              Database Cluster
            </span>
            <div className="h-10 w-10 rounded-2xl bg-[#E6F3F1] text-[#075E54] flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#183B36]">
            {telemetry?.database.engine || 'MongoDB'}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">
            {telemetry?.database.connected
              ? `Connected • DB: ${telemetry.database.name} (v${telemetry.database.version})`
              : 'Checking cluster...'}
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              DB Ping Latency
            </span>
            <div className="h-10 w-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Gauge className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#183B36]">
            {telemetry ? `${telemetry.database.ping_latency_ms} ms` : '--'}
          </div>
          <span className="text-[11px] text-[#78847F]">Live admin ping round-trip</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              Total Documents
            </span>
            <div className="h-10 w-10 rounded-2xl bg-[#FFF0E6] text-[#FF8B45] flex items-center justify-center">
              <HardDrive className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#183B36]">
            {telemetry?.database.total_documents ?? '--'}
          </div>
          <span className="text-[11px] text-[#78847F]">
            Across {telemetry?.database.total_collections ?? 0} active collections
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              Active Users
            </span>
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700">
            {telemetry?.operations.active_users ?? '--'}
          </div>
          <span className="text-[11px] text-[#78847F]">
            of {telemetry?.operations.total_users ?? 0} total platform accounts
          </span>
        </div>
      </div>

      {/* Main Split: Collection Counts + Runtime/Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MongoDB Collection Document Counts */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#183B36] flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" />
                MongoDB Collection Telemetry
              </h3>
              <p className="text-xs text-[#78847F] mt-0.5">
                Live document volume across all multi-tenant collections in{' '}
                <span className="font-mono font-semibold text-[#183B36]">
                  {telemetry?.database.name || 'workforce360'}
                </span>
                .
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {collectionEntries.map(([name, count]) => {
              const pct = Math.max(6, Math.round((count / maxDocCount) * 100))
              return (
                <div
                  key={name}
                  className="p-3.5 rounded-2xl bg-[#FBFDFB] border border-[#E5EAE4] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#183B36]">{name}</span>
                    <span className="font-black text-[#075E54]">{count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#E5EAE4] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#075E54] to-purple-600 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Runtime & Operational Snapshot */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow p-6 space-y-3">
            <h3 className="text-base font-bold text-[#183B36] flex items-center gap-2">
              <Server className="h-4 w-4 text-[#075E54]" />
              API &amp; Security Posture
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Environment', value: telemetry?.runtime.environment || 'production' },
                { label: 'API Prefix', value: telemetry?.runtime.api_prefix || '/api/v1' },
                { label: 'JWT Signing', value: telemetry?.runtime.auth_algorithm || 'HS256' },
                {
                  label: 'Rate Limit',
                  value: `${telemetry?.runtime.rate_limit_per_min ?? 120} req/min`,
                },
                {
                  label: 'Token TTL',
                  value: `${telemetry?.runtime.token_ttl_minutes ?? 1440} mins`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-1.5 border-b border-[#F0F3EE] last:border-0"
                >
                  <span className="text-[#78847F]">{row.label}</span>
                  <span className="font-mono font-bold text-[#183B36]">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow p-6 space-y-3">
            <h3 className="text-base font-bold text-[#183B36] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#FF8B45]" />
              Live Operational Activity
            </h3>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]">
                <span className="text-[10px] font-bold uppercase text-[#78847F] block">
                  Punches Today
                </span>
                <span className="text-xl font-black text-[#075E54]">
                  {telemetry?.operations.punches_today ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]">
                <span className="text-[10px] font-bold uppercase text-[#78847F] block">
                  Pending Leaves
                </span>
                <span className="text-xl font-black text-[#FF8B45]">
                  {telemetry?.operations.pending_leaves ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]">
                <span className="text-[10px] font-bold uppercase text-[#78847F] block">
                  Active Shifts
                </span>
                <span className="text-xl font-black text-[#183B36]">
                  {telemetry?.operations.active_shifts ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]">
                <span className="text-[10px] font-bold uppercase text-[#78847F] block">
                  Total Punches
                </span>
                <span className="text-xl font-black text-purple-700">
                  {telemetry?.operations.total_attendances ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Platform Accounts */}
      <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden">
        <div className="p-6 border-b border-[#E5EAE4] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#183B36] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Platform Account Telemetry
            </h3>
            <p className="text-xs text-[#78847F] mt-0.5">
              Most recent user accounts and authentication timestamps across all tenants.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5EAE4] bg-[#FBFDFB]">
                <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78847F]">
                  Account
                </th>
                <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78847F]">
                  Role
                </th>
                <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78847F]">
                  Status
                </th>
                <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78847F] text-right">
                  Last Login
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAE4]">
              {(telemetry?.recent_accounts || []).map((acc) => (
                <tr key={acc.id} className="hover:bg-[#F5F7F1]/60 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="font-bold text-[#183B36]">{acc.name}</div>
                    <div className="text-[11px] text-[#78847F]">{acc.email}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                      {acc.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge variant={acc.is_active ? 'success' : 'danger'} dot>
                      {acc.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono text-[11px] text-[#78847F]">
                    {acc.last_login_at ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {new Date(acc.last_login_at).toLocaleString()}
                      </span>
                    ) : (
                      'Never logged in'
                    )}
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

export default SuperAdminTelemetryPage
