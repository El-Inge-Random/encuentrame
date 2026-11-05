'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, Copy, Check, MessageCircle, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RecomendarPage() {
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // El enlace se arma en el cliente con el origin real (local o prod).
    setLink(`${window.location.origin}/auth/registro?ref=recomendado`)
  }, [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback silencioso si el navegador no permite clipboard
    }
  }

  const whatsappMessage = encodeURIComponent(
    `¡Hola! Tu negocio debería estar en Encuentrame. Regístralo gratis aquí: ${link}`
  )
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-brand flex items-center justify-center mx-auto mb-4">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Recomienda un negocio
          </h1>
          <p className="text-gray-600 leading-relaxed">
            ¿Conoces un negocio que debería estar en Encuentrame? Comparte este
            enlace con su dueño para que lo registre él mismo y mantenga su
            información siempre actualizada.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <label className="text-sm font-medium text-gray-700">Enlace de invitación</label>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 min-w-0">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-600 truncate">{link}</span>
            </div>
            <Button
              onClick={copy}
              className="bg-brand hover:bg-brand-hover gap-2 shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Copiar enlace'}
            </Button>
          </div>

          <div className="mt-4">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button className="w-full gap-2 bg-green-500 hover:bg-green-600">
                <MessageCircle className="w-4 h-4" /> Compartir por WhatsApp
              </Button>
            </a>
          </div>
        </div>

        <p className="text-sm text-center text-gray-500 mt-8">
          <Link href="/" className="text-brand font-medium hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  )
}
