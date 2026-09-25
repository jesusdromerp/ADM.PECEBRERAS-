/**
 * ============================================================================
 * GESTIÓN ECUESTRE - CAPA UNIFICADA DE SERVICIOS
 * ============================================================================
 * Esta capa gestiona las operaciones de datos de la plataforma.
 * Detecta automáticamente si se está en "Modo Local (Mock Data)" o si
 * Supabase está activo, garantizando desarrollo fluido y transición sin fricción.
 */

import {
  Pesebrera,
  Horse,
  Client,
  VeterinaryRecord,
  PaymentRecord,
  DashboardMetrics,
} from "@/types";
import {
  initialPesebreras,
  initialHorses,
  initialClients,
  initialVeterinaryRecords,
  initialPayments,
  calculateMetrics,
} from "./mock-data";

// Almacén en memoria para operaciones reactivas en modo local durante la sesión
class LocalDataStore {
  private pesebreras: Pesebrera[] = [...initialPesebreras];
  private horses: Horse[] = [...initialHorses];
  private clients: Client[] = [...initialClients];
  private veterinaryRecords: VeterinaryRecord[] = [...initialVeterinaryRecords];
  private payments: PaymentRecord[] = [...initialPayments];

  // PESEBRERAS
  getPesebreras(): Pesebrera[] {
    return [...this.pesebreras];
  }

  updatePesebreraStatus(id: string, status: Pesebrera["status"]): Pesebrera | null {
    const box = this.pesebreras.find((b) => b.id === id);
    if (!box) return null;
    box.status = status;
    if (status === "disponible" || status === "mantenimiento") {
      box.horseId = null;
      box.horseName = null;
    }
    box.updatedAt = new Date().toISOString();
    return { ...box };
  }

  assignHorseToPesebrera(boxId: string, horseId: string): { box: Pesebrera; horse: Horse } | null {
    const box = this.pesebreras.find((b) => b.id === boxId);
    const horse = this.horses.find((h) => h.id === horseId);
    if (!box || !horse) return null;

    // Liberar si el caballo ya tenía otra pesebrera
    if (horse.pesebreraId && horse.pesebreraId !== boxId) {
      const prevBox = this.pesebreras.find((b) => b.id === horse.pesebreraId);
      if (prevBox) {
        prevBox.status = "disponible";
        prevBox.horseId = null;
        prevBox.horseName = null;
      }
    }

    box.horseId = horse.id;
    box.horseName = horse.name;
    box.status = "ocupada";
    box.updatedAt = new Date().toISOString();

    horse.pesebreraId = box.id;
    horse.pesebreraCode = box.code;
    horse.updatedAt = new Date().toISOString();

    return { box: { ...box }, horse: { ...horse } };
  }

  // CABALLOS
  getHorses(): Horse[] {
    return [...this.horses];
  }

  addHorse(horseData: Omit<Horse, "id" | "createdAt" | "updatedAt">): Horse {
    const now = new Date().toISOString();
    const newHorse: Horse = {
      ...horseData,
      id: `horse-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.horses.unshift(newHorse);

    // Si se le asignó pesebrera de inmediato
    if (newHorse.pesebreraId) {
      const box = this.pesebreras.find((b) => b.id === newHorse.pesebreraId);
      if (box) {
        box.horseId = newHorse.id;
        box.horseName = newHorse.name;
        box.status = "ocupada";
        box.updatedAt = now;
      }
    }

    // Actualizar conteo de caballos del cliente
    const client = this.clients.find((c) => c.id === newHorse.ownerId);
    if (client) {
      client.horsesCount += 1;
    }

    return { ...newHorse };
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
    return { ...newClient };
  }

  // VETERINARIA
  getVeterinaryRecords(): VeterinaryRecord[] {
    return [...this.veterinaryRecords];
  }

  addVeterinaryRecord(
    recordData: Omit<VeterinaryRecord, "id" | "createdAt" | "updatedAt">
  ): VeterinaryRecord {
    const now = new Date().toISOString();
    const newRecord: VeterinaryRecord = {
      ...recordData,
      id: `vet-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.veterinaryRecords.unshift(newRecord);
    return { ...newRecord };
  }

  // FINANZAS
  getPayments(): PaymentRecord[] {
    return [...this.payments];
  }

  markPaymentAsPaid(paymentId: string): PaymentRecord | null {
    const pay = this.payments.find((p) => p.id === paymentId);
    if (!pay) return null;
    pay.status = "pagado";
    pay.paymentDate = new Date().toISOString().split("T")[0];
    pay.updatedAt = new Date().toISOString();
    return { ...pay };
  }

  // METRICAS
  getMetrics(): DashboardMetrics {
    return calculateMetrics(this.pesebreras, this.horses, this.clients, this.payments);
  }
}

// Instancia singleton del almacén local
export const localStore = new LocalDataStore();

// Comprobador de modo de ejecución
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.trim().length > 0 && key.trim().length > 0);
}

export const dataService = {
  isLocalMode: !isSupabaseConfigured(),
  getPesebreras: () => localStore.getPesebreras(),
  updatePesebreraStatus: (id: string, status: Pesebrera["status"]) =>
    localStore.updatePesebreraStatus(id, status),
  assignHorseToPesebrera: (boxId: string, horseId: string) =>
    localStore.assignHorseToPesebrera(boxId, horseId),
  getHorses: () => localStore.getHorses(),
  addHorse: (horse: Omit<Horse, "id" | "createdAt" | "updatedAt">) => localStore.addHorse(horse),
  getClients: () => localStore.getClients(),
  addClient: (client: Omit<Client, "id" | "createdAt" | "updatedAt">) =>
    localStore.addClient(client),
  getVeterinaryRecords: () => localStore.getVeterinaryRecords(),
  addVeterinaryRecord: (record: Omit<VeterinaryRecord, "id" | "createdAt" | "updatedAt">) =>
    localStore.addVeterinaryRecord(record),
  getPayments: () => localStore.getPayments(),
  markPaymentAsPaid: (paymentId: string) => localStore.markPaymentAsPaid(paymentId),
  getMetrics: () => localStore.getMetrics(),
};
