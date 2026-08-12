"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { actualizarPersona } from "@/lib/actions";
import type { PersonaRow } from "@/lib/database.types";

export function FormPersona({ persona }: { persona: PersonaRow }) {
  const router = useRouter();
  const { mostrar } = useToast();
  const [nombre, setNombre] = useState(persona.nombre);
  const [telefono, setTelefono] = useState(persona.telefono ?? "");
  const [identidad, setIdentidad] = useState(persona.identidad ?? "");
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    try {
      await actualizarPersona(persona.id, { nombre, telefono, identidad });
      mostrar("Guardado.");
      router.push("/");
      router.refresh();
    } catch (e) {
      mostrar(e instanceof Error ? e.message : "No se pudo guardar.", "error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-texto-suave">Nombre</span>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-texto-suave">Teléfono</span>
        <input
          type="text"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-texto-suave">Identidad</span>
        <input
          type="text"
          value={identidad}
          onChange={(e) => setIdentidad(e.target.value)}
          className="w-full rounded-2xl border border-borde bg-superficie px-4 py-3 text-base text-texto outline-none focus:border-primario"
        />
      </label>
      <Button ancho="completo" onClick={guardar} disabled={guardando || !nombre.trim()}>
        {guardando ? "Guardando..." : "Guardar"}
      </Button>
    </Card>
  );
}
