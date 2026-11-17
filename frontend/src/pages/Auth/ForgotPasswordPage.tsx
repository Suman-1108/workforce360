import React, { useState } from 'react'
import { Layers, Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button, Input } from '../../components/common'

export interface ForgotPasswordPageProps {
  onBackToLogin?: () => void
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onBackToLogin,
}) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
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
          Password Recovery
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#78847F]">
          Enter your registered work email to receive password reset instructions.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-4xl border border-[#E5EAE4] card-soft-shadow">
          {isSubmitted ? (
            <div className="text-center py-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-[#183B36] mb-2">
                Recovery Link Dispatched
              </h3>
              <p className="text-xs text-[#78847F] leading-relaxed mb-6">
                We have transmitted a secure reset token to{' '}
                <span className="font-semibold text-[#183B36]">{email}</span>. Please verify your inbox and spam folder.
              </p>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={onBackToLogin}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Registered Work Email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="py-3.5 shadow-md"
              >
                Dispatch Reset Instructions
              </Button>

              <div className="pt-4 border-t border-[#E5EAE4] text-center">
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#075E54] hover:text-[#064e46] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
