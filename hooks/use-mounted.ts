"use client";

import { useEffect, useState } from "react";

/**
 * Hook para determinar si el componente se ha montado en el cliente.
 * Evita discrepancias de renderizado entre SSR y cliente.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
