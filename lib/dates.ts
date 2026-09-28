/**
 * Fecha en la zona horaria local del navegador, formato YYYY-MM-DD.
 * A diferencia de `toISOString()`, no salta al día siguiente por la noche (UTC-5 en Colombia).
 */
export function localDateISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Periodo mensual (YYYY-MM) de una fecha YYYY-MM-DD o ISO. */
export function monthKey(dateISO: string): string {
  return dateISO.slice(0, 7);
}

/** Suma días a una fecha YYYY-MM-DD y devuelve otra fecha YYYY-MM-DD. */
export function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return localDateISO(new Date(y, m - 1, d + days));
}

/** Días de calendario entre dos fechas YYYY-MM-DD (positivo si `to` es posterior). */
export function daysBetweenISO(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

/** Edad cumplida en años a partir de la fecha de nacimiento, o null si la fecha no es válida. */
export function ageInYears(birthDateISO: string | undefined, todayISO: string = localDateISO()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDateISO || "");
  if (!match) return null;
  const [by, bm, bd] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const [ty, tm, td] = todayISO.split("-").map(Number);
  const age = ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
  return age >= 0 ? age : null;
}
