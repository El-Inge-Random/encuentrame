'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { slugify } from '@/lib/utils/business'
import type { Business } from '@/types'

export async function getBusinesses({ category, search }: { category?: string; search?: string } = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('businesses')
    .select('*, categories(*), business_hours(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (category) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', category).single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  const { data, error } = await query

  console.log('[getBusinesses] search:', search)
  console.log('[getBusinesses] error:', error)
  console.log('[getBusinesses] total rows from DB:', data?.length)

  if (error) return []

  if (search) {
    const normalize = (str: string) =>
      str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    const normalizedSearch = normalize(search.trim())

    const fuzzyMatch = (field: string): boolean => {
      const normalizedField = normalize(field)
      // 1. El campo contiene el término exacto: "barberia" includes "barberia"
      if (normalizedField.includes(normalizedSearch)) return true
      // 2. El término contiene el campo (búsqueda más larga que el nombre)
      if (normalizedSearch.includes(normalizedField)) return true
      // 3. Coincidencia por palabras: cada palabra del término debe aparecer
      //    como prefijo de alguna palabra del campo
      //    "barberias" -> busca palabras del campo que empiecen con "barberia"
      const searchWords = normalizedSearch.split(/\s+/).filter(Boolean)
      const fieldWords = normalizedField.split(/\s+/).filter(Boolean)
      return searchWords.every(sw =>
        fieldWords.some(fw => fw.startsWith(sw) || sw.startsWith(fw))
      )
    }

    return (data as Business[]).filter(b =>
      fuzzyMatch(b.name) ||
      fuzzyMatch(b.description || '') ||
      fuzzyMatch(b.address || '')
    )
  }

  return data as Business[]
}

export async function getBusinessBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('businesses')
    .select('*, categories(*), business_hours(*), photos(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  if (error) return null
  return data as Business & { photos: { id: string; url: string; created_at: string }[] }
}

export async function getOwnerBusiness() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('businesses')
    .select('*, categories(*), business_hours(*)')
    .eq('owner_id', user.id)
    .single()
  return data as Business | null
}

export async function createBusiness(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const name = formData.get('name') as string
  const slug = slugify(name)

  const payload = {
    owner_id: user.id,
    name,
    slug,
    description: formData.get('description') as string,
    category_id: formData.get('category_id') ? Number(formData.get('category_id')) : null,
    address: formData.get('address') as string,
    phone: formData.get('phone') as string,
    whatsapp: formData.get('whatsapp') as string,
  }

  const { error } = await supabase.from('businesses').insert(payload)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function updateBusiness(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const name = formData.get('name') as string

  const payload = {
    name,
    description: formData.get('description') as string,
    category_id: formData.get('category_id') ? Number(formData.get('category_id')) : null,
    address: formData.get('address') as string,
    phone: formData.get('phone') as string,
    whatsapp: formData.get('whatsapp') as string,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('businesses').update(payload).eq('id', id).eq('owner_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/negocio')
  redirect('/dashboard')
}

export async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').order('name')
  return data || []
}
