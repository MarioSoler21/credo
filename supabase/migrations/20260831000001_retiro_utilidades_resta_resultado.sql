-- ============================================================================
-- 20260831000001_retiro_utilidades_resta_resultado.sql
--
-- Cambio de regla de negocio pedido por el dueno del negocio (2026-08-30):
-- el retiro de utilidades SI debe restar en el Estado de Resultados, no solo
-- en caja/balance. Esto reemplaza lo que se habia definido en
-- 20260827000001_retiro_utilidades.sql (ahi se dejo como BALANCE, sin
-- participar del resultado, por ser tecnicamente una distribucion de
-- utilidades y no un gasto operativo). DIVIDENDO_PAGADO_INV no se toca: solo
-- se pidio el cambio para RETIRO_UTILIDADES.
-- ============================================================================

update public.tipos_movimiento
set clase_contable = 'GASTO'
where codigo = 'RETIRO_UTILIDADES';

-- v_resultado_detalle: se agrega la linea RETIRO_UTILIDADES (resta) para que
-- quede visible en el desglose, ademas de contar en la fila RESULTADO.
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

  union all

  select 'RETIRO_UTILIDADES', -coalesce(sum(monto_efectivo), 0)
  from public.v_movimientos_efectivos where tipo_codigo = 'RETIRO_UTILIDADES'
)
select concepto, monto from base
union all
select 'RESULTADO', (select coalesce(sum(monto), 0) from base);

comment on view public.v_resultado_detalle is
  'Lineas de INTERES_COBRADO, INTERES_PENDIENTE, INTERES_BANCARIO, INTERES_INVERSIONISTAS (pagado+pendiente), GASTOS y RETIRO_UTILIDADES, mas una fila RESULTADO con la suma de todas. Cuenta devengos de ambos lados.';
