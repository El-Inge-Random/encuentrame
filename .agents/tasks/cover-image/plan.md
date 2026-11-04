# Implementation Plan — Carga de imagen de portada (cover_image) con Supabase Storage

Proyecto: Encuentrame — Next.js 16.4.2 (App Router) + TypeScript + Supabase + Tailwind v4, en Windows con **Webpack** (nunca Turbopack).

## Contexto verificado durante la exploración

- `src/types/index.ts` → `Business` YA tiene el campo `cover_image: string | null`. No hace falta tocar el tipo ni migrar la columna (se asume que la columna `cover_image` ya existe en la tabla `businesses`; la migración inicial no se revisó, pero el tipo y los componentes ya la consumen).
- `src/components/business/BusinessCard.tsx` (línea ~26) y `src/app/negocio/[slug]/page.tsx` (línea ~24) YA renderizan `business.cover_image` con `next/image` (`<Image src={business.cover_image} fill .../>`). Solo falta permitir el hostname de Supabase Storage en `next.config.ts` para que no truene el render.
- `src/lib/supabase/client.ts` exporta `createClient()` (browser client, `createBrowserClient` de `@supabase/ssr`). Se usará en el form para subir el archivo desde el cliente.
- `src/app/actions/business.ts` → `createBusiness` y `updateBusiness` arman un `payload` plano y hacen insert/update. Hay que añadir `cover_image` al payload leyéndolo del `FormData`. NO se sube el archivo en el servidor.
- `src/components/business/BusinessForm.tsx` es `'use client'`, usa `<form action={handleSubmit}>` con `FormData`. Aquí va el input de archivo, preview, validación y la subida al bucket antes de llamar a la server action.
- `src/components/ui/input.tsx` envuelve `@base-ui/react/input` (primitivo controlado, pensado para texto). Para el archivo se usará un **`<input type="file">` nativo** (no el componente `Input`), con `className` de Tailwind para el estilo. lucide-react solo en client (el form ya es client, OK).
- `supabase/storage.sql` NO existe todavía (confirmado con búsqueda). Se crea nuevo, siguiendo el estilo de `supabase/policies.sql` (comentarios en español, `drop policy if exists` antes de `create policy`).
- Bucket/URL pública de Supabase: `https://ynoqkgwxlyrssbdpypnl.supabase.co/storage/v1/object/public/<bucket>/<path>` (según `NEXT_PUBLIC_SUPABASE_URL` en AGENTS.md).

### Decisiones de diseño (con razón)

1. **Subida desde el cliente, no desde el servidor.** Lo pide el task explícitamente y encaja con el patrón del proyecto (browser client + RLS/Storage policies `authenticated`). La server action solo persiste la URL string. Evita mover el binario a través de la server action (límite de payload) y mantiene el servidor sin responsabilidad de storage.
2. **Ruta única `${user.id}/${crypto.randomUUID()}.<ext>`.** Prefijar con el `user.id` agrupa los archivos por dueño y deja la puerta abierta a políticas más estrictas por carpeta en el futuro; `crypto.randomUUID()` (disponible en navegadores modernos vía `window.crypto`) evita colisiones y cache-busting. La extensión se deriva del `File.name`/`type`.
3. **Input de archivo nativo, no el componente `Input`.** El `Input` de `@base-ui` es un primitivo de texto controlado; `type="file"` es no controlado por naturaleza. Usar `<input type="file">` nativo evita incompatibilidades y warnings de React.
4. **Validación en cliente (tipo imagen + ≤5MB) antes de subir.** Falla rápido y da feedback inmediato con el mismo patrón de error visible (`setError`) que ya usa el form.
5. **Política de Storage por rol `authenticated`, no por carpeta.** El task lo especifica así (INSERT/UPDATE/DELETE para `auth.role() = 'authenticated'`, SELECT público). Es simple y suficiente para esta fase (solo portada).

---

## Pasos

- [ ] 1. Crear el SQL de Storage para el bucket `business-images`.
      Crea el bucket público (idempotente) y las políticas RLS sobre `storage.objects` acotadas a ese bucket: SELECT público, e INSERT/UPDATE/DELETE solo para `auth.role() = 'authenticated'`. Usa `drop policy if exists` antes de cada `create policy` y comentarios en español, igual que `supabase/policies.sql`.
      Files: `c:\Users\Alanis\Documents\github\encuentrame\supabase\storage.sql` (NUEVO)
      Contenido exacto a escribir:
      ```sql
      -- ============================================================
      -- STORAGE — Encuentrame
      -- Bucket público para imágenes de negocios (portada).
      -- Ejecutar en Supabase → SQL Editor.
      -- ============================================================

      -- ---------- BUCKET ----------
      -- Bucket público: cualquiera puede leer las imágenes por URL.
      insert into storage.buckets (id, name, public)
      values ('business-images', 'business-images', true)
      on conflict (id) do nothing;

      -- ---------- POLÍTICAS sobre storage.objects ----------
      -- Lectura pública de los objetos de este bucket.
      drop policy if exists "Imagenes negocio lectura publica" on storage.objects;
      create policy "Imagenes negocio lectura publica" on storage.objects
        for select using (bucket_id = 'business-images');

      -- Subir imágenes: solo usuarios autenticados.
      drop policy if exists "Imagenes negocio insert autenticado" on storage.objects;
      create policy "Imagenes negocio insert autenticado" on storage.objects
        for insert with check (
          bucket_id = 'business-images' and auth.role() = 'authenticated'
        );

      -- Actualizar imágenes: solo usuarios autenticados.
      drop policy if exists "Imagenes negocio update autenticado" on storage.objects;
      create policy "Imagenes negocio update autenticado" on storage.objects
        for update using (
          bucket_id = 'business-images' and auth.role() = 'authenticated'
        )
        with check (
          bucket_id = 'business-images' and auth.role() = 'authenticated'
        );

      -- Borrar imágenes: solo usuarios autenticados.
      drop policy if exists "Imagenes negocio delete autenticado" on storage.objects;
      create policy "Imagenes negocio delete autenticado" on storage.objects
        for delete using (
          bucket_id = 'business-images' and auth.role() = 'authenticated'
        );
      ```
      Verify: archivo creado y SQL sintácticamente coherente (no hay toolchain para ejecutar SQL localmente; el usuario lo corre en el SQL Editor). Confirmar visualmente que las 4 políticas y el insert del bucket están presentes.

- [ ] 2. Permitir el hostname de Supabase Storage en `next.config.ts`.
      Añadir a `images.remotePatterns` el objeto `{ protocol: 'https', hostname: 'ynoqkgwxlyrssbdpypnl.supabase.co', pathname: '/storage/v1/object/public/**' }`, CONSERVANDO el patrón de `images.unsplash.com` y el `transpilePackages: ['lucide-react', '@base-ui/react']`.
      Files: `c:\Users\Alanis\Documents\github\encuentrame\next.config.ts`
      Resultado esperado del bloque `images`:
      ```ts
      images: {
        remotePatterns: [
          { protocol: 'https', hostname: 'images.unsplash.com' },
          {
            protocol: 'https',
            hostname: 'ynoqkgwxlyrssbdpypnl.supabase.co',
            pathname: '/storage/v1/object/public/**',
          },
        ],
      },
      ```
      Verify: `npx tsc --noEmit` desde la raíz del proyecto → exit code 0 (sin errores de tipos en la config).

- [ ] 3. Leer y persistir `cover_image` en las server actions.
      En `createBusiness` y `updateBusiness`, leer `formData.get('cover_image')` y agregarlo al `payload` como `string | null`. La server action NO sube el archivo; solo guarda la URL (o `null` si viene vacío). Normalizar: `const coverImage = (formData.get('cover_image') as string)?.trim() || null`.
      Files: `c:\Users\Alanis\Documents\github\encuentrame\src\app\actions\business.ts`
      - En `createBusiness`, dentro del objeto `payload`, añadir: `cover_image: (formData.get('cover_image') as string)?.trim() || null,`
      - En `updateBusiness`, dentro del objeto `payload`, añadir la misma línea: `cover_image: (formData.get('cover_image') as string)?.trim() || null,`
      - No tocar la lógica de slug, revalidatePath ni redirect.
      Verify: `npx tsc --noEmit` → exit code 0.

- [ ] 4. Añadir input de archivo, preview, validación y subida al bucket en `BusinessForm.tsx`.
      Convertir el form para que, antes de llamar a la server action, suba (si hay archivo nuevo) la imagen al bucket `business-images` con el browser client y pase la public URL en el `FormData` como `cover_image`; si no hay archivo nuevo, conservar `business?.cover_image`. Mantener los errores visibles con `setError`.
      Files: `c:\Users\Alanis\Documents\github\encuentrame\src\components\business\BusinessForm.tsx`
      Cambios concretos:
      - Importar el browser client: `import { createClient } from '@/lib/supabase/client'`.
      - Importar `Image` de `next/image` para el preview de la portada existente/seleccionada: `import Image from 'next/image'`.
      - Nuevo estado:
        ```ts
        const [file, setFile] = useState<File | null>(null)
        const [preview, setPreview] = useState<string | null>(business?.cover_image ?? null)
        ```
      - Handler de selección de archivo con validación (tipo imagen + ≤5MB):
        ```ts
        function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
          setError('')
          const f = e.target.files?.[0]
          if (!f) return
          if (!f.type.startsWith('image/')) {
            setError('El archivo debe ser una imagen.')
            e.target.value = ''
            return
          }
          if (f.size > 5 * 1024 * 1024) {
            setError('La imagen no debe superar los 5 MB.')
            e.target.value = ''
            return
          }
          setFile(f)
          setPreview(URL.createObjectURL(f))
        }
        ```
      - En `handleSubmit`, ANTES de llamar a `createBusiness`/`updateBusiness`, subir el archivo si existe y setear el campo `cover_image` en el `FormData`:
        ```ts
        async function handleSubmit(formData: FormData) {
          setLoading(true)
          setError('')

          let coverImageUrl = business?.cover_image ?? null

          if (file) {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
              setError('Debes iniciar sesión para subir una imagen.')
              setLoading(false)
              return
            }
            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
            const path = `${user.id}/${crypto.randomUUID()}.${ext}`
            const { error: uploadError } = await supabase
              .storage
              .from('business-images')
              .upload(path, file, { upsert: false, contentType: file.type })
            if (uploadError) {
              setError('No se pudo subir la imagen: ' + uploadError.message)
              setLoading(false)
              return
            }
            const { data: pub } = supabase.storage.from('business-images').getPublicUrl(path)
            coverImageUrl = pub.publicUrl
          }

          formData.set('cover_image', coverImageUrl ?? '')

          const result = business
            ? await updateBusiness(business.id, formData)
            : await createBusiness(formData)
          if (result?.error) {
            setError(result.error)
            setLoading(false)
          }
        }
        ```
      - Añadir el bloque de UI del input de archivo + preview dentro del `<form>` (p. ej. justo después del campo de descripción o al inicio). Usar input nativo (no el componente `Input`):
        ```tsx
        <div>
          <Label htmlFor="cover_image">Imagen de portada</Label>
          {preview && (
            <div className="relative mt-2 h-40 w-full overflow-hidden rounded-lg border border-input">
              <Image src={preview} alt="Vista previa de portada" fill className="object-cover" unoptimized />
            </div>
          )}
          <input
            id="cover_image"
            name="cover_image_file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-2 block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-purple-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-purple-700 hover:file:bg-purple-100"
          />
          <p className="mt-1 text-xs text-gray-400">JPG o PNG, máximo 5 MB.</p>
        </div>
        ```
        Notas:
        - El `name` del input de archivo es `cover_image_file` (o puede omitirse el `name`) a propósito, para que el binario NO viaje en el `FormData` hacia la server action; la URL se inyecta aparte con `formData.set('cover_image', ...)`.
        - `unoptimized` en el `<Image>` del preview evita que el optimizador intente procesar un blob `URL.createObjectURL` (que no es un host remoto permitido). El preview de una `cover_image` ya persistida (URL de Supabase) también funciona con `unoptimized`; alternativamente se puede dejar que el optimizador la maneje, pero `unoptimized` cubre ambos casos sin romper.
      - Opcional pero recomendado: liberar el objeto URL del preview con `useEffect(() => () => { if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview) }, [preview])` para evitar fugas de memoria.
      Verify: `npx tsc --noEmit` → exit code 0 (comprueba tipos del browser client, `crypto.randomUUID`, `React.ChangeEvent`, etc.).

- [ ] 5. Verificación final del build completo.
      Compilar el proyecto con el toolchain real (Webpack, ya configurado en el script `build`). NO ejecutar `npm run dev`.
      Files: — (sin cambios; es verificación)
      Verify:
      - `npx tsc --noEmit` desde `c:\Users\Alanis\Documents\github\encuentrame` → exit code 0, sin errores de tipos.
      - `npm run build` desde `c:\Users\Alanis\Documents\github\encuentrame` (ya trae `--webpack`) → build exitoso sin errores. En particular, sin el error `hostname ... not configured` para imágenes de Supabase y sin errores de límites server/client (lucide/base-ui solo en client).

---

## Notas y suposiciones

- Se asume que la columna `cover_image` YA existe en la tabla `businesses` (el tipo `Business` y los dos componentes de display ya la usan). Si al correr el `insert`/`update` Supabase reportara que la columna no existe, habría que agregar `alter table businesses add column if not exists cover_image text;` — pero no se incluye porque todo el código existente da por hecho que la columna está. Si el implementador detecta lo contrario al probar, añadir esa línea a `supabase/storage.sql` o a una migración.
- El bucket es público por diseño (las URLs `getPublicUrl` deben ser legibles por cualquiera para mostrarse en la landing y el detalle). Las políticas de INSERT/UPDATE/DELETE por `authenticated` son laxas (cualquier usuario autenticado puede escribir en el bucket); es lo que pide el task para esta fase "solo portada". Un endurecimiento futuro (restringir por carpeta `user.id`) queda fuera de alcance.
- No se introducen dependencias nuevas. No se cambian los scripts a Turbopack.
- `crypto.randomUUID()` está disponible en el navegador (contexto seguro: `localhost` y HTTPS), que es donde corre este código (`'use client'`).

---

## Verificación ejecutada (iteración 1)

Comandos corridos desde `c:\Users\Alanis\Documents\github\encuentrame`:

- `npx tsc --noEmit` → **exit code 0** (sin errores de tipos).
- `npm run build` (usa `next build --webpack`) → **exit code 0**, build exitoso:
  - `✓ Compiled successfully`
  - `✓ Finished TypeScript`
  - `✓ Collecting page data` / `✓ Generating static pages (3/3)`
  - Sin el error `hostname ... not configured`; el hostname de Supabase Storage quedó registrado en `next.config.ts`.
  - Única advertencia: `The "middleware" file convention is deprecated` — **preexistente y ajena a este cambio** (no toca `middleware.ts`).

Archivos tocados: `supabase/storage.sql` (nuevo), `next.config.ts`, `src/app/actions/business.ts`, `src/components/business/BusinessForm.tsx`. `BusinessCard.tsx` y `negocio/[slug]/page.tsx` se verificaron y siguen usando `business.cover_image` con `next/image` sin cambios.
