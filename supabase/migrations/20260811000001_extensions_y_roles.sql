-- ============================================================================
-- 20260811000001_extensions_y_roles.sql
-- Extensiones necesarias y tabla de mapeo auth.users -> rol de aplicacion.
-- ============================================================================

-- Requerida por el constraint "sin_traslape" (exclude using gist) de tasas_prestamo
create extension if not exists btree_gist;

-- ----------------------------------------------------------------------------
-- Tabla de roles de aplicacion (admin / operador / consulta).
-- No forma parte del modelo de estrella; es infraestructura de RLS.
-- ----------------------------------------------------------------------------
create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  rol text not null check (rol in ('admin', 'operador', 'consulta')),
  created_at timestamptz not null default now()
);

comment on table public.usuarios is
  'Mapea cada auth.users a un rol de aplicacion. Usado por las politicas RLS del resto del esquema.';

-- Nota de bootstrap: la primera fila (el primer admin) debe insertarse desde
-- el SQL Editor de Supabase o con la service_role key, porque las politicas
-- RLS de esta tabla exigen ya ser admin para poder insertar (ver migracion
-- de RLS). El service_role bypassea RLS por diseno de Postgres/Supabase.

-- ----------------------------------------------------------------------------
-- Funcion helper: rol de aplicacion del usuario autenticado actual.
-- security definer + search_path fijo para poder leer 'usuarios' sin
-- depender de que el llamador tenga permisos directos sobre esa tabla.
-- ----------------------------------------------------------------------------
create or replace function public.rol_actual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.usuarios where id = auth.uid();
$$;

comment on function public.rol_actual() is
  'Devuelve el rol de aplicacion (admin/operador/consulta) del usuario autenticado actual, o null si no tiene fila en usuarios.';
