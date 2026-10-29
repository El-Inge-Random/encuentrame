# Implementation Plan — Admin Panel (Encuentrame)

> **Stack:** Next.js 16.4.2 · App Router · Supabase SSR · TypeScript strict · Tailwind CSS 4 · shadcn/ui
> **Verification command:** `npm run build` (must exit 0 with no TS/ESLint errors)
> **All text in Spanish. Use `export const instant = false` in every server page/layout.**

---

## Potential issues to watch

| Issue | Mitigation |
|---|---|
| **RLS on profiles table** — the admin supabase client uses the user's JWT; if RLS blocks reading other users' profiles, `getAllUsers()` returns empty. | Use a service-role client (SUPABASE_SERVICE_ROLE_KEY) for admin actions, or ensure the existing RLS policy on `profiles` allows admins to SELECT all rows. If service key is not available, add a `SELECT` policy: `profiles.role = 'admin'` for the authed user. |
| **Foreign key join for owner profile** — `businesses.owner_id` references `auth.users`, not `profiles`. `.select('*, profiles!businesses_owner_id_fkey(...)')` will fail. | Use `owner_id` column directly. Show truncated UUID in the UI. No join needed. |
| **Next.js 15+ async `searchParams`** — any page that reads `searchParams` must type it as `Promise<{...}>` and `await` it. | Admin pages do not use searchParams, so this is not a concern here. |
| **`instant` vs `dynamic`** — the codebase uses `export const instant = false`. Do NOT use `export const dynamic = 'force-dynamic'`. | Follow existing pattern exactly. |
| **shadcn Badge variant names** — available variants in this project: `default`, `secondary`, `destructive`, `outline`. There is no `success` or `warning` variant. | Use `className` overrides for custom colors (e.g., `<Badge className="bg-green-500 text-white">`). |
| **`getCategoriesWithCount` vs `getCategories`** — `getCategories()` in business.ts does not return business counts. | Add `getCategoriesWithCount()` to `src/app/actions/admin.ts`. |
| **TypeScript: count aggregate type** — Supabase `.select('*, businesses(count)')` returns `{ count: number }[]` for the nested relation. Type it as `{ businesses: { count: number }[] }` or cast with `as`. | Use explicit typing in the return value. |

---

## FEAT-001 — Infrastructure (middleware + server actions + types)

- [ ] 1. **Extend middleware admin guard** in `src/lib/supabase/middleware.ts`.
      After the existing `/dashboard` redirect block, add:
      ```ts
      if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
          const url = request.nextUrl.clone()
          url.pathname = '/auth/login'
          return NextResponse.redirect(url)
        }
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role !== 'admin') {
          const url = request.nextUrl.clone()
          url.pathname = '/'
          return NextResponse.redirect(url)
        }
      }
      ```
      The same `supabase` client already exists in the function — do not create a second one.
      Files: `src/lib/supabase/middleware.ts`
      Verify: `npm run build` — passes.

- [ ] 2. **Add types** to `src/types/index.ts`:
      ```ts
      export interface AdminStats {
        totalBusinesses: number
        activeBusinesses: number
        verifiedBusinesses: number
        totalUsers: number
        pendingVerification: number
        businessesPerCategory: { category: string; count: number }[]
      }
      export type BusinessWithOwner = Business & {
        profiles?: { full_name: string | null } | null
      }
      ```
      Files: `src/types/index.ts`
      Verify: `npm run build` — passes.

- [ ] 3. **Create `src/app/actions/admin.ts`** with `'use server'` directive.
      Implement all seven exported async functions — each starts with:
      ```ts
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { error: 'No autenticado' }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') return { error: 'No autorizado' }
      ```

      **a) `getAdminStats()`** — returns `AdminStats | { error: string }`:
      - `const { count: total } = await supabase.from('businesses').select('*', { count: 'exact', head: true })`
      - Same pattern for `is_active=true` (active) and `is_verified=false` (pending)
      - `const { count: verifiedCount } = await supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_verified', true)`
      - `const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })`
      - `const { data: perCat } = await supabase.from('businesses').select('category_id, categories(name)').eq('is_active', true)` — group client-side by category_id
      - Return assembled AdminStats object.

      **b) `getAllBusinesses()`** — returns `Business[] | { error: string }`:
      - `supabase.from('businesses').select('*, categories(name, icon, color)').order('created_at', { ascending: false })`
      - No `is_active` filter (admin sees all).
      - owner_id is already on the Business type — no join needed.

      **c) `getAllUsers()`** — returns `(Profile & { businessCount: number })[] | { error: string }`:
      - `supabase.from('profiles').select('*, businesses(count)').order('created_at', { ascending: false })`
      - Map result: `{ ...p, businessCount: (p.businesses as { count: number }[])?.[0]?.count ?? 0 }`

      **d) `toggleBusinessActive(id: string)`** — fetch current `is_active`, update to opposite, `revalidatePath('/admin/negocios')`.

      **e) `toggleBusinessVerified(id: string)`** — same pattern with `is_verified`, `revalidatePath('/admin/negocios')`.

      **f) `changeUserRole(userId: string, newRole: 'user' | 'owner')`** — update profiles, `revalidatePath('/admin/usuarios')`.

      **g) `getCategoriesWithCount()`** — returns `(Category & { businessCount: number })[] | { error: string }`:
      - `supabase.from('categories').select('*, businesses(count)').order('name')`
      - Map: `{ ...c, businessCount: (c.businesses as { count: number }[])?.[0]?.count ?? 0 }`

      Files: `src/app/actions/admin.ts`
      Verify: `npm run build` — passes with no TS errors.

---

## FEAT-002 — Admin UI (layout + 4 pages + 2 client components)

Depends on FEAT-001.

- [ ] 4. **Create `src/app/admin/layout.tsx`** (server component — pattern from `src/app/dashboard/layout.tsx`).
      ```tsx
      export const instant = false

      export default async function AdminLayout({ children }: { children: React.ReactNode }) {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) redirect('/auth/login')
        const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
        if (profile?.role !== 'admin') redirect('/')
        // render sidebar...
      }
      ```
      Sidebar: `bg-gray-900 text-white w-64`. Header shows `profile.full_name` and `user.email`.
      Nav links (use Lucide icons `LayoutDashboard`, `Store`, `Users`, `Tag`):
      - `/admin` → Dashboard
      - `/admin/negocios` → Negocios
      - `/admin/usuarios` → Usuarios
      - `/admin/categorias` → Categorías

      Active state: `hover:bg-gray-800 hover:text-purple-400`. Sign out button uses `<form action={signOut}>`.
      Main: `<main className="flex-1 bg-gray-100 p-6">{children}</main>`.
      Files: `src/app/admin/layout.tsx`
      Verify: `npm run build` — passes.

- [ ] 5. **Create `src/app/admin/page.tsx`** (admin dashboard, server component).
      ```tsx
      export const instant = false
      ```
      Call `getAdminStats()`. If error, show error message. Otherwise:
      - 5 metric Cards in a `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4`:
        Total Negocios, Activos, Verificados, Usuarios, Pendientes de Verificación.
        Each card: icon (Store, CheckCircle, ShieldCheck, Users, Clock) + number + label.
      - Below: "Negocios por Categoría" Card with a list `{ category, count }` — use Badge for count.
      Files: `src/app/admin/page.tsx`
      Verify: `npm run build` — passes.

- [ ] 6. **Create `src/components/admin/ToggleBusinessButton.tsx`** (`'use client'`).
      Props: `{ businessId: string; field: 'active' | 'verified'; currentValue: boolean }`.
      - `useState` for `pending` (loading state).
      - On click: call `toggleBusinessActive` or `toggleBusinessVerified` depending on `field`.
      - Button text: `field === 'active'` → currentValue ? 'Desactivar' : 'Activar'; `field === 'verified'` → currentValue ? 'Quitar Verificación' : 'Verificar'.
      - Button variant: `outline` size `sm`. Disable + show "..." while pending.
      Files: `src/components/admin/ToggleBusinessButton.tsx`
      Verify: `npm run build` — passes.

- [ ] 7. **Create `src/app/admin/negocios/page.tsx`** (server component).
      ```tsx
      export const instant = false
      ```
      Call `getAllBusinesses()`. Render inside a Card:
      - Page header: "Negocios" + total count.
      - `<table className="w-full text-sm">` with columns: Nombre, Categoría, Propietario, Estado, Verificación, Fecha, Acciones.
      - Propietario: `business.owner_id.slice(0, 8) + '...'` (no join).
      - Estado badge: `is_active` → `<Badge className="bg-green-100 text-green-800">Activo</Badge>` / `<Badge variant="destructive">Inactivo</Badge>`.
      - Verificación badge: `is_verified` → `<Badge className="bg-blue-100 text-blue-800">Verificado</Badge>` / `<Badge variant="outline">Pendiente</Badge>`.
      - Fecha: use `format(new Date(business.created_at), 'dd/MM/yyyy', { locale: es })` from `date-fns/locale`.
      - Acciones: two `ToggleBusinessButton` components.
      Files: `src/app/admin/negocios/page.tsx`
      Verify: `npm run build` — passes.

- [ ] 8. **Create `src/components/admin/ChangeRoleButton.tsx`** (`'use client'`).
      Props: `{ userId: string; currentRole: 'user' | 'owner' }`.
      On click: calls `changeUserRole(userId, currentRole === 'user' ? 'owner' : 'user')`.
      Button text: `currentRole === 'user'` ? 'Hacer Propietario' : 'Quitar Propietario'.
      Variant: `outline` size `sm`. Loading state.
      Files: `src/components/admin/ChangeRoleButton.tsx`
      Verify: `npm run build` — passes.

- [ ] 9. **Create `src/app/admin/usuarios/page.tsx`** (server component).
      ```tsx
      export const instant = false
      ```
      Call `getAllUsers()`. Render inside a Card:
      - Page header: "Usuarios" + total count.
      - Table columns: Nombre, ID, Rol, Registro, Negocios, Acciones.
      - Nombre: `profile.full_name || 'Sin nombre'`.
      - ID: `profile.id.slice(0, 8) + '...'`.
      - Rol badges: `admin` → `<Badge variant="destructive">Admin</Badge>`, `owner` → `<Badge className="bg-purple-100 text-purple-800">Propietario</Badge>`, `user` → `<Badge variant="outline">Usuario</Badge>`.
      - Registro: formatted date.
      - Negocios: show `businessCount` only if role is `owner`.
      - Acciones: `ChangeRoleButton` — only render if `profile.role !== 'admin'`.
      Files: `src/app/admin/usuarios/page.tsx`
      Verify: `npm run build` — passes.

- [ ] 10. **Create `src/app/admin/categorias/page.tsx`** (server component).
       ```tsx
       export const instant = false
       ```
       Call `getCategoriesWithCount()`. Render inside a Card:
       - Page header: "Categorías" + count.
       - List of rows: color circle (`<span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: cat.color ?? '#888' }}`), icon text (small gray), category name (bold), slug (gray), business count Badge.
       Files: `src/app/admin/categorias/page.tsx`
       Verify: `npm run build` — passes.

- [ ] 11. **Final build verification**.
       Run `npm run build`. Fix any remaining TypeScript or ESLint errors.
       Expected: build output lists routes `/admin`, `/admin/negocios`, `/admin/usuarios`, `/admin/categorias` with no errors.
       Files: any file flagged by the build output.
       Verify: `npm run build` exits 0.

---

## File manifest

**New files:**
- `src/lib/supabase/middleware.ts` (modified)
- `src/types/index.ts` (modified)
- `src/app/actions/admin.ts` (new)
- `src/app/admin/layout.tsx` (new)
- `src/app/admin/page.tsx` (new)
- `src/app/admin/negocios/page.tsx` (new)
- `src/app/admin/usuarios/page.tsx` (new)
- `src/app/admin/categorias/page.tsx` (new)
- `src/components/admin/ToggleBusinessButton.tsx` (new)
- `src/components/admin/ChangeRoleButton.tsx` (new)
