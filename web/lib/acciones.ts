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
    etiqueta: "Presté plata",
    grupo: "PRESTAMOS",
    codigo: "DESEMBOLSO",
    contexto: "prestamo",
    signoCaja: -1,
    linea: (m) => `Le prestaste ${m}`,
  },
  {
    id: "ME_PAGARON_CAPITAL",
    etiqueta: "Me pagaron capital",
    grupo: "PRESTAMOS",
    codigo: "ABONO_CAPITAL",
    contexto: "prestamo",
    signoCaja: 1,
    linea: (m) => `Te pagó ${m} de capital`,
  },
  {
    id: "COBRE_INTERES",
    etiqueta: "Cobré el interés",
    grupo: "PRESTAMOS",
    codigo: "INTERES_COBRADO",
    contexto: "prestamo",
    signoCaja: 1,
    linea: (m) => `Te pagó ${m} de interés`,
  },
  {
    id: "NO_ME_PAGARON_INTERES",
    etiqueta: "No me pagaron el interés",
    grupo: "PRESTAMOS",
    codigo: "INTERES_PENDIENTE",
    contexto: "prestamo",
    signoCaja: 0,
    linea: (m) => `Quedó debiéndote ${m} de interés`,
  },
  {
    id: "DI_POR_PERDIDO",
    etiqueta: "Di por perdido este préstamo",
    grupo: "PRESTAMOS",
    codigo: "PERDIDA_CARTERA",
    contexto: "prestamo",
    signoCaja: -1,
    linea: (m) => `Diste por perdido ${m}`,
    requiereConfirmacionEscrita: true,
  },
  {
    id: "RECIBI_APORTE_INVERSIONISTA",
    etiqueta: "Recibí plata de un inversionista",
    grupo: "INVERSIONISTAS",
    codigo: "APORTE_INVERSION",
    contexto: "inversion",
    signoCaja: 1,
    linea: (m) => `Te aportó ${m}`,
  },
  {
    id: "DEVOLVI_PLATA_INVERSIONISTA",
    etiqueta: "Le devolví plata al inversionista",
    grupo: "INVERSIONISTAS",
    codigo: "DEVOLUCION_INVERSION",
    contexto: "inversion",
    signoCaja: -1,
    linea: (m) => `Le devolviste ${m}`,
  },
  {
    id: "LE_PAGUE_INTERES",
    etiqueta: "Le pagué el interés",
    grupo: "INVERSIONISTAS",
    codigo: "INTERES_PAGADO_INV",
    contexto: "inversion",
    signoCaja: -1,
    linea: (m) => `Le pagaste ${m} de interés`,
  },
  {
    id: "LE_QUEDE_DEBIENDO_INTERES",
    etiqueta: "Le quedé debiendo el interés",
    grupo: "INVERSIONISTAS",
    codigo: "INTERES_PEND_INV",
    contexto: "inversion",
    signoCaja: 0,
    linea: (m) => `Quedaste debiéndole ${m} de interés`,
  },
  {
    id: "BANCO_PAGO_INTERES",
    etiqueta: "El banco me pagó interés",
    grupo: "OTROS",
    codigo: "INTERES_BANCARIO",
    contexto: "categoria",
    signoCaja: 1,
    linea: (m) => `El banco te pagó ${m} de interés`,
    categoriasSugeridas: ["Interes bancario"],
  },
  {
    id: "PAGUE_GASTO",
    etiqueta: "Pagué un gasto",
    grupo: "OTROS",
    codigo: "GASTO_OPERATIVO",
    contexto: "categoria",
    signoCaja: -1,
    linea: (m) => `Pagaste ${m} de gasto`,
    categoriasSugeridas: ["Gastos de colocacion", "Tramite permiso de operacion"],
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
  INTERES_COBRADO: "Lo que te pagaron de interés",
  INTERES_PENDIENTE: "Lo que te deben de interés",
  INTERES_BANCARIO: "El banco te pagó",
  INTERES_INVERSIONISTAS: "Lo que le debés a inversionistas",
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
  INTERES_BANCARIO: "Interés del banco",
  GASTO_OPERATIVO: "Gastos operativos",
  OTRO_EGRESO: "Otros egresos",
  PERDIDA_CARTERA: "Préstamos dados por perdidos",
};

export function etiquetaCodigoCaja(codigo: string): string {
  return ETIQUETA_CODIGO_CAJA[codigo] ?? codigo;
}
