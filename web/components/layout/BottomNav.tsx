"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/", etiqueta: "Libreta", icono: "📒" },
  { href: "/cobro", etiqueta: "Cobro", icono: "🧾" },
  { href: "/registrar", etiqueta: "Registrar", icono: "➕" },
  { href: "/prestamos", etiqueta: "Préstamos", icono: "🤝" },
  { href: "/inversionistas", etiqueta: "Inversionistas", icono: "🏦" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie pb-[env(safe-area-inset-bottom)] print:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {ITEMS.map((item) => {
          const activo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={clsx(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
                  activo ? "text-primario" : "text-texto-suave",
                )}
              >
                <span className="text-xl leading-none">{item.icono}</span>
                {item.etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
