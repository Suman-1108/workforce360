import React, { useState, useEffect, useCallback } from 'react'
import { Sidebar, type SidebarCounts } from '../components/dashboard/Sidebar'
import { Topbar } from '../components/dashboard/Topbar'
import { reportsApi, organizationApi } from '../services/api'

export interface DashboardLayoutProps {
  children: React.ReactNode
  currentRoute: string
  onRouteChange: (route: string) => void
  onLogout: () => void
  userName?: string
  userEmail?: string
  orgName?: string
  planName?: string
  branchName?: string
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentRoute,
  onRouteChange,
  onLogout,
  userName,
  userEmail,
  orgName,
  planName,
  branchName,
}) => {
  // Read logged-in user details from localStorage
  const [storedUser, setStoredUser] = useState<{
    first_name?: string
    last_name?: string
    email?: string
    role?: string
    tenant?: { name?: string }
  }>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem('wf360_user')
      if (raw) {
        setStoredUser(JSON.parse(raw))
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  const [navCounts, setNavCounts] = useState<SidebarCounts>({})
  const [liveOrgName, setLiveOrgName] = useState<string>('')
  const [livePlanName, setLivePlanName] = useState<string>('')
  const [liveSubStatus, setLiveSubStatus] = useState<string>('Active')
  const [liveBranches, setLiveBranches] = useState<string[]>([])

  const fetchDynamicLayoutData = useCallback(() => {
    reportsApi
      .getSummary()
      .then((summary) => {
        if (!summary || typeof summary !== 'object') return
        setNavCounts({
          employees:
            typeof summary.total_employees === 'number' ? summary.total_employees : undefined,
          checkedInToday:
            typeof summary.checked_in_today === 'number'
              ? summary.checked_in_today
              : typeof summary.present_today === 'number'
              ? summary.present_today
              : 0,
          activeShifts:
            typeof summary.active_shifts === 'number' ? summary.active_shifts : undefined,
          departments:
            typeof summary.total_departments === 'number' ? summary.total_departments : undefined,
          pendingLeaves:
            typeof summary.pending_leaves === 'number' ? summary.pending_leaves : undefined,
          uniformItems:
            typeof summary.total_uniform_items === 'number'
              ? summary.total_uniform_items
              : undefined,
          openTickets:
            typeof summary.open_tickets === 'number' ? summary.open_tickets : undefined,
          unreadNotifications:
            typeof summary.unread_notifications === 'number'
              ? summary.unread_notifications
              : undefined,
        })
        if (summary.organization_name) setLiveOrgName(summary.organization_name)
        if (summary.plan_name) setLivePlanName(summary.plan_name)
        if (summary.subscription_status) setLiveSubStatus(summary.subscription_status)
      })
      .catch(() => {})

    organizationApi
      .listBranches()
      .then((res) => {
        const raw = res?.data ?? res
        const items = Array.isArray(raw) ? raw : raw?.items || []
        const names = items.map((b: any) => b?.name).filter(Boolean)
        if (names.length > 0) {
          setLiveBranches(names)
        }
      })
      .catch(() => {})
  }, [])

  // Refresh dynamic sidebar counts on mount, on route change, on custom event, and periodically
  useEffect(() => {
    fetchDynamicLayoutData()
  }, [currentRoute, fetchDynamicLayoutData])

  useEffect(() => {
    const handler = () => fetchDynamicLayoutData()
    window.addEventListener('wf360:refresh-counts', handler)
    const interval = window.setInterval(fetchDynamicLayoutData, 60000)
    return () => {
      window.removeEventListener('wf360:refresh-counts', handler)
      window.clearInterval(interval)
    }
  }, [fetchDynamicLayoutData])

  const resolvedUserName =
    userName ||
    [storedUser.first_name, storedUser.last_name].filter(Boolean).join(' ').trim() ||
    'Organization Owner'
  const resolvedUserEmail = userEmail || storedUser.email || ''
  const resolvedUserRole =
    storedUser.role === 'superadmin'
      ? 'Super Admin'
      : storedUser.role === 'manager'
      ? 'Branch Manager'
      : 'Organization Owner'
  const resolvedOrgName = orgName || liveOrgName || storedUser.tenant?.name || 'WorkForce 360'
  const resolvedPlanName = planName || livePlanName || 'Standard Plan'
  const resolvedBranchName = branchName || liveBranches[0] || 'Main Branch'

  // Read saved desktop sidebar collapsed preference from localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('wf360_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  // Mobile navigation drawer open state
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)

  // Toggle desktop collapsed state & persist to localStorage
  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('wf360_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  // Close mobile drawer on route changes or resize to desktop
  useEffect(() => {
    setMobileOpen(false)
  }, [currentRoute])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-[#F5F7F1] text-[#183B36] flex flex-col font-sans overflow-x-hidden">
      {/* Persistent Desktop Sidebar & Mobile Drawer */}
      <Sidebar
        currentRoute={currentRoute}
        onRouteChange={onRouteChange}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onLogout={onLogout}
        orgName={resolvedOrgName}
        planName={resolvedPlanName}
        subscriptionStatus={liveSubStatus}
        navCounts={navCounts}
      />

      {/* Main Content Container
          Dynamically padded on desktop based on collapse state (260px vs 76px)
          Padding is 0 on mobile screens.
      */}
      <div
        className={`
          flex flex-col flex-1 min-w-0 transition-[padding] duration-300 ease-in-out
          ${isCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[260px]'}
        `}
      >
        {/* Topbar */}
        <Topbar
          onToggleSidebar={() => setMobileOpen((prev) => !prev)}
          onToggleCollapse={handleToggleCollapse}
          isCollapsed={isCollapsed}
          onLogout={onLogout}
          userName={resolvedUserName}
          userEmail={resolvedUserEmail}
          userRole={resolvedUserRole}
          orgName={resolvedOrgName}
          branchName={resolvedBranchName}
          branches={liveBranches}
          onNavigateToNotifications={() => onRouteChange('notifications')}
          onNavigateToSettings={() => onRouteChange('settings')}
          onNavigateToSubscription={() => onRouteChange('subscription')}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
