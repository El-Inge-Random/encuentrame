import { Skeleton, BusinessGridSkeleton } from '@/components/ui/skeleton'

export default function BuscarLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header con título + barra de búsqueda placeholder */}
      <div className="bg-white border-b px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="flex gap-2 w-full max-w-md">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Contenido: pills de filtros + grid de negocios */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <BusinessGridSkeleton count={6} />
      </div>
    </div>
  )
}
