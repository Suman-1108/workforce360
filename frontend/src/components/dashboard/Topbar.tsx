import React, { useState, useEffect } from 'react'
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Settings,
  CreditCard,
  LogOut,
  Building,
  PanelLeft,
  CheckCircle2,
} from 'lucide-react'
import { Avatar } from '../common/Avatar'
import { NotificationDropdown } from '../notifications/NotificationDropdown'
import { NotificationService } from '../../services/NotificationService'

export interface TopbarProps {
  onToggleSidebar: () => void
  onToggleCollapse?: () => void
  isCollapsed?: boolean
  onLogout: () => void
  userName?: string
  userEmail?: string
  userRole?: string
  orgName?: string
  branchName?: string
  branches?: string[]
  onNavigateToNotifications?: () => void
  onNavigateToSettings?: () => void
  onNavigateToSubscription?: () => void
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  onToggleCollapse,
  isCollapsed = false,
  onLogout,
  userName = 'Organization Owner',
  userEmail = '',
  userRole = 'Organization Owner',
  orgName = 'WorkForce 360',
  branchName = 'Main Branch',
  branches = [],
  onNavigateToNotifications,
  onNavigateToSettings,
  onNavigateToSubscription,
}) => {
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedBranch, setSelectedBranch] = useState(branchName)
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)

  useEffect(() => {
    if (branchName && (!selectedBranch || selectedBranch === 'Main Branch')) {
      setSelectedBranch(branchName)
    }
  }, [branchName])

  useEffect(() => {
    NotificationService.getUnreadCount()
      .then((res) => {
        if (res && typeof res.unread_count === 'number') {
          setUnreadCount(res.unread_count)
        }
      })
      .catch((err) => console.error('Failed to load unread notification count:', err))
  }, [])

  const branchOptions = branches.length > 0 ? branches : [selectedBranch || branchName]

  return (
    <header className="sticky top-0 z-30 bg-[#F5F7F1]/95 backdrop-blur-md border-b border-[#E5EAE4] px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between transition-all">
      {/* Left: Toggles & Search Bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-md">
        {/* Mobile Hamburger (< lg) */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[#183B36] hover:bg-white lg:hidden cursor-pointer transition-colors"
          aria-label="Open mobile navigation drawer"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop Sidebar Collapse Toggle (lg+) */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 rounded-xl text-[#183B36] hover:bg-white hover:text-[#075E54] border border-transparent hover:border-[#E5EAE4] cursor-pointer transition-all items-center justify-center shrink-0"
            aria-label={isCollapsed ? 'Expand sidebar (260px)' : 'Collapse sidebar (76px)'}
            title={isCollapsed ? 'Expand sidebar (260px)' : 'Collapse sidebar (76px)'}
          >
            <PanelLeft className="h-5 w-5 text-[#183B36]" />
          </button>
        )}

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78847F]" />
          <input
            type="text"
            placeholder="Search employees, shifts, departments..."
            className="w-full bg-white text-xs text-[#183B36] placeholder-[#A0ACA7] pl-10 pr-4 py-2.5 rounded-full border border-[#CBD5C8] focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54] shadow-2xs"
          />
        </div>
      </div>

      {/* Right: Branch Selector, Notifications, & Profile Menu */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Branch / Physical Location Selector */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E5EAE4] text-xs font-medium text-[#183B36] shadow-2xs hover:border-[#CBD5C8] transition-colors cursor-pointer"
          >
            <Building className="h-3.5 w-3.5 text-[#075E54]" />
            <span className="truncate max-w-[160px]">{selectedBranch}</span>
            <ChevronDown className="h-3 w-3 text-[#78847F]" />
          </button>

          {branchDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#E5EAE4] card-soft-shadow p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#78847F] border-b border-[#E5EAE4] mb-1">
                Select Active Branch
              </div>
              {branchOptions.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setSelectedBranch(b)
                    setBranchDropdownOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left cursor-pointer transition-colors ${
                    selectedBranch === b
                      ? 'bg-[#E6F3F1] text-[#075E54] font-bold'
                      : 'text-[#183B36] hover:bg-[#F5F7F1]'
                  }`}
                >
                  <span className="truncate">{b}</span>
                  {selectedBranch === b && <CheckCircle2 className="h-3.5 w-3.5 text-[#075E54] shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="p-2 rounded-full bg-white border border-[#E5EAE4] text-[#183B36] hover:text-[#075E54] hover:border-[#075E54] transition-colors relative cursor-pointer shadow-2xs"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF8B45] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={notificationOpen}
            onClose={() => setNotificationOpen(false)}
            onNavigateToNotifications={onNavigateToNotifications}
            onUnreadCountChange={(c) => setUnreadCount(c)}
          />
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 sm:gap-3 p-1.5 rounded-full hover:bg-white transition-colors cursor-pointer"
          >
            <Avatar name={userName} size="sm" status="online" />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[#183B36] leading-none">
                {userName}
              </span>
              <span className="text-[10px] font-semibold text-[#78847F] mt-0.5">
                {userRole}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[#78847F] hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2.5 border-b border-[#E5EAE4] mb-1">
                <div className="text-xs font-bold text-[#183B36]">{userName}</div>
                <div className="text-[11px] text-[#78847F] truncate">{userEmail}</div>
                <div className="mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E6F3F1] text-[#075E54] inline-block">
                  {orgName}
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    if (onNavigateToSettings) onNavigateToSettings()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#183B36] hover:bg-[#F5F7F1] transition-colors cursor-pointer text-left font-medium"
                >
                  <Settings className="h-4 w-4 text-[#78847F]" />
                  <span>Settings & Profile</span>
                </button>

                <button
                  onClick={() => {
                    setProfileOpen(false)
                    if (onNavigateToSubscription) onNavigateToSubscription()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#183B36] hover:bg-[#F5F7F1] transition-colors cursor-pointer text-left font-medium"
                >
                  <CreditCard className="h-4 w-4 text-[#78847F]" />
                  <span>Subscription & Billing</span>
                </button>
              </div>

              <div className="pt-2 mt-2 border-t border-[#E5EAE4]">
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    onLogout()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left font-semibold text-xs"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
