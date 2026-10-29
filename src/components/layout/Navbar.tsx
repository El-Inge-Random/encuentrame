'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import LogoAnimado from './LogoAnimado'

interface NavbarProps {
  user?: { email?: string } | null
}

export default function Navbar({ user }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center">
          <LogoAnimado />
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link href="/buscar" className={`text-sm font-medium ${pathname === '/buscar' ? 'text-purple-700' : 'text-gray-600 hover:text-purple-700'}`}>Explorar</Link>
          {user ? (
            <Link href="/dashboard"><Button size="sm" variant="default" className="bg-purple-700 hover:bg-purple-800">Mi Panel</Button></Link>
          ) : (
            <Link href="/auth/login"><Button size="sm" variant="outline">Iniciar sesión</Button></Link>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t px-4 py-3 flex flex-col gap-3 bg-white">
          <Link href="/buscar" className="text-sm font-medium text-gray-700" onClick={() => setOpen(false)}>Explorar</Link>
          {user ? (
            <Link href="/dashboard" onClick={() => setOpen(false)}><Button size="sm" className="bg-purple-700 w-full">Mi Panel</Button></Link>
          ) : (
            <Link href="/auth/login" onClick={() => setOpen(false)}><Button size="sm" variant="outline" className="w-full">Iniciar sesión</Button></Link>
          )}
        </div>
      )}
    </nav>
  )
}
