'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [sessionError, setSessionError] = useState('')

  // Al cargar, establece la sesión a partir del enlace del correo.
  // Supabase (flujo PKCE) entrega un ?code= que hay que intercambiar por
  // sesión antes de poder cambiar la contraseña.
  useEffect(() => {
    const supabase = createClient()

    async function init() {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      // 1. Si ya hay sesión activa (p.ej. vino desde /auth/callback), úsala.
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setReady(true)
        return
      }

      // 2. Si no, intercambia el code de la URL por una sesión.
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setSessionError('El enlace no es válido o ya expiró. Solicita uno nuevo.')
          return
        }
        setReady(true)
        return
      }

      setSessionError('No se encontró una sesión válida. Solicita un nuevo enlace de recuperación.')
    }

    init()
  }, [])

  async function handleSubmit(formData: FormData) {
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <MapPin className="w-6 h-6 text-orange-500" />
          <span className="font-bold text-xl text-purple-700">Encuentrame</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Nueva contraseña</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Escribe tu nueva contraseña para tu cuenta.
        </p>

        {sessionError ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
              {sessionError}
            </p>
            <Link href="/auth/recuperar" className="text-sm text-purple-700 font-medium hover:underline inline-block">
              Solicitar nuevo enlace
            </Link>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input id="password" name="password" type="password" required className="mt-1" placeholder="Mínimo 6 caracteres" minLength={6} disabled={!ready} />
            </div>
            <div>
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input id="confirm" name="confirm" type="password" required className="mt-1" placeholder="Repite la contraseña" minLength={6} disabled={!ready} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-800" disabled={loading || !ready}>
              {!ready ? 'Verificando enlace...' : loading ? 'Guardando...' : 'Guardar contraseña'}
            </Button>
          </form>
        )}

        <p className="text-sm text-center text-gray-500 mt-6">
          <Link href="/auth/login" className="text-purple-700 font-medium hover:underline">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
