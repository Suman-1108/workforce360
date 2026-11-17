import React, { useState } from 'react'
import { Layers, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, XCircle } from 'lucide-react'
import { Button, Input } from '../../components/common'

export interface ResetPasswordPageProps {
  onSuccessReset?: () => void
  onBackToLogin?: () => void
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  onSuccessReset,
  onBackToLogin,
}) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const criteria = [
    { label: 'Minimum 8 characters', valid: newPassword.length >= 8 },
    { label: 'At least one uppercase letter', valid: /[A-Z]/.test(newPassword) },
    { label: 'At least one number', valid: /[0-9]/.test(newPassword) },
    { label: 'At least one special character', valid: /[^A-Za-z0-9]/.test(newPassword) },
  ]

  const isStrong = criteria.every((c) => c.valid)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isStrong) {
      setError('Please fulfill all security criteria before saving.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsSuccess(true)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-[#F5F7F1] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Matrix & Doodles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-dots opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-dots opacity-40 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8">
        <div className="inline-flex items-center gap-2.5 mb-4">
          <div className="h-11 w-11 rounded-2xl bg-[#075E54] flex items-center justify-center text-white shadow-sm">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#183B36]">
            WorkForce<span className="text-[#FF8B45]">360</span>
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
          Establish New Password
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#78847F]">
          Create a resilient password to protect your corporate credentials.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-4xl border border-[#E5EAE4] card-soft-shadow">
          {isSuccess ? (
            <div className="text-center py-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-[#183B36] mb-2">
                Password Successfully Reset
              </h3>
              <p className="text-xs text-[#78847F] leading-relaxed mb-6">
                Your credentials have been updated securely across all authorized session scopes.
              </p>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={onSuccessReset || onBackToLogin}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Sign In Now
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {error}
                </div>
              )}

              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none hover:text-[#183B36] cursor-pointer"
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

              <Input
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                required
              />

              {/* Password Strength Checklist */}
              <div className="p-3.5 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#183B36] block mb-1">
                  Security Standards:
                </span>
                {criteria.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {c.valid ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-[#A0ACA7] shrink-0" />
                    )}
                    <span
                      className={
                        c.valid
                          ? 'text-[#183B36] font-medium'
                          : 'text-[#78847F]'
                      }
                    >
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="py-3.5 shadow-md"
              >
                Update Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
