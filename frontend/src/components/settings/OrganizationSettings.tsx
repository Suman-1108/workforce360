import React, { useState, useEffect } from 'react'
import { Building2, Save, MapPin, Globe, Mail, Image as ImageIcon } from 'lucide-react'
import { Button, Input, PhoneInput } from '../common'
import { organizationApi } from '../../services/api'

interface OrgData {
  name: string
  contact_email: string
  contact_phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  logo_url?: string
}

interface OrganizationSettingsProps {
  initialData: OrgData
  onSave: (data: OrgData) => Promise<void>
  saving: boolean
}

export const OrganizationSettings: React.FC<OrganizationSettingsProps> = ({
  initialData,
  onSave,
  saving,
}) => {
  const [formData, setFormData] = useState<OrgData>(initialData)
  const [branches, setBranches] = useState<any[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)

  useEffect(() => {
    setFormData(initialData)
  }, [initialData])

  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true)
      try {
        const res = await organizationApi.listBranches()
        if (res.data?.items) {
          setBranches(res.data.items)
        } else if (Array.isArray(res.data)) {
          setBranches(res.data)
        }
      } catch (err) {
        console.error('Failed to load branches for settings:', err)
      } finally {
        setLoadingBranches(false)
      }
    }
    fetchBranches()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-[#E5EAE4]">
        <div className="w-10 h-10 rounded-xl bg-[#075E54]/10 flex items-center justify-center text-[#075E54]">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#183B36]">Organization Profile & Branches</h2>
          <p className="text-xs text-[#78847F]">
            Corporate entity identity, registered headquarters location, and physical branch facilities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Organization Legal / Trade Name"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g. Apex Technologies Inc."
        />

        <div>
          <Input
            label="Logo URL (Branding Mark)"
            value={formData.logo_url || ''}
            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            placeholder="https://cdn.example.com/logo.png"
            leftIcon={<ImageIcon className="h-4 w-4 text-[#78847F]" />}
          />
        </div>
      </div>

      {formData.logo_url && (
        <div className="flex items-center gap-3 p-3 bg-[#F5F7F1] rounded-2xl border border-[#E5EAE4]">
          <img
            src={formData.logo_url}
            alt="Logo Preview"
            className="w-12 h-12 rounded-xl object-contain bg-white border border-[#E5EAE4] p-1"
            onError={(e) => {
              ;(e.target as HTMLElement).style.display = 'none'
            }}
          />
          <span className="text-xs text-[#78847F]">Live Header & Navigation Logo Preview</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Corporate Contact Email"
          type="email"
          value={formData.contact_email || ''}
          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          required
          placeholder="contact@company.com"
          leftIcon={<Mail className="h-4 w-4 text-[#78847F]" />}
        />
        <PhoneInput
          label="Corporate Phone"
          value={formData.contact_phone || ''}
          onChange={(val) => setFormData({ ...formData, contact_phone: val })}
          showTypeBadge
        />
      </div>

      <Input
        label="Headquarters Physical Street Address"
        value={formData.address || ''}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        placeholder="e.g. 100 Innovation Boulevard, Tech Park Suite 400"
        leftIcon={<MapPin className="h-4 w-4 text-[#78847F]" />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="City"
          value={formData.city || ''}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          placeholder="e.g. Chicago"
        />
        <Input
          label="State / Province"
          value={formData.state || ''}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          placeholder="e.g. IL"
        />
        <Input
          label="Country"
          value={formData.country || ''}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          placeholder="e.g. United States"
          leftIcon={<Globe className="h-4 w-4 text-[#78847F]" />}
        />
      </div>

      {/* Branch Configuration Section */}
      <div className="pt-4 border-t border-[#E5EAE4] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#183B36]">Registered Physical Branches</h3>
            <p className="text-xs text-[#78847F]">
              Facilities configured with GPS geofence perimeters for attendance punch-ins.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#075E54]/10 text-[#075E54]">
            {branches.length} {branches.length === 1 ? 'Branch' : 'Branches'} Configured
          </span>
        </div>

        {loadingBranches ? (
          <div className="p-4 text-center text-xs text-[#78847F]">Loading facility configurations...</div>
        ) : branches.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] text-xs text-[#78847F]">
            No physical branches configured yet. Navigate to Branch settings to configure GPS locations.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {branches.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#183B36]">{b.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {b.is_active ? 'Operational' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#78847F]">
                  <MapPin className="h-3 w-3 shrink-0 text-[#075E54]" />
                  <span className="truncate">{b.address || `${b.city || ''}, ${b.state || ''}`}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#78847F] pt-1 border-t border-[#E5EAE4]">
                  <span>Geofence: {b.radius_meters}m</span>
                  <span>Code: {b.code || `BR-${b.id}`}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-[#E5EAE4] flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={saving}
          leftIcon={<Save className="h-4 w-4" />}
          className="bg-[#075E54] hover:bg-[#075E54]/90 text-white cursor-pointer px-5 py-2.5"
        >
          {saving ? 'Saving Changes...' : 'Save Organization Settings'}
        </Button>
      </div>
    </form>
  )
}
