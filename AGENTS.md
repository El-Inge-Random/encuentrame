<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Encuentrame — Contexto del proyecto para Kiro

## ¿Qué es esto?
Directorio de negocios locales para **Tierra Blanca, Veracruz, México**.
Los dueños se registran y mantienen su info actualizada (horarios, fotos, descripción).
Los usuarios buscan negocios y filtran por categoría y si están abiertos ahora.

---

## Stack
- **Next.js 16.4.2** (App Router) + TypeScript
- **Supabase** — auth, PostgreSQL, storage
- **Tailwind CSS** + shadcn/ui
- **Leaflet** — mapas (cargado con dynamic import, ssr: false)
- **Lucide React** — iconos
- **date-fns** — formato de fechas

## Estructura de rutas
```
/                   → Landing: hero, categorías, negocios recientes
/buscar             → Búsqueda con filtros (categoría, abierto ahora)
/negocio/[slug]     → Detalle público del negocio
/auth/login         → Login
/auth/registro      → Registro (dueño o usuario)
/dashboard          → Panel del dueño (protegido)
/dashboard/negocio  → Crear/editar negocio
/dashboard/horarios → Gestionar horarios
/admin              → Panel super admin (solo rol 'admin')
/admin/negocios     → Ver/activar/verificar negocios
/admin/usuarios     → Ver usuarios, cambiar roles
/admin/categorias   → Ver categorías con conteo
```

## Archivos clave
```
src/
  app/
    actions/
      business.ts   → getBusinesses, getBusinessBySlug, createBusiness, updateBusiness, getCategories
      admin.ts      → getAllBusinesses, getAllUsers, getAdminStats, toggleBusinessActive, toggleBusinessVerified, changeUserRole
      auth.ts       → signIn, signUp, signOut
      hours.ts      → saveBusinessHours
    layout.tsx      → layout raíz, NavbarServer + Footer
    page.tsx        → landing page
    buscar/page.tsx
    negocio/[slug]/page.tsx
    dashboard/...
    admin/...
  components/
    layout/
      Navbar.tsx        → 'use client', menú principal
      NavbarServer.tsx  → lee sesión Supabase, pasa user a Navbar
      Footer.tsx        → importa CurrentYear
      CurrentYear.tsx   → 'use client', new Date().getFullYear()
      LogoAnimado.tsx   → SVG animado (en desarrollo, ver pendientes)
    business/
      BusinessCard.tsx      → 'use client' (usa isBusinessOpen con new Date())
      BusinessGrid.tsx      → server, renderiza BusinessCards
      BusinessGridClient.tsx → 'use client', filtra "abierto ahora" en cliente
      OpenBadge.tsx         → 'use client', badge Abierto/Cerrado
    admin/
      ToggleBusinessButton.tsx → 'use client'
      ChangeRoleButton.tsx     → 'use client'
    search/
      SearchBar.tsx  → 'use client'
      FilterBar.tsx
    map/
      BusinessMapWrapper.tsx → dynamic import con ssr:false
  lib/
    supabase/
      client.ts     → browser client
      server.ts     → server client (usa cookies de @supabase/ssr)
      middleware.ts → updateSession + guard para /admin y /dashboard
  middleware.ts     → llama updateSession
  types/index.ts    → Profile, Business, Category, BusinessHours, Photo, AdminStats, BusinessWithOwner
```

## Base de datos (Supabase)
Tablas: `profiles`, `categories`, `businesses`, `business_hours`, `photos`

### RLS habilitado — políticas necesarias:
```sql
-- Lectura pública
create policy "Negocios públicos visibles" on businesses for select using (is_active = true);
create policy "Categorías visibles" on categories for select using (true);
create policy "Horarios visibles" on business_hours for select using (true);
create policy "Fotos visibles" on photos for select using (true);
```

### Seed con 10 negocios demo: `supabase/seed.sql`
### Migration inicial: `supabase/migrations/001_initial.sql`
### Políticas RLS completas: `supabase/policies.sql` (SELECT público + dueño gestiona SU negocio/horarios/fotos + perfiles privados)
### Seguridad de rol: `supabase/secure_role.sql` (trigger que impide auto-promoverse a admin desde el cliente)
### Storage (bucket business-images): `supabase/storage.sql`
### Aprobación de negocios: `supabase/approval.sql` (columna `status`) + `supabase/approval_policies.sql` (RLS público approved + policies admin + trigger `prevent_status_change_by_owner`).
### Fix recursión RLS admin: `supabase/fix_admin_recursion.sql` (función `public.is_admin()` SECURITY DEFINER — las policies admin la usan en vez de consultar `profiles` dentro de una policy de `profiles`, que causaba recursión y rebotaba al admin de /admin).
### Motivo de rechazo + re-solicitud: `supabase/rejection_reason.sql` (columna `rejection_reason` + reescritura del trigger para permitir SOLO la transición dueño `rejected`→`pending`).
### FIX escalada admin vía INSERT: `supabase/fix_role_escalation_insert.sql` (trigger `prevent_role_change` ahora cubre INSERT+UPDATE; policy de INSERT en profiles solo acepta user/owner). BLOQUEANTE de seguridad resuelto.
### Storage acotado a carpeta del dueño: `supabase/storage_scope_folder.sql` (insert/update/delete solo en `{uid}/...`; lectura pública intacta).
### Recomendaciones (referidos): `supabase/referrals.sql` (columnas `referred_by` en profiles y businesses).
### Promoción user→owner: `supabase/allow_user_to_owner.sql` (reescribe `prevent_role_change` para permitir SOLO la transición del propio usuario user→owner al crear negocio; sigue bloqueando llegar a admin).
### Alta de categorías por admin: `supabase/categories_admin_insert.sql` (policy INSERT en categories con `public.is_admin()`).

### ORDEN de ejecución de los SQL en Supabase (base desde cero)
1. `migrations/001_initial.sql` → 2. `seed.sql` (opcional) → 3. `policies.sql` → 4. `secure_role.sql` → 5. `storage.sql` → 6. `approval.sql` → 7. `approval_policies.sql` → 8. `fix_admin_recursion.sql` → 9. `rejection_reason.sql` → 10. `fix_role_escalation_insert.sql` → 11. `storage_scope_folder.sql` → 12. `referrals.sql` → 13. `allow_user_to_owner.sql` → 14. `categories_admin_insert.sql`

## Features recientes (esta tanda)
- Sección "¿Qué es Encuentrame?" en landing (`components/layout/AboutSection.tsx`) con CTA a /recomendar.
- Recomendaciones: página `/recomendar` (copiar enlace + WhatsApp), enlace `?ref=recomendado`, tracking que hereda `referred_by` del perfil al negocio, tarjeta "Por Recomendación" en /admin.
- Al crear negocio: se garantiza el perfil (evita FK), se hereda `referred_by`, y si el perfil era `user` se promueve a `owner`.
- Subida de imagen: el archivo NO viaja al server action (se sube al Storage desde el cliente y solo se manda la URL) — evita el límite de 1MB de Server Actions.
- Alta de categorías desde /admin/categorias (`CreateCategoryForm` + `createCategory`), íconos en `components/business/categoryIcons.ts` (fuente única, 24 íconos).
- Ubicación generalizada (sin "Tierra Blanca" fijo): ciudad obligatoria, estado opcional.
- Confirmación de email DESACTIVADA en Supabase (decisión para pruebas; revisar antes de abrir registro masivo).

## Flujo de aprobación de negocios (status)
- `businesses.status`: `pending` | `approved` | `rejected` (default `pending`). Columna `rejection_reason` para el motivo que escribe el admin.
- Dueño crea negocio → `pending`. En `pending` NO puede editar negocio/horarios/fotos (solo lectura). En `rejected` y `approved` SÍ puede editar. Bloqueo en server actions + trigger, no solo UI.
- Admin aprueba/rechaza en `/admin/negocios` (`approveBusiness` limpia el motivo; `rejectBusiness(id, reason)` exige motivo). Botones en `components/admin/ApprovalButtons.tsx`.
- Dueño rechazado: ve el motivo, corrige datos y usa "Volver a solicitar aprobación" (`resubmitBusiness` en business.ts, `components/business/ResubmitButton.tsx`) → vuelve a `pending` y limpia el motivo.
- Público (getBusinesses, getBusinessBySlug, getCities, getCitiesWithCount) filtra `status='approved'` AND `is_active=true`.
- El dueño NO puede cambiar su propio status salvo la transición `rejected`→`pending` (trigger `prevent_status_change_by_owner`, usa `old.owner_id` y `public.is_admin()`).
- Enlace "Admin" en el navbar solo visible para admins (`NavbarServer` consulta el rol y pasa `isAdmin` a `Navbar`). La protección real sigue en middleware + layout de /admin.

### RLS — IMPORTANTE
- RLS está activo en TODAS las tablas. Sin política explícita, la tabla está cerrada (los INSERT/UPDATE fallan silenciosamente si falta la política).
- Al crear nuevas tablas o features que escriban en la BD, hay que agregar la política correspondiente en `supabase/policies.sql` y correrla en el SQL Editor.
- La escritura en `businesses`/`business_hours`/`photos` está restringida a `auth.uid() = owner_id`.
- `profiles.role` NO se puede cambiar desde el cliente (trigger `prevent_role_change`). El admin se crea con la service_role key desde el panel de Supabase.

## Variables de entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://ynoqkgwxlyrssbdpypnl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<la key real está en .env.local, no commitear>
```

## Usuario super admin
- **Nombre:** Luis Alanis
- **Email:** luislive100614@gmail.com
- **Rol:** admin
- Se crea en Supabase Auth y luego se inserta en profiles con role='admin'
- SQL para asignar admin (correr en SQL Editor tras crear el user en Auth):
  ```sql
  insert into profiles (id, full_name, role)
  select id, 'Luis Alanis', 'admin' from auth.users
  where email = 'luislive100614@gmail.com'
  on conflict (id) do update set role = 'admin';
  ```

## Recuperación de contraseña (flujo PKCE)
- `/auth/recuperar` → pide correo, llama `requestPasswordReset` (envía email con link a `/auth/callback?next=/auth/actualizar-password`)
- `/auth/callback/route.ts` → intercambia el `?code=` por sesión (`exchangeCodeForSession`) y redirige
- `/auth/actualizar-password` → client component que, al cargar, intercambia el code (si viene en la URL) o usa la sesión existente, luego hace `updateUser({ password })` con el browser client
- IMPORTANTE: Supabase usa PKCE, el link trae `?code=` que DEBE intercambiarse por sesión ANTES de `updateUser`, o da "Auth session missing!"
- Configurar en Supabase → Auth → URL Configuration → Redirect URLs: `http://localhost:3000/auth/callback` (y la URL de producción)

## Convenciones importantes
1. `export const dynamic = 'force-dynamic'` en TODOS los layouts y páginas que usan Supabase auth o fechas
2. `'use client'` en cualquier componente que use `new Date()`, hooks de React, o eventos
3. El mapa Leaflet siempre con `dynamic(() => import(...), { ssr: false })`
4. Búsqueda por texto: se hace en memoria para ignorar acentos. `normalize` usa `.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`. Coincidencia por palabra: una palabra debe ser PREFIJO real de la otra con diferencia de longitud ≤2 (tolera plurales como barberia/barberias, pero NO falsos positivos: "barberia"≠"barbacoa", "oxxo"≠direcciones). En `/buscar`, seleccionar una categoría LIMPIA el término de texto `q` (categorías = explorar, texto = buscar; no se combinan)
5. Filtro por ciudad: SÍ usa `.ilike('city', city)` a nivel BD (a diferencia del texto). `getCities()` y `getCitiesWithCount()` devuelven ciudades de negocios activos
6. Imágenes externas permitidas en next.config.ts: `images.unsplash.com`
7. lucide-react NO puede importarse en Server Components (usa createContext). Solo en client components. Iconos de categoría vía `components/business/CategoryIcon.tsx`
8. Componentes en `components/ui` que usan `@base-ui/react` DEBEN tener `'use client'` (button, badge, input, etc.)

## ENTORNO: Webpack, no Turbopack (máquina Windows)
- Turbopack NO funciona en esta máquina (bindings nativos win32 inválidos). Los scripts usan `next dev --webpack` y `next build --webpack`.
- Tailwind v4 con Webpack necesita `@tailwindcss/postcss` + `postcss.config.mjs` (NO el loader de turbopack).
- `next.config.ts` usa `transpilePackages: ['lucide-react', '@base-ui/react']` para que Webpack respete sus directivas `'use client'`.
- lucide-react fijado en `1.67.0` (la 1.57.0 venía sin archivos `.d.ts`, rompía el type-check).

## next.config.ts actual
```ts
const nextConfig = {
  transpilePackages: ['lucide-react', '@base-ui/react'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
}
```

## Hecho recientemente (histórico)
- ✅ LogoAnimado eliminado del navbar; ahora es solo el pin (MapPin naranja) + texto "Encuentrame" morado.
- ✅ Filtro por ciudad: `getCities`/`getCitiesWithCount`, `FilterBar` con autocomplete + chip, y searchParam `ciudad` en `/buscar`.
- ✅ Barra de búsqueda unificada en la landing: `components/search/HeroSearch.tsx` (píldora blanca con "qué buscas" + ciudad, divisor, botón naranja, dropdown con conteo de negocios, chips de categorías populares que conservan la ciudad).
- ✅ Recuperación de contraseña (ver sección arriba).
- ✅ Registro/edición de negocio: `components/business/BusinessForm.tsx` (client, muestra errores), campos city/state, `getOwnerBusiness` usa `.maybeSingle()`.
- ✅ Seguridad RLS completa + trigger anti escalada de rol.
- ✅ Portada (cover_image) y galería de hasta 6 fotos (`BusinessGallery.tsx` + `actions/photos.ts`) con Supabase Storage.
- ✅ Sistema de aprobación de negocios (status pending/approved/rejected) con bloqueo a nivel servidor.
- ✅ Re-solicitud de negocios rechazados + motivo de rechazo (ver "Flujo de aprobación" arriba).
- ✅ Enlace "Admin" en navbar solo para admins + fix de recursión RLS que impedía el acceso admin.

## Checklist de despliegue a PRODUCCIÓN
Auditoría completa en `.agents/tasks/prod-readiness-report.md`. Estado: código sólido (tsc + build limpios, sin secretos commiteados). Antes de abrir al público:
- [x] **B1 BLOQUEANTE** escalada a admin vía INSERT → corregido en `fix_role_escalation_insert.sql` (CORRER en Supabase). Verificar que el único admin sea el esperado: `select id, full_name, role from profiles where role='admin';`
- [x] **I1** `.env.local.example` corregido al nombre `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [x] **I3** Storage acotado a la carpeta del dueño → `storage_scope_folder.sql` (CORRER en Supabase).
- [ ] **I2** En el hosting (Vercel): definir `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y (recomendado) `NEXT_PUBLIC_SITE_URL`. En Supabase → Auth → URL Configuration → Redirect URLs: agregar `https://<dominio-prod>/auth/callback`.
- [ ] **I2** SMTP propio en Supabase (el integrado es limitado, no apto para prod).
- [ ] **I4** Decidir política de confirmación de email. Si se EXIGE confirmación, ajustar `signUp` para mostrar "revisa tu correo" en vez de redirigir a /dashboard (hoy rebota a login sin aviso). Si NO se exige, el flujo actual funciona.
- [ ] **M1** (no urgente) migrar `middleware.ts`→`proxy.ts` (`npx @next/codemod@canary middleware-to-proxy .`) en una rama; el warning no bloquea.
- [ ] **M5** commitear los SQL y componentes nuevos para que el repo refleje lo desplegado.
- Nota: `--webpack` en los scripts es compatible con Vercel (solo builds algo más lentos). `@tailwindcss/turbopack` quedó como dep sobrante, se puede quitar.

## Pendientes / trabajo en progreso
1. **Objetos huérfanos en Storage** — al borrar/reemplazar portada o foto de galería, el archivo viejo queda en el bucket `business-images`. Se podría borrar también del storage.
2. **Definir paleta de colores oficial** — DECISIÓN PENDIENTE con el usuario. Hoy se usa morado (#7C3AED / purple-700) + naranja (#F97316 / orange-500) + fuchsia como intermedio en degradados. Falta definir una paleta formal (primarios, secundarios, estados) y aplicarla de forma consistente. Afecta: landing, navbar, botones, badges, PWA (theme_color/background_color del manifest e íconos). Al definirla, revisar también los tokens de `globals.css`.
3. **PWA (en progreso)** — convertir la app en instalable (manifest, íconos, service worker). Se arranca con el estilo actual (degradado morado-naranja + pin). Si la paleta cambia (punto 2), regenerar íconos y theme colors.

(Descartados por decisión del usuario: preview embebido del perfil en el dashboard —ya hay botón "Ver perfil público"—, y recorte automático de imágenes.)

## Errores resueltos (para no repetirlos)
- `Date.now() while prerendering` → mover a 'use client' o agregar `dynamic = 'force-dynamic'`
- `cacheComponents incompatible with dynamic` → quitar cacheComponents y partialPrefetching de next.config.ts
- `hostname images.unsplash.com not configured` → agregar a remotePatterns en next.config.ts
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → la variable correcta es `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- RLS bloqueando lecturas públicas → ejecutar las políticas de SELECT en SQL Editor
- `Turbopack is not supported on this platform (win32)` → usar `--webpack` en los scripts; quitar bloque `turbopack` de next.config
- `react.createContext is not a function` / `createContext only works in Client Components` → el módulo (lucide-react, @base-ui/react) se coló al bundle RSC; agregar `'use client'` al wrapper y/o `transpilePackages`
- Estilos Tailwind no aplican con Webpack → falta `@tailwindcss/postcss` + `postcss.config.mjs`
- lucide-react 1.57.0 sin `.d.ts` (TS7016 en ~20 archivos) → fijar `lucide-react` en `1.67.0` y reinstalar node_modules
- Registro de negocio "no pasa nada" → faltaban políticas RLS de INSERT/UPDATE; además el form se tragaba el error (ahora `BusinessForm` lo muestra)
- "Auth session missing!" al cambiar contraseña → flujo PKCE, hay que `exchangeCodeForSession` antes de `updateUser`
- Admin con role='admin' en BD pero rebotado de /admin → recursión en la policy RLS que leía `profiles` dentro de una policy de `profiles`. Fix: función `public.is_admin()` SECURITY DEFINER (`fix_admin_recursion.sql`)
- `Cannot read properties of null (reading 'substring')` en /admin/negocios → los 10 negocios demo del seed tienen `owner_id = null`; manejar el caso (muestra "Sin dueño (demo)")
- Búsqueda con falsos positivos ("oxxo"→barberías, "barberia"→tacos con "barbacoa") → la regla de prefijo compartido era muy laxa; ahora exige prefijo real con dif ≤2 chars
- Categoría + texto daban 0 resultados confusos → al elegir categoría se limpia `q` (y el SearchBar se remonta con `key={q}`)
