"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { moneda } from "@/lib/formato";
import { etiquetaCodigoCaja } from "@/lib/acciones";
import type { VFlujoCajaDetalleRow } from "@/lib/database.types";

const VERDE = "#0ca30c";
const ROJO = "#d03b3b";
const NEUTRO = "#166534";

interface Fila {
  nombre: string;
  base: number;
  valor: number;
  color: string;
  total?: number;
}

function construirDatos(detalle: VFlujoCajaDetalleRow[], flujoCaja: number): Fila[] {
  const ordenado = [...detalle].sort((a, b) => Math.abs(b.monto) - Math.abs(a.monto));
  let acumulado = 0;
  const filas: Fila[] = ordenado.map((d) => {
    const base = d.monto >= 0 ? acumulado : acumulado + d.monto;
    acumulado += d.monto;
    return {
      nombre: etiquetaCodigoCaja(d.codigo),
      base,
      valor: Math.abs(d.monto),
      color: d.monto >= 0 ? VERDE : ROJO,
    };
  });
  filas.push({ nombre: "Saldo de caja", base: 0, valor: Math.abs(flujoCaja), color: NEUTRO, total: flujoCaja });
  return filas;
}

export function GraficoCascada({
  detalle,
  flujoCaja,
}: {
  detalle: VFlujoCajaDetalleRow[];
  flujoCaja: number;
}) {
  const datos = construirDatos(detalle, flujoCaja);

  if (datos.length <= 1) return null;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="nombre"
            width={132}
            tick={{ fontSize: 11, fill: "var(--texto-suave)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(_valor, _nombre, item) => {
              const fila = item.payload as Fila;
              const real = fila.total ?? (fila.color === ROJO ? -fila.valor : fila.valor);
              return [moneda(real), ""];
            }}
            labelFormatter={() => ""}
            contentStyle={{ borderRadius: 12, border: "1px solid var(--borde)", fontSize: 12 }}
          />
          <Bar dataKey="base" stackId="cascada" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="valor" stackId="cascada" radius={4} isAnimationActive={false}>
            {datos.map((fila, i) => (
              <Cell key={i} fill={fila.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
