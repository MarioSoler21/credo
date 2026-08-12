const numeroLempiras = new Intl.NumberFormat("es-HN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "L 1,976.12" / negativos como "(L 792.88)" -- nunca "-792.88". */
export function moneda(valor: number): string {
  const monto = numeroLempiras.format(Math.abs(valor));
  return valor < 0 ? `(L ${monto})` : `L ${monto}`;
}

/** Solo el numero con separador de miles, sin "L" -- para inputs. */
export function numero(valor: number): string {
  return numeroLempiras.format(Math.abs(valor));
}

const fechaCorta = new Intl.DateTimeFormat("es-HN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "15 ene 2026" a partir de un date (YYYY-MM-DD) o timestamp ISO. */
export function fechaLegible(valorIso: string): string {
  const fecha = new Date(`${valorIso}T00:00:00`.slice(0, 19));
  return fechaCorta.format(fecha);
}

/** YYYY-MM-DD en la fecha local de hoy, para prellenar inputs date. */
export function hoyISO(): string {
  const hoy = new Date();
  const offset = hoy.getTimezoneOffset();
  const local = new Date(hoy.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Parsea "1,234.50" o "1234.5" escrito por el usuario a numero. */
export function parseMonto(texto: string): number {
  const limpio = texto.replace(/[^0-9.]/g, "");
  const valor = Number.parseFloat(limpio);
  return Number.isFinite(valor) ? valor : 0;
}
