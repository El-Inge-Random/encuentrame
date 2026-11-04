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
4. Búsqueda por texto: se hace en memoria para ignorar acentos. `normalize` usa `.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`. El fuzzy match requiere prefijo compartido de ≥3 chars entre palabras ≥3 chars (evita falsos positivos tipo "oxxo" matcheando direcciones)
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

## Pendientes / trabajo en progreso
1. **Dashboard del dueño** — portada (cover_image) YA hecha. Falta: galería de varias fotos (tabla `photos`), preview del perfil público.
3. ~~Mobile — menú hamburguesa en /admin~~ ✅ HECHO: `components/admin/AdminNav.tsx` (client) con sidebar desktop + barra/menú móvil; el layout sigue siendo server con la verificación de rol admin.
4. **Accesibilidad** — los autocompletes de ciudad no tienen ARIA combobox / navegación con teclado (flechas, Escape).
5. **Email de producción** — la recuperación de contraseña usa el SMTP de Supabase (limitado). Para producción configurar SMTP propio.

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
