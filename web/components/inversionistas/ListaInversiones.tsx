"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Money } from "@/components/ui/Money";
import { EmptyState } from "@/components/ui/EmptyState";
import type { InversionConSaldo } from "@/lib/queries";

const TONO_ESTADO: Record<string, "verde" | "ambar" | "gris"> = {
  VIGENTE: "verde",
  SIN_FONDEAR: "ambar",
  LIQUIDADA: "gris",
};

export function ListaInversiones({ inversiones }: { inversiones: InversionConSaldo[] }) {
  const [texto, setTexto] = useState("");

  const filtradas = useMemo(
    () =>
      inversiones
        .filter((i) => i.persona_nombre.toLowerCase().includes(texto.toLowerCase()))
        .sort((a, b) => b.saldo.saldo_actual - a.saldo.saldo_actual),
    [inversiones, texto],
  );

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
      />

      {filtradas.length === 0 ? (
        <EmptyState
          titulo="Sin inversionistas"
          descripcion="Los inversionistas registrados aparecerán en este listado."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtradas.map((i) => (
            <li key={i.id}>
              <Link href={`/inversionistas/${i.id}`}>
                <Card className="flex items-center justify-between gap-3 active:bg-fondo">
                  <div>
                    <p className="text-base font-bold text-texto">{i.persona_nombre}</p>
                    <p className="text-sm text-texto-suave">
                      {i.tasa_vigente !== null ? `${(i.tasa_vigente * 100).toFixed(1)}% mensual` : "Sin tasa"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Money valor={i.saldo.saldo_actual} coloreado={false} className="font-bold" />
                    <Badge tono={TONO_ESTADO[i.estado] ?? "gris"}>{i.estado}</Badge>
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
