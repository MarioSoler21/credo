import { getPrestamosParaCobro } from "@/lib/queries";
import { GrillaCobro } from "@/components/cobro/GrillaCobro";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function CobroPage() {
  const prestamos = await getPrestamosParaCobro();

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-lg font-bold text-texto">Cobro de la quincena</h1>
      {prestamos.length === 0 ? (
        <EmptyState
          icono="🧾"
          titulo="No hay préstamos para cobrar"
          descripcion="Los préstamos activos con una tasa definida aparecerán en este listado."
        />
      ) : (
        <GrillaCobro prestamos={prestamos} />
      )}
    </div>
  );
}
