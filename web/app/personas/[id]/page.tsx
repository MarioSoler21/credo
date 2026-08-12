import Link from "next/link";
import { notFound } from "next/navigation";
import { getPersona } from "@/lib/queries";
import { FormPersona } from "@/components/personas/FormPersona";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonaDetallePage({ params }: Props) {
  const { id } = await params;
  const persona = await getPersona(Number(id)).catch(() => null);
  if (!persona) notFound();

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <Link href="/" className="text-sm font-medium text-primario">
        ← Mi Libreta
      </Link>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-texto">Editar persona</h1>
        <Link
          href={`/personas/${id}/estado-cuenta`}
          target="_blank"
          className="text-sm font-medium text-primario"
        >
          Ver estado de cuenta →
        </Link>
      </div>
      <FormPersona persona={persona} />
    </div>
  );
}
