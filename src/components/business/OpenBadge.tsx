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
  const classes = large
    ? (isOpen ? 'bg-green-500 text-white text-base px-4 py-1' : 'bg-red-500 text-white text-base px-4 py-1')
    : (isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white')

  return (
    <Badge className={classes}>
      {large ? (isOpen ? '● Abierto ahora' : '● Cerrado') : (isOpen ? 'Abierto' : 'Cerrado')}
    </Badge>
  )
}
