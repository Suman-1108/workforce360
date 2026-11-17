import React, { useState } from 'react'
import {
  Laptop,
  Factory,
  ShoppingBag,
  Stethoscope,
  HardHat,
  Utensils,
  CheckCircle,
} from 'lucide-react'

export const SolutionsSection: React.FC = () => {
  const industries = [
    {
      id: 'it',
      label: 'IT & Technology',
      icon: <Laptop className="h-4 w-4" />,
      title: 'Built for Hybrid, Remote, and Distributed Engineering Teams',
      description:
        'Coordinate sprint cycles, flexible core working hours, project shifts, and branch check-ins across multiple offshore development centers without micro-managing.',
      benefits: [
        'Flexible check-in windows with self-service schedule swaps',
        'Multi-timezone branch and department visibility',
        'Automated IP and GPS perimeter boundary checks',
        'Direct Slack and email approval notifications',
      ],
      metric: '40% reduction in timesheet disputes',
    },
    {
      id: 'manufacturing',
      label: 'Manufacturing & Plants',
      icon: <Factory className="h-4 w-4" />,
      title: 'Precision Shift Management for High-Throughput Shopfloors',
      description:
        'Enforce rotational shifts, seamless handover intervals, grace period controls, and mandatory safety uniform allocations for factory operators.',
      benefits: [
        'Automated 3-shift rotation with overnight differential tracking',
        'Facial selfie verification preventing buddy punching at turnstiles',
        'Safety uniform and PPE equipment assignment logs',
        'Instant overtime calculations aligned with labor standards',
      ],
      metric: 'Zero proxy attendance incidents',
    },
    {
      id: 'retail',
      label: 'Retail & Multi-Store',
      icon: <ShoppingBag className="h-4 w-4" />,
      title: 'Store-Level Coverage Across Hundreds of Retail Outlets',
      description:
        'Guarantee optimal floor coverage during peak weekend hours and promotional events with multi-branch geolocation geofences.',
      benefits: [
        'Independent geofenced perimeter for each retail store or kiosk',
        'Real-time manager alerts for late openings or staff shortages',
        'Part-time vs full-time hourly pay tracking',
        'Uniform sizing and replacement inventory tracking',
      ],
      metric: '99.8% on-schedule store openings',
    },
    {
      id: 'healthcare',
      label: 'Healthcare & Clinics',
      icon: <Stethoscope className="h-4 w-4" />,
      title: 'Reliable Scheduling for 24/7 Clinical & Nursing Staff',
      description:
        'Maintain continuous patient care with smart on-call rotations, rapid emergency shift substitutions, and strict compliance records.',
      benefits: [
        '24/7 on-call roster management with instant SMS/push broadcast',
        'Department-specific licensing and credential expiry tracking',
        'Emergency absence coverage with auto-notified standby staff',
        'Audit-ready electronic attendance records for regulatory audits',
      ],
      metric: '100% compliant staff coverage logs',
    },
    {
      id: 'construction',
      label: 'Construction & Field',
      icon: <HardHat className="h-4 w-4" />,
      title: 'Mobile Geofencing for Dynamic Job Sites & Remote Projects',
      description:
        'Track field labor across changing job site coordinates. Validate arrivals directly via browser GPS without purchasing expensive hardware.',
      benefits: [
        'Polygon and circular geofencing for dynamic project sites',
        'Proof-of-presence photo timestamps uploaded to Cloudinary',
        'Subcontractor and temporary laborer attendance records',
        'Works smoothly on workers’ personal smartphone web browsers',
      ],
      metric: 'Save 15+ hours per site manager weekly',
    },
    {
      id: 'hospitality',
      label: 'Hospitality & Dining',
      icon: <Utensils className="h-4 w-4" />,
      title: 'Fast-Paced Shift Scheduling for Hotels & Restaurants',
      description:
        'Manage high-turnover front-of-house and kitchen staff with intuitive mobile check-ins, automated tip-period rosters, and uniform management.',
      benefits: [
        'Split-shift management for lunch and dinner service windows',
        'Mobile self-service leave requests during low-occupancy periods',
        'Chef coat and server uniform distribution tracking',
        'Instant manager approval on shift trades',
      ],
      metric: '25% decrease in staff turnover',
    },
  ]

  const [activeTab, setActiveTab] = useState(industries[0].id)
  const current = industries.find((i) => i.id === activeTab) || industries[0]

  return (
    <section id="solutions" className="py-24 bg-[#F5F7F1] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-[#075E54] bg-[#E6F3F1] px-3.5 py-1.5 rounded-full inline-block mb-3 border border-[#BDE0D9]">
            Tailored By Industry
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#183B36] tracking-tight">
            Designed for the Real World
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#78847F]">
            Every industry has unique shift patterns and compliance demands. Discover how WorkForce 360 adapts to your specific operational DNA.
          </p>
        </div>

        {/* Industry Pill Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
          {industries.map((ind) => {
            const isActive = ind.id === activeTab
            return (
              <button
                key={ind.id}
                onClick={() => setActiveTab(ind.id)}
                className={`
                  inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? 'bg-[#075E54] text-white shadow-md shadow-[#075E54]/20 scale-105'
                      : 'bg-white text-[#183B36] hover:bg-[#EAEFE9] border border-[#CBD5C8]'
                  }
                `}
              >
                <span>{ind.icon}</span>
                <span>{ind.label}</span>
              </button>
            )
          })}
        </div>

        {/* Solution Active Showcase Card */}
        <div className="bg-white rounded-4xl border border-[#E5EAE4] p-8 sm:p-12 card-soft-shadow">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 text-left">
              <div className="inline-block px-3 py-1 rounded-full bg-[#FFF0E6] text-[#FF8B45] text-xs font-bold uppercase tracking-wider mb-4 border border-[#FFD4BA]">
                Industry Blueprint
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] mb-4 leading-tight">
                {current.title}
              </h3>
              <p className="text-base text-[#78847F] leading-relaxed mb-8">
                {current.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {current.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#075E54] shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-[#183B36]">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center justify-center bg-[#F5F7F1] rounded-3xl p-8 border border-[#E5EAE4] text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#78847F] mb-2">
                Proven Impact
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#075E54] mb-3">
                {current.metric}
              </div>
              <p className="text-xs text-[#78847F] leading-relaxed mb-6">
                Average measured operational efficiency gain across organizations using WorkForce 360 in this sector.
              </p>
              <div className="h-1.5 w-16 bg-[#FF8B45] rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
