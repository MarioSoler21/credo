import { getPrestamos } from "@/lib/queries";
import { ListaPrestamos } from "@/components/prestamos/ListaPrestamos";

export const dynamic = "force-dynamic";

export default async function PrestamosPage() {
  const prestamos = await getPrestamos();

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-lg font-bold text-texto">Préstamos</h1>
      <ListaPrestamos prestamos={prestamos} />
    </div>
  );
}
