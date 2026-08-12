-- ============================================================================
-- 1) BORRA todo lo que ya tocaste (personas, prestamos, inversiones,
--    movimientos). NO toca los catalogos (tipos_movimiento, categorias,
--    parametros) porque esos no se dañan al usar la app.
-- ============================================================================
truncate table
  public.movimientos,
  public.tramos_inversion,
  public.inversiones,
  public.tasas_prestamo,
  public.prestamos,
  public.personas
restart identity cascade;

-- ============================================================================
-- 2) EJEMPLO SENCILLO para que veas como funciona:
--    - Juan Pérez te debe L800 (le prestaste L1,000, te abonó L200)
--    - María López te debe L2,000 (le prestaste L2,000, todavia no abona)
--    - Carlos Martínez te invirtió L3,000
-- ============================================================================

insert into public.personas (codigo, nombre, telefono, es_prestatario, es_inversionista) values
  ('P-001', 'Juan Pérez',        '9999-0001', true,  false),
  ('P-002', 'María López',       '9999-0002', true,  false),
  ('P-003', 'Carlos Martínez',   '9999-0003', false, true);

insert into public.prestamos (codigo, persona_id, fecha_desembolso, estado, dia_pago) values
  ('PR-001', (select id from public.personas where codigo = 'P-001'), '2026-08-01', 'ACTIVO', 15),
  ('PR-002', (select id from public.personas where codigo = 'P-002'), '2026-08-01', 'ACTIVO', 15);

insert into public.tasas_prestamo (prestamo_id, tasa_mensual, vigente_desde) values
  ((select id from public.prestamos where codigo = 'PR-001'), 0.05, '2026-08-01'),
  ((select id from public.prestamos where codigo = 'PR-002'), 0.05, '2026-08-01');

insert into public.inversiones (codigo, persona_id, fecha_aporte, estado) values
  ('IV-001', (select id from public.personas where codigo = 'P-003'), '2026-08-01', 'VIGENTE');

insert into public.tramos_inversion (inversion_id, monto, tasa_mensual, vigente_desde) values
  ((select id from public.inversiones where codigo = 'IV-001'), 3000, 0.02, '2026-08-01');

-- Movimientos de los prestamos: desembolso, un abono, e interes cobrado
insert into public.movimientos (fecha, tipo_movimiento_id, prestamo_id, monto, confirmado) values
  ('2026-08-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'),     (select id from public.prestamos where codigo = 'PR-001'), 1000, true),
  ('2026-08-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'),     (select id from public.prestamos where codigo = 'PR-002'), 2000, true),
  ('2026-08-15', (select id from public.tipos_movimiento where codigo = 'ABONO_CAPITAL'),  (select id from public.prestamos where codigo = 'PR-001'), 200,  true),
  ('2026-08-15', (select id from public.tipos_movimiento where codigo = 'INTERES_COBRADO'),(select id from public.prestamos where codigo = 'PR-001'), 50,   true),
  ('2026-08-15', (select id from public.tipos_movimiento where codigo = 'INTERES_COBRADO'),(select id from public.prestamos where codigo = 'PR-002'), 100,  true);

-- Movimientos de la inversion: aporte e interes que le pagaste
insert into public.movimientos (fecha, tipo_movimiento_id, inversion_id, monto, confirmado) values
  ('2026-08-01', (select id from public.tipos_movimiento where codigo = 'APORTE_INVERSION'),  (select id from public.inversiones where codigo = 'IV-001'), 3000, true),
  ('2026-08-15', (select id from public.tipos_movimiento where codigo = 'INTERES_PAGADO_INV'),(select id from public.inversiones where codigo = 'IV-001'), 60,   true);

-- ============================================================================
-- Con esto, al abrir la app deberías ver:
--   Juan Pérez:      debe L800  (prestaste 1000, te pagó 200 de capital + 50 de interés)
--   María López:     debe L2,000 (prestaste 2000, todavía no te ha pagado nada)
--   Carlos Martínez: te invirtió L3,000 (le pagaste L60 de interés)
--   Efectivo en caja: L290  (-1000 -2000 +200 +50 +100 +3000 -60)
-- ============================================================================
