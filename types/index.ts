/**
 * ============================================================================
 * GESTIÓN ECUESTRE - DEFINICIÓN DE TIPOS DE DOMINIO
 * ============================================================================
 * Modelado completo de entidades para el centro de pesebreras y administración
 * equina. Preparado para interoperar con PostgreSQL / Supabase y Mock Local.
 */

export type EntityId = string;

export interface BaseEntity {
  id: EntityId;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------------------
// 1. PESEBRERAS / BOXES
// ----------------------------------------------------------------------------
export type PesebreraStatus = "disponible" | "ocupada" | "mantenimiento" | "cuarentena";
export type PesebreraType = "estandar" | "paridera" | "paddock" | "premium";

export interface Pesebrera extends BaseEntity {
  code: string; // ej: "BOX-A01"
  name: string;
  zone: string; // ej: "Nave Principal", "Pabellón Yeguas", "Bloque Exterior"
  type: PesebreraType;
  status: PesebreraStatus;
  monthlyPrice: number;
  dimensions: string; // ej: "3.5m x 3.5m"
  horseId?: EntityId | null;
  horseName?: string | null;
  notes?: string;
}

// ----------------------------------------------------------------------------
// 2. CABALLOS / EQUINOS
// ----------------------------------------------------------------------------
export type HorseGender = "macho" | "hembra" | "castrado";
export type HorseHealthStatus = "optimo" | "en_tratamiento" | "reposo" | "observacion";

export interface Horse extends BaseEntity {
  name: string;
  breed: string; // ej: "Paso Fino Colombiano", "Cuarto de Milla", "Pura Sangre", "Frisón"
  gender: HorseGender;
  coatColor: string; // ej: "Castaño", "Alazán", "Tordillo", "Zaino"
  birthDate: string;
  ageYears: number;
  microchip?: string;
  passportNumber?: string;
  ownerId: EntityId;
  ownerName: string;
  pesebreraId?: EntityId | null;
  pesebreraCode?: string | null;
  healthStatus: HorseHealthStatus;
  dietNotes?: string;
  imageUrl?: string;
}

// ----------------------------------------------------------------------------
// 3. PROPIETARIOS / CLIENTES
// ----------------------------------------------------------------------------
export interface Client extends BaseEntity {
  fullName: string;
  identification: string;
  email: string;
  phone: string;
  address?: string;
  horsesCount: number;
  paymentStatus: "al_dia" | "pendiente" | "mora";
  outstandingBalance: number;
}

// ----------------------------------------------------------------------------
// 4. SANIDAD, MEDICAMENTOS Y VETERINARIA
// ----------------------------------------------------------------------------
export type TreatmentType = "medicamento" | "vacuna" | "desparasitacion" | "herraje" | "control";
export type TreatmentStatus = "programado" | "en_curso" | "completado";

export interface VeterinaryRecord extends BaseEntity {
  horseId: EntityId;
  horseName: string;
  type: TreatmentType;
  title: string; // ej: "Vacuna Antitetánica", "Antiinflamatorio Fenilbutazona"
  dosage?: string;
  administeredBy: string; // Nombre del veterinario o cuidador
  date: string;
  nextDueDate?: string;
  status: TreatmentStatus;
  cost?: number;
  notes?: string;
}

// ----------------------------------------------------------------------------
// 5. FINANZAS / ALQUILERES Y PAGOS
// ----------------------------------------------------------------------------
export type PaymentStatus = "pagado" | "pendiente" | "vencido";
export type PaymentCategory = "alquiler_pesebrera" | "alimentacion" | "veterinaria" | "entrenamiento";

export interface PaymentRecord extends BaseEntity {
  receiptNumber: string;
  clientId: EntityId;
  clientName: string;
  horseId?: EntityId;
  horseName?: string;
  category: PaymentCategory;
  concept: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  paymentMethod?: "transferencia" | "efectivo" | "tarjeta";
}

// ----------------------------------------------------------------------------
// METRICAS DEL DASHBOARD
// ----------------------------------------------------------------------------
export interface DashboardMetrics {
  totalBoxes: number;
  occupiedBoxes: number;
  availableBoxes: number;
  occupancyRate: number;
  totalHorses: number;
  horsesInTreatment: number;
  activeClients: number;
  monthlyRevenue: number;
  pendingPaymentsCount: number;
  pendingPaymentsTotal: number;
}
