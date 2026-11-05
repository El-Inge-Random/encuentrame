'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { BusinessHours } from '@/types'

export async function saveBusinessHours(businessId: string, hours: Omit<BusinessHours, 'id' | 'business_id'>[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Defensa en servidor: el negocio debe pertenecer al usuario. Se pueden
  // gestionar horarios cuando está aprobado o rechazado; solo 'pending'
  // (en revisión) queda bloqueado.
  const { data: business } = await supabase
    .from('businesses')
    .select('status')
    .eq('id', businessId)
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return { error: 'No autorizado' }
  if (business.status === 'pending') {
    return { error: 'Tu negocio está en revisión y no puede editarse.' }
  }

  await supabase.from('business_hours').delete().eq('business_id', businessId)

  const rows = hours.map(h => ({ ...h, business_id: businessId }))
  const { error } = await supabase.from('business_hours').insert(rows)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/horarios')
  return { success: true }
}
