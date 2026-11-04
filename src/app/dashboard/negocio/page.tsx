import { getOwnerBusiness, getCategories } from '@/app/actions/business'
import BusinessForm from '@/components/business/BusinessForm'
import BusinessGallery from '@/components/business/BusinessGallery'
import type { Category } from '@/types'

export const dynamic = 'force-dynamic'

export default async function NegocioPage() {
  const [business, categories] = await Promise.all([
    getOwnerBusiness(),
    getCategories(),
  ])

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {business ? 'Editar negocio' : 'Registrar negocio'}
      </h1>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <BusinessForm business={business} categories={categories as Category[]} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fotos del negocio</h2>
        {business ? (
          <BusinessGallery businessId={business.id} photos={business.photos ?? []} />
        ) : (
          <p className="text-sm text-gray-500">Guarda tu negocio para poder agregar fotos.</p>
        )}
      </div>
    </div>
  )
}
