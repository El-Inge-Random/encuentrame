'use client'

import { useState } from 'react'
import { toggleBusinessActive, toggleBusinessVerified } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'

interface ToggleBusinessButtonProps {
  businessId: string
  field: 'active' | 'verified'
  currentValue: boolean
}

export default function ToggleBusinessButton({
  businessId,
  field,
  currentValue,
}: ToggleBusinessButtonProps) {
  const [loading, setLoading] = useState(false)
  const [optimistic, setOptimistic] = useState(currentValue)

  async function handleClick() {
    setLoading(true)
    setOptimistic((prev) => !prev)
    const result =
      field === 'active'
        ? await toggleBusinessActive(businessId)
        : await toggleBusinessVerified(businessId)
    // revert optimistic update if the action returned an error
    if (result && 'error' in result) {
      setOptimistic((prev) => !prev)
    }
    setLoading(false)
  }

  const label =
    field === 'active'
      ? optimistic
        ? 'Desactivar'
        : 'Activar'
      : optimistic
        ? 'No Verificado'
        : 'Verificar'

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={loading}
      className="text-xs"
    >
      {loading ? (
        <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        label
      )}
    </Button>
  )
}
