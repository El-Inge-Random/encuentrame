'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { slugify } from '@/lib/utils/business'
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
    { count: pendingApproval },
    { count: recommendedBusinesses },
    { data: categoryRows },
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_verified', false),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('referred_by', 'recomendado'),
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
    pendingApproval: pendingApproval ?? 0,
    recommendedBusinesses: recommendedBusinesses ?? 0,
    businessesPerCategory,
  }
}

export async function getAllBusinesses(): Promise<BusinessWithOwner[] | { error: string }> {
  const { supabase, error } = await getAdminUser()
  if (error || !supabase) return { error: 'No autorizado' }

  const { data, error: queryError } = await supabase
    .from('businesses')
    .select('*, categories(name, icon, color), profiles(full_name)')
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

export async function approveBusiness(id: string): Promise<void | { error: string }> {
  const { supabase, error } = await getAdminUser()
  if (error || !supabase) return { error: 'No autorizado' }

  // Al aprobar se limpia el motivo de rechazo previo (si lo había).
  const { error: updateError } = await supabase
    .from('businesses')
    .update({ status: 'approved', rejection_reason: null })
    .eq('id', id)

  if (updateError) return { error: updateError.message }
  revalidatePath('/admin/negocios')
  revalidatePath('/admin')
  // Refresca las vistas públicas que ahora pueden mostrar el negocio.
  revalidatePath('/')
  revalidatePath('/buscar')
}

export async function rejectBusiness(id: string, reason: string): Promise<void | { error: string }> {
  const { supabase, error } = await getAdminUser()
  if (error || !supabase) return { error: 'No autorizado' }

  // El admin debe indicar por qué se rechaza; el dueño verá este motivo.
  const trimmedReason = reason?.trim()
  if (!trimmedReason) return { error: 'Debes indicar un motivo de rechazo.' }

  const { error: updateError } = await supabase
    .from('businesses')
    .update({ status: 'rejected', rejection_reason: trimmedReason })
    .eq('id', id)

  if (updateError) return { error: updateError.message }
  revalidatePath('/admin/negocios')
  revalidatePath('/admin')
  // El público deja de verlo; refrescar sus vistas.
  revalidatePath('/')
  revalidatePath('/buscar')
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

export async function createCategory(formData: FormData): Promise<void | { error: string }> {
  const { supabase, error } = await getAdminUser()
  if (error || !supabase) return { error: 'No autorizado' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'El nombre es obligatorio.' }

  const icon = (formData.get('icon') as string)?.trim() || null
  const color = (formData.get('color') as string)?.trim() || null
  const slug = slugify(name)
  if (!slug) return { error: 'El nombre no es válido.' }

  // Evita duplicados por slug (la columna es unique; damos un mensaje claro
  // en vez de dejar que reviente la restricción).
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) return { error: 'Ya existe una categoría con ese nombre.' }

  const { error: insertError } = await supabase
    .from('categories')
    .insert({ name, slug, icon, color })

  if (insertError) return { error: insertError.message }

  revalidatePath('/admin/categorias')
  revalidatePath('/')
}
