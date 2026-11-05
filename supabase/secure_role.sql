-- ============================================================
-- SEGURIDAD: impedir escalada de privilegios sobre profiles.role
-- Ejecutar en Supabase → SQL Editor (después de policies.sql)
--
-- Problema: la política "Actualizar perfil propio" permite que un
-- usuario actualice su propia fila de profiles, incluida la columna
-- `role`. Como el anon key es público, alguien podría ponerse
-- role = 'admin' desde el cliente. Este trigger lo bloquea: nadie
-- puede cambiar su propio `role` vía el cliente; solo se cambia con
-- la service_role key (panel de Supabase / backend de confianza).
-- ============================================================

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Si el role cambió y la petición NO viene de un rol privilegiado,
  -- se conserva el role anterior (se ignora el intento de cambio).
  if new.role is distinct from old.role then
    if auth.role() is distinct from 'service_role' then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_change on public.profiles;
create trigger trg_prevent_role_change
  before update on public.profiles
  for each row
  execute function public.prevent_role_change();
