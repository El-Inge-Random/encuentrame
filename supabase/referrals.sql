-- ============================================================
-- TRACKING DE RECOMENDACIONES (referidos)
-- Ejecutar en Supabase → SQL Editor.
--
-- Idea: cuando alguien comparte el enlace de registro con ?ref=recomendado,
-- el perfil del dueño que se registra por ese link queda marcado, y al crear
-- su negocio esa marca se hereda al negocio. Así el admin puede contar
-- cuántos negocios llegaron por recomendación.
-- ============================================================

-- Marca en el perfil: de dónde vino el registro (p.ej. 'recomendado').
alter table profiles
  add column if not exists referred_by text;

-- Marca en el negocio: hereda el referred_by del perfil al crearse.
alter table businesses
  add column if not exists referred_by text;

-- NOTA RLS: la escritura de profiles/businesses ya está cubierta por las
-- policies existentes (el dueño gestiona su propia fila). No se requieren
-- policies nuevas. El admin ya puede leer todos los negocios (policy
-- "Admin ve todos los negocios") para hacer el conteo.
