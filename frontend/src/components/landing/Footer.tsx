import React from 'react'
import { Layers, Mail, Phone, MapPin, Heart } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-[#183B36] text-[#CBD5C8] pt-20 pb-12 border-t border-[#234D47]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand Info (Span 2) */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="h-10 w-10 rounded-2xl bg-[#FF8B45] flex items-center justify-center text-white shadow-sm">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                WorkForce<span className="text-[#FF8B45]">360</span>
              </span>
            </div>

            <p className="text-sm text-[#A0ACA7] leading-relaxed max-w-sm mb-6">
              Production-ready multi-tenant SaaS engineered for dynamic organizations. Unifying real-time GPS geofence attendance, selfie validation, dynamic shifts, and workforce asset governance.
            </p>

            <div className="space-y-2 text-xs text-[#A0ACA7]">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#FF8B45]" />
                <span>support@workforce360.io</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#FF8B45]" />
                <span>+1 (800) 360-WORK (9675)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#FF8B45]" />
                <span>Global Multi-Tenant Cloud Architecture</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Platform Modules
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A0ACA7]">
              <li><a href="#features" className="hover:text-white transition-colors">Employee Lifecycle</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">GPS Geofencing</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Camera Selfie Verification</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Rotational Shift Engine</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Leave Approval System</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Uniform & Asset Records</a></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Industries
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A0ACA7]">
              <li><a href="#solutions" className="hover:text-white transition-colors">IT & Technology</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Manufacturing & Plants</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Retail & Multi-Store</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Healthcare & Clinics</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Construction & Field</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Hospitality & Dining</a></li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Governance & Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A0ACA7]">
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Data Isolation Architecture</a></li>
              <li><a href="#compliance" className="hover:text-white transition-colors">Labor Law Compliance</a></li>
              <li><a href="#cookies" className="hover:text-white transition-colors">Cookie Preferences</a></li>
              <li><a href="#status" className="hover:text-white transition-colors">System Status (99.98%)</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#234D47] flex flex-col sm:flex-row items-center justify-between text-xs text-[#78847F] gap-4">
          <p>© {new Date().getFullYear()} WorkForce 360 Inc. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Engineered with <Heart className="h-3.5 w-3.5 text-[#FF8B45] fill-current" /> for Modern Enterprise Teams
          </p>
        </div>
      </div>
    </footer>
  )
}
