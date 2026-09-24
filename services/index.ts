/**
 * ============================================================================
 * GESTIÓN ECUESTRE - SERVICIOS DE LA APLICACIÓN
 * ============================================================================
 * Esta carpeta centraliza la lógica de comunicación con fuentes de datos,
 * APIs y Supabase de manera modular, escalable y desacoplada de la UI.
 */

export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export const servicesConfig = {
  version: "1.0.0",
  ready: false,
};
