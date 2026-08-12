"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { moneda, fechaLegible } from "@/lib/formato";
import { etiquetaCodigoCaja } from "@/lib/acciones";
import type {
  EstadoCuentaPersona,
  EstadoCuentaPrestamo,
  EstadoCuentaInversion,
  LineaEstadoCuenta,
} from "@/lib/queries";

const TONO_ESTADO_PRESTAMO: Record<string, "verde" | "ambar" | "rojo" | "gris"> = {
  ACTIVO: "verde",
  CONGELADO: "ambar",
  INCOBRABLE: "rojo",
  PAGADO: "gris",
};

const TONO_ESTADO_INVERSION: Record<string, "verde" | "ambar" | "gris"> = {
  VIGENTE: "verde",
  SIN_FONDEAR: "ambar",
  LIQUIDADA: "gris",
};

export function EstadoCuenta({ data }: { data: EstadoCuentaPersona }) {
  const { persona, prestamos, inversiones } = data;
  const hayCuentas = prestamos.length > 0 || inversiones.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-lg font-bold text-texto">Estado de cuenta</h1>
          <p className="text-sm text-texto-suave">{persona.codigo}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-xl border border-borde bg-superficie px-3 py-2 text-xs font-semibold text-texto"
          >
            Imprimir
          </button>
          <button
            onClick={() => descargarCSV(data)}
            className="rounded-xl border border-borde bg-superficie px-3 py-2 text-xs font-semibold text-texto"
          >
            Descargar CSV
          </button>
        </div>
      </div>

      <Card className="flex flex-col gap-1">
        <p className="text-xl font-bold text-texto">{persona.nombre}</p>
        <p className="text-sm text-texto-suave">{persona.codigo}</p>
        {persona.identidad && <p className="text-sm text-texto-suave">Identidad: {persona.identidad}</p>}
        {persona.telefono && <p className="text-sm text-texto-suave">{persona.telefono}</p>}
        {persona.email && <p className="text-sm text-texto-suave">{persona.email}</p>}
      </Card>

      {!hayCuentas && (
        <EmptyState
          icono="🧾"
          titulo="Sin cuentas todavía"
          descripcion="Esta persona no tiene préstamos ni inversiones registradas."
        />
      )}

      {prestamos.map((p) => (
        <TablaPrestamo key={p.prestamo.id} data={p} />
      ))}

      {inversiones.map((i) => (
        <TablaInversion key={i.inversion.id} data={i} />
      ))}
    </div>
  );
}

function TablaPrestamo({ data }: { data: EstadoCuentaPrestamo }) {
  const { prestamo, saldo, lineas } = data;
  return (
    <Card className="flex flex-col gap-3 break-inside-avoid">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-texto">Préstamo {prestamo.codigo}</p>
        <Badge tono={TONO_ESTADO_PRESTAMO[prestamo.estado] ?? "gris"}>{prestamo.estado}</Badge>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-texto-suave">
        <span>
          Saldo de capital: <strong className="text-texto">{moneda(saldo.saldo_capital)}</strong>
        </span>
        <span>Capital recuperado: {moneda(saldo.capital_recuperado)}</span>
        <span>Interés cobrado: {moneda(saldo.int_cobrado)}</span>
        <span>Interés pendiente: {moneda(saldo.int_pendiente)}</span>
      </div>
      <TablaLineas lineas={lineas} />
    </Card>
  );
}

function TablaInversion({ data }: { data: EstadoCuentaInversion }) {
  const { inversion, saldo, lineas } = data;
  return (
    <Card className="flex flex-col gap-3 break-inside-avoid">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-texto">Inversión {inversion.codigo}</p>
        <Badge tono={TONO_ESTADO_INVERSION[inversion.estado] ?? "gris"}>{inversion.estado}</Badge>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-texto-suave">
        <span>
          Saldo actual: <strong className="text-texto">{moneda(saldo.saldo_actual)}</strong>
        </span>
        <span>Interés pagado: {moneda(saldo.int_pagado)}</span>
        <span>Interés pendiente: {moneda(saldo.int_pendiente)}</span>
      </div>
      <TablaLineas lineas={lineas} />
    </Card>
  );
}

function TablaLineas({ lineas }: { lineas: LineaEstadoCuenta[] }) {
  if (lineas.length === 0) {
    return <p className="text-sm text-texto-suave">Todavía no hay movimientos.</p>;
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-borde text-left text-xs uppercase tracking-wide text-texto-suave">
            <th className="py-1.5 pr-2 font-medium">Fecha</th>
            <th className="py-1.5 pr-2 font-medium">Movimiento</th>
            <th className="py-1.5 pr-2 text-right font-medium">Cargo</th>
            <th className="py-1.5 pr-2 text-right font-medium">Abono</th>
            <th className="py-1.5 pr-2 text-right font-medium">Interés</th>
            <th className="py-1.5 pl-2 text-right font-medium">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {lineas.map((l) => (
            <tr key={l.id} className="border-b border-borde/60 last:border-0">
              <td className="whitespace-nowrap py-1.5 pr-2 text-texto-suave">{fechaLegible(l.fecha)}</td>
              <td className="py-1.5 pr-2 text-texto">
                {etiquetaCodigoCaja(l.tipo_codigo)}
                {l.esReverso && <span className="ml-1 text-xs italic text-texto-suave">(corrección)</span>}
                {!l.confirmado && <span className="ml-1 text-xs italic text-alerta">(sin confirmar)</span>}
              </td>
              <td className="whitespace-nowrap py-1.5 pr-2 text-right tabular-nums text-texto">
                {l.cargo != null ? moneda(l.cargo) : ""}
              </td>
              <td className="whitespace-nowrap py-1.5 pr-2 text-right tabular-nums text-texto">
                {l.abono != null ? moneda(l.abono) : ""}
              </td>
              <td className="whitespace-nowrap py-1.5 pr-2 text-right tabular-nums text-texto-suave">
                {l.interes != null ? moneda(l.interes) : ""}
              </td>
              <td className="whitespace-nowrap py-1.5 pl-2 text-right font-medium tabular-nums text-texto">
                {moneda(l.saldo)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function csvEscape(valor: string): string {
  if (valor.includes(",") || valor.includes('"') || valor.includes("\n")) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

function descargarCSV(data: EstadoCuentaPersona) {
  const filas: string[] = [
    ["Cuenta", "Fecha", "Movimiento", "Cargo", "Abono", "Interes", "Saldo", "Confirmado", "Nota"].join(","),
  ];

  const agregar = (etiquetaCuenta: string, lineas: LineaEstadoCuenta[]) => {
    for (const l of lineas) {
      filas.push(
        [
          csvEscape(etiquetaCuenta),
          l.fecha,
          csvEscape(etiquetaCodigoCaja(l.tipo_codigo)),
          l.cargo ?? "",
          l.abono ?? "",
          l.interes ?? "",
          l.saldo,
          l.confirmado ? "SI" : "NO",
          csvEscape(l.nota ?? ""),
        ].join(","),
      );
    }
  };

  data.prestamos.forEach((p) => agregar(`Prestamo ${p.prestamo.codigo}`, p.lineas));
  data.inversiones.forEach((i) => agregar(`Inversion ${i.inversion.codigo}`, i.lineas));

  const blob = new Blob([filas.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `estado_cuenta_${data.persona.codigo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
