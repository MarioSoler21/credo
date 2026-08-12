"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  titulo?: string;
  children: ReactNode;
}

export function Modal({ abierto, onCerrar, titulo, children }: Props) {
  useEffect(() => {
    if (!abierto) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [abierto]);

  if (!abierto || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-superficie p-5 pb-8 shadow-xl sm:max-w-md sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          {titulo && <h2 className="text-lg font-bold text-texto">{titulo}</h2>}
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-texto-suave active:bg-fondo"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
