import React, { useState, useEffect } from 'react'
import { Layers, Menu, X, ArrowRight } from 'lucide-react'
import { Button } from '../common/Button'

export interface NavbarProps {
  onLoginClick?: () => void
  onBookDemoClick?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoginClick,
  onBookDemoClick,
}) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Features', href: '#features' },
    { label: 'Solutions', href: '#solutions' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#F5F7F1]/90 backdrop-blur-md py-3 shadow-xs border-b border-[#E5EAE4]'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#home" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-2xl bg-[#075E54] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[#183B36] leading-none">
                WorkForce<span className="text-[#FF8B45]">360</span>
              </span>
              <span className="text-[10px] font-semibold text-[#78847F] tracking-widest uppercase mt-0.5">
                Enterprise SaaS
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#183B36] hover:text-[#075E54] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoginClick}
              className="text-[#183B36] font-semibold hover:text-[#075E54]"
            >
              Log In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onBookDemoClick}
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Book a Demo
            </Button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#183B36] hover:bg-[#EAEFE9] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-[#E5EAE4] px-4 pt-3 pb-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-3 mb-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-medium text-[#183B36] hover:bg-[#F5F7F1] rounded-xl transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2.5 pt-3 border-t border-[#E5EAE4]">
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => {
                setMobileMenuOpen(false)
                onLoginClick?.()
              }}
            >
              Log In
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => {
                setMobileMenuOpen(false)
                onBookDemoClick?.()
              }}
            >
              Book a Demo
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
