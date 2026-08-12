-- ============================================================================
-- 20260811000009_rls.sql
-- Row Level Security por rol de aplicacion (admin / operador / consulta).
--
-- Modelo:
--  - admin:    acceso total a todas las tablas.
--  - operador: INSERT en movimientos; INSERT/UPDATE en personas y prestamos;
--              SELECT en el resto de tablas base para poder operar.
--  - consulta: SIN acceso a tablas base (las policies de SELECT no incluyen
--              'consulta'); solo puede leer las vistas v_*, que al ser
--              propiedad del owner de las tablas quedan exentas de RLS
--              (ver comentario en 20260811000008_vistas.sql).
--
-- DELETE en movimientos no tiene policy para ningun rol: queda denegado por
-- defecto para todos, reforzando el append-only ya bloqueado por trigger.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- usuarios
-- ----------------------------------------------------------------------------
alter table public.usuarios enable row level security;

create policy usuarios_select on public.usuarios
for select
using (id = auth.uid() or public.rol_actual() = 'admin');

create policy usuarios_insert_admin on public.usuarios
for insert
with check (public.rol_actual() = 'admin');

create policy usuarios_update_admin on public.usuarios
for update
using (public.rol_actual() = 'admin')
with check (public.rol_actual() = 'admin');

create policy usuarios_delete_admin on public.usuarios
for delete
using (public.rol_actual() = 'admin');

-- ----------------------------------------------------------------------------
-- personas: operador puede INSERT/UPDATE (segun especificacion).
-- ----------------------------------------------------------------------------
alter table public.personas enable row level security;

create policy personas_select on public.personas
for select
using (public.rol_actual() in ('admin', 'operador'));

create policy personas_insert on public.personas
for insert
with check (public.rol_actual() in ('admin', 'operador'));

create policy personas_update on public.personas
for update
using (public.rol_actual() in ('admin', 'operador'))
with check (public.rol_actual() in ('admin', 'operador'));

create policy personas_delete_admin on public.personas
for delete
using (public.rol_actual() = 'admin');

-- ----------------------------------------------------------------------------
-- prestamos: operador puede INSERT/UPDATE (segun especificacion).
-- ----------------------------------------------------------------------------
alter table public.prestamos enable row level security;

create policy prestamos_select on public.prestamos
for select
using (public.rol_actual() in ('admin', 'operador'));

create policy prestamos_insert on public.prestamos
for insert
with check (public.rol_actual() in ('admin', 'operador'));

create policy prestamos_update on public.prestamos
for update
using (public.rol_actual() in ('admin', 'operador'))
with check (public.rol_actual() in ('admin', 'operador'));

create policy prestamos_delete_admin on public.prestamos
for delete
using (public.rol_actual() = 'admin');

-- ----------------------------------------------------------------------------
-- tasas_prestamo: solo admin escribe; operador solo lee.
-- ----------------------------------------------------------------------------
alter table public.tasas_prestamo enable row level security;

create policy tasas_prestamo_select on public.tasas_prestamo
for select
using (public.rol_actual() in ('admin', 'operador'));

create policy tasas_prestamo_insert_admin on public.tasas_prestamo
for insert
with check (public.rol_actual() = 'admin');

create policy tasas_prestamo_update_admin on public.tasas_prestamo
for update
using (public.rol_actual() = 'admin')
with check (public.rol_actual() = 'admin');

create policy tasas_prestamo_delete_admin on public.tasas_prestamo
for delete
using (public.rol_actual() = 'admin');

-- ----------------------------------------------------------------------------
-- inversiones: solo admin escribe; operador solo lee.
-- ----------------------------------------------------------------------------
alter table public.inversiones enable row level security;

create policy inversiones_select on public.inversiones
for select
using (public.rol_actual() in ('admin', 'operador'));

create policy inversiones_insert_admin on public.inversiones
for insert
with check (public.rol_actual() = 'admin');

create policy inversiones_update_admin on public.inversiones
for update
using (public.rol_actual() = 'admin')
with check (public.rol_actual() = 'admin');

create policy inversiones_delete_admin on public.inversiones
for delete
using (public.rol_actual() = 'admin');

-- ----------------------------------------------------------------------------
-- tramos_inversion: solo admin escribe; operador solo lee.
-- ----------------------------------------------------------------------------
alter table public.tramos_inversion enable row level security;

create policy tramos_inversion_select on public.tramos_inversion
for select
using (public.rol_actual() in ('admin', 'operador'));

create policy tramos_inversion_insert_admin on public.tramos_inversion
for insert
with check (public.rol_actual() = 'admin');

create policy tramos_inversion_update_admin on public.tramos_inversion
for update
using (public.rol_actual() = 'admin')
with check (public.rol_actual() = 'admin');

create policy tramos_inversion_delete_admin on public.tramos_inversion
for delete
using (public.rol_actual() = 'admin');

-- ----------------------------------------------------------------------------
-- tipos_movimiento: solo admin edita (segun especificacion).
-- ----------------------------------------------------------------------------
alter table public.tipos_movimiento enable row level security;

create policy tipos_movimiento_select on public.tipos_movimiento
for select
using (public.rol_actual() in ('admin', 'operador'));

create policy tipos_movimiento_insert_admin on public.tipos_movimiento
for insert
with check (public.rol_actual() = 'admin');

create policy tipos_movimiento_update_admin on public.tipos_movimiento
for update
using (public.rol_actual() = 'admin')
with check (public.rol_actual() = 'admin');

create policy tipos_movimiento_delete_admin on public.tipos_movimiento
for delete
using (public.rol_actual() = 'admin');

-- ----------------------------------------------------------------------------
-- categorias: solo admin escribe; operador solo lee.
-- ----------------------------------------------------------------------------
alter table public.categorias enable row level security;

create policy categorias_select on public.categorias
for select
using (public.rol_actual() in ('admin', 'operador'));

create policy categorias_insert_admin on public.categorias
for insert
with check (public.rol_actual() = 'admin');

create policy categorias_update_admin on public.categorias
for update
using (public.rol_actual() = 'admin')
with check (public.rol_actual() = 'admin');

create policy categorias_delete_admin on public.categorias
for delete
using (public.rol_actual() = 'admin');

-- ----------------------------------------------------------------------------
-- parametros: solo admin edita (segun especificacion).
-- ----------------------------------------------------------------------------
alter table public.parametros enable row level security;

create policy parametros_select on public.parametros
for select
using (public.rol_actual() in ('admin', 'operador'));

create policy parametros_insert_admin on public.parametros
for insert
with check (public.rol_actual() = 'admin');

create policy parametros_update_admin on public.parametros
for update
using (public.rol_actual() = 'admin')
with check (public.rol_actual() = 'admin');

create policy parametros_delete_admin on public.parametros
for delete
using (public.rol_actual() = 'admin');

-- Sella updated_at/updated_by automaticamente en cada UPDATE de parametros.
create or replace function public.parametros_set_meta()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

create trigger trg_parametros_meta
before update on public.parametros
for each row
execute function public.parametros_set_meta();

-- ----------------------------------------------------------------------------
-- periodos_cerrados: solo admin cierra periodos (segun especificacion).
-- ----------------------------------------------------------------------------
alter table public.periodos_cerrados enable row level security;

create policy periodos_cerrados_select on public.periodos_cerrados
for select
using (public.rol_actual() in ('admin', 'operador'));

create policy periodos_cerrados_insert_admin on public.periodos_cerrados
for insert
with check (public.rol_actual() = 'admin');

create policy periodos_cerrados_update_admin on public.periodos_cerrados
for update
using (public.rol_actual() = 'admin')
with check (public.rol_actual() = 'admin');

create policy periodos_cerrados_delete_admin on public.periodos_cerrados
for delete
using (public.rol_actual() = 'admin');

-- Sella cerrado_por/cerrado_en cuando un periodo pasa a cerrado = true.
create or replace function public.periodos_cerrados_set_meta()
returns trigger
language plpgsql
as $$
begin
  if new.cerrado = true and coalesce(old.cerrado, false) = false then
    new.cerrado_por = auth.uid();
    new.cerrado_en  = now();
  end if;
  return new;
end;
$$;

create trigger trg_periodos_cerrados_meta
before update on public.periodos_cerrados
for each row
execute function public.periodos_cerrados_set_meta();

-- ----------------------------------------------------------------------------
-- movimientos: admin INSERT/UPDATE(solo confirmado, via trigger);
-- operador solo INSERT (segun especificacion). Sin policy de DELETE.
-- ----------------------------------------------------------------------------
alter table public.movimientos enable row level security;

create policy movimientos_select on public.movimientos
for select
using (public.rol_actual() in ('admin', 'operador'));

create policy movimientos_insert on public.movimientos
for insert
with check (public.rol_actual() in ('admin', 'operador'));

create policy movimientos_update_admin on public.movimientos
for update
using (public.rol_actual() = 'admin')
with check (public.rol_actual() = 'admin');

-- ----------------------------------------------------------------------------
-- Grants base para el rol de PostgREST 'authenticated'. El filtrado real de
-- que puede ver/escribir cada persona lo hacen las policies de arriba.
-- ----------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant execute on function public.rol_actual() to authenticated;

grant select, insert, update                on public.usuarios          to authenticated;
grant select, insert, update                on public.personas          to authenticated;
grant select, insert, update                on public.prestamos         to authenticated;
grant select, insert, update                on public.tasas_prestamo    to authenticated;
grant select, insert, update                on public.inversiones       to authenticated;
grant select, insert, update                on public.tramos_inversion  to authenticated;
grant select, insert, update                on public.tipos_movimiento  to authenticated;
grant select, insert, update                on public.categorias        to authenticated;
grant select, insert, update                on public.parametros        to authenticated;
grant select, insert, update                on public.periodos_cerrados to authenticated;
grant select, insert, update                on public.movimientos       to authenticated; -- delete: sin policy = denegado

grant select on public.v_saldos_prestamo    to authenticated;
grant select on public.v_saldos_inversion   to authenticated;
grant select on public.v_flujo_caja         to authenticated;
grant select on public.v_cartera_por_estado to authenticated;
grant select on public.v_estado_resultados  to authenticated;
grant select on public.v_flujo_mensual      to authenticated;
grant select on public.v_mora               to authenticated;
