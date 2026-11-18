import React, { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Layers,
  Save,
  AlertCircle,
  Tag,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { Button, Input } from '../common'
import type { UniformOutfit, ClothingComponent } from './UniformOutfitCard'
import { FACTORY_UNIFORM_PRESETS, type FactoryUniformPreset } from './factoryPresets'

interface UniformFormModalProps {
  isOpen: boolean
  outfitToEdit: UniformOutfit | null
  onClose: () => void
  onSaved: (outfit: any) => Promise<void>
}

const CATEGORIES = [
  'Operations & Warehouse',
  'Industrial & Mechanical Floor',
  'Logistics & Warehouse Operations',
  'Corporate & Executive',
  'Security & Guard',
  'Field Engineering',
]

const COMPONENT_TYPES = [
  { value: 'top', label: 'Shirt / Top' },
  { value: 'bottom', label: 'Trousers / Bottom' },
  { value: 'outerwear', label: 'Jacket / Outerwear' },
  { value: 'shoes', label: 'Shoes / Footwear' },
  { value: 'accessory', label: 'Accessory / PPE Gear' },
]

export const UniformFormModal: React.FC<UniformFormModalProps> = ({
  isOpen,
  outfitToEdit,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(outfitToEdit)
  const defaultPreset = FACTORY_UNIFORM_PRESETS[0]
  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset.id)

  const [formData, setFormData] = useState({
    name: defaultPreset.name,
    code: defaultPreset.code,
    category: defaultPreset.category,
    gender_group: defaultPreset.gender_group,
    model_image_url: defaultPreset.model_image_url,
    description: defaultPreset.description,
    colors: defaultPreset.colors,
    sizes_available: defaultPreset.sizes_available,
    total_stock: defaultPreset.total_stock,
    is_active: true,
  })

  const [components, setComponents] = useState<ClothingComponent[]>(defaultPreset.components)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSelectPreset = (preset: FactoryUniformPreset) => {
    setSelectedPresetId(preset.id)
    setFormData({
      name: preset.name,
      code: preset.code,
      category: preset.category,
      gender_group: preset.gender_group,
      model_image_url: preset.model_image_url,
      description: preset.description,
      colors: preset.colors,
      sizes_available: preset.sizes_available,
      total_stock: preset.total_stock,
      is_active: preset.is_active,
    })
    setComponents(preset.components)
  }

  useEffect(() => {
    if (outfitToEdit) {
      setFormData({
        name: outfitToEdit.name || '',
        code: outfitToEdit.code || '',
        category: outfitToEdit.category || 'Operations & Warehouse',
        gender_group: outfitToEdit.gender_group || 'Unisex (Athletic / Standard Fit)',
        model_image_url: outfitToEdit.model_image_url || '/uniforms/worker-fit-guide.jpg',
        description: outfitToEdit.description || '',
        colors: outfitToEdit.colors || 'Fluorescent Lime Yellow & Charcoal Black',
        sizes_available: outfitToEdit.sizes_available || 'S, M, L, XL, XXL, 3XL',
        total_stock: outfitToEdit.total_stock || 250,
        is_active: outfitToEdit.is_active ?? true,
      })

      if (outfitToEdit.items_breakdown) {
        if (Array.isArray(outfitToEdit.items_breakdown)) {
          setComponents(outfitToEdit.items_breakdown)
        } else {
          try {
            setComponents(JSON.parse(outfitToEdit.items_breakdown))
          } catch {
            // Keep default
          }
        }
      }
    } else {
      const preset = FACTORY_UNIFORM_PRESETS[0]
      setSelectedPresetId(preset.id)
      setFormData({
        name: preset.name,
        code: preset.code,
        category: preset.category,
        gender_group: preset.gender_group,
        model_image_url: preset.model_image_url,
        description: preset.description,
        colors: preset.colors,
        sizes_available: preset.sizes_available,
        total_stock: preset.total_stock,
        is_active: true,
      })
      setComponents(preset.components)
    }
    setErrorMsg(null)
  }, [outfitToEdit, isOpen])

  if (!isOpen) return null

  const handleAddComponent = () => {
    setComponents([
      ...components,
      {
        type: 'outerwear',
        label: 'Outerwear / Jacket',
        color: 'Slate Grey',
        sizes: 'M, L, XL',
        image_url:
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&auto=format&fit=crop&q=80',
      },
    ])
  }

  const handleRemoveComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index))
  }

  const handleUpdateComponent = (index: number, field: keyof ClothingComponent, val: string) => {
    const updated = [...components]
    updated[index] = { ...updated[index], [field]: val }
    setComponents(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!formData.name.trim()) {
      setErrorMsg('Uniform outfit name is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        items_breakdown: JSON.stringify(components),
      }
      await onSaved(payload)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save uniform outfit.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E5EAE4] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#E5EAE4] bg-[#FBFDFB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#075E54]/10 text-[#075E54] flex items-center justify-center">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#183B36] leading-tight">
                {isEditing ? 'Edit Uniform Outfit Ensemble' : 'Create New Uniform Outfit Ensemble'}
              </h2>
              <p className="text-xs text-[#78847F]">
                Configure full outfit model photography, clothing components breakdown, and warehouse stock rules.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#78847F] hover:bg-[#F5F7F1] hover:text-[#183B36] cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preset Factory Working Uniforms Quick Selector */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#E6F3F1]/80 border border-[#BDE0D9] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#075E54] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#FF8B45]" />
                  Preset Factory Working Uniforms (No Image Upload Needed)
                </h3>
                <p className="text-[11px] text-[#5A6B65]">
                  Select an industrial factory workwear standard to auto-load specifications, size matrix, and factory model photography.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FACTORY_UNIFORM_PRESETS.map((p) => {
                const isSelected = formData.name === p.name || selectedPresetId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-[#075E54] shadow-md ring-2 ring-[#075E54]/25'
                        : 'bg-white/80 border-[#CBD5C8] hover:border-[#075E54] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <img
                        src={p.model_image_url}
                        alt={p.name}
                        className="w-11 h-11 rounded-xl object-contain bg-[#183B36]/5 p-0.5 border border-[#E5EAE4]"
                      />
                      <div className="overflow-hidden">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#075E54]/10 text-[#075E54]">
                          {p.code}
                        </span>
                        <h4 className="text-xs font-bold text-[#183B36] line-clamp-1 mt-0.5">
                          {p.name}
                        </h4>
                      </div>
                    </div>
                    <div className="text-[10px] text-[#78847F] line-clamp-2">
                      {p.colors} &bull; {p.category}
                    </div>
                    {isSelected && (
                      <div className="mt-2 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Preset Applied &bull; Ready
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 1: Core Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#183B36] border-b border-[#E5EAE4] pb-2">
              1. Outfit Metadata &amp; Classification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Uniform Ensemble Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Executive Corporate Teal Suit Ensemble"
                  required
                />
              </div>

              <div>
                <Input
                  label="Uniform SKU / Code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="UNIF-CORP-01"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#183B36] mb-1">
                  Uniform Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#CBD5C8] bg-white text-[#183B36] focus:outline-none focus:border-[#075E54]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Applicable Employee Group / Gender"
                value={formData.gender_group}
                onChange={(e) => setFormData({ ...formData, gender_group: e.target.value })}
                placeholder="e.g. Corporate & HQ Staff, Security, Unisex"
              />
            </div>
          </div>

          {/* Section 2: Model Photography & Media */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#183B36] border-b border-[#E5EAE4] pb-2">
              2. Full Ensemble Model Photography (Preset Active)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-3.5 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4]">
              <div className="sm:col-span-8 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#183B36]">
                    Built-in Factory Uniform Imagery
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Auto Preset
                  </span>
                </div>
                <p className="text-[11px] text-[#78847F] leading-relaxed">
                  Dual front &amp; back view safety worker wear photography with integrated reflective tape visualization is pre-linked. No image upload is required.
                </p>
                <div className="pt-1">
                  <Input
                    label="Custom Image URL (Optional)"
                    value={formData.model_image_url}
                    onChange={(e) => setFormData({ ...formData, model_image_url: e.target.value })}
                    placeholder="/uniforms/worker-fit-guide.jpg"
                    leftIcon={<ImageIcon className="h-4 w-4 text-[#78847F]" />}
                  />
                </div>
              </div>

              <div className="sm:col-span-4 p-2 rounded-2xl bg-white border border-[#E5EAE4] text-center shadow-xs">
                <span className="text-[10px] font-bold text-[#78847F] uppercase block mb-1">
                  Model Visual Preview
                </span>
                <div className="w-full h-36 rounded-xl overflow-hidden bg-white border border-[#E5EAE4] flex items-center justify-center">
                  <img
                    src={formData.model_image_url || '/uniforms/worker-fit-guide.jpg'}
                    alt="Preview"
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = '/uniforms/worker-fit-guide.jpg'
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183B36] mb-1">
                Outfit Description &amp; Wearer Guidelines
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Detailed description of apparel materials, mobility comfort, and brand uniform guidelines..."
                className="w-full text-xs p-3 rounded-2xl border border-[#CBD5C8] text-[#183B36] focus:outline-none focus:border-[#075E54]"
              />
            </div>
          </div>

          {/* Section 3: Individual Clothing Component Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5EAE4] pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#183B36] flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-[#075E54]" />
                  3. Individual Clothing Components Breakdown
                </h3>
                <p className="text-[11px] text-[#78847F]">
                  Define the individual garments (shirt, bottom, jacket, shoes, accessories) included in this uniform kit.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddComponent}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                className="text-xs font-bold border-[#075E54] text-[#075E54] hover:bg-[#075E54]/5 cursor-pointer py-1.5"
              >
                Add Component
              </Button>
            </div>

            <div className="space-y-3">
              {components.map((comp, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#183B36]">
                      Component #{idx + 1}: {comp.label}
                    </span>
                    {components.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Remove component"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#78847F] mb-1">
                        Garment Type
                      </label>
                      <select
                        value={comp.type}
                        onChange={(e) => handleUpdateComponent(idx, 'type', e.target.value as any)}
                        className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-[#CBD5C8] bg-white text-[#183B36]"
                      >
                        {COMPONENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <Input
                        label="Component Item Name"
                        value={comp.label}
                        onChange={(e) => handleUpdateComponent(idx, 'label', e.target.value)}
                        placeholder="e.g. Crisp Poplin Button-Down Shirt"
                        required
                      />
                    </div>

                    <div>
                      <Input
                        label="Component Color"
                        value={comp.color}
                        onChange={(e) => handleUpdateComponent(idx, 'color', e.target.value)}
                        placeholder="e.g. Deep Teal"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <Input
                        label="Available Sizes for Component"
                        value={comp.sizes}
                        onChange={(e) => handleUpdateComponent(idx, 'sizes', e.target.value)}
                        placeholder="e.g. S, M, L, XL"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Input
                        label="Garment Image URL"
                        value={comp.image_url}
                        onChange={(e) => handleUpdateComponent(idx, 'image_url', e.target.value)}
                        placeholder="https://..."
                        leftIcon={<ImageIcon className="h-3.5 w-3.5 text-[#78847F]" />}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Inventory & Status */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#183B36] border-b border-[#E5EAE4] pb-2">
              4. Inventory Stock & Sizing Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Supported Overall Sizes"
                value={formData.sizes_available}
                onChange={(e) => setFormData({ ...formData, sizes_available: e.target.value })}
                placeholder="S, M, L, XL, 2XL"
                required
              />

              <Input
                label="Color Palette Description"
                value={formData.colors}
                onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                placeholder="Deep Teal & Khaki"
              />

              <Input
                label="Warehouse Total Stock Units"
                type="number"
                min={0}
                value={String(formData.total_stock)}
                onChange={(e) => setFormData({ ...formData, total_stock: Number(e.target.value) })}
                required
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-[#183B36]">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#075E54]"
                />
                Activate uniform outfit for staff allocation and employee portal visibility
              </label>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-[#E5EAE4] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-bold border-[#CBD5C8] text-[#183B36] hover:bg-[#F5F7F1] cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
              leftIcon={<Save className="h-4 w-4" />}
              className="bg-[#075E54] hover:bg-[#075E54]/90 text-white cursor-pointer px-5"
            >
              {submitting
                ? 'Saving Outfit...'
                : isEditing
                ? 'Save Changes'
                : 'Create Uniform Outfit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
