import { supabase } from "./supabase";
import type {
  PersonaRow,
  PrestamoRow,
  InversionRow,
  VFlujoCajaRow,
  VFlujoCajaDetalleRow,
  VCarteraPorEstadoRow,
  VResultadoDetalleRow,
  VFlujoMensualRow,
  VMoraRow,
  VSaldosPrestamoRow,
  VSaldosInversionRow,
  MovimientoRow,
  TasaPrestamoRow,
  TramoInversionRow,
} from "./database.types";

function lanzarSiError<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/** Mapa id -> nombre de todas las personas activas. Tablas chicas (cooperativa pequeña): se trae completa. */
async function mapaNombresPersonas(): Promise<Map<number, string>> {
  const res = await supabase.from("personas").select("id, nombre");
  const filas = lanzarSiError(res) ?? [];
  return new Map(filas.map((f) => [f.id, f.nombre]));
}

/** Mapa id -> codigo de todos los tipos de movimiento. Catalogo chico, se trae completo. */
async function mapaCodigosTipoMovimiento(): Promise<Map<number, string>> {
  const res = await supabase.from("tipos_movimiento").select("id, codigo");
  const filas = lanzarSiError(res) ?? [];
  return new Map(filas.map((f) => [f.id, f.codigo]));
}

// ---------------------------------------------------------------------------
// Dashboard ("Mi Libreta")
// ---------------------------------------------------------------------------

export async function getFlujoCaja(): Promise<VFlujoCajaRow> {
  const res = await supabase.from("v_flujo_caja").select("*").single();
  return lanzarSiError(res);
}

export async function getFlujoCajaDetalle(): Promise<VFlujoCajaDetalleRow[]> {
  const res = await supabase.from("v_flujo_caja_detalle").select("*");
  return lanzarSiError(res) ?? [];
}

export async function getCarteraPorEstado(): Promise<VCarteraPorEstadoRow[]> {
  const res = await supabase.from("v_cartera_por_estado").select("*");
  return lanzarSiError(res) ?? [];
}

export async function getResultadoDetalle(): Promise<VResultadoDetalleRow[]> {
  const res = await supabase.from("v_resultado_detalle").select("*");
  return lanzarSiError(res) ?? [];
}

export async function getFlujoMensual(): Promise<VFlujoMensualRow[]> {
  const res = await supabase.from("v_flujo_mensual").select("*").order("mes", { ascending: true });
  return lanzarSiError(res) ?? [];
}

export async function getMora(): Promise<VMoraRow[]> {
  const res = await supabase
    .from("v_mora")
    .select("*")
    .order("monto_pendiente", { ascending: false });
  return lanzarSiError(res) ?? [];
}

export interface ResumenInversionistas {
  saldoTotal: number;
  interesPendienteTotal: number;
}

export async function getResumenInversionistas(): Promise<ResumenInversionistas> {
  const res = await supabase.from("v_saldos_inversion").select("saldo_actual, int_pendiente");
  const filas = lanzarSiError(res) ?? [];
  return filas.reduce(
    (acc, f) => ({
      saldoTotal: acc.saldoTotal + f.saldo_actual,
      interesPendienteTotal: acc.interesPendienteTotal + f.int_pendiente,
    }),
    { saldoTotal: 0, interesPendienteTotal: 0 },
  );
}

export interface MovimientoPendiente extends MovimientoRow {
  tipo_codigo: string;
}

export interface Pendientes {
  movimientosSinConfirmar: MovimientoPendiente[];
  personasSinNombre: PersonaRow[];
  prestamosSinDiaPago: (PrestamoRow & { persona_nombre: string })[];
}

export async function getPendientes(): Promise<Pendientes> {
  const [sinConfirmarRes, sinNombreRes, sinDiaPagoRes, nombres, codigos] = await Promise.all([
    supabase.from("movimientos").select("*").eq("confirmado", false).order("fecha", { ascending: false }),
    supabase.from("personas").select("*").eq("nombre", ""),
    supabase.from("prestamos").select("*").eq("estado", "ACTIVO").is("dia_pago", null),
    mapaNombresPersonas(),
    mapaCodigosTipoMovimiento(),
  ]);

  const movimientosSinConfirmar = (lanzarSiError(sinConfirmarRes) ?? []).map((m) => ({
    ...m,
    tipo_codigo: codigos.get(m.tipo_movimiento_id) ?? "",
  }));
  const personasSinNombre = lanzarSiError(sinNombreRes) ?? [];
  const prestamosSinDiaPago = (lanzarSiError(sinDiaPagoRes) ?? []).map((p) => ({
    ...p,
    persona_nombre: nombres.get(p.persona_id) ?? "",
  }));

  return { movimientosSinConfirmar, personasSinNombre, prestamosSinDiaPago };
}

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------

export async function buscarPersonas(texto: string): Promise<PersonaRow[]> {
  let query = supabase.from("personas").select("*").eq("activo", true).order("nombre");
  if (texto.trim()) {
    query = query.ilike("nombre", `%${texto.trim()}%`);
  }
  const res = await query.limit(20);
  return lanzarSiError(res) ?? [];
}

export async function getPersona(id: number): Promise<PersonaRow> {
  const res = await supabase.from("personas").select("*").eq("id", id).single();
  return lanzarSiError(res);
}

// ---------------------------------------------------------------------------
// Estado de cuenta (por persona: cada prestamo y cada inversion por separado)
// ---------------------------------------------------------------------------

export interface LineaEstadoCuenta {
  id: number;
  fecha: string;
  tipo_codigo: string;
  cargo: number | null;
  abono: number | null;
  interes: number | null;
  saldo: number;
  confirmado: boolean;
  esReverso: boolean;
  nota: string | null;
}

export interface EstadoCuentaPrestamo {
  prestamo: PrestamoRow;
  saldo: VSaldosPrestamoRow;
  lineas: LineaEstadoCuenta[];
}

export interface EstadoCuentaInversion {
  inversion: InversionRow;
  saldo: VSaldosInversionRow;
  lineas: LineaEstadoCuenta[];
}

export interface EstadoCuentaPersona {
  persona: PersonaRow;
  prestamos: EstadoCuentaPrestamo[];
  inversiones: EstadoCuentaInversion[];
}

const CARGO_PRESTAMO = new Set(["SALDO_INICIAL", "DESEMBOLSO"]);
const ABONO_PRESTAMO = new Set(["ABONO_CAPITAL"]);
const INTERES_PRESTAMO = new Set(["INTERES_COBRADO", "INTERES_PENDIENTE"]);

const CARGO_INVERSION = new Set(["APORTE_INVERSION"]);
const ABONO_INVERSION = new Set(["DEVOLUCION_INVERSION"]);
const INTERES_INVERSION = new Set(["INTERES_PAGADO_INV", "INTERES_PEND_INV"]);

/**
 * Construye el saldo corrido de una cuenta (prestamo o inversion). El saldo
 * solo se mueve con capital (cargoCodigos/abonoCodigos); los codigos de
 * interes quedan como columna informativa aparte, igual que el resto de la
 * app separa saldo_capital de int_pendiente (y que PTM separa "NUEVO SALDO"
 * de "INTERESES" en el Excel real).
 */
function construirLineas(
  movimientos: MovimientoConCodigo[],
  cargoCodigos: Set<string>,
  abonoCodigos: Set<string>,
  interesCodigos: Set<string>,
): LineaEstadoCuenta[] {
  const ordenados = [...movimientos].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id);
  let saldo = 0;

  return ordenados.map((m) => {
    const efectivo = m.reversa_de ? -m.monto : m.monto;
    let cargo: number | null = null;
    let abono: number | null = null;
    let interes: number | null = null;

    if (cargoCodigos.has(m.tipo_codigo)) {
      saldo += efectivo;
      if (efectivo >= 0) cargo = efectivo;
      else abono = -efectivo;
    } else if (abonoCodigos.has(m.tipo_codigo)) {
      saldo -= efectivo;
      if (efectivo >= 0) abono = efectivo;
      else cargo = -efectivo;
    } else if (interesCodigos.has(m.tipo_codigo)) {
      interes = efectivo;
    }

    return {
      id: m.id,
      fecha: m.fecha,
      tipo_codigo: m.tipo_codigo,
      cargo,
      abono,
      interes,
      saldo,
      confirmado: m.confirmado,
      esReverso: !!m.reversa_de,
      nota: m.nota,
    };
  });
}

export async function getEstadoCuentaPersona(id: number): Promise<EstadoCuentaPersona> {
  const personaRes = await supabase.from("personas").select("*").eq("id", id).single();
  const persona = lanzarSiError(personaRes);

  const [prestamosRes, inversionesRes] = await Promise.all([
    supabase.from("prestamos").select("*").eq("persona_id", id).order("fecha_desembolso", { ascending: true }),
    supabase.from("inversiones").select("*").eq("persona_id", id).order("fecha_aporte", { ascending: true }),
  ]);
  const prestamosPersona = lanzarSiError(prestamosRes) ?? [];
  const inversionesPersona = lanzarSiError(inversionesRes) ?? [];

  const idsPrestamos = prestamosPersona.map((p) => p.id);
  const idsInversiones = inversionesPersona.map((i) => i.id);

  const [saldosPrestamoRes, saldosInversionRes, movimientosPrestamoRes, movimientosInversionRes, codigos] =
    await Promise.all([
      idsPrestamos.length
        ? supabase.from("v_saldos_prestamo").select("*").in("prestamo_id", idsPrestamos)
        : Promise.resolve({ data: [], error: null }),
      idsInversiones.length
        ? supabase.from("v_saldos_inversion").select("*").in("inversion_id", idsInversiones)
        : Promise.resolve({ data: [], error: null }),
      idsPrestamos.length
        ? supabase.from("movimientos").select("*").in("prestamo_id", idsPrestamos)
        : Promise.resolve({ data: [], error: null }),
      idsInversiones.length
        ? supabase.from("movimientos").select("*").in("inversion_id", idsInversiones)
        : Promise.resolve({ data: [], error: null }),
      mapaCodigosTipoMovimiento(),
    ]);

  const saldoPrestamoPorId = new Map((lanzarSiError(saldosPrestamoRes) ?? []).map((s) => [s.prestamo_id, s]));
  const saldoInversionPorId = new Map((lanzarSiError(saldosInversionRes) ?? []).map((s) => [s.inversion_id, s]));

  const movimientosPrestamo: MovimientoConCodigo[] = (lanzarSiError(movimientosPrestamoRes) ?? []).map((m) => ({
    ...m,
    tipo_codigo: codigos.get(m.tipo_movimiento_id) ?? "",
  }));
  const movimientosInversion: MovimientoConCodigo[] = (lanzarSiError(movimientosInversionRes) ?? []).map((m) => ({
    ...m,
    tipo_codigo: codigos.get(m.tipo_movimiento_id) ?? "",
  }));

  const prestamos: EstadoCuentaPrestamo[] = prestamosPersona.map((p) => ({
    prestamo: p,
    saldo:
      saldoPrestamoPorId.get(p.id) ?? {
        prestamo_id: p.id,
        prestamo_codigo: p.codigo,
        persona_id: p.persona_id,
        estado: p.estado,
        saldo_capital: 0,
        capital_recuperado: 0,
        int_cobrado: 0,
        int_pendiente: 0,
      },
    lineas: construirLineas(
      movimientosPrestamo.filter((m) => m.prestamo_id === p.id),
      CARGO_PRESTAMO,
      ABONO_PRESTAMO,
      INTERES_PRESTAMO,
    ),
  }));

  const inversiones: EstadoCuentaInversion[] = inversionesPersona.map((i) => ({
    inversion: i,
    saldo:
      saldoInversionPorId.get(i.id) ?? {
        inversion_id: i.id,
        inversion_codigo: i.codigo,
        persona_id: i.persona_id,
        estado: i.estado,
        saldo_actual: 0,
        int_pagado: 0,
        int_pendiente: 0,
      },
    lineas: construirLineas(
      movimientosInversion.filter((m) => m.inversion_id === i.id),
      CARGO_INVERSION,
      ABONO_INVERSION,
      INTERES_INVERSION,
    ),
  }));

  return { persona, prestamos, inversiones };
}

// ---------------------------------------------------------------------------
// Prestamos
// ---------------------------------------------------------------------------

export interface PrestamoConSaldo extends PrestamoRow {
  persona_nombre: string;
  saldo: VSaldosPrestamoRow;
  tasa_vigente: number | null;
}

async function mapaTasasVigentes(): Promise<Map<number, number>> {
  const res = await supabase
    .from("tasas_prestamo")
    .select("prestamo_id, tasa_mensual")
    .is("vigente_hasta", null);
  const filas = lanzarSiError(res) ?? [];
  return new Map(filas.map((f) => [f.prestamo_id, f.tasa_mensual]));
}

async function mapaTasasVigentesInversion(): Promise<Map<number, number>> {
  const res = await supabase
    .from("tramos_inversion")
    .select("inversion_id, tasa_mensual")
    .is("vigente_hasta", null);
  const filas = lanzarSiError(res) ?? [];
  return new Map(filas.map((f) => [f.inversion_id, f.tasa_mensual]));
}

export async function getPrestamos(filtroEstado?: string): Promise<PrestamoConSaldo[]> {
  let query = supabase.from("prestamos").select("*").order("id", { ascending: false });
  if (filtroEstado) query = query.eq("estado", filtroEstado);

  const [prestamosRes, saldosRes, nombres, tasas] = await Promise.all([
    query,
    supabase.from("v_saldos_prestamo").select("*"),
    mapaNombresPersonas(),
    mapaTasasVigentes(),
  ]);

  const prestamos = lanzarSiError(prestamosRes) ?? [];
  const saldos = lanzarSiError(saldosRes) ?? [];
  const saldoPorId = new Map(saldos.map((s) => [s.prestamo_id, s]));

  return prestamos.map((p) => ({
    ...p,
    persona_nombre: nombres.get(p.persona_id) ?? "",
    saldo:
      saldoPorId.get(p.id) ?? {
        prestamo_id: p.id,
        prestamo_codigo: p.codigo,
        persona_id: p.persona_id,
        estado: p.estado,
        saldo_capital: 0,
        capital_recuperado: 0,
        int_cobrado: 0,
        int_pendiente: 0,
      },
    tasa_vigente: tasas.get(p.id) ?? null,
  }));
}

export interface MovimientoConCodigo extends MovimientoRow {
  tipo_codigo: string;
}

async function conCodigos(movimientos: MovimientoRow[]): Promise<MovimientoConCodigo[]> {
  const codigos = await mapaCodigosTipoMovimiento();
  return movimientos.map((m) => ({ ...m, tipo_codigo: codigos.get(m.tipo_movimiento_id) ?? "" }));
}

export interface PrestamoDetalle {
  prestamo: PrestamoRow;
  persona: PersonaRow;
  saldo: VSaldosPrestamoRow;
  tasas: TasaPrestamoRow[];
  movimientos: MovimientoConCodigo[];
  mora: VMoraRow | null;
}

export async function getPrestamoDetalle(id: number): Promise<PrestamoDetalle> {
  const prestamoRes = await supabase.from("prestamos").select("*").eq("id", id).single();
  const prestamo = lanzarSiError(prestamoRes);

  const [personaRes, saldoRes, tasasRes, movimientosRes, moraRes] = await Promise.all([
    supabase.from("personas").select("*").eq("id", prestamo.persona_id).single(),
    supabase.from("v_saldos_prestamo").select("*").eq("prestamo_id", id).single(),
    supabase
      .from("tasas_prestamo")
      .select("*")
      .eq("prestamo_id", id)
      .order("vigente_desde", { ascending: false }),
    supabase
      .from("movimientos")
      .select("*")
      .eq("prestamo_id", id)
      .order("fecha", { ascending: false })
      .order("id", { ascending: false }),
    supabase.from("v_mora").select("*").eq("prestamo_id", id).maybeSingle(),
  ]);

  return {
    prestamo,
    persona: lanzarSiError(personaRes),
    saldo: lanzarSiError(saldoRes),
    tasas: lanzarSiError(tasasRes) ?? [],
    movimientos: await conCodigos(lanzarSiError(movimientosRes) ?? []),
    mora: lanzarSiError(moraRes),
  };
}

export async function buscarPrestamoActivoDePersona(personaId: number): Promise<PrestamoRow | null> {
  const res = await supabase
    .from("prestamos")
    .select("*")
    .eq("persona_id", personaId)
    .eq("estado", "ACTIVO")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return lanzarSiError(res);
}

// ---------------------------------------------------------------------------
// Inversiones
// ---------------------------------------------------------------------------

export interface InversionConSaldo extends InversionRow {
  persona_nombre: string;
  saldo: VSaldosInversionRow;
  tasa_vigente: number | null;
}

export async function getInversiones(): Promise<InversionConSaldo[]> {
  const [inversionesRes, saldosRes, nombres, tasas] = await Promise.all([
    supabase.from("inversiones").select("*").order("id", { ascending: false }),
    supabase.from("v_saldos_inversion").select("*"),
    mapaNombresPersonas(),
    mapaTasasVigentesInversion(),
  ]);

  const inversiones = lanzarSiError(inversionesRes) ?? [];
  const saldos = lanzarSiError(saldosRes) ?? [];
  const saldoPorId = new Map(saldos.map((s) => [s.inversion_id, s]));

  return inversiones.map((i) => ({
    ...i,
    persona_nombre: nombres.get(i.persona_id) ?? "",
    saldo:
      saldoPorId.get(i.id) ?? {
        inversion_id: i.id,
        inversion_codigo: i.codigo,
        persona_id: i.persona_id,
        estado: i.estado,
        saldo_actual: 0,
        int_pagado: 0,
        int_pendiente: 0,
      },
    tasa_vigente: tasas.get(i.id) ?? null,
  }));
}

export interface InversionDetalle {
  inversion: InversionRow;
  persona: PersonaRow;
  saldo: VSaldosInversionRow;
  tramos: TramoInversionRow[];
  movimientos: MovimientoConCodigo[];
}

export async function getInversionDetalle(id: number): Promise<InversionDetalle> {
  const inversionRes = await supabase.from("inversiones").select("*").eq("id", id).single();
  const inversion = lanzarSiError(inversionRes);

  const [personaRes, saldoRes, tramosRes, movimientosRes] = await Promise.all([
    supabase.from("personas").select("*").eq("id", inversion.persona_id).single(),
    supabase.from("v_saldos_inversion").select("*").eq("inversion_id", id).single(),
    supabase
      .from("tramos_inversion")
      .select("*")
      .eq("inversion_id", id)
      .order("vigente_desde", { ascending: false }),
    supabase
      .from("movimientos")
      .select("*")
      .eq("inversion_id", id)
      .order("fecha", { ascending: false })
      .order("id", { ascending: false }),
  ]);

  return {
    inversion,
    persona: lanzarSiError(personaRes),
    saldo: lanzarSiError(saldoRes),
    tramos: lanzarSiError(tramosRes) ?? [],
    movimientos: await conCodigos(lanzarSiError(movimientosRes) ?? []),
  };
}

export async function buscarInversionVigenteDePersona(personaId: number): Promise<InversionRow | null> {
  const res = await supabase
    .from("inversiones")
    .select("*")
    .eq("persona_id", personaId)
    .eq("estado", "VIGENTE")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return lanzarSiError(res);
}

// ---------------------------------------------------------------------------
// Cobro de la quincena
// ---------------------------------------------------------------------------

export interface PrestamoParaCobro {
  prestamo_id: number;
  persona_nombre: string;
  saldo_capital: number;
  tasa_mensual: number;
  interes_que_toca: number;
}

export async function getPrestamosParaCobro(): Promise<PrestamoParaCobro[]> {
  const prestamos = await getPrestamos("ACTIVO");
  return prestamos
    .filter((p) => p.tasa_vigente !== null)
    .map((p) => {
      const tasa = p.tasa_vigente ?? 0;
      const interes = Math.round(p.saldo.saldo_capital * tasa * 100) / 100;
      return {
        prestamo_id: p.id,
        persona_nombre: p.persona_nombre,
        saldo_capital: p.saldo.saldo_capital,
        tasa_mensual: tasa,
        interes_que_toca: interes,
      };
    });
}

// ---------------------------------------------------------------------------
// Pago de interes a inversionistas (equivalente a "Cobro de la quincena" pero
// del otro lado: lo que la cooperativa le debe pagar a cada inversionista).
// ---------------------------------------------------------------------------

export interface InversionParaPago {
  inversion_id: number;
  persona_nombre: string;
  saldo_actual: number;
  tramos_vigentes: { monto: number; tasa_mensual: number }[];
  interes_que_toca: number;
}

/**
 * Todos los tramos vigentes (vigente_hasta is null) agrupados por inversion.
 * Una inversion puede tener MAS DE UN tramo vigente a la vez (ej. un
 * inversionista que aporto en 2 momentos distintos con tasas distintas);
 * sumarlos todos evita el bug de solo leer un tramo y perder el resto.
 */
async function tramosVigentesPorInversion(): Promise<Map<number, TramoInversionRow[]>> {
  const res = await supabase.from("tramos_inversion").select("*").is("vigente_hasta", null);
  const filas = lanzarSiError(res) ?? [];
  const mapa = new Map<number, TramoInversionRow[]>();
  for (const f of filas) {
    const lista = mapa.get(f.inversion_id) ?? [];
    lista.push(f);
    mapa.set(f.inversion_id, lista);
  }
  return mapa;
}

export async function getInversionesParaPago(): Promise<InversionParaPago[]> {
  const [inversionesRes, saldosRes, nombres, tramosPorInversion] = await Promise.all([
    supabase.from("inversiones").select("*").eq("estado", "VIGENTE"),
    supabase.from("v_saldos_inversion").select("*"),
    mapaNombresPersonas(),
    tramosVigentesPorInversion(),
  ]);
  const inversiones = lanzarSiError(inversionesRes) ?? [];
  const saldoPorId = new Map((lanzarSiError(saldosRes) ?? []).map((s) => [s.inversion_id, s]));

  return inversiones
    .map((i) => {
      const tramos = tramosPorInversion.get(i.id) ?? [];
      const interes = Math.round(tramos.reduce((acc, t) => acc + t.monto * t.tasa_mensual, 0) * 100) / 100;
      return {
        inversion_id: i.id,
        persona_nombre: nombres.get(i.persona_id) ?? "",
        saldo_actual: saldoPorId.get(i.id)?.saldo_actual ?? 0,
        tramos_vigentes: tramos.map((t) => ({ monto: t.monto, tasa_mensual: t.tasa_mensual })),
        interes_que_toca: interes,
      };
    })
    .filter((i) => i.tramos_vigentes.length > 0);
}

// ---------------------------------------------------------------------------
// Categorias (para el paso 2 del wizard cuando la accion es "categoria")
// ---------------------------------------------------------------------------

export async function getCategorias(nombres?: string[]) {
  let query = supabase.from("categorias").select("*").eq("activo", true);
  if (nombres?.length) query = query.in("nombre", nombres);
  const res = await query;
  return lanzarSiError(res) ?? [];
}
