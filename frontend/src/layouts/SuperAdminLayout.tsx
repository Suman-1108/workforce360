import React from 'react'
import {
  Layers,
  ShieldAlert,
  Building2,
  DollarSign,
  Activity,
  LogOut,
} from 'lucide-react'
import { Avatar } from '../components/common/Avatar'

export interface SuperAdminLayoutProps {
  children: React.ReactNode
  currentRoute?: string
  onRouteChange?: (route: string) => void
  onLogout: () => void
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({
  children,
  currentRoute = 'tenants',
  onRouteChange,
  onLogout,
}) => {
  const [currentUser, setCurrentUser] = React.useState<{
    first_name?: string
    last_name?: string
    email?: string
  }>({})

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('wf360_user')
      if (stored) {
        setCurrentUser(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  const fullName = currentUser.first_name
    ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
    : 'Global SuperAdmin'

  const navItems = [
    { id: 'tenants', label: 'Organizations', icon: <Building2 className="h-4 w-4" /> },
    { id: 'subscriptions', label: 'Subscription Plans', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'telemetry', label: 'Platform Telemetry', icon: <Activity className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen bg-[#F5F7F1] text-[#183B36] flex flex-col font-sans">
      {/* Super Admin Top Header */}
      <header className="sticky top-0 z-30 bg-[#183B36] text-white px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xs">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-tight text-white">
              WorkForce<span className="text-[#FF8B45]">360</span>
            </span>
            <span className="text-[9px] font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1">
              <ShieldAlert className="h-2.5 w-2.5" /> Super Admin Console
            </span>
          </div>
        </div>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = currentRoute === item.id
            return (
              <button
                key={item.id}
                onClick={() => onRouteChange?.(item.id)}
                className={`
                  flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer
                  ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar name={fullName} size="sm" status="online" />
            <div className="hidden sm:block text-left text-xs">
              <span className="font-bold text-white block">{fullName}</span>
              <span className="text-[10px] text-purple-200">{currentUser.email || 'admin@workforce360.io'}</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  )
}

export default SuperAdminLayout
