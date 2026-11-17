import React from 'react'
import {
  Layers,
  LayoutDashboard,
  Clock,
  Calendar,
  Coffee,
  LogOut,
} from 'lucide-react'
import { Avatar } from '../components/common/Avatar'

export interface EmployeeLayoutProps {
  children: React.ReactNode
  currentTab?: string
  onTabChange?: (tab: string) => void
  onLogout: () => void
}

export const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({
  children,
  currentTab = 'home',
  onTabChange,
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
    : 'Alex Morgan'

  const tabs = [
    { id: 'home', label: 'Today', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'attendance', label: 'History', icon: <Clock className="h-5 w-5" /> },
    { id: 'shifts', label: 'My Shifts', icon: <Calendar className="h-5 w-5" /> },
    { id: 'leave', label: 'My Leave', icon: <Coffee className="h-5 w-5" /> },
  ]

  return (
    <div className="min-h-screen bg-[#F5F7F1] text-[#183B36] flex flex-col font-sans pb-20 sm:pb-8">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E5EAE4] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#075E54] flex items-center justify-center text-white shadow-xs">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-tight text-[#183B36]">
              WorkForce<span className="text-[#FF8B45]">360</span>
            </span>
            <span className="text-[9px] font-bold text-[#075E54] uppercase tracking-wider">
              Employee Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar name={fullName} size="sm" status="online" />
            <div className="hidden sm:block text-left text-xs">
              <span className="font-bold text-[#183B36] block">{fullName}</span>
              <span className="text-[10px] text-[#78847F]">{currentUser.email || 'EMP-1001'}</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-5xl w-full mx-auto">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5EAE4] px-4 py-2 flex items-center justify-around sm:hidden shadow-lg">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`
                flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-[10px] font-bold transition-colors cursor-pointer
                ${
                  isActive
                    ? 'text-[#075E54]'
                    : 'text-[#78847F] hover:text-[#183B36]'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default EmployeeLayout
