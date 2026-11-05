-- ============================================================
-- ENDURECER STORAGE: escritura acotada a la carpeta del dueño
-- Ejecutar en Supabase → SQL Editor (reemplaza las policies de escritura
-- de storage.sql que solo exigían 'authenticated').
--
-- Problema: insert/update/delete sobre el bucket business-images solo
-- pedían auth.role()='authenticated'. Los archivos se suben a
-- {user.id}/{uuid}.ext, pero nada obligaba a que el primer segmento fuera
-- el uid de quien sube -> un autenticado podía borrar/sobrescribir imágenes
-- en la carpeta de otro dueño.
--
-- Fix: exigir que el primer segmento de la ruta sea el uid del usuario.
-- La LECTURA pública se mantiene (el bucket es público).
-- ============================================================

-- INSERT: solo en la propia carpeta ({uid}/...)
drop policy if exists "business-images insert autenticado" on storage.objects;
drop policy if exists "Imagenes negocio insert propio" on storage.objects;
create policy "Imagenes negocio insert propio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'business-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: solo objetos de la propia carpeta
drop policy if exists "business-images update autenticado" on storage.objects;
drop policy if exists "Imagenes negocio update propio" on storage.objects;
create policy "Imagenes negocio update propio" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'business-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'business-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: solo objetos de la propia carpeta
drop policy if exists "business-images delete autenticado" on storage.objects;
drop policy if exists "Imagenes negocio delete propio" on storage.objects;
create policy "Imagenes negocio delete propio" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'business-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- NOTA: la policy de SELECT pública del bucket (lectura de todos) definida
-- en storage.sql NO se toca: las imágenes deben seguir siendo visibles al
-- público en el directorio.
