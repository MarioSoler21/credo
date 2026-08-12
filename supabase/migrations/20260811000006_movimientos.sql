-- ============================================================================
-- 20260811000006_movimientos.sql
-- Tabla de hechos (append-only): movimientos.
-- ============================================================================

create table public.movimientos (
  id                  bigint generated always as identity primary key,
  fecha               date not null,
  tipo_movimiento_id  bigint not null references public.tipos_movimiento(id),
  prestamo_id         bigint references public.prestamos(id),
  inversion_id        bigint references public.inversiones(id),
  categoria_id        bigint references public.categorias(id),
  monto               numeric(14,2) not null check (monto > 0),
  confirmado          boolean not null default false,
  nota                text,
  reversa_de          bigint references public.movimientos(id),
  created_at          timestamptz default now(),
  created_by          uuid references auth.users(id),
  constraint un_solo_contexto check (
    (
      (prestamo_id  is not null)::int +
      (inversion_id is not null)::int +
      (categoria_id is not null)::int
    ) = 1
  )
);

comment on table public.movimientos is
  'Tabla de hechos append-only. monto siempre positivo; el signo lo aporta tipos_movimiento.signo_caja. Correcciones = fila de reverso con reversa_de.';
comment on column public.movimientos.monto is
  'Siempre positivo (check > 0). El efecto en caja se calcula como monto * tipos_movimiento.signo_caja.';
comment on constraint un_solo_contexto on public.movimientos is
  'Cada movimiento pertenece a exactamente un contexto: un prestamo, una inversion, o una categoria (gasto/ingreso general).';

create index idx_movimientos_fecha       on public.movimientos(fecha);
create index idx_movimientos_tipo        on public.movimientos(tipo_movimiento_id);
create index idx_movimientos_prestamo    on public.movimientos(prestamo_id)  where prestamo_id  is not null;
create index idx_movimientos_inversion   on public.movimientos(inversion_id) where inversion_id is not null;
create index idx_movimientos_categoria   on public.movimientos(categoria_id) where categoria_id is not null;
create index idx_movimientos_reversa_de  on public.movimientos(reversa_de)   where reversa_de   is not null;
