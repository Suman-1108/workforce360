import React, { useState } from 'react'
import {
  Navbar,
  HeroSection,
  FeaturesSection,
  SolutionsSection,
  HowItWorksSection,
  PricingSection,
  CtaSection,
  Footer,
} from '../../components/landing'
import { Modal, Button, Input } from '../../components/common'
import { Sparkles, CheckCircle2 } from 'lucide-react'

export interface HomePageProps {
  onNavigateToLogin?: () => void
  onNavigateToOwnerDashboard?: () => void
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateToLogin,
}) => {
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const [demoSubmitted, setDemoSubmitted] = useState(false)
  const [demoForm, setDemoForm] = useState({
    name: '',
    email: '',
    company: '',
    employees: '50-200',
  })

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setDemoSubmitted(true)
    setTimeout(() => {
      setDemoSubmitted(false)
      setDemoModalOpen(false)
      setDemoForm({ name: '', email: '', company: '', employees: '50-200' })
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-[#F5F7F1] text-[#183B36] selection:bg-[#075E54] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onLoginClick={onNavigateToLogin}
        onBookDemoClick={() => setDemoModalOpen(true)}
      />

      <main>
        {/* Split Hero Section */}
        <HeroSection
          onGetStartedClick={() => setDemoModalOpen(true)}
          onExploreClick={() => {
            const el = document.getElementById('features')
            el?.scrollIntoView({ behavior: 'smooth' })
          }}
        />

        {/* Features Grid Section */}
        <FeaturesSection />

        {/* Industry Solutions Section */}
        <SolutionsSection />

        {/* 3-Step How It Works Section */}
        <HowItWorksSection />

        {/* Subscription Pricing Section */}
        <PricingSection
          onPlanSelect={(_plan) => {
            setDemoModalOpen(true)
          }}
        />

        {/* Final CTA Banner */}
        <CtaSection
          onStartClick={() => setDemoModalOpen(true)}
          onBookDemoClick={() => setDemoModalOpen(true)}
        />
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Interactive Book Demo Modal */}
      <Modal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-[#FFF0E6] text-[#FF8B45] flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>Book a WorkForce 360 Walkthrough</span>
          </div>
        }
        description="Experience our geofenced attendance, selfie verification, and shift management live with a solutions specialist."
        size="md"
      >
        {demoSubmitted ? (
          <div className="py-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-bold text-[#183B36] mb-2">
              Request Received!
            </h4>
            <p className="text-sm text-[#78847F] max-w-sm">
              Our enterprise onboarding specialist will reach out within 2 hours to confirm your custom demonstration environment.
            </p>
          </div>
        ) : (
          <form onSubmit={handleDemoSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Sarah Jenkins"
              required
              value={demoForm.name}
              onChange={(e) =>
                setDemoForm({ ...demoForm, name: e.target.value })
              }
            />
            <Input
              label="Work Email"
              type="email"
              placeholder="sarah@company.com"
              required
              value={demoForm.email}
              onChange={(e) =>
                setDemoForm({ ...demoForm, email: e.target.value })
              }
            />
            <Input
              label="Company Name"
              placeholder="e.g. Apex Industrial Solutions"
              required
              value={demoForm.company}
              onChange={(e) =>
                setDemoForm({ ...demoForm, company: e.target.value })
              }
            />

            <div className="text-left">
              <label className="block text-xs font-semibold text-[#183B36] mb-1.5 uppercase tracking-wider">
                Workforce Size
              </label>
              <select
                className="w-full bg-white text-[#183B36] text-sm border border-[#CBD5C8] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54]"
                value={demoForm.employees}
                onChange={(e) =>
                  setDemoForm({ ...demoForm, employees: e.target.value })
                }
              >
                <option value="1-50">1 - 50 Employees</option>
                <option value="50-200">50 - 200 Employees</option>
                <option value="200-1000">200 - 1,000 Employees</option>
                <option value="1000+">1,000+ Enterprise Employees</option>
              </select>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5EAE4]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDemoModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Confirm Demonstration
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default HomePage
