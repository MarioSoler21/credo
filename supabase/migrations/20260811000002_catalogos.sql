-- ============================================================================
-- 20260811000002_catalogos.sql
-- Tablas de catalogo del esquema estrella:
-- tipos_movimiento, categorias, parametros, periodos_cerrados.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- tipos_movimiento: catalogo que define el signo de caja y la clasificacion
-- contable de cada tipo de movimiento posible en la tabla de hechos.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- categorias: catalogo para movimientos "OTROS" (gastos/ingresos no ligados
-- a un prestamo ni a una inversion especifica).
-- ----------------------------------------------------------------------------
create table public.categorias (
  id      bigint generated always as identity primary key,
  nombre  text not null unique,
  grupo   text,
  activo  boolean default true
);

-- ----------------------------------------------------------------------------
-- parametros: catalogo llave/valor de configuracion global.
-- ----------------------------------------------------------------------------
create table public.parametros (
  clave       text primary key,
  valor       text not null,
  descripcion text,
  updated_at  timestamptz,
  updated_by  uuid references auth.users(id)
);

-- ----------------------------------------------------------------------------
-- periodos_cerrados: marca que (anio, mes) ya fue cerrado contablemente.
-- Un periodo cerrado bloquea nuevos INSERT en movimientos con fecha en ese mes.
-- ----------------------------------------------------------------------------
create table public.periodos_cerrados (
  anio        int not null,
  mes         int not null check (mes between 1 and 12),
  cerrado     boolean default false,
  cerrado_por uuid references auth.users(id),
  cerrado_en  timestamptz,
  primary key (anio, mes)
);
