import type { ReactNode } from "react";

interface Props {
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
  icono?: string;
}

export function EmptyState({ titulo, descripcion, accion, icono = "📭" }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-borde px-6 py-10 text-center">
      <span className="text-3xl">{icono}</span>
      <div>
        <p className="font-semibold text-texto">{titulo}</p>
        <p className="mt-1 text-sm text-texto-suave">{descripcion}</p>
      </div>
      {accion}
    </div>
  );
}
