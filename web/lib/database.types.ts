/**
 * Tipos escritos a mano en espejo de supabase/migrations/*.sql (no se generaron
 * con `supabase gen types` porque no hay CLI/login configurado en este entorno).
 * Si el esquema cambia, actualizar aqui tambien.
 */

export type EstadoPrestamo = "ACTIVO" | "PAGADO" | "CONGELADO" | "INCOBRABLE";
export type EstadoInversion = "VIGENTE" | "SIN_FONDEAR" | "LIQUIDADA";
export type ClaseContable = "BALANCE" | "INGRESO" | "GASTO";
export type Afecta = "CAPITAL" | "INTERES" | "OTROS";

export interface PersonaRow {
  id: number;
  codigo: string;
  nombre: string;
  identidad: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  es_prestatario: boolean;
  es_inversionista: boolean;
  cuenta_bancaria: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface PrestamoRow {
  id: number;
  codigo: string;
  persona_id: number;
  fecha_desembolso: string;
  estado: EstadoPrestamo;
  plazo_meses: number | null;
  dia_pago: number | null;
  origen: string | null;
  notas: string | null;
  created_at: string;
}

export interface TasaPrestamoRow {
  id: number;
  prestamo_id: number;
  tasa_mensual: number;
  vigente_desde: string;
  vigente_hasta: string | null;
}

export interface InversionRow {
  id: number;
  codigo: string;
  persona_id: number;
  fecha_aporte: string;
  estado: EstadoInversion;
  cuenta_acreditar: string | null;
  notas: string | null;
}

export interface TramoInversionRow {
  id: number;
  inversion_id: number;
  monto: number;
  tasa_mensual: number;
  vigente_desde: string;
  vigente_hasta: string | null;
}

export interface TipoMovimientoRow {
  id: number;
  codigo: string;
  descripcion: string | null;
  signo_caja: -1 | 0 | 1;
  afecta: Afecta;
  clase_contable: ClaseContable;
  es_devengado: boolean;
  activo: boolean;
}

export interface CategoriaRow {
  id: number;
  nombre: string;
  grupo: string | null;
  activo: boolean;
}

export interface MovimientoRow {
  id: number;
  fecha: string;
  tipo_movimiento_id: number;
  prestamo_id: number | null;
  inversion_id: number | null;
  categoria_id: number | null;
  monto: number;
  confirmado: boolean;
  nota: string | null;
  reversa_de: number | null;
  created_at: string;
  created_by: string | null;
}

export interface ParametroRow {
  clave: string;
  valor: string;
  descripcion: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface PeriodoCerradoRow {
  anio: number;
  mes: number;
  cerrado: boolean;
  cerrado_por: string | null;
  cerrado_en: string | null;
}

export interface VSaldosPrestamoRow {
  prestamo_id: number;
  prestamo_codigo: string;
  persona_id: number;
  estado: EstadoPrestamo;
  saldo_capital: number;
  capital_recuperado: number;
  int_cobrado: number;
  int_pendiente: number;
}

export interface VSaldosInversionRow {
  inversion_id: number;
  inversion_codigo: string;
  persona_id: number;
  estado: EstadoInversion;
  saldo_actual: number;
  int_pagado: number;
  int_pendiente: number;
}

export interface VFlujoCajaRow {
  flujo_caja: number;
  entradas: number;
  salidas: number;
}

export interface VFlujoCajaDetalleRow {
  codigo: string;
  monto: number;
}

export interface VCarteraPorEstadoRow {
  estado: EstadoPrestamo;
  saldo: number;
}

export interface VEstadoResultadosRow {
  clase_contable: ClaseContable;
  total: number;
}

export type ConceptoResultado =
  | "INTERES_COBRADO"
  | "INTERES_PENDIENTE"
  | "INTERES_BANCARIO"
  | "INTERES_INVERSIONISTAS"
  | "GASTOS"
  | "RETIRO_UTILIDADES"
  | "RESULTADO";

export interface VResultadoDetalleRow {
  concepto: ConceptoResultado;
  monto: number;
}

export interface VFlujoMensualRow {
  mes: string;
  ingresos: number;
  egresos: number;
  flujo_neto: number;
}

export interface VMoraRow {
  prestamo_id: number;
  prestamo_codigo: string;
  persona_id: number;
  persona_nombre: string;
  estado: EstadoPrestamo;
  dia_pago: number;
  fecha_pago_esperada: string;
  ultima_fecha_pago: string | null;
  dias_atraso: number;
  monto_pendiente: number;
}

