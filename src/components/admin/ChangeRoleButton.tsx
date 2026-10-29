'use client'

import { useState } from 'react'
import { changeUserRole } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'

interface ChangeRoleButtonProps {
  userId: string
  currentRole: 'user' | 'owner'
}

export default function ChangeRoleButton({ userId, currentRole }: ChangeRoleButtonProps) {
  const [loading, setLoading] = useState(false)
  const [optimisticRole, setOptimisticRole] = useState(currentRole)

  async function handleClick() {
    setLoading(true)
    const newRole = optimisticRole === 'user' ? 'owner' : 'user'
    setOptimisticRole(newRole)
    const result = await changeUserRole(userId, newRole)
    // revert optimistic update if the action returned an error
    if (result && 'error' in result) {
      setOptimisticRole((prev) => (prev === 'user' ? 'owner' : 'user'))
    }
    setLoading(false)
  }

  const label = optimisticRole === 'user' ? 'Hacer Propietario' : 'Quitar Propietario'

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
