import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, Store, Clock, LogOut } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="p-6 border-b">
          <p className="font-semibold text-gray-900">Mi Panel</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <nav className="p-4 flex flex-col gap-1 flex-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Inicio
          </Link>
          <Link href="/dashboard/negocio" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
            <Store className="w-4 h-4" /> Mi Negocio
          </Link>
          <Link href="/dashboard/horarios" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
            <Clock className="w-4 h-4" /> Horarios
          </Link>
        </nav>
        <div className="p-4 border-t">
          <form action={signOut}>
            <Button type="submit" variant="ghost" className="w-full justify-start gap-2 text-gray-600 hover:text-red-600">
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
