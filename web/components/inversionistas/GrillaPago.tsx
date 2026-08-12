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
import { registrarPagoInversionistas, type FilaPagoInversionista } from "@/lib/actions";
import type { InversionParaPago } from "@/lib/queries";

interface EstadoFila {
  interesPagado: number;
  noPague: boolean;
}

function etiquetaTasas(tramos: InversionParaPago["tramos_vigentes"]): string {
  return tramos.map((t) => `${(t.tasa_mensual * 100).toFixed(2).replace(/\.?0+$/, "")}%`).join(" + ");
}

export function GrillaPago({ inversiones }: { inversiones: InversionParaPago[] }) {
  const router = useRouter();
  const { mostrar } = useToast();
  const [fecha, setFecha] = useState(hoyISO());
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [filas, setFilas] = useState<Record<number, EstadoFila>>(() =>
    Object.fromEntries(
      inversiones.map((i) => [i.inversion_id, { interesPagado: i.interes_que_toca, noPague: false }]),
    ),
  );

  function actualizar(id: number, cambios: Partial<EstadoFila>) {
    setFilas((actual) => ({ ...actual, [id]: { ...actual[id], ...cambios } }));
  }

  const resumen = useMemo(() => {
    let inversionistasConMovimiento = 0;
    let total = 0;
    for (const i of inversiones) {
      const f = filas[i.inversion_id];
      if (!f) continue;
      if (f.noPague) {
        if (i.interes_que_toca > 0) inversionistasConMovimiento += 1;
        continue;
      }
      if (f.interesPagado > 0) {
        inversionistasConMovimiento += 1;
        total += f.interesPagado;
      }
    }
    return { inversionistasConMovimiento, total };
  }, [filas, inversiones]);

  async function guardarTodo() {
    setGuardando(true);
    try {
      const paraEnviar: FilaPagoInversionista[] = inversiones.map((i) => ({
        inversionId: i.inversion_id,
        interesPagado: filas[i.inversion_id]?.interesPagado ?? 0,
        noPague: filas[i.inversion_id]?.noPague ?? false,
        interesQueToca: i.interes_que_toca,
      }));
      await registrarPagoInversionistas(fecha, paraEnviar);
      setConfirmando(false);
      mostrar(`Listo. Le pagaste ${moneda(resumen.total)} en total.`);
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
        {inversiones.map((i) => {
          const f = filas[i.inversion_id];
          return (
            <Card key={i.inversion_id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-bold text-texto">{i.persona_nombre}</p>
                  <p className="text-sm text-texto-suave">
                    Saldo <Money valor={i.saldo_actual} coloreado={false} /> · {etiquetaTasas(i.tramos_vigentes)}{" "}
                    mensual
                  </p>
                  <p className="text-sm text-texto-suave">
                    Le toca <span className="font-medium text-texto">{moneda(i.interes_que_toca)}</span>
                  </p>
                </div>
              </div>

              <MoneyInput
                etiqueta="Interés pagado"
                valor={f.interesPagado}
                disabled={f.noPague}
                onCambio={(v) => actualizar(i.inversion_id, { interesPagado: v })}
              />

              <Checkbox
                etiqueta="No le pagué"
                checked={f.noPague}
                onChange={(v) => actualizar(i.inversion_id, { noPague: v })}
              />
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-20 -mx-4 border-t border-borde bg-fondo/95 px-4 py-3 backdrop-blur">
        <Button
          ancho="completo"
          onClick={() => setConfirmando(true)}
          disabled={resumen.inversionistasConMovimiento === 0}
        >
          Guardar todo
        </Button>
      </div>

      <Modal abierto={confirmando} onCerrar={() => setConfirmando(false)} titulo="Confirmar pago">
        <p className="text-base text-texto">
          Vas a registrar {resumen.inversionistasConMovimiento} pago
          {resumen.inversionistasConMovimiento === 1 ? "" : "s"} por{" "}
          <span className="font-bold">{moneda(resumen.total)}</span> en total. ¿Confirmás?
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
