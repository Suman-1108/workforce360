import React, { useState, useEffect } from 'react'
import {
  Shirt,
  ClipboardList,
  LifeBuoy,
  Coffee,
  Landmark,
  Wallet,
  KeyRound,
  Save,
  RefreshCw,
  CheckCircle2,
  Send,
  Edit3,
  Utensils,
  ShieldCheck,
} from 'lucide-react'
import { Button, Badge, Modal } from '../../components/common'
import { portalApi } from '../../services/api'

type OwnerDeskTab = 'uniform' | 'work' | 'support' | 'breaks' | 'payroll'

export const OwnerDeskPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OwnerDeskTab>('payroll')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // 1. Today's Uniform state
  const [uniformForm, setUniformForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    uniform_title: 'Standard Operations Polo & Safety Gear',
    dress_code: 'Smart Field Uniform',
    color_theme: 'Emerald Green & Charcoal',
    items_required: 'Company Polo Shirt, ID Lanyard, Closed-Toe Safety Shoes',
    notes: 'Ensure company ID badge is visible before shift check-in.',
  })

  // 2. Work Updates state
  const [workUpdates, setWorkUpdates] = useState<any[]>([])
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<number, string>>({})

  // 3. Support Tickets state
  const [tickets, setTickets] = useState<any[]>([])
  const [ticketResponses, setTicketResponses] = useState<Record<number, string>>({})
  const [ticketStatuses, setTicketStatuses] = useState<Record<number, string>>({})

  // 4. Breaks state
  const [breaksData, setBreaksData] = useState<{ breaks: any[]; total_minutes: number }>({
    breaks: [],
    total_minutes: 0,
  })

  // 5. Payroll & Company Bank state
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_or_routing: '',
    branch_name: '',
    account_type: 'Current / Payroll Account',
    upi_or_payment_ref: '',
    payroll_cycle: 'Monthly (Last Working Day)',
    security_pin: '',
    pin_enabled: true,
    has_pin_set: false,
  })
  const [employeeSalaries, setEmployeeSalaries] = useState<any[]>([])
  const [editingSalary, setEditingSalary] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)

  const notify = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const loadAll = async () => {
    setIsLoading(true)
    try {
      const [uni, wrk, tkt, brk, fin] = await Promise.all([
        portalApi.getUniformToday().catch(() => null),
        portalApi.listWorkUpdates('all').catch(() => []),
        portalApi.listTickets('all').catch(() => []),
        portalApi.getTodayBreaks('all').catch(() => ({ breaks: [], total_minutes: 0 })),
        portalApi.ownerGetFinanceConfig().catch(() => null),
      ])

      if (uni) {
        setUniformForm({
          date: uni.date || new Date().toISOString().slice(0, 10),
          uniform_title: uni.uniform_title || '',
          dress_code: uni.dress_code || '',
          color_theme: uni.color_theme || '',
          items_required: uni.items_required || '',
          notes: uni.notes || '',
        })
      }
      if (Array.isArray(wrk)) setWorkUpdates(wrk)
      if (Array.isArray(tkt)) {
        setTickets(tkt)
        const sMap: Record<number, string> = {}
        const rMap: Record<number, string> = {}
        tkt.forEach((item: any) => {
          sMap[item.id] = item.status
          rMap[item.id] = item.owner_response || ''
        })
        setTicketStatuses(sMap)
        setTicketResponses(rMap)
      }
      if (brk) setBreaksData(brk)
      if (fin) {
        if (fin.company_bank) {
          setBankForm({
            bank_name: fin.company_bank.bank_name || '',
            account_holder_name: fin.company_bank.account_holder_name || '',
            account_number: fin.company_bank.account_number || '',
            ifsc_or_routing: fin.company_bank.ifsc_or_routing || '',
            branch_name: fin.company_bank.branch_name || '',
            account_type: fin.company_bank.account_type || 'Current / Payroll Account',
            upi_or_payment_ref: fin.company_bank.upi_or_payment_ref || '',
            payroll_cycle: fin.company_bank.payroll_cycle || 'Monthly (Last Working Day)',
            security_pin: '',
            pin_enabled: Boolean(fin.company_bank.pin_enabled),
            has_pin_set: Boolean(fin.company_bank.has_pin_set),
          })
        }
        if (Array.isArray(fin.employee_salaries)) {
          setEmployeeSalaries(fin.employee_salaries)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const handleSaveUniform = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await portalApi.setUniformToday(uniformForm)
      notify("Today's uniform dress code published to all employees!")
      await loadAll()
    } catch (err: any) {
      notify(err?.response?.data?.detail || 'Failed to save daily uniform.')
    } finally {
      setSaving(false)
    }
  }

  const handlePostWorkFeedback = async (updateId: number) => {
    const fb = (feedbackDrafts[updateId] || '').trim()
    if (!fb) return
    try {
      await portalApi.addWorkUpdateFeedback(updateId, fb)
      notify('Feedback sent to employee work update.')
      setFeedbackDrafts((prev) => ({ ...prev, [updateId]: '' }))
      await loadAll()
    } catch {
      notify('Failed to post feedback.')
    }
  }

  const handleUpdateTicket = async (ticketId: number) => {
    try {
      await portalApi.updateTicket(ticketId, {
        status: (ticketStatuses[ticketId] as any) || 'In Review',
        owner_response: ticketResponses[ticketId] || '',
      })
      notify('Support ticket status & response updated.')
      window.dispatchEvent(new Event('wf360:refresh-counts'))
      await loadAll()
    } catch {
      notify('Failed to update support ticket.')
    }
  }

  const handleSaveCompanyBank = async (e: React.FormEvent) => {
    e.preventDefault()
    if (bankForm.security_pin && !/^\d{4,6}$/.test(bankForm.security_pin)) {
      notify('Security PIN must be 4 to 6 numeric digits.')
      return
    }
    setSaving(true)
    try {
      await portalApi.ownerUpdateCompanyBank({
        bank_name: bankForm.bank_name,
        account_holder_name: bankForm.account_holder_name,
        account_number: bankForm.account_number,
        ifsc_or_routing: bankForm.ifsc_or_routing,
        branch_name: bankForm.branch_name,
        account_type: bankForm.account_type,
        upi_or_payment_ref: bankForm.upi_or_payment_ref || undefined,
        payroll_cycle: bankForm.payroll_cycle,
        security_pin: bankForm.security_pin || undefined,
        pin_enabled: bankForm.pin_enabled,
      })
      notify('Company bank account details & Security PIN saved!')
      await loadAll()
    } catch (err: any) {
      notify(err?.response?.data?.detail || 'Failed to update company bank account.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEmployeeSalary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSalary) return
    setSaving(true)
    try {
      await portalApi.ownerUpdateEmployeeSalary(editingSalary.employee_id, {
        basic_salary: Number(editingSalary.basic_salary),
        hra_allowance: Number(editingSalary.hra_allowance),
        transport_allowance: Number(editingSalary.transport_allowance),
        other_allowances: Number(editingSalary.other_allowances),
        tax_deduction: Number(editingSalary.tax_deduction),
        pf_deduction: Number(editingSalary.pf_deduction),
        other_deductions: Number(editingSalary.other_deductions),
        currency: editingSalary.currency || 'USD',
        pay_frequency: editingSalary.pay_frequency || 'Monthly',
        last_paid_date: editingSalary.last_paid_date || undefined,
        payment_status: editingSalary.payment_status || 'Paid',
        employee_bank_name: editingSalary.employee_bank_name || undefined,
        employee_account_number: editingSalary.employee_account_number || undefined,
        employee_ifsc: editingSalary.employee_ifsc || undefined,
      })
      notify(`Salary updated for ${editingSalary.employee_name}.`)
      setEditingSalary(null)
      await loadAll()
    } catch (err: any) {
      notify(err?.response?.data?.detail || 'Failed to update salary.')
    } finally {
      setSaving(false)
    }
  }

  const tabs: Array<{ id: OwnerDeskTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'payroll', label: 'Salary & Bank PIN', icon: <Landmark className="h-4 w-4" /> },
    { id: 'uniform', label: "Today's Uniform", icon: <Shirt className="h-4 w-4" /> },
    { id: 'work', label: 'Work Updates', icon: <ClipboardList className="h-4 w-4" />, badge: workUpdates.length },
    {
      id: 'support',
      label: 'Complaints & Support',
      icon: <LifeBuoy className="h-4 w-4" />,
      badge: tickets.filter((t) => t.status === 'Open').length,
    },
    {
      id: 'breaks',
      label: 'Tea & Lunch Breaks',
      icon: <Coffee className="h-4 w-4" />,
      badge: breaksData.breaks.filter((b) => b.status === 'Active').length,
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
            Employee Desk &amp; Payroll Vault
          </h1>
          <p className="text-xs sm:text-sm text-[#78847F] mt-1">
            Configure PIN-protected company bank details, employee salaries, today&apos;s uniform, work updates, support complaints, and live breaks.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadAll}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Refresh All
        </Button>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-[#E6F3F1] border border-[#BDE0D9] text-xs font-bold text-[#075E54] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Sub-tab Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border
                ${
                  active
                    ? 'bg-[#075E54] text-white border-[#075E54] shadow-sm'
                    : 'bg-white text-[#5A6B65] border-[#E5EAE4] hover:border-[#075E54]/40 hover:text-[#183B36]'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    active ? 'bg-white/20 text-white' : 'bg-[#FFF0E6] text-[#EA580C]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ================================================================= */}
      {/* TAB 1: SALARY & COMPANY BANK ACCOUNT (PIN VAULT CONFIG)          */}
      {/* ================================================================= */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Company Bank Details & Security PIN Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5EAE4] card-soft-shadow space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-[#183B36] flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-[#075E54]" />
                  Company Bank Account &amp; Security PIN
                </h2>
                <p className="text-xs text-[#78847F] mt-0.5">
                  Employees must enter the Security PIN to view company bank details and salary breakdowns.
                </p>
              </div>
              <Badge variant={bankForm.has_pin_set ? 'success' : 'warning'} dot>
                {bankForm.has_pin_set ? 'Vault PIN Active' : 'No PIN Set Yet'}
              </Badge>
            </div>

            <form onSubmit={handleSaveCompanyBank} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#183B36] mb-1">Bank Name *</label>
                  <input
                    type="text"
                    value={bankForm.bank_name}
                    onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                    required
                    className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs text-[#183B36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#183B36] mb-1">Account Holder Name *</label>
                  <input
                    type="text"
                    value={bankForm.account_holder_name}
                    onChange={(e) => setBankForm({ ...bankForm, account_holder_name: e.target.value })}
                    required
                    className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs text-[#183B36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#183B36] mb-1">Account Number *</label>
                  <input
                    type="text"
                    value={bankForm.account_number}
                    onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                    required
                    className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs font-mono text-[#183B36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#183B36] mb-1">IFSC / Routing Code *</label>
                  <input
                    type="text"
                    value={bankForm.ifsc_or_routing}
                    onChange={(e) => setBankForm({ ...bankForm, ifsc_or_routing: e.target.value })}
                    required
                    className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs font-mono text-[#183B36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#183B36] mb-1">Branch Name *</label>
                  <input
                    type="text"
                    value={bankForm.branch_name}
                    onChange={(e) => setBankForm({ ...bankForm, branch_name: e.target.value })}
                    required
                    className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs text-[#183B36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#183B36] mb-1">Account Type</label>
                  <input
                    type="text"
                    value={bankForm.account_type}
                    onChange={(e) => setBankForm({ ...bankForm, account_type: e.target.value })}
                    className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs text-[#183B36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#183B36] mb-1">Payroll Cycle</label>
                  <input
                    type="text"
                    value={bankForm.payroll_cycle}
                    onChange={(e) => setBankForm({ ...bankForm, payroll_cycle: e.target.value })}
                    className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs text-[#183B36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#183B36] mb-1">UPI / Payment Reference</label>
                  <input
                    type="text"
                    value={bankForm.upi_or_payment_ref}
                    onChange={(e) => setBankForm({ ...bankForm, upi_or_payment_ref: e.target.value })}
                    className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs text-[#183B36]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#075E54] mb-1 flex items-center gap-1">
                    <KeyRound className="h-3.5 w-3.5" />
                    {bankForm.has_pin_set ? 'Update Security PIN (4–6 digits)' : 'Set Security PIN (4–6 digits)'}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={bankForm.security_pin}
                    onChange={(e) => setBankForm({ ...bankForm, security_pin: e.target.value.replace(/\D/g, '') })}
                    placeholder={bankForm.has_pin_set ? 'Leave blank to keep current PIN' : 'e.g. 1234'}
                    className="w-full rounded-2xl border-2 border-[#075E54]/40 bg-[#F2FAF8] px-3.5 py-2.5 text-xs font-mono tracking-widest text-[#183B36]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#183B36] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bankForm.pin_enabled}
                    onChange={(e) => setBankForm({ ...bankForm, pin_enabled: e.target.checked })}
                    className="rounded border-[#CBD5C8] text-[#075E54]"
                  />
                  <ShieldCheck className="h-4 w-4 text-[#075E54]" />
                  <span>Require Security PIN to view Company Bank &amp; Salary Details</span>
                </label>

                <Button type="submit" variant="primary" isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>
                  Save Bank Details &amp; PIN
                </Button>
              </div>
            </form>
          </div>

          {/* Employee Salary Profiles Table */}
          <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden">
            <div className="p-6 border-b border-[#E5EAE4] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#183B36] flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-[#075E54]" />
                  Employee Salary Profiles
                </h3>
                <p className="text-xs text-[#78847F] mt-0.5">
                  Configure individual monthly earnings, allowances, deductions, and payout status.
                </p>
              </div>
              <Badge variant="neutral">{employeeSalaries.length} Staff</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5EAE4] bg-[#FBFDFB]">
                    <th className="px-6 py-3.5 font-bold uppercase text-[#78847F]">Employee</th>
                    <th className="px-6 py-3.5 font-bold uppercase text-[#78847F]">Gross Pay</th>
                    <th className="px-6 py-3.5 font-bold uppercase text-[#78847F]">Deductions</th>
                    <th className="px-6 py-3.5 font-bold uppercase text-[#78847F]">Net Salary</th>
                    <th className="px-6 py-3.5 font-bold uppercase text-[#78847F]">Status</th>
                    <th className="px-6 py-3.5 font-bold uppercase text-[#78847F] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAE4]">
                  {employeeSalaries.map((sal) => (
                    <tr key={sal.employee_id} className="hover:bg-[#F5F7F1]/60">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#183B36]">{sal.employee_name}</div>
                        <div className="text-[11px] text-[#78847F]">
                          {sal.employee_code} &bull; {sal.designation}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-[#183B36]">
                        {sal.currency} {Number(sal.gross_salary || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-rose-600">
                        -{sal.currency} {Number(sal.total_deductions || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono font-black text-[#075E54]">
                        {sal.currency} {Number(sal.net_salary || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={sal.payment_status === 'Paid' ? 'success' : 'warning'} dot>
                          {sal.payment_status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingSalary({ ...sal })}
                          leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                        >
                          Edit Salary
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: SET TODAY'S UNIFORM                                       */}
      {/* ================================================================= */}
      {activeTab === 'uniform' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5EAE4] card-soft-shadow space-y-5">
          <div>
            <h2 className="text-lg font-extrabold text-[#183B36] flex items-center gap-2">
              <Shirt className="h-5 w-5 text-[#075E54]" />
              Set Today&apos;s Uniform &amp; Dress Code
            </h2>
            <p className="text-xs text-[#78847F] mt-0.5">
              This schedule appears immediately on every employee&apos;s Today dashboard.
            </p>
          </div>

          <form onSubmit={handleSaveUniform} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#183B36] mb-1">Schedule Date</label>
                <input
                  type="date"
                  value={uniformForm.date}
                  onChange={(e) => setUniformForm({ ...uniformForm, date: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs text-[#183B36]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#183B36] mb-1">Uniform Title *</label>
                <input
                  type="text"
                  value={uniformForm.uniform_title}
                  onChange={(e) => setUniformForm({ ...uniformForm, uniform_title: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs text-[#183B36]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#183B36] mb-1">Dress Code *</label>
                <input
                  type="text"
                  value={uniformForm.dress_code}
                  onChange={(e) => setUniformForm({ ...uniformForm, dress_code: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs text-[#183B36]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#183B36] mb-1">Color Theme *</label>
                <input
                  type="text"
                  value={uniformForm.color_theme}
                  onChange={(e) => setUniformForm({ ...uniformForm, color_theme: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs text-[#183B36]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#183B36] mb-1">Required Gear / Items *</label>
              <input
                type="text"
                value={uniformForm.items_required}
                onChange={(e) => setUniformForm({ ...uniformForm, items_required: e.target.value })}
                required
                className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-3.5 py-2.5 text-xs text-[#183B36]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#183B36] mb-1">Manager Notes</label>
              <textarea
                rows={2}
                value={uniformForm.notes}
                onChange={(e) => setUniformForm({ ...uniformForm, notes: e.target.value })}
                className="w-full rounded-2xl border border-[#CBD5C8] bg-[#FBFDFB] px-4 py-2.5 text-xs text-[#183B36]"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>
                Publish Today&apos;s Uniform
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: EMPLOYEE DAILY WORK UPDATES                               */}
      {/* ================================================================= */}
      {activeTab === 'work' && (
        <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden">
          <div className="p-6 border-b border-[#E5EAE4] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#183B36]">Employee Daily Work Updates</h3>
              <p className="text-xs text-[#78847F]">Review daily progress reports and post feedback.</p>
            </div>
            <Badge variant="neutral">{workUpdates.length} Updates</Badge>
          </div>
          {workUpdates.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#78847F]">No employee work updates submitted yet.</div>
          ) : (
            <div className="divide-y divide-[#E5EAE4]">
              {workUpdates.map((u) => (
                <div key={u.id} className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-[#183B36]">{u.task_title}</span>
                      <span className="text-xs text-[#78847F] ml-2">
                        by <strong className="text-[#075E54]">{u.employee_name}</strong> ({u.employee_code}) &bull; {u.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#075E54] bg-[#E6F3F1] px-2.5 py-0.5 rounded-full">
                        {u.hours_spent}h
                      </span>
                      <Badge
                        variant={
                          u.progress_status === 'Completed'
                            ? 'success'
                            : u.progress_status === 'Blocked'
                            ? 'danger'
                            : 'warning'
                        }
                        dot
                      >
                        {u.progress_status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-[#4A5A55]">{u.summary}</p>
                  {u.owner_feedback && (
                    <div className="p-2.5 rounded-xl bg-[#F5F7F1] border border-[#CBD5C8] text-xs text-[#183B36]">
                      <span className="font-bold text-[#075E54]">Your Feedback:</span> {u.owner_feedback}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feedbackDrafts[u.id] || ''}
                      onChange={(e) => setFeedbackDrafts({ ...feedbackDrafts, [u.id]: e.target.value })}
                      placeholder="Write owner/manager feedback..."
                      className="flex-1 rounded-xl border border-[#CBD5C8] bg-[#FBFDFB] px-3 py-2 text-xs text-[#183B36]"
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handlePostWorkFeedback(u.id)}
                      leftIcon={<Send className="h-3.5 w-3.5" />}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: EMPLOYEE COMPLAINTS & SUPPORT TICKETS                     */}
      {/* ================================================================= */}
      {activeTab === 'support' && (
        <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden">
          <div className="p-6 border-b border-[#E5EAE4] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#183B36]">Employee Complaints &amp; Support Queue</h3>
              <p className="text-xs text-[#78847F]">Respond to raised complaints and resolve tickets.</p>
            </div>
            <Badge variant="neutral">{tickets.length} Tickets</Badge>
          </div>
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#78847F]">No employee complaints or tickets raised yet.</div>
          ) : (
            <div className="divide-y divide-[#E5EAE4]">
              {tickets.map((t) => (
                <div key={t.id} className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#F5F7F1] text-[#075E54] border border-[#CBD5C8]">
                        {t.ticket_number}
                      </span>
                      <span className="font-bold text-sm text-[#183B36]">{t.subject}</span>
                      <span className="text-xs text-[#78847F]">
                        ({t.employee_name} &bull; {t.category} &bull; {t.priority})
                      </span>
                    </div>
                    <Badge
                      variant={
                        t.status === 'Resolved' || t.status === 'Closed'
                          ? 'success'
                          : t.status === 'In Review'
                          ? 'warning'
                          : 'danger'
                      }
                      dot
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#4A5A55]">{t.description}</p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      value={ticketStatuses[t.id] || t.status}
                      onChange={(e) => setTicketStatuses({ ...ticketStatuses, [t.id]: e.target.value })}
                      className="rounded-xl border border-[#CBD5C8] bg-[#FBFDFB] px-3 py-2 text-xs font-semibold text-[#183B36]"
                    >
                      <option value="Open">Open</option>
                      <option value="In Review">In Review</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                    <input
                      type="text"
                      value={ticketResponses[t.id] ?? ''}
                      onChange={(e) => setTicketResponses({ ...ticketResponses, [t.id]: e.target.value })}
                      placeholder="Write official Owner/HR response..."
                      className="flex-1 rounded-xl border border-[#CBD5C8] bg-[#FBFDFB] px-3 py-2 text-xs text-[#183B36]"
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleUpdateTicket(t.id)}
                      leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    >
                      Update Ticket
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 5: LIVE TEA & LUNCH BREAKS MONITOR                           */}
      {/* ================================================================= */}
      {activeTab === 'breaks' && (
        <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden">
          <div className="p-6 border-b border-[#E5EAE4] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#183B36]">Today&apos;s Tea &amp; Lunch Break Logs</h3>
              <p className="text-xs text-[#78847F]">Live employee break sessions across the organization.</p>
            </div>
            <Badge variant="neutral">{breaksData.total_minutes} total mins</Badge>
          </div>
          {breaksData.breaks.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#78847F]">No tea or lunch breaks logged today.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5EAE4] bg-[#FBFDFB]">
                    <th className="px-6 py-3.5 font-bold uppercase text-[#78847F]">Employee</th>
                    <th className="px-6 py-3.5 font-bold uppercase text-[#78847F]">Break Type</th>
                    <th className="px-6 py-3.5 font-bold uppercase text-[#78847F]">Start &ndash; End</th>
                    <th className="px-6 py-3.5 font-bold uppercase text-[#78847F]">Duration</th>
                    <th className="px-6 py-3.5 font-bold uppercase text-[#78847F] text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAE4]">
                  {breaksData.breaks.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F5F7F1]/60">
                      <td className="px-6 py-3.5 font-bold text-[#183B36]">
                        {b.employee_name}{' '}
                        <span className="font-normal text-[#78847F]">({b.employee_code})</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#183B36]">
                          {b.break_type === 'Tea Break' ? (
                            <Coffee className="h-3.5 w-3.5 text-[#EA580C]" />
                          ) : (
                            <Utensils className="h-3.5 w-3.5 text-[#075E54]" />
                          )}
                          {b.break_type}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-[11px] text-[#78847F]">
                        {b.start_time ? new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                        {' – '}
                        {b.end_time ? new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-bold text-[#075E54]">{b.duration_minutes} mins</td>
                      <td className="px-6 py-3.5 text-right">
                        <Badge variant={b.status === 'Active' ? 'warning' : 'success'} dot>
                          {b.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Employee Salary Modal */}
      <Modal
        isOpen={Boolean(editingSalary)}
        onClose={() => setEditingSalary(null)}
        title={`Edit Salary — ${editingSalary?.employee_name || ''}`}
        description="Update earnings, allowances, deductions, and employee payout account details."
        size="md"
      >
        {editingSalary && (
          <form onSubmit={handleSaveEmployeeSalary} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-[#183B36] mb-1">Basic Salary</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editingSalary.basic_salary}
                  onChange={(e) => setEditingSalary({ ...editingSalary, basic_salary: Number(e.target.value) })}
                  className="w-full rounded-xl border border-[#CBD5C8] px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-[#183B36] mb-1">HRA Allowance</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editingSalary.hra_allowance}
                  onChange={(e) => setEditingSalary({ ...editingSalary, hra_allowance: Number(e.target.value) })}
                  className="w-full rounded-xl border border-[#CBD5C8] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-[#183B36] mb-1">Transport Allowance</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editingSalary.transport_allowance}
                  onChange={(e) =>
                    setEditingSalary({ ...editingSalary, transport_allowance: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-[#CBD5C8] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-[#183B36] mb-1">Other Allowances</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editingSalary.other_allowances}
                  onChange={(e) =>
                    setEditingSalary({ ...editingSalary, other_allowances: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-[#CBD5C8] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-rose-700 mb-1">Tax Deduction</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editingSalary.tax_deduction}
                  onChange={(e) => setEditingSalary({ ...editingSalary, tax_deduction: Number(e.target.value) })}
                  className="w-full rounded-xl border border-[#CBD5C8] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-rose-700 mb-1">PF Deduction</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editingSalary.pf_deduction}
                  onChange={(e) => setEditingSalary({ ...editingSalary, pf_deduction: Number(e.target.value) })}
                  className="w-full rounded-xl border border-[#CBD5C8] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-[#183B36] mb-1">Currency</label>
                <input
                  type="text"
                  value={editingSalary.currency || 'USD'}
                  onChange={(e) => setEditingSalary({ ...editingSalary, currency: e.target.value })}
                  className="w-full rounded-xl border border-[#CBD5C8] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-[#183B36] mb-1">Payment Status</label>
                <select
                  value={editingSalary.payment_status || 'Paid'}
                  onChange={(e) => setEditingSalary({ ...editingSalary, payment_status: e.target.value })}
                  className="w-full rounded-xl border border-[#CBD5C8] px-3 py-2"
                >
                  <option value="Paid">Paid</option>
                  <option value="Processing">Processing</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingSalary(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={saving}>
                Save Salary Profile
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default OwnerDeskPage
