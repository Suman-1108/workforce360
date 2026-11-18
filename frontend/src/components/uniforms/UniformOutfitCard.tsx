import React, { useState, useMemo } from 'react'
import {
  Eye,
  UserCheck,
  MoreVertical,
  XCircle,
  Tag,
  Layers,
  Heart,
  Sparkles,
  Check,
  RotateCcw,
  Ruler,
} from 'lucide-react'
import { UniformFitGuideModal } from './UniformFitGuideModal'

export interface ClothingComponent {
  type: 'top' | 'bottom' | 'outerwear' | 'shoes' | 'accessory'
  label: string
  color: string
  sizes: string
  image_url: string
}

export interface UniformOutfit {
  id: string | number
  name: string
  code?: string
  category?: string
  gender_group?: string
  model_image_url?: string
  description?: string
  colors?: string
  sizes_available?: string
  total_stock: number
  distributed_stock: number
  available_stock: number
  is_active: boolean
  is_archived?: boolean
  items_breakdown?: ClothingComponent[] | string
}

interface UniformOutfitCardProps {
  outfit: UniformOutfit
  onViewDetails: (outfit: UniformOutfit) => void
  onAssign: (outfit: UniformOutfit, selectedItems?: ClothingComponent[]) => void
  onEdit?: (outfit: UniformOutfit) => void
  onArchive?: (outfit: UniformOutfit) => void
}

export const UniformOutfitCard: React.FC<UniformOutfitCardProps> = ({
  outfit,
  onViewDetails,
  onAssign,
  onEdit,
  onArchive,
}) => {
  // Parse clothing breakdown components if stored as JSON string
  const components: ClothingComponent[] = useMemo(() => {
    if (!outfit.items_breakdown) return []
    if (Array.isArray(outfit.items_breakdown)) return outfit.items_breakdown
    try {
      return JSON.parse(outfit.items_breakdown)
    } catch {
      return []
    }
  }, [outfit.items_breakdown])

  // Interactive selection state for Mix & Match
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    () => new Set(components.map((_, i) => i))
  )

  // Track hovered component to trigger pulse hotspot pin on model
  const [hoveredComponentIndex, setHoveredComponentIndex] = useState<number | null>(null)

  // Save outfit bookmark state with micro-animation
  const [isSaved, setIsSaved] = useState(false)
  const [showSavedFeedback, setShowSavedFeedback] = useState(false)

  // Context menu
  const [menuOpen, setMenuOpen] = useState(false)
  const [fitGuideOpen, setFitGuideOpen] = useState(false)

  const availableStock =
    outfit.available_stock ?? Math.max(0, outfit.total_stock - outfit.distributed_stock)
  const isOutOfStock = availableStock <= 0
  const isLowStock = availableStock > 0 && availableStock < 20

  // Format Drop Title (e.g. DROP: GEN Z FORMAL, DROP: TECHNICAL HIKER)
  const dropTitle = useMemo(() => {
    const raw = outfit.name || 'STANDARD WORKWEAR'
    const cleaned = raw.replace(/^UNIFORM\s*[-:]?\s*/i, '')
    return `DROP: ${cleaned.toUpperCase()}`
  }, [outfit.name])

  // Toggle component selection
  const handleToggleComponent = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        if (next.size > 1) {
          next.delete(index)
        }
      } else {
        next.add(index)
      }
      return next
    })
  }

  // Handle Save Outfit bookmark
  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsSaved((prev) => !prev)
    setShowSavedFeedback(true)
    setTimeout(() => setShowSavedFeedback(false), 2000)
  }

  // Handle Primary Buy / Assign action
  const handlePrimaryAssign = () => {
    const selectedItems = components.filter((_, idx) => selectedIndices.has(idx))
    onAssign(outfit, selectedItems)
  }

  // Hotspot pin coordinates based on garment type
  const getHotspotCoords = (type: string, idx: number) => {
    switch (type.toLowerCase()) {
      case 'outerwear':
        return { top: '22%', left: '50%' }
      case 'top':
        return { top: '35%', left: '50%' }
      case 'bottom':
        return { top: '65%', left: '50%' }
      case 'shoes':
        return { top: '88%', left: '50%' }
      case 'accessory':
        return { top: '48%', left: '68%' }
      default:
        return { top: `${25 + idx * 18}%`, left: '50%' }
    }
  }

  return (
    <div className="bg-white rounded-4xl border border-[#E5EAE4] card-soft-shadow hover:shadow-2xl transition-all duration-300 p-4 sm:p-6 flex flex-col justify-between group relative overflow-hidden">
      {/* Toast Feedback for Save Outfit */}
      {showSavedFeedback && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#183B36] text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl flex items-center gap-1.5 animate-spring-pop">
          <Sparkles className="h-3.5 w-3.5 text-[#FF8B45]" />
          <span>{isSaved ? 'Outfit saved to lookbook!' : 'Removed from saved'}</span>
        </div>
      )}

      <div>
        {/* Top Header: DROP TITLE & Subtitle from Reference Image */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-black tracking-wider text-[#183B36] uppercase leading-tight font-sans">
              {dropTitle}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[#78847F] font-medium tracking-wide">
                create an outfit
              </span>
              <span className="text-[#CBD5C8]">&bull;</span>
              <span className="text-[11px] font-mono text-[#075E54] font-semibold">
                {outfit.code || `UNIF-${outfit.id}`}
              </span>
            </div>
          </div>

          {/* Quick Context Menu & Stock Badge */}
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isOutOfStock
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : isLowStock
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {isOutOfStock ? 'Sold Out' : isLowStock ? `Low (${availableStock})` : `${availableStock} in stock`}
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-lg text-[#78847F] hover:bg-[#F5F7F1] hover:text-[#183B36] cursor-pointer"
                aria-label="Outfit options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-8 w-40 bg-white rounded-2xl shadow-xl border border-[#E5EAE4] py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onViewDetails(outfit)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#183B36] hover:bg-[#F5F7F1] flex items-center gap-2 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-[#075E54]" />
                    View Details
                  </button>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        onEdit(outfit)
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#183B36] hover:bg-[#F5F7F1] flex items-center gap-2 cursor-pointer"
                    >
                      <Tag className="h-3.5 w-3.5 text-[#075E54]" />
                      Edit Outfit
                    </button>
                  )}
                  {onArchive && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        onArchive(outfit)
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      Archive Drop
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            Split Stage: Left Model Capsule + Right Garment Components Column
           ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-5">
          {/* Left Model Capsule (7 cols on desktop, full width on mobile) */}
          <div className="sm:col-span-7 rounded-3xl bg-[#ECEEE9] relative overflow-hidden flex items-center justify-center min-h-[380px] sm:min-h-[440px] group/model shadow-inner">
            <img
              src={outfit.model_image_url || '/uniforms/worker-fit-guide.jpg'}
              alt={outfit.name}
              className="w-full h-full object-contain object-bottom group-hover/model:scale-[1.03] transition-transform duration-700 ease-out pointer-events-none"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = '/uniforms/worker-fit-guide.jpg'
              }}
            />

            {/* Subtle Gradient Shade at Bottom */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />

            {/* Category / Gender Group Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#183B36] shadow-2xs border border-[#CBD5C8]">
                {outfit.gender_group || 'Unisex'}
              </span>
            </div>

            {/* Interactive Hotspot Linkage Pins (Pulsing over model when item hovered) */}
            {components.map((comp, idx) => {
              const coords = getHotspotCoords(comp.type, idx)
              const isHovered = hoveredComponentIndex === idx
              const isSelected = selectedIndices.has(idx)

              return (
                <div
                  key={idx}
                  style={{ top: coords.top, left: coords.left }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-300 z-10 ${
                    isHovered ? 'scale-125 opacity-100' : isSelected ? 'opacity-85' : 'opacity-40'
                  }`}
                  onMouseEnter={() => setHoveredComponentIndex(idx)}
                  onMouseLeave={() => setHoveredComponentIndex(null)}
                >
                  {/* Radar Pulse Effect when Hovered */}
                  {isHovered && (
                    <span className="absolute inset-0 -m-2 rounded-full bg-[#FF8B45]/40 animate-ping-slow pointer-events-none" />
                  )}

                  {/* Hotspot Target Center Dot */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-colors ${
                      isHovered
                        ? 'bg-[#FF8B45] ring-2 ring-[#FF8B45]/50'
                        : isSelected
                        ? 'bg-[#075E54]'
                        : 'bg-stone-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  {/* Hover Floating Garment Label Pill */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#183B36] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                      {comp.label}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Action Bar on Model: Inspect Look + Worker Size & Fit Guide */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={() => onViewDetails(outfit)}
                className="bg-white/95 backdrop-blur-md hover:bg-white text-[#183B36] text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 transition-all hover:scale-105 cursor-pointer"
              >
                <Eye className="h-3 w-3 text-[#075E54]" />
                <span>Inspect</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFitGuideOpen(true)
                }}
                className="bg-[#183B36]/95 backdrop-blur-md hover:bg-[#075E54] text-white text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 transition-all hover:scale-105 cursor-pointer"
                title="View worker shirt & trouser size chart and fit guide"
              >
                <Ruler className="h-3 w-3 text-[#FF8B45]" />
                <span>Fit Guide</span>
              </button>
            </div>
          </div>

          {/* Right Garment Components Column (5 cols on desktop, horizontal scroll on mobile) */}
          <div className="sm:col-span-5 rounded-3xl bg-[#F6F7F3] p-2.5 sm:p-3 flex flex-row sm:flex-col justify-around gap-2.5 overflow-x-auto sm:overflow-visible">
            {components.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#78847F] bg-white rounded-2xl w-full">
                Complete Uniform Ensemble
              </div>
            ) : (
              components.map((comp, idx) => {
                const isSelected = selectedIndices.has(idx)
                const isHovered = hoveredComponentIndex === idx

                return (
                  <div
                    key={idx}
                    onClick={(e) => handleToggleComponent(idx, e)}
                    onMouseEnter={() => setHoveredComponentIndex(idx)}
                    onMouseLeave={() => setHoveredComponentIndex(null)}
                    className={`
                      outfit-component-item group/item relative p-2 rounded-2xl bg-white border cursor-pointer select-none
                      flex flex-col items-center justify-center shrink-0 w-28 sm:w-full transition-all duration-200
                      ${
                        isSelected
                          ? 'border-[#075E54] ring-2 ring-[#075E54]/20 shadow-xs'
                          : 'border-[#E5EAE4] opacity-60 hover:opacity-100'
                      }
                      ${isHovered ? '-translate-y-1 shadow-md scale-102 border-[#FF8B45]' : ''}
                    `}
                    title={`Click to toggle ${comp.label}`}
                  >
                    {/* Checkmark Selection Pill in Top Right */}
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[#075E54] text-white shadow-2xs animate-spring-pop'
                            : 'border border-[#CBD5C8] bg-[#F5F7F1]'
                        }`}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Cutout Garment Image Centered */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden my-1">
                      <img
                        src={comp.image_url}
                        alt={comp.label}
                        className="max-w-full max-h-full object-contain mix-blend-multiply group-hover/item:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&auto=format&fit=crop&q=80'
                        }}
                      />
                    </div>

                    {/* Component Label Underneath (Exact reference image style) */}
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#183B36] text-center leading-tight truncate w-full px-1">
                      {comp.label}
                    </span>

                    {/* Secondary Color & Size Pill on hover */}
                    <span className="text-[9px] text-[#78847F] truncate block mt-0.5">
                      {comp.color} &bull; {comp.sizes.split(',')[0]}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Selected Items Summary Bar */}
        <div className="flex items-center justify-between text-xs text-[#78847F] px-1 mb-4">
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-[#075E54]" />
            <span className="font-semibold text-[#183B36]">{selectedIndices.size} of {components.length}</span> items selected
          </span>

          {selectedIndices.size < components.length && (
            <button
              type="button"
              onClick={() => setSelectedIndices(new Set(components.map((_, i) => i)))}
              className="text-[11px] font-bold text-[#075E54] hover:underline cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Select All
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          Bottom Pill Action Buttons (Exact match to reference design):
          - Left: Outline Pill "SAVE OUTFIT"
          - Right: Solid Pill "BUY SELECTED ITEMS" / "ASSIGN UNIFORM"
         ========================================================================= */}
      <div className="flex items-center gap-2.5 pt-1">
        {/* Outline Pill Button: SAVE OUTFIT */}
        <button
          type="button"
          onClick={handleToggleSave}
          className={`
            rounded-full border-2 transition-all font-black text-[11px] sm:text-xs tracking-wider uppercase
            py-2.5 px-4 sm:px-5 flex items-center justify-center gap-1.5 cursor-pointer shrink-0
            ${
              isSaved
                ? 'border-[#075E54] bg-[#075E54]/10 text-[#075E54]'
                : 'border-[#183B36] text-[#183B36] hover:bg-[#183B36] hover:text-white'
            }
          `}
          title="Save outfit to personal wishlist or roster"
        >
          <Heart
            className={`h-3.5 w-3.5 transition-transform ${
              isSaved ? 'fill-rose-500 text-rose-500 animate-spring-pop' : ''
            }`}
          />
          <span>{isSaved ? 'SAVED' : 'SAVE OUTFIT'}</span>
        </button>

        {/* Solid Dark Pill Button: BUY SELECTED ITEMS / ASSIGN UNIFORM */}
        <button
          type="button"
          onClick={handlePrimaryAssign}
          disabled={isOutOfStock}
          className={`
            rounded-full bg-[#183B36] hover:bg-[#075E54] text-white transition-all font-black text-[11px] sm:text-xs
            tracking-wider uppercase py-2.5 px-5 sm:px-6 flex-1 flex items-center justify-center gap-2
            shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50
          `}
        >
          <UserCheck className="h-3.5 w-3.5 text-[#FF8B45]" />
          <span>
            {selectedIndices.size === components.length
              ? 'BUY SELECTED ITEMS'
              : `BUY SELECTED (${selectedIndices.size})`}
          </span>
        </button>
      </div>

      {/* Sizing & Fit Guide Modal matching Reference Image */}
      <UniformFitGuideModal
        isOpen={fitGuideOpen}
        onClose={() => setFitGuideOpen(false)}
        outfitName={outfit.name}
      />
    </div>
  )
}

export default UniformOutfitCard
