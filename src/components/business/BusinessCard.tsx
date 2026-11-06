'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { isBusinessOpen } from '@/lib/utils/business'
import type { Business } from '@/types'

interface BusinessCardProps {
  business: Business
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const open = business.business_hours ? isBusinessOpen(business.business_hours) : false

  return (
    <Link href={`/negocio/${business.slug}`} className="group block">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
        <div className="relative h-44 bg-gray-100">
          {business.cover_image ? (
            <Image src={business.cover_image} alt={business.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">🏪</div>
          )}
          <div className="absolute top-3 right-3">
            <Badge className={open
              ? 'bg-status-open text-status-open-fg'
              : 'bg-status-closed text-status-closed-fg'}>
              {open ? 'Abierto' : 'Cerrado'}
            </Badge>
          </div>
          {business.is_verified && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-status-verified text-status-verified-fg text-xs">✓ Verificado</Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-brand transition-colors">{business.name}</h3>
          {business.categories && (
            <p className="text-xs text-brand-accent font-medium mt-0.5">{business.categories.name}</p>
          )}
          {business.address && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {business.address}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
