import { getAllBusinesses } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ToggleBusinessButton from '@/components/admin/ToggleBusinessButton'
import ApprovalButtons from '@/components/admin/ApprovalButtons'
import { format } from 'date-fns'
import type { BusinessWithOwner } from '@/types'

// Peso de orden: los pendientes de revisión primero, luego rechazados y por
// último los aprobados (a igualdad, el más reciente arriba).
const STATUS_WEIGHT: Record<BusinessWithOwner['status'], number> = {
  pending: 0,
  rejected: 1,
  approved: 2,
}

const STATUS_BADGE: Record<
  BusinessWithOwner['status'],
  { label: string; className: string }
> = {
  pending: { label: 'En revisión', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Aprobado', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rechazado', className: 'bg-red-100 text-red-800' },
}

export const dynamic = 'force-dynamic'

export default async function AdminNegociosPage() {
  const result = await getAllBusinesses()

  if ('error' in result) {
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
        Error al cargar negocios: {result.error}
      </div>
    )
  }

  const businesses = [...(result as BusinessWithOwner[])].sort((a, b) => {
    const weightDiff = STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status]
    if (weightDiff !== 0) return weightDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Negocios{' '}
        <span className="text-gray-400 text-lg font-normal">({businesses.length})</span>
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todos los negocios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Propietario</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Aprobación</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Verificación</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Registro</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {businesses.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      No hay negocios registrados.
                    </td>
                  </tr>
                )}
                {businesses.map((biz) => {
                  const ownerLabel = biz.profiles?.full_name
                    ? biz.profiles.full_name
                    : biz.owner_id
                      ? `${biz.owner_id.substring(0, 8)}...`
                      : 'Sin dueño (demo)'

                  const category =
                    biz.categories as { name?: string } | undefined

                  return (
                    <tr key={biz.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{biz.name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {category?.name ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{ownerLabel}</td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_BADGE[biz.status].className}>
                          {STATUS_BADGE[biz.status].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {biz.is_active ? (
                          <Badge className="bg-green-100 text-green-800">Activo</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Inactivo</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {biz.is_verified ? (
                          <Badge className="bg-blue-100 text-blue-800">Verificado</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {format(new Date(biz.created_at), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <ApprovalButtons
                            businessId={biz.id}
                            status={biz.status}
                            rejectionReason={biz.rejection_reason}
                          />
                          <ToggleBusinessButton
                            businessId={biz.id}
                            field="active"
                            currentValue={biz.is_active}
                          />
                          <ToggleBusinessButton
                            businessId={biz.id}
                            field="verified"
                            currentValue={biz.is_verified}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
