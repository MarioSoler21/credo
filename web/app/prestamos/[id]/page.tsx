import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrestamoDetalle } from "@/lib/queries";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Money } from "@/components/ui/Money";
import { Timeline } from "@/components/movimientos/Timeline";
import { AccionesPrestamo } from "@/components/prestamos/AccionesPrestamo";
import { fechaLegible } from "@/lib/formato";

export const dynamic = "force-dynamic";

const TONO_ESTADO: Record<string, "verde" | "ambar" | "rojo" | "gris"> = {
  ACTIVO: "verde",
  CONGELADO: "ambar",
  INCOBRABLE: "rojo",
  PAGADO: "gris",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PrestamoDetallePage({ params }: Props) {
  const { id } = await params;
  const detalle = await getPrestamoDetalle(Number(id)).catch(() => null);
  if (!detalle) notFound();

  const { prestamo, persona, saldo, tasas, movimientos, mora } = detalle;
  const tasaVigente = tasas.find((t) => t.vigente_hasta === null);

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <Link href="/prestamos" className="text-sm font-medium text-primario">
        ← Préstamos
      </Link>

      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xl font-bold text-texto">{persona.nombre}</p>
          <Badge tono={TONO_ESTADO[prestamo.estado] ?? "gris"}>{prestamo.estado}</Badge>
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
          <Money valor={saldo.saldo_capital} coloreado={false} className="text-3xl font-extrabold" />
          <span className="text-sm text-texto-suave">de saldo</span>
        </div>
        <p className="text-sm text-texto-suave">
          Tasa {tasaVigente ? `${(tasaVigente.tasa_mensual * 100).toFixed(1)}% mensual` : "sin definir"}
          {prestamo.dia_pago ? ` · Paga el día ${prestamo.dia_pago}` : " · Sin día de pago"}
        </p>
        {mora && (
          <p className="text-sm font-medium text-sale">
            {mora.dias_atraso} día{mora.dias_atraso === 1 ? "" : "s"} de atraso
          </p>
        )}
        <p className="text-xs text-texto-suave">Desembolsado el {fechaLegible(prestamo.fecha_desembolso)}</p>
      </Card>

      <AccionesPrestamo prestamo={prestamo} persona={persona} saldo={saldo} tasaVigente={tasaVigente?.tasa_mensual ?? null} />

      <div>
        <p className="mb-2 text-sm font-semibold text-texto">Historial</p>
        <Timeline movimientos={movimientos} />
      </div>
    </div>
  );
}
