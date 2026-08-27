"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { useToast } from "@/components/ui/Toast";
import {
  cambiarTasaPrestamo,
  marcarPrestamoIncobrable,
  actualizarDiaPago,
  actualizarPlazo,
  cambiarEstadoPrestamo,
} from "@/lib/actions";
import type { PersonaRow, PrestamoRow, VSaldosPrestamoRow } from "@/lib/database.types";

interface Props {
  prestamo: PrestamoRow;
  persona: PersonaRow;
  saldo: VSaldosPrestamoRow;
  tasaVigente: number | null;
}

export function AccionesPrestamo({ prestamo, persona, saldo, tasaVigente }: Props) {
  const router = useRouter();
  const { mostrar } = useToast();

  const [modal, setModal] = useState<"tasa" | "incobrable" | "diaPago" | "plazo" | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [tasaPorcentaje, setTasaPorcentaje] = useState(tasaVigente ? String(tasaVigente * 100) : "2");
  const [montoPerdida, setMontoPerdida] = useState(saldo.saldo_capital);
  const [textoConfirmacion, setTextoConfirmacion] = useState("");
  const [diaPago, setDiaPago] = useState("");
  const [plazoMeses, setPlazoMeses] = useState(prestamo.plazo_meses ? String(prestamo.plazo_meses) : "");

  async function guardarTasa() {
    setGuardando(true);
    try {
      await cambiarTasaPrestamo(prestamo.id, Number(tasaPorcentaje) / 100);
      mostrar("Tasa actualizada.");
      setModal(null);
      router.refresh();
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "No se pudo cambiar la tasa.", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarIncobrable() {
    setGuardando(true);
    try {
      await marcarPrestamoIncobrable(prestamo.id, montoPerdida);
      mostrar("Préstamo declarado incobrable.");
      setModal(null);
      router.refresh();
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "No se pudo marcar como incobrable.", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarDiaPago() {
    setGuardando(true);
    try {
      await actualizarDiaPago(prestamo.id, Number(diaPago));
      mostrar("Día de pago guardado.");
      setModal(null);
      router.refresh();
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "No se pudo guardar.", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarPlazo() {
    setGuardando(true);
    try {
      await actualizarPlazo(prestamo.id, plazoMeses.trim() ? Number(plazoMeses) : null);
      mostrar(plazoMeses.trim() ? "Plazo guardado." : "Préstamo vuelto a plazo indefinido.");
      setModal(null);
      router.refresh();
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "No se pudo guardar.", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function alternarCongelado() {
    setGuardando(true);
    try {
      const nuevoEstado = prestamo.estado === "CONGELADO" ? "ACTIVO" : "CONGELADO";
      await cambiarEstadoPrestamo(prestamo.id, nuevoEstado);
      mostrar(nuevoEstado === "CONGELADO" ? "Préstamo congelado." : "Préstamo reactivado.");
      router.refresh();
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "No se pudo cambiar el estado.", "error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/registrar?personaId=${persona.id}&accion=ME_PAGARON_CAPITAL`}
          className="rounded-2xl bg-primario px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Registrar pago
        </Link>
        <button
          onClick={() => setModal("tasa")}
          className="rounded-2xl border border-borde bg-superficie px-4 py-3 text-sm font-semibold text-texto"
        >
          Cambiar la tasa
        </button>
      </div>

      {!prestamo.dia_pago && (
        <button
          onClick={() => setModal("diaPago")}
          className="rounded-2xl border border-dashed border-borde px-4 py-3 text-sm font-semibold text-primario"
        >
          Definir día de pago
        </button>
      )}

      <button
        onClick={() => setModal("plazo")}
        className="rounded-2xl border border-dashed border-borde px-4 py-3 text-sm font-semibold text-primario"
      >
        {prestamo.plazo_meses ? `Plazo: ${prestamo.plazo_meses} mes${prestamo.plazo_meses === 1 ? "" : "es"} (cambiar)` : "Definir plazo (opcional)"}
      </button>

      {(prestamo.estado === "ACTIVO" || prestamo.estado === "CONGELADO") && (
        <button
          onClick={alternarCongelado}
          disabled={guardando}
          className="rounded-2xl border border-dashed border-borde px-4 py-3 text-sm font-semibold text-texto"
        >
          {prestamo.estado === "CONGELADO" ? "Reactivar préstamo" : "Congelar préstamo (saldo congelado)"}
        </button>
      )}

      {prestamo.estado !== "INCOBRABLE" && (
        <button onClick={() => setModal("incobrable")} className="text-sm font-medium text-sale underline">
          Marcar como incobrable
        </button>
      )}

      <Modal abierto={modal === "tasa"} onCerrar={() => setModal(null)} titulo="Cambiar la tasa">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-texto-suave">Nueva tasa mensual (%)</span>
          <input
            type="number"
            inputMode="decimal"
            value={tasaPorcentaje}
            onChange={(e) => setTasaPorcentaje(e.target.value)}
            className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
          />
        </label>
        <Button ancho="completo" className="mt-4" onClick={guardarTasa} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
      </Modal>

      <Modal abierto={modal === "diaPago"} onCerrar={() => setModal(null)} titulo="Día de pago">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-texto-suave">Día de pago mensual (1-31)</span>
          <input
            type="number"
            min={1}
            max={31}
            value={diaPago}
            onChange={(e) => setDiaPago(e.target.value)}
            className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
          />
        </label>
        <Button ancho="completo" className="mt-4" onClick={guardarDiaPago} disabled={guardando || !diaPago}>
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
      </Modal>

      <Modal abierto={modal === "plazo"} onCerrar={() => setModal(null)} titulo="Plazo del préstamo">
        <p className="text-sm text-texto-suave">
          Por defecto un préstamo no tiene plazo fijo: solo se espera el pago periódico de interés. Definí un plazo
          en meses únicamente si este caso puntual sí lo requiere.
        </p>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-sm font-medium text-texto-suave">Plazo en meses (dejar vacío para indefinido)</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={plazoMeses}
            onChange={(e) => setPlazoMeses(e.target.value)}
            className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
          />
        </label>
        <Button ancho="completo" className="mt-4" onClick={guardarPlazo} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
      </Modal>

      <Modal abierto={modal === "incobrable"} onCerrar={() => setModal(null)} titulo="Marcar como incobrable">
        <p className="text-sm text-texto">
          Se registrará como pérdida el saldo pendiente de {persona.nombre}.
        </p>
        <div className="mt-3">
          <MoneyInput etiqueta="Monto de la pérdida" valor={montoPerdida} onCambio={setMontoPerdida} />
        </div>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-sm font-medium text-texto-suave">Escriba CONFIRMAR para continuar</span>
          <input
            type="text"
            value={textoConfirmacion}
            onChange={(e) => setTextoConfirmacion(e.target.value)}
            className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
          />
        </label>
        <Button
          variante="peligro"
          ancho="completo"
          className="mt-4"
          onClick={guardarIncobrable}
          disabled={guardando || textoConfirmacion.trim().toUpperCase() !== "CONFIRMAR"}
        >
          {guardando ? "Guardando..." : "Declarar incobrable"}
        </Button>
      </Modal>
    </div>
  );
}
