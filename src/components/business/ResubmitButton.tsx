'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { resubmitBusiness } from '@/app/actions/business'

export default function ResubmitButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    setError('')
    const result = await resubmitBusiness()
    if (result && 'error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }
    // Éxito: refrescar para reflejar el nuevo estado 'pending'.
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="gap-2 bg-purple-700 hover:bg-purple-800"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Enviando...' : 'Volver a solicitar aprobación'}
      </Button>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}
    </div>
  )
}
