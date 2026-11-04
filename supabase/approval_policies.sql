-- ============================================================
-- APROBACIÓN DE NEGOCIOS — RLS + policies de admin + trigger
-- Ejecutar en Supabase → SQL Editor DESPUÉS de supabase/approval.sql.
--
-- Qué hace:
--   * Lectura pública: ahora exige status = 'approved' (además de activo).
--   * El dueño sigue viendo su propio negocio aunque esté pending/rejected.
--   * El admin (profiles.role = 'admin') puede ver y actualizar TODOS los
--     negocios, y leer los perfiles de los dueños (para mostrar su nombre).
--   * Trigger que impide que el dueño cambie `status` desde el cliente;
--     solo admin o la service_role pueden cambiarlo.
-- ============================================================

-- ---------- LECTURA PÚBLICA (reemplaza la de policies.sql) ----------
-- El público solo ve negocios aprobados y activos. Esta policy sustituye a
-- la "Negocios activos visibles" original (que solo filtraba is_active).
drop policy if exists "Negocios activos visibles" on businesses;
create policy "Negocios activos visibles" on businesses
  for select using (is_active = true and status = 'approved');

-- El dueño ya ve sus propios negocios por la policy "Dueno ve sus negocios"
-- (auth.uid() = owner_id) definida en policies.sql; NO se toca aquí, así que
-- sigue viendo su negocio aunque esté 'pending' o 'rejected'.

-- ---------- ADMIN: VE TODOS LOS NEGOCIOS ----------
drop policy if exists "Admin ve todos los negocios" on businesses;
create policy "Admin ve todos los negocios" on businesses
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------- ADMIN: ACTUALIZA NEGOCIOS ----------
-- Necesaria para que approveBusiness/rejectBusiness y los toggles
-- activo/verificado funcionen con el server client normal.
drop policy if exists "Admin actualiza negocios" on businesses;
create policy "Admin actualiza negocios" on businesses
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------- ADMIN: VE PERFILES ----------
-- Resuelve el bug de que el nombre del propietario salía null en el panel:
-- el embed profiles(full_name) en getAllBusinesses necesita que el admin
-- pueda leer perfiles ajenos.
drop policy if exists "Admin ve perfiles" on profiles;
create policy "Admin ve perfiles" on profiles
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------- TRIGGER: el dueño no puede cambiar `status` ----------
-- Análogo a prevent_role_change (supabase/secure_role.sql): si `status`
-- cambia y la petición NO viene de un admin ni de la service_role, se
-- conserva el status anterior (se ignora el intento de cambio). Así el dueño
-- no puede auto-aprobarse ni cambiar su estado desde el cliente.
create or replace function public.prevent_status_change_by_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if auth.role() is distinct from 'service_role'
       and not exists (
         select 1 from profiles p
         where p.id = auth.uid() and p.role = 'admin'
       ) then
      new.status := old.status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_status_change on public.businesses;
create trigger trg_prevent_status_change
  before update on public.businesses
  for each row
  execute function public.prevent_status_change_by_owner();
