import { Skeleton, BusinessGridSkeleton } from '@/components/ui/skeleton'

export default function LandingLoading() {
  return (
    <div>
      {/* Hero (fondo de marca tenue: bg-brand/10 evita el flash gris→azul al resolver) */}
      <section className="bg-brand/10 pt-24 pb-20 px-4">
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

      {/* ¿Qué es Encuentrame? — mismo bloque y altura que AboutSection
          (encabezado + párrafo, 3 pasos en cuadrícula y tarjeta CTA)
          para que "Negocios recientes" no salte al resolver la página */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-16">
          {/* Encabezado + párrafo centrado (mb-12, igual que el real) */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            <Skeleton className="h-8 w-72 mx-auto mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5 mx-auto" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
          </div>

          {/* 3 pasos en cuadrícula (grid-cols-1 md:grid-cols-3 gap-8 como el real) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="w-14 h-14 rounded-2xl mx-auto mb-4" />
                <Skeleton className="h-5 w-28 mx-auto mb-2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6 mx-auto" />
                  <Skeleton className="h-4 w-2/3 mx-auto" />
                </div>
              </div>
            ))}
          </div>

          {/* Tarjeta CTA (mt-12 + p-8; en gris, sin color de marca — la real es bg-brand) */}
          <div className="mt-12 rounded-2xl bg-slate-100 p-8 text-center">
            <Skeleton className="h-7 w-72 mx-auto mb-2" />
            <Skeleton className="h-4 w-80 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto mb-6" />
            <Skeleton className="h-10 w-48 mx-auto rounded-lg" />
          </div>
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
