"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Money } from "@/components/ui/Money";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PrestamoConSaldo } from "@/lib/queries";
import type { EstadoPrestamo } from "@/lib/database.types";

const ESTADOS: { id: EstadoPrestamo | "TODOS"; etiqueta: string }[] = [
  { id: "TODOS", etiqueta: "Todos" },
  { id: "ACTIVO", etiqueta: "Activos" },
  { id: "CONGELADO", etiqueta: "Congelados" },
  { id: "INCOBRABLE", etiqueta: "Incobrables" },
  { id: "PAGADO", etiqueta: "Pagados" },
];

const TONO_ESTADO: Record<EstadoPrestamo, "verde" | "ambar" | "rojo" | "gris"> = {
  ACTIVO: "verde",
  CONGELADO: "ambar",
  INCOBRABLE: "rojo",
  PAGADO: "gris",
};

export function ListaPrestamos({ prestamos }: { prestamos: PrestamoConSaldo[] }) {
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<EstadoPrestamo | "TODOS">("ACTIVO");

  const filtrados = useMemo(() => {
    return prestamos
      .filter((p) => estado === "TODOS" || p.estado === estado)
      .filter((p) => p.persona_nombre.toLowerCase().includes(texto.toLowerCase()))
      .sort((a, b) => b.saldo.saldo_capital - a.saldo.saldo_capital);
  }, [prestamos, texto, estado]);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {ESTADOS.map((e) => (
          <button
            key={e.id}
            onClick={() => setEstado(e.id)}
            className={clsx(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold",
              estado === e.id ? "bg-primario text-white" : "bg-superficie text-texto-suave border border-borde",
            )}
          >
            {e.etiqueta}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <EmptyState titulo="Sin resultados" descripcion="No hay préstamos que coincidan con lo que buscás." />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtrados.map((p) => (
            <li key={p.id}>
              <Link href={`/prestamos/${p.id}`}>
                <Card className="flex items-center justify-between gap-3 active:bg-fondo">
                  <div>
                    <p className="text-base font-bold text-texto">{p.persona_nombre}</p>
                    <p className="text-sm text-texto-suave">
                      {p.tasa_vigente !== null ? `${(p.tasa_vigente * 100).toFixed(1)}% mensual` : "Sin tasa"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Money valor={p.saldo.saldo_capital} coloreado={false} className="font-bold" />
                    <Badge tono={TONO_ESTADO[p.estado]}>{p.estado}</Badge>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
