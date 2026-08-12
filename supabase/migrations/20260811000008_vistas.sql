-- ============================================================================
-- 20260811000008_vistas.sql
-- Todos los saldos son VISTAS calculadas sobre movimientos. Nunca columnas.
--
-- Nota sobre RLS: estas vistas se crean con el mismo owner que las tablas
-- (el rol que corre las migraciones). Postgres exime al owner de una tabla
-- de aplicar RLS sobre si mismo (a menos que se use FORCE ROW LEVEL
-- SECURITY, que este esquema no usa). Como las vistas heredan los
-- privilegios de su owner para el acceso a las tablas subyacentes, cualquier
-- rol con GRANT SELECT sobre la vista puede leerla sin necesitar acceso
-- directo a las tablas base (ver migraciones de RLS).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- v_movimientos_efectivos: base interna que resuelve las correcciones.
--
-- "Corregir" (pantalla 6) NO edita ni borra: inserta una fila nueva con el
-- MISMO tipo_movimiento_id/contexto/monto que el original y reversa_de
-- apuntando a el. Para que esa fila ANULE el efecto en vez de duplicarlo,
-- todas las vistas de saldo/flujo/resultado leen "monto_efectivo" (el monto
-- multiplicado por -1 cuando la fila es un reverso) en vez de "monto" a
-- secas. Asi una fila original (+X) y su reverso (-X) siempre se cancelan,
-- sin importar de que tipo de movimiento se trate.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- v_saldos_prestamo
-- saldo_capital       = SALDO_INICIAL + DESEMBOLSO - ABONO_CAPITAL
-- capital_recuperado  = suma de ABONO_CAPITAL
-- int_cobrado         = suma de INTERES_COBRADO
-- int_pendiente       = INTERES_PENDIENTE (devengado) - INTERES_COBRADO
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- v_saldos_inversion
-- saldo_actual  = APORTE_INVERSION - DEVOLUCION_INVERSION
-- int_pagado    = suma de INTERES_PAGADO_INV
-- int_pendiente = INTERES_PEND_INV (devengado) - INTERES_PAGADO_INV
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- v_flujo_caja: flujo de caja total = SUM(monto_efectivo * signo_caja), mas
-- el desglose de entradas/salidas (bloque "Efectivo" del dashboard).
-- ----------------------------------------------------------------------------
create or replace view public.v_flujo_caja as
select
  coalesce(sum(me.monto_efectivo * me.signo_caja), 0)                          as flujo_caja,
  coalesce(sum(me.monto_efectivo) filter (where me.signo_caja = 1), 0)         as entradas,
  coalesce(sum(-me.monto_efectivo) filter (where me.signo_caja = -1), 0)       as salidas
from public.v_movimientos_efectivos me;

comment on view public.v_flujo_caja is
  'Flujo de caja neto historico = SUM(monto_efectivo * signo_caja), con desglose de entradas y salidas.';

-- ----------------------------------------------------------------------------
-- v_flujo_caja_detalle: desglose del flujo de caja por tipo de movimiento
-- (solo los que efectivamente mueven caja, signo_caja <> 0). Insumo del
-- grafico de cascada del dashboard.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- v_cartera_por_estado: saldo de capital agrupado por prestamos.estado.
-- ----------------------------------------------------------------------------
create or replace view public.v_cartera_por_estado as
select
  estado,
  coalesce(sum(saldo_capital), 0) as saldo
from public.v_saldos_prestamo
group by estado;

comment on view public.v_cartera_por_estado is
  'Saldo total de capital de la cartera agrupado por estado del prestamo (ACTIVO/PAGADO/CONGELADO/INCOBRABLE).';

-- ----------------------------------------------------------------------------
-- v_estado_resultados: movimientos agrupados por clase_contable.
--
-- IMPORTANTE: aqui NO se puede usar signo_caja como multiplicador. Los
-- movimientos devengados (INTERES_PENDIENTE, INTERES_PEND_INV) tienen
-- signo_caja = 0 a proposito (no mueven caja), pero SI son ingreso/gasto
-- economico y deben contar en el resultado del ejercicio -- de lo contrario
-- se repite el error del Excel viejo de solo devengar ingresos (o de no
-- devengar nada). El signo economico correcto lo da clase_contable:
-- INGRESO = +1, GASTO = -1, BALANCE no participa del resultado (se muestra
-- informativamente con su propio signo_caja).
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- v_resultado_detalle: desglose linea por linea de "¿Estas ganando o
-- perdiendo?" (bloque C del dashboard), mas una fila RESULTADO con la suma.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- v_flujo_mensual: flujo de caja agrupado por mes (date_trunc, sin tabla de
-- calendario).
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- v_mora: dias de atraso por prestamo ACTIVO, comparando la fecha esperada
-- de pago del mes (segun dia_pago) contra la fecha actual y el ultimo pago
-- de capital o interes registrado (que no haya sido corregido/anulado), con
-- dias de gracia segun parametros. Incluye persona_nombre y monto_pendiente.
-- ----------------------------------------------------------------------------
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
  -- Solo cuenta pagos "primarios" (no son ellos mismos un reverso) que
  -- nadie haya corregido despues (que no exista otra fila que los reverse).
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
