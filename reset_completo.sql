-- ============================================================================
-- RESET COMPLETO DEL ESQUEMA PUBLIC + RE-APLICACION DE LAS 10 MIGRACIONES
-- Seguro de correr: las tablas estaban vacias (0 filas). Deja la base
-- exactamente igual al contenido de supabase/migrations/.
-- ============================================================================

drop schema if exists public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to postgres, service_role;
alter default privileges in schema public grant all on functions to postgres, service_role;
alter default privileges in schema public grant all on sequences to postgres, service_role;
grant all on all tables in schema public to postgres, service_role;
grant all on all functions in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;

-- ============================================================================
-- 20260811000001_extensions_y_roles.sql
-- ============================================================================
create extension if not exists btree_gist;

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  rol text not null check (rol in ('admin', 'operador', 'consulta')),
  created_at timestamptz not null default now()
);

comment on table public.usuarios is
  'Mapea cada auth.users a un rol de aplicacion. Usado por las politicas RLS del resto del esquema.';

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

-- ============================================================================
-- 20260811000002_catalogos.sql
-- ============================================================================
create table public.tipos_movimiento (
  id              bigint generated always as identity primary key,
  codigo          text not null unique,
  descripcion     text,
  signo_caja      smallint not null check (signo_caja in (-1, 0, 1)),
  afecta          text not null check (afecta in ('CAPITAL', 'INTERES', 'OTROS')),
  clase_contable  text not null check (clase_contable in ('BALANCE', 'INGRESO', 'GASTO')),
  es_devengado    boolean not null default false,
  activo          boolean default true
);

comment on table public.tipos_movimiento is
  'Catalogo de tipos de movimiento. signo_caja define el efecto en v_flujo_caja (monto * signo_caja).';
comment on column public.tipos_movimiento.es_devengado is
  'true = movimiento de reconocimiento contable (interes devengado) que no mueve caja (signo_caja = 0).';

create table public.categorias (
  id      bigint generated always as identity primary key,
  nombre  text not null unique,
  grupo   text,
  activo  boolean default true
);

create table public.parametros (
  clave       text primary key,
  valor       text not null,
  descripcion text,
  updated_at  timestamptz,
  updated_by  uuid references auth.users(id)
);

create table public.periodos_cerrados (
  anio        int not null,
  mes         int not null check (mes between 1 and 12),
  cerrado     boolean default false,
  cerrado_por uuid references auth.users(id),
  cerrado_en  timestamptz,
  primary key (anio, mes)
);

-- ============================================================================
-- 20260811000003_personas.sql
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

-- ============================================================================
-- 20260811000004_prestamos.sql
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

-- ============================================================================
-- 20260811000005_inversiones.sql
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

-- ============================================================================
-- 20260811000006_movimientos.sql
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

-- ============================================================================
-- 20260811000007_triggers_movimientos.sql
-- ============================================================================
create or replace function public.movimientos_bloquear_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'movimientos es append-only: no se permite DELETE (id=%). Inserte una fila de reverso con reversa_de = %.',
    old.id, old.id;
end;
$$;

create trigger trg_movimientos_no_delete
before delete on public.movimientos
for each row
execute function public.movimientos_bloquear_delete();

create or replace function public.movimientos_bloquear_update()
returns trigger
language plpgsql
as $$
begin
  if new.id                 is distinct from old.id
     or new.fecha              is distinct from old.fecha
     or new.tipo_movimiento_id is distinct from old.tipo_movimiento_id
     or new.prestamo_id        is distinct from old.prestamo_id
     or new.inversion_id       is distinct from old.inversion_id
     or new.categoria_id       is distinct from old.categoria_id
     or new.monto              is distinct from old.monto
     or new.nota               is distinct from old.nota
     or new.reversa_de         is distinct from old.reversa_de
     or new.created_at         is distinct from old.created_at
     or new.created_by         is distinct from old.created_by
  then
    raise exception
      'movimientos es append-only: solo se permite modificar la columna confirmado (id=%). Use una fila de reverso para corregir.',
      old.id;
  end if;

  return new;
end;
$$;

create trigger trg_movimientos_solo_confirmado
before update on public.movimientos
for each row
execute function public.movimientos_bloquear_update();

create or replace function public.movimientos_validar_periodo_abierto()
returns trigger
language plpgsql
as $$
declare
  v_cerrado boolean;
begin
  select cerrado into v_cerrado
  from public.periodos_cerrados
  where anio = extract(year  from new.fecha)::int
    and mes  = extract(month from new.fecha)::int;

  if v_cerrado then
    raise exception
      'El periodo %-% esta cerrado. No se pueden insertar movimientos con fecha %.',
      extract(year from new.fecha), extract(month from new.fecha), new.fecha;
  end if;

  return new;
end;
$$;

create trigger trg_movimientos_periodo_abierto
before insert on public.movimientos
for each row
execute function public.movimientos_validar_periodo_abierto();

-- ============================================================================
-- 20260811000008_vistas.sql
-- ============================================================================
create or replace view public.v_movimientos_efectivos as
select
  m.id,
  m.fecha,
  m.tipo_movimiento_id,
  m.prestamo_id,
  m.inversion_id,
  m.categoria_id,
  m.monto,
  m.reversa_de,
  tm.codigo          as tipo_codigo,
  tm.signo_caja,
  tm.clase_contable,
  tm.es_devengado,
  (case when m.reversa_de is null then 1 else -1 end) * m.monto as monto_efectivo
from public.movimientos m
join public.tipos_movimiento tm on tm.id = m.tipo_movimiento_id
where m.confirmado = true;

comment on view public.v_movimientos_efectivos is
  'Movimientos confirmados con monto_efectivo = monto * (-1 si es un reverso). Base de todas las demas vistas para que "Corregir" anule sin necesitar codigos opuestos por tipo.';

create or replace view public.v_saldos_prestamo as
select
  p.id                                                                                        as prestamo_id,
  p.codigo                                                                                    as prestamo_codigo,
  p.persona_id,
  p.estado,
  coalesce(sum(me.monto_efectivo) filter (where me.tipo_codigo in ('SALDO_INICIAL', 'DESEMBOLSO')), 0)
    - coalesce(sum(me.monto_efectivo) filter (where me.tipo_codigo = 'ABONO_CAPITAL'), 0)      as saldo_capital,
  coalesce(sum(me.monto_efectivo) filter (where me.tipo_codigo = 'ABONO_CAPITAL'), 0)          as capital_recuperado,
  coalesce(sum(me.monto_efectivo) filter (where me.tipo_codigo = 'INTERES_COBRADO'), 0)        as int_cobrado,
  coalesce(sum(me.monto_efectivo) filter (where me.tipo_codigo = 'INTERES_PENDIENTE'), 0)
    - coalesce(sum(me.monto_efectivo) filter (where me.tipo_codigo = 'INTERES_COBRADO'), 0)    as int_pendiente
from public.prestamos p
left join public.v_movimientos_efectivos me
  on me.prestamo_id = p.id
group by p.id, p.codigo, p.persona_id, p.estado;

comment on view public.v_saldos_prestamo is
  'Saldo de capital e interes por prestamo, calculado a partir de movimientos confirmados (netos de reversos).';

create or replace view public.v_saldos_inversion as
select
  i.id                                                                                        as inversion_id,
  i.codigo                                                                                    as inversion_codigo,
  i.persona_id,
  i.estado,
  coalesce(sum(me.monto_efectivo) filter (where me.tipo_codigo = 'APORTE_INVERSION'), 0)
    - coalesce(sum(me.monto_efectivo) filter (where me.tipo_codigo = 'DEVOLUCION_INVERSION'), 0) as saldo_actual,
  coalesce(sum(me.monto_efectivo) filter (where me.tipo_codigo = 'INTERES_PAGADO_INV'), 0)      as int_pagado,
  coalesce(sum(me.monto_efectivo) filter (where me.tipo_codigo = 'INTERES_PEND_INV'), 0)
    - coalesce(sum(me.monto_efectivo) filter (where me.tipo_codigo = 'INTERES_PAGADO_INV'), 0)  as int_pendiente
from public.inversiones i
left join public.v_movimientos_efectivos me
  on me.inversion_id = i.id
group by i.id, i.codigo, i.persona_id, i.estado;

comment on view public.v_saldos_inversion is
  'Saldo de capital e interes por inversion, calculado a partir de movimientos confirmados (netos de reversos).';

create or replace view public.v_flujo_caja as
select
  coalesce(sum(me.monto_efectivo * me.signo_caja), 0)                          as flujo_caja,
  coalesce(sum(me.monto_efectivo) filter (where me.signo_caja = 1), 0)         as entradas,
  coalesce(sum(-me.monto_efectivo) filter (where me.signo_caja = -1), 0)       as salidas
from public.v_movimientos_efectivos me;

comment on view public.v_flujo_caja is
  'Flujo de caja neto historico = SUM(monto_efectivo * signo_caja), con desglose de entradas y salidas.';

create or replace view public.v_flujo_caja_detalle as
select
  me.tipo_codigo as codigo,
  coalesce(sum(me.monto_efectivo * me.signo_caja), 0) as monto
from public.v_movimientos_efectivos me
where me.signo_caja <> 0
group by me.tipo_codigo
having coalesce(sum(me.monto_efectivo * me.signo_caja), 0) <> 0
order by monto desc;

comment on view public.v_flujo_caja_detalle is
  'Efecto neto en caja por tipo de movimiento (solo tipos con signo_caja <> 0). Insumo del grafico de cascada.';

create or replace view public.v_cartera_por_estado as
select
  estado,
  coalesce(sum(saldo_capital), 0) as saldo
from public.v_saldos_prestamo
group by estado;

comment on view public.v_cartera_por_estado is
  'Saldo total de capital de la cartera agrupado por estado del prestamo (ACTIVO/PAGADO/CONGELADO/INCOBRABLE).';

create or replace view public.v_estado_resultados as
select
  me.clase_contable,
  case me.clase_contable
    when 'INGRESO' then coalesce(sum(me.monto_efectivo), 0)
    when 'GASTO'   then -coalesce(sum(me.monto_efectivo), 0)
    else coalesce(sum(me.monto_efectivo * me.signo_caja), 0)
  end as total
from public.v_movimientos_efectivos me
group by me.clase_contable;

comment on view public.v_estado_resultados is
  'Totales agrupados por clase_contable (BALANCE/INGRESO/GASTO). INGRESO y GASTO cuentan devengos de ambos lados; BALANCE es informativo y no participa del resultado.';

create or replace view public.v_resultado_detalle as
with base as (
  select 'INTERES_COBRADO'::text as concepto,
         coalesce(sum(monto_efectivo), 0)::numeric(14,2) as monto
  from public.v_movimientos_efectivos where tipo_codigo = 'INTERES_COBRADO'

  union all

  select 'INTERES_PENDIENTE', coalesce(sum(monto_efectivo), 0)
  from public.v_movimientos_efectivos where tipo_codigo = 'INTERES_PENDIENTE'

  union all

  select 'INTERES_BANCARIO', coalesce(sum(monto_efectivo), 0)
  from public.v_movimientos_efectivos where tipo_codigo = 'INTERES_BANCARIO'

  union all

  select 'INTERES_INVERSIONISTAS', -coalesce(sum(monto_efectivo), 0)
  from public.v_movimientos_efectivos where tipo_codigo in ('INTERES_PAGADO_INV', 'INTERES_PEND_INV')

  union all

  select 'GASTOS', -coalesce(sum(monto_efectivo), 0)
  from public.v_movimientos_efectivos where tipo_codigo in ('GASTO_OPERATIVO', 'OTRO_EGRESO', 'PERDIDA_CARTERA')
)
select concepto, monto from base
union all
select 'RESULTADO', (select coalesce(sum(monto), 0) from base);

comment on view public.v_resultado_detalle is
  'Lineas de INTERES_COBRADO, INTERES_PENDIENTE, INTERES_BANCARIO, INTERES_INVERSIONISTAS (pagado+pendiente) y GASTOS, mas una fila RESULTADO con la suma de todas. Cuenta devengos de ambos lados.';

create or replace view public.v_flujo_mensual as
select
  date_trunc('month', me.fecha)::date                                                  as mes,
  coalesce(sum(me.monto_efectivo * me.signo_caja) filter (where me.signo_caja = 1), 0)  as ingresos,
  coalesce(sum(me.monto_efectivo * me.signo_caja) filter (where me.signo_caja = -1), 0) as egresos,
  coalesce(sum(me.monto_efectivo * me.signo_caja), 0)                                   as flujo_neto
from public.v_movimientos_efectivos me
group by date_trunc('month', me.fecha)
order by mes;

comment on view public.v_flujo_mensual is
  'Flujo de caja mensual (ingresos, egresos, neto), agrupado con date_trunc.';

create or replace view public.v_mora as
with parametro_gracia as (
  select coalesce(
    (select valor::int from public.parametros where clave = 'dias_gracia_mora'),
    0
  ) as dias_gracia
),
base as (
  select
    p.id           as prestamo_id,
    p.codigo       as prestamo_codigo,
    p.persona_id,
    per.nombre     as persona_nombre,
    p.estado,
    p.dia_pago,
    make_date(
      extract(year  from current_date)::int,
      extract(month from current_date)::int,
      least(
        p.dia_pago,
        extract(day from (date_trunc('month', current_date) + interval '1 month - 1 day'))::int
      )
    ) as fecha_pago_esperada
  from public.prestamos p
  join public.personas per on per.id = p.persona_id
  where p.estado = 'ACTIVO'
    and p.dia_pago is not null
),
pagos as (
  select
    m.prestamo_id,
    max(m.fecha) as ultima_fecha_pago
  from public.movimientos m
  join public.tipos_movimiento tm on tm.id = m.tipo_movimiento_id
  where m.confirmado = true
    and tm.codigo in ('ABONO_CAPITAL', 'INTERES_COBRADO')
    and m.reversa_de is null
    and not exists (select 1 from public.movimientos r where r.reversa_de = m.id)
  group by m.prestamo_id
)
select
  b.prestamo_id,
  b.prestamo_codigo,
  b.persona_id,
  b.persona_nombre,
  b.estado,
  b.dia_pago,
  b.fecha_pago_esperada,
  pg.ultima_fecha_pago,
  greatest(0, (current_date - b.fecha_pago_esperada)::int - g.dias_gracia) as dias_atraso,
  coalesce(vsp.int_pendiente, 0) as monto_pendiente
from base b
left join pagos pg on pg.prestamo_id = b.prestamo_id
left join public.v_saldos_prestamo vsp on vsp.prestamo_id = b.prestamo_id
cross join parametro_gracia g
where b.fecha_pago_esperada < current_date
  and (pg.ultima_fecha_pago is null or pg.ultima_fecha_pago < b.fecha_pago_esperada);

comment on view public.v_mora is
  'Prestamos ACTIVO con la fecha de pago del mes vencida y sin abono/interes cobrado vigente desde entonces, con dias de atraso, nombre de la persona y el interes pendiente de cobro.';

-- ============================================================================
-- 20260811000009_rls.sql
-- ============================================================================
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
grant select, insert, update                on public.movimientos       to authenticated;

grant select on public.v_saldos_prestamo    to authenticated;
grant select on public.v_saldos_inversion   to authenticated;
grant select on public.v_flujo_caja         to authenticated;
grant select on public.v_cartera_por_estado to authenticated;
grant select on public.v_estado_resultados  to authenticated;
grant select on public.v_flujo_mensual      to authenticated;
grant select on public.v_mora               to authenticated;

-- ============================================================================
-- 20260811000010_seed_catalogos.sql
-- ============================================================================
insert into public.tipos_movimiento (codigo, signo_caja, afecta, clase_contable, es_devengado, descripcion) values
  ('SALDO_INICIAL',       0, 'CAPITAL',  'BALANCE', false, 'Saldo de capital con el que inicia un prestamo migrado/existente'),
  ('DESEMBOLSO',         -1, 'CAPITAL',  'BALANCE', false, 'Desembolso de capital de un prestamo nuevo'),
  ('ABONO_CAPITAL',       1, 'CAPITAL',  'BALANCE', false, 'Abono a capital de un prestamo'),
  ('INTERES_COBRADO',     1, 'INTERES',  'INGRESO', false, 'Interes de prestamo efectivamente cobrado'),
  ('INTERES_PENDIENTE',   0, 'INTERES',  'INGRESO', true,  'Interes de prestamo devengado, aun no cobrado'),
  ('APORTE_INVERSION',    1, 'CAPITAL',  'BALANCE', false, 'Aporte de capital de un inversionista'),
  ('DEVOLUCION_INVERSION',-1,'CAPITAL',  'BALANCE', false, 'Devolucion de capital a un inversionista'),
  ('INTERES_PAGADO_INV', -1, 'INTERES',  'GASTO',   false, 'Interes pagado a un inversionista'),
  ('INTERES_PEND_INV',    0, 'INTERES',  'GASTO',   true,  'Interes a inversionista devengado, aun no pagado'),
  ('INTERES_BANCARIO',    1, 'OTROS',    'INGRESO', false, 'Interes ganado en cuentas bancarias de la cooperativa'),
  ('GASTO_OPERATIVO',    -1, 'OTROS',    'GASTO',   false, 'Gasto operativo general'),
  ('OTRO_EGRESO',        -1, 'OTROS',    'GASTO',   false, 'Egreso no clasificado en otra categoria'),
  ('PERDIDA_CARTERA',    -1, 'OTROS',    'GASTO',   false, 'Castigo/perdida de cartera incobrable');

insert into public.categorias (nombre, grupo) values
  ('Interes bancario',                'INGRESO FINANCIERO'),
  ('Gastos de colocacion',            'GASTO OPERATIVO'),
  ('Tramite permiso de operacion',    'GASTO ADMINISTRATIVO'),
  ('Pasado a perdidas',               'PERDIDA DE CARTERA');

insert into public.parametros (clave, valor, descripcion) values
  ('tasa_isr',          '0.25', 'Tasa de ISR aplicable a rendimientos'),
  ('moneda',            'HNL',  'Moneda base de la cooperativa (Lempira hondureno)'),
  ('dias_gracia_mora',  '5',    'Dias de gracia antes de considerar un pago en mora');

-- ============================================================================
-- 20260811000012_acceso_sin_login.sql
-- ============================================================================
grant usage on schema public to anon;

grant select on public.tipos_movimiento  to anon;
grant select on public.categorias        to anon;
grant select on public.parametros        to anon;
grant select on public.periodos_cerrados to anon;

create policy anon_select_tipos_movimiento  on public.tipos_movimiento  for select to anon using (true);
create policy anon_select_categorias        on public.categorias        for select to anon using (true);
create policy anon_select_parametros        on public.parametros        for select to anon using (true);
create policy anon_select_periodos_cerrados on public.periodos_cerrados for select to anon using (true);

grant select, insert, update on public.personas to anon;

create policy anon_select_personas on public.personas for select to anon using (true);
create policy anon_insert_personas on public.personas for insert to anon with check (true);
create policy anon_update_personas on public.personas for update to anon using (true) with check (true);

grant select, insert, update on public.prestamos      to anon;
grant select, insert, update on public.tasas_prestamo  to anon;

create policy anon_select_prestamos on public.prestamos for select to anon using (true);
create policy anon_insert_prestamos on public.prestamos for insert to anon with check (true);
create policy anon_update_prestamos on public.prestamos for update to anon using (true) with check (true);

create policy anon_select_tasas_prestamo on public.tasas_prestamo for select to anon using (true);
create policy anon_insert_tasas_prestamo on public.tasas_prestamo for insert to anon with check (true);
create policy anon_update_tasas_prestamo on public.tasas_prestamo for update to anon using (true) with check (true);

grant select, insert, update on public.inversiones      to anon;
grant select, insert, update on public.tramos_inversion to anon;

create policy anon_select_inversiones on public.inversiones for select to anon using (true);
create policy anon_insert_inversiones on public.inversiones for insert to anon with check (true);
create policy anon_update_inversiones on public.inversiones for update to anon using (true) with check (true);

create policy anon_select_tramos_inversion on public.tramos_inversion for select to anon using (true);
create policy anon_insert_tramos_inversion on public.tramos_inversion for insert to anon with check (true);
create policy anon_update_tramos_inversion on public.tramos_inversion for update to anon using (true) with check (true);

grant select, insert, update on public.movimientos to anon;

create policy anon_select_movimientos on public.movimientos for select to anon using (true);
create policy anon_insert_movimientos on public.movimientos for insert to anon with check (true);
create policy anon_update_movimientos on public.movimientos for update to anon using (true) with check (true);

grant select on public.v_saldos_prestamo    to anon;
grant select on public.v_saldos_inversion   to anon;
grant select on public.v_flujo_caja         to anon;
grant select on public.v_flujo_caja_detalle to anon;
grant select on public.v_cartera_por_estado to anon;
grant select on public.v_estado_resultados  to anon;
grant select on public.v_resultado_detalle  to anon;
grant select on public.v_flujo_mensual      to anon;
grant select on public.v_mora               to anon;

-- ============================================================================
-- Fin. Verificacion rapida:
--   select * from public.v_flujo_caja;
--   select * from public.v_cartera_por_estado order by estado;
-- Ambas deberian devolver 0 / filas vacias porque movimientos sigue sin datos
-- reales (faltan los 64 movimientos historicos, ver supabase/README.md).
-- ============================================================================
