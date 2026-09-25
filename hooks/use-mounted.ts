"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Hook idóneo para React 19 para determinar si el componente se ha montado en el cliente.
 * Evita discrepancias de hidratación entre SSR y el cliente sin activar warnings de setState en efecto.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
