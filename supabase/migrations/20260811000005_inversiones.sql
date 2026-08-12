-- ============================================================================
-- 20260811000005_inversiones.sql
-- Dimension inversiones + historial de tramos (tramos_inversion).
-- ============================================================================

create table public.inversiones (
  id               bigint generated always as identity primary key,
  codigo           text not null unique,
  persona_id       bigint not null references public.personas(id),
  fecha_aporte     date not null,
  estado           text not null check (estado in ('VIGENTE', 'SIN_FONDEAR', 'LIQUIDADA')),
  cuenta_acreditar text,
  notas            text
);

create index idx_inversiones_persona on public.inversiones(persona_id);

-- ----------------------------------------------------------------------------
-- tramos_inversion: historial de monto/tasa vigente por inversion (una
-- inversion puede tener varios tramos, ej. aportes adicionales con tasas
-- distintas a lo largo del tiempo).
-- ----------------------------------------------------------------------------
create table public.tramos_inversion (
  id             bigint generated always as identity primary key,
  inversion_id   bigint not null references public.inversiones(id),
  monto          numeric(14,2) not null check (monto > 0),
  tasa_mensual   numeric(6,5) not null check (tasa_mensual >= 0),
  vigente_desde  date not null,
  vigente_hasta  date,
  constraint tramos_inversion_rango_valido check (vigente_hasta is null or vigente_hasta >= vigente_desde)
);

create index idx_tramos_inversion_inversion on public.tramos_inversion(inversion_id);
