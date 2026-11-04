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
