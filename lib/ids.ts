/**
 * Genera un identificador único con prefijo legible (ej: "horse-3f2a...").
 * `crypto.randomUUID` solo existe en contextos seguros (https o localhost),
 * por eso hay un respaldo aleatorio para cuando la app se abre por http en la red local.
 */
export function newId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}${Math.random()
          .toString(36)
          .slice(2, 10)}`;
  return `${prefix}-${random}`;
}
