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
