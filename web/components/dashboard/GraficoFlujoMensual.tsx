"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { moneda } from "@/lib/formato";
import type { VFlujoMensualRow } from "@/lib/database.types";

const COLOR_INGRESOS = "#2a78d6";
const COLOR_EGRESOS = "#eb6834";

const MES_CORTO = new Intl.DateTimeFormat("es-HN", { month: "short" });

export function GraficoFlujoMensual({ datos }: { datos: VFlujoMensualRow[] }) {
  if (datos.length === 0) return null;

  const formateados = datos.map((d) => ({
    mes: MES_CORTO.format(new Date(`${d.mes}T00:00:00`)),
    Entradas: d.ingresos,
    Salidas: Math.abs(d.egresos),
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formateados} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--borde)" />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--texto-suave)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--texto-suave)" }} axisLine={false} tickLine={false} width={0} />
          <Tooltip
            formatter={(valor) => moneda(Number(valor ?? 0))}
            contentStyle={{ borderRadius: 12, border: "1px solid var(--borde)", fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Entradas" fill={COLOR_INGRESOS} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="Salidas" fill={COLOR_EGRESOS} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
