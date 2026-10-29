'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn } from '@/app/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    const result = await signIn(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <MapPin className="w-6 h-6 text-orange-500" />
          <span className="font-bold text-xl text-purple-700">Encuentrame</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Iniciar sesión</h1>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" name="email" type="email" required className="mt-1" placeholder="tu@correo.com" />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required className="mt-1" placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-800" disabled={loading}>
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </Button>
        </form>
        <p className="text-sm text-center text-gray-500 mt-6">
          ¿No tienes cuenta? <Link href="/auth/registro" className="text-purple-700 font-medium hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}
