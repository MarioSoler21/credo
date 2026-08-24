-- ============================================================================
-- 20260824000001_dividendo_inversionista.sql
-- Nuevo tipo de movimiento para el pago de dividendos a inversionistas.
-- Es un egreso de caja (signo_caja = -1) pero, a diferencia del interes
-- pagado, no es un gasto del periodo: es una distribucion de utilidades ya
-- reconocidas, por lo que su clase_contable es BALANCE (no participa de
-- v_estado_resultados/v_resultado_detalle), igual que DEVOLUCION_INVERSION.
-- ============================================================================

insert into public.tipos_movimiento (codigo, signo_caja, afecta, clase_contable, es_devengado, descripcion) values
  ('DIVIDENDO_PAGADO_INV', -1, 'OTROS', 'BALANCE', false, 'Dividendo pagado a un inversionista (distribucion de utilidades, no es gasto del periodo)');
