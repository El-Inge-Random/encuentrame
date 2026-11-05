'use client'

import { useState } from 'react'
import { approveBusiness, rejectBusiness } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

interface ApprovalButtonsProps {
  businessId: string
  status: 'pending' | 'approved' | 'rejected'
  /** Motivo de rechazo actual (si el negocio ya está rechazado). */
  rejectionReason?: string | null
}

export default function ApprovalButtons({ businessId, status, rejectionReason }: ApprovalButtonsProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  // Cuando es true, se muestra el textarea inline para escribir el motivo.
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  async function handleApprove() {
    setError('')
    setLoading('approve')
    const result = await approveBusiness(businessId)
    setLoading(null)
    if (result && 'error' in result) setError(result.error)
  }

  async function handleConfirmReject() {
    const trimmed = reason.trim()
    if (!trimmed) {
      setError('Debes indicar un motivo de rechazo.')
      return
    }
    setError('')
    setLoading('reject')
    const result = await rejectBusiness(businessId, trimmed)
    setLoading(null)
    if (result && 'error' in result) {
      setError(result.error)
      return
    }
    // Rechazo registrado: cerrar el textarea.
    setRejecting(false)
    setReason('')
  }

  function handleCancelReject() {
    setRejecting(false)
    setReason('')
    setError('')
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleApprove}
          disabled={loading !== null || status === 'approved'}
          className="text-xs text-green-700 border-green-200 hover:bg-green-50"
        >
          {loading === 'approve' ? (
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-3 h-3" /> Aprobar
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setError('')
            setRejecting(true)
          }}
          disabled={loading !== null || status === 'rejected' || rejecting}
          className="text-xs text-red-700 border-red-200 hover:bg-red-50"
        >
          <X className="w-3 h-3" /> Rechazar
        </Button>
      </div>

      {status === 'rejected' && rejectionReason && !rejecting && (
        <p className="text-xs text-red-700 max-w-xs">
          <span className="font-medium">Motivo:</span> {rejectionReason}
        </p>
      )}

      {rejecting && (
        <div className="flex flex-col gap-2 max-w-xs">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Escribe el motivo del rechazo..."
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleConfirmReject}
              disabled={loading !== null}
              className="text-xs text-red-700 border-red-200 hover:bg-red-50"
            >
              {loading === 'reject' ? (
                <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                'Confirmar rechazo'
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelReject}
              disabled={loading !== null}
              className="text-xs"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
