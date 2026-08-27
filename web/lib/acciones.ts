import type { ConceptoResultado } from "./database.types";

export type GrupoAccion = "PRESTAMOS" | "INVERSIONISTAS" | "OTROS";
export type Contexto = "prestamo" | "inversion" | "categoria";
export type SignoCaja = -1 | 0 | 1;

export interface AccionDef {
  id: string;
  etiqueta: string;
  grupo: GrupoAccion;
  /** codigo en tipos_movimiento -- nunca se muestra al usuario. */
  codigo: string;
  contexto: Contexto;
  signoCaja: SignoCaja;
  /** Como se lee en la linea de tiempo del prestamo/inversion. */
  linea: (montoTexto: string) => string;
  /** Si es true, pide escribir una palabra de confirmacion antes de guardar. */
  requiereConfirmacionEscrita?: boolean;
  /** Solo para contexto "categoria": nombres de categorias.categoria validas para esta accion. */
  categoriasSugeridas?: string[];
}

export const ACCIONES: AccionDef[] = [
  {
    id: "PRESTE_PLATA",
    etiqueta: "Desembolso de préstamo",
    grupo: "PRESTAMOS",
    codigo: "DESEMBOLSO",
    contexto: "prestamo",
    signoCaja: -1,
    linea: (m) => `Desembolso de ${m}`,
  },
  {
    id: "ME_PAGARON_CAPITAL",
    etiqueta: "Abono a capital",
    grupo: "PRESTAMOS",
    codigo: "ABONO_CAPITAL",
    contexto: "prestamo",
    signoCaja: 1,
    linea: (m) => `Abono a capital de ${m}`,
  },
  {
    id: "COBRE_INTERES",
    etiqueta: "Interés cobrado",
    grupo: "PRESTAMOS",
    codigo: "INTERES_COBRADO",
    contexto: "prestamo",
    signoCaja: 1,
    linea: (m) => `Interés cobrado: ${m}`,
  },
  {
    id: "NO_ME_PAGARON_INTERES",
    etiqueta: "Interés pendiente de cobro",
    grupo: "PRESTAMOS",
    codigo: "INTERES_PENDIENTE",
    contexto: "prestamo",
    signoCaja: 0,
    linea: (m) => `Interés pendiente de cobro: ${m}`,
  },
  {
    id: "DI_POR_PERDIDO",
    etiqueta: "Declarar préstamo incobrable",
    grupo: "PRESTAMOS",
    codigo: "PERDIDA_CARTERA",
    contexto: "prestamo",
    signoCaja: -1,
    linea: (m) => `Cartera declarada incobrable: ${m}`,
    requiereConfirmacionEscrita: true,
  },
  {
    id: "RECIBI_APORTE_INVERSIONISTA",
    etiqueta: "Aporte de inversionista",
    grupo: "INVERSIONISTAS",
    codigo: "APORTE_INVERSION",
    contexto: "inversion",
    signoCaja: 1,
    linea: (m) => `Aporte de capital: ${m}`,
  },
  {
    id: "DEVOLVI_PLATA_INVERSIONISTA",
    etiqueta: "Devolución de capital a inversionista",
    grupo: "INVERSIONISTAS",
    codigo: "DEVOLUCION_INVERSION",
    contexto: "inversion",
    signoCaja: -1,
    linea: (m) => `Devolución de capital: ${m}`,
  },
  {
    id: "LE_PAGUE_INTERES",
    etiqueta: "Interés pagado a inversionista",
    grupo: "INVERSIONISTAS",
    codigo: "INTERES_PAGADO_INV",
    contexto: "inversion",
    signoCaja: -1,
    linea: (m) => `Interés pagado: ${m}`,
  },
  {
    id: "LE_QUEDE_DEBIENDO_INTERES",
    etiqueta: "Interés pendiente de pago",
    grupo: "INVERSIONISTAS",
    codigo: "INTERES_PEND_INV",
    contexto: "inversion",
    signoCaja: 0,
    linea: (m) => `Interés pendiente de pago: ${m}`,
  },
  // Nota: un inversionista solo recibe interes por el capital que presto
  // (arriba) o la devolucion de ese capital. No existe "dividendo" como pago
  // a inversionista -- ver RETIRO_UTILIDADES en el grupo OTROS para el retiro
  // personal del dueno del negocio.
  {
    id: "BANCO_PAGO_INTERES",
    etiqueta: "Interés bancario recibido",
    grupo: "OTROS",
    codigo: "INTERES_BANCARIO",
    contexto: "categoria",
    signoCaja: 1,
    linea: (m) => `Interés bancario recibido: ${m}`,
    categoriasSugeridas: ["Interes bancario"],
  },
  {
    id: "PAGUE_GASTO",
    etiqueta: "Registro de gasto",
    grupo: "OTROS",
    codigo: "GASTO_OPERATIVO",
    contexto: "categoria",
    signoCaja: -1,
    linea: (m) => `Gasto registrado: ${m}`,
    categoriasSugeridas: ["Gastos de colocacion", "Tramite permiso de operacion"],
  },
  {
    id: "RETIRE_UTILIDADES",
    etiqueta: "Retiro de utilidades",
    grupo: "OTROS",
    codigo: "RETIRO_UTILIDADES",
    contexto: "categoria",
    signoCaja: -1,
    linea: (m) => `Retiro de utilidades: ${m}`,
    categoriasSugeridas: ["Retiro de utilidades"],
  },
];

export function accionPorId(id: string): AccionDef | undefined {
  return ACCIONES.find((a) => a.id === id);
}

export function accionPorCodigo(codigo: string): AccionDef | undefined {
  return ACCIONES.find((a) => a.codigo === codigo);
}

export const GRUPOS: { id: GrupoAccion; etiqueta: string }[] = [
  { id: "PRESTAMOS", etiqueta: "Préstamos" },
  { id: "INVERSIONISTAS", etiqueta: "Inversionistas" },
  { id: "OTROS", etiqueta: "Otros" },
];

/** Efecto en caja al aplicar `monto` con el signo de la accion, sobre la caja actual. */
export function previewCaja(cajaActual: number, monto: number, accion: AccionDef): number {
  return cajaActual + monto * accion.signoCaja;
}

const ETIQUETA_CONCEPTO: Record<ConceptoResultado, string> = {
  INTERES_COBRADO: "Interés cobrado",
  INTERES_PENDIENTE: "Interés pendiente de cobro",
  INTERES_BANCARIO: "Interés bancario",
  INTERES_INVERSIONISTAS: "Interés a inversionistas",
  GASTOS: "Gastos",
  RESULTADO: "Resultado",
};

export function etiquetaConcepto(concepto: ConceptoResultado): string {
  return ETIQUETA_CONCEPTO[concepto] ?? concepto;
}

const ETIQUETA_CODIGO_CAJA: Record<string, string> = {
  SALDO_INICIAL: "Saldo inicial",
  DESEMBOLSO: "Préstamos entregados",
  ABONO_CAPITAL: "Abonos a capital",
  INTERES_COBRADO: "Interés cobrado",
  INTERES_PENDIENTE: "Interés pendiente",
  APORTE_INVERSION: "Aportes de inversionistas",
  DEVOLUCION_INVERSION: "Devoluciones a inversionistas",
  INTERES_PAGADO_INV: "Interés pagado a inversionistas",
  INTERES_PEND_INV: "Interés pendiente a inversionista",
  DIVIDENDO_PAGADO_INV: "Dividendo pagado a inversionistas", // codigo historico, ya no se genera desde la app
  RETIRO_UTILIDADES: "Retiro de utilidades",
  INTERES_BANCARIO: "Interés del banco",
  GASTO_OPERATIVO: "Gastos operativos",
  OTRO_EGRESO: "Otros egresos",
  PERDIDA_CARTERA: "Cartera declarada incobrable",
};

export function etiquetaCodigoCaja(codigo: string): string {
  return ETIQUETA_CODIGO_CAJA[codigo] ?? codigo;
}
