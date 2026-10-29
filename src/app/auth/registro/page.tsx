'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUp } from '@/app/actions/auth'

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('user')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    formData.set('role', role)
    const result = await signUp(formData)
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Crear cuenta</h1>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input id="full_name" name="full_name" required className="mt-1" placeholder="Tu nombre" />
          </div>
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" name="email" type="email" required className="mt-1" placeholder="tu@correo.com" />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required className="mt-1" placeholder="Mínimo 6 caracteres" minLength={6} />
          </div>
          <div>
            <Label>Tipo de cuenta</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                  role === 'user' ? 'bg-purple-700 text-white border-purple-700' : 'border-gray-200 text-gray-600 hover:border-purple-300'
                }`}
              >
                Usuario
              </button>
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                  role === 'owner' ? 'bg-purple-700 text-white border-purple-700' : 'border-gray-200 text-gray-600 hover:border-purple-300'
                }`}
              >
                Dueño de negocio
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-800" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>
        <p className="text-sm text-center text-gray-500 mt-6">
          ¿Ya tienes cuenta? <Link href="/auth/login" className="text-purple-700 font-medium hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
