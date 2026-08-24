import Link from "next/link";
import { getGastosDetalle } from "@/lib/queries";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { EmptyState } from "@/components/ui/EmptyState";
import { Timeline } from "@/components/movimientos/Timeline";
import { accionPorCodigo } from "@/lib/acciones";
import type { MovimientoCategoria } from "@/lib/queries";

export const dynamic = "force-dynamic";

function agruparPorCategoria(movimientos: MovimientoCategoria[]): Map<string, MovimientoCategoria[]> {
  const grupos = new Map<string, MovimientoCategoria[]>();
  for (const m of movimientos) {
    const lista = grupos.get(m.categoria_nombre) ?? [];
    lista.push(m);
    grupos.set(m.categoria_nombre, lista);
  }
  return grupos;
}

function efectoCaja(m: MovimientoCategoria): number {
  const signo = accionPorCodigo(m.tipo_codigo)?.signoCaja ?? 0;
  return m.monto * signo * (m.reversa_de ? -1 : 1);
}

export default async function GastosPage() {
  const movimientos = await getGastosDetalle();
  const grupos = agruparPorCategoria(movimientos);

  const totalGastos = movimientos.filter((m) => m.confirmado).reduce((acc, m) => acc + Math.min(0, efectoCaja(m)), 0);
  const totalIngresos = movimientos.filter((m) => m.confirmado).reduce((acc, m) => acc + Math.max(0, efectoCaja(m)), 0);

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      <Link href="/" className="text-sm font-medium text-primario">
        ← Resumen
      </Link>
      <h1 className="text-lg font-bold text-texto">Detalle de gastos</h1>

      {movimientos.length === 0 ? (
        <EmptyState
          icono="🧾"
          titulo="Sin gastos registrados"
          descripcion="Los gastos y otros movimientos por categoría aparecerán aquí."
        />
      ) : (
        <>
          <Card className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span className="text-texto-suave">
              Total gastos: <Money valor={totalGastos} className="font-semibold" />
            </span>
            <span className="text-texto-suave">
              Total ingresos generales: <Money valor={totalIngresos} className="font-semibold" />
            </span>
          </Card>

          {[...grupos.entries()].map(([categoria, filas]) => {
            const subtotal = filas.filter((m) => m.confirmado).reduce((acc, m) => acc + efectoCaja(m), 0);
            return (
              <Card key={categoria} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-texto">{categoria}</p>
                  <Money valor={subtotal} className="font-semibold" />
                </div>
                <Timeline movimientos={filas} />
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
