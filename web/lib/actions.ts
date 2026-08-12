"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "./supabase";
import { accionPorId } from "./acciones";
import { hoyISO } from "./formato";
import type { EstadoPrestamo, MovimientoRow } from "./database.types";

function lanzarSiError<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

async function idTipoMovimiento(codigo: string): Promise<number> {
  const res = await supabase.from("tipos_movimiento").select("id").eq("codigo", codigo).single();
  return lanzarSiError(res).id;
}

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------

export interface NuevaPersonaInput {
  nombre: string;
  telefono?: string;
  identidad?: string;
  esPrestatario?: boolean;
  esInversionista?: boolean;
}

export async function crearPersona(input: NuevaPersonaInput) {
  const codigo = `P-${Date.now()}`;
  const res = await supabase
    .from("personas")
    .insert({
      codigo,
      nombre: input.nombre.trim(),
      telefono: input.telefono?.trim() || null,
      identidad: input.identidad?.trim() || null,
      es_prestatario: input.esPrestatario ?? false,
      es_inversionista: input.esInversionista ?? false,
    })
    .select()
    .single();
  const persona = lanzarSiError(res);
  revalidatePath("/");
  return persona;
}

export async function actualizarPersona(
  id: number,
  cambios: Partial<NuevaPersonaInput & { direccion: string; email: string; cuentaBancaria: string; notas: string }>,
) {
  const res = await supabase
    .from("personas")
    .update({
      nombre: cambios.nombre?.trim(),
      telefono: cambios.telefono?.trim() || null,
      identidad: cambios.identidad?.trim() || null,
      direccion: cambios.direccion?.trim() || null,
      email: cambios.email?.trim() || null,
      cuenta_bancaria: cambios.cuentaBancaria?.trim() || null,
      notas: cambios.notas?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();
  const persona = lanzarSiError(res);
  revalidatePath(`/personas/${id}`);
  return persona;
}

// ---------------------------------------------------------------------------
// Asegurar contexto (crea prestamo/inversion la primera vez que hace falta)
// ---------------------------------------------------------------------------

const TASA_MENSUAL_SUGERIDA = 0.02;

export async function buscarOCrearPrestamoActivo(
  personaId: number,
  tasaMensualSiNuevo?: number,
): Promise<{ id: number; esNuevo: boolean }> {
  const existente = await supabase
    .from("prestamos")
    .select("id")
    .eq("persona_id", personaId)
    .eq("estado", "ACTIVO")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  const filaExistente = lanzarSiError(existente);
  if (filaExistente) return { id: filaExistente.id, esNuevo: false };

  const codigo = `PR-${Date.now()}`;
  const fecha = hoyISO();
  const nuevo = await supabase
    .from("prestamos")
    .insert({ codigo, persona_id: personaId, fecha_desembolso: fecha, estado: "ACTIVO" })
    .select()
    .single();
  const prestamo = lanzarSiError(nuevo);

  await supabase.from("tasas_prestamo").insert({
    prestamo_id: prestamo.id,
    tasa_mensual: tasaMensualSiNuevo ?? TASA_MENSUAL_SUGERIDA,
    vigente_desde: fecha,
  });

  return { id: prestamo.id, esNuevo: true };
}

export async function buscarOCrearInversionVigente(
  personaId: number,
  tasaMensualSiNueva?: number,
  montoInicial?: number,
): Promise<{ id: number; esNuevo: boolean }> {
  const existente = await supabase
    .from("inversiones")
    .select("id")
    .eq("persona_id", personaId)
    .eq("estado", "VIGENTE")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  const filaExistente = lanzarSiError(existente);
  if (filaExistente) return { id: filaExistente.id, esNuevo: false };

  const codigo = `INV-${Date.now()}`;
  const fecha = hoyISO();
  const nueva = await supabase
    .from("inversiones")
    .insert({ codigo, persona_id: personaId, fecha_aporte: fecha, estado: "VIGENTE" })
    .select()
    .single();
  const inversion = lanzarSiError(nueva);

  await supabase.from("tramos_inversion").insert({
    inversion_id: inversion.id,
    monto: montoInicial ?? 0,
    tasa_mensual: tasaMensualSiNueva ?? TASA_MENSUAL_SUGERIDA,
    vigente_desde: fecha,
  });

  return { id: inversion.id, esNuevo: true };
}

// ---------------------------------------------------------------------------
// Registrar un movimiento suelto (pantalla "Registrar algo")
// ---------------------------------------------------------------------------

export interface RegistrarMovimientoInput {
  accionId: string;
  personaId?: number;
  categoriaId?: number;
  monto: number;
  fecha: string;
  nota?: string;
  tasaMensualSiNuevo?: number;
}

export async function registrarMovimiento(input: RegistrarMovimientoInput) {
  const accion = accionPorId(input.accionId);
  if (!accion) throw new Error("Acción desconocida.");

  const tipoMovimientoId = await idTipoMovimiento(accion.codigo);

  let prestamoId: number | null = null;
  let inversionId: number | null = null;
  let categoriaId: number | null = null;

  if (accion.contexto === "prestamo") {
    if (!input.personaId) throw new Error("Falta la persona.");
    if (accion.codigo === "DESEMBOLSO") {
      const r = await buscarOCrearPrestamoActivo(input.personaId, input.tasaMensualSiNuevo);
      prestamoId = r.id;
    } else {
      const existente = await buscarPrestamoActivoParaAccion(input.personaId);
      if (!existente) throw new Error("Esta persona no tiene un préstamo activo. Usá primero «Presté plata».");
      prestamoId = existente;
    }
  } else if (accion.contexto === "inversion") {
    if (!input.personaId) throw new Error("Falta la persona.");
    if (accion.codigo === "APORTE_INVERSION") {
      const r = await buscarOCrearInversionVigente(input.personaId, input.tasaMensualSiNuevo, input.monto);
      inversionId = r.id;
    } else {
      const existente = await buscarInversionVigenteParaAccion(input.personaId);
      if (!existente) throw new Error("Esta persona no tiene una inversión vigente.");
      inversionId = existente;
    }
  } else {
    if (!input.categoriaId) throw new Error("Falta la categoría.");
    categoriaId = input.categoriaId;
  }

  const res = await supabase
    .from("movimientos")
    .insert({
      fecha: input.fecha,
      tipo_movimiento_id: tipoMovimientoId,
      prestamo_id: prestamoId,
      inversion_id: inversionId,
      categoria_id: categoriaId,
      monto: input.monto,
      confirmado: true,
      nota: input.nota?.trim() || null,
    })
    .select()
    .single();
  const movimiento = lanzarSiError(res);

  if (accion.id === "DI_POR_PERDIDO" && prestamoId) {
    await supabase.from("prestamos").update({ estado: "INCOBRABLE" }).eq("id", prestamoId);
  }

  revalidatePath("/");
  revalidatePath("/prestamos");
  revalidatePath("/inversionistas");
  return movimiento;
}

async function buscarPrestamoActivoParaAccion(personaId: number): Promise<number | null> {
  const res = await supabase
    .from("prestamos")
    .select("id")
    .eq("persona_id", personaId)
    .eq("estado", "ACTIVO")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return lanzarSiError(res)?.id ?? null;
}

async function buscarInversionVigenteParaAccion(personaId: number): Promise<number | null> {
  const res = await supabase
    .from("inversiones")
    .select("id")
    .eq("persona_id", personaId)
    .eq("estado", "VIGENTE")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  return lanzarSiError(res)?.id ?? null;
}

// ---------------------------------------------------------------------------
// Cobro de la quincena: una sola insercion multi-fila (una sola transaccion).
// ---------------------------------------------------------------------------

export interface FilaCobro {
  prestamoId: number;
  abonoCapital: number;
  interesCobrado: number;
  noPago: boolean;
  interesQueToca: number;
}

export async function registrarCobroQuincena(fecha: string, filas: FilaCobro[]) {
  const [idAbono, idInteresCobrado, idInteresPendiente] = await Promise.all([
    idTipoMovimiento("ABONO_CAPITAL"),
    idTipoMovimiento("INTERES_COBRADO"),
    idTipoMovimiento("INTERES_PENDIENTE"),
  ]);

  const nuevosMovimientos: Array<{
    fecha: string;
    tipo_movimiento_id: number;
    prestamo_id: number;
    monto: number;
    confirmado: boolean;
  }> = [];

  for (const fila of filas) {
    if (fila.noPago) {
      if (fila.interesQueToca > 0) {
        nuevosMovimientos.push({
          fecha,
          tipo_movimiento_id: idInteresPendiente,
          prestamo_id: fila.prestamoId,
          monto: fila.interesQueToca,
          confirmado: true,
        });
      }
      continue;
    }
    if (fila.abonoCapital > 0) {
      nuevosMovimientos.push({
        fecha,
        tipo_movimiento_id: idAbono,
        prestamo_id: fila.prestamoId,
        monto: fila.abonoCapital,
        confirmado: true,
      });
    }
    if (fila.interesCobrado > 0) {
      nuevosMovimientos.push({
        fecha,
        tipo_movimiento_id: idInteresCobrado,
        prestamo_id: fila.prestamoId,
        monto: fila.interesCobrado,
        confirmado: true,
      });
    }
  }

  if (nuevosMovimientos.length === 0) {
    return { insertados: 0 };
  }

  const res = await supabase.from("movimientos").insert(nuevosMovimientos).select();
  const insertados = lanzarSiError(res) ?? [];

  revalidatePath("/");
  revalidatePath("/prestamos");
  return { insertados: insertados.length };
}

// ---------------------------------------------------------------------------
// Pago de interes a inversionistas: la contraparte de registrarCobroQuincena.
// ---------------------------------------------------------------------------

export interface FilaPagoInversionista {
  inversionId: number;
  interesPagado: number;
  noPague: boolean;
  interesQueToca: number;
}

export async function registrarPagoInversionistas(fecha: string, filas: FilaPagoInversionista[]) {
  const [idInteresPagado, idInteresPendiente] = await Promise.all([
    idTipoMovimiento("INTERES_PAGADO_INV"),
    idTipoMovimiento("INTERES_PEND_INV"),
  ]);

  const nuevosMovimientos: Array<{
    fecha: string;
    tipo_movimiento_id: number;
    inversion_id: number;
    monto: number;
    confirmado: boolean;
  }> = [];

  for (const fila of filas) {
    if (fila.noPague) {
      if (fila.interesQueToca > 0) {
        nuevosMovimientos.push({
          fecha,
          tipo_movimiento_id: idInteresPendiente,
          inversion_id: fila.inversionId,
          monto: fila.interesQueToca,
          confirmado: true,
        });
      }
      continue;
    }
    if (fila.interesPagado > 0) {
      nuevosMovimientos.push({
        fecha,
        tipo_movimiento_id: idInteresPagado,
        inversion_id: fila.inversionId,
        monto: fila.interesPagado,
        confirmado: true,
      });
    }
  }

  if (nuevosMovimientos.length === 0) {
    return { insertados: 0 };
  }

  const res = await supabase.from("movimientos").insert(nuevosMovimientos).select();
  const insertados = lanzarSiError(res) ?? [];

  revalidatePath("/");
  revalidatePath("/inversionistas");
  return { insertados: insertados.length };
}

// ---------------------------------------------------------------------------
// Confirmar / Corregir
// ---------------------------------------------------------------------------

export async function confirmarMovimiento(id: number) {
  const res = await supabase.from("movimientos").update({ confirmado: true }).eq("id", id).select().single();
  const movimiento = lanzarSiError(res);
  revalidatePath("/");
  return movimiento;
}

export async function corregirMovimiento(id: number, notaCorreccion?: string): Promise<MovimientoRow> {
  const originalRes = await supabase.from("movimientos").select("*").eq("id", id).single();
  const original = lanzarSiError(originalRes);

  const res = await supabase
    .from("movimientos")
    .insert({
      fecha: hoyISO(),
      tipo_movimiento_id: original.tipo_movimiento_id,
      prestamo_id: original.prestamo_id,
      inversion_id: original.inversion_id,
      categoria_id: original.categoria_id,
      monto: original.monto,
      confirmado: true,
      nota: notaCorreccion?.trim() || "Corrección de un registro anterior.",
      reversa_de: original.id,
    })
    .select()
    .single();
  const reverso = lanzarSiError(res);

  revalidatePath("/");
  revalidatePath("/prestamos");
  revalidatePath("/inversionistas");
  return reverso;
}

// ---------------------------------------------------------------------------
// Prestamos: cambiar tasa / marcar incobrable
// ---------------------------------------------------------------------------

function diaAnterior(fechaISO: string): string {
  const fecha = new Date(`${fechaISO}T00:00:00`);
  fecha.setDate(fecha.getDate() - 1);
  return fecha.toISOString().slice(0, 10);
}

export async function cambiarTasaPrestamo(prestamoId: number, nuevaTasa: number) {
  const hoy = hoyISO();

  const vigenteRes = await supabase
    .from("tasas_prestamo")
    .select("id, vigente_desde")
    .eq("prestamo_id", prestamoId)
    .is("vigente_hasta", null)
    .maybeSingle();
  const vigente = lanzarSiError(vigenteRes);

  if (vigente && vigente.vigente_desde >= hoy) {
    // La tasa vigente ya empezaba hoy (o "en el futuro"): no hay nada que
    // cerrar, solo se actualiza esa misma fila en vez de abrir una nueva.
    const res = await supabase
      .from("tasas_prestamo")
      .update({ tasa_mensual: nuevaTasa })
      .eq("id", vigente.id)
      .select()
      .single();
    const actualizada = lanzarSiError(res);
    revalidatePath(`/prestamos/${prestamoId}`);
    return actualizada;
  }

  if (vigente) {
    // El exclude constraint "sin_traslape" usa un rango con AMBOS extremos
    // incluidos ([vigente_desde, vigente_hasta]). Cerrar la tasa vieja "hoy"
    // y abrir la nueva tambien "hoy" hace que las dos incluyan el dia de hoy
    // a la vez, lo cual el constraint rechaza. Por eso se cierra un dia antes.
    await supabase.from("tasas_prestamo").update({ vigente_hasta: diaAnterior(hoy) }).eq("id", vigente.id);
  }

  const res = await supabase
    .from("tasas_prestamo")
    .insert({ prestamo_id: prestamoId, tasa_mensual: nuevaTasa, vigente_desde: hoy })
    .select()
    .single();
  const nueva = lanzarSiError(res);

  revalidatePath(`/prestamos/${prestamoId}`);
  return nueva;
}

export async function marcarPrestamoIncobrable(prestamoId: number, monto: number, nota?: string) {
  const idPerdida = await idTipoMovimiento("PERDIDA_CARTERA");

  await supabase.from("movimientos").insert({
    fecha: hoyISO(),
    tipo_movimiento_id: idPerdida,
    prestamo_id: prestamoId,
    monto,
    confirmado: true,
    nota: nota?.trim() || "Préstamo dado por perdido.",
  });

  const res = await supabase
    .from("prestamos")
    .update({ estado: "INCOBRABLE" as EstadoPrestamo })
    .eq("id", prestamoId)
    .select()
    .single();
  const prestamo = lanzarSiError(res);

  revalidatePath("/");
  revalidatePath("/prestamos");
  revalidatePath(`/prestamos/${prestamoId}`);
  return prestamo;
}

export async function cambiarEstadoPrestamo(prestamoId: number, estado: EstadoPrestamo) {
  const res = await supabase.from("prestamos").update({ estado }).eq("id", prestamoId).select().single();
  const prestamo = lanzarSiError(res);
  revalidatePath("/prestamos");
  revalidatePath(`/prestamos/${prestamoId}`);
  return prestamo;
}

export async function actualizarDiaPago(prestamoId: number, diaPago: number) {
  const res = await supabase
    .from("prestamos")
    .update({ dia_pago: diaPago })
    .eq("id", prestamoId)
    .select()
    .single();
  const prestamo = lanzarSiError(res);
  revalidatePath("/");
  revalidatePath(`/prestamos/${prestamoId}`);
  return prestamo;
}
