"use client";

import React, { useState } from "react";
import {
  VeterinaryRecord,
  Horse,
  Client,
  UserRole,
  HorseHealthStatus,
  TreatmentType,
  TreatmentRoute,
  CompleteVeterinaryTreatmentOptions,
  VeterinaryContinuationGuide,
  CaseResolutionType,
} from "@/types";
import {
  HeartPulse,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Stethoscope,
  Pill,
  ShieldAlert,
  Search,
  Filter,
  Share2,
  Copy,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  User,
  Activity,
  Check,
  Syringe,
  FileCheck2,
  ClipboardList,
  FileText,
  AlertCircle,
  X,
  Edit3,
  RotateCcw,
  History,
  AlertOctagon,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { NewVeterinaryTreatmentModal } from "./NewVeterinaryTreatmentModal";
import { dataService } from "@/services";
import {
  TreatmentComplication,
  TreatmentEditLog,
  DiseaseSeverity,
  TreatmentStatus,
} from "@/types";

interface VeterinaryViewProps {
  records: VeterinaryRecord[];
  horses?: Horse[];
  clients?: Client[];
  currentUserRole?: UserRole;
  onAddRecord?: (
    record: Omit<VeterinaryRecord, "id" | "createdAt" | "updatedAt">,
    options?: {
      newHorseStatus?: HorseHealthStatus;
      chargeToOwner?: boolean;
      notifyOwner?: boolean;
    }
  ) => void;
  onUpdateRecord?: (
    recordId: string,
    updates: Partial<Omit<VeterinaryRecord, "id" | "createdAt">>,
    options?: {
      reason?: string;
      editedBy?: string;
      newHorseStatus?: HorseHealthStatus;
      notifyOwner?: boolean;
    }
  ) => void;
  onAddComplication?: (
    recordId: string,
    complication: Omit<TreatmentComplication, "id">
  ) => void;
  onReopenTreatment?: (
    recordId: string,
    reason?: string,
    reopenedBy?: string
  ) => void;
  onCompleteTreatment?: (
    recordId: string,
    options?: CompleteVeterinaryTreatmentOptions
  ) => void;
  onDeleteRecord?: (recordId: string) => void;
  onSelectHorse?: (horse: Horse) => void;
}

export function VeterinaryView({
  records,
  horses = [],
  clients = [],
  currentUserRole = "admin",
  onAddRecord,
  onUpdateRecord,
  onAddComplication,
  onReopenTreatment,
  onCompleteTreatment,
  onDeleteRecord,
  onSelectHorse,
}: VeterinaryViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "en_curso" | "completado" | "programado">("todos");
  const [typeFilter, setTypeFilter] = useState<"todos" | TreatmentType>("todos");
  const [selectedHorseFilter, setSelectedHorseFilter] = useState<string>("todos");

  // Estado para el modal de cierre / alta médica / medicación continua
  const [completingRecord, setCompletingRecord] = useState<VeterinaryRecord | null>(null);
  const [dischargeOutcome, setDischargeOutcome] = useState<"resuelto" | "medicacion_continua">("resuelto");
  const [dischargeNotes, setDischargeNotes] = useState("");
  const [restoreHealthToOptimo, setRestoreHealthToOptimo] = useState(true);
  const [targetHorseStatus, setTargetHorseStatus] = useState<HorseHealthStatus>("optimo");
  const [markDiseaseResolved, setMarkDiseaseResolved] = useState(true);

  // Estados para la guía de instrucciones de medicación continua
  const [continuationMedName, setContinuationMedName] = useState("");
  const [continuationDosage, setContinuationDosage] = useState("");
  const [continuationRoute, setContinuationRoute] = useState<TreatmentRoute>("oral");
  const [continuationFrequency, setContinuationFrequency] = useState("Cada 12 horas con el concentrado");
  const [continuationDurationDays, setContinuationDurationDays] = useState<number>(5);
  const [continuationInstructions, setContinuationInstructions] = useState("");
  const [continuationNextCheckDate, setContinuationNextCheckDate] = useState("");
  const [continuationResponsible, setContinuationResponsible] = useState<"palafrenero" | "mayordomo" | "propietario" | "veterinario" | "todos">("palafrenero");

  // Estados para Modificar Tratamiento (Programado al error humano y ajustes)
  const [editingRecord, setEditingRecord] = useState<VeterinaryRecord | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDiagnosis, setEditDiagnosis] = useState("");
  const [editSymptoms, setEditSymptoms] = useState("");
  const [editDosage, setEditDosage] = useState("");
  const [editRoute, setEditRoute] = useState<TreatmentRoute>("oral");
  const [editFrequency, setEditFrequency] = useState("");
  const [editDurationDays, setEditDurationDays] = useState<number>(5);
  const [editSeverity, setEditSeverity] = useState<DiseaseSeverity>("moderada");
  const [editAdministeredBy, setEditAdministeredBy] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNextDueDate, setEditNextDueDate] = useState("");
  const [editStatus, setEditStatus] = useState<TreatmentStatus>("en_curso");
  const [editCost, setEditCost] = useState<number>(0);
  const [editChargeToOwner, setEditChargeToOwner] = useState<boolean>(true);
  const [editStableCareInstructions, setEditStableCareInstructions] = useState("");
  const [editClinicalEvolutionNotes, setEditClinicalEvolutionNotes] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editHorseStatus, setEditHorseStatus] = useState<HorseHealthStatus | "no_cambiar">("no_cambiar");
  const [editNotifyOwner, setEditNotifyOwner] = useState(false);

  // Estados para Registrar Complicación / Fármaco de Rescate
  const [complicatingRecord, setComplicatingRecord] = useState<VeterinaryRecord | null>(null);
  const [compDate, setCompDate] = useState("");
  const [compTime, setCompTime] = useState("");
  const [compDescription, setCompDescription] = useState("");
  const [compActionTaken, setCompActionTaken] = useState("");
  const [compAdditionalMedication, setCompAdditionalMedication] = useState("");
  const [compNewSeverity, setCompNewSeverity] = useState<DiseaseSeverity>("grave");
  const [compAdditionalCost, setCompAdditionalCost] = useState<number>(0);
  const [compInstructionsForStables, setCompInstructionsForStables] = useState("");
  const [compRecordedBy, setCompRecordedBy] = useState("");
  const [compNotifyOwner, setCompNotifyOwner] = useState(true);

  // Estados para Reabrir Tratamiento
  const [reopeningRecord, setReopeningRecord] = useState<VeterinaryRecord | null>(null);
  const [reopenReason, setReopenReason] = useState("Reapertura por recaída / corrección de error en cierre prematuro");
  const [reopenRecordedBy, setReopenRecordedBy] = useState("");

  // Estado para ver Auditoría / Historial de Cambios
  const [viewingHistoryRecord, setViewingHistoryRecord] = useState<VeterinaryRecord | null>(null);

  // Estados para plegar / desplegar fichas clínicas ("pliegues más pequeños")
  const [expandedRecordIds, setExpandedRecordIds] = useState<Record<string, boolean>>({});

  const toggleExpandRecord = (id: string) => {
    setExpandedRecordIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleExpandAll = () => {
    const allExpanded = filteredRecords.length > 0 && filteredRecords.every((r) => expandedRecordIds[r.id]);
    const nextState: Record<string, boolean> = {};
    filteredRecords.forEach((r) => {
      nextState[r.id] = !allExpanded;
    });
    setExpandedRecordIds(nextState);
  };

  // Estados de feedback de copiado al portapapeles
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedGuideId, setCopiedGuideId] = useState<string | null>(null);

  const formatCOP = (val?: number) => {
    if (!val) return "—";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getTypeBadge = (type: VeterinaryRecord["type"]) => {
    const map = {
      medicamento: { label: "Tratamiento / Medicamento", color: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900" },
      vacuna: { label: "Vacuna", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900" },
      desparasitacion: { label: "Desparasitación", color: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-900" },
      herraje: { label: "Herraje Terapéutico", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900" },
      control: { label: "Control Clínico", color: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900" },
    };
    const item = map[type] || map.medicamento;
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${item.color}`}>
        {item.label}
      </span>
    );
  };

  const getSeverityBadge = (severity?: "leve" | "moderada" | "grave") => {
    if (!severity) return null;
    const map = {
      leve: { label: "Leve", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" },
      moderada: { label: "Moderada", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300" },
      grave: { label: "Grave / Urgente", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 animate-pulse" },
    };
    const s = map[severity];
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${s.color}`}>
        {s.label}
      </span>
    );
  };

  // Si records está vacío o no se ha sincronizado aún, recurrir al almacén local seguro
  const effectiveRecords = records && records.length > 0 ? records : dataService.getVeterinaryRecords();

  // Métricas rápidas
  const activeTreatmentsCount = effectiveRecords.filter((r) => r.status === "en_curso").length;
  const sickHorsesCount = horses.filter((h) => h.healthStatus && h.healthStatus !== "optimo").length;
  const vaccinesCount = effectiveRecords.filter((r) => r.type === "vacuna" || r.type === "desparasitacion").length;
  const completedCount = effectiveRecords.filter((r) => r.status === "completado").length;
  const resolvedCasesCount = effectiveRecords.filter((r) => r.status === "completado" && r.caseResolution !== "medicacion_continua").length;
  const continuingMedCount = effectiveRecords.filter((r) => r.status === "completado" && (r.medicationContinues || r.caseResolution === "medicacion_continua")).length;

  // Filtrado de registros
  const filteredRecords = effectiveRecords.filter((rec) => {
    // Filtro estado
    if (statusFilter !== "todos" && rec.status !== statusFilter) return false;
    // Filtro tipo
    if (typeFilter !== "todos" && rec.type !== typeFilter) return false;
    // Filtro caballo
    if (selectedHorseFilter !== "todos" && rec.horseId !== selectedHorseFilter) return false;
    // Búsqueda por texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const matchName = (rec.horseName || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q);
      const matchTitle = (rec.title || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q);
      const matchDiagnosis = (rec.diagnosis || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q);
      const matchVet = (rec.administeredBy || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q);
      if (!matchName && !matchTitle && !matchDiagnosis && !matchVet) return false;
    }
    return true;
  });

  const handleShareWhatsApp = (rec: VeterinaryRecord) => {
    const waData = dataService.generateWhatsAppVeterinaryReport(rec);
    if (typeof window !== "undefined") {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const targetUrl = isMobile ? waData.waUrl : waData.webUrl;
      window.open(targetUrl, "_blank", "noopener,noreferrer");

      // Copiar también al portapapeles por respaldo
      if (navigator.clipboard) {
        navigator.clipboard.writeText(waData.text).then(() => {
          setCopiedId(rec.id);
          setTimeout(() => setCopiedId(null), 3000);
        });
      }
    }
  };

  const handleOpenCompleteModal = (rec: VeterinaryRecord) => {
    setCompletingRecord(rec);
    setDischargeOutcome("resuelto");
    setDischargeNotes("");
    setRestoreHealthToOptimo(true);
    setTargetHorseStatus("optimo");
    setMarkDiseaseResolved(true);

    // Precarga inteligente para la guía de continuación
    setContinuationMedName(rec.title || "");
    setContinuationDosage(rec.dosage || "");
    setContinuationRoute(rec.route || "oral");
    setContinuationFrequency(rec.frequency || "Cada 12 horas con la ración");
    setContinuationDurationDays(rec.durationDays ? Math.max(3, Math.round(rec.durationDays / 2)) : 5);
    setContinuationInstructions(
      rec.stableCareInstructions ||
      "Suministrar en comedero matutino y vespertino. Reposo de pista mientras cumple los días indicados. Informar si reaparece inflamación o claudicación."
    );
    setContinuationNextCheckDate(rec.nextDueDate || "");
    setContinuationResponsible("palafrenero");
  };

  const handleConfirmDischarge = () => {
    if (!completingRecord || !onCompleteTreatment) return;

    if (dischargeOutcome === "resuelto") {
      onCompleteTreatment(completingRecord.id, {
        caseResolution: "resuelto",
        resolutionNotes: dischargeNotes.trim() || "Tratamiento finalizado satisfactoriamente. Caso clínico resuelto sin secuelas.",
        restoreHorseHealth: restoreHealthToOptimo,
        targetHorseStatus: restoreHealthToOptimo ? "optimo" : targetHorseStatus,
        markDiseaseResolved: true,
      });
    } else {
      onCompleteTreatment(completingRecord.id, {
        caseResolution: "medicacion_continua",
        resolutionNotes: dischargeNotes.trim() || "Fase intensiva finalizada. Continúa con pauta de medicación y cuidados en box.",
        restoreHorseHealth: targetHorseStatus === "optimo",
        targetHorseStatus: targetHorseStatus,
        markDiseaseResolved: markDiseaseResolved,
        continuationGuide: {
          medicationContinues: true,
          medicationName: continuationMedName.trim() || completingRecord.title,
          dosage: continuationDosage.trim(),
          route: continuationRoute,
          frequency: continuationFrequency.trim(),
          durationDays: Number(continuationDurationDays) || 5,
          instructions: continuationInstructions.trim() || "Seguir indicaciones de administración y manejo pautadas.",
          nextCheckDate: continuationNextCheckDate.trim() || undefined,
          responsibleRole: continuationResponsible,
          targetHorseStatus: targetHorseStatus,
        },
      });
    }

    setCompletingRecord(null);
  };

  const handleCopyContinuationGuide = (rec: VeterinaryRecord) => {
    if (!rec.continuationGuide) return;
    const g = rec.continuationGuide;
    const guideText =
      `📋 *GUÍA DE INSTRUCCIONES DE MEDICACIÓN Y CUIDADOS EN BOX*\n` +
      `-----------------------------------------\n` +
      `🐎 *Ejemplar:* ${rec.horseName}\n` +
      `🔬 *Diagnóstico:* ${rec.diagnosis || rec.title}\n` +
      `💊 *Fármaco / Pauta:* ${g.medicationName || rec.title}\n` +
      (g.dosage ? `⏱️ *Posología / Dosis:* ${g.dosage}\n` : "") +
      (g.route ? `💉 *Vía:* ${String(g.route).toUpperCase()}\n` : "") +
      (g.frequency ? `🔄 *Frecuencia:* ${g.frequency}\n` : "") +
      (g.durationDays ? `📅 *Duración restante:* ${g.durationDays} días\n` : "") +
      (g.responsibleRole ? `👤 *Responsable principal:* ${g.responsibleRole.toUpperCase()}\n` : "") +
      `🌾 *Pautas de Cuidados e Indicaciones:* ${g.instructions}\n` +
      (g.nextCheckDate ? `📌 *Próximo Control / Revisión:* ${g.nextCheckDate}\n` : "") +
      `👨‍⚕️ *Indicado por M.V.Z.:* ${rec.administeredBy}`;

    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(guideText).then(() => {
        setCopiedGuideId(rec.id);
        setTimeout(() => setCopiedGuideId(null), 3000);
      });
    }
  };

  const handleOpenEditModal = (rec: VeterinaryRecord) => {
    setEditingRecord(rec);
    setEditTitle(rec.title || "");
    setEditDiagnosis(rec.diagnosis || "");
    setEditSymptoms(rec.symptoms || "");
    setEditDosage(rec.dosage || "");
    setEditRoute(rec.route || "oral");
    setEditFrequency(rec.frequency || "");
    setEditDurationDays(rec.durationDays || 5);
    setEditSeverity(rec.severity || "moderada");
    setEditAdministeredBy(rec.administeredBy || "");
    setEditDate(rec.date || "");
    setEditNextDueDate(rec.nextDueDate || "");
    setEditStatus(rec.status || "en_curso");
    setEditCost(rec.cost || 0);
    setEditChargeToOwner(rec.chargeToOwner !== false);
    setEditStableCareInstructions(rec.stableCareInstructions || "");
    setEditClinicalEvolutionNotes(rec.clinicalEvolutionNotes || "");
    setEditReason("");
    setEditHorseStatus("no_cambiar");
    setEditNotifyOwner(false);
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    const updates: Partial<Omit<VeterinaryRecord, "id" | "createdAt">> = {
      title: editTitle.trim() || editingRecord.title,
      diagnosis: editDiagnosis.trim() || editingRecord.diagnosis,
      symptoms: editSymptoms.trim() || undefined,
      dosage: editDosage.trim() || undefined,
      route: editRoute,
      frequency: editFrequency.trim() || undefined,
      durationDays: Number(editDurationDays) || undefined,
      severity: editSeverity,
      administeredBy: editAdministeredBy.trim() || editingRecord.administeredBy,
      date: editDate || editingRecord.date,
      nextDueDate: editNextDueDate || undefined,
      status: editStatus,
      cost: Number(editCost) >= 0 ? Number(editCost) : editingRecord.cost,
      chargeToOwner: editChargeToOwner,
      stableCareInstructions: editStableCareInstructions.trim() || undefined,
      clinicalEvolutionNotes: editClinicalEvolutionNotes.trim() || undefined,
    };

    const options = {
      reason: editReason.trim() || "Ajuste de parámetros clínicos / corrección",
      editedBy: editAdministeredBy.trim() || "M.V.Z.",
      newHorseStatus: editHorseStatus !== "no_cambiar" ? (editHorseStatus as HorseHealthStatus) : undefined,
      notifyOwner: editNotifyOwner,
    };

    if (onUpdateRecord) {
      onUpdateRecord(editingRecord.id, updates, options);
    } else {
      dataService.updateVeterinaryRecord(editingRecord.id, updates, options);
    }

    setEditingRecord(null);
  };

  const handleOpenComplicationModal = (rec: VeterinaryRecord) => {
    setComplicatingRecord(rec);
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setCompDate(today);
    setCompTime(timeStr);
    setCompDescription("");
    setCompActionTaken("");
    setCompAdditionalMedication("");
    setCompNewSeverity("grave");
    setCompAdditionalCost(0);
    setCompInstructionsForStables(
      "Monitoreo constante en box. Reportar cualquier cambio de temperatura o actitud. Restringir ejercicio hasta nueva orden médica."
    );
    setCompRecordedBy(rec.administeredBy || "Dr. Juan Pablo Morales (MVZ)");
    setCompNotifyOwner(true);
  };

  const handleSaveComplication = () => {
    if (!complicatingRecord) return;
    if (!compDescription.trim() || !compActionTaken.trim()) {
      alert("Por favor indique la descripción de la complicación y la acción médica inmediata tomada.");
      return;
    }

    const compData: Omit<TreatmentComplication, "id"> = {
      date: compDate || new Date().toISOString().split("T")[0],
      time: compTime || undefined,
      description: compDescription.trim(),
      actionTaken: compActionTaken.trim(),
      additionalMedication: compAdditionalMedication.trim() || undefined,
      newSeverity: compNewSeverity,
      recordedBy: compRecordedBy.trim() || "M.V.Z.",
      additionalCost: Number(compAdditionalCost) > 0 ? Number(compAdditionalCost) : undefined,
      instructionsForStables: compInstructionsForStables.trim() || undefined,
      notifyOwner: compNotifyOwner,
    };

    if (onAddComplication) {
      onAddComplication(complicatingRecord.id, compData);
    } else {
      dataService.addTreatmentComplication(complicatingRecord.id, compData);
    }

    setComplicatingRecord(null);
  };

  const handleOpenReopenModal = (rec: VeterinaryRecord) => {
    setReopeningRecord(rec);
    setReopenReason("Reapertura por recaída / corrección de error en cierre prematuro");
    setReopenRecordedBy(rec.administeredBy || "Dr. Juan Pablo Morales (MVZ)");
  };

  const handleConfirmReopen = () => {
    if (!reopeningRecord) return;
    if (onReopenTreatment) {
      onReopenTreatment(reopeningRecord.id, reopenReason.trim(), reopenRecordedBy.trim());
    } else {
      dataService.reopenVeterinaryTreatment(reopeningRecord.id, reopenReason.trim(), reopenRecordedBy.trim());
    }
    setReopeningRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Principal */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5" />
              Módulo Médico Veterinario
            </span>
            <span className="text-xs text-stone-400">• Salud y Bienestar Equino</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            Sanidad, Diagnósticos & Tratamientos Clínicos
          </h2>
          <p className="text-xs text-stone-500 max-w-2xl">
            Registro de evaluaciones clínicas, emisión de diagnósticos patológicos, prescripción de fármacos, indicaciones para palafreneros y recetas vía WhatsApp.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-700 hover:from-rose-700 hover:to-amber-800 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          + Nuevo Diagnóstico y Tratamiento
        </button>
      </div>

      {/* 2. Tarjetas de Métricas Sanitarias */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Tratamientos Activos</p>
            <h3 className="text-xl font-black text-stone-900 dark:text-stone-100">
              {activeTreatmentsCount}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">En Reposo / Cuidados</p>
            <h3 className="text-xl font-black text-amber-700 dark:text-amber-400">
              {sickHorsesCount}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <Syringe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Biológicos y Vacunas</p>
            <h3 className="text-xl font-black text-stone-900 dark:text-stone-100">
              {vaccinesCount}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">Altas / Concluidos</p>
            <h3 className="text-xl font-black text-stone-900 dark:text-stone-100 flex items-baseline gap-1.5 flex-wrap">
              {completedCount}
              <span className="text-[11px] font-normal text-stone-400">
                ({resolvedCasesCount} resueltos • {continuingMedCount} medicación)
              </span>
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Filtros y Búsqueda */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
          {/* Buscador */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por ejemplar, diagnóstico o M.V.Z..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          {/* Filtro por Ejemplar Específico */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-stone-500 shrink-0">Paciente:</span>
            <select
              value={selectedHorseFilter}
              onChange={(e) => setSelectedHorseFilter(e.target.value)}
              className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs font-medium text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-rose-500 outline-none w-full md:w-56"
            >
              <option value="todos">Todos los Ejemplares ({horses.length})</option>
              {horses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.pesebreraCode ? `(${h.pesebreraCode})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pestañas de Estado y Categorías */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter("todos")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                statusFilter === "todos"
                  ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                  : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200"
              }`}
            >
              Todos ({records.length})
            </button>
            <button
              onClick={() => setStatusFilter("en_curso")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                statusFilter === "en_curso"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200"
              }`}
            >
              En Tratamiento ({activeTreatmentsCount})
            </button>
            <button
              onClick={() => setStatusFilter("completado")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                statusFilter === "completado"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200"
              }`}
            >
              Altas / Completados ({completedCount})
            </button>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            <span className="text-stone-400 font-medium mr-1 text-[11px]">Tipo:</span>
            {(["todos", "medicamento", "vacuna", "desparasitacion", "control", "herraje"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-0.5 rounded-lg font-semibold transition-all capitalize text-[11px] ${
                  typeFilter === t
                    ? "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900"
                    : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                {t === "todos" ? "Todas" : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Lista de Atenciones y Diagnósticos */}
      <div className="space-y-3">
        {filteredRecords.length > 0 && (
          <div className="flex items-center justify-between px-2 text-xs text-stone-500 flex-wrap gap-2">
            <span>
              Mostrando <strong className="text-stone-800 dark:text-stone-200">{filteredRecords.length}</strong> {filteredRecords.length === 1 ? "caso clínico" : "casos clínicos"} (Pulsa sobre cualquier ficha para verla completa)
            </span>
            <button
              type="button"
              onClick={handleToggleExpandAll}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 transition-colors ml-auto"
            >
              {filteredRecords.every((r) => expandedRecordIds[r.id]) ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Plegar todas las fichas
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Desplegar todas las fichas
                </>
              )}
            </button>
          </div>
        )}

        {filteredRecords.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-12 text-center border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Stethoscope className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-stone-800 dark:text-stone-200">
              No se encontraron atenciones con los filtros actuales
            </h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Puedes ajustar el buscador o registrar una nueva atención médica para comenzar el seguimiento clínico.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("todos");
                  setTypeFilter("todos");
                  setSelectedHorseFilter("todos");
                }}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs transition-colors"
              >
                Limpiar Filtros
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                + Registrar Atención
              </button>
            </div>
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const horse = horses.find((h) => h.id === rec.horseId);
            const isCompleted = rec.status === "completado";
            const isExpanded = Boolean(expandedRecordIds[rec.id]);

            return (
              <div
                key={rec.id}
                className={`bg-white dark:bg-stone-900 border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
                  !isCompleted && rec.severity === "grave"
                    ? "border-rose-300 dark:border-rose-900/80 bg-rose-50/15"
                    : isExpanded
                    ? "border-rose-300/80 dark:border-rose-800/80 ring-1 ring-rose-500/20"
                    : "border-stone-200/90 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
                }`}
              >
                {/* 1. FILA COMPACTA (PLIEGUE PEQUEÑO SIEMPRE VISIBLE - Haz clic para desplegar) */}
                <div
                  onClick={() => toggleExpandRecord(rec.id)}
                  className={`p-3.5 sm:p-4 cursor-pointer select-none flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                    isExpanded
                      ? "bg-stone-50/90 dark:bg-stone-800/60 border-b border-stone-200/80 dark:border-stone-800"
                      : "hover:bg-stone-50/60 dark:hover:bg-stone-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-700 flex items-center justify-center text-lg font-bold shadow-inner shrink-0">
                      🐎
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          onClick={(e) => {
                            e.stopPropagation();
                            horse && onSelectHorse?.(horse);
                          }}
                          className="font-black text-stone-900 dark:text-stone-100 text-sm sm:text-base hover:text-rose-600 transition-colors cursor-pointer truncate flex items-center gap-1"
                        >
                          {rec.horseName}
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        </h4>

                        {horse?.pesebreraCode && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
                            Box {horse.pesebreraCode}
                          </span>
                        )}

                        <span className="text-[11px] text-stone-400 shrink-0">
                          • {rec.date}
                        </span>

                        {horse?.ownerName && (
                          <span className="text-xs text-stone-500 hidden sm:inline-block">
                            (Dueño: <strong className="text-stone-700 dark:text-stone-300">{horse.ownerName}</strong>)
                          </span>
                        )}
                      </div>

                      {/* Resumen Clínico en una sola línea compacta */}
                      <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300 mt-1 truncate">
                        <span className="font-bold text-stone-900 dark:text-stone-100 truncate">
                          {rec.diagnosis || rec.title}
                        </span>
                        <span className="text-stone-400 shrink-0">•</span>
                        <span className="text-stone-500 dark:text-stone-400 truncate">
                          {rec.title} {rec.dosage ? `(${rec.dosage})` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between md:justify-end shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getTypeBadge(rec.type)}
                      {getSeverityBadge(rec.severity)}

                      {rec.isReopened && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                          <RotateCcw className="w-3 h-3 text-amber-600" />
                          Reabierto
                        </span>
                      )}

                      {rec.complications && rec.complications.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-300 dark:border-rose-800">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          {rec.complications.length}
                        </span>
                      )}

                      {rec.editHistory && rec.editHistory.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingHistoryRecord(rec);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full border border-stone-300 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                          title="Ver bitácora de auditoría y modificaciones"
                        >
                          <History className="w-3 h-3 text-stone-500" />
                          Editado ({rec.editHistory.length})
                        </button>
                      )}

                      {isCompleted ? (
                        rec.medicationContinues || rec.caseResolution === "medicacion_continua" ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800 shadow-xs">
                            <Pill className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            Finalizado • Guía Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Alta Médica • Resuelto
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          En Tratamiento
                        </span>
                      )}
                    </div>

                    {/* Botón Plegar / Desplegar */}
                    <div className="flex items-center gap-1.5 ml-auto md:ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandRecord(rec.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs shrink-0 ${
                          isExpanded
                            ? "bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                            : "bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                        }`}
                        title={isExpanded ? "Plegar ficha clínica" : "Desplegar ficha completa con toda la información"}
                      >
                        <span>{isExpanded ? "Plegar Ficha" : "Desplegar Ficha"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. CUERPO DETALLADO EXPANDIDO (Se despliega con toda la información al pulsar) */}
                {isExpanded && (
                  <div className="p-5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">

                {/* Cuerpo: Diagnóstico y Tratamiento Prescrito */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Diagnóstico y Signos */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Stethoscope className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400">
                          Diagnóstico Clínico Oficial:
                        </span>
                        <p className="text-sm font-black text-stone-900 dark:text-stone-100">
                          {rec.diagnosis || rec.title}
                        </p>
                      </div>
                    </div>

                    {rec.symptoms && (
                      <div className="bg-stone-50 dark:bg-stone-800/40 p-2.5 rounded-xl border border-stone-200/70 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300">
                        <strong className="text-stone-800 dark:text-stone-200 font-semibold block mb-0.5">
                          Hallazgos Clínicos / Constantes:
                        </strong>
                        {rec.symptoms}
                      </div>
                    )}
                  </div>

                  {/* Fármaco y Posología Inicial */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Pill className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                          Prescripción / Procedimiento Inicial:
                        </span>
                        <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {rec.title}
                        </p>
                      </div>
                    </div>

                    <div className="bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/30 text-xs text-stone-700 dark:text-stone-300 space-y-1">
                      {rec.dosage && (
                        <p>
                          <strong>Posología Inicial:</strong> {rec.dosage}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400 flex-wrap">
                        {rec.route && <span>Vía: <strong className="uppercase text-stone-700 dark:text-stone-300">{rec.route}</strong></span>}
                        {rec.frequency && <span>• Frecuencia: <strong className="text-stone-700 dark:text-stone-300">{rec.frequency}</strong></span>}
                        {rec.durationDays && <span>• Duración: <strong className="text-stone-700 dark:text-stone-300">{rec.durationDays} días</strong></span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instrucciones Iniciales para el Palafrenero y Cuadras */}
                {rec.stableCareInstructions && (
                  <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-orange-950 dark:text-orange-200">
                    <ShieldAlert className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                    <div>
                      <strong className="font-bold block text-orange-900 dark:text-orange-300">
                        Indicaciones para el Palafrenero y Manejo en Box:
                      </strong>
                      <span>{rec.stableCareInstructions}</span>
                    </div>
                  </div>
                )}

                {/* AVISO DE REAPERTURA DE TRATAMIENTO */}
                {rec.isReopened && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800/80 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-amber-950 dark:text-amber-200 shadow-xs">
                    <RotateCcw className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <strong className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                        Atención: Tratamiento Reabierto tras Cierre Previo
                      </strong>
                      <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                        {rec.reopenReason || "Reactivado por criterio médico, recaída o corrección de error en cierre prematuro."}
                      </p>
                    </div>
                  </div>
                )}

                {/* NOVEDADES / COMPLICACIONES CLÍNICAS Y FÁRMACOS DE RESCATE REGISTRADOS */}
                {rec.complications && rec.complications.length > 0 && (
                  <div className="bg-gradient-to-br from-rose-50 to-red-50/60 dark:from-rose-950/40 dark:to-red-950/20 border-2 border-rose-300 dark:border-rose-800 p-4 rounded-2xl shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 dark:border-rose-900/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                          <AlertOctagon className="w-4 h-4 text-rose-600" />
                        </div>
                        <div>
                          <h5 className="font-black text-xs text-rose-950 dark:text-rose-200 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                            Complicaciones Clínicas & Fármacos de Rescate Registrados ({rec.complications.length})
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200 font-bold lowercase">
                              atención de urgencia
                            </span>
                          </h5>
                          <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80">
                            Registro de desmejoras imprevistas, pautas de rescate y fármacos añadidos sobre la marcha
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenComplicationModal(rec)}
                        className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 text-xs font-bold transition-colors flex items-center gap-1 shrink-0 self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        + Novedad / Rescate
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {rec.complications.map((comp) => (
                        <div
                          key={comp.id}
                          className="bg-white/95 dark:bg-stone-900/95 p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 space-y-2 text-xs shadow-xs"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                            <span className="font-bold text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-rose-600" />
                              {comp.date} {comp.time ? `• ${comp.time}` : ""}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {comp.newSeverity && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                  comp.newSeverity === "grave"
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 animate-pulse"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                                }`}>
                                  Severidad: {comp.newSeverity}
                                </span>
                              )}
                              <span className="text-stone-500 font-medium">Atendió: <strong className="text-stone-700 dark:text-stone-300">{comp.recordedBy}</strong></span>
                            </div>
                          </div>

                          <div className="text-stone-800 dark:text-stone-200">
                            <strong className="text-rose-800 dark:text-rose-300 font-bold block mb-0.5">
                              Descripción del cuadro de complicación:
                            </strong>
                            <p className="leading-relaxed pl-1">{comp.description}</p>
                          </div>

                          {comp.additionalMedication && (
                            <div className="bg-rose-50/90 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200/70 dark:border-rose-900/50 text-stone-900 dark:text-stone-100 flex items-start gap-2">
                              <Pill className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                              <div>
                                <strong className="text-rose-900 dark:text-rose-300 font-bold block text-[11px] uppercase tracking-wide">
                                  Medicación / Fármacos de Rescate Agregados:
                                </strong>
                                <span className="font-bold text-xs">{comp.additionalMedication}</span>
                              </div>
                            </div>
                          )}

                          <div className="text-stone-700 dark:text-stone-300 pl-1">
                            <strong className="text-stone-900 dark:text-stone-100 font-bold">Acción médica inmediata: </strong>
                            <span>{comp.actionTaken}</span>
                          </div>

                          {comp.instructionsForStables && (
                            <div className="bg-orange-50/70 dark:bg-orange-950/30 p-2 rounded-xl border border-orange-200/50 dark:border-orange-900/40 text-orange-950 dark:text-orange-200 flex items-start gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5 text-orange-600 mt-0.5 shrink-0" />
                              <div>
                                <strong className="font-bold block text-[11px]">Pautas urgentes para el palafrenero:</strong>
                                <span>{comp.instructionsForStables}</span>
                              </div>
                            </div>
                          )}

                          {comp.additionalCost && comp.additionalCost > 0 && (
                            <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                              <span>Sobrecosto por urgencia / rescate:</span>
                              <strong className="text-stone-800 dark:text-stone-200">{formatCOP(comp.additionalCost)}</strong>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GUÍA DE INSTRUCCIONES SI EL MEDICAMENTO SIGUE (POST-TRATAMIENTO) */}
                {isCompleted && (rec.medicationContinues || rec.continuationGuide) && rec.continuationGuide && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20 border-2 border-amber-300 dark:border-amber-800/80 p-4 rounded-2xl shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-900/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-black text-xs text-amber-950 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                            Guía de Instrucciones de Continuación de Medicamento
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200/80 text-amber-900 dark:bg-amber-900 dark:text-amber-200 font-bold lowercase">
                              pauta ambulatoria en box
                            </span>
                          </h5>
                          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                            Tratamiento clínico finalizado • Medicación y cuidados pautados para el cuidador / dueño
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyContinuationGuide(rec)}
                          className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold transition-colors flex items-center gap-1"
                          title="Copiar guía de instrucciones al portapapeles"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {copiedGuideId === rec.id ? "¡Guía Copiada!" : "Copiar Guía"}
                        </button>
                      </div>
                    </div>

                    {/* Resumen del fármaco continuo */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block uppercase">Medicamento:</span>
                        <strong className="text-stone-900 dark:text-stone-100 font-bold block truncate">
                          {rec.continuationGuide.medicationName || rec.title}
                        </strong>
                      </div>
                      <div className="bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block uppercase">Posología / Dosis:</span>
                        <strong className="text-stone-900 dark:text-stone-100 font-bold block truncate">
                          {rec.continuationGuide.dosage || "Según indicación"}
                        </strong>
                      </div>
                      <div className="bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block uppercase">Vía & Frecuencia:</span>
                        <strong className="text-stone-900 dark:text-stone-100 font-bold block truncate">
                          {rec.continuationGuide.route ? `${rec.continuationGuide.route} • ` : ""}{rec.continuationGuide.frequency || "1 vez al día"}
                        </strong>
                      </div>
                      <div className="bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block uppercase">Duración Restante:</span>
                        <strong className="text-amber-800 dark:text-amber-300 font-bold block">
                          {rec.continuationGuide.durationDays ? `${rec.continuationGuide.durationDays} días` : "Pauta continua"}
                        </strong>
                      </div>
                    </div>

                    {/* Instrucciones detalladas de cuadra y advertencias */}
                    <div className="bg-white/90 dark:bg-stone-900/90 p-3 rounded-xl border border-amber-200/70 dark:border-amber-900/50 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Pautas obligatorias de administración y manejo:</span>
                        {rec.continuationGuide.responsibleRole && (
                          <span className="ml-auto text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 rounded">
                            Responsable: {rec.continuationGuide.responsibleRole}
                          </span>
                        )}
                      </div>
                      <p className="text-stone-700 dark:text-stone-300 leading-relaxed pl-5">
                        {rec.continuationGuide.instructions}
                      </p>
                    </div>

                    {rec.continuationGuide.nextCheckDate && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-400 pt-0.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Próxima revisión de control programada: <strong>{rec.continuationGuide.nextCheckDate}</strong></span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notas de evolución o alta médica */}
                {rec.clinicalEvolutionNotes && (
                  <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
                    rec.medicationContinues || rec.caseResolution === "medicacion_continua"
                      ? "bg-stone-50 dark:bg-stone-800/40 border-stone-200/80 dark:border-stone-800 text-stone-700 dark:text-stone-300"
                      : "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-200"
                  }`}>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                      rec.medicationContinues || rec.caseResolution === "medicacion_continua"
                        ? "text-stone-500"
                        : "text-emerald-600"
                    }`} />
                    <div>
                      <strong className={`block font-bold mb-0.5 ${
                        rec.medicationContinues || rec.caseResolution === "medicacion_continua"
                          ? "text-stone-900 dark:text-stone-100"
                          : "text-emerald-900 dark:text-emerald-300"
                      }`}>
                        {rec.caseResolution === "resuelto" ? "Cierre Clínico y Criterio de Alta Médica (Caso Resuelto):" : "Evolución y Criterio Clínico:"}
                      </strong>
                      <span>{rec.clinicalEvolutionNotes}</span>
                    </div>
                  </div>
                )}

                {/* Pie de Tarjeta: Veterinario, Fechas, Costos y Botones de Acción */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
                  <div className="flex items-center gap-4 flex-wrap text-stone-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      Tratante: <strong className="text-stone-700 dark:text-stone-300 ml-1">{rec.administeredBy}</strong>
                    </span>

                    {rec.nextDueDate && (
                      <span className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
                        <Clock className="w-3.5 h-3.5" />
                        Próximo control: {rec.nextDueDate}
                      </span>
                    )}

                    {rec.cost && rec.cost > 0 && (
                      <span className="font-bold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
                        {formatCOP(rec.cost)} {rec.chargeToOwner ? "(Cargado al Propietario)" : "(Asumido por Centro)"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    {/* Botón Auditoría / Historial si tiene cambios */}
                    {((rec.editHistory && rec.editHistory.length > 0) || (rec.complications && rec.complications.length > 0) || rec.isReopened) && (
                      <button
                        type="button"
                        onClick={() => setViewingHistoryRecord(rec)}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold border border-stone-200 dark:border-stone-700 transition-colors flex items-center gap-1.5 text-xs"
                        title="Ver bitácora de auditoría, modificaciones y complicaciones"
                      >
                        <History className="w-3.5 h-3.5 text-stone-500" />
                        Auditoría
                      </button>
                    )}

                    {/* Botón WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(rec)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-900 transition-colors flex items-center gap-1.5 text-xs"
                      title="Compartir receta y reporte clínico por WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {copiedId === rec.id ? "¡Copiado!" : "WhatsApp"}
                    </button>

                    {/* Botón + Complicación / Fármaco Rescate */}
                    <button
                      type="button"
                      onClick={() => handleOpenComplicationModal(rec)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900 transition-colors flex items-center gap-1.5 text-xs"
                      title="Registrar complicación o agregar medicación de rescate de urgencia"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      + Complicación / Rescate
                    </button>

                    {/* Botón Modificar Tratamiento (Programado al error humano) */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(rec)}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold border border-stone-200 dark:border-stone-700 transition-colors flex items-center gap-1.5 text-xs"
                      title="Modificar posología, diagnóstico, fechas o corregir errores humanos"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                      Modificar
                    </button>

                    {/* Botón Reabrir Tratamiento (si está completado) */}
                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleOpenReopenModal(rec)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-800 transition-colors flex items-center gap-1.5 text-xs"
                        title="Reabrir tratamiento si se cerró por error humano o hubo recaída clínica"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        Reabrir por Error / Recaída
                      </button>
                    )}

                    {/* Botón Finalizar Tratamiento / Emitir Alta */}
                    {!isCompleted && onCompleteTreatment && (
                      <button
                        type="button"
                        onClick={() => handleOpenCompleteModal(rec)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold shadow-sm transition-all flex items-center gap-1.5 text-xs active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Finalizar Tratamiento
                      </button>
                    )}

                    {/* Ver Ficha Técnica del Caballo */}
                    {horse && onSelectHorse && (
                      <button
                        type="button"
                        onClick={() => onSelectHorse(horse)}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-semibold transition-colors text-xs"
                      >
                        Ver Ficha
                      </button>
                    )}

                    {/* Botón Plegar Ficha */}
                    <button
                      type="button"
                      onClick={() => toggleExpandRecord(rec.id)}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold border border-stone-200 dark:border-stone-700 transition-colors flex items-center gap-1.5 text-xs"
                      title="Plegar y contraer esta ficha clínica"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                      Plegar Ficha
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })
        )}
      </div>

      {/* 5. Modal para Registrar Nueva Atención */}
      <NewVeterinaryTreatmentModal
        horses={horses}
        clients={clients}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={(newRecord, options) => {
          onAddRecord?.(newRecord, options);
          setIsAddModalOpen(false);
        }}
      />

      {/* 6. Modal para Finalizar Tratamiento / Guía de Medicación o Caso Resuelto */}
      {completingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-5 my-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-stone-900 dark:text-stone-100">
                      Finalizar Tratamiento Clínico
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                      Cierre de Atención
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Paciente: <strong className="text-stone-800 dark:text-stone-200">{completingRecord.horseName}</strong> • {completingRecord.diagnosis || completingRecord.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCompletingRecord(null)}
                className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Selector de Desenlace Clínico: Caso Resuelto vs Medicación Continua */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                Seleccione el desenlace clínico del ejemplar:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opción 1: Caso Resuelto */}
                <div
                  onClick={() => setDischargeOutcome("resuelto")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    dischargeOutcome === "resuelto"
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 shadow-sm"
                      : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/30 text-stone-700 dark:text-stone-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      <CheckCircle2 className="w-4 h-4" />
                      1. Caso Resuelto (Alta Definitiva)
                    </span>
                    <input
                      type="radio"
                      checked={dischargeOutcome === "resuelto"}
                      onChange={() => setDischargeOutcome("resuelto")}
                      className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    El cuadro clínico se superó totalmente. No requiere más fármacos. Se restablece la condición a óptima y se cierra la patología en el historial.
                  </p>
                </div>

                {/* Opción 2: El Medicamento Sigue / Guía de Instrucciones */}
                <div
                  onClick={() => setDischargeOutcome("medicacion_continua")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    dischargeOutcome === "medicacion_continua"
                      ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 shadow-sm"
                      : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/30 text-stone-700 dark:text-stone-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                      <Pill className="w-4 h-4" />
                      2. El Medicamento Sigue (Guía Activa)
                    </span>
                    <input
                      type="radio"
                      checked={dischargeOutcome === "medicacion_continua"}
                      onChange={() => setDischargeOutcome("medicacion_continua")}
                      className="text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    La fase clínica concluye, pero el ejemplar debe continuar con una guía pautada de medicamentos o cuidados en box por palafrenero/dueño.
                  </p>
                </div>
              </div>
            </div>

            {/* SECCIÓN A: CASO RESUELTO */}
            {dischargeOutcome === "resuelto" && (
              <div className="space-y-4 p-4 rounded-2xl bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Criterio de Alta Médica y Notas de Evolución:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ej: Paciente sin claudicación ni dolor a la palpación. Desinflamación articular completa. Apto para reanudar trabajo progresivo de pista..."
                    value={dischargeNotes}
                    onChange={(e) => setDischargeNotes(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300 p-2.5 bg-white dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700">
                    <input
                      type="checkbox"
                      checked={restoreHealthToOptimo}
                      onChange={(e) => setRestoreHealthToOptimo(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Restablecer estado del ejemplar a <strong>&ldquo;Óptimo&rdquo;</strong></span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300 p-2.5 bg-white dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700">
                    <input
                      type="checkbox"
                      checked={markDiseaseResolved}
                      onChange={(e) => setMarkDiseaseResolved(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Marcar patología en historial como <strong>&ldquo;Resuelta&rdquo;</strong></span>
                  </label>
                </div>
              </div>
            )}

            {/* SECCIÓN B: GUÍA DE INSTRUCCIONES SI EL MEDICAMENTO SIGUE */}
            {dischargeOutcome === "medicacion_continua" && (
              <div className="space-y-4 p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-900/60 pb-2">
                  <Pill className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Formulario de la Guía de Instrucciones Médicas en Box
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Medicamento / Pauta que Continúa: *
                    </label>
                    <input
                      type="text"
                      placeholder="ej: Fenilbutazona oral / Pomada cicatrizante"
                      value={continuationMedName}
                      onChange={(e) => setContinuationMedName(e.target.value)}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Posología / Dosis de Seguimiento: *
                    </label>
                    <input
                      type="text"
                      placeholder="ej: 1 sobre (1g) / 10 ml / capa delgada"
                      value={continuationDosage}
                      onChange={(e) => setContinuationDosage(e.target.value)}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Vía de Administración:
                    </label>
                    <select
                      value={continuationRoute}
                      onChange={(e) => setContinuationRoute(e.target.value as TreatmentRoute)}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none capitalize"
                    >
                      <option value="oral">Oral (Con ración / pasta / jeringa)</option>
                      <option value="topica">Tópica (Pomada / Gel / Spray)</option>
                      <option value="intramuscular">Intramuscular (IM)</option>
                      <option value="intravenosa">Intravenosa (IV)</option>
                      <option value="subcutanea">Subcutánea</option>
                      <option value="intraarticular">Intraarticular</option>
                      <option value="oftalmica">Oftálmica</option>
                      <option value="otra">Otra</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Frecuencia de Suministro:
                    </label>
                    <input
                      type="text"
                      placeholder="ej: Cada 12 horas / 1 vez al día por la mañana"
                      value={continuationFrequency}
                      onChange={(e) => setContinuationFrequency(e.target.value)}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Duración Restante (Días):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={continuationDurationDays}
                      onChange={(e) => setContinuationDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Próxima Revisión / Control Veterinario:
                    </label>
                    <input
                      type="date"
                      value={continuationNextCheckDate}
                      onChange={(e) => setContinuationNextCheckDate(e.target.value)}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Guía de Instrucciones y Manejo de Box para Palafrenero / Cuidador: *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ej: Lavar la extremidad con agua fría 15 min antes de aplicar la pomada. Colocar vendaje de descanso limpio. No sacar al torno ni a pista de arena. Reportar de inmediato si se detecta calor..."
                    value={continuationInstructions}
                    onChange={(e) => setContinuationInstructions(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Estado de Salud del Ejemplar:
                    </label>
                    <select
                      value={targetHorseStatus}
                      onChange={(e) => setTargetHorseStatus(e.target.value as HorseHealthStatus)}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <option value="observacion">En Observación (Recomendado para seguimiento)</option>
                      <option value="reposo">En Reposo Médico / Sin trabajo de pista</option>
                      <option value="optimo">Óptimo (Pauta profiláctica o de mantenimiento)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Responsable de la Administración:
                    </label>
                    <select
                      value={continuationResponsible}
                      onChange={(e) => setContinuationResponsible(e.target.value as typeof continuationResponsible)}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <option value="palafrenero">Palafrenero de Cuadras</option>
                      <option value="mayordomo">Mayordomo General</option>
                      <option value="propietario">Propietario</option>
                      <option value="todos">Equipo General de Cuadra</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Notas de Evolución Médica:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ej: Paciente con evolución favorable (85% de mejoría). Se retira la vía parenteral y continúa con soporte oral."
                    value={dischargeNotes}
                    onChange={(e) => setDischargeNotes(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Footer de botones */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setCompletingRecord(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-semibold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDischarge}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all transform active:scale-95 ${
                  dischargeOutcome === "resuelto"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-600/20"
                    : "bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 shadow-amber-600/20"
                }`}
              >
                {dischargeOutcome === "resuelto" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Alta Médica (Caso Resuelto)
                  </>
                ) : (
                  <>
                    <ClipboardList className="w-4 h-4" />
                    Finalizar y Activar Guía de Instrucciones
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 7. Modal para Modificar Tratamiento (Programado al error humano y ajustes) */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-5 my-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-stone-900 dark:text-stone-100">
                      Modificar Tratamiento Clínico
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                      Tolerante a Error Humano
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Paciente: <strong className="text-stone-800 dark:text-stone-200">{editingRecord.horseName}</strong> • {editingRecord.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Aviso explicativo de auditoría */}
            <div className="bg-stone-50 dark:bg-stone-800/40 p-3 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p>
                <strong>Trazabilidad y control de cambios:</strong> Cualquier corrección de dosis, frecuencia, fechas o cambio de estado quedará respaldada en la bitácora histórica sin pérdida de datos clínicos.
              </p>
            </div>

            {/* Formulario */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Diagnóstico Clínico Oficial:
                  </label>
                  <input
                    type="text"
                    value={editDiagnosis}
                    onChange={(e) => setEditDiagnosis(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="ej: Desmitis del suspensor del nudo / Cólico espasmódico"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Severidad Clínica:
                  </label>
                  <select
                    value={editSeverity}
                    onChange={(e) => setEditSeverity(e.target.value as DiseaseSeverity)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="leve">Leve</option>
                    <option value="moderada">Moderada</option>
                    <option value="grave">Grave / Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Hallazgos Clínicos / Constantes / Signos:
                </label>
                <textarea
                  rows={2}
                  value={editSymptoms}
                  onChange={(e) => setEditSymptoms(e.target.value)}
                  className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="ej: FC: 44 lpm, T: 38.2°C, claudicación grado 2/5 mano izquierda"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Prescripción / Medicamento Principal: *
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="ej: Fenilbutazona pasta"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Posología / Dosis:
                  </label>
                  <input
                    type="text"
                    value={editDosage}
                    onChange={(e) => setEditDosage(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="ej: 1 sobre (1g) cada 12 horas"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Vía de Administración:
                  </label>
                  <select
                    value={editRoute}
                    onChange={(e) => setEditRoute(e.target.value as TreatmentRoute)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none capitalize"
                  >
                    <option value="oral">Oral</option>
                    <option value="intramuscular">Intramuscular (IM)</option>
                    <option value="intravenosa">Intravenosa (IV)</option>
                    <option value="subcutanea">Subcutánea</option>
                    <option value="topica">Tópica</option>
                    <option value="intraarticular">Intraarticular</option>
                    <option value="oftalmica">Oftálmica</option>
                    <option value="otra">Otra</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Frecuencia:
                  </label>
                  <input
                    type="text"
                    value={editFrequency}
                    onChange={(e) => setEditFrequency(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="ej: Cada 12 horas"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Duración Estimada (Días):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={editDurationDays}
                    onChange={(e) => setEditDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Estado del Tratamiento:
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as TreatmentStatus)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                  >
                    <option value="en_curso">En Curso (Activo)</option>
                    <option value="completado">Completado / Finalizado</option>
                    <option value="programado">Programado</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Fecha de Atención:
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Próximo Control / Revisión:
                  </label>
                  <input
                    type="date"
                    value={editNextDueDate}
                    onChange={(e) => setEditNextDueDate(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Veterinario Tratante:
                  </label>
                  <input
                    type="text"
                    value={editAdministeredBy}
                    onChange={(e) => setEditAdministeredBy(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Costo Total (COP):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={editCost}
                    onChange={(e) => setEditCost(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Indicaciones para el Palafrenero y Manejo en Box:
                </label>
                <textarea
                  rows={2}
                  value={editStableCareInstructions}
                  onChange={(e) => setEditStableCareInstructions(e.target.value)}
                  className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="ej: Hidroterapia 2 veces al día, cama limpia y seca, reposo absoluto de pista..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Evolución Clínica / Notas Adicionales:
                </label>
                <textarea
                  rows={2}
                  value={editClinicalEvolutionNotes}
                  onChange={(e) => setEditClinicalEvolutionNotes(e.target.value)}
                  className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="ej: Evolución favorable, reducción del 60% en el edema..."
                />
              </div>

              {/* Sección de Auditoría y Control de Error Humano */}
              <div className="bg-amber-50/60 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-3">
                <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Motivo del Ajuste (Auditoría contra Error Humano)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Motivo o Justificación del Cambio:
                  </label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="ej: Corrección de posología por error de digitación / Ajuste de fármaco por escasa respuesta"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Sincronizar Estado de Salud del Caballo:
                    </label>
                    <select
                      value={editHorseStatus}
                      onChange={(e) => setEditHorseStatus(e.target.value as HorseHealthStatus | "no_cambiar")}
                      className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <option value="no_cambiar">No modificar estado actual del caballo</option>
                      <option value="en_tratamiento">En Tratamiento</option>
                      <option value="observacion">En Observación</option>
                      <option value="reposo">En Reposo</option>
                      <option value="optimo">Óptimo</option>
                      <option value="aislamiento">En Aislamiento</option>
                      <option value="critico">Crítico</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300">
                      <input
                        type="checkbox"
                        checked={editChargeToOwner}
                        onChange={(e) => setEditChargeToOwner(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span>Cargar costo al propietario</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300">
                      <input
                        type="checkbox"
                        checked={editNotifyOwner}
                        onChange={(e) => setEditNotifyOwner(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span>Notificar al propietario sobre el ajuste</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-semibold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all transform active:scale-95"
              >
                <Check className="w-4 h-4" />
                Guardar Modificaciones Clínicas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal para Registrar Complicación / Fármacos de Rescate */}
      {complicatingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-5 my-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center shadow-md shadow-rose-600/20 shrink-0">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-stone-900 dark:text-stone-100">
                      Registrar Complicación Clínica & Fármacos de Rescate
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 animate-pulse">
                      Urgencia / Escalamiento
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Ejemplar: <strong className="text-stone-800 dark:text-stone-200">{complicatingRecord.horseName}</strong> • Diagnóstico base: {complicatingRecord.diagnosis || complicatingRecord.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setComplicatingRecord(null)}
                className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Aviso */}
            <div className="bg-rose-50/70 dark:bg-rose-950/30 p-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-xs text-rose-950 dark:text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <p>
                Este registro anexará la novedad clínica al historial del caballo, reabrirá automáticamente el tratamiento si estaba concluido, actualizará su severidad a grave y notificará al propietario.
              </p>
            </div>

            {/* Formulario */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Fecha de la Complicación: *
                  </label>
                  <input
                    type="date"
                    value={compDate}
                    onChange={(e) => setCompDate(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Hora del Evento:
                  </label>
                  <input
                    type="time"
                    value={compTime}
                    onChange={(e) => setCompTime(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Descripción de la Complicación o Signos de Alarma: *
                </label>
                <textarea
                  rows={3}
                  value={compDescription}
                  onChange={(e) => setCompDescription(e.target.value)}
                  className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="ej: El ejemplar presentó dolor cólico agudo refractario al tratamiento inicial, sudoración profusa y ausencia de motilidad en cuadrante derecho..."
                />
              </div>

              <div className="bg-rose-50/40 dark:bg-rose-950/20 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-3">
                <div>
                  <label className="block font-bold text-rose-950 dark:text-rose-200 mb-1">
                    💊 Medicamentos de Rescate / Terapias Agregadas:
                  </label>
                  <input
                    type="text"
                    value={compAdditionalMedication}
                    onChange={(e) => setCompAdditionalMedication(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-rose-200 dark:border-rose-800 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="ej: Flunixin Meglumina 15ml IV + Xilacina 2ml IV de rescate + Terapia de fluidos 10L"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Especifique fármacos administrados de urgencia para contrarrestar la complicación.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Acción Médica / Procedimiento Inmediato Tomado: *
                  </label>
                  <textarea
                    rows={2}
                    value={compActionTaken}
                    onChange={(e) => setCompActionTaken(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="ej: Se practicó sondaje nasogástrico para descompresión, hidratación por catéter y paseo continuo de 25 minutos."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Nueva Severidad Clínica:
                  </label>
                  <select
                    value={compNewSeverity}
                    onChange={(e) => setCompNewSeverity(e.target.value as DiseaseSeverity)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none font-bold"
                  >
                    <option value="grave">Grave / Urgente (Recomendado)</option>
                    <option value="moderada">Moderada</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Costo Adicional por Rescate (COP):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={compAdditionalCost}
                    onChange={(e) => setCompAdditionalCost(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="ej: 120000"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Pautas Urgentes para Palafrenero y Cuidadores en Box:
                </label>
                <textarea
                  rows={2}
                  value={compInstructionsForStables}
                  onChange={(e) => setCompInstructionsForStables(e.target.value)}
                  className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="ej: Retirar concentrado y heno hasta nueva orden. Monitorear bostezo o inquietud cada hora. Dejar agua limpia con electrólitos."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Veterinario que Atendió la Urgencia:
                  </label>
                  <input
                    type="text"
                    value={compRecordedBy}
                    onChange={(e) => setCompRecordedBy(e.target.value)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300 p-2.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40 w-full">
                    <input
                      type="checkbox"
                      checked={compNotifyOwner}
                      onChange={(e) => setCompNotifyOwner(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span>Generar alerta sanitaria urgente al propietario</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setComplicatingRecord(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-semibold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveComplication}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all transform active:scale-95"
              >
                <AlertTriangle className="w-4 h-4" />
                Registrar Complicación & Rescate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal para Reabrir Tratamiento por Error Humano o Recaída */}
      {reopeningRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 my-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-stone-900 dark:text-stone-100">
                    Reabrir Tratamiento Clínico
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Ejemplar: <strong className="text-stone-800 dark:text-stone-200">{reopeningRecord.horseName}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReopeningRecord(null)}
                className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Aviso informativo */}
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-300 dark:border-amber-800/80 text-xs text-amber-950 dark:text-amber-200 space-y-1">
              <strong className="block font-bold">Protección contra cierre prematuro o error humano:</strong>
              <p className="leading-relaxed">
                Esta acción reactivará el tratamiento a estado &ldquo;En Curso&rdquo;, restablecerá la condición del ejemplar a &ldquo;En Tratamiento&rdquo; y registrará la reapertura en la bitácora de auditoría.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Motivo de la Reapertura: *
                </label>
                <input
                  type="text"
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="ej: Marcado como finalizado por error humano / Recaída de síntomas tras 48h de alta"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Profesional Responsable:
                </label>
                <input
                  type="text"
                  value={reopenRecordedBy}
                  onChange={(e) => setReopenRecordedBy(e.target.value)}
                  className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-2.5 text-xs text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setReopeningRecord(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-semibold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReopen}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all transform active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Confirmar Reapertura de Tratamiento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Modal para Ver Bitácora de Auditoría e Historial Clínico */}
      {viewingHistoryRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-5 my-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-stone-900 dark:text-stone-100">
                    Bitácora de Auditoría y Trazabilidad Clínica
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Ejemplar: <strong className="text-stone-800 dark:text-stone-200">{viewingHistoryRecord.horseName}</strong> • {viewingHistoryRecord.diagnosis || viewingHistoryRecord.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingHistoryRecord(null)}
                className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Contenido de la bitácora */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
              {/* Evento inicial */}
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span className="font-bold text-stone-700 dark:text-stone-300">Apertura Inicial de Tratamiento</span>
                  <span>{viewingHistoryRecord.date}</span>
                </div>
                <p className="text-stone-800 dark:text-stone-200 font-semibold">
                  Tratamiento prescrito: {viewingHistoryRecord.title} ({viewingHistoryRecord.dosage || "Sin posología"})
                </p>
                <p className="text-stone-500">M.V.Z. a cargo: {viewingHistoryRecord.administeredBy}</p>
              </div>

              {/* Evento de reapertura si ocurrió */}
              {viewingHistoryRecord.isReopened && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reapertura de Tratamiento Registrada</span>
                  </div>
                  <p className="text-stone-700 dark:text-stone-300">
                    <strong>Motivo:</strong> {viewingHistoryRecord.reopenReason || "Reapertura de tratamiento"}
                  </p>
                </div>
              )}

              {/* Historial de Modificaciones (Auditoría) */}
              {viewingHistoryRecord.editHistory && viewingHistoryRecord.editHistory.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider text-[11px]">
                    Modificaciones Registradas ({viewingHistoryRecord.editHistory.length}):
                  </h4>
                  {viewingHistoryRecord.editHistory.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span className="font-bold text-amber-700 dark:text-amber-400">Modificado por {log.editedBy}</span>
                        <span>{new Date(log.date).toLocaleString("es-CO")}</span>
                      </div>
                      <p className="text-stone-800 dark:text-stone-200 font-semibold">{log.summary}</p>
                      {log.reason && (
                        <p className="text-stone-500 italic">
                          <strong>Motivo:</strong> {log.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Historial de Complicaciones */}
              {viewingHistoryRecord.complications && viewingHistoryRecord.complications.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-[11px]">
                    Complicaciones & Fármacos de Rescate ({viewingHistoryRecord.complications.length}):
                  </h4>
                  {viewingHistoryRecord.complications.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-rose-900 dark:text-rose-200 font-bold">
                        <span>{comp.date} {comp.time ? `• ${comp.time}` : ""}</span>
                        <span className="uppercase text-[10px] px-2 py-0.5 bg-rose-200 dark:bg-rose-900 rounded font-black">
                          {comp.newSeverity || "grave"}
                        </span>
                      </div>
                      <p className="text-stone-800 dark:text-stone-200">
                        <strong>Complicación:</strong> {comp.description}
                      </p>
                      {comp.additionalMedication && (
                        <p className="text-rose-900 dark:text-rose-300 font-semibold">
                          💊 <strong>Fármaco de rescate:</strong> {comp.additionalMedication}
                        </p>
                      )}
                      <p className="text-stone-600 dark:text-stone-400">
                        <strong>Acción tomada:</strong> {comp.actionTaken}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {(!viewingHistoryRecord.editHistory || viewingHistoryRecord.editHistory.length === 0) &&
               (!viewingHistoryRecord.complications || viewingHistoryRecord.complications.length === 0) &&
               !viewingHistoryRecord.isReopened && (
                <p className="text-center text-stone-500 py-6">
                  Este registro clínico no posee modificaciones ni complicaciones adicionales registradas.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setViewingHistoryRecord(null)}
                className="px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs transition-colors"
              >
                Cerrar Bitácora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
