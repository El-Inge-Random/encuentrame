'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Clock } from 'lucide-react'
import type { Category } from '@/types'

interface FilterBarProps {
  categories: Category[]
  selectedCategory?: string
  openNow?: boolean
}

export default function FilterBar({ categories, selectedCategory, openNow }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/buscar?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        onClick={() => updateFilter('categoria', null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          !selectedCategory ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Todos
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => updateFilter('categoria', cat.slug)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === cat.slug ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {cat.name}
        </button>
      ))}
      <button
        onClick={() => updateFilter('abierto', openNow ? null : '1')}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          openNow ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <Clock className="w-3 h-3" /> Abierto ahora
      </button>
    </div>
  )
}
