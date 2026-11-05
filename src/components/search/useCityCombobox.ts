'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const normalize = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

interface UseCityComboboxOptions<T> {
  items: T[]
  getLabel: (item: T) => string
  /** Si es true, muestra todos los items cuando el input está vacío. */
  showAllWhenEmpty?: boolean
  onSelect: (item: T) => void
}

/**
 * Lógica compartida de un combobox de ciudades accesible:
 * filtrado sin acentos, índice activo, navegación con teclado
 * (flechas, Enter, Escape, Home/End) y cierre al hacer click fuera.
 */
export function useCityCombobox<T>({
  items,
  getLabel,
  showAllWhenEmpty = false,
  onSelect,
}: UseCityComboboxOptions<T>) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => {
    const q = query.trim()
    if (!q) return showAllWhenEmpty ? items : []
    return items.filter((item) => normalize(getLabel(item)).includes(normalize(q)))
  }, [query, items, getLabel, showAllWhenEmpty])

  // Reinicia el índice activo cuando cambian las sugerencias.
  useEffect(() => {
    setActiveIndex(suggestions.length > 0 ? 0 : -1)
  }, [suggestions])

  // Cierra al hacer click fuera.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const select = (item: T) => {
    onSelect(item)
    setOpen(false)
    setActiveIndex(-1)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      if (suggestions.length === 0) return
      setActiveIndex((i) => (i + 1) % suggestions.length)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (suggestions.length === 0) return
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
      return
    }

    if (e.key === 'Home') {
      if (suggestions.length === 0) return
      e.preventDefault()
      setActiveIndex(0)
      return
    }

    if (e.key === 'End') {
      if (suggestions.length === 0) return
      e.preventDefault()
      setActiveIndex(suggestions.length - 1)
      return
    }

    if (e.key === 'Enter') {
      if (open && activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault()
        select(suggestions[activeIndex])
      }
    }
  }

  return {
    query,
    setQuery,
    open,
    setOpen,
    activeIndex,
    setActiveIndex,
    suggestions,
    wrapperRef,
    select,
    onKeyDown,
  }
}
