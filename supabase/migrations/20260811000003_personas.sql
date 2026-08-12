-- ============================================================================
-- 20260811000003_personas.sql
-- Dimension personas (prestatarios / inversionistas / ambos).
-- ============================================================================

create table public.personas (
  id              bigint generated always as identity primary key,
  codigo          text not null unique,
  nombre          text not null,
  identidad       text unique,
  telefono        text,
  email           text,
  direccion       text,
  es_prestatario  boolean default false,
  es_inversionista boolean default false,
  cuenta_bancaria text,
  notas           text,
  activo          boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz
);

-- ----------------------------------------------------------------------------
-- Trigger generico para mantener updated_at. Se reutiliza en otras tablas
-- del esquema que tengan una columna updated_at.
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_personas_updated_at
before update on public.personas
for each row
execute function public.set_updated_at();
