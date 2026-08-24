/**
 * Calendario quincenal fijo (dia 15 y ultimo dia de cada mes) usado para
 * proyectar la caja presupuestada de un prestamo/inversion. Coincide con el
 * ciclo real de la cooperativa (ver PTM/INVERS en el Excel original).
 */

function ultimoDiaDelMes(anio: number, mesIndex0: number): number {
  return new Date(anio, mesIndex0 + 1, 0).getDate();
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Todas las fechas de corte (15 y fin de mes) entre desdeISO y hastaISO, ambas inclusive. */
export function generarCortes(desdeISO: string, hastaISO: string): string[] {
  const desde = new Date(`${desdeISO}T00:00:00`);
  const hasta = new Date(`${hastaISO}T00:00:00`);
  if (desde > hasta) return [];

  const cortes: string[] = [];
  const cursor = new Date(desde.getFullYear(), desde.getMonth(), 1);

  while (cursor <= hasta) {
    const anio = cursor.getFullYear();
    const mes = cursor.getMonth();
    const candidatos = [new Date(anio, mes, 15), new Date(anio, mes, ultimoDiaDelMes(anio, mes))];
    for (const c of candidatos) {
      if (c >= desde && c <= hasta) cortes.push(isoDate(c));
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return cortes;
}

/**
 * Ambos cortes (dia 15 y fin de mes) son cortes quincenales de interes: cada
 * uno cobra la MITAD de la tasa mensual. El fin de mes, ademas, es el unico
 * corte de capital.
 */
export function esCorteDeCapital(fechaISO: string): boolean {
  return new Date(`${fechaISO}T00:00:00`).getDate() !== 15;
}

/** Suma `meses` calendario a una fecha ISO (YYYY-MM-DD). */
export function sumarMeses(fechaISO: string, meses: number): string {
  const d = new Date(`${fechaISO}T00:00:00`);
  d.setMonth(d.getMonth() + meses);
  return isoDate(d);
}
