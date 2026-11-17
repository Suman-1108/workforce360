import React, { useState, useEffect } from 'react'
import {
  Shirt,
  Plus,
  Loader2,
  Sparkles,
  ClipboardList,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import { Button, Badge, Avatar } from '../../components/common'
import { uniformsApi } from '../../services/api'
import {
  UniformOutfitGrid,
  UniformDetailsModal,
  UniformFormModal,
  UniformAssignmentModal,
} from '../../components/uniforms'
import type { UniformOutfit } from '../../components/uniforms'

export const UniformsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'assignments' | 'replacements'>('catalog')
  const [outfits, setOutfits] = useState<UniformOutfit[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Details Modal
  const [selectedOutfit, setSelectedOutfit] = useState<UniformOutfit | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  // Form Modal (Create / Edit)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [outfitToEdit, setOutfitToEdit] = useState<UniformOutfit | null>(null)

  // Assignment Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [outfitToAssign, setOutfitToAssign] = useState<UniformOutfit | null>(null)
  const [selectedItemsForAssign, setSelectedItemsForAssign] = useState<any[] | undefined>()

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [itemsRes, distsRes] = await Promise.all([
        uniformsApi.listItems(),
        uniformsApi.listDistributions(),
      ])

      const rawItems = itemsRes?.items || (Array.isArray(itemsRes) ? itemsRes : [])
      setOutfits(
        rawItems
          .filter((it: any) => !it.is_archived)
          .map((it: any) => ({
            id: it.id,
            name: it.name,
            code: it.code || `UNIF-${it.id}`,
            category: it.category || 'Corporate & Executive',
            gender_group: it.gender_group || 'Unisex',
            model_image_url:
              it.model_image_url ||
              'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
            description: it.description,
            colors: it.colors || 'Deep Teal & Khaki',
            sizes_available: it.sizes_available || 'S, M, L, XL, 2XL',
            total_stock: it.total_stock ?? 100,
            distributed_stock: it.distributed_stock ?? 0,
            available_stock:
              it.available_stock ?? Math.max(0, (it.total_stock ?? 100) - (it.distributed_stock ?? 0)),
            is_active: it.is_active ?? true,
            is_archived: it.is_archived ?? false,
            items_breakdown: it.items_breakdown,
          }))
      )

      const rawDists = distsRes?.items || (Array.isArray(distsRes) ? distsRes : [])
      setAssignments(rawDists)
    } catch (err) {
      console.error('Failed to load uniform catalogue:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleViewDetails = (outfit: UniformOutfit) => {
    setSelectedOutfit(outfit)
    setDetailsModalOpen(true)
  }

  const handleOpenAssign = (outfit: UniformOutfit, selectedItems?: any[]) => {
    setOutfitToAssign(outfit)
    setSelectedItemsForAssign(selectedItems)
    setAssignModalOpen(true)
  }

  const handleOpenCreate = () => {
    setOutfitToEdit(null)
    setFormModalOpen(true)
  }

  const handleOpenEdit = (outfit: UniformOutfit) => {
    setOutfitToEdit(outfit)
    setFormModalOpen(true)
  }

  const handleSaveOutfit = async (payload: any) => {
    if (outfitToEdit) {
      await uniformsApi.updateItem(outfitToEdit.id, payload)
      showToast(`Updated uniform outfit: ${payload.name}`)
    } else {
      await uniformsApi.addItem(payload)
      showToast(`Created new uniform ensemble: ${payload.name}`)
    }
    fetchData()
  }

  const handleArchiveOutfit = async (outfit: UniformOutfit) => {
    if (confirm(`Are you sure you want to archive '${outfit.name}'?`)) {
      try {
        await uniformsApi.updateItem(outfit.id, { is_archived: true, is_active: false })
        showToast(`Archived uniform: ${outfit.name}`)
        fetchData()
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to archive uniform.')
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183B36] tracking-tight">
              Uniform & Outfit Catalogue
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#075E54]/10 text-[#075E54] border border-[#075E54]/20 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#FF8B45]" />
              Haute Visual Catalogue
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#78847F]">
            Curated organization uniform ensembles, individual clothing component breakdowns, and real-time inventory tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {toastMsg && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold shadow-xs animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{toastMsg}</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            className="text-xs font-semibold border-[#E5EAE4] hover:bg-[#F5F7F1] cursor-pointer"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            className="bg-[#075E54] hover:bg-[#075E54]/90 text-white cursor-pointer px-4"
          >
            Create New Outfit
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E5EAE4] bg-white rounded-3xl p-1.5 border card-soft-shadow">
        {[
          {
            id: 'catalog',
            label: 'Visual Outfit Catalogue',
            icon: <Shirt className="h-4 w-4" />,
            badge: outfits.length,
          },
          {
            id: 'assignments',
            label: 'Staff Allocation Ledger',
            icon: <ClipboardList className="h-4 w-4" />,
            badge: assignments.length,
          },
          {
            id: 'replacements',
            label: 'Size Swaps & Replacements',
            icon: <RefreshCw className="h-4 w-4" />,
            badge: '1 Pending',
          },
        ].map((tab) => {
          const isSelected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2
                ${
                  isSelected
                    ? 'bg-[#075E54] text-white shadow-xs'
                    : 'text-[#78847F] hover:text-[#183B36] hover:bg-[#F5F7F1]'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#F5F7F1] text-[#183B36]'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="min-h-[350px] flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-[#E5EAE4] p-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#075E54]" />
          <span className="text-xs font-semibold text-[#78847F]">
            Loading visual outfit catalogue and component breakdowns...
          </span>
        </div>
      ) : (
        <>
          {/* TAB 1: Visual Outfit Catalogue */}
          {activeTab === 'catalog' && (
            <UniformOutfitGrid
              outfits={outfits}
              onViewDetails={handleViewDetails}
              onAssign={handleOpenAssign}
              onEdit={handleOpenEdit}
              onArchive={handleArchiveOutfit}
              onAddNew={handleOpenCreate}
            />
          )}

          {/* TAB 2: Staff Gear Ledger */}
          {activeTab === 'assignments' && (
            <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden animate-in fade-in duration-150">
              <div className="p-5 border-b border-[#E5EAE4] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#183B36]">
                    Personnel Equipment & Uniform Ledger
                  </h3>
                  <p className="text-xs text-[#78847F]">
                    Audit trail of all uniform components and gear currently issued to active personnel.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#075E54]/10 text-[#075E54]">
                  {assignments.length} Total Distributions
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5EAE4] bg-[#FBFDFB]">
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                      Employee
                    </th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                      Uniform / Outfit Issued
                    </th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                      Size Allocation
                    </th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                      Units Issued
                    </th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                      Issued Date
                    </th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[#78847F]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAE4]">
                  {assignments.map((item: any) => (
                    <tr key={item.id} className="hover:bg-[#F5F7F1]/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={item.employee_name || 'Staff Member'} size="xs" />
                          <div>
                            <span className="font-bold text-[#183B36] block">
                              {item.employee_name || 'Staff Member'}
                            </span>
                            <span className="text-[10px] text-[#78847F]">
                              {item.employee_id_number || `EMP-${item.employee_id}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#183B36]">
                        {item.uniform_item_name || item.uniform_name || 'Workforce Apparel'}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[#075E54]">
                        {item.size || 'Standard'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#183B36]">
                        {item.quantity || 1} set
                      </td>
                      <td className="px-6 py-4 text-[#78847F]">
                        {String(item.issued_date || '').slice(0, 10)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={item.status === 'Issued' ? 'success' : 'neutral'}>
                          {item.status || 'Issued'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Replacement Requests */}
          {activeTab === 'replacements' && (
            <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow animate-in fade-in duration-150 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#183B36]">
                  Size Swap & Wear-and-Tear Replacement Requests
                </h3>
                <p className="text-xs text-[#78847F]">
                  Requests initiated by employees or branch managers for replacement uniform items.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFF0E6] border border-[#FFD4BA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-[#183B36]">
                      David Kim (EMP-0102)
                    </span>
                    <Badge variant="accent" size="sm">
                      Size Swap Request
                    </Badge>
                  </div>
                  <p className="text-xs text-[#78847F]">
                    ANSI Steel-Toe Safety Boots: Requested swap from US 9.5 to US 10.0 due to arch width comfort.
                  </p>
                  <span className="text-[10px] text-[#78847F] block mt-1">
                    Submitted 2 days ago &bull; Tech Park HQ Facility &bull; Operational Status: Pending Review
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      alert('Replacement Approved and Dispatched to Branch Facility.')
                      showToast('Replacement Approved and Dispatched.')
                    }}
                    className="bg-[#075E54] text-white hover:bg-[#075E54]/90 cursor-pointer"
                  >
                    Approve & Dispatch
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Outfit Details Modal */}
      <UniformDetailsModal
        outfit={selectedOutfit}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onAssign={handleOpenAssign}
        onEdit={handleOpenEdit}
        distributions={assignments}
      />

      {/* Outfit Creation & Editing Form Modal */}
      <UniformFormModal
        isOpen={formModalOpen}
        outfitToEdit={outfitToEdit}
        onClose={() => setFormModalOpen(false)}
        onSaved={handleSaveOutfit}
      />

      {/* Uniform Assignment Modal (Single, Bulk, Dept, Branch) */}
      <UniformAssignmentModal
        isOpen={assignModalOpen}
        outfit={outfitToAssign}
        selectedItems={selectedItemsForAssign}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={() => {
          showToast('Uniform assigned successfully.')
          fetchData()
        }}
      />
    </div>
  )
}

export default UniformsPage
