/**
 * ============================================================================
 * GESTIÓN ECUESTRE - DEFINICIÓN DE TIPOS BASE
 * ============================================================================
 * Tipos globales y estructurados preparados para el crecimiento de la plataforma.
 */

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export type EntityId = string;

export interface BaseEntity {
  id: EntityId;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: EntityId;
  email: string;
  fullName: string;
  role: "admin" | "vet" | "stable_manager" | "rider" | "owner";
  createdAt: string;
}
