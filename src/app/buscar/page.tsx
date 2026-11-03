import { getBusinesses, getCategories, getCities } from '@/app/actions/business'
import SearchBar from '@/components/search/SearchBar'
import FilterBar from '@/components/search/FilterBar'
import BusinessGridClient from '@/components/business/BusinessGridClient'
import type { Business } from '@/types'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

interface SearchPageProps {
  searchParams: Promise<{ q?: string; categoria?: string; abierto?: string; ciudad?: string }>
}

function FilterBarWrapper({ categories, selectedCategory, openNow, cities, selectedCity }: {
  categories: Awaited<ReturnType<typeof getCategories>>
  selectedCategory?: string
  openNow?: boolean
  cities: string[]
  selectedCity?: string
}) {
  return (
    <Suspense fallback={null}>
      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        openNow={openNow}
        cities={cities}
        selectedCity={selectedCity}
      />
    </Suspense>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const { q, categoria, abierto, ciudad } = params

  const [allBusinesses, categories, cities] = await Promise.all([
    getBusinesses({ category: categoria, search: q, city: ciudad }),
    getCategories(),
    getCities(),
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
          <FilterBarWrapper
            categories={categories}
            selectedCategory={categoria}
            openNow={abierto === '1'}
            cities={cities}
            selectedCity={ciudad}
          />
        </div>
        {/* El filtro "abierto ahora" se aplica en el cliente para evitar Date.now() en servidor */}
        <BusinessGridClient businesses={allBusinesses as Business[]} filterOpen={abierto === '1'} />
      </div>
    </div>
  )
}
