import React from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '../common/Button'

export interface CtaSectionProps {
  onStartClick?: () => void
  onBookDemoClick?: () => void
}

export const CtaSection: React.FC<CtaSectionProps> = ({
  onStartClick,
  onBookDemoClick,
}) => {
  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-4xl bg-[#075E54] text-white px-8 py-16 sm:px-16 sm:py-20 overflow-hidden shadow-2xl">
          {/* Subtle Background Circles & Dots */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-black/10 pointer-events-none -ml-28 -mb-28" />

          {/* Floating Accents */}
          <div className="absolute top-10 right-20 text-[#FF8B45] text-xl font-bold select-none pointer-events-none">
            +
          </div>
          <div className="absolute bottom-12 right-1/4 text-white/30 text-2xl font-bold select-none pointer-events-none">
            +
          </div>

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            {/* Tag */}
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-[#FF8B45] text-xs font-bold uppercase tracking-wider mb-6 border border-white/15">
              Empower Your Organization
            </span>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Take Control of Your Workforce Today.
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed mb-10 max-w-2xl mx-auto">
              Replace outdated thumbprint hardware and chaotic paper leave forms with a streamlined, geofenced SaaS solution built for modern teams.
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <Button
                variant="accent"
                size="lg"
                onClick={onStartClick}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="px-8 py-4 shadow-lg hover:shadow-xl text-base"
              >
                Start Managing Your Team
              </Button>

              <button
                type="button"
                onClick={onBookDemoClick}
                className="px-7 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-base border border-white/20 backdrop-blur-xs transition-colors cursor-pointer"
              >
                Schedule an Executive Demo
              </button>
            </div>

            {/* Guarantees */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-emerald-100/80">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#FF8B45]" />
                14-day free trial
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#FF8B45]" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#FF8B45]" />
                Set up in under 10 minutes
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
