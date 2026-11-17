import React from 'react'
import { Download } from 'lucide-react'
import { Badge } from '../common'

export interface InvoiceItem {
  id: string
  date: string
  amount: string
  status: string
  method: string
  plan?: string
  download_url?: string
}

export interface InvoiceListProps {
  invoices: InvoiceItem[]
  isLoading?: boolean
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  isLoading = false,
}) => {
  const handleDownload = (id: string) => {
    // Generate sample PDF/CSV invoice download
    const content = `data:text/plain;charset=utf-8,WorkForce 360 Tax Invoice\nInvoice ID: ${id}\nDate: ${new Date().toLocaleDateString()}\nStatus: Paid via Razorpay\nAmount: $79.00 USD\nGSTIN: 27AACCA1234A1Z5\n`
    const link = document.createElement('a')
    link.href = encodeURI(content)
    link.download = `workforce360_invoice_${id}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E5EAE4] card-soft-shadow">
      <div className="flex items-center justify-between pb-3 border-b border-[#E5EAE4] mb-4">
        <div>
          <h3 className="text-base font-bold text-[#183B36]">Billing Invoices & Receipts</h3>
          <p className="text-xs text-[#78847F] mt-0.5">
            Verified tax receipts, transaction IDs, and downloadable statements.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-[#F5F7F1] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : invoices.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5EAE4] text-[#78847F] font-semibold">
                <th className="pb-3">Invoice Number</th>
                <th className="pb-3">Billing Date</th>
                <th className="pb-3">Plan Tier</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAE4]/60">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F5F7F1]/50 transition-colors">
                  <td className="py-3 font-mono font-bold text-[#183B36]">{inv.id}</td>
                  <td className="py-3 text-[#78847F]">{inv.date}</td>
                  <td className="py-3 font-medium text-[#183B36]">{inv.plan || 'Professional Tier'}</td>
                  <td className="py-3 font-bold text-[#183B36]">{inv.amount}</td>
                  <td className="py-3 text-[#78847F]">{inv.method}</td>
                  <td className="py-3">
                    <Badge variant="success" size="sm">
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDownload(inv.id)}
                      className="text-xs font-semibold text-[#075E54] hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-xs text-[#78847F]">
          No previous invoices recorded yet.
        </div>
      )}
    </div>
  )
}

export default InvoiceList
