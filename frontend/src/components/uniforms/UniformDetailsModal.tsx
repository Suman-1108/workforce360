import React, { useState } from 'react'
import {
  X,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  UserCheck,
  Edit3,
  ShieldCheck,
  Ruler,
} from 'lucide-react'
import { Button, Badge, Avatar } from '../common'
import type { UniformOutfit, ClothingComponent } from './UniformOutfitCard'
import { UniformFitGuideModal } from './UniformFitGuideModal'

interface UniformDetailsModalProps {
  outfit: UniformOutfit | null
  isOpen: boolean
  onClose: () => void
  onAssign: (outfit: UniformOutfit) => void
  onEdit?: (outfit: UniformOutfit) => void
  distributions?: any[]
}

export const UniformDetailsModal: React.FC<UniformDetailsModalProps> = ({
  outfit,
  isOpen,
  onClose,
  onAssign,
  onEdit,
  distributions = [],
}) => {
  if (!isOpen || !outfit) return null

  // Parse clothing breakdown components
  const components: ClothingComponent[] = React.useMemo(() => {
    if (!outfit.items_breakdown) return []
    if (Array.isArray(outfit.items_breakdown)) return outfit.items_breakdown
    try {
      return JSON.parse(outfit.items_breakdown)
    } catch {
      return []
    }
  }, [outfit.items_breakdown])

  const [selectedCompIndex, setSelectedCompIndex] = useState<number>(0)
  const [fitGuideOpen, setFitGuideOpen] = useState(false)
  const activeComponent = components[selectedCompIndex] || null

  const availableStock =
    outfit.available_stock ?? Math.max(0, outfit.total_stock - outfit.distributed_stock)
  const isOutOfStock = availableStock <= 0
  const isLowStock = availableStock > 0 && availableStock < 20

  // Filter distributions matching this outfit
  const relevantDists = distributions.filter(
    (d) =>
      Number(d.uniform_item_id) === Number(outfit.id) ||
      d.uniform_item_name === outfit.name ||
      d.uniform_name === outfit.name
  )

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E5EAE4] shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#E5EAE4] bg-[#FBFDFB]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#075E54]/10 text-[#075E54] border border-[#075E54]/20">
              {outfit.code || `UNIF-${outfit.id}`}
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#183B36] leading-tight">
                {outfit.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold text-[#075E54]">{outfit.category}</span>
                <span className="text-[#CBD5C8]">&bull;</span>
                <span className="text-xs text-[#78847F] flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {outfit.gender_group || 'Unisex'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFitGuideOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-[#075E54] text-[#075E54] bg-[#075E54]/5 hover:bg-[#075E54]/10 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Ruler className="h-3.5 w-3.5 text-[#FF8B45]" />
              <span>Worker Size &amp; Fit Guide</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#78847F] hover:bg-[#F5F7F1] hover:text-[#183B36] cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top Visual Overview: Model & Selected Component */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Primary Model Photo */}
            <div className="md:col-span-5 relative rounded-2xl overflow-hidden bg-[#F5F7F1] border border-[#E5EAE4] h-80 sm:h-96">
              <img
                src={outfit.model_image_url || '/uniforms/worker-fit-guide.jpg'}
                alt={outfit.name}
                className="w-full h-full object-contain p-2 bg-white"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = '/uniforms/worker-fit-guide.jpg'
                }}
              />
              <div className="absolute top-3 right-3">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 ${
                    isOutOfStock
                      ? 'bg-rose-500 text-white'
                      : isLowStock
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isOutOfStock ? (
                    <>
                      <XCircle className="h-3.5 w-3.5" /> Out of Stock
                    </>
                  ) : isLowStock ? (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5" /> Low Stock ({availableStock})
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> In Stock ({availableStock})
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Component Breakdown & Inspection */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#78847F] flex items-center gap-1.5 mb-2">
                  <Layers className="h-4 w-4 text-[#075E54]" />
                  Complete Ensemble Components Breakdown
                </h3>
                <p className="text-xs text-[#78847F] mb-4">
                  Select an individual clothing piece to view material, color, and sizing specifications.
                </p>

                {/* Component Thumbnails Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                  {components.map((comp, idx) => {
                    const isSelected = selectedCompIndex === idx
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSelectedCompIndex(idx)}
                        className={`flex flex-col items-center p-2 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#075E54]/10 border-[#075E54] shadow-xs'
                            : 'bg-[#F5F7F1]/70 border-[#E5EAE4] hover:border-[#075E54]/40'
                        }`}
                      >
                        <img
                          src={comp.image_url}
                          alt={comp.label}
                          className="w-14 h-14 rounded-xl object-cover bg-white border border-[#E5EAE4] mb-1.5"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&auto=format&fit=crop&q=80'
                          }}
                        />
                        <span className="text-[11px] font-bold text-[#183B36] line-clamp-1">
                          {comp.label}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-[#78847F]">
                          {comp.type}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Active Component Specification Card */}
                {activeComponent && (
                  <div className="p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] flex items-start gap-3">
                    <img
                      src={activeComponent.image_url}
                      alt={activeComponent.label}
                      className="w-16 h-16 rounded-xl object-cover bg-white border border-[#E5EAE4] shrink-0"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#183B36]">
                          {activeComponent.label}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#075E54] text-white">
                          {activeComponent.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-[#78847F] block">Design Palette:</span>
                          <span className="font-semibold text-[#183B36]">{activeComponent.color}</span>
                        </div>
                        <div>
                          <span className="text-[#78847F] block">Size Range:</span>
                          <span className="font-mono font-bold text-[#075E54]">{activeComponent.sizes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Warehouse Inventory KPI Row */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#075E54]/5 border border-[#075E54]/15">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#78847F] block">
                    Total Warehouse
                  </span>
                  <span className="text-base font-extrabold text-[#183B36]">
                    {outfit.total_stock} <span className="text-xs font-normal text-[#78847F]">units</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#78847F] block">
                    Issued to Staff
                  </span>
                  <span className="text-base font-extrabold text-[#075E54]">
                    {outfit.distributed_stock} <span className="text-xs font-normal text-[#78847F]">units</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#78847F] block">
                    Available Stock
                  </span>
                  <span className="text-base font-extrabold text-[#FF8B45]">
                    {availableStock} <span className="text-xs font-normal text-[#78847F]">units</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Outfit Specs */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5EAE4] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#183B36]">
              Ensemble Description & Wearer Specifications
            </h4>
            <p className="text-xs text-[#78847F] leading-relaxed">
              {outfit.description ||
                'High-performance organization uniform kit. Tailored for comfort, durability, and brand cohesion across all company operations.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#E5EAE4] text-xs">
              <span className="text-[#78847F]">
                Palette: <strong className="text-[#183B36]">{outfit.colors || 'Brand Standard'}</strong>
              </span>
              <span className="text-[#CBD5C8]">&bull;</span>
              <span className="text-[#78847F]">
                Sizes:{' '}
                <strong className="text-[#183B36]">
                  {outfit.sizes_available || 'S, M, L, XL, 2XL'}
                </strong>
              </span>
              <span className="text-[#CBD5C8]">&bull;</span>
              <span className="text-[#78847F]">
                Status:{' '}
                <strong className="text-emerald-700">
                  {outfit.is_active ? 'Active Standard Issue' : 'Deactivated'}
                </strong>
              </span>
            </div>
          </div>

          {/* Distribution History Ledger */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#183B36]">
                  Staff Gear Allocation Ledger ({relevantDists.length})
                </h4>
                <p className="text-[11px] text-[#78847F]">
                  Personnel issued with this uniform kit across all branch facilities.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#075E54]/10 text-[#075E54]">
                {relevantDists.length} Active Wearers
              </span>
            </div>

            {relevantDists.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] text-center text-xs text-[#78847F]">
                No current employee allocations recorded for this outfit. Click 'Assign Uniform' to issue to staff.
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E5EAE4] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FBFDFB] border-b border-[#E5EAE4]">
                    <tr>
                      <th className="px-4 py-3 font-bold text-[#78847F]">Employee</th>
                      <th className="px-4 py-3 font-bold text-[#78847F]">Size Issued</th>
                      <th className="px-4 py-3 font-bold text-[#78847F]">Quantity</th>
                      <th className="px-4 py-3 font-bold text-[#78847F]">Issued Date</th>
                      <th className="px-4 py-3 font-bold text-[#78847F]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5EAE4]">
                    {relevantDists.map((d: any) => (
                      <tr key={d.id} className="hover:bg-[#F5F7F1]/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={d.employee_name || 'Staff Member'} size="xs" />
                            <div>
                              <span className="font-bold text-[#183B36] block">
                                {d.employee_name || 'Staff Member'}
                              </span>
                              <span className="text-[10px] text-[#78847F]">
                                {d.employee_id_number || `EMP-${d.employee_id}`}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-[#075E54]">{d.size}</td>
                        <td className="px-4 py-3 text-[#183B36] font-semibold">{d.quantity || 1} set</td>
                        <td className="px-4 py-3 text-[#78847F]">{String(d.issued_date || '').slice(0, 10)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={d.status === 'Issued' ? 'success' : 'neutral'}>
                            {d.status || 'Issued'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E5EAE4] bg-[#FBFDFB] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#78847F] flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#075E54]" />
            Tenant Gear Audit: ISO-compliant workplace apparel tracking
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFitGuideOpen(true)}
              leftIcon={<Ruler className="h-3.5 w-3.5 text-[#FF8B45]" />}
              className="text-xs font-bold border-[#075E54] text-[#075E54] hover:bg-[#075E54]/5 cursor-pointer"
            >
              Size &amp; Fit Guide
            </Button>

            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onEdit(outfit)
                }}
                leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                className="text-xs font-bold border-[#CBD5C8] text-[#183B36] hover:bg-[#F5F7F1] cursor-pointer"
              >
                Edit Outfit
              </Button>
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                onClose()
                onAssign(outfit)
              }}
              disabled={isOutOfStock}
              leftIcon={<UserCheck className="h-3.5 w-3.5" />}
              className="text-xs font-bold bg-[#075E54] hover:bg-[#075E54]/90 text-white cursor-pointer px-4"
            >
              Assign Uniform to Employee
            </Button>
          </div>
        </div>
      </div>

      {/* Worker Size & Fit Guide Modal */}
      <UniformFitGuideModal
        isOpen={fitGuideOpen}
        onClose={() => setFitGuideOpen(false)}
        outfitName={outfit.name}
      />
    </div>
  )
}
