-- ============================================================
-- FIX: recursión infinita en las policies que comprueban "es admin"
-- Ejecutar en Supabase → SQL Editor (reemplaza las policies admin de
-- approval_policies.sql que consultaban `profiles` dentro de una policy
-- de `profiles`, lo que causaba recursión y denegaba la lectura del rol).
--
-- Causa: "Admin ve perfiles" hacía SELECT sobre profiles DENTRO de la
-- policy de SELECT de profiles -> recursión -> Postgres deniega -> el
-- middleware leía el rol como null -> el admin era rebotado de /admin.
--
-- Solución: una función SECURITY DEFINER (is_admin) que comprueba el rol
-- SALTANDO RLS. Las policies la llaman en vez de volver a consultar
-- profiles con RLS activo.
-- ============================================================

-- Función que dice si el usuario actual es admin, sin disparar RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- PROFILES: el usuario ve su propio perfil + admin ve todos ----------
-- Reemplazamos la policy recursiva por uuna que usa is_admin().
-- (También conservamos el acceso al perfil propio, por si el usuario no es admin.)
drop policy if exists "Admin ve perfiles" on profiles;
drop policy if exists "Perfil propio visible" on profiles;
create policy "Perfil propio o admin" on profiles
  for select using (
    auth.uid() = id or public.is_admin()
  );

-- ---------- BUSINESSES: admin ve y actualiza todos (sin recursión) ----------
drop policy if exists "Admin ve todos los negocios" on businesses;
create policy "Admin ve todos los negocios" on businesses
  for select using ( public.is_admin() );

drop policy if exists "Admin actualiza negocios" on businesses;
create policy "Admin actualiza negocios" on businesses
  for update using ( public.is_admin() )
  with check ( public.is_admin() );

-- ---------- TRIGGER status: usar is_admin() (evita recursión también) ----------
create or replace function public.prevent_status_change_by_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if auth.role() is distinct from 'service_role'
       and not public.is_admin() then
      new.status := old.status;
    end if;
  end if;
  return new;
end;
$$;
