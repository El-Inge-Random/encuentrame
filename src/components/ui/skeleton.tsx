'use client'

import * as React from 'react'
import { cn } from 'cn'

/**
 * Bloque base para skeletons de carga: un <div> gris con `animate-pulse`.
 * Acepta `className` para dimensionar / redondear (igual que `input.tsx`).
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse bg-slate-200 rounded-md', className)}
      {...props}
    />
  )
}

/**
 * Skeleton con la misma forma que `BusinessCard` (imagen h-44, título,
 * categoría y dirección), en gris animado y sin Link (no es clicable).
 */
export function BusinessCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2 mt-2" />
        <Skeleton className="h-3 w-2/3 mt-3" />
      </div>
    </div>
  )
}

/**
 * Grid idéntico al de `BusinessGrid` con N (default 6) `BusinessCardSkeleton`.
 */
export function BusinessGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <BusinessCardSkeleton key={i} />
      ))}
    </div>
  )
}

export { Skeleton }
