'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const MAX_PHOTOS = 6

export async function addBusinessPhoto(businessId: string, url: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // El negocio debe pertenecer al usuario autenticado.
  const { data: business } = await supabase
    .from('businesses')
    .select('id, status')
    .eq('id', businessId)
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return { error: 'No autorizado' }
  if (business.status === 'pending') {
    return { error: 'Tu negocio está en revisión y no puede editarse.' }
  }

  // El límite de 6 es la fuente de verdad en el servidor.
  const { count } = await supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
  if ((count ?? 0) >= MAX_PHOTOS) {
    return { error: 'Has alcanzado el máximo de 6 fotos.' }
  }

  const { error } = await supabase
    .from('photos')
    .insert({ business_id: businessId, url })
  if (error) return { error: error.message }

  revalidatePath('/dashboard/negocio')
  revalidatePath('/negocio/[slug]', 'page')
  return { success: true }
}

export async function deleteBusinessPhoto(photoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Leer la foto y verificar que su negocio pertenezca al usuario.
  const { data: photo } = await supabase
    .from('photos')
    .select('id, business_id')
    .eq('id', photoId)
    .maybeSingle()
  if (!photo) return { error: 'No autorizado' }

  const { data: business } = await supabase
    .from('businesses')
    .select('id, status')
    .eq('id', photo.business_id)
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return { error: 'No autorizado' }
  if (business.status === 'pending') {
    return { error: 'Tu negocio está en revisión y no puede editarse.' }
  }

  const { error } = await supabase.from('photos').delete().eq('id', photoId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/negocio')
  revalidatePath('/negocio/[slug]', 'page')
  return { success: true }
}
