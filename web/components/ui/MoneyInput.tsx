"use client";

import { useId, useState } from "react";
import clsx from "clsx";
import { numero, parseMonto } from "@/lib/formato";

interface Props {
  valor: number;
  onCambio: (valor: number) => void;
  etiqueta?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function MoneyInput({
  valor,
  onCambio,
  etiqueta,
  placeholder = "0.00",
  disabled,
  autoFocus,
  className,
}: Props) {
  const id = useId();
  const [texto, setTexto] = useState(valor > 0 ? numero(valor) : "");

  function manejarCambio(nuevoTexto: string) {
    setTexto(nuevoTexto);
    onCambio(parseMonto(nuevoTexto));
  }

  function manejarSalida() {
    if (valor > 0) setTexto(numero(valor));
  }

  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      {etiqueta && <span className="text-sm font-medium text-texto-suave">{etiqueta}</span>}
      <span className="relative flex items-center">
        <span className="pointer-events-none absolute left-4 text-lg font-semibold text-texto-suave">L</span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={texto}
          onChange={(e) => manejarCambio(e.target.value)}
          onBlur={manejarSalida}
          className={clsx(
            "w-full rounded-2xl border border-borde bg-superficie py-3.5 pl-9 pr-4 text-xl font-semibold tabular-nums text-texto outline-none focus:border-primario disabled:bg-fondo disabled:text-texto-suave",
            className,
          )}
        />
      </span>
    </label>
  );
}
