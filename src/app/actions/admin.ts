'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AdminStats, BusinessWithOwner, Profile } from '@/types'

async function getAdminUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase: null, user: null, error: 'No autorizado' as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { supabase: null, user: null, error: 'No autorizado' as const }
  }

  return { supabase, user, error: null }
}

export async function getAdminStats(): Promise<AdminStats | { error: string }> {
  const { supabase, error } = await getAdminUser()
  if (error || !supabase) return { error: 'No autorizado' }

  const [
    { count: totalBusinesses },
    { count: activeBusinesses },
    { count: verifiedBusinesses },
    { count: totalUsers },
    { count: pendingVerification },
    { data: categoryRows },
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_verified', false),
    supabase.from('categories').select('name, businesses(count)'),
  ])

  const businessesPerCategory = (categoryRows ?? []).map((row) => {
    const businessesArr = row.businesses as unknown as { count: number }[]
    const count = Array.isArray(businessesArr) && businessesArr.length > 0
      ? businessesArr[0].count
      : 0
    return { category: row.name as string, count }
  })

  return {
    totalBusinesses: totalBusinesses ?? 0,
    activeBusinesses: activeBusinesses ?? 0,
    verifiedBusinesses: verifiedBusinesses ?? 0,
    totalUsers: totalUsers ?? 0,
    pendingVerification: pendingVerification ?? 0,
    businessesPerCategory,
  }
}

export async function getAllBusinesses(): Promise<BusinessWithOwner[] | { error: string }> {
  const { supabase, error } = await getAdminUser()
  if (error || !supabase) return { error: 'No autorizado' }

  const { data, error: queryError } = await supabase
    .from('businesses')
    .select('*, categories(name, icon, color)')
    .order('created_at', { ascending: false })

  if (queryError) return { error: queryError.message }
  return (data ?? []) as BusinessWithOwner[]
}

export async function getAllUsers(): Promise<(Profile & { businesses: { count: number }[] })[] | { error: string }> {
  const { supabase, error } = await getAdminUser()
  if (error || !supabase) return { error: 'No autorizado' }

  const { data, error: queryError } = await supabase
    .from('profiles')
    .select('*, businesses(count)')
    .order('created_at', { ascending: false })

  if (queryError) return { error: queryError.message }
  return (data ?? []) as (Profile & { businesses: { count: number }[] })[]
}

export async function toggleBusinessActive(id: string): Promise<void | { error: string }> {
  const { supabase, error } = await getAdminUser()
  if (error || !supabase) return { error: 'No autorizado' }

  const { data: current, error: fetchError } = await supabase
    .from('businesses')
    .select('is_active')
    .eq('id', id)
    .single()

  if (fetchError || !current) return { error: fetchError?.message ?? 'Negocio no encontrado' }

  const { error: updateError } = await supabase
    .from('businesses')
    .update({ is_active: !current.is_active })
    .eq('id', id)

  if (updateError) return { error: updateError.message }
  revalidatePath('/admin/negocios')
}

export async function toggleBusinessVerified(id: string): Promise<void | { error: string }> {
  const { supabase, error } = await getAdminUser()
  if (error || !supabase) return { error: 'No autorizado' }

  const { data: current, error: fetchError } = await supabase
    .from('businesses')
    .select('is_verified')
    .eq('id', id)
    .single()

  if (fetchError || !current) return { error: fetchError?.message ?? 'Negocio no encontrado' }

  const { error: updateError } = await supabase
    .from('businesses')
    .update({ is_verified: !current.is_verified })
    .eq('id', id)

  if (updateError) return { error: updateError.message }
  revalidatePath('/admin/negocios')
}

export async function changeUserRole(
  userId: string,
  newRole: 'user' | 'owner'
): Promise<void | { error: string }> {
  const { supabase, user, error } = await getAdminUser()
  if (error || !supabase || !user) return { error: 'No autorizado' }

  if (userId === user.id) {
    return { error: 'No puedes cambiar tu propio rol' }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (updateError) return { error: updateError.message }
  revalidatePath('/admin/usuarios')
}

export async function getCategoriesWithCount(): Promise<
  { id: number; name: string; slug: string; icon: string | null; color: string | null; count: number }[] | { error: string }
> {
  const { supabase, error } = await getAdminUser()
  if (error || !supabase) return { error: 'No autorizado' }

  const { data, error: queryError } = await supabase
    .from('categories')
    .select('*, businesses(count)')
    .order('name')

  if (queryError) return { error: queryError.message }

  return (data ?? []).map((row) => {
    const businessesArr = row.businesses as unknown as { count: number }[]
    const count = Array.isArray(businessesArr) && businessesArr.length > 0
      ? businessesArr[0].count
      : 0
    return {
      id: row.id as number,
      name: row.name as string,
      slug: row.slug as string,
      icon: row.icon as string | null,
      color: row.color as string | null,
      count,
    }
  })
}
