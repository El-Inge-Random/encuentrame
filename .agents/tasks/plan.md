# Implementation Plan — Encuentrame

> **Project:** Encuentrame — directorio de locales y negocios locales, ciudad inicial: Tierra Blanca, Veracruz.
> **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase (auth + DB) · Leaflet (mapa)
> **Working directory for all commands:** `c:\Users\Alanis\Documents\apps ideas\encuentrameTB`

---

## Design decisions

- **Next.js 14 App Router** with `src/` directory and `@/*` alias — convención estándar moderna.
- **Supabase** para auth (email/password), base de datos (PostgreSQL) y Row-Level Security (RLS). Se usa `@supabase/ssr` con cookies para que las sesiones funcionen en SSR.
- **Middleware de Next.js** para proteger rutas de dashboard de dueños; las rutas públicas no requieren sesión.
- **Leaflet + react-leaflet** para el mapa interactivo de locales (open-source, sin API key).
- **shadcn/ui** sobre Tailwind para componentes accesibles y consistentes.
- **Server Actions** para mutaciones (crear/editar local, subir horarios) — evita una capa API extra.
- **Categorías hardcodeadas inicialmente** (barbería, comida, farmacia, etc.) en un enum de TypeScript; se pueden migrar a tabla DB después.
- **Sin Docker local** — se asume un proyecto Supabase cloud ya creado; las variables de entorno son el puente.

---

## Step 1 — Scaffold Next.js

**What:** Run `create-next-app` inside the workspace to bootstrap the project.

```
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

If the command fails because the directory is not empty, re-run with `--force` appended.

**Files created by scaffold:** `src/app/`, `src/app/layout.tsx`, `src/app/page.tsx`, `tailwind.config.ts`, `next.config.ts`, `tsconfig.json`, `package.json`, `eslint.config.mjs`, `public/`, etc.

**Verify:** `npm run build` exits with code 0 (default scaffold must build clean before any changes).

---

## Step 2 — Install dependencies

**What:** Install runtime libraries, then initialise shadcn/ui, then add the required shadcn components.

```bash
npm install @supabase/supabase-js @supabase/ssr leaflet react-leaflet @types/leaflet lucide-react date-fns
npx shadcn@latest init -y
npx shadcn@latest add button card input label select badge avatar dropdown-menu sheet dialog toast
```

`shadcn init` will ask about the style (default: New York) and base colour (default: zinc) — accept defaults with `-y`.

**Files modified/created:** `package.json`, `package-lock.json`, `components.json`, `src/components/ui/` (button, card, input, label, select, badge, avatar, dropdown-menu, sheet, dialog, toast, toaster, use-toast).

**Verify:** `npm run build` still exits 0.

---

## Step 3 — Environment files

**What:** Create `.env.local` with placeholder Supabase credentials and `.env.local.example` for version control.

**Files to create:**

`c:\Users\Alanis\Documents\apps ideas\encuentrameTB\.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

`c:\Users\Alanis\Documents\apps ideas\encuentrameTB\.env.local.example`
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Also make sure `.gitignore` (created by Next.js scaffold) already contains `.env.local` — verify and add it if missing.

**Verify:** `cat .env.local.example` shows both variables.

---

## Step 4 — Supabase migration SQL

**What:** Create the initial database migration that defines all tables and RLS policies.

**File:** `supabase/migrations/001_initial.sql`

The migration must contain:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- PROFILES (one row per auth.users row)
-- ─────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  role        text not null default 'owner' check (role in ('owner', 'admin')),
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────
create table public.categories (
  id    serial primary key,
  name  text not null unique,
  icon  text,
  slug  text not null unique
);
alter table public.categories enable row level security;
create policy "Categories readable by all" on public.categories for select using (true);

insert into public.categories (name, icon, slug) values
  ('Barbería / Estética', '✂️', 'barberia'),
  ('Comida / Buffet',     '🍽️', 'comida'),
  ('Farmacia',            '💊', 'farmacia'),
  ('Papelería',           '📝', 'papeleria'),
  ('Ferretería',          '🔧', 'ferreteria'),
  ('Ropa',                '👕', 'ropa'),
  ('Electrónica',         '📱', 'electronica'),
  ('Servicios',           '🛠️', 'servicios'),
  ('Otro',                '📍', 'otro');

-- ─────────────────────────────────────────
-- BUSINESSES
-- ─────────────────────────────────────────
create table public.businesses (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  category_id   int  not null references public.categories(id),
  name          text not null,
  description   text,
  address       text,
  city          text not null default 'Tierra Blanca',
  state         text not null default 'Veracruz',
  phone         text,
  whatsapp      text,
  website       text,
  lat           double precision,
  lng           double precision,
  logo_url      text,
  cover_url     text,
  is_active     boolean not null default true,
  is_verified   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.businesses enable row level security;
create policy "Active businesses readable by all" on public.businesses
  for select using (is_active = true);
create policy "Owners can insert their own business" on public.businesses
  for insert with check (auth.uid() = owner_id);
create policy "Owners can update their own business" on public.businesses
  for update using (auth.uid() = owner_id);
create policy "Owners can delete their own business" on public.businesses
  for delete using (auth.uid() = owner_id);

-- ─────────────────────────────────────────
-- SCHEDULES (horarios por día)
-- ─────────────────────────────────────────
create table public.schedules (
  id            serial primary key,
  business_id   uuid not null references public.businesses(id) on delete cascade,
  day_of_week   int  not null check (day_of_week between 0 and 6), -- 0=domingo
  opens_at      time,
  closes_at     time,
  is_closed     boolean not null default false,
  unique (business_id, day_of_week)
);
alter table public.schedules enable row level security;
create policy "Schedules readable by all" on public.schedules for select using (true);
create policy "Owner can manage schedules" on public.schedules
  for all using (
    auth.uid() = (select owner_id from public.businesses where id = business_id)
  );

-- ─────────────────────────────────────────
-- PHOTOS
-- ─────────────────────────────────────────
create table public.photos (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  url           text not null,
  caption       text,
  created_at    timestamptz not null default now()
);
alter table public.photos enable row level security;
create policy "Photos readable by all" on public.photos for select using (true);
create policy "Owner can manage photos" on public.photos
  for all using (
    auth.uid() = (select owner_id from public.businesses where id = business_id)
  );

-- updated_at trigger for businesses
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger businesses_updated_at
  before update on public.businesses
  for each row execute procedure public.set_updated_at();
```

**Verify:** File exists at the correct path. SQL will be applied manually in Supabase Dashboard → SQL Editor (documented in README).

---

## Step 5 — TypeScript types

**What:** Create shared TypeScript types derived from the DB schema and business logic.

**File:** `src/types/index.ts`

```typescript
export type UserRole = 'owner' | 'admin'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
}

export interface Category {
  id: number
  name: string
  icon: string | null
  slug: string
}

export interface Schedule {
  id: number
  business_id: string
  day_of_week: number   // 0 = Sunday
  opens_at: string | null   // "HH:MM"
  closes_at: string | null  // "HH:MM"
  is_closed: boolean
}

export interface Photo {
  id: string
  business_id: string
  url: string
  caption: string | null
  created_at: string
}

export interface Business {
  id: string
  owner_id: string
  category_id: number
  name: string
  description: string | null
  address: string | null
  city: string
  state: string
  phone: string | null
  whatsapp: string | null
  website: string | null
  lat: number | null
  lng: number | null
  logo_url: string | null
  cover_url: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  // joined relations (optional)
  categories?: Category
  schedules?: Schedule[]
  photos?: Photo[]
  profiles?: Profile
}

export interface BusinessWithRelations extends Business {
  categories: Category
  schedules: Schedule[]
  photos: Photo[]
}

// ── Day helpers ──────────────────────────────
export const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'] as const
export type DayName = typeof DAY_NAMES[number]
```

**Verify:** `npx tsc --noEmit` exits 0 after this file is created (or after all lib/type files are created — see note at Step 10).

---

## Step 6 — Supabase client helpers

**What:** Create three Supabase client factories required by `@supabase/ssr`:
1. Browser client (for Client Components)
2. Server client (for Server Components and Server Actions)
3. Middleware client

**Files to create:**

**`src/lib/supabase/client.ts`**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Component — mutations ignored */ }
        },
      },
    }
  )
}
```

**`src/lib/supabase/middleware.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required for SSR
  const { data: { user } } = await supabase.auth.getUser()

  // Protect /dashboard routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**`src/middleware.ts`** (Next.js middleware entry point)
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Verify:** `npx tsc --noEmit` exits 0.

---

## Step 7 — Utility helpers

**What:** Create small utility functions used across the app.

**File:** `src/lib/utils.ts`

> Note: shadcn `init` may already create this file with a `cn()` helper. If it exists, merge — do not overwrite.

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DAY_NAMES } from '@/types'
import type { Schedule } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Returns "Abierto" / "Cerrado" based on current local time and schedules */
export function getOpenStatus(schedules: Schedule[]): {
  isOpen: boolean
  label: string
  nextChange: string | null
} {
  const now = new Date()
  const todayIndex = now.getDay() // 0=Sunday
  const todaySchedule = schedules.find(s => s.day_of_week === todayIndex)

  if (!todaySchedule || todaySchedule.is_closed || !todaySchedule.opens_at || !todaySchedule.closes_at) {
    return { isOpen: false, label: 'Cerrado hoy', nextChange: null }
  }

  const [openH, openM] = todaySchedule.opens_at.split(':').map(Number)
  const [closeH, closeM] = todaySchedule.closes_at.split(':').map(Number)
  const openMinutes  = openH  * 60 + openM
  const closeMinutes = closeH * 60 + closeM
  const nowMinutes   = now.getHours() * 60 + now.getMinutes()

  const isOpen = nowMinutes >= openMinutes && nowMinutes < closeMinutes
  return {
    isOpen,
    label: isOpen ? 'Abierto' : 'Cerrado',
    nextChange: isOpen ? todaySchedule.closes_at : todaySchedule.opens_at,
  }
}

/** Formats a "HH:MM:SS" time string to "HH:MM" */
export function formatTime(time: string | null): string {
  if (!time) return '--'
  return time.substring(0, 5)
}

/** Returns slug-safe version of a string */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
```

**Verify:** `npx tsc --noEmit` exits 0.

---

## Step 8 — Server Actions

**What:** Create all data-fetching and mutation server actions.

### `src/actions/businesses.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Business, BusinessWithRelations } from '@/types'

export async function getBusinesses(params?: {
  categorySlug?: string
  search?: string
  city?: string
}) {
  const supabase = await createClient()
  let query = supabase
    .from('businesses')
    .select(`
      *,
      categories (*),
      schedules (*),
      photos (*)
    `)
    .eq('is_active', true)
    .order('name')

  if (params?.city) query = query.eq('city', params.city)
  if (params?.categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', params.categorySlug)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }
  if (params?.search) query = query.ilike('name', `%${params.search}%`)

  const { data, error } = await query
  if (error) throw error
  return data as BusinessWithRelations[]
}

export async function getBusinessById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('businesses')
    .select(`*, categories (*), schedules (*), photos (*)`)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as BusinessWithRelations
}

export async function getMyBusinesses() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('businesses')
    .select(`*, categories (*), schedules (*)`)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as BusinessWithRelations[]
}

export async function createBusiness(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const payload = {
    owner_id:    user.id,
    category_id: Number(formData.get('category_id')),
    name:        String(formData.get('name')),
    description: formData.get('description') as string | null,
    address:     formData.get('address') as string | null,
    phone:       formData.get('phone') as string | null,
    whatsapp:    formData.get('whatsapp') as string | null,
    lat:         formData.get('lat') ? Number(formData.get('lat')) : null,
    lng:         formData.get('lng') ? Number(formData.get('lng')) : null,
  }

  const { data, error } = await supabase
    .from('businesses')
    .insert(payload)
    .select()
    .single()
  if (error) throw error

  revalidatePath('/')
  revalidatePath('/dashboard')
  return data as Business
}

export async function updateBusiness(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const payload = {
    category_id: Number(formData.get('category_id')),
    name:        String(formData.get('name')),
    description: formData.get('description') as string | null,
    address:     formData.get('address') as string | null,
    phone:       formData.get('phone') as string | null,
    whatsapp:    formData.get('whatsapp') as string | null,
    lat:         formData.get('lat') ? Number(formData.get('lat')) : null,
    lng:         formData.get('lng') ? Number(formData.get('lng')) : null,
  }

  const { error } = await supabase
    .from('businesses')
    .update(payload)
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) throw error

  revalidatePath(`/local/${id}`)
  revalidatePath('/dashboard')
}

export async function deleteBusiness(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) throw error

  revalidatePath('/dashboard')
}
```

### `src/actions/schedules.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Schedule } from '@/types'

export async function upsertSchedules(businessId: string, schedules: Omit<Schedule, 'id'>[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const rows = schedules.map(s => ({ ...s, business_id: businessId }))
  const { error } = await supabase
    .from('schedules')
    .upsert(rows, { onConflict: 'business_id,day_of_week' })
  if (error) throw error

  revalidatePath(`/local/${businessId}`)
}
```

### `src/actions/auth.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email    = String(formData.get('email'))
  const password = String(formData.get('password'))
  const fullName = String(formData.get('full_name'))

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const email    = String(formData.get('email'))
  const password = String(formData.get('password'))

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
```

**Verify:** `npx tsc --noEmit` exits 0.

---

## Step 9 — Shared UI components

**What:** Create reusable components. Each sub-section is one file.

### `src/components/business-card.tsx`
A card that shows a business's logo, name, category badge, open/closed status, and a link to its detail page.

```typescript
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getOpenStatus } from '@/lib/utils'
import type { BusinessWithRelations } from '@/types'

interface Props { business: BusinessWithRelations }

export function BusinessCard({ business }: Props) {
  const { isOpen, label } = getOpenStatus(business.schedules ?? [])

  return (
    <Link href={`/local/${business.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="relative h-36 bg-muted rounded-t-lg overflow-hidden">
          {business.cover_url ? (
            <Image src={business.cover_url} alt={business.name} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-4xl">
              {business.categories?.icon ?? '📍'}
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">{business.name}</h3>
            <Badge variant={isOpen ? 'default' : 'secondary'} className="shrink-0 text-xs">
              {label}
            </Badge>
          </div>
          <Badge variant="outline" className="text-xs">{business.categories?.name}</Badge>
          {business.address && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1">{business.address}</span>
            </p>
          )}
          {business.phone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {business.phone}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
```

### `src/components/category-filter.tsx`
Client component — row of clickable category pills that drive a URL search param.

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { Category } from '@/types'

interface Props { categories: Category[]; selected?: string }

export function CategoryFilter({ categories, selected }: Props) {
  const router = useRouter()
  const params  = useSearchParams()

  function select(slug: string | null) {
    const p = new URLSearchParams(params.toString())
    if (slug) p.set('category', slug)
    else p.delete('category')
    router.push(`/?${p.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={!selected ? 'default' : 'outline'}
        className="cursor-pointer"
        onClick={() => select(null)}
      >
        Todos
      </Badge>
      {categories.map(cat => (
        <Badge
          key={cat.id}
          variant={selected === cat.slug ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => select(cat.slug)}
        >
          {cat.icon} {cat.name}
        </Badge>
      ))}
    </div>
  )
}
```

### `src/components/search-bar.tsx`
Client component — debounced search input that writes to the `q` URL param.

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function SearchBar() {
  const router  = useRouter()
  const params  = useSearchParams()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(params.get('q') ?? '')

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        const p = new URLSearchParams(params.toString())
        if (value) p.set('q', value)
        else p.delete('q')
        router.push(`/?${p.toString()}`)
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        className="pl-9"
        placeholder="Buscar negocio..."
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </div>
  )
}
```

### `src/components/map-view.tsx`
Client component — Leaflet map that renders pins for a list of businesses.

```typescript
'use client'

import { useEffect, useRef } from 'react'
import type { BusinessWithRelations } from '@/types'

interface Props {
  businesses: BusinessWithRelations[]
  center?: [number, number]
  zoom?: number
}

// Tierra Blanca, Veracruz approximate coordinates
const DEFAULT_CENTER: [number, number] = [18.4515, -96.3516]

export function MapView({ businesses, center = DEFAULT_CENTER, zoom = 13 }: Props) {
  const mapRef    = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return

    // Dynamic import to avoid SSR issues
    import('leaflet').then(L => {
      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView(center, zoom)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      businesses
        .filter(b => b.lat && b.lng)
        .forEach(b => {
          L.marker([b.lat!, b.lng!])
            .addTo(map)
            .bindPopup(`<strong>${b.name}</strong><br>${b.address ?? ''}`)
        })

      leafletRef.current = map
    })

    return () => {
      leafletRef.current?.remove()
      leafletRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={mapRef} className="w-full h-full min-h-[400px] rounded-lg z-0" />
}
```

### `src/components/schedule-table.tsx`
Displays a business's weekly schedule in a clean table.

```typescript
import { DAY_NAMES } from '@/types'
import type { Schedule } from '@/types'
import { formatTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function ScheduleTable({ schedules }: { schedules: Schedule[] }) {
  const byDay = new Map(schedules.map(s => [s.day_of_week, s]))

  return (
    <table className="w-full text-sm">
      <tbody>
        {DAY_NAMES.map((day, i) => {
          const s = byDay.get(i)
          return (
            <tr key={i} className="border-b last:border-0">
              <td className="py-1.5 font-medium w-28">{day}</td>
              <td className="py-1.5">
                {!s || s.is_closed
                  ? <Badge variant="secondary">Cerrado</Badge>
                  : <span>{formatTime(s.opens_at)} – {formatTime(s.closes_at)}</span>
                }
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
```

### `src/components/navbar.tsx`
Top navigation bar — shows the app logo, a link to home, and auth state (login or avatar + dropdown).

```typescript
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { signOut } from '@/actions/auth'
import { MapPin } from 'lucide-react'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="border-b bg-background sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <MapPin className="w-5 h-5" />
          Encuentrame
        </Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Mi panel</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="w-8 h-8 cursor-pointer">
                    <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <form action={signOut}>
                      <button type="submit" className="w-full text-left">Cerrar sesión</button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Entrar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/register">Registrar mi negocio</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
```

**Verify:** `npx tsc --noEmit` exits 0.

---

## Step 10 — Root layout and global CSS

**What:** Replace the default `src/app/layout.tsx` and `src/app/globals.css` generated by the scaffold.

**`src/app/layout.tsx`**
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/navbar'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Encuentrame — Tierra Blanca, Veracruz',
  description: 'Directorio de negocios locales en Tierra Blanca, Veracruz. Encuentra barberías, restaurantes, farmacias y más.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
```

**`src/app/globals.css`** — keep Tailwind directives, remove extra boilerplate:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Verify:** `npm run build` exits 0.

---

## Step 11 — Home page (`/`)

**What:** Replace the default `src/app/page.tsx` with the main listing page.

The page is a **Server Component** that:
1. Reads `?category` and `?q` search params.
2. Fetches all active businesses (filtered by params).
3. Fetches all categories for the filter bar.
4. Renders: hero banner → search bar + category filter → business grid + (collapsible) map view.

**`src/app/page.tsx`**
```typescript
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getBusinesses } from '@/actions/businesses'
import { BusinessCard } from '@/components/business-card'
import { CategoryFilter } from '@/components/category-filter'
import { SearchBar } from '@/components/search-bar'
import { MapView } from '@/components/map-view'
import type { Category } from '@/types'

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const { category, q } = await searchParams

  const supabase = await createClient()
  const [{ data: categoriesData }, businesses] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    getBusinesses({ categorySlug: category, search: q }),
  ])

  const categories = (categoriesData ?? []) as Category[]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-12 px-4">
        <div className="container mx-auto max-w-2xl text-center space-y-4">
          <h1 className="text-3xl font-bold">¿Qué estás buscando hoy?</h1>
          <p className="text-primary-foreground/80">
            Negocios locales en <strong>Tierra Blanca, Veracruz</strong> — siempre actualizados por sus dueños.
          </p>
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Category pills */}
        <Suspense>
          <CategoryFilter categories={categories} selected={category} />
        </Suspense>

        {/* Count */}
        <p className="text-sm text-muted-foreground">
          {businesses.length} {businesses.length === 1 ? 'negocio encontrado' : 'negocios encontrados'}
        </p>

        {/* Grid + Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {businesses.length === 0 ? (
              <p className="col-span-2 text-center py-16 text-muted-foreground">
                No encontramos negocios con esos filtros.
              </p>
            ) : (
              businesses.map(b => <BusinessCard key={b.id} business={b} />)
            )}
          </div>
          <div className="hidden lg:block sticky top-16 h-[calc(100vh-5rem)]">
            <MapView businesses={businesses} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Verify:** `npm run build` exits 0.

---

## Step 12 — Business detail page (`/local/[id]`)

**What:** Create the public detail page for a single business.

**`src/app/local/[id]/page.tsx`**
```typescript
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { MapPin, Phone, Globe, MessageCircle } from 'lucide-react'
import { getBusinessById } from '@/actions/businesses'
import { ScheduleTable } from '@/components/schedule-table'
import { MapView } from '@/components/map-view'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getOpenStatus } from '@/lib/utils'

interface PageProps { params: Promise<{ id: string }> }

export default async function BusinessPage({ params }: PageProps) {
  const { id } = await params
  let business
  try { business = await getBusinessById(id) }
  catch { notFound() }

  const { isOpen, label, nextChange } = getOpenStatus(business.schedules ?? [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      {/* Cover */}
      {business.cover_url && (
        <div className="relative h-56 rounded-xl overflow-hidden">
          <Image src={business.cover_url} alt={business.name} fill className="object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        {business.logo_url && (
          <Image src={business.logo_url} alt="" width={72} height={72} className="rounded-xl object-cover" />
        )}
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline">{business.categories?.name}</Badge>
            <Badge variant={isOpen ? 'default' : 'secondary'}>
              {label}{nextChange ? ` · hasta las ${nextChange.substring(0,5)}` : ''}
            </Badge>
          </div>
          {business.description && <p className="text-muted-foreground text-sm">{business.description}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact & schedule */}
        <div className="space-y-4">
          <h2 className="font-semibold">Horarios</h2>
          <ScheduleTable schedules={business.schedules ?? []} />

          <h2 className="font-semibold mt-4">Contacto</h2>
          <div className="space-y-2 text-sm">
            {business.address && (
              <p className="flex gap-2 items-start">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                {business.address}, {business.city}, {business.state}
              </p>
            )}
            {business.phone && (
              <a href={`tel:${business.phone}`} className="flex gap-2 items-center hover:underline">
                <Phone className="w-4 h-4" /> {business.phone}
              </a>
            )}
            {business.whatsapp && (
              <a
                href={`https://wa.me/${business.whatsapp.replace(/\D/g,'')}`}
                target="_blank"
                className="flex gap-2 items-center hover:underline text-green-600"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
            {business.website && (
              <a href={business.website} target="_blank" className="flex gap-2 items-center hover:underline">
                <Globe className="w-4 h-4" /> {business.website}
              </a>
            )}
          </div>
        </div>

        {/* Map */}
        {business.lat && business.lng && (
          <div className="h-64 md:h-auto rounded-lg overflow-hidden">
            <MapView
              businesses={[business]}
              center={[business.lat, business.lng]}
              zoom={16}
            />
          </div>
        )}
      </div>

      {/* Photos gallery */}
      {(business.photos?.length ?? 0) > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Fotos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {business.photos!.map(photo => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                <Image src={photo.url} alt={photo.caption ?? ''} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Verify:** `npm run build` exits 0.

---

## Step 13 — Auth pages

**What:** Create the login and register pages under `/auth`.

### `src/app/auth/login/page.tsx`
```typescript
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Bienvenido de vuelta</CardTitle>
          <CardDescription>Ingresa a tu cuenta de Encuentrame</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/register" className="text-primary hover:underline">
              Registra tu negocio
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

### `src/app/auth/register/page.tsx`
```typescript
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signUp, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Registra tu negocio</CardTitle>
          <CardDescription>Crea tu cuenta y empieza a aparecer en el directorio</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Verify:** `npm run build` exits 0.

---

## Step 14 — Dashboard pages

**What:** Create the owner dashboard: main listing of owned businesses + create/edit forms.

### `src/app/dashboard/layout.tsx`
```typescript
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Mi panel — Encuentrame' }
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {children}
    </div>
  )
}
```

### `src/app/dashboard/page.tsx`
Server component: lists the owner's businesses with edit/delete actions.

```typescript
import Link from 'next/link'
import { getMyBusinesses } from '@/actions/businesses'
import { BusinessCard } from '@/components/business-card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function DashboardPage() {
  const businesses = await getMyBusinesses()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis negocios</h1>
          <p className="text-muted-foreground text-sm">Administra la información de tus locales</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/nuevo"><Plus className="w-4 h-4 mr-1" />Agregar negocio</Link>
        </Button>
      </div>

      {businesses.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Aún no tienes negocios registrados.</p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/nuevo">Registra tu primer negocio</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {businesses.map(b => (
            <div key={b.id} className="relative">
              <BusinessCard business={b} />
              <div className="absolute top-2 right-2 flex gap-1">
                <Button size="sm" variant="secondary" asChild>
                  <Link href={`/dashboard/editar/${b.id}`}>Editar</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### `src/app/dashboard/nuevo/page.tsx`
Client form for creating a new business.

```typescript
'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createBusiness } from '@/actions/businesses'
import { BusinessForm } from '@/components/business-form'

export default function NuevoNegocioPage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      try {
        await createBusiness(formData)
        router.push('/dashboard')
        return null
      } catch (e: any) {
        return { error: e.message }
      }
    },
    null
  )

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Nuevo negocio</h1>
      <BusinessForm action={action} pending={pending} error={state?.error} />
    </div>
  )
}
```

### `src/app/dashboard/editar/[id]/page.tsx`
Server component fetches existing data; passes it to the client form.

```typescript
import { notFound } from 'next/navigation'
import { getBusinessById } from '@/actions/businesses'
import { EditBusinessForm } from '@/components/edit-business-form'

interface PageProps { params: Promise<{ id: string }> }

export default async function EditarNegocioPage({ params }: PageProps) {
  const { id } = await params
  let business
  try { business = await getBusinessById(id) }
  catch { notFound() }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Editar: {business.name}</h1>
      <EditBusinessForm business={business} />
    </div>
  )
}
```

**Verify:** `npm run build` exits 0.

---

## Step 15 — Business form components

**What:** Create `BusinessForm` (shared creation form) and `EditBusinessForm` (client wrapper for updates).

### `src/components/business-form.tsx`
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Category, Business } from '@/types'

interface Props {
  action: (formData: FormData) => void
  pending: boolean
  error?: string
  defaultValues?: Partial<Business>
}

export function BusinessForm({ action, pending, error, defaultValues }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState(
    defaultValues?.category_id?.toString() ?? ''
  )

  useEffect(() => {
    const sb = createClient()
    sb.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [])

  return (
    <form action={action} className="space-y-4">
      {/* Hidden fields for controlled select */}
      <input type="hidden" name="category_id" value={categoryId} />

      <div className="space-y-1">
        <Label htmlFor="name">Nombre del negocio *</Label>
        <Input id="name" name="name" required defaultValue={defaultValues?.name} />
      </div>

      <div className="space-y-1">
        <Label>Categoría *</Label>
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.icon} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" name="description" defaultValue={defaultValues?.description ?? ''} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" name="address" defaultValue={defaultValues?.address ?? ''} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ''} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={defaultValues?.whatsapp ?? ''} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="lat">Latitud</Label>
          <Input id="lat" name="lat" type="number" step="any" defaultValue={defaultValues?.lat ?? ''} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lng">Longitud</Label>
          <Input id="lng" name="lng" type="number" step="any" defaultValue={defaultValues?.lng ?? ''} />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Guardando...' : 'Guardar negocio'}
      </Button>
    </form>
  )
}
```

### `src/components/edit-business-form.tsx`
```typescript
'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { updateBusiness } from '@/actions/businesses'
import { BusinessForm } from './business-form'
import type { BusinessWithRelations } from '@/types'

export function EditBusinessForm({ business }: { business: BusinessWithRelations }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      try {
        await updateBusiness(business.id, formData)
        router.push('/dashboard')
        return null
      } catch (e: any) {
        return { error: e.message }
      }
    },
    null
  )

  return (
    <BusinessForm
      action={action}
      pending={pending}
      error={state?.error}
      defaultValues={business}
    />
  )
}
```

**Verify:** `npm run build` exits 0.

---

## Step 16 — next.config.ts and final configuration

**What:** Update `next.config.ts` to allow remote image domains (for logos/covers stored in Supabase Storage) and to handle the Leaflet CSS import from CDN.

**File:** `next.config.ts`
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'unpkg.com' },
    ],
  },
}

export default nextConfig
```

**Verify:** `npm run build` exits 0.

---

## Step 17 — README

**What:** Create a `README.md` documenting setup, env vars, Supabase migration, and dev commands.

**File:** `README.md`

Content must include:
1. Project description (Encuentrame — directorio local, Tierra Blanca, Veracruz).
2. Tech stack summary.
3. **Setup instructions:**
   - Clone repo.
   - `npm install`
   - Copy `.env.local.example` to `.env.local` and fill in Supabase URL + Anon Key.
   - In Supabase Dashboard → SQL Editor, run `supabase/migrations/001_initial.sql`.
   - `npm run dev`
4. Build: `npm run build`
5. Deploy note: Vercel — set env vars in project settings.

**Verify:** File exists and `npm run build` still passes.

---

## Step 18 — Final build verification

**What:** Run a clean build and fix any remaining TypeScript or ESLint errors that surfaced during integration.

```bash
npm run build
```

Common issues to watch for and fix:
- `'use client'` missing on components that use hooks (`useRouter`, `useState`, `useEffect`, `useActionState`).
- Leaflet dynamic import type errors — cast `L` to `any` where needed.
- `searchParams` / `params` must be awaited in Next.js 15-style (Promise params) — already written that way in this plan.
- `useActionState` return type mismatch with `signIn`/`signUp` — ensure those actions return `{ error: string } | undefined` (or `void` on success via redirect).
- `clsx` / `tailwind-merge` not installed after shadcn init — run `npm install clsx tailwind-merge` if missing.

After fixing, run `npm run build` one more time and confirm it exits 0 with no errors.

**Verify:** `npm run build` exits 0. Output shows `Route (app)` table with all routes compiled successfully.

---

## Dependency tree (build order)

```
Step 1  → scaffold
Step 2  → deps + shadcn (requires Step 1)
Step 3  → env files (requires Step 1)
Step 4  → SQL migration (standalone)
Step 5  → types (requires Step 1)
Step 6  → supabase clients (requires Steps 2, 5)
Step 7  → utils (requires Steps 2, 5)
Step 8  → server actions (requires Steps 6, 5)
Step 9  → UI components (requires Steps 2, 5, 6, 7, 8)
Step 10 → root layout (requires Steps 9)
Step 11 → home page (requires Steps 8, 9)
Step 12 → business detail page (requires Steps 8, 9)
Step 13 → auth pages (requires Steps 8)
Step 14 → dashboard pages (requires Steps 8, 9, 15)
Step 15 → business form components (requires Steps 8, 9)
Step 16 → next.config (requires Step 1)
Step 17 → README (standalone)
Step 18 → final build (requires all)
```
