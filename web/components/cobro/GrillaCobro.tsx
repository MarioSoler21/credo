"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Money } from "@/components/ui/Money";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { moneda, hoyISO } from "@/lib/formato";
import { registrarCobroQuincena, type FilaCobro } from "@/lib/actions";
import type { PrestamoParaCobro } from "@/lib/queries";

interface EstadoFila {
  abonoCapital: number;
  interesCobrado: number;
  noPago: boolean;
}

export function GrillaCobro({ prestamos }: { prestamos: PrestamoParaCobro[] }) {
  const router = useRouter();
  const { mostrar } = useToast();
  const [fecha, setFecha] = useState(hoyISO());
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [filas, setFilas] = useState<Record<number, EstadoFila>>(() =>
    Object.fromEntries(
      prestamos.map((p) => [
        p.prestamo_id,
        { abonoCapital: 0, interesCobrado: p.interes_que_toca, noPago: false },
      ]),
    ),
  );

  function actualizar(id: number, cambios: Partial<EstadoFila>) {
    setFilas((actual) => ({ ...actual, [id]: { ...actual[id], ...cambios } }));
  }

  const resumen = useMemo(() => {
    let clientesConMovimiento = 0;
    let total = 0;
    for (const p of prestamos) {
      const f = filas[p.prestamo_id];
      if (!f) continue;
      if (f.noPago) {
        if (p.interes_que_toca > 0) clientesConMovimiento += 1;
        continue;
      }
      const suma = f.abonoCapital + f.interesCobrado;
      if (suma > 0) {
        clientesConMovimiento += 1;
        total += suma;
      }
    }
    return { clientesConMovimiento, total };
  }, [filas, prestamos]);

  async function guardarTodo() {
    setGuardando(true);
    try {
      const paraEnviar: FilaCobro[] = prestamos.map((p) => ({
        prestamoId: p.prestamo_id,
        abonoCapital: filas[p.prestamo_id]?.abonoCapital ?? 0,
        interesCobrado: filas[p.prestamo_id]?.interesCobrado ?? 0,
        noPago: filas[p.prestamo_id]?.noPago ?? false,
        interesQueToca: p.interes_que_toca,
      }));
      await registrarCobroQuincena(fecha, paraEnviar);
      setConfirmando(false);
      mostrar(`Registro guardado. Ingreso de caja: ${moneda(resumen.total)}.`);
      router.refresh();
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "No se pudo guardar.", "error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-texto-suave">Fecha</span>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
        />
      </label>

      <div className="flex flex-col gap-3">
        {prestamos.map((p) => {
          const f = filas[p.prestamo_id];
          return (
            <Card key={p.prestamo_id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-bold text-texto">{p.persona_nombre}</p>
                  <p className="text-sm text-texto-suave">
                    Saldo <Money valor={p.saldo_capital} coloreado={false} /> · Interés del período:{" "}
                    <span className="font-medium text-texto">{moneda(p.interes_que_toca)}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MoneyInput
                  etiqueta="Abono a capital"
                  valor={f.abonoCapital}
                  disabled={f.noPago}
                  onCambio={(v) => actualizar(p.prestamo_id, { abonoCapital: v })}
                />
                <MoneyInput
                  etiqueta="Interés cobrado"
                  valor={f.interesCobrado}
                  disabled={f.noPago}
                  onCambio={(v) => actualizar(p.prestamo_id, { interesCobrado: v })}
                />
              </div>

              <Checkbox
                etiqueta="Sin pago"
                checked={f.noPago}
                onChange={(v) => actualizar(p.prestamo_id, { noPago: v })}
              />
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-20 -mx-4 border-t border-borde bg-fondo/95 px-4 py-3 backdrop-blur">
        <Button ancho="completo" onClick={() => setConfirmando(true)} disabled={resumen.clientesConMovimiento === 0}>
          Guardar todo
        </Button>
      </div>

      <Modal abierto={confirmando} onCerrar={() => setConfirmando(false)} titulo="Confirmar cobro">
        <p className="text-base text-texto">
          Se registrará{resumen.clientesConMovimiento === 1 ? "" : "n"} {resumen.clientesConMovimiento} cobro
          {resumen.clientesConMovimiento === 1 ? "" : "s"} por un total de{" "}
          <span className="font-bold">{moneda(resumen.total)}</span>. ¿Confirma la operación?
        </p>
        <div className="mt-5 flex gap-3">
          <Button variante="secundario" ancho="completo" onClick={() => setConfirmando(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button ancho="completo" onClick={guardarTodo} disabled={guardando}>
            {guardando ? "Guardando..." : "Confirmar"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
