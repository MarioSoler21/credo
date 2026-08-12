import Link from "next/link";
import { getInversiones } from "@/lib/queries";
import { ListaInversiones } from "@/components/inversionistas/ListaInversiones";

export const dynamic = "force-dynamic";

export default async function InversionistasPage() {
  const inversiones = await getInversiones();

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-texto">Inversionistas</h1>
        <Link href="/pago-inversionistas" className="text-sm font-medium text-primario">
          Pagar interés →
        </Link>
      </div>
      <ListaInversiones inversiones={inversiones} />
    </div>
  );
}
