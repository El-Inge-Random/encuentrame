'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Clock, MapPin, X } from 'lucide-react'
import type { Category } from '@/types'

interface FilterBarProps {
  categories: Category[]
  selectedCategory?: string
  openNow?: boolean
  cities: string[]
  selectedCity?: string
}

export default function FilterBar({ categories, selectedCategory, openNow, cities, selectedCity }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cityInput, setCityInput] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/buscar?${params.toString()}`)
  }

  const normalize = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const suggestions = cityInput.trim()
    ? cities.filter((c) => normalize(c).includes(normalize(cityInput.trim())))
    : []

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

      <div className="relative" ref={wrapperRef}>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-gray-100">
          <MapPin className="w-3 h-3 text-gray-500" />
          <input
            type="text"
            value={cityInput}
            onChange={(e) => { setCityInput(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar ciudad"
            className="bg-transparent outline-none text-sm text-gray-700 w-32 placeholder:text-gray-400"
          />
        </div>
        {open && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-56 rounded-lg bg-white border shadow-lg max-h-60 overflow-auto">
            {suggestions.map((city) => (
              <li key={city}>
                <button
                  type="button"
                  onClick={() => { updateFilter('ciudad', city); setCityInput(''); setOpen(false) }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {city}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedCity && (
        <button
          onClick={() => updateFilter('ciudad', null)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-700 text-white"
        >
          <MapPin className="w-3 h-3" /> Ciudad: {selectedCity} <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
