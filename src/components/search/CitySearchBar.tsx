'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface CitySearchBarProps {
  cities: string[]
  large?: boolean
}

export default function CitySearchBar({ cities, large = false }: CitySearchBarProps) {
  const router = useRouter()
  const [cityInput, setCityInput] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const normalize = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const suggestions = cityInput.trim()
    ? cities.filter((c) => normalize(c).includes(normalize(cityInput.trim())))
    : []

  const selectCity = (city: string) => {
    router.push(`/buscar?ciudad=${encodeURIComponent(city)}`)
    setCityInput('')
    setOpen(false)
  }

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
    <div className="relative w-full max-w-2xl" ref={wrapperRef}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          type="text"
          value={cityInput}
          onChange={(e) => { setCityInput(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && suggestions.length > 0) selectCity(suggestions[0])
          }}
          placeholder="Buscar por ciudad..."
          className={`pl-10 ${large ? 'h-12 text-base' : ''}`}
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg bg-white border shadow-lg max-h-60 overflow-auto">
          {suggestions.map((city) => (
            <li key={city}>
              <button
                type="button"
                onClick={() => selectCity(city)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
