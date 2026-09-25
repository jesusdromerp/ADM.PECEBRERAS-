"use client";

import React, { useState, useEffect } from "react";
import { dataService } from "@/services";
import {
  Pesebrera,
  Horse,
  Client,
  VeterinaryRecord,
  PaymentRecord,
  PesebreraStatus,
  HorsePedigree,
  DiseaseHistoryEntry,
  FarrierControl,
  FeedRestockLog,
  HorseDietFeedConfig,
  InventoryItem,
  FeedTemplate,
  CenterSettings,
  CanonPlan,
  HorseRetirementPayload,
  HorseHealthStatus,
  OwnerNotification,
  MaintenanceType,
  HorseDailyActivityRecord,
  HorseRidingSessionReport,
  CompleteVeterinaryTreatmentOptions,
  TreatmentComplication,
  UserRole,
  UserAccount,
  ReleaseReason,
} from "@/types";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { PesebrerasView } from "@/components/dashboard/PesebrerasView";
import { HorsesView } from "@/components/dashboard/HorsesView";
import { ClientsView } from "@/components/dashboard/ClientsView";
import { VeterinaryView } from "@/components/dashboard/VeterinaryView";
import { FinanceView } from "@/components/dashboard/FinanceView";
import { InventoryView } from "@/components/dashboard/InventoryView";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { MontadorView } from "@/components/dashboard/MontadorView";
import { OwnerPortalView } from "@/components/dashboard/OwnerPortalView";
import { NewHorseModal } from "@/components/dashboard/NewHorseModal";
import { HorseDetailModal } from "@/components/dashboard/HorseDetailModal";
import { RetireHorseModal } from "@/components/dashboard/RetireHorseModal";
import { QuickSettingsDrawer } from "@/components/dashboard/QuickSettingsDrawer";
import { SupabaseSyncBanner } from "@/components/dashboard/SupabaseSyncBanner";
import { GlobalSearchBar } from "@/components/dashboard/GlobalSearchBar";
import { ModuleNavBar, ActiveTab } from "@/components/layout/ModuleNavBar";
import { UsersManagementModal } from "@/components/dashboard/UsersManagementModal";
import { USER_ROLES } from "@/lib/roles";
import { useMounted } from "@/hooks/use-mounted";
import {
  HeartPulse,
  Package,
  ShieldAlert,
  LogIn,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Users,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface PortalDashboardProps {
  enforcedRole?: UserRole;
  defaultTab?: ActiveTab;
}

const ROLE_ROUTES: Record<UserRole, string> = {
  admin: "/admin",
  veterinario: "/veterinario",
  mayordomo: "/mayordomo",
  propietario: "/propietario",
  montador: "/montador",
  palafrenero: "/palafrenero",
};

export function PortalDashboard({ enforcedRole, defaultTab }: PortalDashboardProps) {
  const router = useRouter();
  const mounted = useMounted();

  // Sesión de usuario actual
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    dataService.getCurrentUser()
  );

  // Estado local reactivo
  const [pesebreras, setPesebreras] = useState<Pesebrera[]>(() => dataService.getPesebreras());
  const [horses, setHorses] = useState<Horse[]>(() => dataService.getHorses());
  const [clients, setClients] = useState<Client[]>(() => dataService.getClients());
  const [vetRecords, setVetRecords] = useState<VeterinaryRecord[]>(() =>
    dataService.getVeterinaryRecords()
  );
  const [payments, setPayments] = useState<PaymentRecord[]>(() => dataService.getPayments());
  const [inventory, setInventory] = useState<InventoryItem[]>(() => dataService.getInventory());
  const [feedTemplates, setFeedTemplates] = useState<FeedTemplate[]>(() =>
    dataService.getFeedTemplates()
  );
  const [centerSettings, setCenterSettings] = useState<CenterSettings>(() =>
    dataService.getCenterSettings()
  );
  const [canonPlans, setCanonPlans] = useState<CanonPlan[]>(() =>
    dataService.getCanonPlans()
  );
  const [horseToRetire, setHorseToRetire] = useState<Horse | null>(null);
  const [ownerNotifications, setOwnerNotifications] = useState<OwnerNotification[]>(() =>
    dataService.getOwnerNotifications()
  );

  // Rol efectivo
  const initialRole: UserRole =
    enforcedRole ||
    (currentUser?.role as UserRole) ||
    (() => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("adm_user_role");
          if (saved && saved in USER_ROLES) return saved as UserRole;
        } catch {}
      }
      return "admin";
    })();

  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(initialRole);

  // Pestaña inicial según rol
  const roleConfig = USER_ROLES[enforcedRole || initialRole] || USER_ROLES.admin;
  const computedDefaultTab = (defaultTab || roleConfig.defaultTab || "resumen") as ActiveTab;
  const [activeTab, setActiveTab] = useState<ActiveTab>(computedDefaultTab);

  const [isNewHorseModalOpen, setIsNewHorseModalOpen] = useState(false);
  const [selectedHorseForDetail, setSelectedHorseForDetail] = useState<Horse | null>(null);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

  const [navLayout, setNavLayout] = useState<"top" | "sidebar">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("adm_nav_layout");
        if (saved === "sidebar" || saved === "top") return saved as "top" | "sidebar";
      } catch {}
    }
    return "top";
  });

  const effectiveNavLayout = mounted ? navLayout : "top";
  const effectiveRole = enforcedRole || (mounted ? currentUserRole : "admin");

  // Escuchar cambios de sesión
  useEffect(() => {
    const handleSessionChange = () => {
      const freshUser = dataService.getCurrentUser();
      setCurrentUser(freshUser);
      if (freshUser && !enforcedRole) {
        setCurrentUserRole(freshUser.role);
      }
    };
    window.addEventListener("user-session-changed", handleSessionChange);
    return () => window.removeEventListener("user-session-changed", handleSessionChange);
  }, [enforcedRole]);

  // Si cambia el rol forzado o el defaultTab, actualizar pestaña activa
  useEffect(() => {
    if (enforcedRole) {
      setCurrentUserRole(enforcedRole);
      const conf = USER_ROLES[enforcedRole];
      if (defaultTab && conf.allowedTabs.includes(defaultTab)) {
        setActiveTab(defaultTab);
      } else if (!conf.allowedTabs.includes(activeTab)) {
        setActiveTab(conf.defaultTab as ActiveTab);
      }
    }
  }, [enforcedRole, defaultTab]);

  const handleRoleChange = (newRole: UserRole) => {
    // Si la ruta está enforzada a un rol específico, navegar a la ruta del nuevo rol
    if (enforcedRole && enforcedRole !== newRole) {
      const targetRoute = ROLE_ROUTES[newRole] || "/admin";
      router.push(targetRoute);
      return;
    }

    setCurrentUserRole(newRole);
    if (typeof window !== "undefined") {
      localStorage.setItem("adm_user_role", newRole);
    }
    const roleConf = USER_ROLES[newRole];
    if (roleConf && !roleConf.allowedTabs.includes(activeTab)) {
      setActiveTab(roleConf.defaultTab as ActiveTab);
    }
  };

  const handleToggleNavLayout = () => {
    const next = navLayout === "top" ? "sidebar" : "top";
    setNavLayout(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("adm_nav_layout", next);
    }
  };

  // Helper para mantener sincronizado el modal de ficha técnica si está abierto
  const syncSelectedHorse = (horseId?: string) => {
    if (selectedHorseForDetail && (!horseId || selectedHorseForDetail.id === horseId)) {
      const fresh = dataService.getHorseById(selectedHorseForDetail.id);
      setSelectedHorseForDetail(fresh);
    }
  };

  // Restablecer datos locales a la demostración inicial
  const handleResetToDefaultData = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "¿Confirmas que deseas restablecer todos los datos del sistema a los valores iniciales de demostración?"
      )
    ) {
      return;
    }
    dataService.resetToDefaultData();
    setPesebreras(dataService.getPesebreras());
    setHorses(dataService.getHorses());
    setClients(dataService.getClients());
    setVetRecords(dataService.getVeterinaryRecords());
    setPayments(dataService.getPayments());
    setInventory(dataService.getInventory());
    setFeedTemplates(dataService.getFeedTemplates());
    setCenterSettings(dataService.getCenterSettings());
    setCanonPlans(dataService.getCanonPlans());
    setOwnerNotifications(dataService.getOwnerNotifications());
    setSelectedHorseForDetail(null);
    setHorseToRetire(null);
  };

  // Restaurar copia de seguridad completa desde archivo JSON
  const handleRestoreBackup = (jsonString: string) => {
    const res = dataService.importBackupData(jsonString);
    if (res.success) {
      setPesebreras(dataService.getPesebreras());
      setHorses(dataService.getHorses());
      setClients(dataService.getClients());
      setVetRecords(dataService.getVeterinaryRecords());
      setPayments(dataService.getPayments());
      setInventory(dataService.getInventory());
      setFeedTemplates(dataService.getFeedTemplates());
      setCenterSettings(dataService.getCenterSettings());
      setCanonPlans(dataService.getCanonPlans());
      setOwnerNotifications(dataService.getOwnerNotifications());
      setSelectedHorseForDetail(null);
      setHorseToRetire(null);
    }
    return res;
  };

  // Actualizar Parámetros del Centro Ecuestre
  const handleUpdateCenterSettings = (newSettings: Partial<CenterSettings>) => {
    const updated = dataService.updateCenterSettings(newSettings);
    setCenterSettings({ ...updated });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("center-settings-updated", { detail: updated }));
    }
  };

  // Handlers de Entidades
  const handleAddHorse = (newHorse: Omit<Horse, "id" | "createdAt" | "updatedAt">) => {
    const created = dataService.addHorse(newHorse);
    setHorses(dataService.getHorses());
    setPesebreras(dataService.getPesebreras());
    setPayments(dataService.getPayments());
    setClients(dataService.getClients());
    return created;
  };

  const handleUpdatePesebreraStatus = (
    id: string,
    status: PesebreraStatus,
    maintenanceInfo?: any
  ) => {
    dataService.updatePesebreraStatus(id, status, maintenanceInfo);
    setPesebreras(dataService.getPesebreras());
    setHorses(dataService.getHorses());
  };

  const handleApproveMaintenance = (
    boxId: string,
    approvalData: { approvedBy: string; notes?: string; targetStatus?: "auto" | "disponible" | "ocupada" }
  ) => {
    dataService.approvePesebreraMaintenance(boxId, approvalData);
    setPesebreras(dataService.getPesebreras());
    setHorses(dataService.getHorses());
  };

  const handleReactivateHorseInPesebrera = (boxId: string) => {
    dataService.reactivateHorseInPesebrera(boxId);
    setPesebreras(dataService.getPesebreras());
    setHorses(dataService.getHorses());
  };

  const handleAssignHorseToPesebrera = (boxId: string, horseId: string) => {
    dataService.assignHorseToPesebrera(boxId, horseId);
    setPesebreras(dataService.getPesebreras());
    setHorses(dataService.getHorses());
  };

  const handleMoveHorseToPesebrera = (
    horseId: string,
    fromBoxId: string,
    toBoxId: string,
    notes?: string
  ) => {
    dataService.moveHorseToPesebrera(horseId, fromBoxId, toBoxId, notes);
    setPesebreras(dataService.getPesebreras());
    setHorses(dataService.getHorses());
    syncSelectedHorse(horseId);
  };

  const handleReleaseHorseFromCriadero = (payload: {
    boxId: string;
    horseId: string;
    action: ReleaseReason;
    targetBoxId?: string;
    notes?: string;
    allowWithDebt?: boolean;
  }) => {
    if (payload.action === "cambio_pesebrera" && payload.targetBoxId) {
      dataService.moveHorseToPesebrera(payload.horseId, payload.boxId, payload.targetBoxId, payload.notes);
    } else {
      dataService.releaseHorseFromCriadero(payload.boxId, payload.notes);
    }
    setPesebreras(dataService.getPesebreras());
    setHorses(dataService.getHorses());
    setClients(dataService.getClients());
    syncSelectedHorse();
  };

  const handleAddClient = (newClient: Omit<Client, "id" | "createdAt" | "updatedAt">) => {
    const created = dataService.addClient(newClient);
    setClients(dataService.getClients());
    return created;
  };

  const handleUpdateClient = (
    id: string,
    updates: Partial<Omit<Client, "id" | "createdAt">>
  ) => {
    dataService.updateClient(id, updates);
    setClients(dataService.getClients());
  };

  const handleDeleteClient = (id: string) => {
    dataService.deleteClient(id);
    setClients(dataService.getClients());
  };

  const handleAddVeterinaryRecord = (
    newRec: Omit<VeterinaryRecord, "id" | "createdAt" | "updatedAt">,
    options?: {
      newHorseStatus?: HorseHealthStatus;
      chargeToOwner?: boolean;
      notifyOwner?: boolean;
    }
  ) => {
    dataService.addVeterinaryRecord(newRec, options);
    setVetRecords(dataService.getVeterinaryRecords());
    setHorses(dataService.getHorses());
    setPayments(dataService.getPayments());
    setClients(dataService.getClients());
    setOwnerNotifications(dataService.getOwnerNotifications());
    syncSelectedHorse(newRec.horseId);
  };

  const handleUpdateVeterinaryRecord = (
    id: string,
    updates: Partial<Omit<VeterinaryRecord, "id" | "createdAt">>,
    options?: {
      reason?: string;
      editedBy?: string;
      newHorseStatus?: HorseHealthStatus;
      notifyOwner?: boolean;
    }
  ) => {
    dataService.updateVeterinaryRecord(id, updates, options);
    setVetRecords(dataService.getVeterinaryRecords());
    setHorses(dataService.getHorses());
    setOwnerNotifications(dataService.getOwnerNotifications());
    syncSelectedHorse();
  };

  const handleAddTreatmentComplication = (
    recordId: string,
    complication: Omit<TreatmentComplication, "id">
  ) => {
    dataService.addTreatmentComplication(recordId, complication);
    setVetRecords(dataService.getVeterinaryRecords());
    setHorses(dataService.getHorses());
    setPayments(dataService.getPayments());
    setClients(dataService.getClients());
    setOwnerNotifications(dataService.getOwnerNotifications());
    syncSelectedHorse();
  };

  const handleReopenVeterinaryTreatment = (
    recordId: string,
    reason?: string,
    reopenedBy?: string
  ) => {
    dataService.reopenVeterinaryTreatment(recordId, reason, reopenedBy);
    setVetRecords(dataService.getVeterinaryRecords());
    setHorses(dataService.getHorses());
    syncSelectedHorse();
  };

  const handleCompleteVeterinaryTreatment = (
    recordId: string,
    options?: CompleteVeterinaryTreatmentOptions
  ) => {
    dataService.completeVeterinaryTreatment(recordId, options);
    setVetRecords(dataService.getVeterinaryRecords());
    setHorses(dataService.getHorses());
    setOwnerNotifications(dataService.getOwnerNotifications());
    syncSelectedHorse();
  };

  const handleDeleteVeterinaryRecord = (id: string) => {
    dataService.deleteVeterinaryRecord(id);
    setVetRecords(dataService.getVeterinaryRecords());
    setHorses(dataService.getHorses());
    syncSelectedHorse();
  };

  const handleAddPayment = (
    newPayment: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">
  ) => {
    dataService.addPayment(newPayment);
    setPayments(dataService.getPayments());
    setClients(dataService.getClients());
  };

  const handleMarkPaymentAsPaid = (paymentId: string) => {
    dataService.markPaymentAsPaid(paymentId);
    setPayments(dataService.getPayments());
    setClients(dataService.getClients());
  };

  const handleAddInventoryItem = (
    newItem: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
  ) => {
    dataService.addInventoryItem(newItem);
    setInventory(dataService.getInventory());
  };

  const handleAdjustStock = (id: string, delta: number) => {
    dataService.adjustStock(id, delta);
    setInventory(dataService.getInventory());
  };

  const handleDeleteInventoryItem = (id: string) => {
    dataService.deleteInventoryItem(id);
    setInventory(dataService.getInventory());
  };

  const handleAddFeedTemplate = (
    newTpl: Omit<FeedTemplate, "id" | "createdAt" | "updatedAt">
  ) => {
    dataService.addFeedTemplate(newTpl);
    setFeedTemplates(dataService.getFeedTemplates());
  };

  const handleUpdateFeedTemplate = (
    id: string,
    updates: Partial<Omit<FeedTemplate, "id" | "createdAt">>
  ) => {
    dataService.updateFeedTemplate(id, updates);
    setFeedTemplates(dataService.getFeedTemplates());
  };

  const handleDeleteFeedTemplate = (id: string) => {
    dataService.deleteFeedTemplate(id);
    setFeedTemplates(dataService.getFeedTemplates());
  };

  const handleUpdatePedigree = (horseId: string, pedigree: HorsePedigree) => {
    dataService.updateHorsePedigree(horseId, pedigree);
    setHorses(dataService.getHorses());
    syncSelectedHorse(horseId);
  };

  const handleAddDisease = (horseId: string, entry: Omit<DiseaseHistoryEntry, "id">) => {
    dataService.addDiseaseHistoryEntry(horseId, entry);
    setHorses(dataService.getHorses());
    syncSelectedHorse(horseId);
  };

  const handleUpdateFarrier = (horseId: string, farrier: FarrierControl) => {
    dataService.updateFarrierControl(horseId, farrier);
    setHorses(dataService.getHorses());
    syncSelectedHorse(horseId);
  };

  const handleUpdatePhoto = (horseId: string, imageUrl: string) => {
    dataService.updateHorsePhoto(horseId, imageUrl);
    setHorses(dataService.getHorses());
    syncSelectedHorse(horseId);
  };

  const handleRestockFeed = (
    horseId: string,
    kgAdded: number,
    notes?: string,
    recordedBy?: string
  ) => {
    dataService.restockHorseFeed(horseId, kgAdded, notes, recordedBy);
    setHorses(dataService.getHorses());
    syncSelectedHorse(horseId);
  };

  const handleUpdateFeedConfig = (horseId: string, feedConfig: HorseDietFeedConfig) => {
    dataService.updateHorseFeedConfig(horseId, feedConfig);
    setHorses(dataService.getHorses());
    syncSelectedHorse(horseId);
  };

  const handleRecordDailyActivity = (
    horseId: string,
    activityData: Omit<HorseDailyActivityRecord, "id" | "completedAt">
  ) => {
    const res = dataService.recordHorseDailyActivity(horseId, activityData);
    setHorses(dataService.getHorses());
    syncSelectedHorse(horseId);
    return res;
  };

  const handleUpdateDailySchedule = (
    horseId: string,
    updates: {
      dailyPortionsCount?: number;
      scheduledForRidingToday?: boolean;
      assignedRiderName?: string;
      ridingActivityType?: string;
    }
  ) => {
    const res = dataService.updateHorseDailySchedule(horseId, updates);
    setHorses(dataService.getHorses());
    syncSelectedHorse(horseId);
    return res;
  };

  const handleRecordRidingSession = (
    horseId: string,
    sessionData: Omit<HorseRidingSessionReport, "id" | "completedAt">
  ) => {
    const res = dataService.recordHorseRidingSession(horseId, sessionData);
    setHorses(dataService.getHorses());
    syncSelectedHorse(horseId);
    return res;
  };

  const handleSupplyEmergencyFeed = (
    horseId: string,
    rationCostCOP: number,
    dailyKg: number
  ) => {
    const horse = horses.find((h) => h.id === horseId);
    if (!horse) return;

    dataService.restockHorseFeed(
      horseId,
      dailyKg,
      `Ración de emergencia suministrada en cuadras.`,
      "Cuadras / Palafrenero"
    );

    const now = new Date().toISOString();

    dataService.addPayment({
      receiptNumber: `EMERG-${Date.now().toString().slice(-6)}`,
      clientId: horse.ownerId,
      clientName: horse.ownerName,
      horseId: horse.id,
      horseName: horse.name,
      category: "alimentacion",
      concept: `Cargo por ración extra de emergencia (${dailyKg} kg)`,
      amount: rationCostCOP,
      dueDate: now.split("T")[0],
      status: "pendiente",
    });

    setHorses(dataService.getHorses());
    setPayments(dataService.getPayments());
    setClients(dataService.getClients());
    syncSelectedHorse(horseId);
  };

  const handleRetireHorse = (payload: HorseRetirementPayload) => {
    dataService.retireHorse(payload);
    setHorses(dataService.getHorses());
    setPesebreras(dataService.getPesebreras());
    setHorseToRetire(null);
    syncSelectedHorse(payload.horseId);
  };

  // Cálculo de Métricas reactivas
  const metrics = dataService.getMetrics();
  const availableBoxes = pesebreras.filter((b) => b.status === "disponible");

  // VALIDACIÓN DE ACCESO EN RUTAS FORZADAS / DEDICADAS
  if (enforcedRole && mounted) {
    const isAuthorized =
      !currentUser || currentUser.role === enforcedRole || currentUser.role === "admin";

    if (!isAuthorized && currentUser) {
      const userRoleDef = USER_ROLES[currentUser.role];
      const enforcedRoleDef = USER_ROLES[enforcedRole];
      const correctRoute = ROLE_ROUTES[currentUser.role] || "/admin";

      return (
        <div className="min-h-[75vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mx-auto text-3xl">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block mb-1">
                Acceso Restringido a Ruta
              </span>
              <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">
                Ruta exclusiva de {enforcedRoleDef.title}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                Has iniciado sesión como{" "}
                <strong className="text-stone-800 dark:text-stone-200">
                  {currentUser.name} ({userRoleDef.title})
                </strong>
                . Tu cuenta no cuenta con permisos para operar directamente en esta ruta.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <Link
                href={correctRoute}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <span>Ir a mi panel asignado ({userRoleDef.badge})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  dataService.logout();
                  router.push(`/login?redirect=/${enforcedRole}`);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs transition-colors"
              >
                Iniciar sesión con otra cuenta
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  const renderActiveView = () => (
    <>
      {activeTab === "resumen" && (
        <div className="space-y-8">
          <StatsCards metrics={metrics} />

          {metrics.lowStockItemsCount > 0 && (
            <div
              onClick={() => setActiveTab("inventario")}
              className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-amber-100/70 transition-all shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-amber-900 dark:text-amber-200 text-sm">
                    Alerta de Abastecimiento: {metrics.lowStockItemsCount} insumos con stock mínimo
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Revisa alimentos, forrajes y fármacos antes de que se agoten en bodega.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 whitespace-nowrap hidden sm:inline">
                Ver Inventario &rarr;
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/90 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                    Estado Actual de Pesebreras
                  </h3>
                  <p className="text-xs text-stone-500">
                    {metrics.occupiedBoxes} ocupadas, {metrics.availableBoxes} listas para recibir equinos
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("pesebreras")}
                  className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Ver todas &rarr;
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                {pesebreras.slice(0, 10).map((box) => (
                  <div
                    key={box.id}
                    onClick={() => {
                      if (box.horseId) {
                        const h = horses.find((item) => item.id === box.horseId);
                        if (h) setSelectedHorseForDetail(h);
                        else setActiveTab("pesebreras");
                      } else {
                        setActiveTab("pesebreras");
                      }
                    }}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer hover:scale-[1.02] ${
                      box.status === "disponible"
                        ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50"
                        : box.status === "ocupada"
                        ? "bg-stone-50 dark:bg-stone-800/40 border-stone-200/90 dark:border-stone-700"
                        : "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50"
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold block text-stone-500">
                      {box.code}
                    </span>
                    <span className="font-extrabold text-[11px] text-stone-900 dark:text-stone-100 truncate block mt-0.5">
                      {box.status === "ocupada" ? box.horseName : "Disponible"}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-bold tracking-wider inline-block mt-1 px-1.5 py-0.2 rounded ${
                        box.status === "disponible"
                          ? "text-emerald-800 dark:text-emerald-400"
                          : box.status === "ocupada"
                          ? "text-sky-700 dark:text-sky-400"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {box.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/90 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                  Alertas Sanitarias
                </h3>
                <button
                  onClick={() => setActiveTab("sanidad")}
                  className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Historial &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {vetRecords.slice(0, 3).map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => setActiveTab("sanidad")}
                    className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800 text-xs space-y-1 cursor-pointer hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-stone-900 dark:text-stone-100">
                        {rec.horseName}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          rec.status === "en_curso"
                            ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400"
                        }`}
                      >
                        {rec.status === "en_curso" ? "En curso" : "Completado"}
                      </span>
                    </div>
                    <p className="text-stone-600 dark:text-stone-400 line-clamp-1">{rec.title}</p>
                    <span className="text-[10px] text-stone-400 block">{rec.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "pesebreras" && (
        <PesebrerasView
          pesebreras={pesebreras}
          horses={horses}
          payments={payments}
          onStatusChange={handleUpdatePesebreraStatus}
          onApproveMaintenance={handleApproveMaintenance}
          onReactivateHorse={handleReactivateHorseInPesebrera}
          onReleaseHorse={handleReleaseHorseFromCriadero}
          onSelectHorse={(id) => syncSelectedHorse(id)}
        />
      )}

      {activeTab === "caballos" && (
        <HorsesView
          horses={horses}
          onSelectHorse={(h) => setSelectedHorseForDetail(h)}
          onOpenNewHorseModal={() => setIsNewHorseModalOpen(true)}
          currentUserRole={effectiveRole}
        />
      )}

      {activeTab === "propietarios" && (
        <ClientsView
          clients={clients}
          horses={horses}
          onSelectHorse={(h) => setSelectedHorseForDetail(h)}
        />
      )}

      {activeTab === "sanidad" && (
        <VeterinaryView
          records={vetRecords}
          horses={horses}
          clients={clients}
          onAddRecord={handleAddVeterinaryRecord}
          onUpdateRecord={handleUpdateVeterinaryRecord}
          onAddComplication={handleAddTreatmentComplication}
          onReopenTreatment={handleReopenVeterinaryTreatment}
          onCompleteTreatment={handleCompleteVeterinaryTreatment}
          onDeleteRecord={handleDeleteVeterinaryRecord}
          onSelectHorse={(h) => setSelectedHorseForDetail(h)}
        />
      )}

      {activeTab === "finanzas" && (
        <FinanceView
          payments={payments}
          onMarkAsPaid={handleMarkPaymentAsPaid}
        />
      )}

      {activeTab === "inventario" && (
        <InventoryView
          inventory={inventory}
          feedTemplates={feedTemplates}
          centerSettings={centerSettings}
          onAdjustStock={handleAdjustStock}
          onAddItem={handleAddInventoryItem}
        />
      )}

      {activeTab === "ajustes" && (
        <SettingsView
          clients={clients}
          feedTemplates={feedTemplates}
          centerSettings={centerSettings}
          canonPlans={canonPlans}
          onAddClient={handleAddClient}
          onUpdateClient={handleUpdateClient}
          onDeleteClient={handleDeleteClient}
          onAddFeedTemplate={handleAddFeedTemplate}
          onUpdateFeedTemplate={handleUpdateFeedTemplate}
          onDeleteFeedTemplate={handleDeleteFeedTemplate}
          onUpdateCenterSettings={handleUpdateCenterSettings}
          onResetAllData={handleResetToDefaultData}
          onOpenUsersManagement={() => setIsUsersModalOpen(true)}
        />
      )}

      {activeTab === "operativo_montador" && (
        <MontadorView
          horses={horses}
          pesebreras={pesebreras}
          clients={clients}
          currentUserRole={effectiveRole}
          onRecordDailyActivity={handleRecordDailyActivity}
          onUpdateHorseDailySchedule={handleUpdateDailySchedule}
          onRecordRidingSession={handleRecordRidingSession}
          onSelectHorse={(h) => setSelectedHorseForDetail(h)}
        />
      )}

      {activeTab === "portal_propietario" && (
        <OwnerPortalView
          clients={clients}
          horses={horses}
          pesebreras={pesebreras}
          payments={payments}
          canonPlans={canonPlans}
          centerSettings={centerSettings}
          notifications={ownerNotifications}
          onSelectHorse={(h) => setSelectedHorseForDetail(h)}
          initialClientId={currentUser?.linkedClientId}
          hideClientSelector={Boolean(currentUser?.linkedClientId)}
        />
      )}
    </>
  );

  const currentRoleConfig = USER_ROLES[effectiveRole] || USER_ROLES.admin;

  return (
    <div className="space-y-6">
      {/* Barra Informativa de la Ruta Dedicada si está forzada */}
      {enforcedRole && (
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-3.5 sm:p-4 rounded-3xl border border-stone-800 shadow-md flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-2xl bg-stone-800 shadow-inner">
              {currentRoleConfig.emoji}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Ruta de Acceso Dedicada: {ROLE_ROUTES[enforcedRole]}
                </span>
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${currentRoleConfig.color}`}
                >
                  {currentRoleConfig.badge}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-stone-100">
                Portal Especializado: {currentRoleConfig.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser?.role === "admin" && (
              <button
                type="button"
                onClick={() => setIsUsersModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Administrar usuarios y rutas de acceso"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gestión de Cuentas</span>
              </button>
            )}

            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 text-xs font-bold border border-stone-700 transition-colors"
            >
              Ver todas las rutas
            </Link>
          </div>
        </div>
      )}

      {/* Barra de Búsqueda Global */}
      <GlobalSearchBar
        horses={horses}
        pesebreras={pesebreras}
        clients={clients}
        onSelectHorse={(h) => setSelectedHorseForDetail(h)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Renderizado dinámico: Barra Superior O Barra Lateral */}
      {effectiveNavLayout === "top" ? (
        <div className="space-y-6">
          <SupabaseSyncBanner
            onResetData={handleResetToDefaultData}
            onRestoreData={handleRestoreBackup}
          />
          <ModuleNavBar
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            pesebrerasCount={pesebreras.length}
            horsesCount={horses.length}
            clientsCount={clients.length}
            inventoryCount={inventory.length}
            onOpenQuickSettings={() => setIsQuickSettingsOpen(true)}
            navLayout={effectiveNavLayout}
            onToggleNavLayout={handleToggleNavLayout}
            currentUserRole={effectiveRole}
            onRoleChange={handleRoleChange}
          />
          <div className="transition-all duration-300">
            {renderActiveView()}
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 items-start relative">
          <ModuleNavBar
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            pesebrerasCount={pesebreras.length}
            horsesCount={horses.length}
            clientsCount={clients.length}
            inventoryCount={inventory.length}
            onOpenQuickSettings={() => setIsQuickSettingsOpen(true)}
            navLayout={effectiveNavLayout}
            onToggleNavLayout={handleToggleNavLayout}
            currentUserRole={effectiveRole}
            onRoleChange={handleRoleChange}
          />
          <div className="flex-1 min-w-0 transition-all duration-300 space-y-6">
            <SupabaseSyncBanner
              onResetData={handleResetToDefaultData}
              onRestoreData={handleRestoreBackup}
            />
            {renderActiveView()}
          </div>
        </div>
      )}

      {/* Modal para Registrar Nuevo Equino */}
      <NewHorseModal
        isOpen={isNewHorseModalOpen}
        onClose={() => setIsNewHorseModalOpen(false)}
        clients={clients}
        availableBoxes={availableBoxes}
        canonPlans={canonPlans}
        onAddHorse={handleAddHorse}
        onAddClient={handleAddClient}
      />

      {/* Modal de Ficha Detallada del Caballo */}
      <HorseDetailModal
        horse={selectedHorseForDetail}
        client={clients.find((c) => c.id === selectedHorseForDetail?.ownerId) || null}
        vetRecords={vetRecords}
        centerSettings={centerSettings}
        currentUserRole={effectiveRole}
        isOpen={Boolean(selectedHorseForDetail)}
        onClose={() => setSelectedHorseForDetail(null)}
        onUpdatePedigree={handleUpdatePedigree}
        onAddDisease={handleAddDisease}
        onUpdateFarrier={handleUpdateFarrier}
        onUpdatePhoto={handleUpdatePhoto}
        onRestockFeed={handleRestockFeed}
        onUpdateFeedConfig={handleUpdateFeedConfig}
        onSupplyEmergencyFeed={handleSupplyEmergencyFeed}
        onRetireHorse={
          effectiveRole === "admin"
            ? (h) => {
                setSelectedHorseForDetail(null);
                setHorseToRetire(h);
              }
            : undefined
        }
      />

      {/* Modal de Retiro / Baja de Ejemplar */}
      <RetireHorseModal
        isOpen={Boolean(horseToRetire)}
        onClose={() => setHorseToRetire(null)}
        horse={horseToRetire}
        owner={clients.find((c) => c.id === horseToRetire?.ownerId) || null}
        payments={payments}
        onConfirmRetire={handleRetireHorse}
      />

      {/* Panel Deslizante de Configuración Lateral */}
      <QuickSettingsDrawer
        isOpen={isQuickSettingsOpen}
        onClose={() => setIsQuickSettingsOpen(false)}
        centerSettings={centerSettings}
        onUpdateCenterSettings={handleUpdateCenterSettings}
        onNavigateToSettings={() => setActiveTab("ajustes")}
      />

      {/* Modal de Gestión de Usuarios y Rutas de Acceso */}
      <UsersManagementModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        clients={clients}
      />
    </div>
  );
}
