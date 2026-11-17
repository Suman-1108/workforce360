import React from 'react'
import {
  Users,
  MapPin,
  Calendar,
  Coffee,
  BarChart3,
  Shirt,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Users className="h-6 w-6 text-[#075E54]" />,
      iconBg: 'bg-[#E6F3F1]',
      title: 'Employee Management',
      description:
        'Complete employee lifecycle from onboarding to offboarding. Manage profiles, designations, branches, and verified documents in one place.',
      highlight: 'Centralized Profiles',
    },
    {
      icon: <MapPin className="h-6 w-6 text-[#FF8B45]" />,
      iconBg: 'bg-[#FFF0E6]',
      title: 'GPS Geofenced Attendance',
      description:
        'Ensure verified presence with precise latitude, longitude, and radius geofencing combined with selfie facial capture to prevent proxy attendance.',
      highlight: 'Geofence + Selfie',
    },
    {
      icon: <Calendar className="h-6 w-6 text-[#075E54]" />,
      iconBg: 'bg-[#E6F3F1]',
      title: 'Dynamic Shift Scheduling',
      description:
        'Easily schedule morning, evening, rotational, and overnight shifts. Configure grace periods, overtime rules, and automatic break deductions.',
      highlight: 'Smart Rotations',
    },
    {
      icon: <Coffee className="h-6 w-6 text-[#FF8B45]" />,
      iconBg: 'bg-[#FFF0E6]',
      title: 'Leave & Absence Workflow',
      description:
        'Self-service leave requests with multi-tier managerial approval. Automated leave balances, custom leave quotas, and holiday calendars.',
      highlight: '1-Click Approvals',
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-[#075E54]" />,
      iconBg: 'bg-[#E6F3F1]',
      title: 'Workforce Analytics & Reports',
      description:
        'Real-time intelligence on attendance rates, late arrivals, overtime, and department absenteeism. Download clean Excel and CSV exports.',
      highlight: 'Real-time Telemetry',
    },
    {
      icon: <Shirt className="h-6 w-6 text-[#FF8B45]" />,
      iconBg: 'bg-[#FFF0E6]',
      title: 'Uniform & Asset Allocation',
      description:
        'Track corporate gear, uniforms, safety equipment, and sizing records. Prevent inventory loss with assignment logs and replacement workflows.',
      highlight: 'Asset Governance',
    },
  ]

  return (
    <section id="features" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#FF8B45] bg-[#FFF0E6] px-3.5 py-1.5 rounded-full inline-block mb-3 border border-[#FFD4BA]">
            Engineered For Scale
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#183B36] tracking-tight">
            Comprehensive Capabilities for Modern Operations
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#78847F] leading-relaxed">
            Eliminate fragmented spreadsheets and disjointed time-clocks. WorkForce 360 brings your entire workforce ecosystem into a unified platform.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-[#F5F7F1]/80 hover:bg-white rounded-3xl p-8 border border-[#E5EAE4] card-soft-shadow card-hover-lift transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`h-14 w-14 rounded-2xl flex items-center justify-center ${feature.iconBg} group-hover:scale-110 transition-transform`}
                  >
                    {feature.icon}
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white text-[#183B36] border border-[#E5EAE4] shadow-2xs">
                    {feature.highlight}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#183B36] mb-3 group-hover:text-[#075E54] transition-colors">
                  {feature.title}
                </h3>

                <p className="text-sm text-[#78847F] leading-relaxed mb-6">
                  {feature.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E5EAE4]/80 flex items-center text-xs font-bold text-[#075E54] group-hover:translate-x-1 transition-transform">
                <span>Explore capability</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </div>
            </div>
          ))}
        </div>

        {/* Privacy & Legal Compliance Banner */}
        <div className="mt-12 bg-[#E6F3F1] border border-[#BDE0D9] rounded-2xl p-4 sm:p-5 flex items-center gap-4 text-left">
          <div className="h-10 w-10 rounded-xl bg-[#075E54] text-white flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="text-xs sm:text-sm text-[#183B36]">
            <span className="font-bold">Strict Privacy & Legal Safeguards:</span>{' '}
            WorkForce 360 only tracks GPS location during authorized active shifts with documented employee consent. We enforce zero background tracking when off-duty.
          </div>
        </div>
      </div>
    </section>
  )
}
