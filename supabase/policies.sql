-- ============================================================
-- POLÍTICAS RLS — Encuentrame
-- Ejecutar en Supabase → SQL Editor
-- Cubre lectura pública + que cada dueño gestione SU negocio,
-- sus horarios y sus fotos.
-- ============================================================

-- Asegura RLS activado (normalmente ya lo está)
alter table businesses      enable row level security;
alter table categories      enable row level security;
alter table business_hours  enable row level security;
alter table photos          enable row level security;
alter table profiles        enable row level security;

-- ---------- LECTURA PÚBLICA ----------
drop policy if exists "Negocios activos visibles" on businesses;
create policy "Negocios activos visibles" on businesses
  for select using (is_active = true);

drop policy if exists "Categorias visibles" on categories;
create policy "Categorias visibles" on categories
  for select using (true);

drop policy if exists "Horarios visibles" on business_hours;
create policy "Horarios visibles" on business_hours
  for select using (true);

drop policy if exists "Fotos visibles" on photos;
create policy "Fotos visibles" on photos
  for select using (true);

-- ---------- PERFILES ----------
-- Cada usuario puede ver y editar su propio perfil; además puede
-- crearlo (el signUp hace upsert sobre profiles con su propio id).
drop policy if exists "Perfil propio visible" on profiles;
create policy "Perfil propio visible" on profiles
  for select using (auth.uid() = id);

drop policy if exists "Crear perfil propio" on profiles;
create policy "Crear perfil propio" on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Actualizar perfil propio" on profiles;
create policy "Actualizar perfil propio" on profiles
  for update using (auth.uid() = id);

-- ---------- NEGOCIOS: GESTIÓN POR EL DUEÑO ----------
-- El dueño ve sus propios negocios aunque estén inactivos.
drop policy if exists "Dueno ve sus negocios" on businesses;
create policy "Dueno ve sus negocios" on businesses
  for select using (auth.uid() = owner_id);

-- El dueño puede crear un negocio a su nombre.
drop policy if exists "Dueno crea negocio" on businesses;
create policy "Dueno crea negocio" on businesses
  for insert with check (auth.uid() = owner_id);

-- El dueño puede actualizar su negocio.
drop policy if exists "Dueno actualiza negocio" on businesses;
create policy "Dueno actualiza negocio" on businesses
  for update using (auth.uid() = owner_id);

-- ---------- HORARIOS: GESTIÓN POR EL DUEÑO ----------
drop policy if exists "Dueno gestiona horarios" on business_hours;
create policy "Dueno gestiona horarios" on business_hours
  for all
  using (
    exists (
      select 1 from businesses b
      where b.id = business_hours.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from businesses b
      where b.id = business_hours.business_id
        and b.owner_id = auth.uid()
    )
  );

-- ---------- FOTOS: GESTIÓN POR EL DUEÑO ----------
drop policy if exists "Dueno gestiona fotos" on photos;
create policy "Dueno gestiona fotos" on photos
  for all
  using (
    exists (
      select 1 from businesses b
      where b.id = photos.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from businesses b
      where b.id = photos.business_id
        and b.owner_id = auth.uid()
    )
  );
