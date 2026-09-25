"use client";

import React, { useState, useEffect } from "react";
import {
  Client,
  FeedTemplate,
  InventoryCategory,
  CenterSettings,
  CanonPlan,
  CanonServiceInclusion,
} from "@/types";
import { initialCanonPlans } from "@/services/mock-data";
import { dataService } from "@/services";
import {
  Settings,
  Users,
  PackageCheck,
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Save,
  Sun,
  Moon,
  Layers,
  ShieldCheck,
  CheckCircle,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface SettingsViewProps {
  clients: Client[];
  feedTemplates: FeedTemplate[];
  centerSettings: CenterSettings;
  canonPlans?: CanonPlan[];
  onAddClient: (client: Omit<Client, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateClient: (id: string, updates: Partial<Omit<Client, "id" | "createdAt">>) => void;
  onDeleteClient: (id: string) => void;
  onAddFeedTemplate: (tpl: Omit<FeedTemplate, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateFeedTemplate: (id: string, updates: Partial<Omit<FeedTemplate, "id" | "createdAt">>) => void;
  onDeleteFeedTemplate: (id: string) => void;
  onUpdateCenterSettings: (settings: Partial<CenterSettings>) => void;
  onAddCanonPlan?: (plan: Omit<CanonPlan, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateCanonPlan?: (id: string, updates: Partial<Omit<CanonPlan, "id" | "createdAt">>) => void;
  onDeleteCanonPlan?: (id: string) => void;
  onRestoreBackup?: (jsonString: string) => { success: boolean; message: string };
  onResetAllData?: () => void;
  onOpenUsersManagement?: () => void;
}

export function SettingsView({
  clients,
  feedTemplates,
  centerSettings,
  canonPlans = [],
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onAddFeedTemplate,
  onUpdateFeedTemplate,
  onDeleteFeedTemplate,
  onUpdateCenterSettings,
  onAddCanonPlan,
  onUpdateCanonPlan,
  onDeleteCanonPlan,
  onRestoreBackup,
  onResetAllData,
  onOpenUsersManagement,
}: SettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "establo" | "canones" | "propietarios" | "concentrados" | "apariencia" | "respaldo"
  >("canones");

  // Estado para Modal de Planes de Canon
  const [isCanonPlanModalOpen, setIsCanonPlanModalOpen] = useState(false);
  const [editingCanonPlan, setEditingCanonPlan] = useState<CanonPlan | null>(null);
  const [planCode, setPlanCode] = useState("");
  const [planName, setPlanName] = useState("");
  const [planTagline, setPlanTagline] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [planPrice, setPlanPrice] = useState<number | "">(1000000);
  const [planInclusions, setPlanInclusions] = useState<CanonServiceInclusion[]>([]);
  const [newInclusionName, setNewInclusionName] = useState("");
  const [quickServiceInput, setQuickServiceInput] = useState<{ [planId: string]: string }>({});
  const [quickServiceCost, setQuickServiceCost] = useState<{ [planId: string]: number }>({});
  const [selectedPlanForDetail, setSelectedPlanForDetail] = useState<CanonPlan | null>(null);

  // Filtros de búsqueda
  const [clientSearch, setClientSearch] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");

  // Modales
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FeedTemplate | null>(null);

  // Formulario Propietario
  const [clientFullName, setClientFullName] = useState("");
  const [clientIdentification, setClientIdentification] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPaymentStatus, setClientPaymentStatus] = useState<"al_dia" | "pendiente" | "mora">("al_dia");
  const [clientOutstandingBalance, setClientOutstandingBalance] = useState(0);

  // Formulario Concentrado / Plantilla
  const [tplName, setTplName] = useState("");
  const [tplBrand, setTplBrand] = useState("");
  const [tplCategory, setTplCategory] = useState<InventoryCategory>("alimento");
  const [tplUnit, setTplUnit] = useState("Bultos (40kg)");
  const [tplMinStock, setTplMinStock] = useState(6);
  const [tplCost, setTplCost] = useState(130000);
  const [tplLocation, setTplLocation] = useState("Bodega Principal de Alimentos");
  const [tplSupplier, setTplSupplier] = useState("Distribuidora Italcol");
  const [tplNotes, setTplNotes] = useState("");

  // Formulario Parámetros del Centro Ecuestre
  const [stableName, setStableName] = useState(centerSettings.stableName);
  const [tagline, setTagline] = useState(centerSettings.tagline || "");
  const [location, setLocation] = useState(centerSettings.location);
  const [nit, setNit] = useState(centerSettings.nit);
  const [contactPhone, setContactPhone] = useState(centerSettings.contactPhone || "");
  const [veterinarianName, setVeterinarianName] = useState(centerSettings.veterinarianName);
  const [veterinarianLicense, setVeterinarianLicense] = useState(centerSettings.veterinarianLicense);
  const [veterinarianSpecialty, setVeterinarianSpecialty] = useState(
    centerSettings.veterinarianSpecialty
  );
  const [bankDetails, setBankDetails] = useState(centerSettings.bankDetails);
  const [defaultEmergencyRationCostCOP, setDefaultEmergencyRationCostCOP] = useState<number | "">(
    centerSettings.defaultEmergencyRationCostCOP || 25000
  );
  const [centerSaveSuccess, setCenterSaveSuccess] = useState(false);

  // Estado para Respaldo y Restauración de Base de Datos
  const [backupStatus, setBackupStatus] = useState<{ success: boolean; message: string } | null>(null);
  const backupFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDownloadBackup = () => {
    try {
      const json = dataService.exportBackupData();
      const dateStr = new Date().toISOString().slice(0, 10);
      const timeStr = new Date().toTimeString().slice(0, 5).replace(":", "");
      const fileName = `respaldo_criadero_${dateStr}_${timeStr}.json`;
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al exportar copia de seguridad: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleBackupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      if (
        !window.confirm(
          `¿Confirmas que deseas restaurar la base de datos desde el archivo "${file.name}"?\nEsta acción actualizará todos los registros del criadero.`
        )
      ) {
        if (backupFileInputRef.current) backupFileInputRef.current.value = "";
        return;
      }

      if (onRestoreBackup) {
        const res = onRestoreBackup(content);
        setBackupStatus(res);
        setTimeout(() => setBackupStatus(null), 6000);
      } else {
        const res = dataService.importBackupData(content);
        setBackupStatus(res);
        setTimeout(() => setBackupStatus(null), 6000);
      }
      if (backupFileInputRef.current) backupFileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    setStableName(centerSettings.stableName);
    setTagline(centerSettings.tagline || "");
    setLocation(centerSettings.location);
    setNit(centerSettings.nit);
    setContactPhone(centerSettings.contactPhone || "");
    setVeterinarianName(centerSettings.veterinarianName);
    setVeterinarianLicense(centerSettings.veterinarianLicense);
    setVeterinarianSpecialty(centerSettings.veterinarianSpecialty);
    setBankDetails(centerSettings.bankDetails);
    setDefaultEmergencyRationCostCOP(centerSettings.defaultEmergencyRationCostCOP || 25000);
  }, [centerSettings]);

  const handleSaveCenterSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCenterSettings({
      stableName: stableName.trim(),
      tagline: tagline.trim() || undefined,
      location: location.trim(),
      nit: nit.trim(),
      contactPhone: contactPhone.trim() || undefined,
      veterinarianName: veterinarianName.trim(),
      veterinarianLicense: veterinarianLicense.trim(),
      veterinarianSpecialty: veterinarianSpecialty.trim(),
      bankDetails: bankDetails.trim(),
      defaultEmergencyRationCostCOP: defaultEmergencyRationCostCOP
        ? Number(defaultEmergencyRationCostCOP)
        : 25000,
    });
    setCenterSaveSuccess(true);
    setTimeout(() => setCenterSaveSuccess(false), 5000);
  };

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Abrir modal para crear o editar cliente
  const openClientModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setClientFullName(client.fullName);
      setClientIdentification(client.identification);
      setClientPhone(client.phone);
      setClientEmail(client.email);
      setClientAddress(client.address || "");
      setClientPaymentStatus(client.paymentStatus);
      setClientOutstandingBalance(client.outstandingBalance || 0);
    } else {
      setEditingClient(null);
      setClientFullName("");
      setClientIdentification("");
      setClientPhone("+57 ");
      setClientEmail("");
      setClientAddress("");
      setClientPaymentStatus("al_dia");
      setClientOutstandingBalance(0);
    }
    setIsClientModalOpen(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientFullName.trim()) return;

    if (editingClient) {
      onUpdateClient(editingClient.id, {
        fullName: clientFullName.trim(),
        identification: clientIdentification.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        address: clientAddress.trim() || undefined,
        paymentStatus: clientPaymentStatus,
        outstandingBalance: Number(clientOutstandingBalance),
      });
    } else {
      onAddClient({
        fullName: clientFullName.trim(),
        identification: clientIdentification.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        address: clientAddress.trim() || undefined,
        horsesCount: 0,
        paymentStatus: clientPaymentStatus,
        outstandingBalance: Number(clientOutstandingBalance),
      });
    }

    setIsClientModalOpen(false);
  };

  // Abrir modal para crear o editar plantilla de concentrado
  const openTemplateModal = (tpl?: FeedTemplate) => {
    if (tpl) {
      setEditingTemplate(tpl);
      setTplName(tpl.name);
      setTplBrand(tpl.brand);
      setTplCategory(tpl.category);
      setTplUnit(tpl.defaultUnit);
      setTplMinStock(tpl.defaultMinStockAlert);
      setTplCost(tpl.defaultCostPerUnit);
      setTplLocation(tpl.defaultLocation);
      setTplSupplier(tpl.defaultSupplier || "");
      setTplNotes(tpl.nutritionalNotes || "");
    } else {
      setEditingTemplate(null);
      setTplName("");
      setTplBrand("Italcol");
      setTplCategory("alimento");
      setTplUnit("Bultos (40kg)");
      setTplMinStock(6);
      setTplCost(130000);
      setTplLocation("Bodega Principal de Alimentos");
      setTplSupplier("Distribuidora Italcol");
      setTplNotes("");
    }
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName.trim()) return;

    if (editingTemplate) {
      onUpdateFeedTemplate(editingTemplate.id, {
        name: tplName.trim(),
        brand: tplBrand.trim(),
        category: tplCategory,
        defaultUnit: tplUnit.trim(),
        defaultMinStockAlert: Number(tplMinStock),
        defaultCostPerUnit: Number(tplCost),
        defaultLocation: tplLocation.trim(),
        defaultSupplier: tplSupplier.trim() || undefined,
        nutritionalNotes: tplNotes.trim() || undefined,
      });
    } else {
      onAddFeedTemplate({
        name: tplName.trim(),
        brand: tplBrand.trim(),
        category: tplCategory,
        defaultUnit: tplUnit.trim(),
        defaultMinStockAlert: Number(tplMinStock),
        defaultCostPerUnit: Number(tplCost),
        defaultLocation: tplLocation.trim(),
        defaultSupplier: tplSupplier.trim() || undefined,
        nutritionalNotes: tplNotes.trim() || undefined,
      });
    }

    setIsTemplateModalOpen(false);
  };

  // Abrir modal para crear o editar plan de canon
  const openCanonPlanModal = (plan?: CanonPlan) => {
    if (plan) {
      setEditingCanonPlan(plan);
      setPlanCode(plan.code);
      setPlanName(plan.name);
      setPlanTagline(plan.tagline);
      setPlanDescription(plan.description);
      setPlanPrice(plan.basePriceCOP);
      setPlanInclusions(plan.inclusions ? JSON.parse(JSON.stringify(plan.inclusions)) : []);
    } else {
      setEditingCanonPlan(null);
      setPlanCode(`TIPO_${String.fromCharCode(65 + (canonPlans?.length || 0))}`);
      setPlanName(`Pesebrera Tipo ${String.fromCharCode(65 + (canonPlans?.length || 0))}`);
      setPlanTagline("Modalidad de servicio personalizado");
      setPlanDescription("Servicio configurado según las políticas y atenciones del centro ecuestre.");
      setPlanPrice(1000000);
      setPlanInclusions([
        { id: `inc-1-${Date.now()}`, name: "Comida / Concentrado", included: true, costCOP: 350000, notes: "3 raciones diarias de alimento" },
        { id: `inc-2-${Date.now()}`, name: "Herraje Especializado", included: false, costCOP: 180000, notes: "Herraduras y nivelación periódica" },
        { id: `inc-3-${Date.now()}`, name: "Montador / Adiestrador", included: false, costCOP: 250000, notes: "Entrenamiento en picadero y pista" },
        { id: `inc-4-${Date.now()}`, name: "Agua Permanente", included: true, costCOP: 50000, notes: "Bebedero automático 24/7" },
        { id: `inc-5-${Date.now()}`, name: "Cama / Viruta Limpia", included: true, costCOP: 120000, notes: "Mantenimiento y desinfección diaria" },
        { id: `inc-6-${Date.now()}`, name: "Vitaminas & Suplementos", included: false, costCOP: 80000, notes: "Suministro de complementos" },
        { id: `inc-7-${Date.now()}`, name: "Heno / Forraje Verde", included: true, costCOP: 170000, notes: "Suministro diario de forraje" },
      ]);
    }
    setNewInclusionName("");
    setIsCanonPlanModalOpen(true);
  };

  const handleSaveCanonPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim() || !planCode.trim()) return;

    const payload = {
      code: planCode.trim().toUpperCase(),
      name: planName.trim(),
      tagline: planTagline.trim() || "Modalidad de canon de pesebrera",
      description: planDescription.trim() || "Servicio contratado de pensión equina.",
      basePriceCOP: Number(planPrice) || 1000000,
      basePlazaCOP: editingCanonPlan?.basePlazaCOP ?? 300000,
      inclusions: planInclusions,
      isActive: true,
    };

    if (editingCanonPlan) {
      if (onUpdateCanonPlan) {
        onUpdateCanonPlan(editingCanonPlan.id, payload);
      }
    } else {
      if (onAddCanonPlan) {
        onAddCanonPlan(payload);
      }
    }

    setIsCanonPlanModalOpen(false);
  };

  const calculatePlanTotal = (basePlaza: number, inclusions: CanonServiceInclusion[]) => {
    const includedTotal = inclusions
      .filter((i) => i.included)
      .reduce((sum, i) => sum + (i.costCOP || 0), 0);
    return Math.max(0, (basePlaza || 0) + includedTotal);
  };

  const handleToggleInclusionInPlan = (plan: CanonPlan, inclusionId: string) => {
    if (!onUpdateCanonPlan) return;
    const updatedInclusions = plan.inclusions.map((inc) =>
      inc.id === inclusionId ? { ...inc, included: !inc.included } : inc
    );
    const basePlaza = plan.basePlazaCOP ?? 300000;
    const newTotal = calculatePlanTotal(basePlaza, updatedInclusions);
    onUpdateCanonPlan(plan.id, {
      inclusions: updatedInclusions,
      basePriceCOP: newTotal,
      basePlazaCOP: basePlaza,
    });
  };

  const handleUpdateInclusionCost = (
    plan: CanonPlan,
    inclusionId: string,
    newCost: number
  ) => {
    if (!onUpdateCanonPlan) return;
    const cleanCost = Math.max(0, isNaN(newCost) ? 0 : newCost);
    const updatedInclusions = plan.inclusions.map((inc) =>
      inc.id === inclusionId ? { ...inc, costCOP: cleanCost } : inc
    );
    const basePlaza = plan.basePlazaCOP ?? 300000;
    const newTotal = calculatePlanTotal(basePlaza, updatedInclusions);
    onUpdateCanonPlan(plan.id, {
      inclusions: updatedInclusions,
      basePriceCOP: newTotal,
      basePlazaCOP: basePlaza,
    });
  };

  const handleUpdateBasePlaza = (plan: CanonPlan, newBasePlaza: number) => {
    if (!onUpdateCanonPlan) return;
    const cleanBase = Math.max(0, isNaN(newBasePlaza) ? 0 : newBasePlaza);
    const newTotal = calculatePlanTotal(cleanBase, plan.inclusions);
    onUpdateCanonPlan(plan.id, {
      basePlazaCOP: cleanBase,
      basePriceCOP: newTotal,
    });
  };

  const handleQuickAddInclusion = (
    plan: CanonPlan,
    serviceName: string,
    cost: number = 100000
  ) => {
    if (!onUpdateCanonPlan || !serviceName.trim()) return;
    const newInc: CanonServiceInclusion = {
      id: `inc-${Date.now()}`,
      name: serviceName.trim(),
      included: true,
      costCOP: cost,
      notes: "A cargo del criadero",
    };
    const updatedInclusions = [...plan.inclusions, newInc];
    const basePlaza = plan.basePlazaCOP ?? 300000;
    const newTotal = calculatePlanTotal(basePlaza, updatedInclusions);
    onUpdateCanonPlan(plan.id, {
      inclusions: updatedInclusions,
      basePriceCOP: newTotal,
      basePlazaCOP: basePlaza,
    });
  };

  const handleRemoveInclusionFromPlan = (plan: CanonPlan, inclusionId: string) => {
    if (!onUpdateCanonPlan) return;
    const updatedInclusions = plan.inclusions.filter((inc) => inc.id !== inclusionId);
    const basePlaza = plan.basePlazaCOP ?? 300000;
    const newTotal = calculatePlanTotal(basePlaza, updatedInclusions);
    onUpdateCanonPlan(plan.id, {
      inclusions: updatedInclusions,
      basePriceCOP: newTotal,
      basePlazaCOP: basePlaza,
    });
  };

  const plansToRender = canonPlans && canonPlans.length > 0 ? canonPlans : initialCanonPlans;
  const activeModalPlan = selectedPlanForDetail
    ? plansToRender.find((p) => p.id === selectedPlanForDetail.id) || selectedPlanForDetail
    : null;

  const filteredClients = clients.filter(
    (c) =>
      c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.identification.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredTemplates = feedTemplates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.brand.toLowerCase().includes(templateSearch.toLowerCase()) ||
      (t.defaultSupplier && t.defaultSupplier.toLowerCase().includes(templateSearch.toLowerCase()));

    const matchesCat = categoryFilter === "todas" || t.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const getCategoryBadge = (cat: InventoryCategory) => {
    const map = {
      alimento: { label: "Alimento / Concentrado", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300" },
      heno: { label: "Heno / Forraje", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300" },
      cama: { label: "Cama / Viruta", color: "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300" },
      medicamento: { label: "Fármaco / Botiquín", color: "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300" },
      suplemento: { label: "Suplemento", color: "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300" },
    };
    const c = map[cat];
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.color}`}>{c.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Panel de Ajustes */}
      <div className="bg-gradient-to-r from-emerald-900 via-stone-900 to-stone-950 p-6 rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Configuración del Sistema Ecuestre</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Panel de Ajustes y Catálogos</h2>
          <p className="text-xs text-stone-300 max-w-xl mt-1">
            Administra los datos de propietarios, configura las marcas de concentrados para autocompletar la llegada de inventario y personaliza los parámetros de tu pesebrera.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === "propietarios" && (
            <Button
              onClick={() => openClientModal()}
              size="sm"
              className="gap-1.5 cursor-pointer text-xs"
            >
              <Plus className="w-4 h-4" />
              Nuevo Propietario
            </Button>
          )}

          {activeSubTab === "concentrados" && (
            <Button
              onClick={() => openTemplateModal()}
              size="sm"
              className="gap-1.5 cursor-pointer text-xs"
            >
              <Plus className="w-4 h-4" />
              Crear Concentrado
            </Button>
          )}

          {activeSubTab === "canones" && (
            <Button
              onClick={() => openCanonPlanModal()}
              size="sm"
              className="gap-1.5 cursor-pointer text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Nueva Modalidad
            </Button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* DISEÑO LATERAL: CONFIGURACIONES EN UN LADO DE LA PANTALLA */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PANEL LATERAL DE CONFIGURACIÓN (Lado izquierdo, 3 columnas) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-3 sm:p-4 border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 px-3 py-1 block">
              Menú de Configuración
            </span>

            {/* Subpestaña 1: Servicio del Canon (Tipo A, B, C) */}
            <button
              onClick={() => setActiveSubTab("canones")}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                activeSubTab === "canones"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "hover:bg-stone-100 dark:hover:bg-stone-800/80 text-stone-700 dark:text-stone-300"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Layers className="w-4 h-4 flex-shrink-0" />
                <span className="font-bold text-xs truncate">Servicio del Canon</span>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeSubTab === "canones"
                    ? "bg-emerald-700 text-white"
                    : "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300"
                }`}
              >
                Tipo A, B, C
              </span>
            </button>

            {/* Subpestaña 2: Parámetros del Centro Ecuestre */}
            <button
              onClick={() => setActiveSubTab("establo")}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                activeSubTab === "establo"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "hover:bg-stone-100 dark:hover:bg-stone-800/80 text-stone-700 dark:text-stone-300"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span className="font-bold text-xs truncate">Parámetros del Criadero</span>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeSubTab === "establo"
                    ? "bg-emerald-700 text-white"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-500"
                }`}
              >
                Oficial
              </span>
            </button>

            {/* Subpestaña 2: Propietarios */}
            <button
              onClick={() => setActiveSubTab("propietarios")}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                activeSubTab === "propietarios"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "hover:bg-stone-100 dark:hover:bg-stone-800/80 text-stone-700 dark:text-stone-300"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="font-bold text-xs truncate">Propietarios</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeSubTab === "propietarios"
                    ? "bg-emerald-700 text-white"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-500"
                }`}
              >
                {clients.length}
              </span>
            </button>

            {/* Subpestaña 3: Catálogo de Concentrados */}
            <button
              onClick={() => setActiveSubTab("concentrados")}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                activeSubTab === "concentrados"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "hover:bg-stone-100 dark:hover:bg-stone-800/80 text-stone-700 dark:text-stone-300"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <PackageCheck className="w-4 h-4 flex-shrink-0" />
                <span className="font-bold text-xs truncate">Concentrados & Insumos</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeSubTab === "concentrados"
                    ? "bg-emerald-700 text-white"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-500"
                }`}
              >
                {feedTemplates.length}
              </span>
            </button>

            {/* Subpestaña 4: Apariencia & Tema */}
            <button
              onClick={() => setActiveSubTab("apariencia")}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                activeSubTab === "apariencia"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "hover:bg-stone-100 dark:hover:bg-stone-800/80 text-stone-700 dark:text-stone-300"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Sun className="w-4 h-4 flex-shrink-0" />
                <span className="font-bold text-xs truncate">Apariencia & Tema</span>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeSubTab === "apariencia"
                    ? "bg-emerald-700 text-white"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                🌓
              </span>
            </button>

            {/* Subpestaña 5: Copia de Seguridad & Respaldo */}
            <button
              onClick={() => setActiveSubTab("respaldo")}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                activeSubTab === "respaldo"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "hover:bg-stone-100 dark:hover:bg-stone-800/80 text-stone-700 dark:text-stone-300"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <HardDrive className="w-4 h-4 flex-shrink-0" />
                <span className="font-bold text-xs truncate">Respaldo & Datos</span>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeSubTab === "respaldo"
                    ? "bg-emerald-700 text-white"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-500"
                }`}
              >
                JSON
              </span>
            </button>

            {/* Subpestaña / Acción: Usuarios & Rutas de Acceso */}
            {onOpenUsersManagement && (
              <button
                type="button"
                onClick={onOpenUsersManagement}
                className="w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-bold text-xs truncate">Usuarios & Rutas</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-700 text-white">
                  Gestionar
                </span>
              </button>
            )}
          </div>

          {/* Tarjeta de Identidad y Tema */}
          <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-3">
            <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
              Identidad Activa
            </span>
            <p className="font-extrabold text-xs text-stone-900 dark:text-stone-100 truncate">
              {centerSettings.stableName}
            </p>
            <p className="text-[11px] text-stone-500 truncate">
              {centerSettings.location}
            </p>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                Modo Visual:
              </span>
              <ThemeToggle showLabel={false} />
            </div>
          </div>
        </div>

        {/* COLUMNA PRINCIPAL DE CONTENIDO (Resto de la pantalla, 9 columnas) */}
        <div className="lg:col-span-9 space-y-4">

      {/* =================================================================== */}
      {/* 0. SECCIÓN: SERVICIO DEL CANON (TIPO A, TIPO B, TIPO C Y CONFIGURABLES) */}
      {/* =================================================================== */}
      {activeSubTab === "canones" && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card del Servicio de Canon */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 mb-2">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Servicio del Canon & Pensión Equina</span>
                </div>
                <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                  Servicio del Canon: Modalidades Pesebrera Tipo A, Tipo B y Tipo C
                </h3>
                <p className="text-xs text-stone-500 max-w-3xl mt-1 leading-relaxed">
                  Configura exactamente de qué se encargará el criadero para cada modalidad de canon. Puedes hacer clic directamente en cualquier servicio para incluirlo o excluirlo en tiempo real, ajustar las tarifas mensuales y agregar nuevas atenciones personalizadas.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={() => openCanonPlanModal()}
                  size="sm"
                  className="gap-1.5 cursor-pointer bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Modalidad
                </Button>
              </div>
            </div>

            {/* Tarjetas Selectoras de Modalidades (Clic para abrir ventana grande) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              {plansToRender.map((plan) => {
                const isTipoA = plan.code === "TIPO_A";
                const isTipoB = plan.code === "TIPO_B";
                const isTipoC = plan.code === "TIPO_C";
                const icon = isTipoA ? "🏆" : isTipoB ? "🌾" : isTipoC ? "💧" : "🐎";
                const includedCount = plan.inclusions.filter((i) => i.included).length;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanForDetail(plan)}
                    className={`group p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between hover:scale-[1.02] hover:shadow-lg ${
                      isTipoA
                        ? "bg-amber-50/70 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 border-amber-300 dark:border-amber-800"
                        : isTipoB
                        ? "bg-sky-50/70 hover:bg-sky-100/90 dark:bg-sky-950/40 dark:hover:bg-sky-950/70 border-sky-300 dark:border-sky-800"
                        : "bg-indigo-50/70 hover:bg-indigo-100/90 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 border-indigo-300 dark:border-indigo-800"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                          <span>{icon}</span>
                          <span>{plan.name}</span>
                        </span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {plan.code}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-snug line-clamp-2">
                        {plan.tagline}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-200/70 dark:border-stone-700/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-stone-900 dark:text-stone-100 text-sm">
                          {formatCOP(plan.basePriceCOP)}
                          <span className="text-[10px] font-normal text-stone-500"> /mes</span>
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {includedCount} servicios criadero
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300 pt-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Ver Información & Servicios</span>
                        <span>➔</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VENTANA GRANDE QUE SE DESPLIEGA AL SELECCIONAR UNA MODALIDAD */}
          {activeModalPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-6 max-h-[90vh] overflow-y-auto relative">
                {/* Encabezado de la Ventana con Botón X de Cierre */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
                  <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full ${
                          activeModalPlan.code === "TIPO_A"
                            ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            : activeModalPlan.code === "TIPO_B"
                            ? "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800"
                            : "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800"
                        }`}
                      >
                        {activeModalPlan.code}
                      </span>
                      <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100">
                        {activeModalPlan.name}
                      </h3>
                      <span className="text-xs font-bold text-stone-500 bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 rounded-full">
                        {activeModalPlan.inclusions.filter((i) => i.included).length} de{" "}
                        {activeModalPlan.inclusions.length} servicios incluidos por el criadero
                      </span>
                    </div>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {activeModalPlan.tagline}
                    </p>
                    <p className="text-xs text-stone-500 leading-relaxed max-w-2xl">
                      {activeModalPlan.description}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
                    <div className="text-left sm:text-right bg-stone-50 dark:bg-stone-800/70 p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/70 space-y-1.5 shadow-xs">
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 block uppercase font-black tracking-wider">
                        Tarifa Mensual Calculada
                      </span>
                      <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300 block tracking-tight">
                        {formatCOP(activeModalPlan.basePriceCOP)}
                      </span>
                      <span className="text-[10px] text-stone-400 block">por caballo / mes</span>

                      {/* Base de Alojamiento Box editable */}
                      <div className="pt-2 border-t border-stone-200/70 dark:border-stone-700/60 flex items-center justify-between sm:justify-end gap-2 text-[10px]">
                        <span className="text-stone-500 dark:text-stone-400 font-bold">Base Alojamiento Box:</span>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <span className="font-bold text-stone-400">$</span>
                          <input
                            type="number"
                            min="0"
                            step="20000"
                            value={activeModalPlan.basePlazaCOP ?? 300000}
                            onChange={(e) => handleUpdateBasePlaza(activeModalPlan, parseFloat(e.target.value) || 0)}
                            className="w-24 px-1.5 py-0.5 text-[11px] font-black rounded border bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-right outline-none focus:ring-1 focus:ring-emerald-500"
                            title="Costo base de la infraestructura / alojamiento de la pesebrera"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Botón X Prominente para Cerrar la Ventana */}
                    <button
                      type="button"
                      onClick={() => setSelectedPlanForDetail(null)}
                      className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 hover:text-stone-900 transition-all cursor-pointer shadow-xs ml-2 self-start"
                      title="Cerrar ventana y seleccionar otra modalidad (X)"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Banner de Ayuda y Resumen de Suma Dinámica */}
                <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg shrink-0">💡</span>
                    <p className="text-stone-700 dark:text-stone-300 leading-snug">
                      <strong>Cálculo Automático por Dependencia:</strong> Al marcar <strong>Criadero</strong>, el costo del servicio se <strong>suma al canon mensual</strong>. Si el dueño asume la responsabilidad (<strong>Propietario</strong>), se <strong>deduce</strong> del total. Puedes editar el valor en cada casilla.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0 font-black text-[11px]">
                    <span className="bg-emerald-100/90 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 rounded-xl">
                      + {formatCOP(activeModalPlan.inclusions.filter((i) => i.included).reduce((acc, i) => acc + (i.costCOP || 0), 0))} Criadero
                    </span>
                    <span className="bg-amber-100/90 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2.5 py-1 rounded-xl">
                      - {formatCOP(activeModalPlan.inclusions.filter((i) => !i.included).reduce((acc, i) => acc + (i.costCOP || 0), 0))} Propietario
                    </span>
                  </div>
                </div>

                {/* Panel de Configuración de Responsabilidades del Criadero */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                        ¿De qué se encargará el criadero en {activeModalPlan.name}?
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-400 italic">
                      Haz clic en cualquier servicio para alternar Criadero vs Propietario
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {activeModalPlan.inclusions.map((inc) => (
                      <div
                        key={inc.id}
                        onClick={() => handleToggleInclusionInPlan(activeModalPlan, inc.id)}
                        className={`group relative p-4 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                          inc.included
                            ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 shadow-xs"
                            : "bg-stone-50/80 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700/80 hover:bg-stone-100 dark:hover:bg-stone-800/60 opacity-85 hover:opacity-100"
                        }`}
                      >
                        {/* Cabecera de la Tarjeta */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <div className="mt-0.5 shrink-0">
                              {inc.included ? (
                                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4 text-stone-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span
                                className={`text-xs font-black block leading-tight truncate ${
                                  inc.included
                                    ? "text-emerald-950 dark:text-emerald-100"
                                    : "text-stone-700 dark:text-stone-300"
                                }`}
                              >
                                {inc.name}
                              </span>
                              {inc.notes && (
                                <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5 line-clamp-2">
                                  {inc.notes}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleInclusionInPlan(activeModalPlan, inc.id);
                              }}
                              className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full cursor-pointer transition-colors shadow-xs ${
                                inc.included
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-300"
                              }`}
                              title="Haz clic para alternar responsabilidad"
                            >
                              {inc.included ? "Criadero" : "Propietario"}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveInclusionFromPlan(activeModalPlan, inc.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                              title="Quitar este servicio"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Costo Editable del Apartado */}
                        <div
                          className="mt-3.5 pt-3 border-t border-stone-200/60 dark:border-stone-700/60 space-y-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400">
                              Costo Mensual:
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-stone-400">$</span>
                              <input
                                type="number"
                                min="0"
                                step="10000"
                                value={inc.costCOP ?? 0}
                                onChange={(e) =>
                                  handleUpdateInclusionCost(
                                    activeModalPlan,
                                    inc.id,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-28 px-2 py-1 text-xs font-black rounded-lg border bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-right focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
                              />
                              <span className="text-[10px] font-bold text-stone-400">COP</span>
                            </div>
                          </div>

                          {/* Impacto en el Total del Canon */}
                          <div className="flex items-center justify-between text-[11px] pt-0.5">
                            <span className="text-stone-400 text-[10px] font-medium">Efecto en canon:</span>
                            {inc.included ? (
                              <span className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md text-[10px]">
                                <span>+ {formatCOP(inc.costCOP || 0)}</span>
                                <span className="font-medium text-[9px]">(Sumado)</span>
                              </span>
                            ) : (
                              <span className="font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1 bg-amber-100/80 dark:bg-amber-950/80 px-2 py-0.5 rounded-md text-[10px]">
                                <span>- {formatCOP(inc.costCOP || 0)}</span>
                                <span className="font-medium text-[9px]">(Deducido)</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Agregar Rápido Nuevo Servicio a Esta Modalidad */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full">
                      <Plus className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={quickServiceInput[activeModalPlan.id] || ""}
                        onChange={(e) =>
                          setQuickServiceInput((prev) => ({
                            ...prev,
                            [activeModalPlan.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (quickServiceInput[activeModalPlan.id]?.trim()) {
                              const cost = quickServiceCost[activeModalPlan.id] ?? 100000;
                              handleQuickAddInclusion(activeModalPlan, quickServiceInput[activeModalPlan.id], cost);
                              setQuickServiceInput((prev) => ({ ...prev, [activeModalPlan.id]: "" }));
                            }
                          }
                        }}
                        placeholder={`Añadir otro servicio a ${activeModalPlan.name} (ej: Paseador 2x día, Baño y cepillado semanal, Solarium)...`}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <span className="text-xs font-bold text-stone-400">$</span>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={quickServiceCost[activeModalPlan.id] ?? 100000}
                        onChange={(e) =>
                          setQuickServiceCost((prev) => ({
                            ...prev,
                            [activeModalPlan.id]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="Costo COP"
                        className="w-28 px-2 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs text-right font-black focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                      <span className="text-[10px] text-stone-400 font-bold">COP</span>
                    </div>
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => {
                        if (quickServiceInput[activeModalPlan.id]?.trim()) {
                          const cost = quickServiceCost[activeModalPlan.id] ?? 100000;
                          handleQuickAddInclusion(activeModalPlan, quickServiceInput[activeModalPlan.id], cost);
                          setQuickServiceInput((prev) => ({ ...prev, [activeModalPlan.id]: "" }));
                        }
                      }}
                      className="text-xs h-9 px-3.5 cursor-pointer shrink-0 w-full sm:w-auto bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Añadir Servicio
                    </Button>
                  </div>
                </div>

                {/* Footer de la Ventana Grande con Botón Cerrar y Acciones */}
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openCanonPlanModal(activeModalPlan)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar Parámetros</span>
                    </button>

                    {plansToRender.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar la modalidad "${activeModalPlan.name}"?`)) {
                            if (onDeleteCanonPlan) onDeleteCanonPlan(activeModalPlan.id);
                            setSelectedPlanForDetail(null);
                          }
                        }}
                        className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Eliminar modalidad"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      type="button"
                      onClick={() => setSelectedPlanForDetail(null)}
                      className="gap-2 cursor-pointer bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 shadow-sm"
                    >
                      <X className="w-4 h-4" />
                      <span>Cerrar Ventana</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =================================================================== */}
      {/* 1. SECCIÓN: CONFIGURACIÓN DE PROPIETARIOS */}
      {/* =================================================================== */}
      {activeSubTab === "propietarios" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar por nombre, documento o teléfono..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <p className="text-xs text-stone-500">
              Mostrando {filteredClients.length} de {clients.length} propietarios registrados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-black text-stone-900 dark:text-stone-100 text-base leading-snug">
                        {client.fullName}
                      </h4>
                      <span className="text-xs font-mono text-stone-400 block mt-0.5">
                        {client.identification}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        client.paymentStatus === "al_dia"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {client.paymentStatus === "al_dia" ? "Al día" : "Con Saldo"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400 pt-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                      <span className="font-semibold">{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                        <span className="truncate">{client.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 font-semibold text-stone-700 dark:text-stone-300">
                      🐴 {client.horsesCount} {client.horsesCount === 1 ? "ejemplar" : "ejemplares"}
                    </span>
                    {client.outstandingBalance > 0 && (
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        {formatCOP(client.outstandingBalance)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openClientModal(client)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar al propietario ${client.fullName}?`)) {
                        onDeleteClient(client.id);
                      }
                    }}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. SECCIÓN: CATÁLOGO DE CONCENTRADOS E INSUMOS */}
      {/* =================================================================== */}
      {activeSubTab === "concentrados" && (
        <div className="space-y-4">
          <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="font-extrabold text-emerald-950 dark:text-emerald-200 text-sm">
                  Plantillas Rápidas para Recepción de Mercancía
                </h4>
                <p className="text-xs text-emerald-900 dark:text-emerald-300 max-w-2xl mt-0.5">
                  Los concentrados y alimentos creados aquí aparecerán en un menú desplegable en el módulo de Inventario. Cuando llegue un pedido, podrás seleccionarlo y el sistema autocompletará nombre, proveedor, costo, presentación y alerta mínima al instante.
                </p>
              </div>
            </div>
            <Button
              onClick={() => openTemplateModal()}
              size="sm"
              className="self-start sm:self-auto gap-1.5 whitespace-nowrap cursor-pointer text-xs"
            >
              <Plus className="w-4 h-4" />
              Nuevo Concentrado
            </Button>
          </div>

          {/* Filtros de concentrados */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Buscar por marca, concentrado o proveedor..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer"
            >
              <option value="todas">Todas las categorías</option>
              <option value="alimento">Alimento / Concentrado</option>
              <option value="heno">Heno / Forraje</option>
              <option value="cama">Cama / Viruta</option>
              <option value="medicamento">Fármaco / Botiquín</option>
              <option value="suplemento">Suplemento</option>
            </select>
          </div>

          {/* Grid de concentrados y plantillas compactas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getCategoryBadge(tpl.category)}
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      {tpl.brand}
                    </span>
                  </div>

                  <div>
                    <h4
                      className="font-extrabold text-stone-900 dark:text-stone-100 text-xs sm:text-sm leading-snug line-clamp-1"
                      title={tpl.name}
                    >
                      {tpl.name}
                    </h4>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate mt-0.5">
                      Bodega: {tpl.defaultLocation}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-stone-600 dark:text-stone-400 p-2 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                    <div>
                      <span className="text-[9px] text-stone-400 block">Presentación</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200 truncate block">
                        {tpl.defaultUnit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 block">Costo Ref.</span>
                      <span className="font-extrabold text-emerald-800 dark:text-emerald-400 block">
                        {formatCOP(tpl.defaultCostPerUnit)}
                      </span>
                    </div>
                    <div className="col-span-2 pt-0.5 border-t border-stone-200/50 dark:border-stone-700/50 flex justify-between">
                      <span className="text-[9px] text-stone-400">Alerta mín.:</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {tpl.defaultMinStockAlert} {tpl.defaultUnit.split(" ")[0]}
                      </span>
                    </div>
                  </div>

                  {tpl.nutritionalNotes && (
                    <p className="text-[9px] text-stone-500 italic bg-amber-50/50 dark:bg-amber-950/20 p-1.5 rounded-lg border border-amber-200/50 dark:border-amber-900/30 line-clamp-2">
                      &ldquo;{tpl.nutritionalNotes}&rdquo;
                    </p>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[10px]">
                  <span className="text-[9px] text-stone-400 truncate max-w-[90px]">
                    {tpl.defaultSupplier || "Sin proveedor"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openTemplateModal(tpl)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-[10px] font-semibold transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la plantilla "${tpl.name}"?`)) {
                          onDeleteFeedTemplate(tpl.id);
                        }
                      }}
                      className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. SECCIÓN: PARÁMETROS DEL CENTRO ECUESTRE (EDITABLE Y VINCULADO) */}
      {/* =================================================================== */}
      {activeSubTab === "establo" && (
        <form onSubmit={handleSaveCenterSettings} className="space-y-6 animate-fade-in">
          {/* Mensaje de confirmación en vivo */}
          {centerSaveSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-3xl p-5 flex items-center gap-3 shadow-md animate-fade-in">
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm">
                  ¡Parámetros del Centro Actualizados con Éxito!
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  El nuevo nombre, datos veterinarios y cuentas bancarias ya se aplican dinámicamente en todo el sistema: Pasaportes oficiales (.doc), recibos de WhatsApp, informes de inventario y encabezados.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-6 space-y-6 shadow-sm">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                  Identidad y Datos Institucionales de la Pesebrera
                </h3>
                <p className="text-xs text-stone-500">
                  Modifica el nombre oficial, veterinario y cuentas bancarias para reflejarlos en todo el sistema
                </p>
              </div>

              <Button type="submit" size="sm" className="gap-2 cursor-pointer shadow-sm">
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Bloque 1: Identidad del Criadero */}
              <div className="p-5 rounded-2xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-3.5">
                <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-700 pb-2">
                  <Building2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    Razón Social e Identidad del Criadero
                  </span>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Nombre Oficial de la Pesebrera / Criadero *
                  </label>
                  <input
                    type="text"
                    required
                    value={stableName}
                    onChange={(e) => setStableName(e.target.value)}
                    placeholder="ej: HACIENDA & PESEBRERAS SAN ISIDRO"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    Aparece como encabezado institucional en pasaportes, recibos y reportes
                  </span>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Lema o Subtítulo Institucional
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="ej: Centro Integral de Reproducción, Alojamiento y Cuidado Equino"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                      NIT / Identificación *
                    </label>
                    <input
                      type="text"
                      required
                      value={nit}
                      onChange={(e) => setNit(e.target.value)}
                      placeholder="ej: 901.482.910-3"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                      Teléfono Administrativo
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="ej: +57 312 458 9012"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Ubicación / Finca / Municipio *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="ej: Vereda Las Palmas, Km 8 - Antioquia, Colombia"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Bloque 2: Médico Veterinario Oficial */}
              <div className="p-5 rounded-2xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-3.5">
                <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-700 pb-2">
                  <span className="text-base">🩺</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    Médico Veterinario Oficial (Pasaporte Word)
                  </span>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Nombre del Profesional Responsable *
                  </label>
                  <input
                    type="text"
                    required
                    value={veterinarianName}
                    onChange={(e) => setVeterinarianName(e.target.value)}
                    placeholder="ej: Dr. Juan Pablo Morales (MVZ)"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    Se imprime en el recuadro de firma y certificación de los pasaportes
                  </span>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Matrícula Profesional COMVEZCOL *
                  </label>
                  <input
                    type="text"
                    required
                    value={veterinarianLicense}
                    onChange={(e) => setVeterinarianLicense(e.target.value)}
                    placeholder="ej: COMVEZCOL # 19.842"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Especialidad Médica Equina
                  </label>
                  <input
                    type="text"
                    value={veterinarianSpecialty}
                    onChange={(e) => setVeterinarianSpecialty(e.target.value)}
                    placeholder="ej: Medicina y Reproducción Equina"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Bloque 3: Cuenta Bancaria Predeterminada */}
              <div className="md:col-span-2 p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
                <div className="flex items-center gap-2 border-b border-emerald-200 dark:border-emerald-900/60 pb-2">
                  <span className="text-base">🏦</span>
                  <span className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                    Canales de Pago para Mensajes de WhatsApp y Recibos
                  </span>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-emerald-950 dark:text-emerald-300">
                    Detalle de Transferencia / Cuentas Autorizadas *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                    placeholder="ej: Bancolombia Cuenta de Ahorros # 108-928374-12 a nombre de Hacienda & Pesebreras SAS..."
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-800 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-400 mt-1">
                    Este texto se insertará automáticamente al final de cada liquidación mensual enviada por WhatsApp y en los comprobantes en Word.
                  </p>
                </div>
              </div>

              {/* Bloque 4: Parámetros Operativos y Ración de Emergencia */}
              <div className="md:col-span-2 p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3">
                <div className="flex items-center gap-2 border-b border-amber-200 dark:border-amber-900/60 pb-2">
                  <span className="text-base">🌾</span>
                  <span className="font-bold text-amber-950 dark:text-amber-200 text-sm">
                    Tarifa Base por Ración de Emergencia / Suplemento Adicional
                  </span>
                </div>

                <div className="max-w-md">
                  <label className="block font-semibold mb-1 text-amber-950 dark:text-amber-300">
                    Costo por Ración de Emergencia (COP)
                  </label>
                  <input
                    type="number"
                    value={defaultEmergencyRationCostCOP}
                    onChange={(e) =>
                      setDefaultEmergencyRationCostCOP(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="ej: 25000"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 text-xs font-mono font-bold text-amber-900 dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                  <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-1">
                    Tarifa facturada automáticamente al propietario cuando el operario suministra raciones de concentrado extra en cuadra por escasez de alimento en el box.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end">
              <Button type="submit" size="sm" className="gap-2 cursor-pointer shadow-md">
                <Save className="w-4 h-4" />
                <span>Guardar Parámetros y Aplicar en Todo el Sistema</span>
              </Button>
            </div>
          </div>
        </form>
      )}

          {/* =================================================================== */}
          {/* 4. SECCIÓN: APARIENCIA Y TEMA */}
          {/* =================================================================== */}
          {activeSubTab === "apariencia" && (
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border border-stone-200/90 dark:border-stone-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-lg">
                    Apariencia y Modo Visual del Sistema
                  </h3>
                  <p className="text-xs text-stone-500">
                    Selecciona el modo visual según tus condiciones de iluminación en caballerizas o en oficina
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Opción Modo Claro */}
                <div
                  onClick={() => {
                    document.documentElement.classList.remove("dark");
                    localStorage.setItem("theme", "light");
                    window.dispatchEvent(
                      new CustomEvent("theme-changed", { detail: { theme: "light" } })
                    );
                  }}
                  className="p-5 rounded-3xl border-2 border-stone-200 dark:border-stone-800 bg-[#fafaf9] text-stone-900 cursor-pointer hover:border-emerald-600 transition-all hover:shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      Modo Claro (Día)
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Luminoso
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Fondo blanco marfil natural con tipografía oscura de máxima legibilidad bajo la luz del sol.
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-800"></span>
                    <span className="w-3 h-3 rounded-full bg-stone-300"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  </div>
                </div>

                {/* Opción Modo Oscuro */}
                <div
                  onClick={() => {
                    document.documentElement.classList.add("dark");
                    localStorage.setItem("theme", "dark");
                    window.dispatchEvent(
                      new CustomEvent("theme-changed", { detail: { theme: "dark" } })
                    );
                  }}
                  className="p-5 rounded-3xl border-2 border-stone-800 bg-[#0c0a09] text-white cursor-pointer hover:border-emerald-500 transition-all hover:shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm flex items-center gap-2 text-stone-100">
                      <Moon className="w-4 h-4 text-amber-400" />
                      Modo Oscuro (Noche)
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Elegante
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Fondo carbón profundo con acentos esmeralda y ámbar para reducir la fatiga visual en la noche.
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="w-3 h-3 rounded-full bg-stone-700"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* 5. SECCIÓN: RESPALDO Y RESTAURACIÓN DE LA BASE DE DATOS */}
          {/* =================================================================== */}
          {activeSubTab === "respaldo" && (
            <div className="space-y-6 animate-fade-in">
              {/* Input oculto para cargar archivo JSON */}
              <input
                type="file"
                ref={backupFileInputRef}
                onChange={handleBackupFileChange}
                accept=".json,application/json"
                className="hidden"
              />

              {/* Mensaje de estado tras restaurar */}
              {backupStatus && (
                <div
                  className={`p-4 rounded-3xl border flex items-center justify-between gap-3 text-xs font-bold shadow-md animate-fade-in ${
                    backupStatus.success
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-800"
                      : "bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-400 dark:border-rose-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {backupStatus.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span>{backupStatus.message}</span>
                  </div>
                  <button
                    onClick={() => setBackupStatus(null)}
                    className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Cabecera del Centro de Respaldo */}
              <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border border-stone-200/90 dark:border-stone-800 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-lg">
                      Respaldo, Exportación y Portabilidad de Datos
                    </h3>
                    <p className="text-xs text-stone-500">
                      Descarga toda la base de datos de tu criadero en formato estándar JSON o restaura un respaldo en cualquier momento.
                    </p>
                  </div>
                </div>

                {/* Métricas de Datos Activos en Memoria */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                    <span className="text-[10px] text-stone-400 block font-semibold">Caballos Registrados</span>
                    <span className="font-extrabold text-base text-stone-900 dark:text-stone-100 block mt-0.5">
                      {dataService.getHorses().length}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                    <span className="text-[10px] text-stone-400 block font-semibold">Pesebreras</span>
                    <span className="font-extrabold text-base text-stone-900 dark:text-stone-100 block mt-0.5">
                      {dataService.getPesebreras().length}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                    <span className="text-[10px] text-stone-400 block font-semibold">Propietarios</span>
                    <span className="font-extrabold text-base text-stone-900 dark:text-stone-100 block mt-0.5">
                      {dataService.getClients().length}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                    <span className="text-[10px] text-stone-400 block font-semibold">Recibos & Pagos</span>
                    <span className="font-extrabold text-base text-stone-900 dark:text-stone-100 block mt-0.5">
                      {dataService.getPayments().length}
                    </span>
                  </div>
                </div>

                {/* Acciones Principales: Exportar e Importar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Tarjeta de Exportación */}
                  <div className="p-5 rounded-3xl border-2 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3.5">
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-extrabold text-sm">
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Descargar Copia de Seguridad (.JSON)</span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Genera un archivo con fecha y hora que contiene todos los caballos con pedigrí, dietas, inventario, canones, pesebreras y recibos. Guárdalo en tu computador o memoria USB.
                    </p>
                    <Button
                      onClick={handleDownloadBackup}
                      size="sm"
                      className="w-full gap-2 cursor-pointer bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-xs text-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar Copia Ahora</span>
                    </Button>
                  </div>

                  {/* Tarjeta de Restauración */}
                  <div className="p-5 rounded-3xl border-2 border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3.5">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-extrabold text-sm">
                      <Upload className="w-4 h-4 text-amber-600" />
                      <span>Restaurar Base de Datos desde Respaldo</span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Carga un archivo <span className="font-mono text-amber-800 dark:text-amber-300">.json</span> descargado previamente. El sistema validará la estructura y reemplazará los datos de forma segura.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => backupFileInputRef.current?.click()}
                      size="sm"
                      className="w-full gap-2 cursor-pointer border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 font-bold text-xs"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Seleccionar Archivo .JSON para Restaurar</span>
                    </Button>
                  </div>
                </div>

                {/* Explicación de Arquitectura Abierta y Extensible */}
                <div className="mt-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/80 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-200">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Arquitectura Abierta y Lista para Nuevas Configuraciones</span>
                  </div>
                  <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
                    Todas las entidades del sistema están diseñadas con esquemas extensibles. Cualquier nuevo campo, módulo o relación agregada a futuro se incorporará automáticamente en las exportaciones y en la sincronización con Supabase PostgreSQL.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL: REGISTRAR / EDITAR PROPIETARIO */}
      {/* =================================================================== */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                    {editingClient ? "Editar Propietario" : "Registrar Nuevo Propietario"}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Datos de contacto y facturación para recibos de WhatsApp
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={clientFullName}
                  onChange={(e) => setClientFullName(e.target.value)}
                  placeholder="ej: Carlos Eduardo Restrepo"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">C.C. / Identificación *</label>
                  <input
                    type="text"
                    required
                    value={clientIdentification}
                    onChange={(e) => setClientIdentification(e.target.value)}
                    placeholder="ej: CC 71.392.810"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="ej: +57 312 458 9012"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Dirección / Finca</label>
                  <input
                    type="text"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="Finca El Remanso, Vereda..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                <div>
                  <label className="block font-semibold mb-1">Estado de Pago</label>
                  <select
                    value={clientPaymentStatus}
                    onChange={(e) =>
                      setClientPaymentStatus(e.target.value as "al_dia" | "pendiente" | "mora")
                    }
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="al_dia">Al Día</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="mora">En Mora</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Saldo Pendiente ($ COP)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={clientOutstandingBalance}
                    onChange={(e) => setClientOutstandingBalance(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsClientModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="gap-1.5 cursor-pointer">
                  <Check className="w-4 h-4" />
                  {editingClient ? "Actualizar Propietario" : "Guardar Propietario"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: CREAR / EDITAR CONCENTRADO O PLANTILLA */}
      {/* =================================================================== */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                    {editingTemplate ? "Editar Concentrado / Insumo" : "Crear Concentrado para Inventario"}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Se utilizará para autocompletar la llegada de insumos a bodega
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nombre del Concentrado / Insumo *</label>
                <input
                  type="text"
                  required
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  placeholder="ej: Concentrado Pinta Campeón (40kg)"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Marca / Fabricante *</label>
                  <input
                    type="text"
                    required
                    value={tplBrand}
                    onChange={(e) => setTplBrand(e.target.value)}
                    placeholder="ej: Italcol, Contegral, Pavo..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Categoría</label>
                  <select
                    value={tplCategory}
                    onChange={(e) => setTplCategory(e.target.value as InventoryCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="alimento">Alimento / Concentrado</option>
                    <option value="heno">Heno / Forraje</option>
                    <option value="cama">Cama / Viruta</option>
                    <option value="medicamento">Fármaco / Botiquín</option>
                    <option value="suplemento">Suplemento</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Unidad Predeterminada</label>
                  <input
                    type="text"
                    required
                    value={tplUnit}
                    onChange={(e) => setTplUnit(e.target.value)}
                    placeholder="Bultos (40kg), Pacas..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Alerta Mínima</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={tplMinStock}
                    onChange={(e) => setTplMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Costo Unitario ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={tplCost}
                    onChange={(e) => setTplCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Ubicación / Bodega Sugerida</label>
                  <input
                    type="text"
                    required
                    value={tplLocation}
                    onChange={(e) => setTplLocation(e.target.value)}
                    placeholder="ej: Bodega Principal, Heno Techado..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Proveedor Habitual</label>
                  <input
                    type="text"
                    value={tplSupplier}
                    onChange={(e) => setTplSupplier(e.target.value)}
                    placeholder="ej: Distribuidora Italcol Central..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Notas de Nutrición / Uso</label>
                <input
                  type="text"
                  value={tplNotes}
                  onChange={(e) => setTplNotes(e.target.value)}
                  placeholder="ej: 14% Proteína, para ejemplares de trocha en entrenamiento..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="gap-1.5 cursor-pointer">
                  <Check className="w-4 h-4" />
                  {editingTemplate ? "Actualizar Concentrado" : "Guardar en Catálogo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Crear / Editar Plan de Canon */}
      {isCanonPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 dark:text-stone-100 text-base">
                    {editingCanonPlan ? "Editar Modalidad de Canon" : "Nueva Modalidad de Canon"}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Personaliza nombre, tarifa y qué servicios asume el criadero vs el propietario
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCanonPlanModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCanonPlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Código de Modalidad
                  </label>
                  <input
                    type="text"
                    required
                    value={planCode}
                    onChange={(e) => setPlanCode(e.target.value)}
                    placeholder="ej: TIPO_A, TIPO_B, TIPO_C..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Nombre de la Pesebrera / Modalidad
                  </label>
                  <input
                    type="text"
                    required
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="ej: Pesebrera Tipo A, Pesebrera Tipo B..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Frase Descriptiva / Tagline
                  </label>
                  <input
                    type="text"
                    required
                    value={planTagline}
                    onChange={(e) => setPlanTagline(e.target.value)}
                    placeholder="ej: El criadero se encarga de TODO / Solo agua, heno y cama..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Tarifa Base Mensual (COP)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={10000}
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="1200000"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Descripción Detallada
                </label>
                <textarea
                  rows={2}
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  placeholder="Detalles del alcance del servicio, responsabilidades y consideraciones para el cliente..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              {/* Lista Configurable de Inclusiones del Criadero */}
              <div className="space-y-2 border-t border-stone-100 dark:border-stone-800 pt-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-900 dark:text-stone-100">
                    Servicios y Responsabilidades de esta Modalidad
                  </label>
                  <span className="text-[11px] text-stone-500">
                    Marca la casilla si el criadero se encarga
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {planInclusions.map((inc, idx) => (
                    <div
                      key={inc.id}
                      className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        inc.included
                          ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                          : "bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700"
                      }`}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={inc.included}
                          onChange={(e) => {
                            const updated = [...planInclusions];
                            updated[idx].included = e.target.checked;
                            setPlanInclusions(updated);
                          }}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={inc.name}
                            onChange={(e) => {
                              const updated = [...planInclusions];
                              updated[idx].name = e.target.value;
                              setPlanInclusions(updated);
                            }}
                            className="font-bold bg-transparent border-none p-0 focus:outline-none w-full text-stone-900 dark:text-stone-100 text-xs"
                          />
                          <input
                            type="text"
                            value={inc.notes || ""}
                            onChange={(e) => {
                              const updated = [...planInclusions];
                              updated[idx].notes = e.target.value;
                              setPlanInclusions(updated);
                            }}
                            placeholder="Detalle o nota (ej: 3 raciones diarias)"
                            className="text-[11px] text-stone-500 bg-transparent border-none p-0 focus:outline-none w-full"
                          />
                        </div>
                      </label>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            inc.included
                              ? "bg-emerald-600 text-white"
                              : "bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
                          }`}
                        >
                          {inc.included ? "Criadero" : "Propietario"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPlanInclusions(planInclusions.filter((_, i) => i !== idx));
                          }}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input para agregar un nuevo servicio a la lista */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newInclusionName}
                    onChange={(e) => setNewInclusionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newInclusionName.trim()) {
                          setPlanInclusions([
                            ...planInclusions,
                            {
                              id: `inc-${Date.now()}`,
                              name: newInclusionName.trim(),
                              included: true,
                              notes: "A cargo del criadero",
                            },
                          ]);
                          setNewInclusionName("");
                        }
                      }
                    }}
                    placeholder="Nombre de otro servicio (ej: Solarium, Baño y cepillado, Paseador)..."
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newInclusionName.trim()) {
                        setPlanInclusions([
                          ...planInclusions,
                          {
                            id: `inc-${Date.now()}`,
                            name: newInclusionName.trim(),
                            included: true,
                            notes: "A cargo del criadero",
                          },
                        ]);
                        setNewInclusionName("");
                      }
                    }}
                    className="text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Añadir
                  </Button>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCanonPlanModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="gap-1.5 cursor-pointer bg-emerald-800 hover:bg-emerald-900 text-white"
                >
                  <Check className="w-4 h-4" />
                  {editingCanonPlan ? "Actualizar Modalidad" : "Guardar Modalidad"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
