import Link from "next/link";
import { notFound } from "next/navigation";
import { getEstadoCuentaPersona } from "@/lib/queries";
import { EstadoCuenta } from "@/components/personas/EstadoCuenta";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EstadoCuentaPage({ params }: Props) {
  const { id } = await params;
  const data = await getEstadoCuentaPersona(Number(id)).catch(() => null);
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <Link href={`/personas/${id}`} className="text-sm font-medium text-primario print:hidden">
        ← {data.persona.nombre}
      </Link>
      <EstadoCuenta data={data} />
    </div>
  );
}
