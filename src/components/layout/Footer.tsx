import Link from 'next/link'
import { MapPin } from 'lucide-react'
import CurrentYear from './CurrentYear'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10 mt-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-1">
              <MapPin className="w-5 h-5 text-orange-500" />
              Encuentrame
            </div>
            <p className="text-sm">Descubre los negocios de Tierra Blanca, Veracruz.</p>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <Link href="/buscar" className="hover:text-white transition-colors">Explorar negocios</Link>
            <Link href="/auth/registro" className="hover:text-white transition-colors">Registra tu negocio</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Iniciar sesión</Link>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-800 text-xs text-center">
          © <CurrentYear /> Encuentrame · Tierra Blanca, Veracruz
        </div>
      </div>
    </footer>
  )
}
