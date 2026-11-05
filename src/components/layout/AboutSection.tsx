'use client'

import Link from 'next/link'
import { Search, Store, Clock, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PASOS = [
  {
    icon: Search,
    title: 'Encuentra',
    text: 'Busca por nombre o explora por categoría y ciudad. Deja de ir siempre a los mismos lugares y descubre opciones nuevas cerca de ti.',
  },
  {
    icon: Clock,
    title: 'Decide al momento',
    text: 'Mira horarios, ubicación, teléfono y si el negocio está abierto ahora, para elegir sin dar vueltas.',
  },
  {
    icon: Store,
    title: 'Para los negocios',
    text: '¿Tienes un negocio? Regístralo gratis, mantén tu información al día y haz que más personas te encuentren.',
  },
]

export default function AboutSection() {
  return (
    <section className="bg-white border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">¿Qué es Encuentrame?</h2>
          <p className="text-gray-600 leading-relaxed">
            Un directorio de negocios locales que conecta a quienes buscan con los
            comercios de su zona. Nace de algo cotidiano: cuando quieres cenar,
            comprar en una farmacia o encontrar un servicio, casi siempre terminas
            en los mismos lugares porque no sabes qué más hay cerca. Encuentrame
            reúne esos negocios en un solo lugar para que descubras y elijas fácil.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PASOS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        {/* Llamado a la acción: recomendar un negocio */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-purple-700 to-orange-500 p-8 text-center text-white">
          <h3 className="text-xl md:text-2xl font-bold mb-2">¿Conoces un negocio que debería estar aquí?</h3>
          <p className="text-purple-100 mb-6 max-w-xl mx-auto">
            Compártele el enlace a su dueño para que lo registre y aparezca en Encuentrame.
          </p>
          <Link href="/recomendar">
            <Button className="gap-2 bg-white text-purple-700 hover:bg-purple-50">
              <Share2 className="w-4 h-4" /> Recomendar un negocio
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
