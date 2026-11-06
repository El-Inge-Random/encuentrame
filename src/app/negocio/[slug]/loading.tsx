import { Skeleton } from '@/components/ui/skeleton'

export default function NegocioLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Portada */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Skeleton className="h-56 md:h-64 w-full rounded-2xl" />
      </div>

      {/* Tarjeta de info */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-40 mt-2" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full mt-4" />
          <Skeleton className="h-4 w-5/6 mt-2" />
          <div className="mt-6 flex flex-wrap gap-3">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-2/3 mt-4" />
        </div>
      </div>
    </div>
  )
}
