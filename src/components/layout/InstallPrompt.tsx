'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share } from 'lucide-react'

// Tipo del evento beforeinstallprompt (no está en los tipos estándar del DOM).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'encuentrame-install-dismissed'

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Si ya está instalada (modo standalone), no mostrar nada.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS marca esto cuando se abre desde el icono de inicio.
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) return

    // Si el usuario ya lo cerró antes, respetarlo.
    if (localStorage.getItem(DISMISS_KEY) === '1') return

    // Detectar iOS (Safari no soporta beforeinstallprompt).
    const ua = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(ua)
    if (ios) {
      setIsIOS(true)
      setVisible(true)
      return
    }

    // Android/Chrome: esperar el evento de instalación.
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    dismiss()
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl bg-white shadow-lg ring-1 ring-black/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">Instala Encuentrame</p>
          {isIOS ? (
            <p className="mt-0.5 text-sm text-gray-600">
              Toca <Share className="inline h-4 w-4 align-text-bottom" /> Compartir y
              luego <span className="font-medium">&quot;Agregar a inicio&quot;</span> para
              instalar la app.
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-gray-600">
              Añádela a tu pantalla de inicio y ábrela como una app.
            </p>
          )}

          {!isIOS && (
            <button
              onClick={install}
              className="mt-3 rounded-full bg-purple-700 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-purple-800"
            >
              Instalar app
            </button>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
