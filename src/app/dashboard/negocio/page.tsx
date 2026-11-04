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

  const isApproved = business?.status === 'approved'
  const isPending = business?.status === 'pending'
  const isRejected = business?.status === 'rejected'

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {business ? 'Editar negocio' : 'Registrar negocio'}
      </h1>

      {isPending && (
        <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Tu negocio está en revisión. Te avisaremos cuando sea aprobado. Mientras
          tanto solo puedes ver los datos que registraste.
        </div>
      )}
      {isRejected && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Tu registro fue rechazado. Contáctanos para más información.
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <BusinessForm
          business={business}
          categories={categories as Category[]}
          readOnly={business ? !isApproved : false}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fotos del negocio</h2>
        {!business ? (
          <p className="text-sm text-gray-500">Guarda tu negocio para poder agregar fotos.</p>
        ) : isApproved ? (
          <BusinessGallery businessId={business.id} photos={business.photos ?? []} />
        ) : (
          <p className="text-sm text-gray-500">
            Podrás agregar fotos cuando tu negocio sea aprobado.
          </p>
        )}
      </div>
    </div>
  )
}
