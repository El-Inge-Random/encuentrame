'use client'

import { useState } from 'react'
import { createCategory } from '@/app/actions/admin'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CATEGORY_ICONS, CATEGORY_ICON_NAMES } from '@/components/business/categoryIcons'

export default function CreateCategoryForm() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [icon, setIcon] = useState(CATEGORY_ICON_NAMES[0])
  const [color, setColor] = useState('#7C3AED')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    formData.set('icon', icon)
    formData.set('color', color)
    const result = await createCategory(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    // Éxito: la página se revalida en el servidor; cerramos el formulario.
    setLoading(false)
    setOpen(false)
    setError('')
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="bg-purple-700 hover:bg-purple-800">
        + Nueva categoría
      </Button>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <h2 className="font-semibold text-gray-900 mb-4">Nueva categoría</h2>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" name="name" required className="mt-1" placeholder="Ej. Comida y Restaurantes" />
        </div>

        <div>
          <Label>Ícono</Label>
          <div className="mt-2 grid grid-cols-6 sm:grid-cols-8 gap-2">
            {CATEGORY_ICON_NAMES.map((iconName) => {
              const Icon = CATEGORY_ICONS[iconName]
              const active = icon === iconName
              return (
                <button
                  type="button"
                  key={iconName}
                  onClick={() => setIcon(iconName)}
                  aria-label={iconName}
                  aria-pressed={active}
                  className={`flex items-center justify-center h-10 rounded-lg border transition-colors ${
                    active
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-500 hover:border-purple-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <Label htmlFor="color">Color</Label>
          <div className="mt-1 flex items-center gap-3">
            <input
              id="color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-16 rounded border border-gray-200 cursor-pointer"
            />
            <span className="text-sm text-gray-500">{color}</span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" className="bg-purple-700 hover:bg-purple-800" disabled={loading}>
            {loading ? 'Guardando...' : 'Crear categoría'}
          </Button>
          <Button type="button" variant="outline" onClick={() => { setOpen(false); setError('') }}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
