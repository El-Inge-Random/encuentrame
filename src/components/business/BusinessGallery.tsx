'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { addBusinessPhoto, deleteBusinessPhoto } from '@/app/actions/photos'
import type { Photo } from '@/types'

const MAX_PHOTOS = 6

interface BusinessGalleryProps {
  businessId: string
  photos: Photo[]
}

export default function BusinessGallery({ businessId, photos }: BusinessGalleryProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const atLimit = photos.length >= MAX_PHOTOS

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5 MB.')
      e.target.value = ''
      return
    }

    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Debes iniciar sesión para subir una imagen.')
      setUploading(false)
      e.target.value = ''
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
      setUploading(false)
      e.target.value = ''
      return
    }

    const { data: pub } = supabase.storage.from('business-images').getPublicUrl(path)
    const result = await addBusinessPhoto(businessId, pub.publicUrl)
    if (result?.error) {
      setError(result.error)
      setUploading(false)
      e.target.value = ''
      return
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
    router.refresh()
  }

  async function handleDelete(photoId: string) {
    setError('')
    setDeletingId(photoId)
    const result = await deleteBusinessPhoto(photoId)
    if (result?.error) {
      setError(result.error)
      setDeletingId(null)
      return
    }
    setDeletingId(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative h-40 rounded-xl overflow-hidden border border-input">
              <Image src={photo.url} alt="Foto del negocio" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                disabled={deletingId === photo.id}
                aria-label="Borrar foto"
                className="absolute top-2 right-2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">Máximo 6 fotos ({photos.length}/6)</p>

      {!atLimit && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-purple-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-gray-400">
            {uploading ? 'Subiendo...' : 'JPG o PNG, máximo 5 MB.'}
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}
    </div>
  )
}
