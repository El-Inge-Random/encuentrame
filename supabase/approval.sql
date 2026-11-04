-- ============================================================
-- APROBACIÓN DE NEGOCIOS — columna `status`
-- Ejecutar en Supabase → SQL Editor (NO tenemos acceso directo a
-- Supabase; el usuario corre este archivo a mano).
--
-- Orden de ejecución:
--   1) supabase/approval.sql            (este archivo: columna + datos)
--   2) supabase/approval_policies.sql   (RLS pública nueva + admin + trigger)
--
-- Correr ANTES de probar la app: sin la columna, los selects que la
-- referencian fallarían.
-- ============================================================

-- Agrega la columna de estado de aprobación. Por defecto los negocios
-- nuevos quedan en 'pending' (pendientes de revisión por el admin).
alter table businesses
  add column if not exists status text not null default 'pending'
  check (status in ('pending', 'approved', 'rejected'));

-- Aprueba TODO lo que existe al momento de la migración (los 10 negocios
-- seed/demo y cualquier negocio previo), para que el público no deje de
-- verlos tras agregar la columna. Correr UNA sola vez tras agregar la
-- columna; es idempotente (solo toca filas que siguen en 'pending').
update businesses set status = 'approved' where status = 'pending';

-- Índice opcional para filtrar/ordenar por estado (lecturas públicas y
-- panel admin consultan por status con frecuencia).
create index if not exists idx_businesses_status on businesses(status);
