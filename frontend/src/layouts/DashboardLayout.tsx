import React, { useState, useEffect } from 'react'
import { Sidebar } from '../components/dashboard/Sidebar'
import { Topbar } from '../components/dashboard/Topbar'

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
  userName = 'Marcus Vance',
  userEmail = 'owner@acmeglobal.com',
  orgName = 'Acme Logistics Global',
  planName = 'Professional Tier',
  branchName = 'HQ - Tech Park Branch',
}) => {
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
        orgName={orgName}
        planName={planName}
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
          userName={userName}
          userEmail={userEmail}
          orgName={orgName}
          branchName={branchName}
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
