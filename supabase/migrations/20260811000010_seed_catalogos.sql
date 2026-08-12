-- ============================================================================
-- 20260811000010_seed_catalogos.sql
-- Semilla de catalogos: tipos_movimiento, categorias, parametros.
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
