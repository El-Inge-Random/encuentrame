import Link from 'next/link'
import { getBusinesses, getCategories } from './actions/business'
import BusinessGrid from '@/components/business/BusinessGrid'
import SearchBar from '@/components/search/SearchBar'
import { UtensilsCrossed, Scissors, Heart, ShoppingBag, Wrench, BookOpen, Music, Home } from 'lucide-react'
import type { Category } from '@/types'

export const dynamic = 'force-dynamic'

const ICONS: Record<string, React.ReactNode> = {
  UtensilsCrossed: <UtensilsCrossed className="w-7 h-7" />,
  Scissors: <Scissors className="w-7 h-7" />,
  Heart: <Heart className="w-7 h-7" />,
  ShoppingBag: <ShoppingBag className="w-7 h-7" />,
  Wrench: <Wrench className="w-7 h-7" />,
  BookOpen: <BookOpen className="w-7 h-7" />,
  Music: <Music className="w-7 h-7" />,
  Home: <Home className="w-7 h-7" />,
}

export default async function HomePage() {
  const [categories, recentBusinesses] = await Promise.all([
    getCategories(),
    getBusinesses(),
  ])

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-700 via-purple-600 to-orange-500 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Encuentrame</h1>
          <p className="text-xl md:text-2xl text-purple-100 mb-8">Descubre los negocios de Tierra Blanca</p>
          <div className="flex justify-center">
            <SearchBar large />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">¿Qué estás buscando?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(categories as Category[]).map(cat => (
            <Link
              key={cat.id}
              href={`/buscar?categoria=${cat.slug}`}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center group"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: cat.color || '#7C3AED' }}
              >
                {cat.icon && ICONS[cat.icon]}
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700 transition-colors">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent businesses */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Negocios registrados</h2>
          <Link href="/buscar" className="text-sm text-purple-700 hover:underline font-medium">Ver todos →</Link>
        </div>
        <BusinessGrid businesses={recentBusinesses.slice(0, 6)} />
      </section>
    </div>
  )
}
