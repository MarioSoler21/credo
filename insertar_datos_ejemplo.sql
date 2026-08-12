-- ============================================================================
-- Datos de ejemplo: 27 personas, 19 prestamos, 8 inversiones, 64 movimientos
-- Generado a partir de credo_datos_ejemplo.xlsx. Verificado contra la prueba de
-- aceptacion: v_flujo_caja = 1976.12, v_cartera_por_estado ACTIVO 19850.00,
-- CONGELADO 6300.00, INCOBRABLE 32260.00, PAGADO 0.00.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- personas
-- ----------------------------------------------------------------------------
insert into public.personas (codigo, nombre, identidad, es_prestatario, es_inversionista, cuenta_bancaria, notas) values
  ('P001', 'PRESTAMO 1', null, true, false, null, 'Nombre real pendiente de registrar (en PTM solo dice ''PRESTAMO 1'')'),
  ('P002', 'PRESTAMO 2', null, true, false, null, 'Nombre real pendiente de registrar'),
  ('P003', 'PRESTAMO 3', null, true, false, null, 'Nombre real pendiente de registrar'),
  ('P004', 'PRESTAMO 4', null, true, false, null, 'Nombre real pendiente de registrar'),
  ('P005', 'PRESTAMO 5', null, true, false, null, 'Nombre real pendiente de registrar'),
  ('P006', 'PRESTAMO 6', null, true, false, null, 'Nombre real pendiente de registrar'),
  ('P007', 'PRESTAMO 7', null, true, false, null, 'Nombre real pendiente de registrar'),
  ('P008', 'PRESTAMO 8', null, true, false, null, 'Nombre real pendiente de registrar'),
  ('P009', 'PRESTAMO 9', null, true, false, null, 'Nombre real pendiente de registrar'),
  ('P010', 'PRESTAMO 10', null, true, false, null, 'Nombre real pendiente de registrar'),
  ('P011', 'DEUDOR 1', null, true, false, null, 'Cartera congelada'),
  ('P012', 'DEUDOR 2', null, true, false, null, 'Cartera congelada'),
  ('P013', 'DEUDOR 3', null, true, false, null, 'Cartera congelada'),
  ('P014', 'DEUDOR 4', null, true, false, null, 'Cartera congelada'),
  ('P015', 'DEUDOR 5', null, true, false, null, 'Cartera congelada'),
  ('P016', 'DEUDOR 6', null, true, false, null, 'Cartera congelada'),
  ('P017', 'EDUARDO KALEB RIVERA REYES', '0501-1999-01916', true, false, null, 'Incobrable. 10K de PTM otorgado el 21/09/2025 e int. de sept. a dic. por L2,640 al 4%'),
  ('P018', 'JORGE LUIS MEDRANO ANDINO', null, true, false, null, 'Incobrable desde 2024. Pago de L500 pendiente de confirmar'),
  ('P019', 'JACOBO MADRID / EMELY CHAPINA', null, true, false, null, 'Incobrable'),
  ('P020', 'INVERSIONISTA 1', null, false, true, null, 'Nombre real pendiente de registrar'),
  ('P021', 'INVERSIONISTA 2', null, false, true, null, 'Nombre real pendiente de registrar'),
  ('P022', 'ANA MARIA RAMIREZ', null, false, true, '12-345-6789-0', 'Inversionista 3 en hoja INVERS'),
  ('P023', 'INVERSIONISTA 4', null, false, true, null, 'Nombre real pendiente de registrar'),
  ('P024', 'INVERSIONISTA 5', null, false, true, null, 'Sin fondear'),
  ('P025', 'INVERSIONISTA 6', null, false, true, null, 'Sin fondear'),
  ('P026', 'OLGA RODRIGUEZ', null, false, true, null, 'Hoja INVERS2, sin fondear'),
  ('P027', 'LAZARO RIVERA', null, false, true, null, 'Hoja INVERS2, sin fondear');

-- ----------------------------------------------------------------------------
-- prestamos
-- ----------------------------------------------------------------------------
insert into public.prestamos (codigo, persona_id, fecha_desembolso, estado, origen) values
  ('PR-01', (select id from public.personas where codigo = 'P001'), '2026-01-01', 'ACTIVO', 'PTM'),
  ('PR-02', (select id from public.personas where codigo = 'P002'), '2026-01-01', 'ACTIVO', 'PTM'),
  ('PR-03', (select id from public.personas where codigo = 'P003'), '2026-01-01', 'ACTIVO', 'PTM'),
  ('PR-04', (select id from public.personas where codigo = 'P004'), '2026-01-01', 'ACTIVO', 'PTM'),
  ('PR-05', (select id from public.personas where codigo = 'P005'), '2026-01-01', 'ACTIVO', 'PTM'),
  ('PR-06', (select id from public.personas where codigo = 'P006'), '2026-01-01', 'ACTIVO', 'PTM'),
  ('PR-07', (select id from public.personas where codigo = 'P007'), '2026-01-01', 'ACTIVO', 'PTM'),
  ('PR-08', (select id from public.personas where codigo = 'P008'), '2026-01-01', 'ACTIVO', 'PTM'),
  ('PR-09', (select id from public.personas where codigo = 'P009'), '2026-01-01', 'ACTIVO', 'PTM'),
  ('PR-10', (select id from public.personas where codigo = 'P010'), '2026-01-01', 'PAGADO', 'PTM'),
  ('PR-11', (select id from public.personas where codigo = 'P011'), '2026-01-15', 'CONGELADO', 'REC. CONGELAD'),
  ('PR-12', (select id from public.personas where codigo = 'P012'), '2026-01-15', 'CONGELADO', 'REC. CONGELAD'),
  ('PR-13', (select id from public.personas where codigo = 'P013'), '2026-01-01', 'CONGELADO', 'REC. CONGELAD'),
  ('PR-14', (select id from public.personas where codigo = 'P014'), '2026-01-01', 'CONGELADO', 'REC. CONGELAD'),
  ('PR-15', (select id from public.personas where codigo = 'P015'), '2026-01-01', 'CONGELADO', 'REC. CONGELAD'),
  ('PR-16', (select id from public.personas where codigo = 'P016'), '2026-01-01', 'CONGELADO', 'REC. CONGELAD'),
  ('PR-17', (select id from public.personas where codigo = 'P017'), '2025-12-31', 'INCOBRABLE', 'REC. INCOBRABLES'),
  ('PR-18', (select id from public.personas where codigo = 'P018'), '2025-12-31', 'INCOBRABLE', 'REC. INCOBRABLES'),
  ('PR-19', (select id from public.personas where codigo = 'P019'), '2025-12-31', 'INCOBRABLE', 'REC. INCOBRABLES');

-- ----------------------------------------------------------------------------
-- tasas_prestamo (una tasa vigente por prestamo, desde la fecha de desembolso)
-- ----------------------------------------------------------------------------
insert into public.tasas_prestamo (prestamo_id, tasa_mensual, vigente_desde) values
  ((select id from public.prestamos where codigo = 'PR-01'), 0.05, '2026-01-01'),
  ((select id from public.prestamos where codigo = 'PR-02'), 0.03, '2026-01-01'),
  ((select id from public.prestamos where codigo = 'PR-03'), 0.02, '2026-01-01'),
  ((select id from public.prestamos where codigo = 'PR-04'), 0.02, '2026-01-01'),
  ((select id from public.prestamos where codigo = 'PR-05'), 0.04, '2026-01-01'),
  ((select id from public.prestamos where codigo = 'PR-06'), 0.035, '2026-01-01'),
  ((select id from public.prestamos where codigo = 'PR-07'), 0.035, '2026-01-01'),
  ((select id from public.prestamos where codigo = 'PR-08'), 0.045, '2026-01-01'),
  ((select id from public.prestamos where codigo = 'PR-09'), 0.045, '2026-01-01'),
  ((select id from public.prestamos where codigo = 'PR-10'), 0.05, '2026-01-01'),
  ((select id from public.prestamos where codigo = 'PR-11'), 0, '2026-01-15'),
  ((select id from public.prestamos where codigo = 'PR-12'), 0, '2026-01-15'),
  ((select id from public.prestamos where codigo = 'PR-13'), 0, '2026-01-01'),
  ((select id from public.prestamos where codigo = 'PR-14'), 0, '2026-01-01'),
  ((select id from public.prestamos where codigo = 'PR-15'), 0, '2026-01-01'),
  ((select id from public.prestamos where codigo = 'PR-16'), 0, '2026-01-01'),
  ((select id from public.prestamos where codigo = 'PR-17'), 0.04, '2025-12-31'),
  ((select id from public.prestamos where codigo = 'PR-18'), 0, '2025-12-31'),
  ((select id from public.prestamos where codigo = 'PR-19'), 0, '2025-12-31');

-- ----------------------------------------------------------------------------
-- inversiones
-- ----------------------------------------------------------------------------
insert into public.inversiones (codigo, persona_id, fecha_aporte, estado, cuenta_acreditar, notas) values
  ('IV-01', (select id from public.personas where codigo = 'P020'), '2026-01-01', 'VIGENTE', null, null),
  ('IV-02', (select id from public.personas where codigo = 'P021'), '2026-01-01', 'VIGENTE', null, null),
  ('IV-03', (select id from public.personas where codigo = 'P022'), '2026-01-01', 'VIGENTE', '12-345-6789-0', null),
  ('IV-04', (select id from public.personas where codigo = 'P023'), '2026-01-01', 'VIGENTE', null, null),
  ('IV-05', (select id from public.personas where codigo = 'P024'), '2026-01-01', 'SIN_FONDEAR', null, null),
  ('IV-06', (select id from public.personas where codigo = 'P025'), '2026-01-01', 'SIN_FONDEAR', null, null),
  ('IV-07', (select id from public.personas where codigo = 'P026'), '2026-01-01', 'SIN_FONDEAR', null, 'Sin fondear; fecha de alta estimada (no registrada en el Excel original).'),
  ('IV-08', (select id from public.personas where codigo = 'P027'), '2026-01-01', 'SIN_FONDEAR', null, 'Sin fondear; fecha de alta estimada (no registrada en el Excel original).');

-- ----------------------------------------------------------------------------
-- tramos_inversion (solo inversiones con capital fondeado; monto debe ser > 0)
-- ----------------------------------------------------------------------------
insert into public.tramos_inversion (inversion_id, monto, tasa_mensual, vigente_desde) values
  ((select id from public.inversiones where codigo = 'IV-01'), 10000, 0.0125, '2026-01-01'),
  ((select id from public.inversiones where codigo = 'IV-02'), 7000, 0.015, '2026-01-01'),
  ((select id from public.inversiones where codigo = 'IV-03'), 12000, 0.0125, '2026-01-01'),
  ((select id from public.inversiones where codigo = 'IV-04'), 3000, 0.025, '2026-01-01');

-- ----------------------------------------------------------------------------
-- movimientos (64 filas). 7 filas no traian fecha en el Excel original; se les
-- asigna 2026-01-31 como placeholder y se marca en la nota - hay que corregirlas
-- con la fecha real cuando se tenga.
-- ----------------------------------------------------------------------------
insert into public.movimientos (fecha, tipo_movimiento_id, prestamo_id, inversion_id, categoria_id, monto, confirmado, nota) values
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-01'), null, null, 2000, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'ABONO_CAPITAL'), (select id from public.prestamos where codigo = 'PR-01'), null, null, 300, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'INTERES_COBRADO'), (select id from public.prestamos where codigo = 'PR-01'), null, null, 100, true, null),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-02'), null, null, 800, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-02'), null, null, 200, true, 'Desembolso adicional'),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'INTERES_COBRADO'), (select id from public.prestamos where codigo = 'PR-02'), null, null, 24, true, null),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-03'), null, null, 4200, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'ABONO_CAPITAL'), (select id from public.prestamos where codigo = 'PR-03'), null, null, 200, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'INTERES_COBRADO'), (select id from public.prestamos where codigo = 'PR-03'), null, null, 84, true, null),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-04'), null, null, 1000, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'INTERES_PENDIENTE'), (select id from public.prestamos where codigo = 'PR-04'), null, null, 40, true, 'Interes atrasado'),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-05'), null, null, 1000, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-05'), null, null, 1000, true, 'Desembolso adicional'),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'INTERES_COBRADO'), (select id from public.prestamos where codigo = 'PR-05'), null, null, 40, true, null),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-06'), null, null, 1000, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'INTERES_PENDIENTE'), (select id from public.prestamos where codigo = 'PR-06'), null, null, 35, true, 'Interes atrasado'),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-07'), null, null, 1200, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'ABONO_CAPITAL'), (select id from public.prestamos where codigo = 'PR-07'), null, null, 50, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'INTERES_COBRADO'), (select id from public.prestamos where codigo = 'PR-07'), null, null, 42, true, null),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-08'), null, null, 5000, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-08'), null, null, 2000, true, 'Desembolso adicional'),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'INTERES_COBRADO'), (select id from public.prestamos where codigo = 'PR-08'), null, null, 225, true, null),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-09'), null, null, 1000, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'INTERES_PENDIENTE'), (select id from public.prestamos where codigo = 'PR-09'), null, null, 45, true, 'Interes atrasado'),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-10'), null, null, 1500, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'ABONO_CAPITAL'), (select id from public.prestamos where codigo = 'PR-10'), null, null, 1500, true, 'Cancela el prestamo'),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'INTERES_COBRADO'), (select id from public.prestamos where codigo = 'PR-10'), null, null, 75, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-11'), null, null, 500, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-12'), null, null, 700, true, null),
  ('2026-01-30', (select id from public.tipos_movimiento where codigo = 'ABONO_CAPITAL'), (select id from public.prestamos where codigo = 'PR-12'), null, null, 300, true, null),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-13'), null, null, 2000, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'ABONO_CAPITAL'), (select id from public.prestamos where codigo = 'PR-13'), null, null, 100, true, null),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-14'), null, null, 3000, true, null),
  ('2026-01-29', (select id from public.tipos_movimiento where codigo = 'ABONO_CAPITAL'), (select id from public.prestamos where codigo = 'PR-14'), null, null, 200, true, null),
  ('2026-04-14', (select id from public.tipos_movimiento where codigo = 'ABONO_CAPITAL'), (select id from public.prestamos where codigo = 'PR-14'), null, null, 200, true, null),
  ('2026-04-29', (select id from public.tipos_movimiento where codigo = 'ABONO_CAPITAL'), (select id from public.prestamos where codigo = 'PR-14'), null, null, 200, true, null),
  ('2026-06-12', (select id from public.tipos_movimiento where codigo = 'ABONO_CAPITAL'), (select id from public.prestamos where codigo = 'PR-14'), null, null, 200, true, null),
  ('2026-07-14', (select id from public.tipos_movimiento where codigo = 'ABONO_CAPITAL'), (select id from public.prestamos where codigo = 'PR-14'), null, null, 200, true, null),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-15'), null, null, 500, true, null),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'DESEMBOLSO'), (select id from public.prestamos where codigo = 'PR-16'), null, null, 1000, true, null),
  ('2025-12-31', (select id from public.tipos_movimiento where codigo = 'SALDO_INICIAL'), (select id from public.prestamos where codigo = 'PR-17'), null, null, 12640, true, 'Saldo de apertura 2026 (viene de 2025)'),
  ('2025-12-31', (select id from public.tipos_movimiento where codigo = 'SALDO_INICIAL'), (select id from public.prestamos where codigo = 'PR-18'), null, null, 7250, true, 'Saldo de apertura 2026 (viene de 2024)'),
  ('2026-01-31', (select id from public.tipos_movimiento where codigo = 'ABONO_CAPITAL'), (select id from public.prestamos where codigo = 'PR-18'), null, null, 500, false, 'Pago pendiente de confirmar - NO entra a caja | Fecha estimada (2026-01-31), no registrada en el Excel original.'),
  ('2025-12-31', (select id from public.tipos_movimiento where codigo = 'SALDO_INICIAL'), (select id from public.prestamos where codigo = 'PR-19'), null, null, 12870, true, 'Saldo de apertura 2026'),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'APORTE_INVERSION'), null, (select id from public.inversiones where codigo = 'IV-01'), null, 10000, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'DEVOLUCION_INVERSION'), null, (select id from public.inversiones where codigo = 'IV-01'), null, 3000, true, null),
  ('2026-01-30', (select id from public.tipos_movimiento where codigo = 'INTERES_PAGADO_INV'), null, (select id from public.inversiones where codigo = 'IV-01'), null, 72.5, true, 'L3,000 al 1.25% + L7,000 al 0.50%'),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'APORTE_INVERSION'), null, (select id from public.inversiones where codigo = 'IV-02'), null, 7000, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'INTERES_PEND_INV'), null, (select id from public.inversiones where codigo = 'IV-02'), null, 89, true, 'L4,000 al 1.5% + L2,000 al 1.2% + L1,000 al 0.5%'),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'APORTE_INVERSION'), null, (select id from public.inversiones where codigo = 'IV-03'), null, 12000, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'INTERES_PEND_INV'), null, (select id from public.inversiones where codigo = 'IV-03'), null, 150, true, 'L12,000 al 1.25%'),
  ('2026-01-01', (select id from public.tipos_movimiento where codigo = 'APORTE_INVERSION'), null, (select id from public.inversiones where codigo = 'IV-04'), null, 3000, true, null),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'APORTE_INVERSION'), null, (select id from public.inversiones where codigo = 'IV-04'), null, 2000, true, 'Aporte adicional'),
  ('2026-01-15', (select id from public.tipos_movimiento where codigo = 'INTERES_PAGADO_INV'), null, (select id from public.inversiones where codigo = 'IV-04'), null, 75, true, 'L3,000 al 2.5%'),
  ('2026-01-31', (select id from public.tipos_movimiento where codigo = 'DEVOLUCION_INVERSION'), null, (select id from public.inversiones where codigo = 'IV-04'), null, 500, true, 'Fecha no registrada en el Excel original | Fecha estimada (2026-01-31), no registrada en el Excel original.'),
  ('2026-01-31', (select id from public.tipos_movimiento where codigo = 'DEVOLUCION_INVERSION'), null, (select id from public.inversiones where codigo = 'IV-04'), null, 1500, true, 'Fecha no registrada en el Excel original | Fecha estimada (2026-01-31), no registrada en el Excel original.'),
  ('2026-01-31', (select id from public.tipos_movimiento where codigo = 'DEVOLUCION_INVERSION'), null, (select id from public.inversiones where codigo = 'IV-04'), null, 200, true, 'Fecha no registrada en el Excel original | Fecha estimada (2026-01-31), no registrada en el Excel original.'),
  ('2025-12-31', (select id from public.tipos_movimiento where codigo = 'INTERES_BANCARIO'), null, null, (select id from public.categorias where nombre = 'Interes bancario'), 2.7, true, 'Diciembre 2025 - hoja INT.BANC'),
  ('2026-01-31', (select id from public.tipos_movimiento where codigo = 'INTERES_BANCARIO'), null, null, (select id from public.categorias where nombre = 'Interes bancario'), 1.25, true, 'Enero - hoja INT.BANC'),
  ('2026-02-28', (select id from public.tipos_movimiento where codigo = 'INTERES_BANCARIO'), null, null, (select id from public.categorias where nombre = 'Interes bancario'), 3, true, 'Febrero - hoja INT.BANC'),
  ('2026-03-31', (select id from public.tipos_movimiento where codigo = 'INTERES_BANCARIO'), null, null, (select id from public.categorias where nombre = 'Interes bancario'), 16.67, true, 'Marzo - hoja INT.BANC'),
  ('2026-01-31', (select id from public.tipos_movimiento where codigo = 'GASTO_OPERATIVO'), null, null, (select id from public.categorias where nombre = 'Gastos de colocacion'), 40, true, 'Registro manual en LIBRETA, sin fecha | Fecha estimada (2026-01-31), no registrada en el Excel original.'),
  ('2026-01-31', (select id from public.tipos_movimiento where codigo = 'OTRO_EGRESO'), null, null, (select id from public.categorias where nombre = 'Tramite permiso de operacion'), 100, true, 'Registro manual en LIBRETA, sin fecha | Fecha estimada (2026-01-31), no registrada en el Excel original.'),
  ('2026-01-31', (select id from public.tipos_movimiento where codigo = 'PERDIDA_CARTERA'), null, null, (select id from public.categorias where nombre = 'Pasado a perdidas'), 1000, true, 'Registro manual en LIBRETA, sin fecha | Fecha estimada (2026-01-31), no registrada en el Excel original.');

-- ============================================================================
-- Verificacion (deberia dar exactamente esto):
--   select * from public.v_flujo_caja;               -> flujo_caja = 1976.12
--   select * from public.v_cartera_por_estado order by estado;
--     ACTIVO 19850.00, CONGELADO 6300.00, INCOBRABLE 32260.00, PAGADO 0.00
-- ============================================================================