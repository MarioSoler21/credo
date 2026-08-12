-- ============================================================================
-- 20260811000004_prestamos.sql
-- Dimension prestamos + historial de tasas (tasas_prestamo).
-- ============================================================================

create table public.prestamos (
  id               bigint generated always as identity primary key,
  codigo           text not null unique,
  persona_id       bigint not null references public.personas(id),
  fecha_desembolso date not null,
  estado           text not null check (estado in ('ACTIVO', 'PAGADO', 'CONGELADO', 'INCOBRABLE')),
  plazo_meses      int,
  dia_pago         int check (dia_pago between 1 and 31),
  origen           text,
  notas            text,
  created_at       timestamptz default now()
);

create index idx_prestamos_persona on public.prestamos(persona_id);
create index idx_prestamos_estado  on public.prestamos(estado);

-- ----------------------------------------------------------------------------
-- tasas_prestamo: historial de tasa mensual vigente por prestamo.
-- El exclude constraint impide dos vigencias que se traslapen para el mismo
-- prestamo (requiere btree_gist para comparar prestamo_id con =).
-- ----------------------------------------------------------------------------
create table public.tasas_prestamo (
  id             bigint generated always as identity primary key,
  prestamo_id    bigint not null references public.prestamos(id),
  tasa_mensual   numeric(6,5) not null check (tasa_mensual >= 0),
  vigente_desde  date not null,
  vigente_hasta  date,
  constraint tasas_prestamo_rango_valido check (vigente_hasta is null or vigente_hasta >= vigente_desde),
  constraint sin_traslape exclude using gist (
    prestamo_id with =,
    daterange(vigente_desde, vigente_hasta, '[]') with &&
  )
);

create index idx_tasas_prestamo_prestamo on public.tasas_prestamo(prestamo_id);

comment on constraint sin_traslape on public.tasas_prestamo is
  'Evita que un mismo prestamo tenga dos tasas vigentes al mismo tiempo.';
