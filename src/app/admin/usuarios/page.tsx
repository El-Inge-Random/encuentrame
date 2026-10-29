import { getAllUsers } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ChangeRoleButton from '@/components/admin/ChangeRoleButton'
import { format } from 'date-fns'
import type { Profile } from '@/types'

export const dynamic = 'force-dynamic'

type UserWithBusinesses = Profile & { businesses: { count: number }[] }

export default async function AdminUsuariosPage() {
  const result = await getAllUsers()

  if ('error' in result) {
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
        Error al cargar usuarios: {result.error}
      </div>
    )
  }

  const users = result as UserWithBusinesses[]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Usuarios{' '}
        <span className="text-gray-400 text-lg font-normal">({users.length})</span>
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todos los usuarios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Registro</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Negocios</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                )}
                {users.map((u) => {
                  const businessCount = Array.isArray(u.businesses) && u.businesses.length > 0
                    ? (u.businesses as unknown as { count: number }[])[0].count
                    : 0

                  return (
                    <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {u.full_name ?? <span className="text-gray-400">Sin nombre</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                        {u.id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        {u.role === 'admin' && (
                          <Badge variant="destructive">Admin</Badge>
                        )}
                        {u.role === 'owner' && (
                          <Badge variant="secondary">Propietario</Badge>
                        )}
                        {u.role === 'user' && (
                          <Badge variant="outline">Usuario</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {format(new Date(u.created_at), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-center">
                        {u.role === 'owner' ? businessCount : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {u.role !== 'admin' && (
                          <ChangeRoleButton
                            userId={u.id}
                            currentRole={u.role}
                          />
                        )}
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
