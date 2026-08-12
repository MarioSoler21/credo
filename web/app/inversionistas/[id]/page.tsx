import Link from "next/link";
import { notFound } from "next/navigation";
import { getInversionDetalle } from "@/lib/queries";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Money } from "@/components/ui/Money";
import { Timeline } from "@/components/movimientos/Timeline";
import { moneda, fechaLegible } from "@/lib/formato";

export const dynamic = "force-dynamic";

const TONO_ESTADO: Record<string, "verde" | "ambar" | "gris"> = {
  VIGENTE: "verde",
  SIN_FONDEAR: "ambar",
  LIQUIDADA: "gris",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InversionDetallePage({ params }: Props) {
  const { id } = await params;
  const detalle = await getInversionDetalle(Number(id)).catch(() => null);
  if (!detalle) notFound();

  const { inversion, persona, saldo, tramos, movimientos } = detalle;
  const tramoVigente = tramos.find((t) => t.vigente_hasta === null);
  const interesEsteMes = tramoVigente ? tramoVigente.monto * tramoVigente.tasa_mensual : 0;

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <Link href="/inversionistas" className="text-sm font-medium text-primario">
        ← Inversionistas
      </Link>

      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xl font-bold text-texto">{persona.nombre}</p>
          <Badge tono={TONO_ESTADO[inversion.estado] ?? "gris"}>{inversion.estado}</Badge>
        </div>
        {persona.telefono && <p className="text-sm text-texto-suave">{persona.telefono}</p>}
        <Link
          href={`/personas/${persona.id}/estado-cuenta`}
          target="_blank"
          className="text-sm font-medium text-primario"
        >
          Ver estado de cuenta →
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <Money valor={saldo.saldo_actual} coloreado={false} className="text-3xl font-extrabold" />
          <span className="text-sm text-texto-suave">de saldo</span>
        </div>
        {saldo.int_pendiente > 0 && (
          <p className="text-sm text-texto-suave">Le debés {moneda(saldo.int_pendiente)} de interés</p>
        )}
        {tramoVigente && (
          <p className="text-sm text-texto-suave">
            Le toca {moneda(interesEsteMes)} este mes ({(tramoVigente.tasa_mensual * 100).toFixed(1)}% mensual)
          </p>
        )}
        <p className="text-xs text-texto-suave">Desde el {fechaLegible(inversion.fecha_aporte)}</p>
      </Card>

      {tramos.length > 1 && (
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-texto">Tramos</p>
          <ul className="flex flex-col gap-1.5">
            {tramos.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-texto-suave">
                  Desde {fechaLegible(t.vigente_desde)}
                  {t.vigente_hasta ? ` hasta ${fechaLegible(t.vigente_hasta)}` : ""}
                </span>
                <span className="font-medium text-texto">
                  {moneda(t.monto)} · {(t.tasa_mensual * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-2">
        <Link
          href={`/registrar?personaId=${persona.id}&accion=LE_PAGUE_INTERES`}
          className="rounded-2xl bg-primario px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Le pagué el interés
        </Link>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-texto">Historial</p>
        <Timeline movimientos={movimientos} />
      </div>
    </div>
  );
}
