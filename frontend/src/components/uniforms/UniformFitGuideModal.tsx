import React, { useState } from 'react'
import {
  X,
  Ruler,
  ShieldCheck,
  Eye,
  Layers,
  Wind,
  CloudRain,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react'
import {
  WORKER_SIZE_CHART,
  HOW_TO_MEASURE_GUIDE,
  PRODUCT_FEATURES,
  MODEL_FIT_REFERENCE,
} from './factoryPresets'

interface UniformFitGuideModalProps {
  isOpen: boolean
  onClose: () => void
  initialSize?: string
  outfitName?: string
}

export const UniformFitGuideModal: React.FC<UniformFitGuideModalProps> = ({
  isOpen,
  onClose,
  initialSize = 'M',
  outfitName = 'Elite Worker High-Vis Shirt & Trouser Set',
}) => {
  const [selectedSize, setSelectedSize] = useState<string>(initialSize)
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches')

  if (!isOpen) return null

  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield':
        return <ShieldCheck className="h-5 w-5 text-emerald-600" />
      case 'eye':
        return <Eye className="h-5 w-5 text-[#FF8B45]" />
      case 'layers':
        return <Layers className="h-5 w-5 text-[#075E54]" />
      case 'wind':
        return <Wind className="h-5 w-5 text-sky-600" />
      case 'cloud-rain':
        return <CloudRain className="h-5 w-5 text-indigo-600" />
      default:
        return <Sparkles className="h-5 w-5 text-[#075E54]" />
    }
  }

  const activeRow = WORKER_SIZE_CHART.find((r) => r.size === selectedSize) || WORKER_SIZE_CHART[1]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#E5EAE4] shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden">
        {/* Top Header Banner matching Reference Image */}
        <div className="bg-[#183B36] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#075E54]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#FF8B45] text-white">
                ELITE // WORKERWEAR
              </span>
              <span className="text-xs font-semibold text-[#BDE0D9]">
                Official Organization Safety Standard
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-sans">
              Worker Shirt &amp; Trouser Size &amp; Fit Guide
            </h2>
            <p className="text-xs text-[#E6F3F1] mt-0.5">
              Comprehensive factory sizing matrix, model measurements, and anatomical fit guidelines &bull; {outfitName}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-8 space-y-8 flex-1 bg-[#FBFDFB]">
          {/* Main Grid: Left Model View & Details | Right Size Chart & Measurement Guide */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (5 Cols): Model Photography & Model Specs */}
            <div className="lg:col-span-5 space-y-6">
              {/* Model Details Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#E5EAE4] card-soft-shadow">
                <div className="flex items-center justify-between border-b border-[#E5EAE4] pb-2.5 mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#183B36] flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-[#075E54]" />
                    Model Details
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#075E54]/10 text-[#075E54]">
                    Size {MODEL_FIT_REFERENCE.shirtSize} Sample
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#78847F] text-[11px] block">Model Name</span>
                    <strong className="text-[#183B36] font-bold">{MODEL_FIT_REFERENCE.name}</strong>
                  </div>
                  <div>
                    <span className="text-[#78847F] text-[11px] block">Gender</span>
                    <strong className="text-[#183B36] font-bold">{MODEL_FIT_REFERENCE.gender}</strong>
                  </div>
                  <div>
                    <span className="text-[#78847F] text-[11px] block">Height</span>
                    <strong className="text-[#183B36] font-bold">{MODEL_FIT_REFERENCE.height}</strong>
                  </div>
                  <div>
                    <span className="text-[#78847F] text-[11px] block">Weight</span>
                    <strong className="text-[#183B36] font-bold">{MODEL_FIT_REFERENCE.weight}</strong>
                  </div>
                  <div>
                    <span className="text-[#78847F] text-[11px] block">Body Type</span>
                    <strong className="text-[#183B36] font-bold">{MODEL_FIT_REFERENCE.bodyType}</strong>
                  </div>
                  <div>
                    <span className="text-[#78847F] text-[11px] block">Shirt &amp; Trouser</span>
                    <strong className="text-[#075E54] font-bold">
                      Shirt: {MODEL_FIT_REFERENCE.shirtSize} | Trouser: {MODEL_FIT_REFERENCE.trouserSize}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Real Uniform Image with Front & Back Views */}
              <div className="rounded-3xl border border-[#E5EAE4] overflow-hidden bg-white shadow-sm">
                <div className="relative group">
                  <img
                    src="/uniforms/worker-fit-guide.jpg"
                    alt="Worker High-Vis Uniform Fit Guide"
                    className="w-full h-auto object-contain max-h-[440px] mx-auto bg-white"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-xs text-white p-2.5 rounded-xl text-center text-xs font-bold flex items-center justify-around">
                    <span className="flex items-center gap-1 text-[#E6F3F1]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Front View
                    </span>
                    <span className="text-gray-400">|</span>
                    <span className="flex items-center gap-1 text-[#E6F3F1]">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span> Back View
                    </span>
                  </div>
                </div>
              </div>

              {/* Model Fit Reference Checklist */}
              <div className="p-4 rounded-2xl bg-[#E6F3F1]/60 border border-[#BDE0D9] space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#075E54] flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#075E54]" />
                  Model Fit Reference
                </h4>
                <ul className="space-y-1.5 text-xs text-[#183B36]">
                  {MODEL_FIT_REFERENCE.fitNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#FF8B45] font-bold mt-0.5">&bull;</span>
                      <span className="leading-relaxed">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column (7 Cols): Size Chart & How to Measure Guide */}
            <div className="lg:col-span-7 space-y-6">
              {/* Interactive Size Chart Table */}
              <div className="bg-white rounded-2xl border border-[#E5EAE4] p-5 card-soft-shadow space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5EAE4] pb-3">
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-[#075E54]" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#183B36]">
                      Worker Size Chart ({unit === 'inches' ? 'Inches' : 'Centimeters'})
                    </h3>
                  </div>

                  {/* Unit Toggle: Inches vs CM */}
                  <div className="inline-flex items-center p-0.5 rounded-xl bg-[#F5F7F1] border border-[#E5EAE4] self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setUnit('inches')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        unit === 'inches'
                          ? 'bg-[#075E54] text-white shadow-xs'
                          : 'text-[#78847F] hover:text-[#183B36]'
                      }`}
                    >
                      Inches (&quot;)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit('cm')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        unit === 'cm'
                          ? 'bg-[#075E54] text-white shadow-xs'
                          : 'text-[#78847F] hover:text-[#183B36]'
                      }`}
                    >
                      Centimeters (cm)
                    </button>
                  </div>
                </div>

                {/* Sizing Table */}
                <div className="overflow-x-auto rounded-xl border border-[#E5EAE4]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#183B36] text-white text-[11px] font-black uppercase tracking-wider">
                        <th className="py-3 px-3 text-center border-r border-[#075E54]">Size</th>
                        <th className="py-3 px-3 text-center border-r border-[#075E54]">Chest (A)</th>
                        <th className="py-3 px-3 text-center border-r border-[#075E54]">Waist (B)</th>
                        <th className="py-3 px-3 text-center border-r border-[#075E54]">Hip (C)</th>
                        <th className="py-3 px-3 text-center">Inseam (D)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EAE4] font-medium text-[#183B36]">
                      {WORKER_SIZE_CHART.map((row) => {
                        const isSelected = row.size === selectedSize
                        return (
                          <tr
                            key={row.size}
                            onClick={() => setSelectedSize(row.size)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-emerald-100/70 font-bold text-[#075E54]'
                                : 'hover:bg-[#F5F7F1]'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center font-extrabold border-r border-[#E5EAE4]">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-md ${
                                  isSelected
                                    ? 'bg-[#075E54] text-white'
                                    : 'bg-gray-100 text-[#183B36]'
                                }`}
                              >
                                {row.size}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-[#E5EAE4]">
                              {unit === 'inches' ? `${row.chest}"` : `${row.chestCm} cm`}
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-[#E5EAE4]">
                              {unit === 'inches' ? `${row.waist}"` : `${row.waistCm} cm`}
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-[#E5EAE4]">
                              {unit === 'inches' ? `${row.hip}"` : `${row.hipCm} cm`}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {unit === 'inches' ? `${row.inseam}"` : `${row.inseamCm} cm`}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Selected Size Highlight Card */}
                <div className="p-3.5 rounded-xl bg-[#F5F7F1] border border-[#CBD5C8] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#183B36]">Selected Size:</span>
                    <span className="px-2.5 py-0.5 rounded bg-[#075E54] text-white font-extrabold">
                      Size {selectedSize}
                    </span>
                  </div>
                  <div className="text-[#5A6B65]">
                    Chest: <strong>{unit === 'inches' ? `${activeRow.chest}"` : `${activeRow.chestCm} cm`}</strong> &bull;{' '}
                    Waist: <strong>{unit === 'inches' ? `${activeRow.waist}"` : `${activeRow.waistCm} cm`}</strong> &bull;{' '}
                    Hip: <strong>{unit === 'inches' ? `${activeRow.hip}"` : `${activeRow.hipCm} cm`}</strong> &bull;{' '}
                    Inseam: <strong>{unit === 'inches' ? `${activeRow.inseam}"` : `${activeRow.inseamCm} cm`}</strong>
                  </div>
                </div>
              </div>

              {/* How to Measure Section */}
              <div className="bg-white rounded-2xl border border-[#E5EAE4] p-5 card-soft-shadow space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E5EAE4] pb-2.5">
                  <Ruler className="h-4 w-4 text-[#FF8B45]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#183B36]">
                    How to Measure Correctly
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {HOW_TO_MEASURE_GUIDE.map((item) => (
                    <div
                      key={item.key}
                      className="p-3 rounded-xl bg-[#FBFDFB] border border-[#E5EAE4] flex items-start gap-3"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#075E54] text-white font-extrabold flex items-center justify-center shrink-0 text-xs">
                        {item.key}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#183B36] block">
                          {item.label} ({item.key})
                        </span>
                        <p className="text-[11px] text-[#78847F] leading-relaxed mt-0.5">
                          {item.instruction}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Features Badges */}
              <div className="bg-white rounded-2xl border border-[#E5EAE4] p-5 card-soft-shadow space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#183B36] border-b border-[#E5EAE4] pb-2.5">
                  Factory Uniform Safety &amp; Durability Features
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PRODUCT_FEATURES.map((feat) => (
                    <div
                      key={feat.id}
                      className="p-3 rounded-xl bg-[#F5F7F1]/60 border border-[#E5EAE4] flex flex-col items-center text-center space-y-1.5"
                    >
                      <div className="p-2 rounded-xl bg-white shadow-xs border border-[#E5EAE4]">
                        {getFeatureIcon(feat.icon)}
                      </div>
                      <span className="text-xs font-bold text-[#183B36]">{feat.title}</span>
                      <span className="text-[10px] text-[#78847F] leading-tight">
                        {feat.shortDesc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E5EAE4] bg-[#FBFDFB] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#78847F] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Standard Industrial Fit Reference &bull; Applicable across all factory operations branches</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#075E54] hover:bg-[#064E46] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close Sizing Guide
          </button>
        </div>
      </div>
    </div>
  )
}
