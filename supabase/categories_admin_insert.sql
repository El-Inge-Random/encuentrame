-- ============================================================
-- CATEGORÍAS: permitir al admin crear nuevas
-- Ejecutar en Supabase → SQL Editor.
--
-- Hoy `categories` solo tiene policy de SELECT (lectura pública). Para que
-- el admin pueda insertar nuevas categorías desde el panel, se agrega una
-- policy de INSERT restringida a usuarios con role='admin'. Se usa
-- public.is_admin() (SECURITY DEFINER) para no disparar recursión de RLS.
-- ============================================================

drop policy if exists "Admin crea categorias" on categories;
create policy "Admin crea categorias" on categories
  for insert with check ( public.is_admin() );
