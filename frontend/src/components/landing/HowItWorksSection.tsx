import React from 'react'
import { Building2, UserPlus, LayoutDashboard, ArrowRight } from 'lucide-react'

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Register Your Organization',
      description:
        'Set up your corporate profile, invite department leads, and configure your office locations or job site geofences in minutes.',
      icon: <Building2 className="h-7 w-7 text-[#075E54]" />,
      badgeColor: 'bg-[#E6F3F1] text-[#075E54] border-[#BDE0D9]',
    },
    {
      number: '02',
      title: 'Add Employees & Assign Shifts',
      description:
        'Bulk-import employees via CSV or manual entry. Assign shift timetables, grace periods, leave quotas, and mandatory uniform sizes.',
      icon: <UserPlus className="h-7 w-7 text-[#FF8B45]" />,
      badgeColor: 'bg-[#FFF0E6] text-[#FF8B45] border-[#FFD4BA]',
    },
    {
      number: '03',
      title: 'Manage From One 360° Dashboard',
      description:
        'Employees check in frictionlessly via mobile GPS & selfie. Managers monitor live presence, approve leaves, and generate payroll-ready reports.',
      icon: <LayoutDashboard className="h-7 w-7 text-[#075E54]" />,
      badgeColor: 'bg-[#E6F3F1] text-[#075E54] border-[#BDE0D9]',
    },
  ]

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-xs font-bold uppercase tracking-widest text-[#FF8B45] bg-[#FFF0E6] px-3.5 py-1.5 rounded-full inline-block mb-3 border border-[#FFD4BA]">
            Frictionless Onboarding
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#183B36] tracking-tight">
            Live in 3 Simple Steps
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#78847F]">
            No complex hardware to wire. No proprietary fingerprint scanners. Set up your workspace online and go live today.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Subtle connecting line for desktop */}
          <div className="hidden md:block absolute top-1/3 left-1/6 right-1/6 h-0.5 border-t-2 border-dashed border-[#CBD5C8] pointer-events-none -z-0" />

          {steps.map((step, idx) => (
            <div
              key={step.number}
              className="relative z-10 bg-[#F5F7F1]/80 hover:bg-white rounded-3xl p-8 border border-[#E5EAE4] card-soft-shadow card-hover-lift transition-all duration-300 flex flex-col items-center text-center group"
            >
              {/* Step Number Tag */}
              <div
                className={`text-xs font-bold px-3 py-1 rounded-full border mb-6 ${step.badgeColor}`}
              >
                STEP {step.number}
              </div>

              {/* Icon Circle */}
              <div className="h-16 w-16 rounded-2xl bg-white border border-[#E5EAE4] flex items-center justify-center mb-6 shadow-xs group-hover:scale-110 transition-transform">
                {step.icon}
              </div>

              {/* Title & Desc */}
              <h3 className="text-xl font-bold text-[#183B36] mb-3 group-hover:text-[#075E54] transition-colors">
                {step.title}
              </h3>

              <p className="text-sm text-[#78847F] leading-relaxed">
                {step.description}
              </p>

              {idx < steps.length - 1 && (
                <div className="md:hidden mt-6 text-[#78847F]">
                  <ArrowRight className="h-5 w-5 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
