import { getBusinesses, getCategories } from '@/app/actions/business'
import SearchBar from '@/components/search/SearchBar'
import FilterBar from '@/components/search/FilterBar'
import BusinessGridClient from '@/components/business/BusinessGridClient'
import type { Business } from '@/types'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

interface SearchPageProps {
  searchParams: Promise<{ q?: string; categoria?: string; abierto?: string }>
}

function FilterBarWrapper({ categories, selectedCategory, openNow }: {
  categories: Awaited<ReturnType<typeof getCategories>>
  selectedCategory?: string
  openNow?: boolean
}) {
  return (
    <Suspense fallback={null}>
      <FilterBar categories={categories} selectedCategory={selectedCategory} openNow={openNow} />
    </Suspense>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const { q, categoria, abierto } = params

  const [allBusinesses, categories] = await Promise.all([
    getBusinesses({ category: categoria, search: q }),
    getCategories(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Explorar negocios</h1>
          <SearchBar initialValue={q} />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <FilterBarWrapper categories={categories} selectedCategory={categoria} openNow={abierto === '1'} />
        </div>
        {/* El filtro "abierto ahora" se aplica en el cliente para evitar Date.now() en servidor */}
        <BusinessGridClient businesses={allBusinesses as Business[]} filterOpen={abierto === '1'} />
      </div>
    </div>
  )
}
