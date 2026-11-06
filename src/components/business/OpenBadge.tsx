'use client'

import { Badge } from '@/components/ui/badge'
import { isBusinessOpen } from '@/lib/utils/business'
import type { BusinessHours } from '@/types'

interface OpenBadgeProps {
  hours: BusinessHours[]
  large?: boolean
}

export default function OpenBadge({ hours, large = false }: OpenBadgeProps) {
  const isOpen = isBusinessOpen(hours)

  const baseClass = large ? 'text-base px-4 py-1' : ''
  // Abierto = verde, Cerrado = gris (no rojo — cerrado no es un error).
  const colorClass = isOpen
    ? 'bg-status-open text-status-open-fg'
    : 'bg-status-closed text-status-closed-fg'

  return (
    <Badge className={`${colorClass} ${baseClass}`}>
      {large
        ? (isOpen ? '● Abierto ahora' : '● Cerrado')
        : (isOpen ? 'Abierto' : 'Cerrado')}
    </Badge>
  )
}
