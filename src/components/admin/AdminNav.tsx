'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Store, Users, Tag, LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/actions/auth'

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/negocios', label: 'Negocios', icon: Store },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/categorias', label: 'Categorías', icon: Tag },
]

interface AdminNavProps {
  name: string
  email: string
}

export default function AdminNav({ name, email }: AdminNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const links = (
    <nav className="flex flex-col gap-1">
      {navLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-brand text-white'
                : 'text-gray-300 hover:bg-brand hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Sidebar escritorio */}
      <aside className="w-64 bg-gray-900 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <p className="font-semibold text-white">Administración</p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{name}</p>
          <p className="text-xs text-gray-500 truncate">{email}</p>
        </div>
        <div className="p-4 flex-1">{links}</div>
        <div className="p-4 border-t border-gray-700">
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-2 text-gray-400 hover:text-red-400 hover:bg-gray-800"
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>

      {/* Barra superior móvil */}
      <div className="md:hidden">
        <div className="flex items-center justify-between bg-gray-900 px-4 h-14">
          <p className="font-semibold text-white">Administración</p>
          <button
            onClick={() => setOpen(!open)}
            className="text-gray-300 hover:text-white"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {open && (
          <div className="bg-gray-900 border-t border-gray-800 px-4 py-4">
            <div className="mb-3">
              <p className="text-xs text-gray-400 truncate">{name}</p>
              <p className="text-xs text-gray-500 truncate">{email}</p>
            </div>
            {links}
            <div className="mt-3 pt-3 border-t border-gray-800">
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full justify-start gap-2 text-gray-400 hover:text-red-400 hover:bg-gray-800"
                >
                  <LogOut className="w-4 h-4" /> Cerrar sesión
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
