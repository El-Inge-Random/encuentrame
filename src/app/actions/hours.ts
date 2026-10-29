'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { BusinessHours } from '@/types'

export async function saveBusinessHours(businessId: string, hours: Omit<BusinessHours, 'id' | 'business_id'>[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  await supabase.from('business_hours').delete().eq('business_id', businessId)

  const rows = hours.map(h => ({ ...h, business_id: businessId }))
  const { error } = await supabase.from('business_hours').insert(rows)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/horarios')
  return { success: true }
}
