"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { moneda } from "@/lib/formato";
import type { VCarteraPorEstadoRow } from "@/lib/database.types";

const COLOR_POR_ESTADO: Record<string, string> = {
  ACTIVO: "#2a78d6",
  CONGELADO: "#eda100",
  INCOBRABLE: "#e34948",
  PAGADO: "#1baf7a",
};

const ETIQUETA_ESTADO: Record<string, string> = {
  ACTIVO: "Activo",
  CONGELADO: "Congelado",
  INCOBRABLE: "Incobrable",
  PAGADO: "Pagado",
};

export function GraficoDonaCartera({ datos }: { datos: VCarteraPorEstadoRow[] }) {
  const conSaldo = datos.filter((d) => d.saldo > 0);
  if (conSaldo.length === 0) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={conSaldo}
              dataKey="saldo"
              nameKey="estado"
              innerRadius="60%"
              outerRadius="100%"
              stroke="var(--superficie)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {conSaldo.map((d) => (
                <Cell key={d.estado} fill={COLOR_POR_ESTADO[d.estado] ?? "#898781"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(valor, _n, item) => [
                moneda(Number(valor ?? 0)),
                ETIQUETA_ESTADO[(item.payload as VCarteraPorEstadoRow).estado],
              ]}
              contentStyle={{ borderRadius: 12, border: "1px solid var(--borde)", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-1 flex-col gap-1.5 text-sm">
        {conSaldo.map((d) => (
          <li key={d.estado} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: COLOR_POR_ESTADO[d.estado] ?? "#898781" }}
            />
            <span className="text-texto-suave">{ETIQUETA_ESTADO[d.estado] ?? d.estado}</span>
            <span className="ml-auto font-semibold tabular-nums text-texto">{moneda(d.saldo)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
