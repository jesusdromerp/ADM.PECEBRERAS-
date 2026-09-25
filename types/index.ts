/**
 * ============================================================================
 * GESTIÓN ECUESTRE - DEFINICIÓN DE TIPOS DE DOMINIO AVANZADOS
 * ============================================================================
 * Modelado completo de entidades para el centro de pesebreras y administración
 * equina. Incluye Pedigrí, Historial de Enfermedades, Control de Herraje
 * y Exportación de Recibos a WhatsApp para Propietarios.
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

export type MaintenanceType =
  | "desinfeccion"
  | "cambio_cama"
  | "reparacion_bebedero"
  | "reparacion_comedero"
  | "pintura_madera"
  | "fumigacion"
  | "mantenimiento_general"
  | "otro";

export interface PesebreraMaintenanceRecord {
  id: string;
  date: string;
  type: MaintenanceType;
  typeName: string;
  types?: MaintenanceType[];
  typeNames?: string[];
  description: string;
  responsiblePerson: string;
  cost?: number;
  completedAt?: string;
  approvedBy?: string;
  approvalNotes?: string;
  approvalDate?: string;
  status?: "pendiente_aprobacion" | "aprobado";
}

export type ReleaseReason = "salida_criadero" | "cambio_pesebrera";

export interface PesebreraReleasePayload {
  boxId: string;
  horseId: string;
  action: ReleaseReason;
  targetBoxId?: string;
  notes?: string;
  allowWithDebt?: boolean;
}

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
  assignedHorseId?: EntityId | null; // Caballo titular que vive en este box (conservado durante mantenimiento)
  assignedHorseName?: string | null;
  currentMaintenanceReason?: string | null;
  currentMaintenanceResponsible?: string | null;
  currentMaintenanceDate?: string | null;
  maintenanceHistory?: PesebreraMaintenanceRecord[];
  notes?: string;
}

// ----------------------------------------------------------------------------
// 2. PEDIGRÍ / GENEALOGÍA
// ----------------------------------------------------------------------------
export interface HorsePedigree {
  sire?: string; // Padre
  dam?: string; // Madre
  grandSirePaternal?: string; // Abuelo Paterno
  grandDamPaternal?: string; // Abuela Paterna
  grandSireMaternal?: string; // Abuelo Materno
  grandDamMaternal?: string; // Abuela Materna
  breedingFarm?: string; // Criadero de Origen
  registryNumber?: string; // Registro en Asociación / Libro de Razas
  registrationDate?: string;
}

// ----------------------------------------------------------------------------
// 3. HISTORIAL DE ENFERMEDADES EN PESEBRERA
// ----------------------------------------------------------------------------
export type DiseaseSeverity = "leve" | "moderada" | "grave";
export type DiseaseStatus = "activo" | "en_tratamiento" | "resuelto" | "cronico";

export interface DiseaseHistoryEntry {
  id: string;
  diseaseName: string; // ej: "Cólico Espasmódico", "Tendinitis Mano Derecha"
  diagnosedDate: string;
  resolutionDate?: string;
  severity: DiseaseSeverity;
  status: DiseaseStatus;
  medicationsGiven: string; // Medicamentos aplicados
  veterinarian: string;
  clinicalNotes?: string;
}

// ----------------------------------------------------------------------------
// 4. CONTROL DE HERRAJE (FARRIER TRACKING)
// ----------------------------------------------------------------------------
export interface FarrierControl {
  lastShoeingDate: string; // Fecha último herraje
  nextShoeingDate: string; // Fecha programada (ciclo 30-45 días)
  shoeingType: string; // ej: "Herradura Francesa de Trabajo", "Ortopédica con Plantilla", "Aluminio de Pista"
  farrierName: string; // Nombre del maestro herrero
  cost?: number;
  notes?: string;
}

// ----------------------------------------------------------------------------
// 4.1. CONTROL DE ALIMENTO Y RACIONES PROPIAS (CLIENTES SIN PLAN A)
// ----------------------------------------------------------------------------
export interface FeedBlendIngredient {
  id: string;
  name: string; // ej: "Italcol Pinta Campeón (40kg)", "Avena Rolada en Hojuelas", "Salvado de Trigo"
  kg: number;   // ej: 40, 20, 5
}

export interface FeedRestockLog {
  id: string;
  date: string;
  kgAdded: number;
  notes?: string;
  recordedBy?: string;
}

export interface HorseDietFeedConfig {
  feedProvidedBy: "criadero" | "propietario";
  dailyGrainKg: number; // Consumo diario en kg (ej: 3.5 kg/día)
  feedType: "simple" | "mezcla";
  feedName: string; // ej: "Concentrado Pinta Campeón" o "Mezcla Especial (Pinta Campeón + Avena)"
  bagWeightKg?: number; // Peso unitario del bulto (ej: 40 kg)
  bagsCount?: number;   // Número de bultos (ej: 1 o 2)
  blendIngredients?: FeedBlendIngredient[]; // Componentes de la mezcla
  totalKgSupplied: number; // Kilos totales iniciales o tras recarga (ej: 65 kg)
  startDate: string; // Fecha de entrega / inicio de consumo (YYYY-MM-DD)
  depletionDate: string; // Fecha estimada de agotamiento (YYYY-MM-DD)
  alertDate: string; // Fecha de alerta WhatsApp (depletionDate - 2 días)
  emergencyRationCostCOP?: number; // Costo por ración diaria de emergencia si el criadero la suple (ej: 25000 COP)
  dailyPortionsCount?: number; // Cantidad de raciones/comidas programadas al día (ej: 3, 4, 5)
  lastRestockedDate?: string;
  restockHistory?: FeedRestockLog[];
}

export interface HorseDailyPortionDetail {
  portionNumber: number; // 1, 2, 3, 4, 5
  label: string; // "Ración 1", "Ración 2", etc.
  served: boolean;
  servedAt?: string; // ej: "08:30 AM"
  servedBy?: string; // ej: "Palafrenero Andrés"
}

export interface HorseDailyActivityRecord {
  id: string;
  date: string; // YYYY-MM-DD
  horseId: string;
  horseName: string;
  ownerId: string;
  ownerName: string;
  boxCode?: string;
  portionsServedCount: number;
  totalPortionsPlanned: number;
  portionsDetails: HorseDailyPortionDetail[];
  wasRidden: boolean;
  ridingScheduled: boolean;
  ridingActivity?: string; // ej: "Sesión de torno y adiestramiento en pista (40 min)"
  riderName?: string; // ej: "Montador Carlos Valderrama"
  generalCare: {
    bathed?: boolean;
    hoovesCleaned?: boolean;
    stableCleaned?: boolean;
    grooming?: boolean;
    handWalked?: boolean;
    vitaminsGiven?: boolean;
  };
  notes?: string;
  completedAt: string;
  reportedBy: string;
  publishedToOwner: boolean;
  waSummaryUrl?: string;
}

// ----------------------------------------------------------------------------
// 4.3. REPORTE TÉCNICO DIRECTO DEL MONTADOR / ADIESTRADOR
// ----------------------------------------------------------------------------
export type HorseRidingAttitude =
  | "excelente"
  | "buena"
  | "atento"
  | "brio_alto"
  | "pesado_boca"
  | "inquieto"
  | "cansado";

export interface HorseRidingSessionReport {
  id: string;
  date: string; // YYYY-MM-DD
  horseId: string;
  horseName: string;
  ownerId: string;
  ownerName: string;
  boxCode?: string;
  riderName: string; // Montador directo responsable
  sessionType: string; // ej: "Pista y Adiestramiento", "Torno & Cuerda", "Arreglo de Cabeza & Rienda"
  durationMinutes: number; // ej: 45
  attitude: HorseRidingAttitude;
  exercisesWorked: string[]; // ej: ["Flexión de nuca", "Ritmo y cadencia", "Paradas y salidas"]
  technicalNotes: string; // Notas técnicas del montador directo para el propietario
  completedAt: string;
  publishedToOwner: boolean;
  waReportUrl?: string;
}

// ----------------------------------------------------------------------------
// 5. CABALLOS / EQUINOS (MODELO COMPLETO)
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

  // Nuevos módulos solicitados
  pedigree?: HorsePedigree;
  diseaseHistory?: DiseaseHistoryEntry[];
  farrierControl?: FarrierControl;
  feedConfig?: HorseDietFeedConfig;

  // Programación operativa de raciones y pista / monta diaria
  dailyPortionsCount?: number; // Cantidad de porciones al día (ej: 3, 4, 5 -> Ración 1, 2, 3...)
  scheduledForRidingToday?: boolean; // Si tiene programado ser montado hoy
  assignedRiderName?: string; // Nombre del montador asignado (ej: "Montador Carlos Valderrama")
  ridingActivityType?: string; // ej: "Pista y Adiestramiento", "Paseo al Trote", "Caminador"
  dailyActivityHistory?: HorseDailyActivityRecord[]; // Historial de jornadas de alimentación y cuadra
  ridingSessionHistory?: HorseRidingSessionReport[]; // Historial de informes directos del montador

  // Modalidad de Canon / Plan de Servicios Asignado
  planCode?: string;
  planName?: string;
  planPriceCOP?: number;
  planInclusions?: CanonServiceInclusion[];

  // Registro de salida o egreso
  exitDate?: string;
  exitReason?: string;
  isActive?: boolean;
}

// ----------------------------------------------------------------------------
// 6. PROPIETARIOS / CLIENTES
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
// 7. SANIDAD, MEDICAMENTOS Y VETERINARIA
// ----------------------------------------------------------------------------
export type TreatmentType = "medicamento" | "vacuna" | "desparasitacion" | "herraje" | "control";
export type TreatmentStatus = "programado" | "en_curso" | "completado";
export type TreatmentRoute =
  | "intravenosa"
  | "intramuscular"
  | "oral"
  | "topica"
  | "subcutanea"
  | "intraarticular"
  | "oftalmica"
  | "otra";

export type CaseResolutionType = "resuelto" | "medicacion_continua" | "en_observacion";

export interface VeterinaryContinuationGuide {
  medicationContinues: boolean;
  medicationName?: string;
  dosage?: string;
  route?: TreatmentRoute | string;
  frequency?: string;
  durationDays?: number;
  instructions: string;
  nextCheckDate?: string;
  targetHorseStatus?: HorseHealthStatus;
  responsibleRole?: "palafrenero" | "mayordomo" | "propietario" | "veterinario" | "todos";
}

export interface CompleteVeterinaryTreatmentOptions {
  resolutionNotes?: string;
  caseResolution?: CaseResolutionType;
  restoreHorseHealth?: boolean;
  targetHorseStatus?: HorseHealthStatus;
  markDiseaseResolved?: boolean;
  continuationGuide?: VeterinaryContinuationGuide;
}

export interface TreatmentComplication {
  id: string;
  date: string;
  time?: string;
  description: string;
  actionTaken: string;
  additionalMedication?: string;
  newSeverity?: DiseaseSeverity;
  recordedBy: string;
  additionalCost?: number;
  instructionsForStables?: string;
  notifyOwner?: boolean;
}

export interface TreatmentEditLog {
  id: string;
  date: string;
  editedBy: string;
  reason?: string;
  summary: string;
}

export interface VeterinaryRecord extends BaseEntity {
  horseId: EntityId;
  horseName: string;
  type: TreatmentType;
  title: string;
  diagnosis?: string;
  symptoms?: string;
  dosage?: string;
  route?: TreatmentRoute;
  frequency?: string;
  durationDays?: number;
  endDate?: string;
  severity?: DiseaseSeverity;
  stableCareInstructions?: string;
  administeredBy: string;
  date: string;
  nextDueDate?: string;
  status: TreatmentStatus;
  cost?: number;
  chargeToOwner?: boolean;
  notes?: string;
  clinicalEvolutionNotes?: string;

  // Seguimiento de finalización, pauta de medicación y resolución clínica
  caseResolution?: CaseResolutionType;
  medicationContinues?: boolean;
  continuationGuide?: VeterinaryContinuationGuide;
  completionDate?: string;

  // Modificaciones, complicaciones clínicas y protección contra error humano
  complications?: TreatmentComplication[];
  editHistory?: TreatmentEditLog[];
  isReopened?: boolean;
  reopenReason?: string;
}

// ----------------------------------------------------------------------------
// 8. FINANZAS / ALQUILERES Y RECIBOS PARA WHATSAPP
// ----------------------------------------------------------------------------
export type PaymentStatus = "pagado" | "pendiente" | "vencido";
export type PaymentCategory = "alquiler_pesebrera" | "alimentacion" | "veterinaria" | "herraje" | "integral";

export interface PaymentItemBreakdown {
  concept: string;
  amount: number;
}

export interface PaymentRecord extends BaseEntity {
  receiptNumber: string;
  clientId: EntityId;
  clientName: string;
  clientPhone?: string;
  horseId?: EntityId;
  horseName?: string;
  pesebreraCode?: string;
  category: PaymentCategory;
  concept: string;
  amount: number;
  items?: PaymentItemBreakdown[]; // Desglose de servicios
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  paymentMethod?: "transferencia" | "efectivo" | "tarjeta";
  bankDetails?: string; // Para enviar en el WhatsApp
}

// ----------------------------------------------------------------------------
// 9. CONTROL DE INVENTARIO DE ESTABLO
// ----------------------------------------------------------------------------
export type InventoryCategory = "alimento" | "heno" | "cama" | "medicamento" | "suplemento";

export interface InventoryItem extends BaseEntity {
  name: string; // ej: "Concentrado Pinta Campeón 40kg"
  category: InventoryCategory;
  currentStock: number;
  unit: string; // ej: "Bultos (40kg)", "Pacas", "Frascos (100ml)", "Viajes"
  minStockAlert: number; // Nivel mínimo para disparar alerta
  costPerUnit: number;
  location: string; // ej: "Bodega 1", "Heno Techado", "Botiquín Sanitario"
  lastRestocked: string;
  supplier?: string;
  notes?: string;
}

// ----------------------------------------------------------------------------
// 10. PLANTILLAS Y CATÁLOGO DE CONCENTRADOS / INSUMOS PREDETERMINADOS
// ----------------------------------------------------------------------------
export interface FeedTemplate extends BaseEntity {
  name: string; // ej: "Concentrado Pinta Campeón (40kg)"
  brand: string; // ej: "Italcol", "Contegral", "Pavo"
  category: InventoryCategory;
  defaultUnit: string; // ej: "Bultos (40kg)", "Pacas", "Frascos"
  defaultMinStockAlert: number;
  defaultCostPerUnit: number;
  defaultLocation: string; // ej: "Bodega Principal"
  defaultSupplier?: string; // ej: "Distribuidora El Trébol"
  nutritionalNotes?: string; // ej: "14% Proteína para caballos en entrenamiento"
}

// ----------------------------------------------------------------------------
// 11. PARÁMETROS INSTITUCIONALES DEL CENTRO ECUESTRE
// ----------------------------------------------------------------------------
export interface CenterSettings {
  stableName: string; // ej: "Hacienda & Pesebreras San Isidro"
  location: string; // ej: "Vereda Las Palmas, Km 8 - Antioquia, Colombia"
  nit: string; // ej: "901.482.910-3"
  veterinarianName: string; // ej: "Dr. Juan Pablo Morales (MVZ)"
  veterinarianLicense: string; // ej: "COMVEZCOL # 19.842"
  veterinarianSpecialty: string; // ej: "Medicina y Reproducción Equina"
  bankDetails: string; // ej: "Bancolombia Cuenta de Ahorros # 108-928374-12 a nombre de Hacienda & Pesebreras SAS"
  tagline?: string; // ej: "Centro Integral de Reproducción, Alojamiento y Cuidado Equino"
  contactPhone?: string; // ej: "+57 312 458 9012"
  defaultEmergencyRationCostCOP?: number; // ej: 25000 COP
}

// ----------------------------------------------------------------------------
// 12. PLANES DE SERVICIO DEL CANON (MODALIDADES DE PESEBRERA)
// ----------------------------------------------------------------------------
export interface CanonServiceInclusion {
  id: string;
  name: string; // ej: "Comida", "Herraje", "Montador", "Agua", "Cama", "Vitaminas", "Heno"
  included: boolean;
  notes?: string;
  costCOP?: number; // Costo individual mensual editable en COP
}

export interface CanonPlan extends BaseEntity {
  code: string; // ej: "TIPO_A", "TIPO_B", "TIPO_C"
  name: string; // ej: "Pesebrera Tipo A"
  tagline: string; // ej: "El criadero se encarga de todo"
  description: string;
  basePriceCOP: number;
  basePlazaCOP?: number; // Tarifa base de infraestructura/alojamiento de la pesebrera
  inclusions: CanonServiceInclusion[];
  isActive: boolean;
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
  horsesWithOverdueFarrier: number; // Herrajes pendientes/vencidos
  lowStockItemsCount: number; // Insumos con stock bajo/crítico
  activeClients: number;
  monthlyRevenue: number;
  pendingPaymentsCount: number;
  pendingPaymentsTotal: number;
}

// ----------------------------------------------------------------------------
// 13. ROLES DE USUARIO Y CONTROL DE ACCESO
// ----------------------------------------------------------------------------
export type UserRole =
  | "admin"
  | "mayordomo"
  | "veterinario"
  | "montador"
  | "palafrenero"
  | "propietario";

export interface RoleDefinition {
  id: UserRole;
  title: string;
  subtitle: string;
  badge: string;
  emoji: string;
  color: string;
  allowedTabs: string[];
  defaultTab: string;
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password: string;
  email?: string;
  phone?: string;
  linkedClientId?: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

// ----------------------------------------------------------------------------
// 14. RETIRO / BAJA DE EQUINOS
// ----------------------------------------------------------------------------
export type HorseRetirementReason =
  | "venta_traslado"
  | "salida_propietario"
  | "fallecimiento"
  | "potrero_descanso"
  | "error_registro";

export interface HorseRetirementPayload {
  horseId: string;
  reason: HorseRetirementReason;
  notes?: string;
  destination?: string;
  authorizedBy: string;
  allowWithDebt?: boolean;
}

// ----------------------------------------------------------------------------
// 15. NOTIFICACIONES AL PROPIETARIO SEGÚN PLAN DE CANON
// ----------------------------------------------------------------------------
export interface OwnerNotification extends BaseEntity {
  clientId: string;
  clientName: string;
  horseId: string;
  horseName: string;
  planCode: string;
  planName: string;
  serviceCategory: string;
  title: string;
  message: string;
  coveredByPlan: boolean;
  coverageDetail: string;
  extraCostCOP?: number;
  severity: "info" | "alerta" | "urgente";
  reportedBy: string;
  isRead: boolean;
  waUrl?: string;
}

