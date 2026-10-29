'use client'

import { useState, useEffect } from 'react'
import { getDayName } from '@/lib/utils/business'
import { saveBusinessHours } from '@/app/actions/hours'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { BusinessHours } from '@/types'

const DEFAULT_HOURS = Array.from({ length: 7 }, (_, i) => ({
  day_of_week: i,
  opens_at: '09:00',
  closes_at: '18:00',
  is_closed: i === 0,
}))

export default function HorariosPage() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/dashboard/business')
      .then(r => r.json())
      .then(data => {
        if (data.business) {
          setBusinessId(data.business.id)
          if (data.business.business_hours?.length > 0) {
            const merged = DEFAULT_HOURS.map(def => {
              const found = data.business.business_hours.find((h: BusinessHours) => h.day_of_week === def.day_of_week)
              return found ? { ...def, ...found } : def
            })
            setHours(merged)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const update = (day: number, field: string, value: string | boolean) => {
    setHours(prev => prev.map(h => h.day_of_week === day ? { ...h, [field]: value } : h))
  }

  const handleSave = async () => {
    if (!businessId) return setMessage('Primero registra tu negocio.')
    setSaving(true)
    const result = await saveBusinessHours(businessId, hours)
    setSaving(false)
    setMessage(result.error ? `Error: ${result.error}` : '¡Horarios guardados!')
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Cargando...</div>

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestionar horarios</h1>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="space-y-4">
          {hours.map(h => (
            <div key={h.day_of_week} className="flex items-center gap-4 flex-wrap">
              <span className="w-28 text-sm font-medium text-gray-700">{getDayName(h.day_of_week)}</span>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={h.is_closed}
                  onChange={e => update(h.day_of_week, 'is_closed', e.target.checked)}
                  className="rounded"
                />
                Cerrado
              </label>
              {!h.is_closed && (
                <>
                  <Input
                    type="time"
                    value={h.opens_at}
                    onChange={e => update(h.day_of_week, 'opens_at', e.target.value)}
                    className="w-32"
                  />
                  <span className="text-gray-400 text-sm">a</span>
                  <Input
                    type="time"
                    value={h.closes_at}
                    onChange={e => update(h.day_of_week, 'closes_at', e.target.value)}
                    className="w-32"
                  />
                </>
              )}
            </div>
          ))}
        </div>
        {message && <p className={`mt-4 text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
        <Button onClick={handleSave} disabled={saving} className="mt-6 w-full bg-purple-700 hover:bg-purple-800">
          {saving ? 'Guardando...' : 'Guardar horarios'}
        </Button>
      </div>
    </div>
  )
}
