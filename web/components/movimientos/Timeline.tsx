"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { fechaLegible, moneda } from "@/lib/formato";
import { accionPorCodigo, etiquetaCodigoCaja } from "@/lib/acciones";
import { corregirMovimiento } from "@/lib/actions";
import type { MovimientoConCodigo } from "@/lib/queries";

export function Timeline({ movimientos }: { movimientos: MovimientoConCodigo[] }) {
  const [corrigiendo, setCorrigiendo] = useState<MovimientoConCodigo | null>(null);

  const yaCorregidos = useMemo(() => {
    const ids = new Set<number>();
    for (const m of movimientos) {
      if (m.reversa_de) ids.add(m.reversa_de);
    }
    return ids;
  }, [movimientos]);

  if (movimientos.length === 0) {
    return <p className="text-sm text-texto-suave">Todavía no hay movimientos.</p>;
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {movimientos.map((m) => {
          const anulado = yaCorregidos.has(m.id);
          const esCorreccion = !!m.reversa_de;
          const accion = accionPorCodigo(m.tipo_codigo);
          const texto = accion ? accion.linea(moneda(m.monto)) : `${etiquetaCodigoCaja(m.tipo_codigo)} ${moneda(m.monto)}`;
          const puedeCorregir = !anulado && !esCorreccion;

          return (
            <li key={m.id} className="flex items-start justify-between gap-3">
              <div className={clsx(anulado && "text-texto-suave line-through")}>
                <p className={clsx("text-sm", !anulado && "text-texto")}>
                  {texto}
                  {esCorreccion && <span className="ml-1 text-xs italic text-texto-suave">(corrección)</span>}
                  {!m.confirmado && <span className="ml-1 text-xs italic text-alerta">(sin confirmar)</span>}
                </p>
                <p className="text-xs text-texto-suave">{fechaLegible(m.fecha)}</p>
              </div>
              {puedeCorregir && (
                <button
                  onClick={() => setCorrigiendo(m)}
                  className="shrink-0 text-xs font-semibold text-primario underline"
                >
                  Corregir
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <ModalCorregir movimiento={corrigiendo} onCerrar={() => setCorrigiendo(null)} />
    </>
  );
}

function ModalCorregir({ movimiento, onCerrar }: { movimiento: MovimientoConCodigo | null; onCerrar: () => void }) {
  const router = useRouter();
  const { mostrar } = useToast();
  const [guardando, setGuardando] = useState(false);

  async function confirmar() {
    if (!movimiento) return;
    setGuardando(true);
    try {
      await corregirMovimiento(movimiento.id);
      mostrar("Corregido. Quedó el rastro de lo que pasó.");
      onCerrar();
      router.refresh();
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "No se pudo corregir.", "error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal abierto={!!movimiento} onCerrar={onCerrar} titulo="Corregir">
      <p className="text-sm text-texto">
        Esto no borra el registro. Crea uno contrario que lo anula, para que quede el rastro de qué pasó.
      </p>
      <div className="mt-5 flex gap-3">
        <Button variante="secundario" ancho="completo" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Button ancho="completo" onClick={confirmar} disabled={guardando}>
          {guardando ? "..." : "Sí, corregir"}
        </Button>
      </div>
    </Modal>
  );
}
