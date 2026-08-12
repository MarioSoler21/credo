import clsx from "clsx";

type Tono = "verde" | "rojo" | "ambar" | "gris";

const ESTILOS: Record<Tono, string> = {
  verde: "bg-entra-suave text-entra",
  rojo: "bg-sale-suave text-sale",
  ambar: "bg-alerta-suave text-alerta",
  gris: "bg-fondo text-texto-suave",
};

export function Badge({ tono = "gris", children }: { tono?: Tono; children: React.ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", ESTILOS[tono])}>
      {children}
    </span>
  );
}
