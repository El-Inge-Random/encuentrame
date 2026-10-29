'use client'

import { useMemo } from 'react'
import { isBusinessOpen } from '@/lib/utils/business'
import BusinessGrid from './BusinessGrid'
import type { Business } from '@/types'

interface BusinessGridClientProps {
  businesses: Business[]
  filterOpen?: boolean
}

export default function BusinessGridClient({ businesses, filterOpen = false }: BusinessGridClientProps) {
  const filtered = useMemo(() => {
    if (!filterOpen) return businesses
    return businesses.filter(b => b.business_hours ? isBusinessOpen(b.business_hours) : false)
  }, [businesses, filterOpen])

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">
        {filtered.length} negocio{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </p>
      <BusinessGrid businesses={filtered} />
    </div>
  )
}
