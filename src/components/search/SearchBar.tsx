'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SearchBarProps {
  initialValue?: string
  large?: boolean
}

export default function SearchBar({ initialValue = '', large = false }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const router = useRouter()

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(query)}`)
    } else {
      router.push('/buscar')
    }
  }

  return (
    <div className={`flex gap-2 w-full ${large ? 'max-w-2xl' : 'max-w-md'}`}>
      <Input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSearch()}
        placeholder="Busca un negocio, barbería, restaurante..."
        className={large ? 'h-12 text-base' : ''}
      />
      <Button onClick={handleSearch} className={`bg-orange-500 hover:bg-orange-600 ${large ? 'h-12 px-6' : ''}`}>
        <Search className="w-4 h-4" />
      </Button>
    </div>
  )
}
