'use client'

import { useState } from 'react'
import { approveBusiness, rejectBusiness } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

interface ApprovalButtonsProps {
  businessId: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function ApprovalButtons({ businessId, status }: ApprovalButtonsProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  async function handleApprove() {
    setLoading('approve')
    await approveBusiness(businessId)
    setLoading(null)
  }

  async function handleReject() {
    setLoading('reject')
    await rejectBusiness(businessId)
    setLoading(null)
  }

  return (
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
        onClick={handleReject}
        disabled={loading !== null || status === 'rejected'}
        className="text-xs text-red-700 border-red-200 hover:bg-red-50"
      >
        {loading === 'reject' ? (
          <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <X className="w-3 h-3" /> Rechazar
          </>
        )}
      </Button>
    </div>
  )
}
