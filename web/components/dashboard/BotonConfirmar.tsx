"use client";

import { useState } from "react";
import { confirmarMovimiento } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";

export function BotonConfirmar({ id }: { id: number }) {
  const [cargando, setCargando] = useState(false);
  const { mostrar } = useToast();

  async function confirmar() {
    setCargando(true);
    try {
      await confirmarMovimiento(id);
      mostrar("Confirmado.");
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "No se pudo confirmar.", "error");
    } finally {
      setCargando(false);
    }
  }

  return (
    <button
      onClick={confirmar}
      disabled={cargando}
      className="shrink-0 rounded-xl bg-primario px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
    >
      {cargando ? "..." : "Confirmar"}
    </button>
  );
}
