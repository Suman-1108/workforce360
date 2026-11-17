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
} from 'lucide-react'
import { Button, Input } from '../common'
import type { UniformOutfit, ClothingComponent } from './UniformOutfitCard'

interface UniformFormModalProps {
  isOpen: boolean
  outfitToEdit: UniformOutfit | null
  onClose: () => void
  onSaved: (outfit: any) => Promise<void>
}

const CATEGORIES = [
  'Corporate & Executive',
  'Operations & Warehouse',
  'Security & Guard',
  'Field Engineering',
  'Hospitality & Front Desk',
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

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Corporate & Executive',
    gender_group: 'Unisex',
    model_image_url: '',
    description: '',
    colors: '',
    sizes_available: 'S, M, L, XL, 2XL',
    total_stock: 100,
    is_active: true,
  })

  const [components, setComponents] = useState<ClothingComponent[]>([
    {
      type: 'top',
      label: 'Corporate Polo / Shirt',
      color: 'Teal & White',
      sizes: 'S, M, L, XL',
      image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80',
    },
    {
      type: 'bottom',
      label: 'Tailored Chino Trousers',
      color: 'Charcoal Grey',
      sizes: '30, 32, 34, 36',
      image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&auto=format&fit=crop&q=80',
    },
  ])

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (outfitToEdit) {
      setFormData({
        name: outfitToEdit.name || '',
        code: outfitToEdit.code || '',
        category: outfitToEdit.category || 'Corporate & Executive',
        gender_group: outfitToEdit.gender_group || 'Unisex',
        model_image_url: outfitToEdit.model_image_url || '',
        description: outfitToEdit.description || '',
        colors: outfitToEdit.colors || '',
        sizes_available: outfitToEdit.sizes_available || 'S, M, L, XL, 2XL',
        total_stock: outfitToEdit.total_stock || 100,
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
      setFormData({
        name: '',
        code: `UNIF-${Math.floor(1000 + Math.random() * 9000)}`,
        category: 'Corporate & Executive',
        gender_group: 'Corporate & HQ Staff',
        model_image_url:
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
        description: '',
        colors: 'Deep Teal & Khaki',
        sizes_available: 'S, M, L, XL, 2XL',
        total_stock: 120,
        is_active: true,
      })
      setComponents([
        {
          type: 'top',
          label: 'Executive Polo Shirt',
          color: 'Deep Teal',
          sizes: 'S, M, L, XL',
          image_url:
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80',
        },
        {
          type: 'bottom',
          label: 'Straight-Fit Chinos',
          color: 'Khaki',
          sizes: '30, 32, 34, 36',
          image_url:
            'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&auto=format&fit=crop&q=80',
        },
      ])
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

          {/* Section 1: Core Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#183B36] border-b border-[#E5EAE4] pb-2">
              1. Outfit Metadata & Classification
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
              2. Full Ensemble Model Photography
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              <div className="sm:col-span-8">
                <Input
                  label="Model Wearing Outfit (High-Res Image URL)"
                  value={formData.model_image_url}
                  onChange={(e) => setFormData({ ...formData, model_image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/... or Cloudinary URL"
                  leftIcon={<ImageIcon className="h-4 w-4 text-[#78847F]" />}
                  helperText="Provide direct image URL from Cloudinary or CDN. Images are stored securely by reference, not binary blobs."
                  required
                />
              </div>

              <div className="sm:col-span-4 p-2 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] text-center">
                <span className="text-[10px] font-bold text-[#78847F] uppercase block mb-1">
                  Model Preview
                </span>
                <div className="w-full h-32 rounded-xl overflow-hidden bg-white border border-[#E5EAE4]">
                  <img
                    src={
                      formData.model_image_url ||
                      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop&q=80'
                    }
                    alt="Preview"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop&q=80'
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183B36] mb-1">
                Outfit Description & Wearer Guidelines
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
