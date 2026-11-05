'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createBusiness, updateBusiness } from '@/app/actions/business'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Business, Category } from '@/types'

interface BusinessFormProps {
  business: Business | null
  categories: Category[]
  /**
   * En modo solo lectura (negocio existente aún no aprobado) se deshabilitan
   * los campos y el botón de guardar. En creación nunca aplica.
   */
  readOnly?: boolean
}

export default function BusinessForm({ business, categories, readOnly = false }: BusinessFormProps) {
  // La creación de un negocio nuevo siempre está permitida; readOnly solo
  // aplica cuando ya existe un negocio (edición).
  const isLocked = readOnly && business !== null
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(business?.cover_image ?? null)

  // Liberar el object URL del preview cuando cambie o al desmontar, para
  // evitar fugas de memoria (solo aplica a los blobs de archivos locales).
  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError('')
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.')
      e.target.value = ''
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5 MB.')
      e.target.value = ''
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit(rawFormData: FormData) {
    setLoading(true)
    setError('')

    // Si hay archivo nuevo lo subimos al bucket desde el cliente y mandamos
    // la public URL a la server action; si no, conservamos la portada actual.
    let coverImageUrl = business?.cover_image ?? null

    if (file) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Debes iniciar sesión para subir una imagen.')
        setLoading(false)
        return
      }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase
        .storage
        .from('business-images')
        .upload(path, file, { upsert: false, contentType: file.type })
      if (uploadError) {
        setError('No se pudo subir la imagen: ' + uploadError.message)
        setLoading(false)
        return
      }
      const { data: pub } = supabase.storage.from('business-images').getPublicUrl(path)
      coverImageUrl = pub.publicUrl
    }

    // IMPORTANTE: construimos un FormData SOLO con campos de texto. El input
    // de archivo (cover_image_file) NO debe viajar al server action, o el body
    // excede el límite de 1 MB de Server Actions. El archivo ya se subió al
    // Storage arriba; aquí solo mandamos su URL.
    const payload = new FormData()
    for (const key of ['name', 'description', 'category_id', 'address', 'city', 'state', 'phone', 'whatsapp']) {
      payload.set(key, (rawFormData.get(key) as string) ?? '')
    }
    payload.set('cover_image', coverImageUrl ?? '')
    const ref = rawFormData.get('ref')
    if (ref) payload.set('ref', ref as string)

    // createBusiness/updateBusiness redirigen en caso de éxito; si regresan
    // un objeto es porque hubo un error que debemos mostrar.
    const result = business
      ? await updateBusiness(business.id, payload)
      : await createBusiness(payload)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="name">Nombre del negocio *</Label>
        <Input id="name" name="name" required className="mt-1" defaultValue={business?.name} disabled={isLocked} />
      </div>
      <div>
        <Label htmlFor="description">Descripción</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue={business?.description || ''}
          placeholder="Describe tu negocio..."
          disabled={isLocked}
        />
      </div>
      <div>
        <Label htmlFor="cover_image">Imagen de portada</Label>
        {preview && (
          <div className="relative mt-2 h-40 w-full overflow-hidden rounded-lg border border-input">
            <Image src={preview} alt="Vista previa de portada" fill className="object-cover" unoptimized />
          </div>
        )}
        <input
          id="cover_image"
          name="cover_image_file"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isLocked}
          className="mt-2 block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-purple-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-purple-100"
        />
        <p className="mt-1 text-xs text-gray-400">JPG o PNG, máximo 5 MB.</p>
      </div>
      <div>
        <Label htmlFor="category_id">Categoría</Label>
        <select
          id="category_id"
          name="category_id"
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          defaultValue={business?.category_id?.toString() || ''}
          disabled={isLocked}
        >
          <option value="">Seleccionar categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" name="address" className="mt-1" defaultValue={business?.address || ''} placeholder="Calle, colonia..." disabled={isLocked} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Ciudad *</Label>
          <Input id="city" name="city" required className="mt-1" defaultValue={business?.city || ''} placeholder="Ej. Tierra Blanca" disabled={isLocked} />
        </div>
        <div>
          <Label htmlFor="state">Estado</Label>
          <Input id="state" name="state" className="mt-1" defaultValue={business?.state || ''} placeholder="Ej. Veracruz" disabled={isLocked} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" className="mt-1" defaultValue={business?.phone || ''} placeholder="2727..." disabled={isLocked} />
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp (con código país)</Label>
          <Input id="whatsapp" name="whatsapp" className="mt-1" defaultValue={business?.whatsapp || ''} placeholder="527227..." disabled={isLocked} />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full bg-brand hover:bg-brand-hover" disabled={loading || isLocked}>
        {loading ? 'Guardando...' : business ? 'Guardar cambios' : 'Registrar negocio'}
      </Button>
    </form>
  )
}
