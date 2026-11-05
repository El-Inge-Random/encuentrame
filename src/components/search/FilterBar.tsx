'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Clock, MapPin, X } from 'lucide-react'
import type { Category } from '@/types'
import { useCityCombobox } from './useCityCombobox'

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

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    // Al navegar por categoría, se limpia el término de texto: las categorías
    // son para explorar, la barra de texto para buscar. Combinarlos solía dar
    // 0 resultados confusos (p.ej. "Barbería" + categoría "Entretenimiento").
    if (key === 'categoria') params.delete('q')
    router.push(`/buscar?${params.toString()}`)
  }

  const {
    query: cityInput,
    setQuery: setCityInput,
    open,
    setOpen,
    activeIndex,
    setActiveIndex,
    suggestions,
    wrapperRef,
    select,
    onKeyDown,
  } = useCityCombobox<string>({
    items: cities,
    getLabel: (c) => c,
    onSelect: (city) => {
      updateFilter('ciudad', city)
      setCityInput('')
    },
  })

  const listboxId = 'filterbar-city-listbox'

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
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              open && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            value={cityInput}
            onChange={(e) => { setCityInput(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Buscar ciudad"
            aria-label="Buscar por ciudad"
            className="bg-transparent outline-none text-sm text-gray-700 w-32 placeholder:text-gray-400"
          />
        </div>
        {open && suggestions.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Ciudades"
            className="absolute z-10 mt-1 w-56 rounded-lg bg-white border shadow-lg max-h-60 overflow-auto"
          >
            {suggestions.map((city, i) => (
              <li key={city} role="none">
                <button
                  type="button"
                  id={`${listboxId}-option-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onClick={() => select(city)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full text-left px-3 py-2 text-sm text-gray-700 ${
                    i === activeIndex ? 'bg-purple-50' : 'hover:bg-gray-100'
                  }`}
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
