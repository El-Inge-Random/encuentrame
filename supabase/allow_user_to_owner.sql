-- ============================================================
-- PERMITIR PROMOCIÓN user -> owner (al registrar un negocio)
-- Ejecutar en Supabase → SQL Editor DESPUÉS de fix_role_escalation_insert.sql
-- (reescribe la función prevent_role_change definida ahí).
--
-- Contexto: cuando un usuario con role 'user' crea un negocio, la app lo
-- promueve a 'owner' para que el rol refleje la realidad. El trigger de
-- seguridad revertía CUALQUIER cambio de rol hecho por el cliente, así que
-- bloqueaba también esta promoción legítima.
--
-- Nueva regla (UPDATE):
--   - admin / service_role: cualquier cambio de rol.
--   - el propio usuario: SOLO puede pasar de 'user' a 'owner'.
--   - cualquier otro cambio de rol por el cliente: se revierte.
--     (En particular, NADIE que no sea admin/service_role puede llegar a
--      'admin'.)
-- INSERT: igual que antes — un INSERT desde el cliente nunca crea 'admin'.
-- ============================================================

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if auth.role() is distinct from 'service_role' and new.role = 'admin' then
      new.role := 'user';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.role is distinct from old.role
       and auth.role() is distinct from 'service_role'
       and not public.is_admin() then
      -- Única transición permitida al propio usuario: user -> owner.
      if auth.uid() = old.id
         and old.role = 'user'
         and new.role = 'owner' then
        null; -- permitido
      else
        new.role := old.role; -- revertir cualquier otro cambio
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_change on public.profiles;
create trigger trg_prevent_role_change
  before insert or update on public.profiles
  for each row
  execute function public.prevent_role_change();
