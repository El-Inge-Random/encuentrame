import Link from 'next/link'
import { getOwnerBusiness } from '@/app/actions/business'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Store, Clock, Eye } from 'lucide-react'
import OpenBadge from '@/components/business/OpenBadge'
import ResubmitButton from '@/components/business/ResubmitButton'

const STATUS_BADGE = {
  pending: { label: 'En revisión', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Aprobado', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rechazado', className: 'bg-red-100 text-red-800' },
} as const

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const business = await getOwnerBusiness()

  if (!business) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Store className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Aún no tienes un negocio registrado</h1>
        <p className="text-gray-500 mb-6">Registra tu negocio para que tus clientes puedan encontrarte.</p>
        <Link href="/dashboard/negocio">
          <Button className="bg-brand hover:bg-brand-hover">Registrar mi negocio</Button>
        </Link>
      </div>
    )
  }

  const isApproved = business.status === 'approved'
  const isRejected = business.status === 'rejected'
  // El dueño puede editar su negocio/horarios cuando está aprobado o rechazado.
  const canEdit = isApproved || isRejected
  const statusBadge = STATUS_BADGE[business.status]

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Resumen</h1>
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold text-gray-900">{business.name}</h2>
              <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
            </div>
            {business.categories && <p className="text-brand-accent text-sm">{business.categories.name}</p>}
            {business.address && <p className="text-gray-500 text-sm mt-1">{business.address}</p>}
          </div>
          {isApproved && business.business_hours && <OpenBadge hours={business.business_hours} />}
        </div>

        {business.status === 'pending' && (
          <p className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
            Tu negocio está en revisión. Te avisaremos cuando sea aprobado. Podrás
            editar tus datos, horarios y fotos una vez aprobado.
          </p>
        )}
        {isRejected && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            <p>
              Tu negocio fue rechazado.
              {business.rejection_reason ? ` Motivo: ${business.rejection_reason}.` : ''} Corrige
              los datos y vuelve a solicitar la aprobación.
            </p>
            <div className="mt-3">
              <ResubmitButton />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-6">
          <Link href="/dashboard/negocio"><Button variant="outline" className="gap-2"><Store className="w-4 h-4" /> {canEdit ? 'Editar negocio' : 'Ver negocio'}</Button></Link>
          {canEdit && (
            <Link href="/dashboard/horarios"><Button variant="outline" className="gap-2"><Clock className="w-4 h-4" /> Editar horarios</Button></Link>
          )}
          {isApproved && (
            <Link href={`/negocio/${business.slug}`} target="_blank"><Button variant="ghost" className="gap-2"><Eye className="w-4 h-4" /> Ver perfil público</Button></Link>
          )}
        </div>
      </div>
    </div>
  )
}
