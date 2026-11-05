'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '@/app/actions/auth'

export default function RecoverPage() {
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    const result = await requestPasswordReset(formData)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <MapPin className="w-6 h-6 text-brand-accent" />
          <span className="font-bold text-xl text-brand">Encuentrame</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Recuperar contraseña</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-700 bg-green-50 border border-green-200 rounded-lg p-4">
              Si existe una cuenta con ese correo, recibirás un enlace para
              restablecer tu contraseña. Revisa tu bandeja de entrada y spam.
            </p>
            <Link href="/auth/login" className="text-sm text-brand font-medium hover:underline inline-block">
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <form action={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" name="email" type="email" required className="mt-1" placeholder="tu@correo.com" />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full bg-brand hover:bg-brand-hover" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </Button>
            </form>
            <p className="text-sm text-center text-gray-500 mt-6">
              <Link href="/auth/login" className="text-brand font-medium hover:underline">Volver a iniciar sesión</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
