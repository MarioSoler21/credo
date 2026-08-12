import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variante = "primario" | "secundario" | "peligro" | "fantasma";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  ancho?: "completo" | "auto";
}

const ESTILOS_VARIANTE: Record<Variante, string> = {
  primario: "bg-primario text-white active:bg-primario/90",
  secundario: "bg-superficie text-texto border border-borde active:bg-fondo",
  peligro: "bg-sale text-white active:bg-sale/90",
  fantasma: "bg-transparent text-texto-suave active:bg-fondo",
};

export function Button({ variante = "primario", ancho = "auto", className, ...props }: Props) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none",
        ESTILOS_VARIANTE[variante],
        ancho === "completo" && "w-full",
        className,
      )}
      {...props}
    />
  );
}
