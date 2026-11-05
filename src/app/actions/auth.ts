'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  const { error } = await supabase.auth.signInWithPassword(data)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const role = formData.get('role') as string
  // Si el registro vino desde un enlace de recomendación (?ref=recomendado),
  // se guarda en el perfil para luego heredarlo al negocio que cree el dueño.
  const refRaw = (formData.get('ref') as string)?.trim()
  const referred_by = refRaw === 'recomendado' ? 'recomendado' : null

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }

  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name,
      role: role === 'owner' ? 'owner' : 'user',
      referred_by,
    })
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { headers } = await import('next/headers')
  const h = await headers()
  const origin =
    h.get('origin') ??
    (h.get('host') ? `https://${h.get('host')}` : process.env.NEXT_PUBLIC_SITE_URL ?? '')

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/actualizar-password`,
  })

  if (error) return { error: error.message }
  return { success: true }
}


