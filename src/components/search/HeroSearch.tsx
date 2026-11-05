'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin } from 'lucide-react'
import { useCityCombobox } from './useCityCombobox'

interface HeroSearchProps {
  cities: { city: string; count: number }[]
}

const POPULAR = ['Barberías', 'Restaurantes', 'Tiendas', 'Salones de belleza', 'Servicios']

export default function HeroSearch({ cities }: HeroSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

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
  } = useCityCombobox<{ city: string; count: number }>({
    items: cities,
    getLabel: (c) => c.city,
    showAllWhenEmpty: true,
    onSelect: (c) => {
      setSelectedCity(c.city)
      setCityInput(c.city)
    },
  })

  const currentCity = () => selectedCity || cityInput.trim()

  const buildUrl = (q: string) => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    const city = currentCity()
    if (city) params.set('ciudad', city)
    return `/buscar${params.toString() ? `?${params.toString()}` : ''}`
  }

  const handleSearch = () => router.push(buildUrl(query))

  const listboxId = 'hero-city-listbox'

  return (
    <div className="w-full max-w-3xl">
      <div className="relative" ref={wrapperRef}>
        <div className="flex flex-col gap-2 rounded-3xl bg-white p-2 shadow-lg md:flex-row md:items-center md:gap-0 md:rounded-full md:pl-5">
          {/* Qué buscas */}
          <div className="flex min-w-0 flex-1 items-center gap-2 px-3 md:px-0">
            <Search className="h-5 w-5 shrink-0 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="¿Qué buscas? Barbería, restaurante..."
              aria-label="¿Qué buscas?"
              className="w-full bg-transparent text-base text-gray-700 placeholder:text-gray-400 outline-none"
            />
          </div>

          {/* Divisor */}
          <div className="mx-2 hidden h-7 w-px shrink-0 bg-gray-200 md:block" />

          {/* Ciudad */}
          <div className="relative flex w-full shrink-0 items-center gap-2 px-3 md:w-60 md:px-0">
            <MapPin className="h-5 w-5 shrink-0 text-gray-400" />
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
              onChange={(e) => {
                setCityInput(e.target.value)
                setSelectedCity('')
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                // Si no hay opción activa y se presiona Enter, buscar directo.
                if (e.key === 'Enter' && !(open && activeIndex >= 0)) {
                  handleSearch()
                  return
                }
                onKeyDown(e)
              }}
              placeholder="Ciudad"
              aria-label="Ciudad"
              className="w-full bg-transparent text-base text-gray-700 placeholder:text-gray-400 outline-none"
            />
          </div>

          {/* Botón buscar */}
          <button
            type="button"
            onClick={handleSearch}
            className="shrink-0 rounded-full bg-brand-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-accent-hover"
          >
            Buscar
          </button>
        </div>

        {/* Dropdown de ciudades */}
        {open && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Ciudades"
            className="absolute right-0 z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl bg-white text-left shadow-xl md:w-md"
          >
            {suggestions.length > 0 ? (
              suggestions.map(({ city, count }, i) => (
                <li key={city} role="none">
                  <button
                    type="button"
                    id={`${listboxId}-option-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    onClick={() => select({ city, count })}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex w-full items-center justify-between px-5 py-3 text-left transition-colors ${
                      i === activeIndex ? 'bg-purple-50' : 'hover:bg-purple-50'
                    }`}
                  >
                    <span className="font-medium text-gray-800">{city}</span>
                    <span className="text-sm text-gray-400">
                      {count} {count === 1 ? 'negocio' : 'negocios'}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-5 py-3 text-sm text-gray-400">
                No hay negocios en esa ciudad todavía
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Chips de categorías populares */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {POPULAR.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => router.push(buildUrl(label))}
            className="rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/25"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
