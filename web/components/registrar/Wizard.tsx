"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { useToast } from "@/components/ui/Toast";
import { moneda, hoyISO } from "@/lib/formato";
import { ACCIONES, GRUPOS, accionPorId, previewCaja, type AccionDef } from "@/lib/acciones";
import {
  buscarPersonas,
  buscarPrestamoActivoDePersona,
  buscarInversionVigenteDePersona,
  getCategorias,
} from "@/lib/queries";
import { crearPersona, registrarMovimiento } from "@/lib/actions";
import type { PersonaRow, CategoriaRow } from "@/lib/database.types";

interface ContextoInfo {
  esNuevo: boolean;
  saldoActual?: number;
}

interface Props {
  cajaActual: number;
  accionInicial?: string;
  personaInicial?: { id: number; nombre: string };
}

export function Wizard({ cajaActual, accionInicial, personaInicial }: Props) {
  const router = useRouter();
  const { mostrar } = useToast();

  const accionInicialValida = accionInicial ? accionPorId(accionInicial) : undefined;

  const [paso, setPaso] = useState<1 | 2 | 3>(accionInicialValida && personaInicial ? 3 : 1);
  const [accionId, setAccionId] = useState<string | null>(accionInicialValida?.id ?? null);
  const [persona, setPersona] = useState<{ id: number; nombre: string } | null>(personaInicial ?? null);
  const [categoria, setCategoria] = useState<CategoriaRow | null>(null);
  const [contextoInfo, setContextoInfo] = useState<ContextoInfo | null>(null);
  const [resolviendo, setResolviendo] = useState(false);
  const [errorContexto, setErrorContexto] = useState<string | null>(null);

  const [monto, setMonto] = useState(0);
  const [fecha, setFecha] = useState(hoyISO());
  const [nota, setNota] = useState("");
  const [tasaPorcentaje, setTasaPorcentaje] = useState("2");
  const [textoConfirmacion, setTextoConfirmacion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const accion = accionId ? accionPorId(accionId) : undefined;

  // Resuelve si hace falta crear un prestamo/inversion nuevo, o si ya existe uno.
  // (para contexto "categoria" no hace falta resolver nada: contextoInfo se
  // limpia en elegirAccion/elegirPersona, no aqui, para no setState en el efecto)
  useEffect(() => {
    if (!accion || !persona || accion.contexto === "categoria") return;
    let cancelado = false;
    setResolviendo(true);
    setErrorContexto(null);

    (async () => {
      try {
        if (accion.contexto === "prestamo") {
          const existente = await buscarPrestamoActivoDePersona(persona.id);
          if (cancelado) return;
          if (accion.codigo === "DESEMBOLSO") {
            setContextoInfo({ esNuevo: !existente });
          } else if (!existente) {
            setErrorContexto(`${persona.nombre} no tiene un préstamo activo. Usá primero «Presté plata».`);
          } else {
            setContextoInfo({ esNuevo: false, saldoActual: undefined });
          }
        } else {
          const existente = await buscarInversionVigenteDePersona(persona.id);
          if (cancelado) return;
          if (accion.codigo === "APORTE_INVERSION") {
            setContextoInfo({ esNuevo: !existente });
          } else if (!existente) {
            setErrorContexto(`${persona.nombre} no tiene una inversión vigente.`);
          } else {
            setContextoInfo({ esNuevo: false });
          }
        }
      } finally {
        if (!cancelado) setResolviendo(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [accion, persona]);

  function elegirAccion(a: AccionDef) {
    setAccionId(a.id);
    setContextoInfo(null);
    setErrorContexto(null);
    setPaso(2);
  }

  function elegirPersona(p: { id: number; nombre: string }) {
    setPersona(p);
    setContextoInfo(null);
    setErrorContexto(null);
    setPaso(3);
  }

  function elegirCategoria(c: CategoriaRow) {
    setCategoria(c);
    setPaso(3);
  }

  async function guardar() {
    if (!accion) return;
    setGuardando(true);
    try {
      await registrarMovimiento({
        accionId: accion.id,
        personaId: persona?.id,
        categoriaId: categoria?.id,
        monto,
        fecha,
        nota,
        tasaMensualSiNuevo: contextoInfo?.esNuevo ? Number(tasaPorcentaje) / 100 : undefined,
      });
      mostrar("Listo. Se registró correctamente.");
      router.push("/");
      router.refresh();
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "No se pudo guardar.", "error");
    } finally {
      setGuardando(false);
    }
  }

  const cajaResultante = accion ? previewCaja(cajaActual, monto, accion) : cajaActual;
  const quienONombre = accion?.contexto === "categoria" ? categoria?.nombre : persona?.nombre;
  const listoParaGuardar =
    monto > 0 &&
    !!accion &&
    !errorContexto &&
    (accion.contexto !== "categoria" ? !!persona : !!categoria) &&
    (!accion.requiereConfirmacionEscrita || textoConfirmacion.trim().toUpperCase() === "CONFIRMAR");

  return (
    <div className="flex flex-col gap-4">
      {paso === 1 && <PasoQuePaso onElegir={elegirAccion} />}

      {paso === 2 && accion && accion.contexto !== "categoria" && (
        <PasoConQuien
          onElegir={elegirPersona}
          onVolver={() => setPaso(1)}
          onCrear={async (nombre) => {
            const nueva = await crearPersona({ nombre });
            elegirPersona({ id: nueva.id, nombre: nueva.nombre });
          }}
        />
      )}

      {paso === 2 && accion && accion.contexto === "categoria" && (
        <PasoCategoria accion={accion} onElegir={elegirCategoria} onVolver={() => setPaso(1)} />
      )}

      {paso === 3 && accion && (
        <div className="flex flex-col gap-4">
          <button onClick={() => setPaso(accion.contexto === "categoria" ? 2 : 2)} className="text-sm font-medium text-primario">
            ← Cambiar
          </button>

          <Card className="flex flex-col gap-1">
            <p className="text-sm text-texto-suave">{accion.etiqueta}</p>
            <p className="text-lg font-bold text-texto">{quienONombre ?? "..."}</p>
          </Card>

          {resolviendo && <p className="text-sm text-texto-suave">Revisando...</p>}

          {errorContexto && (
            <Card className="border-sale/40 bg-sale-suave/40">
              <p className="text-sm font-medium text-sale">{errorContexto}</p>
            </Card>
          )}

          {!resolviendo && !errorContexto && (
            <>
              <MoneyInput etiqueta="¿Cuánto?" valor={monto} onCambio={setMonto} autoFocus />

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-texto-suave">¿Cuándo?</span>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
                />
              </label>

              {contextoInfo?.esNuevo && (
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-texto-suave">
                    Tasa mensual de {accion.contexto === "prestamo" ? "este préstamo" : "esta inversión"} (%)
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={tasaPorcentaje}
                    onChange={(e) => setTasaPorcentaje(e.target.value)}
                    className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
                  />
                </label>
              )}

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-texto-suave">Nota (opcional)</span>
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  rows={2}
                  className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
                />
              </label>

              {accion.requiereConfirmacionEscrita && (
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-texto-suave">
                    Escribí CONFIRMAR para dar este préstamo por perdido
                  </span>
                  <input
                    type="text"
                    value={textoConfirmacion}
                    onChange={(e) => setTextoConfirmacion(e.target.value)}
                    className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
                  />
                </label>
              )}

              {monto > 0 && (
                <Card className={clsx(cajaResultante < 0 && "border-alerta/50 bg-alerta-suave/40")}>
                  <p className="text-sm text-texto">
                    {accion.linea(moneda(monto))} {quienONombre ? `a ${quienONombre}` : ""}. Tu caja{" "}
                    {cajaResultante >= cajaActual ? "sube" : "baja"} a{" "}
                    <span className="font-bold">{moneda(cajaResultante)}</span>.
                  </p>
                  {cajaResultante < 0 && (
                    <p className="mt-1 text-sm font-medium text-alerta">
                      Tu caja va a quedar negativa. Se puede guardar igual.
                    </p>
                  )}
                </Card>
              )}

              <Button ancho="completo" disabled={!listoParaGuardar || guardando} onClick={guardar}>
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function PasoQuePaso({ onElegir }: { onElegir: (a: AccionDef) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-base font-semibold text-texto">¿Qué pasó?</p>
      {GRUPOS.map((g) => (
        <div key={g.id} className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-suave">{g.etiqueta}</p>
          <div className="flex flex-col gap-2">
            {ACCIONES.filter((a) => a.grupo === g.id).map((a) => (
              <button
                key={a.id}
                onClick={() => onElegir(a)}
                className="rounded-2xl border border-borde bg-superficie px-4 py-4 text-left text-base font-semibold text-texto active:bg-fondo"
              >
                {a.etiqueta}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PasoConQuien({
  onElegir,
  onVolver,
  onCrear,
}: {
  onElegir: (p: { id: number; nombre: string }) => void;
  onVolver: () => void;
  onCrear: (nombre: string) => Promise<void>;
}) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<PersonaRow[]>([]);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    const id = setTimeout(async () => {
      const filas = await buscarPersonas(texto);
      setResultados(filas);
    }, 250);
    return () => clearTimeout(id);
  }, [texto]);

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onVolver} className="text-sm font-medium text-primario">
        ← Volver
      </button>
      <p className="text-base font-semibold text-texto">¿Con quién?</p>
      <input
        type="text"
        autoFocus
        placeholder="Buscar por nombre..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3.5 text-base text-texto outline-none focus:border-primario"
      />

      <div className="flex flex-col gap-2">
        {resultados.map((p) => (
          <button
            key={p.id}
            onClick={() => onElegir({ id: p.id, nombre: p.nombre })}
            className="rounded-2xl border border-borde bg-superficie px-4 py-3.5 text-left text-base font-medium text-texto active:bg-fondo"
          >
            {p.nombre}
          </button>
        ))}
      </div>

      {!mostrarNueva ? (
        <button
          onClick={() => setMostrarNueva(true)}
          className="rounded-2xl border border-dashed border-borde px-4 py-3.5 text-center text-sm font-semibold text-primario"
        >
          + Persona nueva
        </button>
      ) : (
        <Card className="flex flex-col gap-3">
          <input
            type="text"
            autoFocus
            placeholder="Nombre completo"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
          />
          <Button
            ancho="completo"
            disabled={!nombreNuevo.trim() || creando}
            onClick={async () => {
              setCreando(true);
              try {
                await onCrear(nombreNuevo.trim());
              } finally {
                setCreando(false);
              }
            }}
          >
            {creando ? "Creando..." : "Crear y continuar"}
          </Button>
        </Card>
      )}
    </div>
  );
}

function PasoCategoria({
  accion,
  onElegir,
  onVolver,
}: {
  accion: AccionDef;
  onElegir: (c: CategoriaRow) => void;
  onVolver: () => void;
}) {
  const [categorias, setCategorias] = useState<CategoriaRow[] | null>(null);

  useEffect(() => {
    getCategorias(accion.categoriasSugeridas).then((filas) => {
      setCategorias(filas);
      if (filas.length === 1) onElegir(filas[0]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accion.id]);

  const opciones = useMemo(() => categorias ?? [], [categorias]);

  if (categorias === null || opciones.length <= 1) {
    return <p className="text-sm text-texto-suave">Un momento...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onVolver} className="text-sm font-medium text-primario">
        ← Volver
      </button>
      <p className="text-base font-semibold text-texto">¿Qué categoría?</p>
      <div className="flex flex-col gap-2">
        {opciones.map((c) => (
          <button
            key={c.id}
            onClick={() => onElegir(c)}
            className="rounded-2xl border border-borde bg-superficie px-4 py-3.5 text-left text-base font-medium text-texto active:bg-fondo"
          >
            {c.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}
