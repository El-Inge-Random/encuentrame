import { getAdminStats } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Store, ShieldCheck, Users, Clock, CheckCircle } from 'lucide-react'
import type { AdminStats } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const result = await getAdminStats()

  if ('error' in result) {
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
        Error al cargar estadísticas: {result.error}
      </div>
    )
  }

  const stats = result as AdminStats

  const metricCards = [
    {
      title: 'Total Negocios',
      value: stats.totalBusinesses,
      icon: Store,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Negocios Activos',
      value: stats.activeBusinesses,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Negocios Verificados',
      value: stats.verifiedBusinesses,
      icon: ShieldCheck,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Total Usuarios',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Pendientes de Verificación',
      value: stats.pendingVerification,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel de Administración</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {metricCards.map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`${bg} p-2 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 leading-tight">{title}</p>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Businesses per category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Negocios por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.businessesPerCategory.length === 0 ? (
            <p className="text-sm text-gray-500">Sin datos disponibles.</p>
          ) : (
            <ul className="space-y-2">
              {stats.businessesPerCategory.map(({ category, count }) => (
                <li key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{category}</span>
                  <Badge className="bg-purple-100 text-purple-800">{count}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
