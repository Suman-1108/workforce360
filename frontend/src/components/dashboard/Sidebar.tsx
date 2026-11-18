import React from 'react'
import {
  Layers,
  LayoutDashboard,
  Users,
  MapPin,
  Calendar,
  Building,
  Coffee,
  Shirt,
  BarChart3,
  Bell,
  CreditCard,
  Settings,
  LogOut,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Landmark,
} from 'lucide-react'

export interface SidebarProps {
  currentRoute: string
  onRouteChange: (route: string) => void
  onLogout: () => void
  orgName?: string
  planName?: string
  // Desktop persistent collapse state (260px vs 76px)
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  // Mobile slide-in drawer state
  isMobileOpen?: boolean
  onMobileClose?: () => void
  // Legacy compatibility props
  isOpen?: boolean
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onRouteChange,
  onLogout,
  orgName = 'Acme Logistics Global',
  planName = 'Professional Tier',
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileClose,
  isOpen,
  onClose,
}) => {
  // Support legacy props if passed
  const mobileOpen = isMobileOpen ?? isOpen ?? false
  const closeMobile = onMobileClose ?? onClose ?? (() => {})

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5 shrink-0" /> },
    { id: 'employees', label: 'Employees', icon: <Users className="h-4.5 w-4.5 shrink-0" />, badge: '148' },
    { id: 'attendance', label: 'Attendance', icon: <MapPin className="h-4.5 w-4.5 shrink-0" />, badge: 'Live' },
    { id: 'shifts', label: 'Shifts', icon: <Calendar className="h-4.5 w-4.5 shrink-0" /> },
    { id: 'departments', label: 'Departments', icon: <Building className="h-4.5 w-4.5 shrink-0" /> },
    { id: 'leave', label: 'Leave Management', icon: <Coffee className="h-4.5 w-4.5 shrink-0" />, badge: '3' },
    { id: 'uniforms', label: 'Uniform Management', icon: <Shirt className="h-4.5 w-4.5 shrink-0" /> },
    { id: 'desk', label: 'Employee Desk & Payroll', icon: <Landmark className="h-4.5 w-4.5 shrink-0" />, badge: 'New' },
    { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 className="h-4.5 w-4.5 shrink-0" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4.5 w-4.5 shrink-0" /> },
    { id: 'subscription', label: 'Subscription', icon: <CreditCard className="h-4.5 w-4.5 shrink-0" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4.5 w-4.5 shrink-0" /> },
  ]

  return (
    <>
      {/* =========================================================================
          1. MOBILE NAVIGATION DRAWER (< lg)
          Uses hamburger trigger, backdrop blur overlay, accessible touch targets,
          auto-close on selection, and zero horizontal page overflow.
         ========================================================================= */}
      <div className="lg:hidden">
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-[#183B36]/40 backdrop-blur-xs z-50 transition-opacity duration-300"
            onClick={closeMobile}
            aria-hidden="true"
          />
        )}
        
        <aside
          aria-label="Mobile Navigation"
          className={`
            fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-[#E5EAE4]
            flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[#E5EAE4]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-[#075E54] flex items-center justify-center text-white shadow-xs">
                    <Layers className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-black tracking-tight text-[#183B36]">
                      WorkForce<span className="text-[#FF8B45]">360</span>
                    </span>
                    <span className="text-[9px] font-bold text-[#78847F] uppercase tracking-wider">
                      Org Owner Portal
                    </span>
                  </div>
                </div>

                <button
                  onClick={closeMobile}
                  className="p-2 rounded-xl text-[#78847F] hover:bg-[#F5F7F1] hover:text-[#183B36] cursor-pointer transition-colors"
                  aria-label="Close navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Organization Pill */}
              <div className="bg-[#F5F7F1] rounded-2xl p-3 border border-[#E5EAE4]">
                <div className="text-xs font-bold text-[#183B36] truncate">{orgName}</div>
                <div className="flex items-center justify-between text-[11px] text-[#78847F] mt-1">
                  <span className="flex items-center gap-1 text-[#075E54] font-medium">
                    <Sparkles className="h-3 w-3 text-[#FF8B45]" />
                    {planName}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Nav Links */}
            <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = currentRoute === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onRouteChange(item.id)
                      closeMobile()
                    }}
                    className={`
                      w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold
                      transition-all duration-150 cursor-pointer text-left
                      ${
                        isActive
                          ? 'bg-[#075E54] text-white shadow-xs'
                          : 'text-[#183B36] hover:bg-[#F5F7F1] hover:text-[#075E54]'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-white' : 'text-[#78847F]'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`
                          text-[10px] font-bold px-2 py-0.5 rounded-full
                          ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badge === 'Live'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-[#FFF0E6] text-[#FF8B45] border border-[#FFD4BA]'
                          }
                        `}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-[#E5EAE4]">
              <button
                onClick={() => {
                  closeMobile()
                  onLogout()
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out of Portal</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* =========================================================================
          2. PERSISTENT DESKTOP SIDEBAR (lg+)
          Two persistent states:
          - Expanded: 260px width
          - Collapsed: 76px width (icons only, hover tooltips, active indicator preserved)
          Never disappears completely or converts to a drawer on desktop.
         ========================================================================= */}
      <aside
        aria-label="Desktop Navigation"
        className={`
          hidden lg:flex fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-[#E5EAE4]
          flex-col justify-between transition-[width] duration-300 ease-in-out select-none
          ${isCollapsed ? 'w-[76px]' : 'w-[260px]'}
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className={`border-b border-[#E5EAE4] transition-all duration-300 ${isCollapsed ? 'p-3' : 'p-5'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between mb-3'}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="h-10 w-10 shrink-0 rounded-2xl bg-[#075E54] flex items-center justify-center text-white shadow-xs cursor-pointer hover:bg-[#064e46] transition-colors"
                  onClick={onToggleCollapse}
                  title={isCollapsed ? 'Click to expand sidebar (260px)' : 'WorkForce 360'}
                >
                  <Layers className="h-5.5 w-5.5 text-white" />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0 overflow-hidden">
                    <span className="text-base font-black tracking-tight text-[#183B36] truncate">
                      WorkForce<span className="text-[#FF8B45]">360</span>
                    </span>
                    <span className="text-[9px] font-bold text-[#78847F] uppercase tracking-wider truncate">
                      Org Owner Portal
                    </span>
                  </div>
                )}
              </div>

              {/* Collapse/Expand Toggle Button */}
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className={`
                    p-1.5 rounded-xl text-[#78847F] hover:bg-[#F5F7F1] hover:text-[#075E54]
                    border border-[#E5EAE4] cursor-pointer transition-colors
                    ${isCollapsed ? 'mt-1' : ''}
                  `}
                  aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  title={isCollapsed ? 'Expand sidebar (260px)' : 'Collapse sidebar (76px)'}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            {/* Organization Info (Visible when expanded) */}
            {!isCollapsed && (
              <div className="bg-[#F5F7F1] rounded-2xl p-3 border border-[#E5EAE4] animate-in fade-in duration-200">
                <div className="text-xs font-bold text-[#183B36] truncate" title={orgName}>
                  {orgName}
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#78847F] mt-1">
                  <span className="flex items-center gap-1 text-[#075E54] font-medium truncate">
                    <Sparkles className="h-3 w-3 text-[#FF8B45] shrink-0" />
                    {planName}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 shrink-0">
                    Active
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links Scrollable List */}
          <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1.5 ${isCollapsed ? 'px-2' : 'px-3.5'}`}>
            {navItems.map((item) => {
              const isActive = currentRoute === item.id

              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => onRouteChange(item.id)}
                    className={`
                      relative w-full flex items-center transition-all duration-150 cursor-pointer text-left
                      ${
                        isCollapsed
                          ? 'h-11 justify-center rounded-xl px-0'
                          : 'px-3 py-2.5 rounded-2xl justify-between text-xs font-semibold'
                      }
                      ${
                        isActive
                          ? 'bg-[#075E54] text-white shadow-xs'
                          : 'text-[#183B36] hover:bg-[#F5F7F1] hover:text-[#075E54]'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {/* Icon and label */}
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                      <span className={`shrink-0 ${isActive ? 'text-white' : 'text-[#78847F] group-hover:text-[#075E54]'}`}>
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>

                    {/* Badge when expanded */}
                    {!isCollapsed && item.badge && (
                      <span
                        className={`
                          text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
                          ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badge === 'Live'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-[#FFF0E6] text-[#FF8B45] border border-[#FFD4BA]'
                          }
                        `}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Dot indicator when collapsed */}
                    {isCollapsed && item.badge && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#FF8B45] ring-2 ring-white" />
                    )}

                    {/* Active bar on left edge when collapsed */}
                    {isCollapsed && isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#FF8B45] rounded-r-full" />
                    )}
                  </button>

                  {/* Floating Tooltip in Collapsed State */}
                  {isCollapsed && (
                    <div
                      role="tooltip"
                      className={`
                        absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
                        px-3 py-1.5 rounded-xl bg-[#183B36] text-white text-xs font-semibold
                        shadow-xl pointer-events-none whitespace-nowrap
                        opacity-0 group-hover:opacity-100 transition-opacity duration-150
                        flex items-center gap-2
                      `}
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FF8B45] text-white font-bold">
                          {item.badge}
                        </span>
                      )}
                      {/* Arrow */}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-[#183B36]" />
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Bottom Footer / Logout */}
          <div className={`border-t border-[#E5EAE4] ${isCollapsed ? 'p-2' : 'p-4'}`}>
            <div className="relative group">
              <button
                onClick={onLogout}
                className={`
                  w-full flex items-center transition-colors cursor-pointer text-rose-600 hover:bg-rose-50
                  ${
                    isCollapsed
                      ? 'h-11 justify-center rounded-xl'
                      : 'gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold'
                  }
                `}
                title={isCollapsed ? 'Sign Out of Portal' : undefined}
                aria-label="Sign Out"
              >
                <LogOut className="h-4.5 w-4.5 shrink-0" />
                {!isCollapsed && <span>Sign Out of Portal</span>}
              </button>

              {/* Logout Tooltip when collapsed */}
              {isCollapsed && (
                <div
                  role="tooltip"
                  className={`
                    absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
                    px-3 py-1.5 rounded-xl bg-rose-700 text-white text-xs font-semibold
                    shadow-xl pointer-events-none whitespace-nowrap
                    opacity-0 group-hover:opacity-100 transition-opacity duration-150
                  `}
                >
                  Sign Out of Portal
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-rose-700" />
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
