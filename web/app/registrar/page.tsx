import { getFlujoCaja, getPersona } from "@/lib/queries";
import { Wizard } from "@/components/registrar/Wizard";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ accion?: string; personaId?: string }>;
}

export default async function RegistrarPage({ searchParams }: Props) {
  const sp = await searchParams;
  const flujoCaja = await getFlujoCaja();

  const personaIdInicial = sp.personaId ? Number(sp.personaId) : undefined;
  const personaInicial = personaIdInicial ? await getPersona(personaIdInicial).catch(() => null) : null;

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <h1 className="text-lg font-bold text-texto">Registrar movimiento</h1>
      <Wizard
        cajaActual={flujoCaja.flujo_caja}
        accionInicial={sp.accion}
        personaInicial={personaInicial ? { id: personaInicial.id, nombre: personaInicial.nombre } : undefined}
      />
    </div>
  );
}
