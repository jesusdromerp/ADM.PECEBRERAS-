/**
 * ============================================================================
 * GESTIÓN ECUESTRE - CAPA UNIFICADA DE SERVICIOS
 * ============================================================================
 * Capa de servicios con soporte para:
 * - Pedigrí de equinos
 * - Historial clínico de enfermedades en pesebrera
 * - Control de herraje
 * - Generador de recibos formateados para WhatsApp
 */

import {
  Pesebrera,
  Horse,
  Client,
  VeterinaryRecord,
  PaymentRecord,
  DashboardMetrics,
  HorsePedigree,
  DiseaseHistoryEntry,
  FarrierControl,
  InventoryItem,
  FeedTemplate,
  CenterSettings,
  HorseHealthStatus,
  TreatmentRoute,
  MaintenanceType,
  PesebreraMaintenanceRecord,
  CanonPlan,
  HorseRetirementPayload,
  OwnerNotification,
  HorseDietFeedConfig,
  HorseDailyActivityRecord,
  HorseRidingSessionReport,
  CompleteVeterinaryTreatmentOptions,
  VeterinaryContinuationGuide,
  CaseResolutionType,
  TreatmentComplication,
  TreatmentEditLog,
  UserAccount,
} from "@/types";
import { calculateFeedDepletion } from "@/lib/feed-calculator";
import {
  initialPesebreras,
  initialHorses,
  initialClients,
  initialVeterinaryRecords,
  initialPayments,
  initialInventory,
  initialFeedTemplates,
  initialCenterSettings,
  initialCanonPlans,
  initialUsers,
  calculateMetrics,
} from "./mock-data";
import { initialOwnerNotifications } from "@/lib/notifications";

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved) as T;
  } catch (e) {
    console.warn(`[LocalDataStore] Error al leer ${key}:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[LocalDataStore] Error al guardar ${key}:`, e);
  }
}

class LocalDataStore {
  private ownerNotifications: OwnerNotification[] = loadFromStorage(
    "adm_owner_notifications",
    [...initialOwnerNotifications]
  );
  private pesebreras: Pesebrera[] = (() => {
    const defaultBoxes = initialPesebreras.map((b) => ({
      ...b,
      assignedHorseId: b.horseId || b.assignedHorseId || null,
      assignedHorseName: b.horseName || b.assignedHorseName || null,
      maintenanceHistory: b.maintenanceHistory || [],
    }));
    const loaded = loadFromStorage<Pesebrera[]>("adm_pesebreras", defaultBoxes);
    return loaded.map((b) => ({
      ...b,
      maintenanceHistory: b.maintenanceHistory || [],
    }));
  })();
  private horses: Horse[] = (() => {
    const list = loadFromStorage<Horse[]>("adm_horses", [...initialHorses]);
    return list.map((h) => ({
      ...h,
      diseaseHistory: h.diseaseHistory || [],
      dailyActivityHistory: h.dailyActivityHistory || [],
      ridingSessionHistory: h.ridingSessionHistory || [],
      dailyPortionsCount: h.dailyPortionsCount ?? 3,
    }));
  })();
  private clients: Client[] = loadFromStorage("adm_clients", [...initialClients]);
  private veterinaryRecords: VeterinaryRecord[] = (() => {
    const list = loadFromStorage<VeterinaryRecord[]>("adm_vet_records", [...initialVeterinaryRecords]);
    if (!list || list.length === 0) {
      return [...initialVeterinaryRecords];
    }
    return list;
  })();
  private payments: PaymentRecord[] = loadFromStorage("adm_payments", [...initialPayments]);
  private inventory: InventoryItem[] = loadFromStorage("adm_inventory", [...initialInventory]);
  private feedTemplates: FeedTemplate[] = loadFromStorage("adm_feed_templates", [...initialFeedTemplates]);
  private centerSettings: CenterSettings = (() => {
    const saved = loadFromStorage<CenterSettings>("adm_center_settings", initialCenterSettings);
    return { ...initialCenterSettings, ...saved };
  })();
  private canonPlans: CanonPlan[] = (() => {
    const list = loadFromStorage<CanonPlan[]>("adm_canon_plans", [...initialCanonPlans]);
    return list.map((p) => {
      const initMatch = initialCanonPlans.find((ip) => ip.code === p.code || ip.id === p.id);
      const basePlazaCOP = p.basePlazaCOP ?? initMatch?.basePlazaCOP ?? 300000;
      const inclusions = (p.inclusions || []).map((inc) => {
        if (inc.costCOP !== undefined && inc.costCOP > 0) return inc;
        const matchInc = initMatch?.inclusions.find(
          (mi) => mi.name.toLowerCase() === inc.name.toLowerCase() || mi.id === inc.id
        );
        return {
          ...inc,
          costCOP: matchInc?.costCOP ?? 100000,
        };
      });
      const total =
        basePlazaCOP +
        inclusions
          .filter((i) => i.included)
          .reduce((acc, i) => acc + (i.costCOP || 0), 0);
      return {
        ...p,
        basePlazaCOP,
        basePriceCOP: total > 0 ? total : p.basePriceCOP,
        inclusions,
      };
    });
  })();

  private users: UserAccount[] = (() => {
    const list = loadFromStorage<UserAccount[]>("adm_user_accounts", [...initialUsers]);
    if (!list || list.length === 0) {
      return [...initialUsers];
    }
    return list;
  })();
  private currentUser: UserAccount | null = (() => {
    return loadFromStorage<UserAccount | null>("adm_current_user", null);
  })();

  private persistUsers(): void {
    saveToStorage("adm_user_accounts", this.users);
  }

  private persistHorses(): void {
    saveToStorage("adm_horses", this.horses);
  }
  private persistPesebreras(): void {
    saveToStorage("adm_pesebreras", this.pesebreras);
  }
  private persistClients(): void {
    saveToStorage("adm_clients", this.clients);
  }
  private persistVeterinaryRecords(): void {
    saveToStorage("adm_vet_records", this.veterinaryRecords);
  }
  private persistPayments(): void {
    saveToStorage("adm_payments", this.payments);
  }
  private persistInventory(): void {
    saveToStorage("adm_inventory", this.inventory);
  }
  private persistFeedTemplates(): void {
    saveToStorage("adm_feed_templates", this.feedTemplates);
  }
  private persistCenterSettings(): void {
    saveToStorage("adm_center_settings", this.centerSettings);
  }
  private persistCanonPlans(): void {
    saveToStorage("adm_canon_plans", this.canonPlans);
  }
  private persistOwnerNotifications(): void {
    saveToStorage("adm_owner_notifications", this.ownerNotifications);
  }

  public persistAll(): void {
    this.persistHorses();
    this.persistPesebreras();
    this.persistClients();
    this.persistVeterinaryRecords();
    this.persistPayments();
    this.persistInventory();
    this.persistFeedTemplates();
    this.persistCenterSettings();
    this.persistCanonPlans();
    this.persistOwnerNotifications();
    this.persistUsers();
  }

  public resetToDefaultData(): void {
    this.ownerNotifications = [...initialOwnerNotifications];
    this.pesebreras = initialPesebreras.map((b) => ({
      ...b,
      assignedHorseId: b.horseId || b.assignedHorseId || null,
      assignedHorseName: b.horseName || b.assignedHorseName || null,
      maintenanceHistory: b.maintenanceHistory || [],
    }));
    this.horses = [...initialHorses];
    this.clients = [...initialClients];
    this.veterinaryRecords = [...initialVeterinaryRecords];
    this.payments = [...initialPayments];
    this.inventory = [...initialInventory];
    this.feedTemplates = [...initialFeedTemplates];
    this.centerSettings = { ...initialCenterSettings };
    this.canonPlans = [...initialCanonPlans];
    this.users = [...initialUsers];
    this.persistAll();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("center-settings-updated"));
      window.dispatchEvent(new CustomEvent("users-updated"));
    }
  }

  public getStorageStats(): {
    horsesCount: number;
    pesebrerasCount: number;
    clientsCount: number;
    paymentsCount: number;
    inventoryCount: number;
    notificationsCount: number;
    usersCount: number;
    isPersistent: boolean;
  } {
    return {
      horsesCount: this.horses.length,
      pesebrerasCount: this.pesebreras.length,
      clientsCount: this.clients.length,
      paymentsCount: this.payments.length,
      inventoryCount: this.inventory.length,
      notificationsCount: this.ownerNotifications.length,
      usersCount: this.users.length,
      isPersistent: typeof window !== "undefined",
    };
  }

  public exportBackupData(): string {
    const backup = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      stableName: this.centerSettings.stableName,
      data: {
        horses: this.horses,
        pesebreras: this.pesebreras,
        clients: this.clients,
        veterinaryRecords: this.veterinaryRecords,
        payments: this.payments,
        inventory: this.inventory,
        feedTemplates: this.feedTemplates,
        centerSettings: this.centerSettings,
        canonPlans: this.canonPlans,
        ownerNotifications: this.ownerNotifications,
        users: this.users,
      },
    };
    return JSON.stringify(backup, null, 2);
  }

  public importBackupData(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.data) {
        return { success: false, message: "El archivo no contiene un formato de respaldo válido de Gestión Ecuestre." };
      }
      const d = parsed.data;
      if (Array.isArray(d.horses)) this.horses = d.horses;
      if (Array.isArray(d.pesebreras)) this.pesebreras = d.pesebreras;
      if (Array.isArray(d.clients)) this.clients = d.clients;
      if (Array.isArray(d.veterinaryRecords)) this.veterinaryRecords = d.veterinaryRecords;
      if (Array.isArray(d.payments)) this.payments = d.payments;
      if (Array.isArray(d.inventory)) this.inventory = d.inventory;
      if (Array.isArray(d.feedTemplates)) this.feedTemplates = d.feedTemplates;
      if (d.centerSettings && typeof d.centerSettings === "object") {
        this.centerSettings = { ...initialCenterSettings, ...d.centerSettings };
      }
      if (Array.isArray(d.canonPlans)) this.canonPlans = d.canonPlans;
      if (Array.isArray(d.ownerNotifications)) this.ownerNotifications = d.ownerNotifications;
      if (Array.isArray(d.users)) this.users = d.users;

      this.persistAll();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("center-settings-updated"));
        window.dispatchEvent(new CustomEvent("users-updated"));
      }
      return {
        success: true,
        message: `Copia de seguridad restaurada con éxito: ${this.horses.length} ejemplares, ${this.pesebreras.length} boxes y ${this.clients.length} clientes actualizados.`,
      };
    } catch (e: any) {
      return { success: false, message: "Error al procesar el archivo de respaldo: " + (e?.message || "Formato inválido") };
    }
  }

  // PESEBRERAS
  getPesebreras(): Pesebrera[] {
    return [...this.pesebreras];
  }

  updatePesebreraStatus(
    id: string,
    status: Pesebrera["status"],
    maintenanceInfo?: {
      type: MaintenanceType;
      typeName: string;
      types?: MaintenanceType[];
      typeNames?: string[];
      description: string;
      responsiblePerson: string;
      cost?: number;
    }
  ): Pesebrera | null {
    const box = this.pesebreras.find((b) => b.id === id);
    if (!box) return null;

    box.status = status;

    // Si se pasa a mantenimiento, NUNCA borramos al caballo; se conserva asignado
    if (status === "mantenimiento") {
      if (box.horseId) {
        box.assignedHorseId = box.horseId;
        box.assignedHorseName = box.horseName;
      }
      const todayDate = new Date().toISOString().split("T")[0];
      if (maintenanceInfo) {
        if (!box.maintenanceHistory) box.maintenanceHistory = [];
        box.maintenanceHistory.unshift({
          id: `maint-${Date.now()}`,
          date: todayDate,
          type: maintenanceInfo.type,
          typeName: maintenanceInfo.typeName,
          types: maintenanceInfo.types,
          typeNames: maintenanceInfo.typeNames,
          description: maintenanceInfo.description,
          responsiblePerson: maintenanceInfo.responsiblePerson,
          cost: maintenanceInfo.cost,
          status: "pendiente_aprobacion",
        });
        box.currentMaintenanceReason = maintenanceInfo.typeName;
        box.currentMaintenanceResponsible = maintenanceInfo.responsiblePerson;
        box.currentMaintenanceDate = todayDate;
      } else {
        box.currentMaintenanceReason = "Mantenimiento General";
        box.currentMaintenanceResponsible = "Mayordomía";
        box.currentMaintenanceDate = todayDate;
      }
    } else if (status === "ocupada") {
      // Reintegrar al caballo titular
      if (box.assignedHorseId) {
        box.horseId = box.assignedHorseId;
        box.horseName = box.assignedHorseName;
        const horse = this.horses.find((h) => h.id === box.assignedHorseId);
        if (horse) {
          horse.pesebreraId = box.id;
          horse.pesebreraCode = box.code;
        }
      }
      box.currentMaintenanceReason = null;
      box.currentMaintenanceResponsible = null;
      box.currentMaintenanceDate = null;
    } else if (status === "disponible") {
      // Liberar box (el caballo sale definitivamente)
      if (box.horseId || box.assignedHorseId) {
        const targetHorseId = box.horseId || box.assignedHorseId;
        const horse = this.horses.find((h) => h.id === targetHorseId);
        if (horse && horse.pesebreraId === box.id) {
          horse.pesebreraId = undefined;
          horse.pesebreraCode = undefined;
        }
      }
      box.horseId = null;
      box.horseName = null;
      box.assignedHorseId = null;
      box.assignedHorseName = null;
      box.currentMaintenanceReason = null;
      box.currentMaintenanceResponsible = null;
      box.currentMaintenanceDate = null;
    }

    box.updatedAt = new Date().toISOString();
    this.persistPesebreras();
    this.persistHorses();
    return { ...box };
  }

  // Reactivar al caballo que estaba en la pesebrera
  reactivateHorseInPesebrera(boxId: string): Pesebrera | null {
    const box = this.pesebreras.find((b) => b.id === boxId);
    if (!box) return null;

    box.status = "ocupada";
    if (box.assignedHorseId) {
      box.horseId = box.assignedHorseId;
      box.horseName = box.assignedHorseName;
      const horse = this.horses.find((h) => h.id === box.assignedHorseId);
      if (horse) {
        horse.pesebreraId = box.id;
        horse.pesebreraCode = box.code;
      }
    }
    box.currentMaintenanceReason = null;
    box.currentMaintenanceResponsible = null;
    box.currentMaintenanceDate = null;
    box.updatedAt = new Date().toISOString();
    this.persistPesebreras();
    this.persistHorses();
    return { ...box };
  }

  // Aprobar formalmente el mantenimiento en curso y habilitar la pesebrera nuevamente para su uso
  approvePesebreraMaintenance(
    boxId: string,
    approvalData: {
      approvedBy: string;
      notes?: string;
      targetStatus?: "auto" | "disponible" | "ocupada";
    }
  ): Pesebrera | null {
    const box = this.pesebreras.find((b) => b.id === boxId);
    if (!box) return null;

    const todayDate = new Date().toISOString().split("T")[0];
    const nowTimestamp = new Date().toISOString();

    // Actualizar el registro activo en el historial de mantenimiento
    if (!box.maintenanceHistory) box.maintenanceHistory = [];
    const activeMaint =
      box.maintenanceHistory.find(
        (m) => !m.completedAt || m.status === "pendiente_aprobacion"
      ) || box.maintenanceHistory[0];

    if (activeMaint) {
      activeMaint.completedAt = nowTimestamp;
      activeMaint.approvalDate = todayDate;
      activeMaint.approvedBy = approvalData.approvedBy || "Mayordomía / Administración";
      activeMaint.approvalNotes =
        approvalData.notes ||
        "Mantenimiento verificado e inspeccionado. Pesebrera entregada en óptimas condiciones para su uso.";
      activeMaint.status = "aprobado";
    }

    // Determinar si sale para uso con el caballo que vivía allí o queda disponible
    const target = approvalData.targetStatus || "auto";
    const shouldReintegrate =
      (target === "auto" && Boolean(box.assignedHorseId)) || target === "ocupada";

    if (shouldReintegrate && box.assignedHorseId) {
      box.status = "ocupada";
      box.horseId = box.assignedHorseId;
      box.horseName = box.assignedHorseName;
      const horse = this.horses.find((h) => h.id === box.assignedHorseId);
      if (horse) {
        horse.pesebreraId = box.id;
        horse.pesebreraCode = box.code;
      }
    } else {
      box.status = "disponible";
      if (box.horseId || box.assignedHorseId) {
        const targetHorseId = box.horseId || box.assignedHorseId;
        const horse = this.horses.find((h) => h.id === targetHorseId);
        if (horse && horse.pesebreraId === box.id) {
          horse.pesebreraId = undefined;
          horse.pesebreraCode = undefined;
        }
      }
      box.horseId = null;
      box.horseName = null;
      box.assignedHorseId = null;
      box.assignedHorseName = null;
    }

    box.currentMaintenanceReason = null;
    box.currentMaintenanceResponsible = null;
    box.currentMaintenanceDate = null;
    box.updatedAt = nowTimestamp;

    this.persistPesebreras();
    this.persistHorses();
    return { ...box };
  }

  // Registrar un mantenimiento en el historial de la pesebrera
  addPesebreraMaintenance(
    boxId: string,
    maintenance: {
      type: MaintenanceType;
      typeName: string;
      types?: MaintenanceType[];
      typeNames?: string[];
      description: string;
      responsiblePerson: string;
      cost?: number;
      setInMaintenance?: boolean;
      reactivateHorse?: boolean;
    }
  ): Pesebrera | null {
    const box = this.pesebreras.find((b) => b.id === boxId);
    if (!box) return null;

    if (!box.maintenanceHistory) box.maintenanceHistory = [];
    const record: PesebreraMaintenanceRecord = {
      id: `maint-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type: maintenance.type,
      typeName: maintenance.typeName,
      types: maintenance.types,
      typeNames: maintenance.typeNames,
      description: maintenance.description,
      responsiblePerson: maintenance.responsiblePerson,
      cost: maintenance.cost,
      completedAt: maintenance.reactivateHorse ? new Date().toISOString() : undefined,
    };
    box.maintenanceHistory.unshift(record);

    if (maintenance.reactivateHorse) {
      return this.reactivateHorseInPesebrera(boxId);
    } else if (maintenance.setInMaintenance) {
      return this.updatePesebreraStatus(boxId, "mantenimiento", maintenance);
    }

    box.updatedAt = new Date().toISOString();
    this.persistPesebreras();
    return { ...box };
  }

  assignHorseToPesebrera(boxId: string, horseId: string): { box: Pesebrera; horse: Horse } | null {
    const box = this.pesebreras.find((b) => b.id === boxId);
    const horse = this.horses.find((h) => h.id === horseId);
    if (!box || !horse) return null;

    if (horse.pesebreraId && horse.pesebreraId !== boxId) {
      const prevBox = this.pesebreras.find((b) => b.id === horse.pesebreraId);
      if (prevBox) {
        prevBox.status = "disponible";
        prevBox.horseId = null;
        prevBox.horseName = null;
        prevBox.assignedHorseId = null;
        prevBox.assignedHorseName = null;
      }
    }

    box.horseId = horse.id;
    box.horseName = horse.name;
    box.assignedHorseId = horse.id;
    box.assignedHorseName = horse.name;
    box.status = "ocupada";
    box.currentMaintenanceReason = null;
    box.updatedAt = new Date().toISOString();

    horse.pesebreraId = box.id;
    horse.pesebreraCode = box.code;
    horse.updatedAt = new Date().toISOString();

    this.persistPesebreras();
    this.persistHorses();
    return { box: { ...box }, horse: { ...horse } };
  }

  moveHorseToPesebrera(
    horseId: string,
    fromBoxId: string,
    toBoxId: string,
    notes?: string
  ): { fromBox: Pesebrera; toBox: Pesebrera; horse: Horse } | null {
    const fromBox = this.pesebreras.find((b) => b.id === fromBoxId);
    const toBox = this.pesebreras.find((b) => b.id === toBoxId);
    const horse = this.horses.find((h) => h.id === horseId);

    if (!fromBox || !toBox || !horse) return null;

    const now = new Date().toISOString();

    // 1. Liberar box de origen
    fromBox.status = "disponible";
    fromBox.horseId = null;
    fromBox.horseName = null;
    fromBox.assignedHorseId = null;
    fromBox.assignedHorseName = null;
    fromBox.currentMaintenanceReason = null;
    fromBox.updatedAt = now;

    // 2. Ocupar box de destino
    toBox.status = "ocupada";
    toBox.horseId = horse.id;
    toBox.horseName = horse.name;
    toBox.assignedHorseId = horse.id;
    toBox.assignedHorseName = horse.name;
    toBox.currentMaintenanceReason = null;
    toBox.updatedAt = now;

    // 3. Actualizar datos del caballo
    horse.pesebreraId = toBox.id;
    horse.pesebreraCode = toBox.code;
    if (notes) {
      horse.dietNotes = horse.dietNotes
        ? `${horse.dietNotes} | Traslado de ${fromBox.code} a ${toBox.code}: ${notes}`
        : `Traslado de ${fromBox.code} a ${toBox.code}: ${notes}`;
    }
    horse.updatedAt = now;

    this.persistPesebreras();
    this.persistHorses();
    return {
      fromBox: { ...fromBox },
      toBox: { ...toBox },
      horse: { ...horse },
    };
  }

  releaseHorseFromCriadero(
    boxId: string,
    notes?: string
  ): { box: Pesebrera; horse?: Horse } | null {
    const box = this.pesebreras.find((b) => b.id === boxId);
    if (!box) return null;

    const now = new Date().toISOString();
    const targetHorseId = box.horseId || box.assignedHorseId;
    let horse: Horse | undefined;

    if (targetHorseId) {
      horse = this.horses.find((h) => h.id === targetHorseId);
      if (horse) {
        horse.pesebreraId = null;
        horse.pesebreraCode = null;
        horse.exitDate = now.split("T")[0];
        horse.exitReason = notes || "Salida definitiva del criadero";
        horse.isActive = false;
        horse.updatedAt = now;

        const client = this.clients.find((c) => c.id === horse!.ownerId);
        if (client && client.horsesCount > 0) {
          client.horsesCount = Math.max(0, client.horsesCount - 1);
        }
      }
    }

    box.status = "disponible";
    box.horseId = null;
    box.horseName = null;
    box.assignedHorseId = null;
    box.assignedHorseName = null;
    box.currentMaintenanceReason = null;
    box.updatedAt = now;

    this.persistPesebreras();
    this.persistHorses();
    this.persistClients();
    return {
      box: { ...box },
      horse: horse ? { ...horse } : undefined,
    };
  }

  getHorseFinancialSummary(horseId: string): {
    isUpToDate: boolean;
    pendingTotal: number;
    pendingPayments: PaymentRecord[];
    canonPayments: PaymentRecord[];
  } {
    const horsePayments = this.payments.filter((p) => p.horseId === horseId);
    const pendingPayments = horsePayments.filter(
      (p) => p.status === "pendiente" || p.status === "vencido"
    );
    const canonPayments = pendingPayments.filter(
      (p) => p.category === "alquiler_pesebrera" || p.category === "integral"
    );
    const pendingTotal = pendingPayments.reduce((acc, p) => acc + p.amount, 0);

    return {
      isUpToDate: pendingPayments.length === 0,
      pendingTotal,
      pendingPayments,
      canonPayments,
    };
  }

  // CABALLOS
  getHorses(): Horse[] {
    return [...this.horses];
  }

  getHorseById(id: string): Horse | null {
    const horse = this.horses.find((h) => h.id === id);
    return horse ? { ...horse } : null;
  }

  addHorse(horseData: Omit<Horse, "id" | "createdAt" | "updatedAt">): Horse {
    const now = new Date().toISOString();
    const newHorse: Horse = {
      ...horseData,
      id: `horse-${Date.now()}`,
      diseaseHistory: horseData.diseaseHistory || [],
      dailyActivityHistory: horseData.dailyActivityHistory || [],
      ridingSessionHistory: horseData.ridingSessionHistory || [],
      dailyPortionsCount: horseData.dailyPortionsCount || 3,
      createdAt: now,
      updatedAt: now,
    };
    this.horses.unshift(newHorse);

    if (newHorse.pesebreraId) {
      const box = this.pesebreras.find((b) => b.id === newHorse.pesebreraId);
      if (box) {
        box.horseId = newHorse.id;
        box.horseName = newHorse.name;
        box.assignedHorseId = newHorse.id;
        box.assignedHorseName = newHorse.name;
        box.status = "ocupada";
        box.updatedAt = now;
      }
    }

    const client = this.clients.find((c) => c.id === newHorse.ownerId);
    if (client) {
      client.horsesCount += 1;
    }

    // Si se asignó pesebrera y tiene canon mensual configurado, generar primer recibo de cobro
    if (newHorse.planPriceCOP && newHorse.planPriceCOP > 0) {
      const receiptNumber = `REC-${new Date().getFullYear()}-${String(this.payments.length + 1).padStart(4, "0")}`;
      const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const items = (newHorse.planInclusions || [])
        .filter((inc) => inc.included)
        .map((inc) => ({ concept: inc.name, amount: inc.costCOP || 0 }));

      this.payments.unshift({
        id: `pay-${Date.now()}`,
        receiptNumber,
        clientId: newHorse.ownerId,
        clientName: newHorse.ownerName,
        clientPhone: client?.phone,
        horseId: newHorse.id,
        horseName: newHorse.name,
        pesebreraCode: newHorse.pesebreraCode || undefined,
        category: "alquiler_pesebrera",
        concept: `Canon Mensual - ${newHorse.planName || "Pesebrera"} (${newHorse.name})`,
        amount: newHorse.planPriceCOP,
        items: items.length > 0 ? items : undefined,
        dueDate,
        status: "pendiente",
        bankDetails: this.centerSettings.bankDetails,
        createdAt: now,
        updatedAt: now,
      });

      if (client) {
        client.outstandingBalance = (client.outstandingBalance || 0) + newHorse.planPriceCOP;
        client.paymentStatus = "pendiente";
      }
    }

    this.persistHorses();
    this.persistPesebreras();
    this.persistClients();
    this.persistPayments();
    return { ...newHorse };
  }

  updateHorsePedigree(horseId: string, pedigree: HorsePedigree): Horse | null {
    const horse = this.horses.find((h) => h.id === horseId);
    if (!horse) return null;
    horse.pedigree = { ...pedigree };
    horse.updatedAt = new Date().toISOString();
    this.persistHorses();
    return { ...horse };
  }

  addDiseaseHistoryEntry(horseId: string, entry: Omit<DiseaseHistoryEntry, "id">): Horse | null {
    const horse = this.horses.find((h) => h.id === horseId);
    if (!horse) return null;
    const newEntry: DiseaseHistoryEntry = {
      ...entry,
      id: `dis-${Date.now()}`,
    };
    if (!horse.diseaseHistory) {
      horse.diseaseHistory = [];
    }
    horse.diseaseHistory.unshift(newEntry);
    horse.updatedAt = new Date().toISOString();
    this.persistHorses();
    return { ...horse };
  }

  updateFarrierControl(horseId: string, farrier: FarrierControl): Horse | null {
    const horse = this.horses.find((h) => h.id === horseId);
    if (!horse) return null;
    horse.farrierControl = { ...farrier };
    horse.updatedAt = new Date().toISOString();
    this.persistHorses();
    return { ...horse };
  }

  updateHorsePhoto(horseId: string, imageUrl: string): Horse | null {
    const horse = this.horses.find((h) => h.id === horseId);
    if (!horse) return null;
    horse.imageUrl = imageUrl;
    horse.updatedAt = new Date().toISOString();
    this.persistHorses();
    return { ...horse };
  }

  updateHorseFeedConfig(horseId: string, feedConfig: HorseDietFeedConfig): Horse | null {
    const horse = this.horses.find((h) => h.id === horseId);
    if (!horse) return null;
    horse.feedConfig = { ...feedConfig };
    horse.updatedAt = new Date().toISOString();
    this.persistHorses();
    return { ...horse };
  }

  restockHorseFeed(
    horseId: string,
    kgAddedOrPayload: number | { totalKgAdded?: number; kgAdded?: number; notes?: string; recordedBy?: string },
    notes?: string,
    recordedBy?: string
  ): Horse | null {
    const horse = this.horses.find((h) => h.id === horseId);
    if (!horse) return null;

    let kgAdded = 0;
    let effectiveNotes = notes;
    let effectiveRecordedBy = recordedBy;

    if (typeof kgAddedOrPayload === "number") {
      kgAdded = Number(kgAddedOrPayload) || 0;
    } else if (kgAddedOrPayload && typeof kgAddedOrPayload === "object") {
      kgAdded = Number(kgAddedOrPayload.totalKgAdded ?? kgAddedOrPayload.kgAdded) || 0;
      if (kgAddedOrPayload.notes) effectiveNotes = kgAddedOrPayload.notes;
      if (kgAddedOrPayload.recordedBy) effectiveRecordedBy = kgAddedOrPayload.recordedBy;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const prevConfig: HorseDietFeedConfig = horse.feedConfig || {
      feedProvidedBy: "propietario",
      feedType: "simple",
      feedName: "Concentrado Premium",
      dailyGrainKg: 4,
      totalKgSupplied: 0,
      dailyPortionsCount: 3,
      startDate: todayStr,
      depletionDate: todayStr,
      alertDate: todayStr,
      restockHistory: [],
    };
    const newTotalKg = (prevConfig.totalKgSupplied || 0) + kgAdded;

    // Recalcular la fecha de agotamiento a partir de hoy con el nuevo stock
    const calc = calculateFeedDepletion(newTotalKg, prevConfig.dailyGrainKg || 4, todayStr);

    const logEntry = {
      id: `restock-${Date.now()}`,
      date: todayStr,
      kgAdded,
      notes: effectiveNotes || "Recarga de alimento entregada por el propietario",
      recordedBy: effectiveRecordedBy || "Mayordomo / Administración",
    };

    horse.feedConfig = {
      ...prevConfig,
      totalKgSupplied: newTotalKg,
      startDate: todayStr,
      depletionDate: calc.depletionDate,
      alertDate: calc.alertDate,
      lastRestockedDate: todayStr,
      restockHistory: [logEntry, ...(prevConfig.restockHistory || [])],
    };
    horse.updatedAt = new Date().toISOString();
    this.persistHorses();
    return { ...horse };
  }

  recordHorseDailyActivity(
    horseId: string,
    activityData: Omit<HorseDailyActivityRecord, "id" | "completedAt">
  ): HorseDailyActivityRecord | null {
    const horse = this.horses.find((h) => h.id === horseId);
    if (!horse) return null;

    if (!horse.dailyActivityHistory) {
      horse.dailyActivityHistory = [];
    }

    const now = new Date().toISOString();
    const newRecord: HorseDailyActivityRecord = {
      ...activityData,
      id: `act-${Date.now()}`,
      completedAt: now,
    };

    // Reemplazar si ya existía registro para hoy o agregarlo al inicio
    const existingIndex = horse.dailyActivityHistory.findIndex(
      (r) => r.date === newRecord.date
    );
    if (existingIndex >= 0) {
      horse.dailyActivityHistory[existingIndex] = newRecord;
    } else {
      horse.dailyActivityHistory.unshift(newRecord);
    }

    horse.updatedAt = now;
    this.persistHorses();

    // Si está marcado para publicar al propietario, crear notificación automática para el portal
    if (newRecord.publishedToOwner) {
      const client = this.clients.find((c) => c.id === horse.ownerId);
      const portionsSummary = `${newRecord.portionsServedCount}/${newRecord.totalPortionsPlanned} raciones servidas`;
      const rideSummary = newRecord.wasRidden
        ? `Monta completada (${newRecord.ridingActivity || "Pista"}${newRecord.riderName ? ` por ${newRecord.riderName}` : ""})`
        : "Sin sesión de monta hoy";

      const notif: OwnerNotification = {
        id: `notif-day-${Date.now()}`,
        clientId: horse.ownerId,
        clientName: client?.fullName || horse.ownerName,
        horseId: horse.id,
        horseName: horse.name,
        planCode: horse.planCode || "TIPO_A",
        planName: horse.planName || "Pesebrera",
        serviceCategory: "pista_raciones",
        title: `Jornada Diaria: ${horse.name} (${newRecord.date})`,
        message: `Reporte de atenciones de hoy: ${portionsSummary}. ${rideSummary}. Cuidados: ${[
          newRecord.generalCare.bathed ? "Baño" : null,
          newRecord.generalCare.hoovesCleaned ? "Cascos" : null,
          newRecord.generalCare.stableCleaned ? "Cama limpia" : null,
        ].filter(Boolean).join(", ") || "Revisión general"}.`,
        coveredByPlan: true,
        coverageDetail: "Registro diario de actividades en cuadra",
        severity: "info",
        reportedBy: newRecord.reportedBy,
        isRead: false,
        createdAt: now,
        updatedAt: now,
      };

      this.ownerNotifications.unshift(notif);
      this.persistOwnerNotifications();
    }

    return { ...newRecord };
  }

  updateHorseDailySchedule(
    horseId: string,
    updates: {
      dailyPortionsCount?: number;
      scheduledForRidingToday?: boolean;
      assignedRiderName?: string;
      ridingActivityType?: string;
    }
  ): Horse | null {
    const horse = this.horses.find((h) => h.id === horseId);
    if (!horse) return null;
    if (updates.dailyPortionsCount !== undefined) horse.dailyPortionsCount = updates.dailyPortionsCount;
    if (updates.scheduledForRidingToday !== undefined) horse.scheduledForRidingToday = updates.scheduledForRidingToday;
    if (updates.assignedRiderName !== undefined) horse.assignedRiderName = updates.assignedRiderName;
    if (updates.ridingActivityType !== undefined) horse.ridingActivityType = updates.ridingActivityType;
    horse.updatedAt = new Date().toISOString();
    this.persistHorses();
    return { ...horse };
  }

  recordHorseRidingSession(
    horseId: string,
    sessionData: Omit<HorseRidingSessionReport, "id" | "completedAt">
  ): HorseRidingSessionReport | null {
    const horse = this.horses.find((h) => h.id === horseId);
    if (!horse) return null;

    if (!horse.ridingSessionHistory) {
      horse.ridingSessionHistory = [];
    }

    const now = new Date().toISOString();
    const newReport: HorseRidingSessionReport = {
      ...sessionData,
      id: `ride-${Date.now()}`,
      completedAt: now,
    };

    const existingIdx = horse.ridingSessionHistory.findIndex(
      (r) => r.date === newReport.date
    );
    if (existingIdx >= 0) {
      horse.ridingSessionHistory[existingIdx] = newReport;
    } else {
      horse.ridingSessionHistory.unshift(newReport);
    }

    // Sincronizar en el registro diario si existe
    if (horse.dailyActivityHistory && horse.dailyActivityHistory.length > 0) {
      const todayDaily = horse.dailyActivityHistory.find(
        (d) => d.date === newReport.date
      );
      if (todayDaily) {
        todayDaily.wasRidden = true;
        todayDaily.riderName = newReport.riderName;
        todayDaily.ridingActivity = `${newReport.sessionType} (${newReport.durationMinutes} min)`;
      }
    }

    horse.updatedAt = now;
    this.persistHorses();

    if (newReport.publishedToOwner) {
      const client = this.clients.find((c) => c.id === horse.ownerId);
      const notif: OwnerNotification = {
        id: `notif-ride-${Date.now()}`,
        clientId: horse.ownerId,
        clientName: client?.fullName || horse.ownerName,
        horseId: horse.id,
        horseName: horse.name,
        planCode: horse.planCode || "TIPO_A",
        planName: horse.planName || "Pesebrera",
        serviceCategory: "pista_montador",
        title: `Informe de Monta: ${horse.name} (${newReport.date})`,
        message: `El montador ${newReport.riderName} completó sesión de ${newReport.sessionType} (${newReport.durationMinutes} min). Actitud: ${newReport.attitude}. Nota: "${newReport.technicalNotes}"`,
        coveredByPlan: true,
        coverageDetail: "Sesión de pista y adiestramiento por el montador",
        severity: "info",
        reportedBy: newReport.riderName,
        isRead: false,
        createdAt: now,
        updatedAt: now,
      };
      this.ownerNotifications.unshift(notif);
      this.persistOwnerNotifications();
    }

    return { ...newReport };
  }

  // RETIRO / BAJA DEFINITIVA DE EQUINOS
  retireHorse(payload: HorseRetirementPayload): boolean {
    const horse = this.horses.find((h) => h.id === payload.horseId);
    if (!horse) return false;

    // Liberar la pesebrera asignada si existe
    if (horse.pesebreraId || horse.pesebreraCode) {
      const box = this.pesebreras.find(
        (b) => b.id === horse.pesebreraId || b.code === horse.pesebreraCode
      );
      if (box) {
        box.status = "disponible";
        box.horseId = null;
        box.horseName = null;
        box.assignedHorseId = null;
        box.assignedHorseName = null;
        box.notes = `Desocupada por retiro de ejemplar ${horse.name} (Motivo: ${payload.reason}). ${payload.notes || ""}`;
      }
    }

    // Actualizar conteo de equinos del propietario
    const client = this.clients.find((c) => c.id === horse.ownerId);
    if (client) {
      client.horsesCount = Math.max(0, client.horsesCount - 1);
    }

    // Remover de la lista activa de caballos
    this.horses = this.horses.filter((h) => h.id !== payload.horseId);

    this.persistHorses();
    this.persistPesebreras();
    this.persistClients();
    return true;
  }

  // CLIENTES
  getClients(): Client[] {
    return [...this.clients];
  }

  addClient(clientData: Omit<Client, "id" | "createdAt" | "updatedAt">): Client {
    const now = new Date().toISOString();
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.clients.unshift(newClient);
    this.persistClients();
    return { ...newClient };
  }

  updateClient(id: string, updates: Partial<Omit<Client, "id" | "createdAt">>): Client | null {
    const client = this.clients.find((c) => c.id === id);
    if (!client) return null;
    Object.assign(client, updates, { updatedAt: new Date().toISOString() });

    // Sincronización en Cascada: Actualizar nombre en caballos, cobros y notificaciones vinculadas
    if (updates.fullName) {
      this.horses.forEach((h) => {
        if (h.ownerId === id) {
          h.ownerName = updates.fullName!;
          h.updatedAt = new Date().toISOString();
        }
      });
      this.payments.forEach((p) => {
        if (p.clientId === id) {
          p.clientName = updates.fullName!;
        }
      });
      this.ownerNotifications.forEach((n) => {
        if (n.clientId === id) {
          n.clientName = updates.fullName!;
        }
      });
    }

    if (updates.phone) {
      this.payments.forEach((p) => {
        if (p.clientId === id) {
          p.clientPhone = updates.phone!;
        }
      });
    }

    this.persistClients();
    this.persistHorses();
    this.persistPayments();
    this.persistOwnerNotifications();
    return { ...client };
  }

  deleteClient(id: string): boolean {
    const initialLen = this.clients.length;
    this.clients = this.clients.filter((c) => c.id !== id);

    // Desvincular de caballos para evitar datos huérfanos
    this.horses.forEach((h) => {
      if (h.ownerId === id) {
        h.ownerName = "(Sin Propietario)";
        h.ownerId = "";
        h.updatedAt = new Date().toISOString();
      }
    });

    this.persistClients();
    this.persistHorses();
    return this.clients.length < initialLen;
  }

  // VETERINARIA
  getVeterinaryRecords(): VeterinaryRecord[] {
    return [...this.veterinaryRecords];
  }

  addVeterinaryRecord(
    recordData: Omit<VeterinaryRecord, "id" | "createdAt" | "updatedAt">,
    options?: {
      newHorseStatus?: HorseHealthStatus;
      chargeToOwner?: boolean;
      notifyOwner?: boolean;
    }
  ): VeterinaryRecord {
    const now = new Date().toISOString();
    const newRecord: VeterinaryRecord = {
      ...recordData,
      id: `vet-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.veterinaryRecords.unshift(newRecord);

    // Sincronizar automáticamente con el ejemplar (Historial Clínico y Estado de Salud)
    const horse = this.horses.find((h) => h.id === newRecord.horseId);
    if (horse) {
      // 1. Agregar a diseaseHistory si tiene diagnóstico o es tratamiento curativo
      const diagnosisText = newRecord.diagnosis || newRecord.title;
      if (newRecord.diagnosis || newRecord.type === "medicamento") {
        if (!horse.diseaseHistory) horse.diseaseHistory = [];
        horse.diseaseHistory.unshift({
          id: `dis-${Date.now()}`,
          diseaseName: diagnosisText,
          diagnosedDate: newRecord.date,
          resolutionDate: newRecord.status === "completado" ? newRecord.date : undefined,
          severity: newRecord.severity || "moderada",
          status: newRecord.status === "completado" ? "resuelto" : "en_tratamiento",
          medicationsGiven: `${newRecord.title}${newRecord.dosage ? ` (${newRecord.dosage})` : ""}${newRecord.route ? ` - Vía ${newRecord.route}` : ""}`,
          veterinarian: newRecord.administeredBy,
          clinicalNotes: newRecord.notes || newRecord.symptoms || "Atención y diagnóstico veterinario registrado en sistema.",
        });
      }

      // 2. Actualizar estado de salud del caballo
      if (options?.newHorseStatus) {
        horse.healthStatus = options.newHorseStatus;
      } else if (newRecord.status === "en_curso") {
        if (newRecord.severity === "grave") {
          horse.healthStatus = "reposo";
        } else if (newRecord.type === "medicamento") {
          horse.healthStatus = "en_tratamiento";
        }
      }
      horse.updatedAt = now;
      this.persistHorses();

      // 3. Crear cobro contable al propietario si se solicita y costo > 0
      const shouldCharge = options?.chargeToOwner ?? newRecord.chargeToOwner;
      if (shouldCharge && newRecord.cost && newRecord.cost > 0) {
        const client = this.clients.find((c) => c.id === horse.ownerId);
        const newPayment: PaymentRecord = {
          id: `pay-vet-${Date.now()}`,
          receiptNumber: `VET-${Math.floor(100000 + Math.random() * 900000)}`,
          clientId: horse.ownerId,
          clientName: client?.fullName || horse.ownerName,
          clientPhone: client?.phone,
          horseId: horse.id,
          horseName: horse.name,
          pesebreraCode: horse.pesebreraCode || undefined,
          category: "veterinaria",
          concept: `Atención Veterinaria: ${newRecord.diagnosis || newRecord.title} - ${horse.name}`,
          amount: newRecord.cost,
          items: [
            {
              concept: `Tratamiento: ${newRecord.title} (${newRecord.diagnosis || "Sanidad"})`,
              amount: newRecord.cost,
            },
          ],
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          status: "pendiente",
          createdAt: now,
          updatedAt: now,
        };
        this.payments.unshift(newPayment);
        if (client) {
          client.outstandingBalance = (client.outstandingBalance || 0) + newRecord.cost;
          if (client.paymentStatus === "al_dia") client.paymentStatus = "pendiente";
          this.persistClients();
        }
        this.persistPayments();
      }

      // 4. Crear notificación al propietario
      if (options?.notifyOwner !== false) {
        const client = this.clients.find((c) => c.id === horse.ownerId);
        const notif: OwnerNotification = {
          id: `notif-vet-${Date.now()}`,
          clientId: horse.ownerId,
          clientName: client?.fullName || horse.ownerName,
          horseId: horse.id,
          horseName: horse.name,
          planCode: horse.planCode || "TIPO_A",
          planName: horse.planName || "Pesebrera",
          serviceCategory: "Sanidad",
          title: `Reporte Veterinario: ${newRecord.diagnosis || newRecord.title}`,
          message: `El M.V.Z. ${newRecord.administeredBy} registró atención para su ejemplar ${horse.name}. Diagnóstico: ${newRecord.diagnosis || newRecord.title}. Posología: ${newRecord.dosage || "Según indicación"}. Estado: ${newRecord.status}.`,
          coveredByPlan: horse.planCode === "TIPO_A",
          coverageDetail:
            horse.planCode === "TIPO_A"
              ? "Atención clínica preventiva cubierta por su plan integral."
              : "Tratamientos y medicamentos a cargo del propietario.",
          extraCostCOP: shouldCharge ? newRecord.cost : 0,
          severity: newRecord.severity === "grave" ? "urgente" : newRecord.severity === "moderada" ? "alerta" : "info",
          reportedBy: newRecord.administeredBy,
          isRead: false,
          createdAt: now,
          updatedAt: now,
        };
        this.ownerNotifications.unshift(notif);
        this.persistOwnerNotifications();
      }
    }

    this.persistVeterinaryRecords();
    return { ...newRecord };
  }

  updateVeterinaryRecord(
    id: string,
    updates: Partial<Omit<VeterinaryRecord, "id" | "createdAt">>,
    options?: {
      reason?: string;
      editedBy?: string;
      newHorseStatus?: HorseHealthStatus;
      notifyOwner?: boolean;
    }
  ): VeterinaryRecord | null {
    const rec = this.veterinaryRecords.find((r) => r.id === id);
    if (!rec) return null;
    const now = new Date().toISOString();
    const today = now.split("T")[0];

    const prevStatus = rec.status;
    const newStatus = updates.status || prevStatus;

    // Protección y corrección de error humano: si se reactiva o reabre de completado a en_curso
    if (prevStatus === "completado" && newStatus === "en_curso") {
      rec.isReopened = true;
      rec.reopenReason = options?.reason || "Reapertura de tratamiento por corrección o recaída clínica";
      rec.completionDate = undefined;
      rec.caseResolution = undefined;
      rec.medicationContinues = false;
    }

    // Registrar cambios en el historial de auditoría
    const changesSummaryParts: string[] = [];
    if (updates.title && updates.title !== rec.title) changesSummaryParts.push(`Prescripción: ${rec.title} -> ${updates.title}`);
    if (updates.diagnosis && updates.diagnosis !== rec.diagnosis) changesSummaryParts.push(`Diagnóstico: ${rec.diagnosis || '—'} -> ${updates.diagnosis}`);
    if (updates.dosage && updates.dosage !== rec.dosage) changesSummaryParts.push(`Dosis: ${rec.dosage || '—'} -> ${updates.dosage}`);
    if (updates.severity && updates.severity !== rec.severity) changesSummaryParts.push(`Severidad: ${rec.severity} -> ${updates.severity}`);
    if (updates.status && updates.status !== prevStatus) changesSummaryParts.push(`Estado: ${prevStatus} -> ${updates.status}`);
    if (options?.reason) changesSummaryParts.push(`Motivo: ${options.reason}`);

    if (changesSummaryParts.length > 0) {
      if (!rec.editHistory) rec.editHistory = [];
      rec.editHistory.unshift({
        id: `edit-${Date.now()}`,
        date: today,
        editedBy: options?.editedBy || updates.administeredBy || rec.administeredBy || "M.V.Z. / Administrador",
        reason: options?.reason,
        summary: changesSummaryParts.join(" | "),
      });
    }

    Object.assign(rec, updates, { updatedAt: now });

    // Sincronización relacional con el Caballo
    if (rec.horseId) {
      const horse = this.horses.find((h) => h.id === rec.horseId);
      if (horse) {
        if (options?.newHorseStatus) {
          horse.healthStatus = options.newHorseStatus;
        } else if (prevStatus === "completado" && newStatus === "en_curso") {
          horse.healthStatus = "en_tratamiento";
        } else if (updates.severity === "grave") {
          if (horse.healthStatus === "optimo") horse.healthStatus = "reposo";
        }

        // Sincronizar en historial de patologías
        if (horse.diseaseHistory) {
          const queryDiag = (rec.diagnosis || rec.title || "").toLowerCase();
          const disease = horse.diseaseHistory.find(
            (d) =>
              (d.diseaseName.toLowerCase() === queryDiag ||
               (queryDiag && d.diseaseName.toLowerCase().includes(queryDiag)) ||
               (d.diseaseName && queryDiag && queryDiag.includes(d.diseaseName.toLowerCase())))
          ) || horse.diseaseHistory[0];

          if (disease) {
            if (updates.diagnosis) disease.diseaseName = updates.diagnosis;
            if (updates.severity) disease.severity = updates.severity;
            if (prevStatus === "completado" && newStatus === "en_curso") {
              disease.status = "en_tratamiento";
              disease.resolutionDate = undefined;
              disease.clinicalNotes = `${disease.clinicalNotes || ""}\n[${today} - REAPERTURA]: ${options?.reason || "Tratamiento reactivado para seguimiento clínico"}`.trim();
            }
          }
        }
        horse.updatedAt = now;
        this.persistHorses();

        // Notificar si se solicita o si hay cambio crítico a severidad grave
        if (options?.notifyOwner || (updates.severity === "grave" && prevStatus !== "completado")) {
          const client = this.clients.find((c) => c.id === horse.ownerId);
          if (client) {
            const notif: OwnerNotification = {
              id: `notif-${Date.now()}`,
              clientId: client.id,
              clientName: client.fullName,
              horseId: horse.id,
              horseName: horse.name,
              planCode: horse.planCode || "TIPO_A",
              planName: horse.planName || "Plan General",
              serviceCategory: "Sanidad",
              title: updates.severity === "grave"
                ? `Alerta Sanitaria: ${horse.name} (Atención Prioritaria)`
                : `Actualización de Tratamiento: ${horse.name}`,
              message: `El M.V.Z. ${rec.administeredBy} actualizó el tratamiento médico para ${horse.name}. Diagnóstico: ${rec.diagnosis || rec.title}. Posología: ${rec.dosage || 'Ajustada'}.`,
              coveredByPlan: horse.planCode === "TIPO_A",
              coverageDetail: horse.planCode === "TIPO_A" ? "Atención cubierta por plan integral." : "Gastos de tratamiento a cargo del propietario.",
              severity: updates.severity === "grave" ? "urgente" : "info",
              reportedBy: rec.administeredBy,
              isRead: false,
              createdAt: now,
              updatedAt: now,
            };
            this.ownerNotifications.unshift(notif);
            this.persistOwnerNotifications();
          }
        }
      }
    }

    this.persistVeterinaryRecords();
    return { ...rec };
  }

  addTreatmentComplication(
    recordId: string,
    complicationData: Omit<TreatmentComplication, "id">
  ): VeterinaryRecord | null {
    const rec = this.veterinaryRecords.find((r) => r.id === recordId);
    if (!rec) return null;
    const now = new Date().toISOString();
    const today = now.split("T")[0];

    const complication: TreatmentComplication = {
      ...complicationData,
      id: `comp-${Date.now()}`,
      date: complicationData.date || today,
    };

    if (!rec.complications) rec.complications = [];
    rec.complications.unshift(complication);

    // Ajustar severidad si empeoró
    if (complication.newSeverity) {
      rec.severity = complication.newSeverity;
    }
    // Adicionar costo si el medicamento o rescate tuvo costo adicional
    if (complication.additionalCost && complication.additionalCost > 0) {
      rec.cost = (rec.cost || 0) + complication.additionalCost;
    }
    // Si el tratamiento estaba completado y el animal se complica, reabrir automáticamente
    if (rec.status === "completado") {
      rec.status = "en_curso";
      rec.isReopened = true;
      rec.reopenReason = `Complicación médica: ${complication.description}`;
      rec.completionDate = undefined;
      rec.caseResolution = undefined;
    }
    // Instrucciones de cuadra actualizadas
    if (complication.instructionsForStables) {
      rec.stableCareInstructions = `${complication.instructionsForStables} (Actualizado por complicación: ${today}) - ${rec.stableCareInstructions || ''}`.trim();
    }
    // Nota de fármaco adicional
    if (complication.additionalMedication) {
      rec.notes = `${rec.notes || ''}\n[Fármaco adicional por complicación ${today}]: ${complication.additionalMedication} (${complication.actionTaken})`.trim();
    }
    rec.updatedAt = now;

    // Sincronizar con el ejemplar
    if (rec.horseId) {
      const horse = this.horses.find((h) => h.id === rec.horseId);
      if (horse) {
        if (complication.newSeverity === "grave") {
          horse.healthStatus = "reposo";
        } else if (horse.healthStatus === "optimo") {
          horse.healthStatus = "en_tratamiento";
        }

        if (horse.diseaseHistory) {
          const queryDiag = (rec.diagnosis || rec.title || "").toLowerCase();
          const disease = horse.diseaseHistory.find(
            (d) =>
              (d.diseaseName.toLowerCase() === queryDiag ||
               (queryDiag && d.diseaseName.toLowerCase().includes(queryDiag)) ||
               (d.diseaseName && queryDiag && queryDiag.includes(d.diseaseName.toLowerCase())))
          ) || horse.diseaseHistory[0];

          if (disease) {
            if (complication.newSeverity) disease.severity = complication.newSeverity;
            disease.status = "en_tratamiento";
            disease.resolutionDate = undefined;
            disease.clinicalNotes = `${disease.clinicalNotes || ""}\n[COMPLICACIÓN ${today}]: ${complication.description}. Medidas tomadas: ${complication.actionTaken}${complication.additionalMedication ? ` (${complication.additionalMedication})` : ""}`.trim();
          }
        }
        horse.updatedAt = now;
        this.persistHorses();

        // Notificar al propietario por complicación
        if (complication.notifyOwner !== false) {
          const client = this.clients.find((c) => c.id === horse.ownerId);
          if (client) {
            const notif: OwnerNotification = {
              id: `notif-${Date.now()}`,
              clientId: client.id,
              clientName: client.fullName,
              horseId: horse.id,
              horseName: horse.name,
              planCode: horse.planCode || "TIPO_A",
              planName: horse.planName || "Plan General",
              serviceCategory: "Sanidad",
              title: `Alerta Sanitaria: Complicación Clínica en ${horse.name}`,
              message: `El M.V.Z. ${complication.recordedBy || rec.administeredBy} reportó novedad clínica en ${horse.name}: "${complication.description}". Medidas tomadas: "${complication.actionTaken}".`,
              coveredByPlan: horse.planCode === "TIPO_A",
              coverageDetail: horse.planCode === "TIPO_A" ? "Atención veterinaria cubierta." : "Insumos adicionales a cargo del propietario.",
              severity: complication.newSeverity === "grave" ? "urgente" : "alerta",
              reportedBy: complication.recordedBy || rec.administeredBy,
              isRead: false,
              createdAt: now,
              updatedAt: now,
            };
            this.ownerNotifications.unshift(notif);
            this.persistOwnerNotifications();
          }
        }
      }
    }

    this.persistVeterinaryRecords();
    return { ...rec };
  }

  reopenVeterinaryTreatment(
    recordId: string,
    reason?: string,
    reopenedBy?: string
  ): VeterinaryRecord | null {
    return this.updateVeterinaryRecord(
      recordId,
      { status: "en_curso" },
      { reason: reason || "Reapertura de tratamiento", editedBy: reopenedBy }
    );
  }

  completeVeterinaryTreatment(
    recordId: string,
    options?: CompleteVeterinaryTreatmentOptions
  ): VeterinaryRecord | null {
    const rec = this.veterinaryRecords.find((r) => r.id === recordId);
    if (!rec) return null;
    const now = new Date().toISOString();
    const today = now.split("T")[0];

    rec.status = "completado";
    rec.completionDate = today;

    const isMedicationContinues = Boolean(
      options?.caseResolution === "medicacion_continua" ||
      options?.continuationGuide?.medicationContinues
    );

    rec.caseResolution = isMedicationContinues
      ? "medicacion_continua"
      : (options?.caseResolution || "resuelto");
    rec.medicationContinues = isMedicationContinues;

    if (isMedicationContinues && options?.continuationGuide) {
      rec.continuationGuide = options.continuationGuide;
      if (options.continuationGuide.nextCheckDate) {
        rec.nextDueDate = options.continuationGuide.nextCheckDate;
      }
    }

    if (options?.resolutionNotes) {
      rec.clinicalEvolutionNotes = options.resolutionNotes;
    }
    rec.updatedAt = now;

    if (rec.horseId) {
      const horse = this.horses.find((h) => h.id === rec.horseId);
      if (horse) {
        if (options?.targetHorseStatus) {
          horse.healthStatus = options.targetHorseStatus;
        } else if (isMedicationContinues) {
          horse.healthStatus = options?.restoreHorseHealth ? "optimo" : "observacion";
        } else if (options?.restoreHorseHealth !== false) {
          horse.healthStatus = "optimo";
        }

        if (horse.diseaseHistory) {
          // Buscar patología coincidente o activa
          const queryDiag = (rec.diagnosis || rec.title || "").toLowerCase();
          const disease = horse.diseaseHistory.find(
            (d) =>
              (d.diseaseName.toLowerCase() === queryDiag ||
               (queryDiag && d.diseaseName.toLowerCase().includes(queryDiag)) ||
               (d.diseaseName && queryDiag && queryDiag.includes(d.diseaseName.toLowerCase()))) &&
              d.status !== "resuelto"
          ) || horse.diseaseHistory.find((d) => d.status !== "resuelto");

          if (disease) {
            if (!isMedicationContinues || options?.markDiseaseResolved) {
              disease.status = "resuelto";
              disease.resolutionDate = today;
              const noteText = options?.resolutionNotes
                ? `Alta Médica (Caso Resuelto): ${options.resolutionNotes}`
                : "Caso clínico resuelto y cerrado satisfactoriamente.";
              disease.clinicalNotes = `${disease.clinicalNotes || ""}\n${noteText}`.trim();
            } else {
              disease.status = "en_tratamiento";
              const medName = options?.continuationGuide?.medicationName || rec.title;
              const medDose = options?.continuationGuide?.dosage || "";
              const medInst = options?.continuationGuide?.instructions || "";
              const noteText = `[${today}] Fase clínica cerrada. Continúa con guía de medicación en box: ${medName}${medDose ? ` (${medDose})` : ""}. Pautas: ${medInst}`;
              disease.clinicalNotes = `${disease.clinicalNotes || ""}\n${noteText}`.trim();
            }
          }
        }
        horse.updatedAt = now;
        this.persistHorses();

        // Notificación al propietario
        const client = this.clients.find((c) => c.id === horse.ownerId);
        if (client) {
          const isPlanA = horse.planCode === "TIPO_A";
          const notifTitle = isMedicationContinues
            ? `Guía Médica de Continuación: ${horse.name}`
            : `Alta Médica (Caso Resuelto): ${horse.name}`;
          const notifMsg = isMedicationContinues
            ? `El M.V.Z. ${rec.administeredBy} finalizó la fase de tratamiento para ${rec.diagnosis || rec.title} en ${horse.name}. Se emitió una guía de administración en box (${options?.continuationGuide?.medicationName || rec.title}).`
            : `El M.V.Z. ${rec.administeredBy} ha dado de alta a ${horse.name} por ${rec.diagnosis || rec.title}. Caso clínico resuelto satisfactoriamente.`;

          const notif: OwnerNotification = {
            id: `notif-${Date.now()}`,
            clientId: client.id,
            clientName: client.fullName,
            horseId: horse.id,
            horseName: horse.name,
            planCode: horse.planCode || "TIPO_A",
            planName: horse.planName || "Plan General",
            serviceCategory: "Sanidad",
            title: notifTitle,
            message: notifMsg,
            coveredByPlan: isPlanA,
            coverageDetail: isPlanA ? "Atención y seguimiento cubierto por plan." : "Medicamentos e insumos a cargo del propietario.",
            severity: isMedicationContinues ? "alerta" : "info",
            reportedBy: rec.administeredBy,
            isRead: false,
            createdAt: now,
            updatedAt: now,
          };
          this.ownerNotifications.unshift(notif);
          this.persistOwnerNotifications();
        }
      }
    }

    this.persistVeterinaryRecords();
    return { ...rec };
  }

  deleteVeterinaryRecord(id: string): boolean {
    const initialLen = this.veterinaryRecords.length;
    this.veterinaryRecords = this.veterinaryRecords.filter((r) => r.id !== id);
    this.persistVeterinaryRecords();
    return this.veterinaryRecords.length < initialLen;
  }

  // FINANZAS
  getPayments(): PaymentRecord[] {
    return [...this.payments];
  }

  addPayment(
    paymentData: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">
  ): PaymentRecord {
    const now = new Date().toISOString();
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.payments.unshift(newPayment);

    // Si el pago es pendiente, sumar al saldo pendiente del cliente
    if (newPayment.status !== "pagado") {
      const client = this.clients.find((c) => c.id === newPayment.clientId);
      if (client) {
        client.outstandingBalance = (client.outstandingBalance || 0) + newPayment.amount;
        if (client.paymentStatus === "al_dia") {
          client.paymentStatus = "pendiente";
        }
      }
    }

    this.persistPayments();
    this.persistClients();
    return { ...newPayment };
  }

  markPaymentAsPaid(paymentId: string): PaymentRecord | null {
    const pay = this.payments.find((p) => p.id === paymentId);
    if (!pay) return null;
    pay.status = "pagado";
    pay.paymentDate = new Date().toISOString().split("T")[0];
    pay.updatedAt = new Date().toISOString();

    // Actualizar balance de cliente si correspondía
    const client = this.clients.find((c) => c.id === pay.clientId);
    if (client) {
      client.outstandingBalance = Math.max(0, client.outstandingBalance - pay.amount);
      if (client.outstandingBalance === 0) {
        client.paymentStatus = "al_dia";
      }
    }

    this.persistPayments();
    this.persistClients();
    return { ...pay };
  }

  // GENERADOR DE MENSAJE PROFESIONAL DE WHATSAPP PARA RECIBOS
  generateWhatsAppReceiptData(payment: PaymentRecord): {
    text: string;
    phone: string;
    waUrl: string;
    webUrl: string;
  } {
    const client = this.clients.find((c) => c.id === payment.clientId);
    let rawPhone = (payment.clientPhone || client?.phone || "").replace(/[^0-9]/g, "");

    // Si el número colombiano tiene 10 dígitos y empieza por 3 (ej: 3124589012), anteponer 57
    if (rawPhone.length === 10 && rawPhone.startsWith("3")) {
      rawPhone = "57" + rawPhone;
    }

    const formatCOP = (val: number) => {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(val);
    };

    let itemsText = "";
    if (payment.items && payment.items.length > 0) {
      itemsText =
        "\n📋 *Desglose de Conceptos:*\n" +
        payment.items.map((i) => ` • ${i.concept}: ${formatCOP(i.amount)}`).join("\n") +
        "\n";
    }

    const statusIcon = payment.status === "pagado" ? "✅ PAGADO" : "⏳ PENDIENTE";
    const centerTitle = (this.centerSettings.stableName || "Hacienda & Pesebreras").toUpperCase();
    const bankInfo =
      payment.bankDetails ||
      this.centerSettings.bankDetails ||
      "Bancolombia Ahorros # 108-928374-12 a nombre de Hacienda & Pesebreras SAS";

    const text =
      `🐴 *${centerTitle} - ESTADO DE CUENTA*\n` +
      `-----------------------------------------\n` +
      `Estimado(a) *${payment.clientName}*,\n\n` +
      `Le compartimos la liquidación oficial de su recibo *${payment.receiptNumber}*:\n\n` +
      `🏠 *Pesebrera:* ${payment.pesebreraCode || "Servicios Generales"}\n` +
      `🐎 *Ejemplar:* ${payment.horseName || "Sin asignar"}\n` +
      `📝 *Concepto:* ${payment.concept}\n` +
      itemsText +
      `\n💰 *Total a pagar:* ${formatCOP(payment.amount)}\n` +
      `🗓 *Fecha Límite:* ${payment.dueDate}\n` +
      `📌 *Estado:* ${statusIcon}` +
      (payment.paymentDate ? ` (${payment.paymentDate})` : "") +
      `\n\n🏦 *Datos para Transferencia:* \n${bankInfo}\n\n` +
      `_Agradecemos la confianza en el cuidado de sus ejemplares._`;

    const encoded = encodeURIComponent(text);
    return {
      text,
      phone: rawPhone,
      waUrl: rawPhone
        ? `https://api.whatsapp.com/send?phone=${rawPhone}&text=${encoded}`
        : `https://api.whatsapp.com/send?text=${encoded}`,
      webUrl: rawPhone
        ? `https://web.whatsapp.com/send?phone=${rawPhone}&text=${encoded}`
        : `https://web.whatsapp.com/send?text=${encoded}`,
    };
  }

  generateWhatsAppReceiptUrl(payment: PaymentRecord): string {
    return this.generateWhatsAppReceiptData(payment).waUrl;
  }

  // GENERADOR DE REPORTE CLÍNICO VETERINARIO PARA WHATSAPP
  generateWhatsAppVeterinaryReport(record: VeterinaryRecord): {
    text: string;
    phone: string;
    waUrl: string;
    webUrl: string;
  } {
    const horse = this.horses.find((h) => h.id === record.horseId);
    const client = this.clients.find((c) => c.id === horse?.ownerId);
    let rawPhone = (client?.phone || "").replace(/[^0-9]/g, "");
    if (rawPhone.length === 10 && rawPhone.startsWith("3")) {
      rawPhone = "57" + rawPhone;
    }

    const formatCOP = (val?: number) => {
      if (!val) return "—";
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(val);
    };

    const centerTitle = (this.centerSettings.stableName || "Hacienda & Pesebreras").toUpperCase();
    const severityMap: Record<string, string> = {
      leve: "🟢 Leve",
      moderada: "🟡 Moderada",
      grave: "🔴 Grave / Atención Prioritaria",
    };

    const text =
      `🩺 *${centerTitle} - REPORTE CLÍNICO VETERINARIO*\n` +
      `-----------------------------------------\n` +
      `Estimado(a) *${client?.fullName || horse?.ownerName || "Propietario"}*,\n\n` +
      `Le compartimos el informe de atención médica y diagnóstico para su ejemplar:\n\n` +
      `🐎 *Ejemplar:* ${record.horseName} ${horse?.pesebreraCode ? `(Pesebrera ${horse.pesebreraCode})` : ""}\n` +
      `🗓 *Fecha:* ${record.date}\n` +
      (record.completionDate ? `🏁 *Fecha Cierre:* ${record.completionDate}\n` : "") +
      `🔬 *Diagnóstico Clínico:* ${record.diagnosis || record.title}\n` +
      (record.severity ? `⚠️ *Severidad:* ${severityMap[record.severity] || record.severity}\n` : "") +
      (record.symptoms ? `🔎 *Signos / Hallazgos:* ${record.symptoms}\n` : "") +
      `💊 *Tratamiento Inicial:* ${record.title}\n` +
      (record.dosage ? `⏱️ *Posología Inicial:* ${record.dosage}\n` : "") +
      (record.route ? `💉 *Vía de Administración:* ${record.route.toUpperCase()}\n` : "") +
      (record.frequency ? `🔄 *Frecuencia:* ${record.frequency}\n` : "") +
      (record.durationDays ? `📅 *Duración:* ${record.durationDays} días\n` : "") +
      (record.stableCareInstructions ? `🌾 *Cuidados de Cuadra / Palafrenero:* ${record.stableCareInstructions}\n` : "") +
      `👨‍⚕️ *Veterinario Tratante:* ${record.administeredBy}\n` +
      `-----------------------------------------\n` +
      `📊 *ESTADO DEL CASO:* ${
        record.status === "completado"
          ? (record.medicationContinues || record.caseResolution === "medicacion_continua")
            ? "📋 TRATAMIENTO FINALIZADO CON MEDICACIÓN CONTINUA"
            : "✅ ALTA MÉDICA DEFINITIVA (CASO RESUELTO)"
          : "⏳ EN TRATAMIENTO ACTIVO"
      }\n` +
      (record.clinicalEvolutionNotes ? `📝 *Evolución y Criterio:* "${record.clinicalEvolutionNotes}"\n` : "") +
      ((record.medicationContinues || record.caseResolution === "medicacion_continua") && record.continuationGuide ? (
        `\n💊 *GUÍA DE INSTRUCCIONES / MEDICACIÓN EN BOX:*\n` +
        `• Fármaco / Indicación: *${record.continuationGuide.medicationName || record.title}*\n` +
        (record.continuationGuide.dosage ? `• Posología / Dosis: ${record.continuationGuide.dosage}\n` : "") +
        (record.continuationGuide.route ? `• Vía: ${String(record.continuationGuide.route).toUpperCase()}\n` : "") +
        (record.continuationGuide.frequency ? `• Frecuencia: ${record.continuationGuide.frequency}\n` : "") +
        (record.continuationGuide.durationDays ? `• Duración: ${record.continuationGuide.durationDays} días\n` : "") +
        (record.continuationGuide.instructions ? `• Pautas de Cuidados: ${record.continuationGuide.instructions}\n` : "") +
        (record.continuationGuide.nextCheckDate ? `• Próxima Revisión / Control: ${record.continuationGuide.nextCheckDate}\n` : "")
      ) : (record.nextDueDate ? `📌 *Próximo Control / Revisión:* ${record.nextDueDate}\n` : "")) +
      (record.isReopened ? `\n🔄 *AVISO DE REAPERTURA CLÍNICA:* Tratamiento reactivado / reabierto (${record.reopenReason || 'Seguimiento por evolución'})\n` : "") +
      (record.complications && record.complications.length > 0 ? (
        `\n⚠️ *REGISTRO DE COMPLICACIONES & FÁRMACOS DE RESCATE:*\n` +
        record.complications.map((c) => `• [${c.date}] ${c.description} -> Acción: ${c.actionTaken}${c.additionalMedication ? ` (${c.additionalMedication})` : ""}`).join("\n") + "\n"
      ) : "") +
      (record.cost ? `💰 *Valor Atención:* ${formatCOP(record.cost)}\n` : "") +
      (record.notes ? `\n📝 *Observaciones adicionales:* "${record.notes}"\n` : "") +
      `\n_Seguiremos monitoreando la evolución del ejemplar con el equipo de cuidadores y palafreneros._`;

    const encoded = encodeURIComponent(text);
    return {
      text,
      phone: rawPhone,
      waUrl: rawPhone
        ? `https://api.whatsapp.com/send?phone=${rawPhone}&text=${encoded}`
        : `https://api.whatsapp.com/send?text=${encoded}`,
      webUrl: rawPhone
        ? `https://web.whatsapp.com/send?phone=${rawPhone}&text=${encoded}`
        : `https://web.whatsapp.com/send?text=${encoded}`,
    };
  }

  generateWhatsAppVeterinaryUrl(record: VeterinaryRecord): string {
    return this.generateWhatsAppVeterinaryReport(record).waUrl;
  }

  // INVENTARIO DE ESTABLO
  getInventory(): InventoryItem[] {
    return [...this.inventory];
  }

  addInventoryItem(
    itemData: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
  ): InventoryItem {
    const now = new Date().toISOString();
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.inventory.unshift(newItem);
    this.persistInventory();
    return { ...newItem };
  }

  adjustStock(id: string, delta: number): InventoryItem | null {
    const item = this.inventory.find((i) => i.id === id);
    if (!item) return null;
    item.currentStock = Math.max(0, item.currentStock + delta);
    item.updatedAt = new Date().toISOString();
    this.persistInventory();
    return { ...item };
  }

  deleteInventoryItem(id: string): boolean {
    const initialLen = this.inventory.length;
    this.inventory = this.inventory.filter((i) => i.id !== id);
    this.persistInventory();
    return this.inventory.length < initialLen;
  }

  // CATÁLOGO Y PLANTILLAS DE CONCENTRADOS / INSUMOS
  getFeedTemplates(): FeedTemplate[] {
    return [...this.feedTemplates];
  }

  addFeedTemplate(
    templateData: Omit<FeedTemplate, "id" | "createdAt" | "updatedAt">
  ): FeedTemplate {
    const now = new Date().toISOString();
    const newTpl: FeedTemplate = {
      ...templateData,
      id: `tpl-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.feedTemplates.unshift(newTpl);
    this.persistFeedTemplates();
    return { ...newTpl };
  }

  updateFeedTemplate(
    id: string,
    updates: Partial<Omit<FeedTemplate, "id" | "createdAt">>
  ): FeedTemplate | null {
    const tpl = this.feedTemplates.find((t) => t.id === id);
    if (!tpl) return null;
    Object.assign(tpl, updates, { updatedAt: new Date().toISOString() });
    this.persistFeedTemplates();
    return { ...tpl };
  }

  deleteFeedTemplate(id: string): boolean {
    const initialLen = this.feedTemplates.length;
    this.feedTemplates = this.feedTemplates.filter((t) => t.id !== id);
    this.persistFeedTemplates();
    return this.feedTemplates.length < initialLen;
  }

  // PARÁMETROS DEL CENTRO ECUESTRE
  getCenterSettings(): CenterSettings {
    return { ...this.centerSettings };
  }

  // PLANES DE SERVICIO DEL CANON
  getCanonPlans(): CanonPlan[] {
    return [...this.canonPlans];
  }

  getCanonPlanByCode(code: string): CanonPlan | null {
    const plan = this.canonPlans.find((p) => p.code === code);
    return plan ? { ...plan } : null;
  }

  addCanonPlan(planData: Omit<CanonPlan, "id" | "createdAt" | "updatedAt">): CanonPlan {
    const now = new Date().toISOString();
    const newPlan: CanonPlan = {
      ...planData,
      id: `plan-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.canonPlans.push(newPlan);
    this.persistCanonPlans();
    return { ...newPlan };
  }

  updateCanonPlan(
    id: string,
    updates: Partial<Omit<CanonPlan, "id" | "createdAt">>
  ): CanonPlan | null {
    const plan = this.canonPlans.find((p) => p.id === id);
    if (!plan) return null;

    Object.assign(plan, updates, { updatedAt: new Date().toISOString() });
    this.persistCanonPlans();
    return { ...plan };
  }

  deleteCanonPlan(id: string): boolean {
    const idx = this.canonPlans.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.canonPlans.splice(idx, 1);
      this.persistCanonPlans();
      return true;
    }
    return false;
  }

  updateCenterSettings(settings: Partial<CenterSettings>): CenterSettings {
    this.centerSettings = { ...this.centerSettings, ...settings };
    this.persistCenterSettings();
    return { ...this.centerSettings };
  }

  // NOTIFICACIONES AL PROPIETARIO
  getOwnerNotifications(): OwnerNotification[] {
    return [...this.ownerNotifications];
  }

  addOwnerNotification(notif: OwnerNotification): OwnerNotification {
    this.ownerNotifications.unshift(notif);
    this.persistOwnerNotifications();
    return { ...notif };
  }

  markNotificationAsRead(id: string): boolean {
    const notif = this.ownerNotifications.find((n) => n.id === id);
    if (!notif) return false;
    notif.isRead = true;
    this.persistOwnerNotifications();
    return true;
  }

  // --------------------------------------------------------------------------
  // GESTIÓN DE USUARIOS Y CONTROL DE ACCESO POR ROL
  // --------------------------------------------------------------------------
  getUsers(): UserAccount[] {
    return [...this.users];
  }

  getUserById(id: string): UserAccount | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserByUsername(username: string): UserAccount | undefined {
    const clean = username.trim().toLowerCase();
    return this.users.find((u) => u.username.toLowerCase() === clean);
  }

  createUser(payload: Omit<UserAccount, "id" | "createdAt">): UserAccount {
    const cleanUsername = payload.username.trim().toLowerCase().replace(/\s+/g, "");
    if (!cleanUsername) {
      throw new Error("El nombre de usuario no puede estar vacío.");
    }
    const existing = this.getUserByUsername(cleanUsername);
    if (existing) {
      throw new Error(`El nombre de usuario '${cleanUsername}' ya se encuentra registrado.`);
    }

    const newUser: UserAccount = {
      ...payload,
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.persistUsers();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("users-updated"));
    }
    return { ...newUser };
  }

  updateUser(id: string, updates: Partial<UserAccount>): UserAccount {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw new Error(`Usuario con ID ${id} no encontrado.`);
    }

    if (updates.username) {
      const cleanUsername = updates.username.trim().toLowerCase().replace(/\s+/g, "");
      if (!cleanUsername) {
        throw new Error("El nombre de usuario no puede estar vacío.");
      }
      const existing = this.users.find(
        (u) => u.id !== id && u.username.toLowerCase() === cleanUsername
      );
      if (existing) {
        throw new Error(`El nombre de usuario '${cleanUsername}' ya está en uso.`);
      }
      updates.username = cleanUsername;
    }

    this.users[idx] = {
      ...this.users[idx],
      ...updates,
    };

    this.persistUsers();

    if (this.currentUser && this.currentUser.id === id) {
      this.currentUser = { ...this.users[idx] };
      saveToStorage("adm_current_user", this.currentUser);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("users-updated"));
    }
    return { ...this.users[idx] };
  }

  deleteUser(id: string): boolean {
    const user = this.users.find((u) => u.id === id);
    if (!user) return false;
    if (user.role === "admin") {
      const activeAdmins = this.users.filter((u) => u.role === "admin" && u.active);
      if (activeAdmins.length <= 1) {
        throw new Error("No es posible eliminar el único Administrador General activo.");
      }
    }

    this.users = this.users.filter((u) => u.id !== id);
    this.persistUsers();

    if (this.currentUser && this.currentUser.id === id) {
      this.logout();
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("users-updated"));
    }
    return true;
  }

  authenticateUser(username: string, password: string): UserAccount | null {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const user = this.users.find((u) => u.username.toLowerCase() === cleanUser);
    if (!user) return null;
    if (!user.active) return null;

    const isPassValid =
      user.password === cleanPass ||
      (user.password === "admin" && cleanPass === "admin123") ||
      (user.password === "admin123" && cleanPass === "admin") ||
      (user.password === "vet" && cleanPass === "vet123") ||
      (user.password === "vet123" && cleanPass === "vet") ||
      (user.password === "cuadras" && cleanPass === "cuadras123") ||
      (user.password === "cuadras123" && cleanPass === "cuadras") ||
      (user.password === "prop" && cleanPass === "prop123") ||
      (user.password === "prop123" && cleanPass === "prop") ||
      (user.password === "monta" && cleanPass === "monta123") ||
      (user.password === "monta123" && cleanPass === "monta") ||
      (user.password === "cuadra" && cleanPass === "cuadra123") ||
      (user.password === "cuadra123" && cleanPass === "cuadra");

    if (!isPassValid) return null;

    user.lastLogin = new Date().toISOString();
    this.persistUsers();

    this.setCurrentUser(user);
    return { ...user };
  }

  getCurrentUser(): UserAccount | null {
    if (this.currentUser) return { ...this.currentUser };
    this.currentUser = loadFromStorage<UserAccount | null>("adm_current_user", null);
    return this.currentUser ? { ...this.currentUser } : null;
  }

  setCurrentUser(user: UserAccount | null): void {
    this.currentUser = user ? { ...user } : null;
    saveToStorage("adm_current_user", this.currentUser);
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("adm_user_role", user.role);
      }
      window.dispatchEvent(new CustomEvent("user-session-changed", { detail: this.currentUser }));
    }
  }

  logout(): void {
    this.currentUser = null;
    saveToStorage("adm_current_user", null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("user-session-changed", { detail: null }));
    }
  }

  // METRICAS
  getMetrics(): DashboardMetrics {
    return calculateMetrics(
      this.pesebreras,
      this.horses,
      this.clients,
      this.payments,
      this.inventory
    );
  }
}

export const localStore = new LocalDataStore();

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.trim().length > 0 && key.trim().length > 0);
}

export const dataService = {
  isLocalMode: !isSupabaseConfigured(),
  getPesebreras: () => localStore.getPesebreras(),
  updatePesebreraStatus: (
    id: string,
    status: Pesebrera["status"],
    maintenanceInfo?: any
  ) => localStore.updatePesebreraStatus(id, status, maintenanceInfo),
  reactivateHorseInPesebrera: (boxId: string) =>
    localStore.reactivateHorseInPesebrera(boxId),
  approvePesebreraMaintenance: (
    boxId: string,
    approvalData: {
      approvedBy: string;
      notes?: string;
      targetStatus?: "auto" | "disponible" | "ocupada";
    }
  ) => localStore.approvePesebreraMaintenance(boxId, approvalData),
  addPesebreraMaintenance: (boxId: string, maintenance: any) =>
    localStore.addPesebreraMaintenance(boxId, maintenance),
  assignHorseToPesebrera: (boxId: string, horseId: string) =>
    localStore.assignHorseToPesebrera(boxId, horseId),
  moveHorseToPesebrera: (
    horseId: string,
    fromBoxId: string,
    toBoxId: string,
    notes?: string
  ) => localStore.moveHorseToPesebrera(horseId, fromBoxId, toBoxId, notes),
  releaseHorseFromCriadero: (boxId: string, notes?: string) =>
    localStore.releaseHorseFromCriadero(boxId, notes),
  getHorseFinancialSummary: (horseId: string) =>
    localStore.getHorseFinancialSummary(horseId),
  getHorses: () => localStore.getHorses(),
  getHorseById: (id: string) => localStore.getHorseById(id),
  addHorse: (horse: Omit<Horse, "id" | "createdAt" | "updatedAt">) => localStore.addHorse(horse),
  updateHorsePedigree: (horseId: string, pedigree: HorsePedigree) =>
    localStore.updateHorsePedigree(horseId, pedigree),
  addDiseaseHistoryEntry: (horseId: string, entry: Omit<DiseaseHistoryEntry, "id">) =>
    localStore.addDiseaseHistoryEntry(horseId, entry),
  updateFarrierControl: (horseId: string, farrier: FarrierControl) =>
    localStore.updateFarrierControl(horseId, farrier),
  updateHorsePhoto: (horseId: string, imageUrl: string) =>
    localStore.updateHorsePhoto(horseId, imageUrl),
  updateHorseFeedConfig: (horseId: string, feedConfig: HorseDietFeedConfig) =>
    localStore.updateHorseFeedConfig(horseId, feedConfig),
  restockHorseFeed: (
    horseId: string,
    kgAddedOrPayload: number | any,
    notes?: string,
    recordedBy?: string
  ) => localStore.restockHorseFeed(horseId, kgAddedOrPayload, notes, recordedBy),
  recordHorseDailyActivity: (
    horseId: string,
    activityData: Omit<HorseDailyActivityRecord, "id" | "completedAt">
  ) => localStore.recordHorseDailyActivity(horseId, activityData),
  updateHorseDailySchedule: (
    horseId: string,
    updates: {
      dailyPortionsCount?: number;
      scheduledForRidingToday?: boolean;
      assignedRiderName?: string;
      ridingActivityType?: string;
    }
  ) => localStore.updateHorseDailySchedule(horseId, updates),
  recordHorseRidingSession: (
    horseId: string,
    sessionData: Omit<HorseRidingSessionReport, "id" | "completedAt">
  ) => localStore.recordHorseRidingSession(horseId, sessionData),
  getClients: () => localStore.getClients(),
  addClient: (client: Omit<Client, "id" | "createdAt" | "updatedAt">) =>
    localStore.addClient(client),
  updateClient: (id: string, updates: Partial<Omit<Client, "id" | "createdAt">>) =>
    localStore.updateClient(id, updates),
  deleteClient: (id: string) => localStore.deleteClient(id),
  getVeterinaryRecords: () => localStore.getVeterinaryRecords(),
  addVeterinaryRecord: (
    record: Omit<VeterinaryRecord, "id" | "createdAt" | "updatedAt">,
    options?: {
      newHorseStatus?: HorseHealthStatus;
      chargeToOwner?: boolean;
      notifyOwner?: boolean;
    }
  ) => localStore.addVeterinaryRecord(record, options),
  updateVeterinaryRecord: (
    id: string,
    updates: Partial<Omit<VeterinaryRecord, "id" | "createdAt">>,
    options?: {
      reason?: string;
      editedBy?: string;
      newHorseStatus?: HorseHealthStatus;
      notifyOwner?: boolean;
    }
  ) => localStore.updateVeterinaryRecord(id, updates, options),
  addTreatmentComplication: (
    recordId: string,
    complication: Omit<TreatmentComplication, "id">
  ) => localStore.addTreatmentComplication(recordId, complication),
  reopenVeterinaryTreatment: (
    recordId: string,
    reason?: string,
    reopenedBy?: string
  ) => localStore.reopenVeterinaryTreatment(recordId, reason, reopenedBy),
  completeVeterinaryTreatment: (
    recordId: string,
    options?: CompleteVeterinaryTreatmentOptions
  ) => localStore.completeVeterinaryTreatment(recordId, options),
  deleteVeterinaryRecord: (id: string) => localStore.deleteVeterinaryRecord(id),
  generateWhatsAppVeterinaryReport: (record: VeterinaryRecord) =>
    localStore.generateWhatsAppVeterinaryReport(record),
  generateWhatsAppVeterinaryUrl: (record: VeterinaryRecord) =>
    localStore.generateWhatsAppVeterinaryUrl(record),
  getPayments: () => localStore.getPayments(),
  addPayment: (payment: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">) =>
    localStore.addPayment(payment),
  markPaymentAsPaid: (paymentId: string) => localStore.markPaymentAsPaid(paymentId),
  generateWhatsAppReceiptUrl: (payment: PaymentRecord) =>
    localStore.generateWhatsAppReceiptUrl(payment),
  generateWhatsAppReceiptData: (payment: PaymentRecord) =>
    localStore.generateWhatsAppReceiptData(payment),
  getInventory: () => localStore.getInventory(),
  addInventoryItem: (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) =>
    localStore.addInventoryItem(item),
  adjustStock: (id: string, delta: number) => localStore.adjustStock(id, delta),
  deleteInventoryItem: (id: string) => localStore.deleteInventoryItem(id),
  getFeedTemplates: () => localStore.getFeedTemplates(),
  addFeedTemplate: (template: Omit<FeedTemplate, "id" | "createdAt" | "updatedAt">) =>
    localStore.addFeedTemplate(template),
  updateFeedTemplate: (id: string, updates: Partial<Omit<FeedTemplate, "id" | "createdAt">>) =>
    localStore.updateFeedTemplate(id, updates),
  deleteFeedTemplate: (id: string) => localStore.deleteFeedTemplate(id),
  getCenterSettings: () => localStore.getCenterSettings(),
  updateCenterSettings: (settings: Partial<CenterSettings>) =>
    localStore.updateCenterSettings(settings),
  getCanonPlans: () => localStore.getCanonPlans(),
  getCanonPlanByCode: (code: string) => localStore.getCanonPlanByCode(code),
  addCanonPlan: (plan: Omit<CanonPlan, "id" | "createdAt" | "updatedAt">) =>
    localStore.addCanonPlan(plan),
  updateCanonPlan: (id: string, updates: Partial<Omit<CanonPlan, "id" | "createdAt">>) =>
    localStore.updateCanonPlan(id, updates),
  deleteCanonPlan: (id: string) => localStore.deleteCanonPlan(id),
  retireHorse: (payload: HorseRetirementPayload) => localStore.retireHorse(payload),
  getOwnerNotifications: () => localStore.getOwnerNotifications(),
  addOwnerNotification: (notif: OwnerNotification) => localStore.addOwnerNotification(notif),
  markNotificationAsRead: (id: string) => localStore.markNotificationAsRead(id),
  getUsers: () => localStore.getUsers(),
  getUserById: (id: string) => localStore.getUserById(id),
  getUserByUsername: (username: string) => localStore.getUserByUsername(username),
  createUser: (user: Omit<UserAccount, "id" | "createdAt">) => localStore.createUser(user),
  updateUser: (id: string, updates: Partial<UserAccount>) => localStore.updateUser(id, updates),
  deleteUser: (id: string) => localStore.deleteUser(id),
  authenticateUser: (u: string, p: string) => localStore.authenticateUser(u, p),
  getCurrentUser: () => localStore.getCurrentUser(),
  setCurrentUser: (user: UserAccount | null) => localStore.setCurrentUser(user),
  logout: () => localStore.logout(),
  getMetrics: () => localStore.getMetrics(),
  resetToDefaultData: () => localStore.resetToDefaultData(),
  getStorageStats: () => localStore.getStorageStats(),
  exportBackupData: () => localStore.exportBackupData(),
  importBackupData: (json: string) => localStore.importBackupData(json),
};


