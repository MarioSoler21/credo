"use client";

import { useId } from "react";
import clsx from "clsx";

interface Props {
  checked: boolean;
  onChange: (valor: boolean) => void;
  etiqueta: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ checked, onChange, etiqueta, disabled, className }: Props) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={clsx(
        "flex items-center gap-2.5 select-none",
        disabled ? "cursor-default text-texto-suave" : "cursor-pointer text-texto",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 rounded-md border-borde text-primario accent-[var(--primario)]"
      />
      <span className="text-sm font-medium">{etiqueta}</span>
    </label>
  );
}
