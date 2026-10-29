import { getCategoriesWithCount } from '@/app/actions/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriasPage() {
  const result = await getCategoriesWithCount()

  if ('error' in result) {
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
        Error al cargar categorías: {result.error}
      </div>
    )
  }

  const categories = result

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Categorías{' '}
        <span className="text-gray-400 text-lg font-normal">({categories.length})</span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 && (
          <p className="text-gray-400 col-span-full">No hay categorías registradas.</p>
        )}
        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color ?? '#6b7280' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{cat.name}</p>
                  <p className="text-xs text-gray-500 truncate">{cat.slug}</p>
                  {cat.icon && (
                    <p className="text-xs text-gray-400 truncate">{cat.icon}</p>
                  )}
                </div>
                <Badge className="bg-purple-100 text-purple-800 flex-shrink-0">
                  {cat.count} negocio{cat.count !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
