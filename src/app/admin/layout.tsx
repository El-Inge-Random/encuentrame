import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, Store, Users, Tag, LogOut } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/negocios', label: 'Negocios', icon: Store },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/categorias', label: 'Categorías', icon: Tag },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-gray-900 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <p className="font-semibold text-white">Administración</p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{profile.full_name ?? user.email}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <nav className="p-4 flex flex-col gap-1 flex-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-purple-700 hover:text-white transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
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
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
