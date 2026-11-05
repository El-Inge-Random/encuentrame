# Implementation Plan — Re-solicitud de aprobación para negocios RECHAZADOS

Feature: cuando un negocio queda `rejected`, el admin escribe un motivo (`rejection_reason`),
el dueño lo ve, PUEDE editar su negocio/horarios/galería (igual que `approved`), y tiene un
botón "Volver a solicitar aprobación" que regresa el negocio a `pending` limpiando el motivo.
Solo `pending` queda en solo-lectura. Defensa en profundidad: la regla de transición
`rejected -> pending` del dueño vive en el TRIGGER SQL, no solo en la server action.

## Decisiones de diseño (grounded en el código leído)

- **Columna nueva `rejection_reason text` en `businesses`** (nullable). `getOwnerBusiness` usa
  `select('*, ...')`, así que la columna fluye automáticamente al objeto `Business` sin tocar el
  select; basta añadirla al tipo. Igual para `getAllBusinesses` (usa `select('*, ...')`).
- **El SQL va en un archivo nuevo `supabase/rejection_reason.sql`** que el usuario corre a mano
  (no hay acceso a Supabase). Reescribe la función `prevent_status_change_by_owner` cuya versión
  vigente está en `supabase/fix_admin_recursion.sql` (usa `public.is_admin()` SECURITY DEFINER).
- **Gating de edición**: hoy el código bloquea todo lo que no sea `approved`. El nuevo criterio es
  "bloquear solo `pending`". Se expresa con un helper booleano local `canEdit = status === 'approved' || status === 'rejected'` en cada punto (no se crea util nueva para no sobre-diseñar; es una condición de una línea repetida en pocos sitios).
- **`resubmitBusiness()` server action nueva** en `business.ts`: usa el user client (no service_role),
  por eso el trigger DEBE permitir explícitamente la transición `rejected -> pending` del dueño.
- **Admin rechaza con motivo**: `ApprovalButtons` abre un textarea inline (no `prompt()`), valida
  motivo no vacío, y llama `rejectBusiness(id, reason)`. `approveBusiness` limpia `rejection_reason`.
- No se agregan dependencias. lucide-react/@base-ui solo en client components (ya es el caso).
- Verificación con `npx tsc --noEmit` y `npm run build` (webpack). NO `npm run dev`.

---

- [ ] 1. SQL nuevo: columna `rejection_reason` + trigger ajustado.
      Crear `supabase/rejection_reason.sql` con comentarios en español. Debe (a) agregar la columna
      idempotente y (b) REESCRIBIR la función `prevent_status_change_by_owner` para permitir SOLO la
      transición `rejected -> pending` hecha por el dueño (`auth.uid() = new.owner_id`), revirtiendo
      cualquier otro cambio de status que no venga de admin/service_role. Mantener que admin y
      service_role pueden todo. NO recrear el trigger (ya existe apuntando a la función; `create or
      replace function` basta). Contenido literal:

      ```sql
      -- ============================================================
      -- RE-SOLICITUD DE APROBACIÓN + MOTIVO DE RECHAZO
      -- Ejecutar en Supabase → SQL Editor (NO hay acceso directo; el usuario
      -- corre este archivo a mano). Correr DESPUÉS de:
      --   supabase/approval.sql, supabase/approval_policies.sql,
      --   supabase/fix_admin_recursion.sql
      -- porque reescribe la función prevent_status_change_by_owner definida ahí.
      -- ============================================================

      -- 1) Columna para el motivo de rechazo que escribe el admin. El dueño la ve;
      --    se limpia (null) al aprobar o al volver a solicitar aprobación.
      alter table businesses
        add column if not exists rejection_reason text;

      -- 2) Trigger de seguridad: quién puede cambiar businesses.status.
      --    Regla:
      --      - admin o service_role: pueden cualquier cambio de status.
      --      - el dueño (auth.uid() = owner_id): SOLO puede la transición
      --        'rejected' -> 'pending' (la re-solicitud de aprobación).
      --      - cualquier otro cambio de status por un no-admin: se revierte.
      --    Se usa public.is_admin() (SECURITY DEFINER) para no disparar RLS.
      create or replace function public.prevent_status_change_by_owner()
      returns trigger
      language plpgsql
      security definer
      set search_path = public
      as $$
      begin
        if new.status is distinct from old.status then
          -- admin y service_role pasan sin restricción
          if auth.role() is distinct from 'service_role'
             and not public.is_admin() then
            -- ¿Es el dueño haciendo exactamente rejected -> pending?
            if auth.uid() = new.owner_id
               and old.status = 'rejected'
               and new.status = 'pending' then
              -- Transición de re-solicitud permitida: no hacer nada.
              null;
            else
              -- Cualquier otro intento de cambiar status: revertir.
              new.status := old.status;
            end if;
          end if;
        end if;
        return new;
      end;
      $$;
      ```

      Files: `supabase/rejection_reason.sql`
      Verify: no hay build de SQL; revisar que el archivo exista y el bloque sea sintácticamente
      coherente (usa `public.is_admin()` ya definida en `fix_admin_recursion.sql`). El usuario lo
      correrá manualmente. En este paso NO rompe el build de la app.

- [ ] 2. Tipos: añadir `rejection_reason` al interface `Business`.
      En `src/types/index.ts`, dentro de `interface Business`, agregar `rejection_reason: string | null`
      (cerca de `status`). `BusinessWithOwner` lo hereda automáticamente.
      Files: `src/types/index.ts`
      Verify: `npx tsc --noEmit` sin errores nuevos (los `as Business` existentes siguen compilando).

- [ ] 3. Admin server actions: `rejectBusiness(id, reason)` y `approveBusiness` limpia motivo.
      En `src/app/actions/admin.ts`:
      - Cambiar firma a `rejectBusiness(id: string, reason: string)`. Validar `reason?.trim()` no vacío
        (si vacío, `return { error: 'Debes indicar un motivo de rechazo.' }`). En el update setear
        `{ status: 'rejected', rejection_reason: reason.trim() }`. Conservar los `revalidatePath`
        existentes (`/admin/negocios`, `/admin`, `/`, `/buscar`).
      - En `approveBusiness`, cambiar el update a `{ status: 'approved', rejection_reason: null }`
        para limpiar el motivo al aprobar.
      Files: `src/app/actions/admin.ts`
      Verify: `npx tsc --noEmit` sin errores (nota: esto rompe la llamada en `ApprovalButtons` hasta
      el paso 7; ordenar para que el build final del paso 8 pase). El cambio de firma es intencional.

- [ ] 4. `business.ts`: ajustar gating de `updateBusiness` y añadir `resubmitBusiness`.
      En `src/app/actions/business.ts`:
      - En `updateBusiness`, reemplazar el bloqueo `if (existing.status !== 'approved')` por:
        bloquear SOLO `pending`. Es decir `if (existing.status === 'pending') return { error: 'Tu negocio está en revisión y no puede editarse.' }`.
        Mantener que el payload del dueño NO incluye `status` ni `rejection_reason`.
      - Añadir server action nueva `resubmitBusiness()` (sin args): obtener user; si no, `{ error: 'No autenticado' }`.
        Leer el negocio del dueño con `.select('id, status').eq('owner_id', user.id).maybeSingle()`.
        Si no existe → `{ error: 'No autorizado' }`. Si `status !== 'rejected'` → `{ error: 'Solo puedes volver a solicitar aprobación si tu negocio fue rechazado.' }`.
        Hacer `update({ status: 'pending', rejection_reason: null }).eq('id', business.id).eq('owner_id', user.id)`.
        Si error → `{ error: error.message }`. Luego `revalidatePath('/dashboard')` y `revalidatePath('/dashboard/negocio')`;
        `return { success: true }`. (No hace redirect; el componente cliente maneja el refresh.)
      Files: `src/app/actions/business.ts`
      Verify: `npx tsc --noEmit` sin errores.

- [ ] 5. `hours.ts` y `photos.ts`: permitir editar cuando `approved` O `rejected` (bloquear solo `pending`).
      - En `src/app/actions/hours.ts` (`saveBusinessHours`): reemplazar `if (business.status !== 'approved')`
        por `if (business.status === 'pending')` con mensaje `'Tu negocio está en revisión y no puede editarse.'`.
      - En `src/app/actions/photos.ts` (`addBusinessPhoto` y `deleteBusinessPhoto`): mismo cambio en ambos
        (`if (business.status === 'pending')` con el mismo mensaje). Los `.select('id, status')` ya traen status.
      Files: `src/app/actions/hours.ts`, `src/app/actions/photos.ts`
      Verify: `npx tsc --noEmit` sin errores.

- [ ] 6. Dashboard del dueño: habilitar edición en `rejected`, mostrar motivo y botón de re-solicitud.
      - `src/app/dashboard/negocio/page.tsx`: calcular `canEdit = isApproved || isRejected`. Pasar
        `readOnly={business ? !canEdit : false}` al `BusinessForm` (así `rejected` ya NO es solo lectura).
        Para la galería, renderizar `BusinessGallery` cuando `canEdit` (hoy solo `isApproved`); el texto
        "Podrás agregar fotos cuando sea aprobado" queda solo para `pending`. En el bloque `isRejected`,
        mostrar el `business.rejection_reason` (si existe) dentro del aviso rojo y renderizar el nuevo
        componente cliente `ResubmitButton` (paso 6b) pasándole nada (la action no necesita id).
      - `src/app/dashboard/page.tsx`: en el bloque `business.status === 'rejected'`, mostrar el motivo
        `business.rejection_reason` si existe (p.ej. "Motivo: ..."), y renderizar `ResubmitButton`.
        Actualizar los enlaces: permitir "Editar negocio"/"Editar horarios"/"Ver perfil público" también
        cuando `rejected` (cambiar las condiciones `isApproved` por `canEdit` donde aplique a editar;
        "Ver perfil público" solo tiene sentido si `isApproved`, porque el público no ve rejected —
        mantener ese enlace condicionado a `isApproved`).
      Files: `src/app/dashboard/negocio/page.tsx`, `src/app/dashboard/page.tsx`
      Verify: `npx tsc --noEmit` sin errores. (El render completo se valida en `npm run build`, paso 8.)

- [ ] 6b. Componente cliente `ResubmitButton`.
      Crear `src/components/business/ResubmitButton.tsx` con `'use client'`. Botón "Volver a solicitar
      aprobación" con estado `loading` y `error`. Al click llama `resubmitBusiness()`; si `result?.error`
      lo muestra; si `success`, llama `router.refresh()` (`useRouter` de `next/navigation`). Usar `Button`
      de `@/components/ui/button` e icono de `lucide-react` (p.ej. `RefreshCw`), consistente con
      `ApprovalButtons`/`BusinessGallery`.
      Files: `src/components/business/ResubmitButton.tsx`
      Verify: `npx tsc --noEmit` sin errores.

- [ ] 7. `BusinessForm`: aceptar el nuevo gating (sin cambios de lógica salvo que `rejected` ya no es readOnly).
      Revisar `src/components/business/BusinessForm.tsx`: el prop `readOnly` ya controla `isLocked`.
      Como el paso 6 pasa `readOnly=false` para `rejected`, el form queda editable automáticamente.
      VERIFICAR DURANTE IMPLEMENTACIÓN que no haya ninguna otra condición que mire `status==='approved'`
      dentro del form (no la hay según lectura actual). No se requiere cambio de código salvo que surja algo.
      Files: `src/components/business/BusinessForm.tsx` (probablemente sin cambios)
      Verify: `npx tsc --noEmit` sin errores.

- [ ] 8. Admin `ApprovalButtons`: pedir motivo al rechazar (textarea inline) y llamar `rejectBusiness(id, reason)`.
      En `src/components/admin/ApprovalButtons.tsx`:
      - Añadir estado `rejecting` (boolean) que, al pulsar "Rechazar" la primera vez, muestra un textarea
        inline + botones "Confirmar rechazo" / "Cancelar" (NO usar `prompt()`). Estado `reason` para el texto.
      - Validar `reason.trim()` no vacío antes de llamar; si vacío, mostrar error inline.
      - Llamar `await rejectBusiness(businessId, reason.trim())`; si devuelve `{ error }`, mostrarlo; si no,
        cerrar el textarea. Mantener el spinner de `loading`.
      - `approveBusiness` sigue llamándose sin args.
      Opcional (recomendado): aceptar un prop `rejectionReason?: string | null` para mostrar el motivo
      actual cuando `status === 'rejected'`; pasarlo desde `admin/negocios/page.tsx` (`rejectionReason={biz.rejection_reason}`).
      Files: `src/components/admin/ApprovalButtons.tsx`, y `src/app/admin/negocios/page.tsx` (solo si se añade el prop opcional)
      Verify: `npx tsc --noEmit` sin errores.

- [ ] 9. `horarios/page.tsx`: permitir gestionar horarios cuando `rejected` y mostrar el motivo.
      En `src/app/dashboard/horarios/page.tsx` (client, lee `status` del `GET /api/dashboard/business`):
      - El endpoint ya devuelve `business` completo (incluye `rejection_reason` tras el paso 1); extender
        el estado para guardar `rejectionReason` si se quiere mostrarlo.
      - Cambiar el guard `if (businessId && status !== 'approved')` para que SOLO bloquee `pending`
        (`status === 'pending'`). En la rama `rejected`, en vez de bloquear, permitir editar: mostrar el
        formulario de horarios normal, opcionalmente con un aviso rojo que incluya el motivo. Es decir,
        el bloqueo solo-lectura queda únicamente para `pending`.
      Files: `src/app/dashboard/horarios/page.tsx`
      Verify: `npx tsc --noEmit` sin errores.

- [ ] 10. Verificación final completa.
      Ejecutar en orden:
      1. `npx tsc --noEmit` → sin errores de tipos.
      2. `npm run build` (usa `next build --webpack`) → termina con "Compiled successfully" / build OK,
         generando rutas `/`, `/buscar`, `/negocio/[slug]`, `/admin/*`, `/dashboard/*`,
         `/api/dashboard/business` sin errores. NO correr `npm run dev`.
      Si algo falla, corregir antes de dar por terminado.
      Files: (ninguno — verificación)
      Verify: ambos comandos terminan con exit code 0.

## Nota de verificación (resultado real)
Ejecutado en Windows (webpack), en el orden de la tarea:
- `npx tsc --noEmit` → exit 0 (sin errores de tipos).
- `npm run build` (`next build --webpack`) → exit 0. "Compiled successfully in 6.7s",
  TypeScript OK, se generaron todas las rutas (`/`, `/buscar`, `/negocio/[slug]`,
  `/admin/*`, `/dashboard/*`, `/api/dashboard/business`). Única advertencia: el aviso
  pre-existente de deprecación de `middleware` → `proxy`, NO introducido por estos cambios.
NO se corrió `npm run dev`.

Archivos tocados:
- `supabase/rejection_reason.sql` (NUEVO — el usuario lo corre a mano; ver recordatorio abajo).
- `src/types/index.ts` (+ `rejection_reason: string | null` en `Business`).
- `src/app/actions/admin.ts` (`rejectBusiness(id, reason)` + `approveBusiness` limpia motivo).
- `src/app/actions/business.ts` (`updateBusiness` bloquea solo `pending`; nueva `resubmitBusiness()`).
- `src/app/actions/hours.ts`, `src/app/actions/photos.ts` (bloquear solo `pending`).
- `src/app/dashboard/page.tsx`, `src/app/dashboard/negocio/page.tsx` (edición en `rejected`, motivo + botón re-solicitar).
- `src/app/dashboard/horarios/page.tsx` (editar horarios en `rejected`, bloqueo solo `pending`).
- `src/components/business/ResubmitButton.tsx` (NUEVO — botón client de re-solicitud).
- `src/components/admin/ApprovalButtons.tsx` (textarea inline de motivo al rechazar).
- `src/app/admin/negocios/page.tsx` (pasa `rejectionReason` a `ApprovalButtons`).

## Recordatorio para el implementador (SQL manual)
El archivo `supabase/rejection_reason.sql` del paso 1 debe correrlo el usuario en el SQL Editor
de Supabase DESPUÉS de `approval.sql`, `approval_policies.sql` y `fix_admin_recursion.sql`.
Sin correrlo, la columna no existe y los updates que la referencian (reject/approve/resubmit)
fallarán en runtime (no en build). Dejar esto anotado en el resumen final al usuario.

## Gaps / supuestos
- Se asume que `businesses.owner_id` está disponible en el trigger como `new.owner_id` (lo está;
  es columna de la tabla). Los 10 negocios demo tienen `owner_id` null, pero esos los gestiona el
  admin, no un dueño, así que el camino `rejected->pending` del dueño no les aplica.
- No se toca `next.config.ts` ni se agregan dependencias.
