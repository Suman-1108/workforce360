import React, { useState, useEffect } from 'react'
import {
  Shirt,
  Layers,
  CheckCircle2,
  RefreshCw,
  Ruler,
} from 'lucide-react'
import { Button, Modal } from '../common'
import { uniformsApi } from '../../services/api'
import type { ClothingComponent } from './UniformOutfitCard'
import { UniformFitGuideModal } from './UniformFitGuideModal'

export const EmployeeUniformView: React.FC = () => {
  const [uniforms, setUniforms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [fitGuideOpen, setFitGuideOpen] = useState(false)
  const [targetUniform, setTargetUniform] = useState<any | null>(null)
  const [requestedSize, setRequestedSize] = useState<string>('XL')
  const [swapReason, setSwapReason] = useState<string>('')
  const [swapSuccess, setSwapSuccess] = useState(false)

  const fetchMyUniforms = async () => {
    setLoading(true)
    try {
      const res = await uniformsApi.getMyUniforms()
      if (res.data) {
        setUniforms(res.data)
      } else if (Array.isArray(res)) {
        setUniforms(res)
      }
    } catch (err) {
      console.error('Failed to load employee uniforms:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyUniforms()
  }, [])

  const handleOpenSwapModal = (uni: any) => {
    setTargetUniform(uni)
    setRequestedSize(uni.size || 'L')
    setSwapReason('')
    setSwapSuccess(false)
    setSwapModalOpen(true)
  }

  const handleConfirmSwap = () => {
    setSwapSuccess(true)
    setTimeout(() => {
      setSwapModalOpen(false)
      setSwapSuccess(false)
    }, 1500)
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-xs text-[#78847F] bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow">
        Loading your assigned uniform & equipment...
      </div>
    )
  }

  if (uniforms.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5EAE4] card-soft-shadow">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#075E54]/10 text-[#075E54] flex items-center justify-center">
            <Shirt className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#183B36]">
              Workforce Apparel & Gear
            </h3>
            <p className="text-xs text-[#78847F]">
              Standard issue organization attire and protective equipment.
            </p>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] text-center space-y-1">
          <span className="text-xs font-bold text-[#183B36]">No Uniform Currently Assigned</span>
          <p className="text-[11px] text-[#78847F]">
            Your manager or branch operations team will allocate your official uniform kit upon orientation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5EAE4] card-soft-shadow space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5EAE4] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#075E54]/10 text-[#075E54] flex items-center justify-center">
            <Shirt className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#183B36]">
              My Assigned Uniform & Kit ({uniforms.length})
            </h3>
            <p className="text-xs text-[#78847F]">
              Official company apparel issued for your branch shifts and field operations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFitGuideOpen(true)}
            leftIcon={<Ruler className="h-3.5 w-3.5 text-[#FF8B45]" />}
            className="text-xs font-bold border-[#075E54] text-[#075E54] hover:bg-[#075E54]/5 cursor-pointer"
          >
            Worker Size &amp; Fit Guide
          </Button>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-center flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified Active Allocation
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {uniforms.map((uni) => {
          let components: ClothingComponent[] = []
          if (uni.items_breakdown) {
            try {
              components = typeof uni.items_breakdown === 'string' ? JSON.parse(uni.items_breakdown) : uni.items_breakdown
            } catch {
              components = []
            }
          }

          return (
            <div
              key={uni.distribution_id}
              className="rounded-3xl border border-[#E5EAE4] bg-[#F5F7F1]/40 overflow-hidden grid grid-cols-1 md:grid-cols-12"
            >
              {/* Model Image */}
              <div className="md:col-span-5 relative h-64 md:h-auto min-h-[260px] bg-white flex items-center justify-center p-2">
                <img
                  src={uni.model_image_url || '/uniforms/worker-fit-guide.jpg'}
                  alt={uni.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = '/uniforms/worker-fit-guide.jpg'
                  }}
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/70 text-[#FF8B45]">
                    {uni.code || `UNIF-${uni.uniform_item_id}`}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#075E54] text-white">
                    {uni.category}
                  </span>
                </div>
              </div>

              {/* Outfit Breakdown & Allocation Details */}
              <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4 bg-white">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-extrabold text-[#183B36] leading-tight">
                        {uni.name}
                      </h4>
                      <p className="text-xs text-[#78847F] mt-1 line-clamp-2">
                        {uni.description || 'Full standard corporate ensemble issued to personnel.'}
                      </p>
                    </div>

                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-[#075E54]/10 text-[#075E54] shrink-0">
                      Size {uni.size}
                    </span>
                  </div>

                  {/* Components Breakdown */}
                  {components.length > 0 && (
                    <div className="pt-3 mt-3 border-t border-[#E5EAE4] space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#78847F] flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-[#075E54]" />
                        Included Kit Components ({components.length})
                      </span>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {components.map((c, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-1.5 rounded-xl border border-[#E5EAE4] bg-[#F5F7F1]/60"
                          >
                            <img
                              src={c.image_url}
                              alt={c.label}
                              className="w-8 h-8 rounded-lg object-cover bg-white shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-[#183B36] truncate block">
                                {c.label}
                              </span>
                              <span className="text-[9px] text-[#78847F] truncate block">
                                {c.color}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Allocation Meta & Swap Action */}
                <div className="pt-3 border-t border-[#E5EAE4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-[#78847F] flex items-center gap-3">
                    <span>
                      Issued: <strong className="text-[#183B36]">{uni.issued_date}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Quantity: <strong className="text-[#183B36]">{uni.quantity} set(s)</strong>
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenSwapModal(uni)}
                    leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                    className="text-xs font-bold border-[#CBD5C8] text-[#183B36] hover:bg-[#F5F7F1] cursor-pointer"
                  >
                    Request Size Swap / Replacement
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Replacement / Size Swap Request Modal */}
      <Modal
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        title="Request Uniform Size Swap or Replacement"
        description="Notify your branch operations manager regarding fit adjustments or worn gear replacement."
        size="sm"
      >
        {swapSuccess ? (
          <div className="py-6 text-center animate-in zoom-in-95 duration-200">
            <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h4 className="text-base font-bold text-[#183B36]">Swap Request Dispatched!</h4>
            <p className="text-xs text-[#78847F] mt-1">
              Your branch manager has been notified. New kit will be dispatched to your facility.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] text-xs">
              <span className="font-bold text-[#183B36] block">{targetUniform?.name}</span>
              <span className="text-[#78847F]">Current Allocation: Size {targetUniform?.size}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183B36] mb-1">
                Requested Replacement Size
              </label>
              <select
                value={requestedSize}
                onChange={(e) => setRequestedSize(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-[#CBD5C8] bg-white text-[#183B36]"
              >
                {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map((s) => (
                  <option key={s} value={s}>
                    Size {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183B36] mb-1">
                Reason for Replacement / Swap
              </label>
              <textarea
                value={swapReason}
                onChange={(e) => setSwapReason(e.target.value)}
                rows={3}
                placeholder="e.g. Waist too tight; need size swap for mobility during shifts."
                className="w-full text-xs p-3 rounded-xl border border-[#CBD5C8] text-[#183B36]"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleConfirmSwap}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              className="bg-[#075E54] text-white hover:bg-[#075E54]/90"
            >
              Submit Replacement Request
            </Button>
          </div>
        )}
      </Modal>

      {/* Worker Size & Fit Guide Modal */}
      <UniformFitGuideModal
        isOpen={fitGuideOpen}
        onClose={() => setFitGuideOpen(false)}
        outfitName="Worker High-Vis Uniform"
      />
    </div>
  )
}
