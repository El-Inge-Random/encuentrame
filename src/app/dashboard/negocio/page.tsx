import { getOwnerBusiness, getCategories } from '@/app/actions/business'
import BusinessForm from '@/components/business/BusinessForm'
import BusinessGallery from '@/components/business/BusinessGallery'
import ResubmitButton from '@/components/business/ResubmitButton'
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
  // El dueño puede editar cuando está aprobado o rechazado; 'pending' es solo lectura.
  const canEdit = isApproved || isRejected

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
          <p>
            Tu negocio fue rechazado.
            {business?.rejection_reason ? ` Motivo: ${business.rejection_reason}.` : ''} Corrige
            los datos y vuelve a solicitar la aprobación.
          </p>
          <div className="mt-3">
            <ResubmitButton />
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <BusinessForm
          business={business}
          categories={categories as Category[]}
          readOnly={business ? !canEdit : false}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fotos del negocio</h2>
        {!business ? (
          <p className="text-sm text-gray-500">Guarda tu negocio para poder agregar fotos.</p>
        ) : canEdit ? (
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
