-- ============================================================
-- FIX BLOQUEANTE: escalada a admin vía INSERT en profiles
-- Ejecutar en Supabase → SQL Editor.
--
-- Problema: el trigger prevent_role_change (secure_role.sql) solo cubría
-- UPDATE. En INSERT, un usuario con el anon key (público) podía crear su
-- perfil con role='admin' directamente, saltándose la server action signUp.
-- La policy de INSERT tampoco restringía el valor de role.
--
-- Doble defensa: (1) trigger que también cubre INSERT y nunca deja que un
-- no-admin se ponga 'admin'; (2) policy de INSERT que solo acepta user/owner.
-- ============================================================

-- 1) Trigger: cubrir INSERT y UPDATE.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- Un INSERT desde el cliente (no service_role) nunca puede crear un admin.
    if auth.role() is distinct from 'service_role' and new.role = 'admin' then
      new.role := 'user';
    end if;
  elsif tg_op = 'UPDATE' then
    -- Un no-admin/no-service_role no puede cambiar su role.
    if new.role is distinct from old.role
       and auth.role() is distinct from 'service_role' then
      new.role := old.role;
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

-- 2) Policy de INSERT: el cliente solo puede crear su propia fila con
--    role en ('user','owner'). 'admin' se asigna solo con service_role
--    (panel de Supabase).
drop policy if exists "Crear perfil propio" on profiles;
create policy "Crear perfil propio" on profiles
  for insert with check (
    auth.uid() = id and role in ('user', 'owner')
  );

-- 3) VERIFICACIÓN: confirmar que el único admin es el esperado.
--    (Correr este select y revisar el resultado manualmente.)
-- select id, full_name, role from profiles where role = 'admin';
