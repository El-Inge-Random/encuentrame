'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { slugify } from '@/lib/utils/business'
import type { Business } from '@/types'

export async function getBusinesses({ category, search, city }: { category?: string; search?: string; city?: string } = {}) {
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

  if (city) {
    // `city` is always the exact DB string chosen from getCities() (the
    // accent-insensitive autocomplete only guides that choice), so both
    // sides of the ilike carry matching accents. Unlike the in-memory
    // `search` pass below, this DB-level ilike does NOT strip accents, so a
    // hand-built accent-stripped ?ciudad= URL would return zero results.
    query = query.ilike('city', city)
  }

  const { data, error } = await query

  if (error) return []

  if (search) {
    const normalize = (str: string) =>
      str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    const normalizedSearch = normalize(search.trim())

    const fuzzyMatch = (field: string): boolean => {
      const normalizedField = normalize(field)
      // 1. El campo contiene el término exacto: "barberia" incluye "barber"
      if (normalizedField.includes(normalizedSearch)) return true

      // 2. Coincidencia por palabras: CADA palabra del término debe coincidir
      //    con alguna palabra del campo por prefijo compartido. Para evitar
      //    falsos positivos, ambas palabras deben tener al menos 3 caracteres
      //    y compartir un prefijo de al menos 3 caracteres.
      //    Ej: "barberias" coincide con "barberia" (comparten "barberia");
      //    "oxxo" NO coincide con "av", "o", "col", etc. (prefijo < 3 chars).
      const sharesPrefix = (a: string, b: string) => {
        if (a.length < 3 || b.length < 3) return false
        const min = Math.min(a.length, b.length)
        let i = 0
        while (i < min && a[i] === b[i]) i++
        return i >= 3
      }

      const searchWords = normalizedSearch.split(/\s+/).filter(Boolean)
      const fieldWords = normalizedField.split(/\s+/).filter(Boolean)
      return searchWords.every(sw =>
        fieldWords.some(fw => sharesPrefix(sw, fw))
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
    .select('*, categories(*), business_hours(*), photos(*)')
    .eq('owner_id', user.id)
    .maybeSingle()
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
    city: (formData.get('city') as string)?.trim() || 'Tierra Blanca',
    state: (formData.get('state') as string)?.trim() || 'Veracruz',
    cover_image: (formData.get('cover_image') as string)?.trim() || null,
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
    city: (formData.get('city') as string)?.trim() || 'Tierra Blanca',
    state: (formData.get('state') as string)?.trim() || 'Veracruz',
    cover_image: (formData.get('cover_image') as string)?.trim() || null,
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

export async function getCities(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('businesses').select('city').eq('is_active', true)
  return [...new Set((data ?? []).map((r) => r.city as string))]
    .filter((c) => Boolean(c?.trim()))
    .sort((a, b) => a.localeCompare(b))
}

export async function getCitiesWithCount(): Promise<{ city: string; count: number }[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('businesses').select('city').eq('is_active', true)

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    const city = (row.city as string)?.trim()
    if (!city) continue
    counts.set(city, (counts.get(city) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => a.city.localeCompare(b.city))
}
