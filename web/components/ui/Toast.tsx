"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

interface ToastItem {
  id: number;
  mensaje: string;
  tono: "exito" | "alerta" | "error";
}

interface ToastContexto {
  mostrar: (mensaje: string, tono?: ToastItem["tono"]) => void;
}

const Contexto = createContext<ToastContexto | null>(null);

export function useToast(): ToastContexto {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

const ESTILOS: Record<ToastItem["tono"], string> = {
  exito: "bg-primario text-white",
  alerta: "bg-alerta text-white",
  error: "bg-sale text-white",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [montado, setMontado] = useState(false);
  const contador = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- necesario para portal solo-cliente
    setMontado(true);
  }, []);

  const mostrar = useCallback((mensaje: string, tono: ToastItem["tono"] = "exito") => {
    const id = ++contador.current;
    setItems((actual) => [...actual, { id, mensaje, tono }]);
    setTimeout(() => {
      setItems((actual) => actual.filter((i) => i.id !== id));
    }, 3800);
  }, []);

  return (
    <Contexto.Provider value={{ mostrar }}>
      {children}
      {montado &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6">
            {items.map((item) => (
              <div
                key={item.id}
                className={clsx(
                  "pointer-events-auto max-w-sm rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg",
                  ESTILOS[item.tono],
                )}
              >
                {item.mensaje}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </Contexto.Provider>
  );
}
