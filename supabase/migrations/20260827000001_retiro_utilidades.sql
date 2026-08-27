-- ============================================================================
-- 20260827000001_retiro_utilidades.sql
--
-- Reglas de negocio confirmadas (2026-08-27):
--
--  1. El interes atrasado NO genera interes compuesto ni recargos por mora.
--     Ya es el comportamiento actual: v_saldos_prestamo/v_saldos_inversion e
--     interesPresupuestado (web/lib/queries.ts) calculan el interes de cada
--     corte solo sobre el saldo de CAPITAL, nunca sobre INTERES_PENDIENTE /
--     INTERES_PEND_INV. No requiere cambios de esquema.
--
--  2. Un inversionista SOLO recibe pago de interes por el capital que presto
--     (INTERES_PAGADO_INV) o la devolucion de ese capital (DEVOLUCION_INVERSION).
--     Ya no existe un "dividendo" pagado a un inversionista.
--
--  3. Lo que antes era "dividendo" se reclasifica como RETIRO_UTILIDADES: el
--     retiro que el dueno del negocio hace para uso personal. No esta ligado
--     a ningun inversionista ni prestamo -- usa contexto "categoria", igual
--     que un gasto (ver categoria "Retiro de utilidades" abajo). Es un
--     egreso real de caja (signo_caja = -1) pero, igual que DIVIDENDO_PAGADO_INV
--     y DEVOLUCION_INVERSION, NO es un gasto del periodo: es una distribucion
--     de utilidades/capital ya reconocidas, por eso su clase_contable es
--     BALANCE (no participa de v_estado_resultados/v_resultado_detalle).
--
--     DIVIDENDO_PAGADO_INV (agregado en 20260824000001) NO se elimina, para
--     no romper movimientos historicos que ya lo hayan usado -- simplemente
--     se deja de ofrecer en el asistente de Registrar (ver web/lib/acciones.ts).
--
--  4. plazo_meses en `prestamos` ya es opcional (nullable, sin default) y
--     buscarOCrearPrestamoActivo() nunca lo fija al desembolsar: todo
--     prestamo nuevo ya nace a plazo indefinido (solo interes periodico), y
--     getPresupuestoPrestamo() ya trata plazo_meses = null como "sin
--     amortizacion de capital esperada". No requiere cambios de esquema; se
--     agrega en la app un boton "Definir plazo" para fijarlo cuando un caso
--     puntual lo necesite (ver AccionesPrestamo.tsx / actualizarPlazo()).
-- ============================================================================

insert into public.tipos_movimiento (codigo, signo_caja, afecta, clase_contable, es_devengado, descripcion) values
  ('RETIRO_UTILIDADES', -1, 'OTROS', 'BALANCE', false, 'Retiro de utilidades del dueno del negocio para uso personal (no es gasto operativo ni pago a inversionista)')
on conflict (codigo) do nothing;

insert into public.categorias (nombre, grupo) values
  ('Retiro de utilidades', 'RETIRO DE UTILIDADES')
on conflict (nombre) do nothing;
