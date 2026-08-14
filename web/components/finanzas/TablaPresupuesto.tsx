import { Card } from "@/components/ui/Card";
import { moneda, fechaLegible } from "@/lib/formato";
import type { PeriodoPresupuesto } from "@/lib/queries";

interface Props {
  periodos: PeriodoPresupuesto[];
  mostrarCapital: boolean;
}

export function TablaPresupuesto({ periodos, mostrarCapital }: Props) {
  if (periodos.length === 0) {
    return <p className="text-sm text-texto-suave">Sin datos suficientes para proyectar.</p>;
  }

  const brechaInteres = periodos
    .filter((p) => !p.esFuturo)
    .reduce((acc, p) => acc + (p.interesPresupuestado - p.interesReal), 0);
  const brechaCapital = periodos
    .filter((p) => !p.esFuturo)
    .reduce((acc, p) => acc + (p.capitalPresupuestado - p.capitalReal), 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-texto-suave">
        <span>
          Brecha acumulada de interés:{" "}
          <strong className={brechaInteres > 0 ? "text-sale" : "text-texto"}>{moneda(brechaInteres)}</strong>
        </span>
        {mostrarCapital && (
          <span>
            Brecha acumulada de capital:{" "}
            <strong className={brechaCapital > 0 ? "text-sale" : "text-texto"}>{moneda(brechaCapital)}</strong>
          </span>
        )}
      </div>

      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-[11px] font-semibold uppercase tracking-wide text-texto-suave">
              <th rowSpan={2} className="px-2 py-1.5 align-bottom first:pl-0">
                Fecha
              </th>
              <th colSpan={2} className="border-b border-borde px-2 py-1 text-center">
                Interés
              </th>
              {mostrarCapital && (
                <th colSpan={2} className="border-b border-borde px-2 py-1 text-center last:pr-0">
                  Capital
                </th>
              )}
            </tr>
            <tr className="border-b-2 border-texto/20 bg-fondo text-left text-[11px] font-semibold uppercase tracking-wide text-texto-suave">
              <th className="px-2 py-1.5 text-right">Presup.</th>
              <th className="px-2 py-1.5 text-right">Real</th>
              {mostrarCapital && (
                <>
                  <th className="px-2 py-1.5 text-right">Presup.</th>
                  <th className="px-2 py-1.5 text-right last:pr-0">Real</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {periodos.map((p, i) => (
              <tr
                key={p.fecha}
                className={`border-b border-borde ${i % 2 === 1 ? "bg-fondo/60" : ""} ${p.esFuturo ? "text-texto-suave" : "text-texto"}`}
              >
                <td className="whitespace-nowrap px-2 py-1.5">{fechaLegible(p.fecha)}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
                  {p.interesPresupuestado > 0 ? moneda(p.interesPresupuestado) : "—"}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
                  {p.esFuturo ? "—" : moneda(p.interesReal)}
                </td>
                {mostrarCapital && (
                  <>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
                      {p.capitalPresupuestado > 0 ? moneda(p.capitalPresupuestado) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums last:pr-0">
                      {p.esFuturo ? "—" : moneda(p.capitalReal)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CardPresupuesto({ periodos, mostrarCapital }: Props) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-texto">Presupuesto vs. real</p>
      <p className="text-xs text-texto-suave">
        Caja presupuestada (según tasa y saldo) contra flujo de efectivo real, en cortes quincenales.
      </p>
      <TablaPresupuesto periodos={periodos} mostrarCapital={mostrarCapital} />
    </Card>
  );
}
