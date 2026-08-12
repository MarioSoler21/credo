import clsx from "clsx";
import { moneda } from "@/lib/formato";

interface Props {
  valor: number;
  className?: string;
  /** Si es true, pinta verde/rojo segun el signo. Si es false, usa el color de texto normal. */
  coloreado?: boolean;
}

export function Money({ valor, className, coloreado = true }: Props) {
  return (
    <span
      className={clsx(
        "tabular-nums",
        coloreado && (valor < 0 ? "text-sale" : valor > 0 ? "text-entra" : "text-texto"),
        className,
      )}
    >
      {moneda(valor)}
    </span>
  );
}
