"use client";

import React, { useState, useEffect } from "react";
import {
  Horse,
  HorsePedigree,
  DiseaseHistoryEntry,
  FarrierControl,
  Client,
  VeterinaryRecord,
  CenterSettings,
  HorseDietFeedConfig,
  FeedBlendIngredient,
  UserRole,
} from "@/types";
import { downloadWordHorsePassport } from "@/lib/word-passport";
import {
  calculateFeedDepletion,
  buildFeedWhatsAppUrl,
  buildEmergencyRunoutWhatsAppUrl,
} from "@/lib/feed-calculator";
import {
  X,
  Award,
  HeartPulse,
  Wrench,
  Info,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Check,
  Camera,
  User,
  Clock,
  Download,
  FileText,
  UserX,
  Wheat,
  MessageCircle,
  Scale,
  RefreshCw,
  Trash2,
  Settings,
  AlertOctagon,
  Utensils,
  DollarSign,
  Lock,
  Pill,
  Syringe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AdministeredMedicationItem {
  id: string;
  name: string;
  dose: string;
  unit: string;
  route: string;
}

export const COMMON_EQUINE_MEDS = [
  { name: "Flunixin Meglumine", defaultDose: "10", unit: "ml", route: "IV" },
  { name: "Dipirona 50%", defaultDose: "20", unit: "ml", route: "IV" },
  { name: "Fenilbutazona", defaultDose: "10", unit: "ml", route: "IV" },
  { name: "Suero Ringer Lactato", defaultDose: "1000", unit: "ml", route: "IV" },
  { name: "Dexametasona 2mg/ml", defaultDose: "10", unit: "ml", route: "IM" },
  { name: "Penicilina G Sódica", defaultDose: "20", unit: "ml", route: "IM" },
  { name: "Gentamicina 10%", defaultDose: "20", unit: "ml", route: "IV" },
  { name: "Omeprazol Pasta", defaultDose: "1", unit: "dosis", route: "Oral" },
  { name: "Xilacina 10%", defaultDose: "3", unit: "ml", route: "IV" },
  { name: "Acepromacina", defaultDose: "2", unit: "ml", route: "IM" },
] as const;

interface HorseDetailModalProps {
  horse: Horse | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePedigree: (horseId: string, pedigree: HorsePedigree) => void;
  onAddDisease: (horseId: string, disease: Omit<DiseaseHistoryEntry, "id">) => void;
  onUpdateFarrier: (horseId: string, farrier: FarrierControl) => void;
  onUpdatePhoto: (horseId: string, imageUrl: string) => void;
  onRetireHorse?: (horse: Horse) => void;
  onRestockFeed?: (horseId: string, kgAdded: number, notes?: string) => void;
  onUpdateFeedConfig?: (horseId: string, feedConfig: HorseDietFeedConfig) => void;
  onSupplyEmergencyFeed?: (horseId: string, rationCostCOP: number, dailyKg: number) => void;
  client?: Client | null;
  vetRecords?: VeterinaryRecord[];
  centerSettings?: CenterSettings;
  currentUserRole?: UserRole;
}

export function HorseDetailModal({
  horse,
  isOpen,
  onClose,
  onUpdatePedigree,
  onAddDisease,
  onUpdateFarrier,
  onUpdatePhoto,
  onRetireHorse,
  onRestockFeed,
  onUpdateFeedConfig,
  onSupplyEmergencyFeed,
  client,
  vetRecords,
  centerSettings,
  currentUserRole = "admin",
}: HorseDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    "pedigri" | "enfermedades" | "herraje" | "general" | "alimento"
  >("pedigri");

  // Estados para recarga de alimento del propietario
  const [isRestockingFeed, setIsRestockingFeed] = useState(false);
  const [restockKg, setRestockKg] = useState<number>(40);
  const [restockNotes, setRestockNotes] = useState("");

  // Estados para modificación completa de la dieta
  const [isEditingFeedConfig, setIsEditingFeedConfig] = useState(false);
  const [editFeedProvidedBy, setEditFeedProvidedBy] = useState<"propietario" | "criadero">("propietario");
  const [editFeedType, setEditFeedType] = useState<"simple" | "mezcla">("simple");
  const [editFeedName, setEditFeedName] = useState("");
  const [editBagWeightKg, setEditBagWeightKg] = useState<number>(40);
  const [editBagsCount, setEditBagsCount] = useState<number>(1);
  const [editDailyGrainKg, setEditDailyGrainKg] = useState<number>(3.5);
  const [editDailyPortionsCount, setEditDailyPortionsCount] = useState<number>(3);
  const [editEmergencyCostCOP, setEditEmergencyCostCOP] = useState<number>(25000);
  const [editBlendIngredients, setEditBlendIngredients] = useState<FeedBlendIngredient[]>([
    { id: "ing-1", name: "Concentrado Base", kg: 40 },
    { id: "ing-2", name: "Avena Rolada", kg: 15 },
  ]);
  const [editResetStartDate, setEditResetStartDate] = useState(true);

  // Estados para ración de emergencia
  const [isConfirmingEmergencySupply, setIsConfirmingEmergencySupply] = useState(false);
  const [emergencySupplySuccess, setEmergencySupplySuccess] = useState<string | null>(null);

  // Estados para edición de Pedigrí
  const [isEditingPedigree, setIsEditingPedigree] = useState(false);
  const [pedigreeForm, setPedigreeForm] = useState<HorsePedigree>({});

  // Estados para nuevo registro médico y administración de múltiples medicamentos
  const [isAddingDisease, setIsAddingDisease] = useState(false);
  const [medicationsList, setMedicationsList] = useState<AdministeredMedicationItem[]>([
    { id: "med-1", name: "", dose: "10", unit: "ml", route: "IV" },
  ]);
  const [isManualMedicationInput, setIsManualMedicationInput] = useState(false);
  const [newDisease, setNewDisease] = useState({
    diseaseName: "",
    diagnosedDate: new Date().toISOString().split("T")[0],
    severity: "leve" as const,
    status: "en_tratamiento" as const,
    medicationsGiven: "",
    veterinarian: centerSettings?.veterinarianName || "Dr. Juan Pablo Morales (MVZ)",
    clinicalNotes: "",
  });

  // Estados para nuevo herraje
  const [isUpdatingFarrier, setIsUpdatingFarrier] = useState(false);
  const [farrierForm, setFarrierForm] = useState(() => ({
    lastShoeingDate: new Date().toISOString().split("T")[0],
    nextShoeingDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    shoeingType: "Herradura Lisa de Trabajo",
    farrierName: "Maestro Jairo Restrepo",
    cost: 150000,
    notes: "",
  }));

  // Estado para cambio de foto
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  // Sincronizar y limpiar estados de edición cuando se cambia de ejemplar o se cierra el modal
  useEffect(() => {
    setIsRestockingFeed(false);
    setIsEditingFeedConfig(false);
    setIsConfirmingEmergencySupply(false);
    setEmergencySupplySuccess(null);
    setIsEditingPedigree(false);
    setIsAddingDisease(false);
    setIsUpdatingFarrier(false);
    setIsEditingPhoto(false);
    setNewPhotoUrl("");
    setMedicationsList([{ id: `med-${Date.now()}`, name: "", dose: "10", unit: "ml", route: "IV" }]);
    setIsManualMedicationInput(false);
  }, [horse?.id, isOpen]);

  // Manejadores para la lista dinámica de medicamentos a suministrar
  const handleAddMedicationRow = () => {
    setMedicationsList((prev) => [
      ...prev,
      {
        id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: "",
        dose: "10",
        unit: "ml",
        route: "IV",
      },
    ]);
  };

  const handleRemoveMedicationRow = (id: string) => {
    if (medicationsList.length <= 1) return;
    setMedicationsList((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUpdateMedicationField = (
    id: string,
    field: keyof AdministeredMedicationItem,
    value: string
  ) => {
    setMedicationsList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleAddQuickMedication = (med: (typeof COMMON_EQUINE_MEDS)[number]) => {
    setMedicationsList((prev) => {
      const emptyIdx = prev.findIndex((m) => !m.name.trim());
      if (emptyIdx !== -1) {
        const copy = [...prev];
        copy[emptyIdx] = {
          ...copy[emptyIdx],
          name: med.name,
          dose: med.defaultDose,
          unit: med.unit,
          route: med.route,
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: med.name,
          dose: med.defaultDose,
          unit: med.unit,
          route: med.route,
        },
      ];
    });
  };

  const previewMedicationsSummary = medicationsList
    .filter((m) => m.name.trim().length > 0)
    .map((m) => {
      const doseStr = m.dose.trim() ? `${m.dose.trim()} ${m.unit}` : "";
      const routeStr = m.route ? `(${m.route})` : "";
      return [m.name.trim(), doseStr, routeStr].filter(Boolean).join(" ");
    })
    .join(" + ");

  if (!isOpen || !horse) return null;

  // Inicializar formularios al abrir o cambiar de caballo
  const startEditingPedigree = () => {
    setPedigreeForm(horse.pedigree || {});
    setIsEditingPedigree(true);
  };

  const handleSavePedigree = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePedigree(horse.id, pedigreeForm);
    setIsEditingPedigree(false);
  };

  const handleSaveDisease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisease.diseaseName.trim()) return;

    const finalMeds = isManualMedicationInput
      ? newDisease.medicationsGiven.trim()
      : previewMedicationsSummary || newDisease.medicationsGiven.trim() || "Tratamiento de soporte en box";

    if (!finalMeds) {
      alert("Por favor indique al menos un medicamento o tratamiento aplicado.");
      return;
    }

    onAddDisease(horse.id, {
      ...newDisease,
      medicationsGiven: finalMeds,
    });
    setIsAddingDisease(false);
    setNewDisease({
      diseaseName: "",
      diagnosedDate: new Date().toISOString().split("T")[0],
      severity: "leve",
      status: "en_tratamiento",
      medicationsGiven: "",
      veterinarian: centerSettings?.veterinarianName || "Dr. Juan Pablo Morales (MVZ)",
      clinicalNotes: "",
    });
    setMedicationsList([{ id: `med-${Date.now()}`, name: "", dose: "10", unit: "ml", route: "IV" }]);
    setIsManualMedicationInput(false);
  };

  const handleSaveFarrier = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFarrier(horse.id, farrierForm);
    setIsUpdatingFarrier(false);
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPhotoUrl.trim()) {
      onUpdatePhoto(horse.id, newPhotoUrl.trim());
      setIsEditingPhoto(false);
    }
  };

  // Cálculo de estado de herraje
  const today = new Date().toISOString().split("T")[0];
  const isFarrierOverdue = Boolean(
    horse.farrierControl && horse.farrierControl.nextShoeingDate < today
  );

  // Cálculo en vivo de agotamiento de alimento
  const feedCalc =
    horse.feedConfig?.feedProvidedBy === "propietario"
      ? calculateFeedDepletion(
          horse.feedConfig.totalKgSupplied,
          horse.feedConfig.dailyGrainKg,
          horse.feedConfig.startDate
        )
      : null;

  const isFeedLow = Boolean(feedCalc && feedCalc.daysRemaining <= 2);

  const ownerPhone = client?.phone || "";
  const ownerFullName = client?.fullName || horse.ownerName || "Propietario";

  const emergencyCost =
    horse.feedConfig?.emergencyRationCostCOP ||
    centerSettings?.defaultEmergencyRationCostCOP ||
    25000;

  const waFeedAlert =
    horse.feedConfig && feedCalc
      ? buildFeedWhatsAppUrl({
          horseName: horse.name,
          boxCode: horse.pesebreraCode,
          ownerName: ownerFullName,
          ownerPhone,
          feedConfig: horse.feedConfig,
          stableName: centerSettings?.stableName,
        })
      : null;

  const waEmergencyAlert =
    horse.feedConfig && feedCalc
      ? buildEmergencyRunoutWhatsAppUrl({
          horseName: horse.name,
          boxCode: horse.pesebreraCode,
          ownerName: ownerFullName,
          ownerPhone,
          feedConfig: horse.feedConfig,
          emergencyCostCOP: emergencyCost,
          stableName: centerSettings?.stableName,
        })
      : null;

  // Funciones auxiliares para editar la alimentación del caballo
  const startEditingFeedConfig = () => {
    if (horse.feedConfig) {
      setEditFeedProvidedBy(horse.feedConfig.feedProvidedBy || "propietario");
      setEditFeedType(horse.feedConfig.feedType || "simple");
      setEditFeedName(horse.feedConfig.feedName || "");
      setEditBagWeightKg(horse.feedConfig.bagWeightKg || 40);
      setEditBagsCount(horse.feedConfig.bagsCount || 1);
      setEditDailyGrainKg(horse.feedConfig.dailyGrainKg || 3.5);
      setEditDailyPortionsCount(horse.feedConfig.dailyPortionsCount || horse.dailyPortionsCount || 3);
      setEditEmergencyCostCOP(horse.feedConfig.emergencyRationCostCOP || 25000);
      setEditBlendIngredients(
        horse.feedConfig.blendIngredients && horse.feedConfig.blendIngredients.length > 0
          ? [...horse.feedConfig.blendIngredients]
          : [
              { id: "ing-1", name: "Concentrado Base", kg: 40 },
              { id: "ing-2", name: "Avena Rolada", kg: 15 },
            ]
      );
    } else {
      setEditFeedProvidedBy("propietario");
      setEditFeedType("simple");
      setEditFeedName("Concentrado Estándar (Bulto)");
      setEditBagWeightKg(40);
      setEditBagsCount(1);
      setEditDailyGrainKg(3.5);
      setEditEmergencyCostCOP(25000);
      setEditBlendIngredients([
        { id: "ing-1", name: "Concentrado Base", kg: 40 },
        { id: "ing-2", name: "Avena Rolada", kg: 15 },
      ]);
    }
    setEditResetStartDate(true);
    setIsEditingFeedConfig(true);
  };

  const handleAddEditIngredient = () => {
    setEditBlendIngredients([
      ...editBlendIngredients,
      { id: `ing-${Date.now()}`, name: "Nuevo Ingrediente (ej: Maíz)", kg: 5 },
    ]);
  };

  const handleRemoveEditIngredient = (id: string) => {
    if (editBlendIngredients.length <= 1) return;
    setEditBlendIngredients(editBlendIngredients.filter((i) => i.id !== id));
  };

  const handleUpdateEditIngredient = (
    id: string,
    field: "name" | "kg",
    value: string | number
  ) => {
    setEditBlendIngredients(
      editBlendIngredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };

  // Kilos totales calculados en vivo para la edición
  const editTotalKg =
    editFeedType === "simple"
      ? editBagWeightKg * editBagsCount
      : editBlendIngredients.reduce((acc, curr) => acc + (Number(curr.kg) || 0), 0);

  const editSafeDailyKg = editDailyGrainKg > 0 ? editDailyGrainKg : 1;
  const editDaysDuration = Math.max(1, Math.floor(editTotalKg / editSafeDailyKg));

  const handleSaveFeedConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split("T")[0];
    const startDate = editResetStartDate
      ? todayStr
      : horse.feedConfig?.startDate || todayStr;
    const startTime = new Date(startDate).getTime();
    const depletionTime = startTime + editDaysDuration * 24 * 60 * 60 * 1000;
    const depletionDate = new Date(depletionTime).toISOString().split("T")[0];
    const alertDate = new Date(depletionTime - 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const updatedConfig: HorseDietFeedConfig = {
      feedProvidedBy: editFeedProvidedBy,
      feedType: editFeedType,
      feedName:
        editFeedName.trim() ||
        (editFeedType === "mezcla" ? "Mezcla Personalizada" : "Concentrado Estándar"),
      bagWeightKg: editFeedType === "simple" ? editBagWeightKg : undefined,
      bagsCount: editFeedType === "simple" ? editBagsCount : undefined,
      blendIngredients: editFeedType === "mezcla" ? editBlendIngredients : [],
      totalKgSupplied: editTotalKg,
      dailyGrainKg: editSafeDailyKg,
      dailyPortionsCount: editDailyPortionsCount,
      emergencyRationCostCOP: editEmergencyCostCOP,
      startDate,
      depletionDate,
      alertDate,
      lastRestockedDate: todayStr,
      restockHistory: [
        {
          id: `rst-${Date.now()}`,
          date: todayStr,
          kgAdded: editTotalKg,
          notes: `Actualización de dieta a: ${
            editFeedType === "mezcla" ? "Mezcla Compuesta" : "Bulto Simple"
          } (${editTotalKg} kg totales)`,
          recordedBy: "Administración / Mayordomo",
        },
        ...(horse.feedConfig?.restockHistory || []),
      ],
    };

    if (onUpdateFeedConfig) {
      onUpdateFeedConfig(horse.id, updatedConfig);
    }
    setIsEditingFeedConfig(false);
  };

  const handleExecuteEmergencySupply = () => {
    const dailyKg = horse.feedConfig?.dailyGrainKg || 3.5;
    const cost = emergencyCost;
    if (onSupplyEmergencyFeed) {
      onSupplyEmergencyFeed(horse.id, cost, dailyKg);
    } else if (onRestockFeed) {
      onRestockFeed(
        horse.id,
        dailyKg,
        `Ración diaria de emergencia suministrada por el criadero (${dailyKg} kg). Cobro de $${cost.toLocaleString("es-CO")} generado a la cuenta del propietario.`
      );
    }
    setIsConfirmingEmergencySupply(false);
    setEmergencySupplySuccess(
      `¡Ración de emergencia (${dailyKg} kg) suministrada con éxito! Se cargó $${cost.toLocaleString(
        "es-CO"
      )} COP a la cuenta de ${ownerFullName}.`
    );
    setTimeout(() => setEmergencySupplySuccess(null), 6000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        {/* Cabecera con Foto / Avatar y Datos Básicos */}
        <div className="relative bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-950 p-5 sm:p-6 text-white flex-shrink-0 space-y-4">
          {/* Fila superior: Badges y Botones de Acción (completamente separados sin superposición) */}
          <div className="flex items-start justify-between gap-3">
            {/* Badges informativos */}
            <div className="flex items-center gap-2 flex-wrap min-w-0 pr-2">
              <span className="text-xs uppercase font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {horse.pesebreraCode || "Sin Pesebrera"}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300">
                {horse.breed}
              </span>
              {horse.planName && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/25 text-emerald-200 border border-emerald-400/40">
                  🏷️ {horse.planName}
                  {horse.planPriceCOP && (
                    <span className="ml-1 text-emerald-300 font-bold">
                      (${new Intl.NumberFormat("es-CO").format(horse.planPriceCOP)}/mes)
                    </span>
                  )}
                </span>
              )}
              {feedCalc && isFeedLow && (
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 animate-pulse ${
                    feedCalc.daysRemaining <= 0
                      ? "bg-rose-600 text-white border-rose-700 shadow-md font-black"
                      : "bg-rose-500/30 text-rose-200 border border-rose-400/50"
                  }`}
                >
                  {feedCalc.daysRemaining <= 0
                    ? "🚨 Alimento: Agotado (Día Cero)"
                    : `🌾 Alimento: ${feedCalc.daysRemaining}d restantes`}
                </span>
              )}
              {horse.pedigree?.registryNumber && (
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/10 text-stone-300">
                  Reg: {horse.pedigree.registryNumber}
                </span>
              )}
            </div>

            {/* Botones de acción alineados sin encimarse */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {currentUserRole === "admin" && onRetireHorse ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRetireHorse(horse);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/25 hover:bg-rose-500/35 text-rose-200 border border-rose-400/40 text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap"
                  title="Retirar o dar de baja este ejemplar (Solo Super Administrador)"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dar de Baja</span>
                </button>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/80 border border-stone-700/60 text-stone-300 text-xs font-semibold shadow-xs"
                  title="Baja bloqueada: Solo el perfil de Super Administrador puede eliminar o retirar la ficha técnica de un ejemplar"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-[11px]">Baja protegida (Solo Super Admin)</span>
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cuerpo principal de la cabecera: Foto + Nombre + Datos */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Foto del ejemplar */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-xl bg-stone-800 flex items-center justify-center flex-shrink-0">
                {horse.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={horse.imageUrl}
                    alt={horse.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="text-4xl">🐎</span>
                )}
              </div>
              <label
                htmlFor={`photo-upload-${horse.id}`}
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white shadow-md text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Subir foto desde galería o archivo"
              >
                <Camera className="w-4 h-4" />
                <input
                  id={`photo-upload-${horse.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === "string") {
                          onUpdatePhoto(horse.id, reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            {/* Datos principales */}
            <div className="text-center sm:text-left space-y-1.5 flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight truncate">{horse.name}</h2>

              <p className="text-xs text-stone-300">
                {horse.gender.toUpperCase()} • Capa: {horse.coatColor} • {horse.ageYears} años •{" "}
                Propietario: <strong className="text-white">{horse.ownerName}</strong>
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => downloadWordHorsePassport(horse, client, vetRecords, centerSettings)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                  title="Descargar Pasaporte Sanitario Oficial en Microsoft Word (.doc)"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-100" />
                  <span>Pasaporte Sanitario (.doc)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Formulario desplegable para cambiar foto */}
          {isEditingPhoto && (
            <form onSubmit={handleSavePhoto} className="mt-4 pt-3 border-t border-white/10 flex gap-2">
              <input
                type="url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="Pega la URL de la foto del ejemplar (ej: https://...)..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              <Button type="submit" size="sm" className="h-8 text-xs cursor-pointer">
                Actualizar Foto
              </Button>
            </form>
          )}
        </div>

        {/* Pestañas de la Ficha Técnica */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 px-4 sm:px-6 overflow-x-auto scrollbar-none flex-shrink-0">
          {[
            { id: "pedigri", label: "Pedigrí & Genealogía", icon: Award },
            {
              id: "enfermedades",
              label: `Historial Clínico (${horse.diseaseHistory?.length || 0})`,
              icon: HeartPulse,
            },
            {
              id: "herraje",
              label: "Control de Herraje",
              icon: Wrench,
              alert: isFarrierOverdue,
            },
            ...(currentUserRole !== "veterinario"
              ? [
                  {
                    id: "alimento",
                    label:
                      horse.feedConfig?.feedProvidedBy === "propietario"
                        ? `Alimento Propio (${
                            feedCalc
                              ? feedCalc.daysRemaining <= 0
                                ? "¡Agotado!"
                                : `${feedCalc.daysRemaining}d`
                              : "?"
                          })`
                        : "Alimento & Dieta",
                    icon: Wheat,
                    alert: isFeedLow,
                  },
                ]
              : []),
            { id: "general", label: "Ficha General", icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-emerald-700 text-emerald-800 dark:text-emerald-400 bg-white dark:bg-stone-900"
                    : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.alert && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Contenido de la Ficha */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* ================================================================= */}
          {/* 1. SECCIÓN: PEDIGRÍ / GENEALOGÍA */}
          {/* ================================================================= */}
          {activeTab === "pedigri" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    Árbol Genealógico y Linaje de Sangre
                  </h3>
                  <p className="text-xs text-stone-500">
                    Registro de ascendencia paterna y materna del ejemplar
                  </p>
                </div>
                {!isEditingPedigree && (
                  <button
                    onClick={startEditingPedigree}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200 transition-colors cursor-pointer"
                  >
                    {horse.pedigree?.sire ? "Editar Pedigrí" : "+ Registrar Pedigrí"}
                  </button>
                )}
              </div>

              {!isEditingPedigree ? (
                horse.pedigree && (horse.pedigree.sire || horse.pedigree.dam) ? (
                  <div className="space-y-4">
                    {/* Tarjeta de Criadero y Registro */}
                    <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-stone-500 block">Criadero de Origen:</span>
                        <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                          {horse.pedigree.breedingFarm || "No especificado"}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Libro / Número de Registro:</span>
                        <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">
                          {horse.pedigree.registryNumber || "En trámite"}
                        </span>
                      </div>
                    </div>

                    {/* Árbol Genealógico Visual */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Lado Paterno */}
                      <div className="border border-stone-200 dark:border-stone-800 rounded-2xl p-4 bg-stone-50/50 dark:bg-stone-800/20 space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 block border-b pb-1">
                          ♂ Línea Paterna (Padre)
                        </span>
                        <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-sky-100 dark:border-sky-900/40 shadow-xs">
                          <span className="text-[10px] text-stone-400 uppercase font-semibold">Padre</span>
                          <p className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                            {horse.pedigree.sire || "Desconocido"}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800">
                            <span className="text-[10px] text-stone-400 block">Abuelo Paterno</span>
                            <span className="font-semibold text-stone-800 dark:text-stone-200">
                              {horse.pedigree.grandSirePaternal || "—"}
                            </span>
                          </div>
                          <div className="p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800">
                            <span className="text-[10px] text-stone-400 block">Abuela Paterna</span>
                            <span className="font-semibold text-stone-800 dark:text-stone-200">
                              {horse.pedigree.grandDamPaternal || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Lado Materno */}
                      <div className="border border-stone-200 dark:border-stone-800 rounded-2xl p-4 bg-stone-50/50 dark:bg-stone-800/20 space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block border-b pb-1">
                          ♀ Línea Materna (Madre)
                        </span>
                        <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-rose-100 dark:border-rose-900/40 shadow-xs">
                          <span className="text-[10px] text-stone-400 uppercase font-semibold">Madre</span>
                          <p className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                            {horse.pedigree.dam || "Desconocida"}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800">
                            <span className="text-[10px] text-stone-400 block">Abuelo Materno</span>
                            <span className="font-semibold text-stone-800 dark:text-stone-200">
                              {horse.pedigree.grandSireMaternal || "—"}
                            </span>
                          </div>
                          <div className="p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800">
                            <span className="text-[10px] text-stone-400 block">Abuela Materna</span>
                            <span className="font-semibold text-stone-800 dark:text-stone-200">
                              {horse.pedigree.grandDamMaternal || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-stone-50 dark:bg-stone-800/30 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-6 space-y-3">
                    <span className="text-3xl">📜</span>
                    <p className="text-stone-600 dark:text-stone-400 font-medium">
                      Este ejemplar aún no tiene registrado su árbol genealógico.
                    </p>
                    <Button onClick={startEditingPedigree} size="sm" className="gap-1.5 cursor-pointer">
                      <Plus className="w-4 h-4" />
                      Registrar Pedigrí Ahora
                    </Button>
                  </div>
                )
              ) : (
                /* Formulario de Edición de Pedigrí */
                <form onSubmit={handleSavePedigree} className="space-y-4 bg-stone-50 dark:bg-stone-800/40 p-5 rounded-2xl border border-stone-200 dark:border-stone-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Nombre del Padre (Sire)</label>
                      <input
                        type="text"
                        value={pedigreeForm.sire || ""}
                        onChange={(e) => setPedigreeForm({ ...pedigreeForm, sire: e.target.value })}
                        placeholder="ej: Dulce Sueño de Lusitania"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Nombre de la Madre (Dam)</label>
                      <input
                        type="text"
                        value={pedigreeForm.dam || ""}
                        onChange={(e) => setPedigreeForm({ ...pedigreeForm, dam: e.target.value })}
                        placeholder="ej: Silueta de La Alhambra"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Abuelo Paterno</label>
                      <input
                        type="text"
                        value={pedigreeForm.grandSirePaternal || ""}
                        onChange={(e) =>
                          setPedigreeForm({ ...pedigreeForm, grandSirePaternal: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Abuela Paterna</label>
                      <input
                        type="text"
                        value={pedigreeForm.grandDamPaternal || ""}
                        onChange={(e) =>
                          setPedigreeForm({ ...pedigreeForm, grandDamPaternal: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Abuelo Materno</label>
                      <input
                        type="text"
                        value={pedigreeForm.grandSireMaternal || ""}
                        onChange={(e) =>
                          setPedigreeForm({ ...pedigreeForm, grandSireMaternal: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Abuela Materna</label>
                      <input
                        type="text"
                        value={pedigreeForm.grandDamMaternal || ""}
                        onChange={(e) =>
                          setPedigreeForm({ ...pedigreeForm, grandDamMaternal: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Criadero de Origen</label>
                      <input
                        type="text"
                        value={pedigreeForm.breedingFarm || ""}
                        onChange={(e) =>
                          setPedigreeForm({ ...pedigreeForm, breedingFarm: e.target.value })
                        }
                        placeholder="ej: Criadero San Isidro"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Registro Federado / Pasaporte</label>
                      <input
                        type="text"
                        value={pedigreeForm.registryNumber || ""}
                        onChange={(e) =>
                          setPedigreeForm({ ...pedigreeForm, registryNumber: e.target.value })
                        }
                        placeholder="ej: FED-PFC-88421"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingPedigree(false)}
                      className="cursor-pointer"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm" className="cursor-pointer">
                      Guardar Pedigrí
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 2. SECCIÓN: HISTORIAL DE ENFERMEDADES EN PESEBRERA */}
          {/* ================================================================= */}
          {activeTab === "enfermedades" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-rose-600" />
                    Historial de Enfermedades y Cuidados en la Pesebrera
                  </h3>
                  <p className="text-xs text-stone-500">
                    Registro de afecciones, diagnósticos, evolución y medicamentos administrados
                  </p>
                </div>
                {!isAddingDisease && (
                  <Button
                    size="sm"
                    onClick={() => setIsAddingDisease(true)}
                    className="gap-1.5 cursor-pointer text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Registrar Afección
                  </Button>
                )}
              </div>

              {isAddingDisease && (
                <form
                  onSubmit={handleSaveDisease}
                  className="bg-stone-50 dark:bg-stone-800/40 p-5 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3 text-xs animate-fade-in"
                >
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    Nueva Afección / Tratamiento en Pesebrera
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Diagnóstico / Enfermedad *</label>
                      <input
                        type="text"
                        required
                        value={newDisease.diseaseName}
                        onChange={(e) =>
                          setNewDisease({ ...newDisease, diseaseName: e.target.value })
                        }
                        placeholder="ej: Cólico Espasmódico, Herida en Nudo..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Fecha de Diagnóstico</label>
                      <input
                        type="date"
                        value={newDisease.diagnosedDate}
                        onChange={(e) =>
                          setNewDisease({ ...newDisease, diagnosedDate: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Severidad</label>
                      <select
                        value={newDisease.severity}
                        onChange={(e) =>
                          setNewDisease({
                            ...newDisease,
                            severity: e.target.value as typeof newDisease.severity,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      >
                        <option value="leve">Leve</option>
                        <option value="moderada">Moderada</option>
                        <option value="grave">Grave</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Estado</label>
                      <select
                        value={newDisease.status}
                        onChange={(e) =>
                          setNewDisease({
                            ...newDisease,
                            status: e.target.value as typeof newDisease.status,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      >
                        <option value="en_tratamiento">En tratamiento activo</option>
                        <option value="resuelto">Resuelto / Recuperado</option>
                        <option value="cronico">Condición crónica</option>
                      </select>
                    </div>
                  </div>

                  {/* Sección de Medicamentos con soporte para múltiples fármacos y botón 'ml' */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <label className="block font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                          <Pill className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          Medicamentos Suministrados *
                        </label>
                        <p className="text-[11px] text-stone-500">
                          Registra uno o varios medicamentos aplicados. Presiona el botón <strong className="text-emerald-600 dark:text-emerald-400 font-bold">ml</strong> para asignar mililitros con 1 clic.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsManualMedicationInput(!isManualMedicationInput)}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                      >
                        {isManualMedicationInput ? "← Usar selector múltiple" : "Modo texto libre"}
                      </button>
                    </div>

                    {!isManualMedicationInput ? (
                      <div className="space-y-2.5 bg-stone-100/70 dark:bg-stone-900/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-800">
                        {/* Chips de selección rápida de fármacos frecuentes */}
                        <div className="flex items-center gap-1.5 flex-wrap pb-1">
                          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1">
                            <Syringe className="w-3 h-3 text-emerald-600" /> Frecuentes:
                          </span>
                          {COMMON_EQUINE_MEDS.slice(0, 6).map((med) => (
                            <button
                              key={med.name}
                              type="button"
                              onClick={() => handleAddQuickMedication(med)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white dark:bg-stone-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 transition-all cursor-pointer shadow-2xs"
                              title={`Agregar ${med.name} (${med.defaultDose} ${med.unit} ${med.route})`}
                            >
                              + {med.name}
                            </button>
                          ))}
                        </div>

                        {/* Filas dinámicas de medicamentos */}
                        <div className="space-y-2">
                          {medicationsList.map((item, idx) => (
                            <div
                              key={item.id}
                              className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-700/80 shadow-2xs space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                                  <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  Medicamento #{idx + 1}
                                </span>

                                {medicationsList.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMedicationRow(item.id)}
                                    className="p-1 text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="Eliminar este medicamento"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                {/* Nombre del medicamento */}
                                <div className="sm:col-span-6">
                                  <input
                                    type="text"
                                    list="equine-meds-datalist"
                                    placeholder="Nombre del medicamento (ej: Flunixin Meglumine)"
                                    value={item.name}
                                    required={idx === 0 && !isManualMedicationInput}
                                    onChange={(e) =>
                                      handleUpdateMedicationField(item.id, "name", e.target.value)
                                    }
                                    className="w-full px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                  />
                                </div>

                                {/* Dosis + Botón 'ml' al lado + Selector de unidad */}
                                <div className="sm:col-span-3 flex items-center gap-1">
                                  <input
                                    type="text"
                                    placeholder="Dosis"
                                    value={item.dose}
                                    onChange={(e) =>
                                      handleUpdateMedicationField(item.id, "dose", e.target.value)
                                    }
                                    className="w-16 sm:w-20 px-2 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 text-xs text-center font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                  />

                                  {/* Botón explícito de ml al lado */}
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateMedicationField(item.id, "unit", "ml")}
                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                      item.unit === "ml"
                                        ? "bg-emerald-600 text-white border border-emerald-500 ring-2 ring-emerald-500/30"
                                        : "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 hover:bg-stone-300 dark:hover:bg-stone-700"
                                    }`}
                                    title="Fijar unidad en mililitros (ml)"
                                  >
                                    ml
                                  </button>

                                  {/* Selector de unidad alterna */}
                                  <select
                                    value={item.unit}
                                    onChange={(e) =>
                                      handleUpdateMedicationField(item.id, "unit", e.target.value)
                                    }
                                    className="px-1.5 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 text-[11px] text-stone-700 dark:text-stone-300 outline-none"
                                    title="Unidad de medida"
                                  >
                                    <option value="ml">ml</option>
                                    <option value="mg">mg</option>
                                    <option value="cm³">cm³</option>
                                    <option value="g">g</option>
                                    <option value="dosis">dosis</option>
                                    <option value="ampolla">ampolla</option>
                                    <option value="frasco">frasco</option>
                                    <option value="tabletas">tab</option>
                                  </select>
                                </div>

                                {/* Vía de administración */}
                                <div className="sm:col-span-3">
                                  <select
                                    value={item.route}
                                    onChange={(e) =>
                                      handleUpdateMedicationField(item.id, "route", e.target.value)
                                    }
                                    className="w-full px-2 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 outline-none"
                                    title="Vía de administración"
                                  >
                                    <option value="IV">IV (Intravenosa)</option>
                                    <option value="IM">IM (Intramuscular)</option>
                                    <option value="Oral">Oral (PO)</option>
                                    <option value="SC">SC (Subcutánea)</option>
                                    <option value="Tópica">Tópica</option>
                                    <option value="Intraarticular">Intraarticular</option>
                                    <option value="Oftálmica">Oftálmica</option>
                                    <option value="Infiltración">Infiltración</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Datalist con opciones sugeridas para autocompletado rápido */}
                        <datalist id="equine-meds-datalist">
                          {COMMON_EQUINE_MEDS.map((med) => (
                            <option key={med.name} value={med.name} />
                          ))}
                        </datalist>

                        {/* Botón para agregar otro medicamento y previsualización */}
                        <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleAddMedicationRow}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-emerald-600/60 dark:border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-xs font-bold transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            + Agregar otro medicamento
                          </button>

                          {previewMedicationsSummary && (
                            <div className="text-[11px] text-stone-600 dark:text-stone-400 font-medium truncate max-w-full sm:max-w-xs bg-white dark:bg-stone-900 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 shadow-2xs">
                              <span className="text-emerald-600 font-bold">Aplicando:</span>{" "}
                              {previewMedicationsSummary}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        required
                        value={newDisease.medicationsGiven}
                        onChange={(e) =>
                          setNewDisease({ ...newDisease, medicationsGiven: e.target.value })
                        }
                        placeholder="ej: Flunixin Meglumine 10ml IV + Suero electrolítico 1000ml..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Veterinario a Cargo</label>
                      <input
                        type="text"
                        value={newDisease.veterinarian}
                        onChange={(e) =>
                          setNewDisease({ ...newDisease, veterinarian: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Notas de Evolución Clínica</label>
                      <input
                        type="text"
                        value={newDisease.clinicalNotes}
                        onChange={(e) =>
                          setNewDisease({ ...newDisease, clinicalNotes: e.target.value })
                        }
                        placeholder="ej: Buena respuesta al tratamiento tras 12 horas..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingDisease(false)}
                      className="cursor-pointer"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm" className="cursor-pointer">
                      Guardar en Historial
                    </Button>
                  </div>
                </form>
              )}

              {/* Guías Médicas de Continuación Activas en Box */}
              {(() => {
                const continuationTreatments = (vetRecords || []).filter(
                  (r) => r.horseId === horse.id && r.status === "completado" && (r.medicationContinues || r.continuationGuide)
                );
                if (continuationTreatments.length === 0) return null;
                return (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                        Guías Médicas de Continuación Activas en Box ({continuationTreatments.length})
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {continuationTreatments.map((rec) => (
                        <div
                          key={`cont-${rec.id}`}
                          className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 shadow-xs space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase block">
                                Tratamiento clínico cerrado • Medicación ambulatoria en box
                              </span>
                              <h5 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                                {rec.continuationGuide?.medicationName || rec.title}
                              </h5>
                              <span className="text-xs text-stone-500">
                                Diagnóstico: {rec.diagnosis || rec.title} • Indicado por: {rec.administeredBy}
                              </span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/80 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                              {rec.continuationGuide?.durationDays ? `${rec.continuationGuide.durationDays} días` : "Pauta activa"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                            <div>
                              <span className="text-[10px] font-bold text-stone-500 block uppercase">Posología / Dosis:</span>
                              <span className="font-bold text-stone-800 dark:text-stone-200">{rec.continuationGuide?.dosage || rec.dosage || "—"}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-stone-500 block uppercase">Vía & Frecuencia:</span>
                              <span className="font-bold text-stone-800 dark:text-stone-200">
                                {rec.continuationGuide?.route ? `${rec.continuationGuide.route} • ` : ""}{rec.continuationGuide?.frequency || "1 vez al día"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-stone-500 block uppercase">Responsable:</span>
                              <span className="font-bold text-stone-800 dark:text-stone-200 capitalize">{rec.continuationGuide?.responsibleRole || "Palafrenero"}</span>
                            </div>
                          </div>

                          {rec.continuationGuide?.instructions && (
                            <div className="bg-white/90 dark:bg-stone-900/90 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-stone-700 dark:text-stone-300">
                              <strong className="text-amber-900 dark:text-amber-300 font-bold block mb-0.5">Indicaciones de Manejo en Cuadra:</strong>
                              <p>{rec.continuationGuide.instructions}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Lista Cronológica */}
              {horse.diseaseHistory && horse.diseaseHistory.length > 0 ? (
                <div className="space-y-3">
                  {horse.diseaseHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                              {item.diseaseName}
                            </h4>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                item.severity === "grave"
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  : item.severity === "moderada"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              }`}
                            >
                              {item.severity}
                            </span>
                          </div>
                          <span className="text-xs text-stone-500">
                            Diagnosticado: {item.diagnosedDate}
                            {item.resolutionDate && ` • Resuelto: ${item.resolutionDate}`}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            item.status === "resuelto"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                          }`}
                        >
                          {item.status === "resuelto" ? "✓ Resuelto" : "En tratamiento"}
                        </span>
                      </div>

                      <div className="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl text-xs space-y-1">
                        <p className="text-stone-700 dark:text-stone-300">
                          <span className="font-semibold">Medicamentos aplicados:</span>{" "}
                          {item.medicationsGiven}
                        </p>
                        <p className="text-stone-500">
                          Veterinario responsable:{" "}
                          <span className="font-medium text-stone-700 dark:text-stone-300">
                            {item.veterinarian}
                          </span>
                        </p>
                        {item.clinicalNotes && (
                          <p className="text-stone-500 italic mt-1">&ldquo;{item.clinicalNotes}&rdquo;</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-stone-50 dark:bg-stone-800/30 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-6 space-y-2">
                  <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
                  <p className="text-stone-700 dark:text-stone-300 font-semibold">
                    Sin antecedentes de enfermedades durante su estadía
                  </p>
                  <p className="text-xs text-stone-500">
                    El ejemplar ha mantenido un estado de salud óptimo sin afecciones reportadas.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. SECCIÓN: CONTROL DE HERRAJE */}
          {/* ================================================================= */}
          {activeTab === "herraje" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-amber-600" />
                    Control y Cronograma de Herraje
                  </h3>
                  <p className="text-xs text-stone-500">
                    Ciclo periódico de herraduras, aplomos y salud podal
                  </p>
                </div>
                {!isUpdatingFarrier && (
                  <Button
                    size="sm"
                    onClick={() => setIsUpdatingFarrier(true)}
                    className="gap-1.5 cursor-pointer text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Registrar Nuevo Herraje
                  </Button>
                )}
              </div>

              {isUpdatingFarrier && (
                <form
                  onSubmit={handleSaveFarrier}
                  className="bg-stone-50 dark:bg-stone-800/40 p-5 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3 text-xs animate-fade-in"
                >
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    Registrar Mantenimiento / Cambio de Herraduras
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Fecha de Herraje Realizado</label>
                      <input
                        type="date"
                        value={farrierForm.lastShoeingDate}
                        onChange={(e) =>
                          setFarrierForm({ ...farrierForm, lastShoeingDate: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Próximo Herraje Programado</label>
                      <input
                        type="date"
                        value={farrierForm.nextShoeingDate}
                        onChange={(e) =>
                          setFarrierForm({ ...farrierForm, nextShoeingDate: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Tipo de Herradura / Trabajo</label>
                      <select
                        value={farrierForm.shoeingType}
                        onChange={(e) =>
                          setFarrierForm({ ...farrierForm, shoeingType: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      >
                        <option value="Herradura Lisa de Pista">Herradura Lisa de Pista</option>
                        <option value="Herradura de Trabajo con Ranura">
                          Herradura de Trabajo con Ranura
                        </option>
                        <option value="Herradura Ortopédica con Cuña (3°)">
                          Herradura Ortopédica con Cuña (3°)
                        </option>
                        <option value="Herradura Barshoe (Barra Cerrada)">
                          Herradura Barshoe (Barra Cerrada)
                        </option>
                        <option value="Herraduras de Aluminio para Deporte">
                          Herraduras de Aluminio para Deporte
                        </option>
                        <option value="Recorte Natural / Desvasado">
                          Recorte Natural / Desvasado
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Nombre del Maestro Herrador</label>
                      <input
                        type="text"
                        value={farrierForm.farrierName}
                        onChange={(e) =>
                          setFarrierForm({ ...farrierForm, farrierName: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Observaciones del Casco</label>
                    <input
                      type="text"
                      value={farrierForm.notes}
                      onChange={(e) =>
                        setFarrierForm({ ...farrierForm, notes: e.target.value })
                      }
                      placeholder="ej: Buena hidratación, aplomos nivelados..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsUpdatingFarrier(false)}
                      className="cursor-pointer"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm" className="cursor-pointer">
                      Guardar Control de Herraje
                    </Button>
                  </div>
                </form>
              )}

              {/* Tarjeta de Estado de Herraje Actual */}
              {horse.farrierControl ? (
                <div className="space-y-4">
                  <div
                    className={`p-5 rounded-2xl border ${
                      isFarrierOverdue
                        ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
                        : "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isFarrierOverdue ? (
                          <AlertTriangle className="w-5 h-5 text-rose-600" />
                        ) : (
                          <Check className="w-5 h-5 text-emerald-600" />
                        )}
                        <span className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                          {isFarrierOverdue ? "¡Herraje Vencido o Pendiente!" : "Herraje al Día"}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold">
                        Próxima fecha: {horse.farrierControl.nextShoeingDate}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-stone-500 block">Último Herraje:</span>
                        <span className="font-semibold text-stone-800 dark:text-stone-200">
                          {horse.farrierControl.lastShoeingDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Tipo Instalado:</span>
                        <span className="font-semibold text-stone-800 dark:text-stone-200">
                          {horse.farrierControl.shoeingType}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Herrador Responsable:</span>
                        <span className="font-semibold text-stone-800 dark:text-stone-200">
                          {horse.farrierControl.farrierName}
                        </span>
                      </div>
                    </div>

                    {horse.farrierControl.notes && (
                      <p className="mt-3 pt-2 border-t border-stone-200/60 dark:border-stone-800/60 text-xs italic text-stone-600 dark:text-stone-400">
                        &ldquo;{horse.farrierControl.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-stone-50 dark:bg-stone-800/30 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-6 space-y-2">
                  <Wrench className="w-8 h-8 text-amber-600 mx-auto" />
                  <p className="text-stone-600 dark:text-stone-400 font-medium">
                    Sin control de herraje registrado.
                  </p>
                  <Button
                    onClick={() => setIsUpdatingFarrier(true)}
                    size="sm"
                    className="gap-1.5 cursor-pointer"
                  >
                    Registrar Primer Herraje
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 4. SECCIÓN: FICHA GENERAL */}
          {/* ================================================================= */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                  <span className="text-xs text-stone-400 block">Pesebrera Asignada</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-400 text-sm">
                    {horse.pesebreraCode || "Sin asignar"}
                  </span>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                  <span className="text-xs text-stone-400 block">Propietario / Dueño</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    {horse.ownerName}
                  </span>
                </div>
              </div>

              {horse.microchip && (
                <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                  <span className="text-xs text-stone-400 block">Microchip de Identificación</span>
                  <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                    {horse.microchip}
                  </span>
                </div>
              )}

              {horse.dietNotes && (
                <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-1">
                  <span className="font-bold text-xs uppercase text-stone-500 tracking-wider">
                    Plan de Nutrición y Manejo Diario
                  </span>
                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                    {horse.dietNotes}
                  </p>
                </div>
              )}

              {/* Carné y Pasaporte Sanitario Oficial en Word */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                      Pasaporte Sanitario y Guía de Tránsito (.doc)
                    </h4>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md">
                    Descarga la certificación institucional en Word lista para imprimir con genealogía, vacunas, microchip, control de herraje y firma médico-veterinaria (COMVEZCOL).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadWordHorsePassport(horse, client, vetRecords, centerSettings)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer shadow-sm whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  Descargar Pasaporte Word
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 5. SECCIÓN: CONTROL DE ALIMENTO Y RACIONES */}
          {/* ================================================================= */}
          {activeTab === "alimento" && currentUserRole !== "veterinario" && (
            <div className="space-y-5 animate-fade-in">
              {/* Barra de cabecera de la sección */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                    <Wheat className="w-5 h-5 text-amber-600" />
                    <span>Control Nutricional & Alimento del Ejemplar</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    {horse.feedConfig?.feedProvidedBy === "propietario"
                      ? "Control de bultos del dueño, ración diaria, alertas de agotamiento y recargas."
                      : "Alimentación integral suministrada por el criadero desde bodega principal (Plan A)."}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {!isEditingFeedConfig && (
                    <button
                      type="button"
                      onClick={startEditingFeedConfig}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-stone-500" />
                      <span>Modificar Dieta</span>
                    </button>
                  )}

                  {horse.feedConfig?.feedProvidedBy === "propietario" && !isEditingFeedConfig && (
                    <button
                      type="button"
                      onClick={() => setIsRestockingFeed(!isRestockingFeed)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isRestockingFeed ? "Cerrar Recarga" : "Registrar Recarga (+ Bulto)"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Mensaje de éxito tras suministrar ración de emergencia */}
              {emergencySupplySuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{emergencySupplySuccess}</span>
                </div>
              )}

              {/* Cuadro de Confirmación para Suministrar Ración de Emergencia */}
              {isConfirmingEmergencySupply && (
                <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-400 dark:border-amber-700 space-y-3 animate-fade-in shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-xl shrink-0">
                        🥣
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-stone-900 dark:text-stone-100">
                          Confirmar Suministro de Ración de Emergencia del Criadero
                        </h4>
                        <p className="text-xs text-stone-600 dark:text-stone-400">
                          Se suministrarán <strong>{horse.feedConfig?.dailyGrainKg || 3.5} kg</strong> de concentrado hoy a <strong>{horse.name}</strong> y se generará un cobro pendiente de <strong>${emergencyCost.toLocaleString("es-CO")} COP</strong> en la cuenta de <strong>{ownerFullName}</strong>.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingEmergencySupply(false)}
                      className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingEmergencySupply(false)}
                      className="px-3 py-1.5 rounded-xl text-stone-600 dark:text-stone-400 text-xs font-semibold hover:bg-stone-200/50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteEmergencySupply}
                      className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black transition-colors shadow-xs cursor-pointer"
                    >
                      Confirmar Suministro y Cargar a Cuenta (${emergencyCost.toLocaleString("es-CO")})
                    </button>
                  </div>
                </div>
              )}

              {/* FORMULARIO DESPLEGABLE: CAMBIO / MODIFICACIÓN DE LA DIETA */}
              {isEditingFeedConfig ? (
                <form
                  onSubmit={handleSaveFeedConfig}
                  className="p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800/80 space-y-4 animate-fade-in"
                >
                  <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                        ⚙️
                      </div>
                      <div>
                        <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                          Modificar Dieta & Plan de Alimentación
                        </h4>
                        <p className="text-[11px] text-stone-600 dark:text-stone-400">
                          Ajusta el tipo de alimento, componentes de mezcla, ración diaria y tarifa de emergencia.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingFeedConfig(false)}
                      className="text-stone-400 hover:text-stone-600 text-xs font-bold cursor-pointer"
                    >
                      ✕ Cancelar
                    </button>
                  </div>

                  {/* Selector: ¿Quién provee el alimento? */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      className={`p-3 rounded-2xl border text-xs cursor-pointer flex items-center gap-2.5 transition-all ${
                        editFeedProvidedBy === "propietario"
                          ? "bg-white dark:bg-stone-900 border-amber-500 shadow-xs"
                          : "border-stone-200 dark:border-stone-800 hover:bg-white/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="feedProvidedBy"
                        value="propietario"
                        checked={editFeedProvidedBy === "propietario"}
                        onChange={() => setEditFeedProvidedBy("propietario")}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">
                          Alimento del Propietario (Bultos Propios)
                        </span>
                        <span className="text-[10px] text-stone-500">
                          El cliente trae su alimento; se calcula duración y se le avisa por WhatsApp.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-2xl border text-xs cursor-pointer flex items-center gap-2.5 transition-all ${
                        editFeedProvidedBy === "criadero"
                          ? "bg-white dark:bg-stone-900 border-emerald-500 shadow-xs"
                          : "border-stone-200 dark:border-stone-800 hover:bg-white/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="feedProvidedBy"
                        value="criadero"
                        checked={editFeedProvidedBy === "criadero"}
                        onChange={() => setEditFeedProvidedBy("criadero")}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">
                          Cubierto por Criadero (Plan A Integral)
                        </span>
                        <span className="text-[10px] text-stone-500">
                          El criadero suministra todas las raciones diarias desde bodega principal.
                        </span>
                      </div>
                    </label>
                  </div>

                  {editFeedProvidedBy === "propietario" && (
                    <>
                      {/* Tipo de Alimento: Simple vs Mezcla */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditFeedType("simple")}
                          className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                            editFeedType === "simple"
                              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                              : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800"
                          }`}
                        >
                          📦 Bulto Estándar (Único)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditFeedType("mezcla")}
                          className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                            editFeedType === "mezcla"
                              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                              : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800"
                          }`}
                        >
                          🥣 Mezcla / Compuesto Especial
                        </button>
                      </div>

                      {/* Nombre del Alimento */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                          Nombre del Concentrado / Mezcla
                        </label>
                        <input
                          type="text"
                          value={editFeedName}
                          onChange={(e) => setEditFeedName(e.target.value)}
                          placeholder={
                            editFeedType === "mezcla"
                              ? "ej: Mezcla Especial de Rendimiento (Pinta + Avena)"
                              : "ej: Concentrado Italcol Pinta Campeón"
                          }
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-medium"
                        />
                      </div>

                      {/* Configuración de Bulto Simple */}
                      {editFeedType === "simple" ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                              Peso por Bulto (kg)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={editBagWeightKg}
                              onChange={(e) => setEditBagWeightKg(Number(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                              Cantidad de Bultos
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={editBagsCount}
                              onChange={(e) => setEditBagsCount(Number(e.target.value) || 1)}
                              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-bold"
                            />
                          </div>
                        </div>
                      ) : (
                        /* Configuración de Mezcla Compuesta */
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                              Ingredientes del Compuesto y Pesaje (kg):
                            </span>
                            <button
                              type="button"
                              onClick={handleAddEditIngredient}
                              className="text-[11px] text-amber-700 dark:text-amber-400 font-extrabold hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Agregar Ingrediente</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {editBlendIngredients.map((ing) => (
                              <div key={ing.id} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={ing.name}
                                  onChange={(e) =>
                                    handleUpdateEditIngredient(ing.id, "name", e.target.value)
                                  }
                                  placeholder="ej: Italcol Pinta Campeón (40kg)"
                                  className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs"
                                />
                                <div className="w-24 relative flex items-center">
                                  <input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={ing.kg}
                                    onChange={(e) =>
                                      handleUpdateEditIngredient(
                                        ing.id,
                                        "kg",
                                        Number(e.target.value) || 0
                                      )
                                    }
                                    className="w-full pl-3 pr-7 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-bold"
                                  />
                                  <span className="absolute right-2.5 text-[10px] text-stone-400 font-bold pointer-events-none">
                                    kg
                                  </span>
                                </div>
                                {editBlendIngredients.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEditIngredient(ing.id)}
                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 cursor-pointer"
                                    title="Eliminar ingrediente"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ración Diaria & Costo de Emergencia */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                            Ración Diaria en Grano (kg/día) *
                          </label>
                          <input
                            type="number"
                            min="0.5"
                            step="0.1"
                            value={editDailyGrainKg}
                            onChange={(e) => setEditDailyGrainKg(Number(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-black text-amber-700 dark:text-amber-400"
                          />
                          <span className="text-[10px] text-stone-500">
                            ~{(editSafeDailyKg / 3).toFixed(2)} kg por toma (3 tomas/día)
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                            Costo Ración Emergencia ($ COP)
                          </label>
                          <input
                            type="number"
                            step="1000"
                            value={editEmergencyCostCOP}
                            onChange={(e) => setEditEmergencyCostCOP(Number(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-bold"
                          />
                          <span className="text-[10px] text-stone-500">
                            Cobro por día si el criadero suple el alimento
                          </span>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300">
                            Raciones Diarias Programadas
                          </label>
                          <div className="flex items-center gap-1.5">
                            {[2, 3, 4, 5, 6].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setEditDailyPortionsCount(num)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                  editDailyPortionsCount === num
                                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                    : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700"
                                }`}
                              >
                                {num} {num === 1 ? "ración" : "raciones"}
                              </button>
                            ))}
                          </div>
                          <span className="text-[10px] text-stone-500">
                            Generará: {Array.from({ length: editDailyPortionsCount }, (_, i) => `Ración ${i + 1}`).join(", ")}
                          </span>
                        </div>
                      </div>

                      {/* Checkbox para reiniciar fecha */}
                      <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={editResetStartDate}
                          onChange={(e) => setEditResetStartDate(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>Iniciar nuevo lote hoy (reinicia contador de días de duración)</span>
                      </label>

                      {/* Tarjeta de Proyección en Tiempo Real */}
                      <div className="p-3.5 rounded-2xl bg-amber-100/70 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-amber-950 dark:text-amber-200">
                          <span>📦 Stock Total a Suministrar:</span>
                          <span className="text-sm font-black">{editTotalKg} kg</span>
                        </div>
                        <div className="flex items-center justify-between text-stone-700 dark:text-stone-300 text-[11px]">
                          <span>⏳ Duración Proyectada:</span>
                          <span className="font-extrabold text-stone-900 dark:text-stone-100">
                            {editDaysDuration} días
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-stone-700 dark:text-stone-300 text-[11px]">
                          <span>📲 Alerta WhatsApp programada:</span>
                          <span className="font-bold text-amber-800 dark:text-amber-300">
                            2 días antes del agotamiento
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Botones de acción */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200 dark:border-amber-900">
                    <button
                      type="button"
                      onClick={() => setIsEditingFeedConfig(false)}
                      className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200/50 text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black transition-colors shadow-sm cursor-pointer"
                    >
                      Guardar Dieta Actualizada
                    </button>
                  </div>
                </form>
              ) : horse.feedConfig?.feedProvidedBy === "propietario" && feedCalc ? (
                <>
                  {/* ALERTA CRÍTICA: DÍA CERO / ALIMENTO AGOTADO */}
                  {feedCalc.daysRemaining <= 0 ? (
                    <div className="p-4 sm:p-5 rounded-3xl bg-rose-500/20 border-2 border-rose-600 text-rose-950 dark:text-rose-100 space-y-3 animate-fade-in shadow-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0 animate-pulse">
                            🚨
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                              Alerta Crítica — Día Cero / Alimento Agotado
                            </span>
                            <h4 className="font-black text-sm sm:text-base text-rose-950 dark:text-rose-100">
                              ¡Alimento Agotado! Raciones en Cero
                            </h4>
                            <p className="text-xs text-rose-900 dark:text-rose-300 mt-0.5 max-w-xl">
                              El alimento (<strong>{horse.feedConfig.feedName}</strong>) se agotó y no hay ingreso de reposición. Consulta a <strong>{ownerFullName}</strong> por WhatsApp si autoriza el suministro del criadero con cargo extra o si se mantiene a solo pasto.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                          {/* Botón WhatsApp de Emergencia */}
                          {waEmergencyAlert && (
                            <a
                              href={waEmergencyAlert.waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm font-black transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer text-center"
                              title="Abrir WhatsApp con mensaje de autorización de ración vs solo pasto"
                            >
                              <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                              <span>WhatsApp: Suministro vs Solo Pasto</span>
                            </a>
                          )}

                          {/* Botón Suministrar Ración de Emergencia */}
                          <button
                            type="button"
                            onClick={() => setIsConfirmingEmergencySupply(true)}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                          >
                            <Utensils className="w-4 h-4" />
                            <span>Suministrar Ración (${emergencyCost.toLocaleString("es-CO")})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : isFeedLow ? (
                    <div className="p-4 rounded-3xl bg-rose-500/15 border-2 border-rose-500/50 text-rose-900 dark:text-rose-200 space-y-3 animate-fade-in shadow-md">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                            ⚠️
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                              Alerta Proactiva (2 Días Antes)
                            </span>
                            <h4 className="font-black text-sm sm:text-base text-rose-950 dark:text-rose-100">
                              ¡Atención! Quedan {feedCalc.daysRemaining} {feedCalc.daysRemaining === 1 ? "día" : "días"} de alimento
                            </h4>
                            <p className="text-xs text-rose-800 dark:text-rose-300">
                              El alimento ({horse.feedConfig.feedName}) se agota el <strong>{feedCalc.depletionDate}</strong>.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Botón directo de WhatsApp Preventivo */}
                          {waFeedAlert && (
                            <a
                              href={waFeedAlert.waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm font-black transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                            >
                              <MessageCircle className="w-4 h-4 fill-white" />
                              <span>📲 Avisar al WhatsApp (2d antes)</span>
                            </a>
                          )}

                          {/* Botón alternativo WhatsApp Emergencia / Día Cero */}
                          {waEmergencyAlert && (
                            <a
                              href={waEmergencyAlert.waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all cursor-pointer"
                              title="Enviar consulta de autorización si no llevó el alimento a tiempo"
                            >
                              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                              <span>Alerta Día Cero</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-lg shadow-sm shrink-0">
                          🌾
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                            Alimento en Rango Adecuado
                          </h4>
                          <p className="text-xs text-stone-600 dark:text-stone-400">
                            Le restan aprox. <strong>{feedCalc.daysRemaining} días</strong> (~{feedCalc.kgRemaining} kg). La alerta de WhatsApp se disparará el <strong>{feedCalc.alertDate}</strong> (2 días antes).
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {waFeedAlert && (
                          <a
                            href={waFeedAlert.waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp Preventivo</span>
                          </a>
                        )}
                        {waEmergencyAlert && (
                          <a
                            href={waEmergencyAlert.waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                            title="Enviar formato de emergencia si el dueño no llevó el alimento a tiempo"
                          >
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                            <span>Alerta Agotado</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4 Métricas de Inventario y Consumo */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/80">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Stock Restante</span>
                      <span className="text-xl font-black text-stone-900 dark:text-stone-100 block mt-0.5">
                        ~{feedCalc.kgRemaining} kg
                      </span>
                      <span className="text-[10px] text-stone-500">de {horse.feedConfig.totalKgSupplied} kg cargados</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/80">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Ración Diaria</span>
                      <span className="text-xl font-black text-stone-900 dark:text-stone-100 block mt-0.5">
                        {horse.feedConfig.dailyGrainKg} kg
                      </span>
                      <span className="text-[10px] text-stone-500">~{(horse.feedConfig.dailyGrainKg / 3).toFixed(2)} kg x 3 tomas</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/80">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Días Restantes</span>
                      <span
                        className={`text-xl font-black block mt-0.5 ${
                          feedCalc.daysRemaining <= 0
                            ? "text-rose-600 dark:text-rose-400 animate-pulse font-black"
                            : feedCalc.daysRemaining <= 2
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {feedCalc.daysRemaining <= 0 ? "0 DÍAS (AGOTADO)" : `${feedCalc.daysRemaining} DÍAS`}
                      </span>
                      <span className="text-[10px] text-stone-500">duración total: {feedCalc.daysDuration}d</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/80">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Fecha Agotamiento</span>
                      <span className="text-sm font-black text-rose-700 dark:text-rose-400 block mt-1">
                        {feedCalc.depletionDate}
                      </span>
                      <span className="text-[10px] text-stone-500">alerta: {feedCalc.alertDate}</span>
                    </div>
                  </div>

                  {/* Barra de progreso de consumo */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-stone-600 dark:text-stone-400">Progreso de Consumo del Lote:</span>
                      <span className="font-extrabold text-stone-900 dark:text-stone-100">
                        {100 - feedCalc.percentageRemaining}% consumido ({feedCalc.percentageRemaining}% restante)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          feedCalc.daysRemaining <= 0
                            ? "bg-rose-600"
                            : feedCalc.daysRemaining <= 2
                            ? "bg-rose-500"
                            : feedCalc.daysRemaining <= 5
                            ? "bg-amber-500"
                            : "bg-emerald-600"
                        }`}
                        style={{ width: `${Math.max(5, feedCalc.percentageRemaining)}%` }}
                      />
                    </div>
                  </div>

                  {/* Composición de la Mezcla o Detalle del Bulto */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-xs sm:text-sm flex items-center gap-2">
                        <span>🌾</span>
                        <span>{horse.feedConfig.feedName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 uppercase">
                          {horse.feedConfig.feedType === "mezcla" ? "Compuesto / Mezcla" : "Bulto Sencillo"}
                        </span>
                      </h4>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                          <span>Ración emergencia: ${emergencyCost.toLocaleString("es-CO")} COP</span>
                        </span>
                      </div>
                    </div>

                    {/* Formulario desplegable para registrar nueva llegada de alimento */}
                    {isRestockingFeed && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-emerald-950 dark:text-emerald-200">
                            Registrar Ingreso de Alimento en Bodega:
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsRestockingFeed(false)}
                            className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
                          >
                            Cerrar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                              Kilos Recibidos (kg) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={restockKg}
                              onChange={(e) => setRestockKg(Number(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                              Observaciones / Proveedor
                            </label>
                            <input
                              type="text"
                              value={restockNotes}
                              onChange={(e) => setRestockNotes(e.target.value)}
                              placeholder="ej: Traído por el propietario en camioneta"
                              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-medium"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (restockKg > 0 && onRestockFeed) {
                              onRestockFeed(horse.id, restockKg, restockNotes);
                              setIsRestockingFeed(false);
                              setRestockNotes("");
                            }
                          }}
                          className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs transition-colors shadow-xs cursor-pointer"
                        >
                          Guardar Ingreso (+{restockKg} kg) y Reiniciar Contador de Días
                        </button>
                      </div>
                    )}

                    {/* Desglose de componentes si es mezcla */}
                    {horse.feedConfig.feedType === "mezcla" && horse.feedConfig.blendIngredients && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block">
                          Pesaje de Ingredientes en el Compuesto:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {horse.feedConfig.blendIngredients.map((ing) => (
                            <div
                              key={ing.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                            >
                              <span className="font-medium text-stone-800 dark:text-stone-200 truncate">
                                {ing.name}
                              </span>
                              <span className="font-extrabold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                                {ing.kg} kg
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Historial de Recargas y Raciones de Emergencia */}
                  {horse.feedConfig.restockHistory && horse.feedConfig.restockHistory.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                        Historial de Bultos / Entradas Registradas:
                      </span>
                      <div className="divide-y divide-stone-100 dark:divide-stone-800 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden bg-white dark:bg-stone-900">
                        {horse.feedConfig.restockHistory.map((log) => (
                          <div key={log.id} className="p-2.5 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-stone-900 dark:text-stone-100 block">
                                +{log.kgAdded} kg ingresados
                              </span>
                              <span className="text-[10px] text-stone-500">
                                {log.notes || "Recarga de alimento"} • {log.recordedBy || "Cuadras"}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-stone-400">
                              {log.date}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto text-2xl font-bold shadow-md">
                    👑
                  </div>
                  <div>
                    <h4 className="font-black text-stone-900 dark:text-stone-100 text-base">
                      Plan Integral Tipo A — Alimento Totalmente Cubierto
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto mt-1">
                      Este ejemplar está acogido a la modalidad integral donde el criadero suministra todas las raciones diarias de concentrado, forraje y heno desde la bodega principal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={startEditingFeedConfig}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Modificar Dieta / Asignar Bultos Propios</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
