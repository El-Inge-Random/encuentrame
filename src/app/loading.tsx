import { Skeleton, BusinessGridSkeleton } from '@/components/ui/skeleton'

export default function LandingLoading() {
  return (
    <div>
      {/* Hero (fondo gris neutro, sin color de marca) */}
      <section className="bg-slate-100 pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-80 mx-auto mb-8 mt-4" />
          <Skeleton className="h-14 w-full max-w-3xl mx-auto rounded-full" />
        </div>
      </section>

      {/* Categorías */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm"
            >
              <Skeleton className="w-14 h-14 rounded-xl" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </section>

      {/* ¿Qué es Encuentrame? (mismo bloque que AboutSection) */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <Skeleton className="h-8 w-72 mx-auto mb-6" />
          <Skeleton className="h-4 w-full max-w-2xl mx-auto" />
        </div>
      </section>

      {/* Negocios recientes */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-24" />
        </div>
        <BusinessGridSkeleton count={6} />
      </section>
    </div>
  )
}
