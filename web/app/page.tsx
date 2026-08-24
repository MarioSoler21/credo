import Link from "next/link";
import {
  getFlujoCaja,
  getFlujoCajaDetalle,
  getCarteraPorEstado,
  getResultadoDetalle,
  getFlujoMensual,
  getMora,
  getResumenInversionistas,
  getPendientes,
} from "@/lib/queries";
import { etiquetaConcepto, etiquetaCodigoCaja } from "@/lib/acciones";
import { moneda, fechaLegible } from "@/lib/formato";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Money } from "@/components/ui/Money";
import { EmptyState } from "@/components/ui/EmptyState";
import { GraficoCascada } from "@/components/dashboard/GraficoCascada";
import { GraficoFlujoMensual } from "@/components/dashboard/GraficoFlujoMensual";
import { GraficoDonaCartera } from "@/components/dashboard/GraficoDonaCartera";
import { BotonConfirmar } from "@/components/dashboard/BotonConfirmar";

export const dynamic = "force-dynamic";

export default async function Libreta() {
  const [flujoCaja, flujoCajaDetalle, carteraPorEstado, resultadoDetalle, flujoMensual, mora, inversionistas, pendientes] =
    await Promise.all([
      getFlujoCaja(),
      getFlujoCajaDetalle(),
      getCarteraPorEstado(),
      getResultadoDetalle(),
      getFlujoMensual(),
      getMora(),
      getResumenInversionistas(),
      getPendientes(),
    ]);

  const carteraActiva = carteraPorEstado.find((c) => c.estado === "ACTIVO")?.saldo ?? 0;
  const carteraCongelada = carteraPorEstado.find((c) => c.estado === "CONGELADO")?.saldo ?? 0;
  const carteraIncobrable = carteraPorEstado.find((c) => c.estado === "INCOBRABLE")?.saldo ?? 0;
  const carteraTotal = carteraPorEstado.reduce((acc, c) => acc + c.saldo, 0);
  const carteraEnProblemas = carteraCongelada + carteraIncobrable;
  const porcentajeProblemas = carteraTotal > 0 ? (carteraEnProblemas / carteraTotal) * 100 : 0;

  const resultado = resultadoDetalle.find((r) => r.concepto === "RESULTADO")?.monto ?? 0;
  const lineasResultado = resultadoDetalle.filter((r) => r.concepto !== "RESULTADO");

  const hayPendientes =
    pendientes.movimientosSinConfirmar.length > 0 ||
    pendientes.personasSinNombre.length > 0 ||
    pendientes.prestamosSinDiaPago.length > 0;

  return (
    <div className="flex flex-col gap-5 px-4 pt-6">
      <h1 className="text-lg font-bold text-texto">Resumen general</h1>

      {/* Bloque A - Efectivo */}
      <Card className="flex flex-col gap-3">
        <div>
          <p className="text-sm text-texto-suave">Efectivo en caja</p>
          <p className="text-4xl font-extrabold tabular-nums text-texto">{moneda(flujoCaja.flujo_caja)}</p>
          <div className="mt-1.5 flex gap-4 text-sm">
            <span className="text-entra">Ingresos {moneda(flujoCaja.entradas)}</span>
            <span className="text-sale">Egresos {moneda(flujoCaja.salidas)}</span>
          </div>
        </div>
        <GraficoCascada detalle={flujoCajaDetalle} flujoCaja={flujoCaja.flujo_caja} />
      </Card>

      {/* Bloque B - Semaforo de salud */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm text-texto-suave">Cartera de préstamos</p>
            <p className="text-2xl font-bold tabular-nums text-texto">{moneda(carteraActiva)}</p>
          </div>
          <Badge tono="verde">Activa</Badge>
        </Card>

        <Card
          className={porcentajeProblemas >= 30 ? "border-sale/40 bg-sale-suave/40" : undefined}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-texto-suave">Cartera en riesgo</p>
            <Badge tono={porcentajeProblemas >= 30 ? "rojo" : "ambar"}>{porcentajeProblemas.toFixed(1)}%</Badge>
          </div>
          <p className="text-2xl font-bold tabular-nums text-texto">{moneda(carteraEnProblemas)}</p>
          {porcentajeProblemas >= 30 && (
            <p className="mt-1 text-sm font-medium text-sale">
              El {porcentajeProblemas.toFixed(0)}% de la cartera activa presenta riesgo de cobro.
            </p>
          )}
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm text-texto-suave">Obligaciones con inversionistas</p>
            <p className="text-2xl font-bold tabular-nums text-texto">{moneda(inversionistas.saldoTotal)}</p>
            {inversionistas.interesPendienteTotal > 0 && (
              <p className="text-sm text-texto-suave">
                + {moneda(inversionistas.interesPendienteTotal)} de interés pendiente
              </p>
            )}
          </div>
          <Badge tono="gris">Inversión</Badge>
        </Card>
      </div>

      {/* Bloque C - Resultado */}
      <Card className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-texto">Estado de resultados</p>
        <ul className="flex flex-col gap-1.5 text-sm">
          {lineasResultado.map((linea) => (
            <li key={linea.concepto} className="flex items-center justify-between">
              {linea.concepto === "GASTOS" ? (
                <Link href="/gastos" className="text-primario underline">
                  {etiquetaConcepto(linea.concepto)}
                </Link>
              ) : (
                <span className="text-texto-suave">{etiquetaConcepto(linea.concepto)}</span>
              )}
              <Money valor={linea.monto} className="font-medium" />
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-borde pt-2.5">
          <span className="font-semibold text-texto">Resultado</span>
          <Money valor={resultado} className="text-lg font-bold" />
        </div>
        <p className="text-sm text-texto-suave">
          {resultado < 0
            ? `La pérdida del período es de ${moneda(Math.abs(resultado))}: los gastos y las obligaciones con inversionistas superan los ingresos.`
            : `La utilidad del período es de ${moneda(resultado)}: los ingresos superan los gastos y las obligaciones con inversionistas.`}
        </p>
      </Card>

      {/* Bloque D - Quien te debe */}
      <Card className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-texto">Cartera en mora</p>
        {mora.length === 0 ? (
          <EmptyState
            icono="✅"
            titulo="Sin registros en mora"
            descripcion="Todos los préstamos activos se encuentran al día."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {mora.map((m) => (
              <li key={m.prestamo_id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-texto">{m.persona_nombre}</p>
                  <p className="text-sm text-texto-suave">
                    Debe {moneda(m.monto_pendiente)} · {m.dias_atraso} día{m.dias_atraso === 1 ? "" : "s"} de atraso
                  </p>
                </div>
                <Link
                  href={`/registrar?personaId=${m.persona_id}&accion=COBRE_INTERES`}
                  className="shrink-0 rounded-xl bg-primario px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Registrar pago
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Bloque E - Como va el año */}
      <Card className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-texto">Desempeño del período</p>
        <GraficoFlujoMensual datos={flujoMensual} />
        <GraficoDonaCartera datos={carteraPorEstado} />
      </Card>

      {/* Bloque F - Pendientes */}
      {hayPendientes && (
        <Card className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-texto">Pendientes</p>

          {pendientes.movimientosSinConfirmar.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">Pagos sin confirmar</p>
              <ul className="flex flex-col gap-2">
                {pendientes.movimientosSinConfirmar.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-texto">
                      {fechaLegible(m.fecha)} · {etiquetaCodigoCaja(m.tipo_codigo)} · {moneda(m.monto)}
                    </span>
                    <BotonConfirmar id={m.id} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pendientes.personasSinNombre.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
                Personas sin nombre registrado
              </p>
              <ul className="flex flex-col gap-1.5">
                {pendientes.personasSinNombre.map((p) => (
                  <li key={p.id}>
                    <Link href={`/personas/${p.id}`} className="text-sm font-medium text-primario underline">
                      {p.codigo}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pendientes.prestamosSinDiaPago.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
                Préstamos sin día de pago
              </p>
              <ul className="flex flex-col gap-1.5">
                {pendientes.prestamosSinDiaPago.map((p) => (
                  <li key={p.id}>
                    <Link href={`/prestamos/${p.id}`} className="text-sm font-medium text-primario underline">
                      {p.persona_nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
