import React, { useState } from 'react'
import {
  Layers,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  UserCheck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react'
import { Button, Input } from '../../components/common'
import { authApi } from '../../services/api'

export type PortalType = 'owner' | 'employee' | 'superadmin'

export interface LoginPageProps {
  onSuccessLogin?: (portal: PortalType) => void
  onForgotPasswordClick?: () => void
  onBackToHomeClick?: () => void
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccessLogin,
  onForgotPasswordClick,
  onBackToHomeClick,
}) => {
  const [selectedPortal, setSelectedPortal] = useState<PortalType>('owner')
  const [email, setEmail] = useState('owner@apextechnologies.com')
  const [password, setPassword] = useState('Password@123')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const portalConfig = {
    owner: {
      title: 'Organization Portal',
      subtitle: 'Manage branches, employees, schedules, and operations',
      icon: <Building2 className="h-5 w-5 text-[#075E54]" />,
      activeBadge: 'bg-[#E6F3F1] text-[#075E54] border-[#BDE0D9]',
      defaultEmail: 'owner@apextechnologies.com',
    },
    employee: {
      title: 'Employee Portal',
      subtitle: 'GPS selfie check-in, shift rosters, and leave requests',
      icon: <UserCheck className="h-5 w-5 text-[#FF8B45]" />,
      activeBadge: 'bg-[#FFF0E6] text-[#FF8B45] border-[#FFD4BA]',
      defaultEmail: 'employee@apextechnologies.com',
    },
    superadmin: {
      title: 'Super Admin Portal',
      subtitle: 'Platform-level tenant orchestration, plans, and audit logs',
      icon: <ShieldAlert className="h-5 w-5 text-purple-600" />,
      activeBadge: 'bg-purple-50 text-purple-700 border-purple-200',
      defaultEmail: 'admin@workforce360.io',
    },
  }

  const handlePortalSwitch = (portal: PortalType) => {
    setSelectedPortal(portal)
    setEmail(portalConfig[portal].defaultEmail)
    setPassword('Password@123')
    setErrorMessage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email || !password) {
      setErrorMessage('Please provide both your email and password.')
      return
    }

    setIsLoading(true)
    try {
      const data = await authApi.login(email, password)
      setIsLoading(false)
      const user = data.user || data.data?.user
      const userRole = user?.role || data.role || selectedPortal
      if (userRole === 'superadmin') {
        onSuccessLogin?.('superadmin')
      } else if (userRole === 'employee') {
        onSuccessLogin?.('employee')
      } else {
        onSuccessLogin?.('owner')
      }
    } catch (err: any) {
      setIsLoading(false)
      const detail =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Invalid email or password. Please verify your credentials.'
      setErrorMessage(detail)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7F1] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Dot Grid Matrix & Floating Doodles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-dots opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-dots opacity-40 pointer-events-none" />

      <div className="absolute top-16 left-12 text-[#FF8B45] text-2xl font-bold select-none pointer-events-none hidden sm:block">
        +
      </div>
      <div className="absolute bottom-16 right-16 text-[#075E54] select-none pointer-events-none hidden sm:block">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="12 2 22 20 2 20" />
        </svg>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8">
        {/* Brand Link */}
        <button
          onClick={onBackToHomeClick}
          className="inline-flex items-center gap-2.5 mb-4 group cursor-pointer focus:outline-none"
        >
          <div className="h-11 w-11 rounded-2xl bg-[#075E54] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#183B36]">
            WorkForce<span className="text-[#FF8B45]">360</span>
          </span>
        </button>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
          Welcome back
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#78847F]">
          Select your portal to access your authorized workspace.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-4xl border border-[#E5EAE4] card-soft-shadow">
          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#F5F7F1] rounded-2xl mb-8 border border-[#E5EAE4]">
            {(['owner', 'employee', 'superadmin'] as PortalType[]).map((portal) => {
              const isActive = selectedPortal === portal
              const labels = {
                owner: 'Owner',
                employee: 'Employee',
                superadmin: 'Super Admin',
              }
              return (
                <button
                  key={portal}
                  type="button"
                  onClick={() => handlePortalSwitch(portal)}
                  className={`
                    py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5
                    ${
                      isActive
                        ? 'bg-white text-[#183B36] shadow-xs scale-102 border border-[#E5EAE4]'
                        : 'text-[#78847F] hover:text-[#183B36]'
                    }
                  `}
                >
                  <span>{portalConfig[portal].icon}</span>
                  <span className="hidden sm:inline">{labels[portal]}</span>
                </button>
              )
            })}
          </div>

          {/* Active Portal Header Badge */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F5F7F1]/80 border border-[#E5EAE4] mb-6 text-left">
            <div className="p-2 rounded-xl bg-white shadow-2xs shrink-0">
              {portalConfig[selectedPortal].icon}
            </div>
            <div>
              <div className="text-xs font-bold text-[#183B36]">
                {portalConfig[selectedPortal].title}
              </div>
              <div className="text-[11px] text-[#78847F]">
                {portalConfig[selectedPortal].subtitle}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Work Email / Username"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none hover:text-[#183B36] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              required
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#075E54] focus:ring-[#075E54] border-[#CBD5C8]"
                />
                <span className="font-medium text-[#78847F]">Remember me</span>
              </label>

              <button
                type="button"
                onClick={onForgotPasswordClick}
                className="font-semibold text-[#075E54] hover:text-[#064e46] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="py-3.5 text-sm shadow-md hover:shadow-lg"
            >
              Sign In to {portalConfig[selectedPortal].title}
            </Button>
          </form>

          {/* Quick Demo Pre-fill helper chip */}
          <div className="mt-8 pt-6 border-t border-[#E5EAE4] text-center">
            <span className="text-[11px] font-semibold text-[#78847F] uppercase tracking-wider block mb-2">
              Fast Demo Switcher
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handlePortalSwitch('owner')}
                className="text-[11px] px-2.5 py-1 rounded-full bg-[#E6F3F1] text-[#075E54] font-medium border border-[#BDE0D9] hover:bg-[#D4ECE8] cursor-pointer"
              >
                Org Owner
              </button>
              <button
                type="button"
                onClick={() => handlePortalSwitch('employee')}
                className="text-[11px] px-2.5 py-1 rounded-full bg-[#FFF0E6] text-[#FF8B45] font-medium border border-[#FFD4BA] hover:bg-[#FFE3D1] cursor-pointer"
              >
                Employee (GPS/Selfie)
              </button>
              <button
                type="button"
                onClick={() => handlePortalSwitch('superadmin')}
                className="text-[11px] px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-medium border border-purple-200 hover:bg-purple-100 cursor-pointer"
              >
                Super Admin
              </button>
            </div>
          </div>
        </div>

        {/* Back to Homepage Button */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onBackToHomeClick}
            className="text-xs font-semibold text-[#78847F] hover:text-[#183B36] transition-colors cursor-pointer"
          >
            ← Return to WorkForce 360 Homepage
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
