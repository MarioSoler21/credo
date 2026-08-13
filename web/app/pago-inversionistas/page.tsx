import { getInversionesParaPago } from "@/lib/queries";
import { GrillaPago } from "@/components/inversionistas/GrillaPago";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function PagoInversionistasPage() {
  const inversiones = await getInversionesParaPago();

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-lg font-bold text-texto">Pago a inversionistas</h1>
      {inversiones.length === 0 ? (
        <EmptyState
          icono="🏦"
          titulo="No hay inversionistas para pagar"
          descripcion="Las inversiones vigentes con una tasa definida aparecerán en este listado."
        />
      ) : (
        <GrillaPago inversiones={inversiones} />
      )}
    </div>
  );
}
