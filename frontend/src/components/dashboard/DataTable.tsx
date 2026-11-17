import React, { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  className?: string
}

export interface DataTableProps<T> {
  title?: string
  subtitle?: string
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string | number
  searchPlaceholder?: string
  searchKey?: keyof T
  actions?: React.ReactNode
  pageSize?: number
  className?: string
}

export function DataTable<T extends Record<string, unknown>>({
  title,
  subtitle,
  columns,
  data,
  keyExtractor,
  searchPlaceholder = 'Search records...',
  searchKey,
  actions,
  pageSize = 5,
  className = '',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter data based on search
  const filteredData = data.filter((item) => {
    if (!searchQuery.trim() || !searchKey) return true
    const val = item[searchKey]
    if (val === undefined || val === null) return false
    return String(val).toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize)

  return (
    <div
      className={`bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden ${className}`}
    >
      {/* Header & Search Bar */}
      {(title || searchKey || actions) && (
        <div className="p-4 sm:p-6 border-b border-[#E5EAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-base font-bold text-[#183B36] tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#78847F] mt-0.5">{subtitle}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {searchKey && (
              <div className="relative min-w-[220px]">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78847F]" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full bg-[#F5F7F1] text-xs text-[#183B36] placeholder-[#78847F] pl-9 pr-4 py-2 rounded-full border border-[#CBD5C8] focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54]"
                />
              </div>
            )}
            {actions}
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E5EAE4] bg-[#FBFDFB]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#78847F] ${
                    col.className || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5EAE4]">
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="hover:bg-[#F5F7F1]/60 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-4 text-xs text-[#183B36] ${
                        col.className || ''
                      }`}
                    >
                      {col.render
                        ? col.render(item)
                        : (item[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-[#78847F]"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Inbox className="h-8 w-8 text-[#A0ACA7] mb-2" />
                    <span className="text-xs font-semibold">
                      No matching records found.
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-3.5 border-t border-[#E5EAE4] bg-[#FBFDFB] flex items-center justify-between text-xs text-[#78847F]">
          <span>
            Showing {startIndex + 1} to{' '}
            {Math.min(startIndex + pageSize, filteredData.length)} of{' '}
            {filteredData.length} records
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#CBD5C8] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-semibold text-[#183B36]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#CBD5C8] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
