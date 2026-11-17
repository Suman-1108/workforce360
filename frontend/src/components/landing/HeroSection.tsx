import React from 'react'
import {
  Play,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '../common/Button'

export interface HeroSectionProps {
  onGetStartedClick?: () => void
  onExploreClick?: () => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStartedClick,
  onExploreClick,
}) => {
  return (
    <section id="home" className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      {/* Background Dot Pattern Accent */}
      <div className="absolute top-12 right-0 w-96 h-96 bg-dots opacity-40 pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-72 h-72 bg-dots opacity-30 pointer-events-none" />

      {/* Floating Decorative Doodles */}
      <div className="absolute top-32 left-1/2 text-[#FF8B45] text-lg font-bold select-none pointer-events-none animate-pulse">
        +
      </div>
      <div className="absolute bottom-24 left-1/4 text-[#FF8B45] text-2xl font-bold select-none pointer-events-none">
        +
      </div>
      <div className="absolute top-48 right-12 text-[#075E54] select-none pointer-events-none">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="12 2 22 20 2 20" />
        </svg>
      </div>
      <div className="absolute bottom-40 right-1/3 text-[#075E54] select-none pointer-events-none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="12 2 22 20 2 20" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline & Call to Action */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0E6] text-[#FF8B45] border border-[#FFD4BA] text-xs font-bold tracking-wider uppercase mb-6 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#FF8B45]" />
              <span>Smart Workforce Management</span>
            </div>

            {/* Main Headline with Dotted Highlight Box */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#183B36] tracking-tight leading-[1.15] mb-6">
              Manage Your Workforce.{' '}
              <span className="block sm:inline-block mt-2 sm:mt-0 dotted-badge-box px-3.5 py-1 rounded-2xl text-[#075E54]">
                Simplify Your Business
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#78847F] leading-relaxed max-w-2xl mb-8">
              A modern multi-tenant SaaS platform built for fast-moving organizations. Streamline geofenced attendance, smart camera selfie validation, dynamic shifts, and employee approvals with total peace of mind.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-10 w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                onClick={onGetStartedClick}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="px-7 py-3.5 shadow-md hover:shadow-lg"
              >
                Get Started
              </Button>

              <button
                type="button"
                onClick={onExploreClick}
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-white text-[#183B36] font-semibold text-base border border-[#CBD5C8] hover:border-[#075E54] hover:text-[#075E54] shadow-xs hover:shadow transition-all cursor-pointer group"
              >
                <span className="h-8 w-8 rounded-full bg-[#E6F3F1] text-[#075E54] flex items-center justify-center group-hover:bg-[#075E54] group-hover:text-white transition-colors">
                  <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                </span>
                <span>Watch Video</span>
              </button>
            </div>

            {/* Trust Indicator & Metrics */}
            <div className="pt-6 border-t border-[#E5EAE4] flex flex-wrap items-center gap-6 w-full">
              <div className="flex -space-x-2.5">
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Team member"
                />
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Team member"
                />
                <img
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                  alt="Team member"
                />
                <div className="h-10 w-10 rounded-full ring-2 ring-white bg-[#075E54] text-white flex items-center justify-center text-xs font-bold">
                  +1.2k
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                  ★★★★★ <span className="text-[#183B36] font-bold ml-1">4.9/5 Rating</span>
                </div>
                <p className="text-xs text-[#78847F] mt-0.5">
                  Trusted by 1,200+ companies across 14 countries
                </p>
              </div>
            </div>

            {/* Scroll Down Indicator */}
            <div className="hidden lg:flex items-center gap-2 mt-8 text-xs font-semibold text-[#78847F] select-none">
              <span>Scroll Down</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#075E54] animate-bounce">
                <path d="M12 5v14M19 12l-7 7-7-7"/>
              </svg>
            </div>
          </div>

          {/* Right Column: Visual Artwork with Geometric Dual Shape Mask */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* The Outer Graphic Artboard Card */}
            <div className="relative w-full max-w-md mx-auto aspect-4/5 flex items-center justify-center">
              {/* Dot Grid Backplate */}
              <div className="absolute -top-6 -right-6 w-48 h-48 bg-dots-dense opacity-60 rounded-3xl pointer-events-none" />

              {/* Geometric Orange Shape (Top-Right) */}
              <div className="absolute top-4 right-2 w-52 h-52 bg-[#FF8B45] rounded-4xl -rotate-2 shadow-lg opacity-95 transition-transform hover:rotate-0 duration-300" />

              {/* Geometric Teal Shape (Bottom-Right) */}
              <div className="absolute bottom-4 right-4 w-48 h-48 bg-[#075E54] rounded-4xl rotate-3 shadow-lg opacity-95 transition-transform hover:rotate-0 duration-300" />

              {/* Curved White Accent Ribbon / Border */}
              <div className="absolute bottom-8 right-8 w-44 h-44 rounded-4xl border-8 border-white pointer-events-none z-10" />

              {/* Main Photo Cutout Container */}
              <div className="relative z-20 w-80 h-96 rounded-4xl overflow-hidden border-4 border-white shadow-2xl bg-gradient-to-b from-[#F5F7F1] to-white flex items-end justify-center">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=80"
                  alt="Professional employee smiling"
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                />

                {/* Subtle Inner Gradient for Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#183B36]/30 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating Live Attendance Badge 1 */}
              <div className="absolute -bottom-4 left-0 z-30 bg-white rounded-2xl p-3.5 card-soft-shadow border border-[#E5EAE4] flex items-center gap-3 animate-in fade-in duration-700">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#183B36]">99.4% Present</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-[#78847F]">Live GPS Geofence Validated</p>
                </div>
              </div>

              {/* Floating Shift Badge 2 */}
              <div className="absolute top-12 -left-6 z-30 bg-white rounded-2xl p-3 card-soft-shadow border border-[#E5EAE4] flex items-center gap-2.5 hidden sm:flex">
                <div className="h-9 w-9 rounded-xl bg-[#FFF0E6] text-[#FF8B45] flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-[#183B36] block">Morning Shift (A)</span>
                  <span className="text-[10px] text-[#78847F] flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#075E54]" /> Tech Park Branch
                  </span>
                </div>
              </div>

              {/* Security Verified Floating Pill */}
              <div className="absolute top-2 right-0 z-30 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 border border-[#E5EAE4] shadow-xs flex items-center gap-1.5 text-[11px] font-semibold text-[#075E54]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#075E54]" />
                <span>Multi-Tenant Isolated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
