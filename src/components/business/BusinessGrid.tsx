import BusinessCard from './BusinessCard'
import type { Business } from '@/types'

interface BusinessGridProps {
  businesses: Business[]
}

export default function BusinessGrid({ businesses }: BusinessGridProps) {
  if (businesses.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-lg font-medium">No se encontraron negocios</p>
        <p className="text-sm mt-1">Intenta con otra búsqueda o categoría</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {businesses.map(biz => <BusinessCard key={biz.id} business={biz} />)}
    </div>
  )
}
