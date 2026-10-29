import Link from 'next/link'
import { getOwnerBusiness } from '@/app/actions/business'
import { Button } from '@/components/ui/button'
import { Store, Clock, Eye } from 'lucide-react'
import OpenBadge from '@/components/business/OpenBadge'

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
          <Button className="bg-purple-700 hover:bg-purple-800">Registrar mi negocio</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Resumen</h1>
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{business.name}</h2>
            {business.categories && <p className="text-orange-500 text-sm">{business.categories.name}</p>}
            {business.address && <p className="text-gray-500 text-sm mt-1">{business.address}</p>}
          </div>
          {business.business_hours && <OpenBadge hours={business.business_hours} />}
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link href="/dashboard/negocio"><Button variant="outline" className="gap-2"><Store className="w-4 h-4" /> Editar negocio</Button></Link>
          <Link href="/dashboard/horarios"><Button variant="outline" className="gap-2"><Clock className="w-4 h-4" /> Editar horarios</Button></Link>
          <Link href={`/negocio/${business.slug}`} target="_blank"><Button variant="ghost" className="gap-2"><Eye className="w-4 h-4" /> Ver perfil público</Button></Link>
        </div>
      </div>
    </div>
  )
}
