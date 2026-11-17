import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Layers,
  CheckCircle2,
  Shirt,
  Sparkles,
} from 'lucide-react'
import { Input } from '../common'
import { UniformOutfitCard } from './UniformOutfitCard'
import type { UniformOutfit, ClothingComponent } from './UniformOutfitCard'

interface UniformOutfitGridProps {
  outfits: UniformOutfit[]
  onViewDetails: (outfit: UniformOutfit) => void
  onAssign: (outfit: UniformOutfit, selectedItems?: ClothingComponent[]) => void
  onEdit?: (outfit: UniformOutfit) => void
  onArchive?: (outfit: UniformOutfit) => void
  onAddNew?: () => void
}

const CATEGORIES = [
  'All Outfits',
  'Corporate & Executive',
  'Operations & Warehouse',
  'Security & Guard',
  'Field Engineering',
  'Hospitality & Front Desk',
]

export const UniformOutfitGrid: React.FC<UniformOutfitGridProps> = ({
  outfits,
  onViewDetails,
  onAssign,
  onEdit,
  onArchive,
  onAddNew,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Outfits')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'in_stock' | 'low_stock'>('all')

  // Filtered outfits calculation
  const filteredOutfits = useMemo(() => {
    return outfits.filter((outfit) => {
      // Category match
      if (
        selectedCategory !== 'All Outfits' &&
        outfit.category?.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const nameMatch = outfit.name?.toLowerCase().includes(q)
        const codeMatch = outfit.code?.toLowerCase().includes(q)
        const groupMatch = outfit.gender_group?.toLowerCase().includes(q)
        const descMatch = outfit.description?.toLowerCase().includes(q)
        if (!nameMatch && !codeMatch && !groupMatch && !descMatch) {
          return false
        }
      }

      // Availability filter
      const available = outfit.available_stock ?? Math.max(0, outfit.total_stock - outfit.distributed_stock)
      if (selectedAvailability === 'in_stock' && available <= 0) return false
      if (selectedAvailability === 'low_stock' && (available <= 0 || available >= 20)) return false

      return true
    })
  }, [outfits, selectedCategory, searchQuery, selectedAvailability])

  // Aggregate Metrics
  const totalOutfits = outfits.length
  const totalStock = outfits.reduce((acc, o) => acc + (o.total_stock || 0), 0)
  const totalDistributed = outfits.reduce((acc, o) => acc + (o.distributed_stock || 0), 0)
  const totalAvailable = Math.max(0, totalStock - totalDistributed)

  return (
    <div className="space-y-6">
      {/* Top Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              Ensemble Catalog
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#075E54]/10 text-[#075E54] flex items-center justify-center">
              <Shirt className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#183B36]">{totalOutfits}</div>
          <span className="text-[11px] text-[#78847F]">Standard Uniform Lines</span>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              Total Stock Units
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FF8B45]/10 text-[#FF8B45] flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#183B36]">{totalStock}</div>
          <span className="text-[11px] text-[#78847F]">Total Physical Inventory</span>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              Issued to Personnel
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#075E54]">
            {totalDistributed}
          </div>
          <span className="text-[11px] text-[#78847F]">Active Staff Allocations</span>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-[#78847F] uppercase tracking-wider">
              Available in Warehouse
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#075E54]/10 text-[#075E54] flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#183B36]">{totalAvailable}</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Ready for Distribution</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5EAE4] card-soft-shadow space-y-4">
        {/* Category Pills Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <button
                type="button"
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#075E54] text-white shadow-xs'
                    : 'bg-[#F5F7F1] text-[#78847F] hover:bg-[#EAEFE8] hover:text-[#183B36]'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Search & Stock Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-[#E5EAE4]">
          <div className="w-full sm:w-96">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search uniforms by title, code (e.g. UNIF-01), or group..."
              leftIcon={<Search className="h-4 w-4 text-[#78847F]" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-semibold text-[#78847F] flex items-center gap-1 shrink-0">
              <Filter className="h-3.5 w-3.5" /> Filter Stock:
            </span>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value as any)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-[#E5EAE4] bg-[#F5F7F1] text-[#183B36] focus:outline-none focus:border-[#075E54] cursor-pointer"
            >
              <option value="all">All Inventory ({outfits.length})</option>
              <option value="in_stock">In Stock Only</option>
              <option value="low_stock">Low Stock Warning</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modern Fashion Outfit Grid */}
      {filteredOutfits.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E5EAE4] card-soft-shadow space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#075E54]/10 text-[#075E54] flex items-center justify-center mx-auto">
            <Shirt className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-[#183B36]">No Uniform Outfits Found</h3>
          <p className="text-xs text-[#78847F] max-w-sm mx-auto">
            No catalogue items match your current filter criteria or search query.
          </p>
          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="mt-2 text-xs font-bold text-[#075E54] hover:underline cursor-pointer"
            >
              Add a new outfit ensemble &rarr;
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {filteredOutfits.map((outfit) => (
            <UniformOutfitCard
              key={outfit.id}
              outfit={outfit}
              onViewDetails={onViewDetails}
              onAssign={onAssign}
              onEdit={onEdit}
              onArchive={onArchive}
            />
          ))}
        </div>
      )}
    </div>
  )
}
