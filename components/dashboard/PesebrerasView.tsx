"use client";

import React, { useState } from "react";
import {
  Pesebrera,
  PesebreraStatus,
  MaintenanceType,
  PesebreraMaintenanceRecord,
  Horse,
  PaymentRecord,
  ReleaseReason,
} from "@/types";
import {
  Building2,
  CheckCircle2,
  Wrench,
  ShieldAlert,
  LayoutGrid,
  Maximize2,
  Sparkles,
  Plus,
  X,
  Calendar,
  User,
  DollarSign,
  FileText,
  Clock,
  Check,
  RotateCcw,
  AlertTriangle,
  ArrowRightLeft,
  LogOut,
  CreditCard,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Info,
  Search,
  MapPin,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PesebrerasViewProps {
  pesebreras: Pesebrera[];
  horses?: Horse[];
  payments?: PaymentRecord[];
  onStatusChange: (
    id: string,
    status: PesebreraStatus,
    maintenanceInfo?: any
  ) => void;
  onReactivateHorse?: (boxId: string) => void;
  onApproveMaintenance?: (
    boxId: string,
    approvalData: {
      approvedBy: string;
      notes?: string;
      targetStatus?: "auto" | "disponible" | "ocupada";
    }
  ) => void;
  onAddMaintenance?: (boxId: string, maintenance: any) => void;
  onReleaseHorse?: (payload: {
    boxId: string;
    horseId: string;
    action: ReleaseReason;
    targetBoxId?: string;
    notes?: string;
    allowWithDebt?: boolean;
  }) => void;
  onMarkPaymentPaid?: (paymentId: string) => void;
  onSelectHorse?: (horseId: string) => void;
}

const MAINTENANCE_TYPES: { id: MaintenanceType; label: string; icon: string }[] = [
  { id: "cambio_cama", label: "Limpieza y Cambio de Cama / Viruta", icon: "🧹" },
  { id: "desinfeccion", label: "Desinfección Profunda y Encalado", icon: "🧪" },
  { id: "reparacion_bebedero", label: "Reparación / Mantenimiento de Bebedero", icon: "💧" },
  { id: "reparacion_comedero", label: "Reparación / Ajuste de Comedero", icon: "🌾" },
  { id: "pintura_madera", label: "Mantenimiento de Madera, Pintura o Puerta", icon: "🪵" },
  { id: "fumigacion", label: "Fumigación y Control de Plagas", icon: "🛡️" },
  { id: "mantenimiento_general", label: "Mantenimiento General de Estructura", icon: "🔧" },
  { id: "otro", label: "Otro Mantenimiento Específico", icon: "📝" },
];

export function PesebrerasView({
  pesebreras,
  horses = [],
  payments = [],
  onStatusChange,
  onReactivateHorse,
  onApproveMaintenance,
  onAddMaintenance,
  onReleaseHorse,
  onMarkPaymentPaid,
  onSelectHorse,
}: PesebrerasViewProps) {
  const [filter, setFilter] = useState<string>("todas");
  const [zoneFilter, setZoneFilter] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cardSize, setCardSize] = useState<"compact" | "detailed">("compact");

  // Estado para el Modal de Mantenimiento
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedBoxForMaintenance, setSelectedBoxForMaintenance] =
    useState<Pesebrera | null>(null);

  // Formulario del modal de mantenimiento (Soporte de Selección Múltiple)
  const [selectedMaintTypes, setSelectedMaintTypes] = useState<MaintenanceType[]>([
    "cambio_cama",
    "desinfeccion",
  ]);
  const [maintDescription, setMaintDescription] = useState("");
  const [maintResponsible, setMaintResponsible] = useState("Mayordomía / Operario de Cuadra");
  const [maintCost, setMaintCost] = useState<number | "">("");

  // Estados para el Modal de Aprobación de Mantenimiento y Habilitación
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [boxToApprove, setBoxToApprove] = useState<Pesebrera | null>(null);
  const [approvalInspector, setApprovalInspector] = useState("Mayordomo Principal");
  const [approvalNotes, setApprovalNotes] = useState(
    "Mantenimiento inspeccionado a satisfacción. Pesebrera limpia, desinfectada y lista para uso."
  );
  const [approvalTargetStatus, setApprovalTargetStatus] = useState<"auto" | "ocupada" | "disponible">("auto");
  const [approvalSuccessMessage, setApprovalSuccessMessage] = useState<string | null>(null);

  // Estado para el Modal de Liberación / Salida / Reubicación de Equino
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [boxToRelease, setBoxToRelease] = useState<Pesebrera | null>(null);
  const [releaseAction, setReleaseAction] = useState<ReleaseReason>("salida_criadero");
  const [targetBoxId, setTargetBoxId] = useState<string>("");
  const [releaseNotes, setReleaseNotes] = useState<string>("");
  const [authorizeWithDebt, setAuthorizeWithDebt] = useState<boolean>(false);

  // Zonas / Naves disponibles calculadas dinámicamente
  const availableZones = React.useMemo(() => {
    const set = new Set<string>();
    pesebreras.forEach((b) => {
      if (b.zone && b.zone.trim()) set.add(b.zone.trim());
    });
    return Array.from(set).sort();
  }, [pesebreras]);

  const normalizeText = (str?: string | null) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const filteredPesebreras = pesebreras.filter((box) => {
    if (filter !== "todas" && box.status !== filter) return false;
    if (zoneFilter !== "todas" && box.zone !== zoneFilter) return false;
    if (searchQuery.trim()) {
      const q = normalizeText(searchQuery);
      const matchCode = normalizeText(box.code).includes(q);
      const matchName = normalizeText(box.name).includes(q);
      const matchZone = normalizeText(box.zone).includes(q);
      const matchHorse = normalizeText(box.horseName || box.assignedHorseName).includes(q);
      if (!matchCode && !matchName && !matchZone && !matchHorse) return false;
    }
    return true;
  });

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: PesebreraStatus, isCompact: boolean) => {
    switch (status) {
      case "disponible":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Disponible
          </span>
        );
      case "ocupada":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
            Ocupada
          </span>
        );
      case "mantenimiento":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            <Wrench className="w-3 h-3 text-amber-600 animate-bounce" />
            {isCompact ? "Mantenimiento" : "Mantenimiento (Por Aprobar)"}
          </span>
        );
      case "cuarentena":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            <ShieldAlert className="w-3 h-3" />
            Cuarentena
          </span>
        );
    }
  };

  const openMaintenanceModal = (box: Pesebrera) => {
    setSelectedBoxForMaintenance(box);
    const activeMaint = box.maintenanceHistory?.[0];
    if (activeMaint?.types && activeMaint.types.length > 0) {
      setSelectedMaintTypes([...activeMaint.types]);
    } else if (activeMaint?.type) {
      setSelectedMaintTypes([activeMaint.type]);
    } else {
      setSelectedMaintTypes(["cambio_cama", "desinfeccion"]);
    }
    setMaintDescription(activeMaint?.description || "");
    setMaintResponsible(box.currentMaintenanceResponsible || "Mayordomía / Operario de Cuadra");
    setMaintCost(activeMaint?.cost || "");
    setIsMaintenanceModalOpen(true);
  };

  const toggleMaintType = (typeId: MaintenanceType) => {
    setSelectedMaintTypes((prev) => {
      if (prev.includes(typeId)) {
        return prev.filter((id) => id !== typeId);
      } else {
        return [...prev, typeId];
      }
    });
  };

  const handleSelectAllMaintTypes = () => {
    setSelectedMaintTypes(MAINTENANCE_TYPES.map((t) => t.id));
  };

  const handleClearMaintTypes = () => {
    setSelectedMaintTypes(["cambio_cama"]);
  };

  const handleSaveMaintenance = (action: "set_maintenance" | "reactivate" | "log_only" | "set_available") => {
    if (!selectedBoxForMaintenance) return;

    if (action !== "set_available" && selectedMaintTypes.length === 0) {
      alert("Por favor selecciona al menos una labor técnica de mantenimiento.");
      return;
    }

    const selectedTypeObjs = MAINTENANCE_TYPES.filter((t) => selectedMaintTypes.includes(t.id));
    const typeNames = selectedTypeObjs.map((t) => t.label);
    const typeName = typeNames.length > 0 ? typeNames.join(" + ") : "Mantenimiento General";
    const primaryType = selectedMaintTypes[0] || "mantenimiento_general";

    const payload = {
      type: primaryType,
      typeName,
      types: selectedMaintTypes,
      typeNames,
      description: maintDescription.trim() || `Labores realizadas: ${typeNames.join(", ")}`,
      responsiblePerson: maintResponsible.trim() || "Mayordomía",
      cost: maintCost ? Number(maintCost) : undefined,
    };

    if (action === "set_maintenance") {
      onStatusChange(selectedBoxForMaintenance.id, "mantenimiento", payload);
    } else if (action === "reactivate") {
      if (onAddMaintenance) {
        onAddMaintenance(selectedBoxForMaintenance.id, {
          ...payload,
          reactivateHorse: true,
        });
      } else if (onReactivateHorse) {
        onReactivateHorse(selectedBoxForMaintenance.id);
      } else {
        onStatusChange(selectedBoxForMaintenance.id, "ocupada", payload);
      }
    } else if (action === "set_available") {
      onStatusChange(selectedBoxForMaintenance.id, "disponible");
    } else if (action === "log_only") {
      if (onAddMaintenance) {
        onAddMaintenance(selectedBoxForMaintenance.id, payload);
      }
    }

    setIsMaintenanceModalOpen(false);
  };

  // Reactivar directamente al caballo titular desde la tarjeta
  const handleQuickReactivate = (box: Pesebrera) => {
    if (onReactivateHorse) {
      onReactivateHorse(box.id);
    } else {
      onStatusChange(box.id, "ocupada");
    }
  };

  // Abrir modal para aprobar formalmente el mantenimiento y habilitar el box para uso
  const openApprovalModal = (box: Pesebrera) => {
    setBoxToApprove(box);
    setApprovalInspector("Mayordomo Principal");
    const horseName = box.assignedHorseName || box.horseName;
    setApprovalNotes(
      horseName
        ? `Mantenimiento inspeccionado a satisfacción. Pesebrera limpia, desinfectada y bebedero verificado para el reingreso de ${horseName}.`
        : "Mantenimiento inspeccionado y concluido a satisfacción. Pesebrera habilitada y lista para uso."
    );
    setApprovalTargetStatus("auto");
    setIsApprovalModalOpen(true);
  };

  const handleExecuteApproval = (box: Pesebrera) => {
    if (onApproveMaintenance) {
      onApproveMaintenance(box.id, {
        approvedBy: approvalInspector.trim() || "Mayordomía",
        notes: approvalNotes.trim(),
        targetStatus: approvalTargetStatus,
      });
    } else {
      if (
        (approvalTargetStatus === "auto" && (box.assignedHorseId || box.horseId)) ||
        approvalTargetStatus === "ocupada"
      ) {
        if (onReactivateHorse) onReactivateHorse(box.id);
        else onStatusChange(box.id, "ocupada");
      } else {
        onStatusChange(box.id, "disponible");
      }
    }

    const horseLabel = box.assignedHorseName || box.horseName;
    const dest =
      (approvalTargetStatus === "auto" && horseLabel) || approvalTargetStatus === "ocupada"
        ? `ocupada y en uso por ${horseLabel}`
        : "disponible para nuevo huésped";

    setApprovalSuccessMessage(
      `¡Mantenimiento de ${box.code} aprobado con éxito! La pesebrera queda ${dest}.`
    );
    setTimeout(() => setApprovalSuccessMessage(null), 6000);

    setIsApprovalModalOpen(false);
    setIsMaintenanceModalOpen(false);
  };

  // Iniciar proceso de liberación o desocupación con advertencia
  const handleInitiateRelease = (box: Pesebrera) => {
    const hasHorse = Boolean(box.horseId || box.assignedHorseId);
    if (hasHorse) {
      setBoxToRelease(box);
      setReleaseAction("salida_criadero");
      setReleaseNotes("");
      setAuthorizeWithDebt(false);

      const availableBoxes = pesebreras.filter(
        (b) => b.status === "disponible" && b.id !== box.id
      );
      setTargetBoxId(availableBoxes.length > 0 ? availableBoxes[0].id : "");

      setIsReleaseModalOpen(true);
    } else {
      onStatusChange(box.id, "disponible");
    }
  };

  // Confirmar y guardar la acción de liberación o traslado
  const handleConfirmRelease = () => {
    if (!boxToRelease) return;
    const horseId = boxToRelease.horseId || boxToRelease.assignedHorseId;
    if (!horseId) {
      onStatusChange(boxToRelease.id, "disponible");
      setIsReleaseModalOpen(false);
      setBoxToRelease(null);
      return;
    }

    if (onReleaseHorse) {
      onReleaseHorse({
        boxId: boxToRelease.id,
        horseId,
        action: releaseAction,
        targetBoxId: releaseAction === "cambio_pesebrera" ? targetBoxId : undefined,
        notes: releaseNotes.trim(),
        allowWithDebt: authorizeWithDebt,
      });
    } else {
      onStatusChange(boxToRelease.id, "disponible");
    }

    setIsReleaseModalOpen(false);
    setBoxToRelease(null);
  };

  // Datos calculados para el Modal de Liberación / Reubicación
  const releasingHorseId = boxToRelease?.horseId || boxToRelease?.assignedHorseId;
  const releasingHorse = horses.find((h) => h.id === releasingHorseId);
  const horseDisplayName =
    boxToRelease?.assignedHorseName ||
    boxToRelease?.horseName ||
    releasingHorse?.name ||
    "Ejemplar";
  const ownerDisplayName = releasingHorse?.ownerName || "Propietario registrado";

  // Verificación financiera del canon y otros servicios para este equino
  const horsePayments = payments.filter((p) => p.horseId === releasingHorseId);
  const pendingPayments = horsePayments.filter(
    (p) => p.status === "pendiente" || p.status === "vencido"
  );
  const totalDebt = pendingPayments.reduce((acc, p) => acc + p.amount, 0);
  const isUpToDate = pendingPayments.length === 0;

  const availableTargetBoxes = pesebreras.filter(
    (b) => b.status === "disponible" && b.id !== boxToRelease?.id
  );
  const selectedTargetBox = pesebreras.find((b) => b.id === targetBoxId);

  return (
    <div className="space-y-5">
      {/* Banner de Confirmación de Aprobación de Mantenimiento */}
      {approvalSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{approvalSuccessMessage}</span>
          </div>
          <button
            onClick={() => setApprovalSuccessMessage(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 text-xs cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra Superior: Filtros de Estado, Botón de Nuevo Mantenimiento y Selector de Fichas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3.5 sm:p-4 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-xs">
        {/* Filtros rápidos por estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none flex-wrap">
          {[
            { id: "todas", label: `Todas (${pesebreras.length})` },
            {
              id: "disponible",
              label: `Disponibles (${pesebreras.filter((b) => b.status === "disponible").length})`,
            },
            {
              id: "ocupada",
              label: `Ocupadas (${pesebreras.filter((b) => b.status === "ocupada").length})`,
            },
            {
              id: "mantenimiento",
              label: `Mantenimiento (${pesebreras.filter((b) => b.status === "mantenimiento").length})`,
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filter === item.id
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Buscador Rápido y Filtro por Nave / Zona */}
        <div className="flex items-center gap-2 flex-1 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar box, caballo o zona..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {availableZones.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 hidden sm:inline" />
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="todas">Todas las Zonas</option>
                {availableZones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Acciones de Cabecera: Registrar Mantenimiento y Selector de Densidad */}
        <div className="flex items-center justify-between md:justify-end gap-2 text-xs flex-wrap">
          {/* Botón para abrir modal de mantenimiento general */}
          <Button
            size="sm"
            onClick={() => {
              if (pesebreras.length > 0) openMaintenanceModal(pesebreras[0]);
            }}
            className="gap-1.5 cursor-pointer text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Registrar Mantenimiento</span>
          </Button>

          {/* Selector de Densidad / Fichas Pequeñas */}
          <div className="inline-flex p-0.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80">
            <button
              onClick={() => setCardSize("compact")}
              title="Fichas Pequeñas (Recomendado para ver todas en pantalla)"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cardSize === "compact"
                  ? "bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-300 shadow-xs"
                  : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Fichas Pequeñas</span>
            </button>
            <button
              onClick={() => setCardSize("detailed")}
              title="Fichas Ampliadas con detalles expandidos"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                cardSize === "detailed"
                  ? "bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-300 shadow-xs"
                  : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Ampliadas</span>
            </button>
          </div>
        </div>
      </div>

      {/* CUADRÍCULA DE FICHAS PEQUEÑAS / COMPACTAS (Predeterminada) */}
      {filteredPesebreras.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-10 border border-stone-200/90 dark:border-stone-800 text-center space-y-3">
          <Building2 className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
          <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
            No se encontraron pesebreras con los criterios seleccionados
          </h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery || zoneFilter !== "todas" || filter !== "todas"
              ? "Prueba a cambiar el estado, la nave/zona o limpia el texto de búsqueda."
              : "No hay registros de pesebreras en el sistema."}
          </p>
          {(searchQuery || zoneFilter !== "todas" || filter !== "todas") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFilter("todas");
                setZoneFilter("todas");
                setSearchQuery("");
              }}
              className="text-xs cursor-pointer"
            >
              Restablecer Filtros
            </Button>
          )}
        </div>
      ) : cardSize === "compact" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3">
          {filteredPesebreras.map((box) => {
            const hasAssignedHorse = Boolean(box.assignedHorseName || box.horseName);
            const titularHorseName = box.assignedHorseName || box.horseName;

            return (
              <div
                key={box.id}
                className={`border rounded-2xl p-3 bg-white dark:bg-stone-900 transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                  box.status === "disponible"
                    ? "border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-300"
                    : box.status === "ocupada"
                    ? "border-stone-200/90 dark:border-stone-800 hover:border-sky-300 dark:hover:border-sky-800"
                    : "border-amber-400 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs"
                }`}
              >
                {/* Encabezado Ficha Pequeña: Código y Estado */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[11px] font-bold font-mono tracking-wider text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      {box.code}
                    </span>
                    {getStatusBadge(box.status, true)}
                  </div>

                  <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-xs sm:text-sm truncate">
                    {box.name}
                  </h3>
                  <p className="text-[10px] text-stone-400 truncate mb-2">
                    {box.zone} • {box.type}
                  </p>

                  {/* Tarjetita del Huésped / Estado */}
                  <div className="rounded-xl p-2 mb-2 border transition-all text-left">
                    {box.status === "ocupada" && titularHorseName ? (
                      <div className="flex items-center gap-2">
                        <span className="text-base flex-shrink-0">🐎</span>
                        <div className="min-w-0">
                          <span className="text-[9px] text-stone-400 block uppercase font-bold">
                            Huésped
                          </span>
                          <span className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate block">
                            {titularHorseName}
                          </span>
                        </div>
                      </div>
                    ) : box.status === "mantenimiento" ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-bold">
                          <Wrench className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {box.currentMaintenanceReason || "En Mantenimiento"}
                          </span>
                        </div>
                        {titularHorseName && (
                          <div className="flex items-center gap-1 text-[11px] text-stone-600 dark:text-stone-300 font-semibold bg-white/80 dark:bg-stone-900/80 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">
                            <span>🐎 Huésped:</span>
                            <span className="truncate font-bold text-amber-950 dark:text-amber-200">
                              {titularHorseName}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">Listo para ingreso</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pie de Ficha: Precio mensual y Botones de Acción */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[9px] text-stone-400">Canon</span>
                    <span className="font-bold text-stone-900 dark:text-stone-200">
                      {formatCOP(box.monthlyPrice)}
                    </span>
                  </div>

                  {/* BOTONES INTERACTIVOS DE MANTENIMIENTO Y REACTIVACIÓN */}
                  <div className="flex items-center gap-1 pt-1">
                    {box.status === "mantenimiento" ? (
                      <>
                        {/* BOTÓN PRINCIPAL: DAR APROBADO AL MANTENIMIENTO Y HABILITAR PARA USO */}
                        <button
                          onClick={() => openApprovalModal(box)}
                          title={`Dar aprobado técnico al mantenimiento de ${box.code} y habilitar para uso`}
                          className="flex-1 py-1 px-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {hasAssignedHorse
                              ? `Aprobar y Reintegrar a ${titularHorseName?.split(" ")[0]}`
                              : "Aprobar y Habilitar"}
                          </span>
                        </button>

                        <button
                          onClick={() => openMaintenanceModal(box)}
                          title="Ver o editar detalles del mantenimiento"
                          className="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 hover:bg-amber-200 transition-colors cursor-pointer"
                        >
                          <Wrench className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Botón para iniciar o registrar mantenimiento */}
                        <button
                          onClick={() => openMaintenanceModal(box)}
                          title="Registrar tipo de mantenimiento o acondicionamiento"
                          className="flex-1 py-1 px-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[10px] font-bold flex items-center justify-center gap-1 border border-amber-200/80 dark:border-amber-800 transition-colors cursor-pointer"
                        >
                          <Wrench className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Mantenimiento</span>
                        </button>

                        {box.status === "ocupada" && (
                          <button
                            onClick={() => handleInitiateRelease(box)}
                            title="Liberar o desocupar este box"
                            className="px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 text-stone-600 dark:text-stone-300 text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            Liberar
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA DETALLADA / AMPLIADA */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPesebreras.map((box) => {
            const titularHorseName = box.assignedHorseName || box.horseName;
            const hasAssignedHorse = Boolean(titularHorseName);

            return (
              <div
                key={box.id}
                className={`border rounded-2xl p-5 bg-white dark:bg-stone-900 transition-all duration-200 hover:shadow-md ${
                  box.status === "disponible"
                    ? "border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-300"
                    : box.status === "ocupada"
                    ? "border-stone-200/90 dark:border-stone-800"
                    : "border-amber-400 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold tracking-wider uppercase text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      {box.code}
                    </span>
                    <h3 className="mt-1.5 font-bold text-stone-900 dark:text-stone-100 text-lg">
                      {box.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{box.zone}</p>
                  </div>
                  <div>{getStatusBadge(box.status, false)}</div>
                </div>

                <div className="mt-4 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                  {box.status === "ocupada" && titularHorseName ? (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
                        🐎
                      </div>
                      <div className="truncate">
                        <span className="text-xs text-stone-400 block font-medium">Huésped actual</span>
                        <span className="font-semibold text-stone-900 dark:text-stone-100 text-sm truncate block">
                          {titularHorseName}
                        </span>
                      </div>
                    </div>
                  ) : box.status === "mantenimiento" ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-bold">
                        <Wrench className="w-4 h-4 text-amber-600" />
                        <span>{box.currentMaintenanceReason || "Acondicionamiento o reparación"}</span>
                      </div>
                      {titularHorseName && (
                        <p className="text-xs text-stone-600 dark:text-stone-300">
                          Huésped asignado: <strong>{titularHorseName}</strong> (Se reintegrará al finalizar)
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                      <Building2 className="w-4 h-4" />
                      <span>Espacio listo para asignación</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-stone-100 dark:border-stone-800/80 pt-3 text-stone-600 dark:text-stone-400">
                  <div>
                    <span className="block text-stone-400 font-normal">Tipo</span>
                    <span className="font-medium capitalize">{box.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-stone-400 font-normal">Canon Mensual</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {formatCOP(box.monthlyPrice)}
                    </span>
                  </div>
                </div>

                {/* Acciones ampliadas */}
                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs gap-2 flex-wrap">
                  {box.status === "mantenimiento" ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => openApprovalModal(box)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {hasAssignedHorse
                            ? `Aprobar y Reintegrar a ${titularHorseName}`
                            : "Aprobar y Habilitar para Uso"}
                        </span>
                      </button>

                      <button
                        onClick={() => openMaintenanceModal(box)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-semibold transition-colors cursor-pointer"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>Detalles</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openMaintenanceModal(box)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-semibold transition-colors cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Registrar Mantenimiento</span>
                    </button>
                  )}

                  {box.status !== "disponible" && (
                    <button
                      onClick={() => handleInitiateRelease(box)}
                      title="Liberar o desocupar este box"
                      className="px-2.5 py-1.5 rounded-xl text-stone-500 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors cursor-pointer"
                    >
                      Liberar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: REGISTRAR TIPO DE MANTENIMIENTO Y REACTIVACIÓN */}
      {/* =================================================================== */}
      {isMaintenanceModalOpen && selectedBoxForMaintenance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                    <span>Mantenimiento: {selectedBoxForMaintenance.code}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {selectedBoxForMaintenance.name}
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Registra la labor técnica, cambio de cama o reparaciones efectuadas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Aviso de Mantenimiento en Curso y Botón de Aprobación */}
            {selectedBoxForMaintenance.status === "mantenimiento" && (
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 flex items-center justify-between gap-3 flex-wrap shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    🛠️
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-950 dark:text-amber-100 block">
                      Labor Actual: {selectedBoxForMaintenance.currentMaintenanceReason || "Mantenimiento General"}
                    </span>
                    <span className="text-[11px] text-amber-800 dark:text-amber-300">
                      Estado: En ejecución • Requiere Aprobación para salir a uso
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => openApprovalModal(selectedBoxForMaintenance)}
                  className="gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aprobar y Habilitar para Uso</span>
                </Button>
              </div>
            )}

            {/* Aviso sobre el caballo huésped */}
            {(selectedBoxForMaintenance.assignedHorseName || selectedBoxForMaintenance.horseName) && (
              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-start gap-3">
                <span className="text-lg">🐎</span>
                <div className="text-xs">
                  <span className="font-bold text-sky-950 dark:text-sky-200 block">
                    Huésped Titular Asignado: {selectedBoxForMaintenance.assignedHorseName || selectedBoxForMaintenance.horseName}
                  </span>
                  <p className="text-sky-800 dark:text-sky-300 mt-0.5">
                    Al poner el box en mantenimiento, el caballo continúa registrado como dueño de esta plaza. Podrás reactivarlo al terminar con un solo clic.
                  </p>
                </div>
              </div>
            )}

            {/* Selector de Pesebrera alternativa (si se abrió desde cabecera) */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                Pesebrera a Intervenir
              </label>
              <select
                value={selectedBoxForMaintenance.id}
                onChange={(e) => {
                  const b = pesebreras.find((item) => item.id === e.target.value);
                  if (b) setSelectedBoxForMaintenance(b);
                }}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {pesebreras.map((box) => (
                  <option key={box.id} value={box.id}>
                    {box.code} - {box.name} ({box.status.toUpperCase()}) {box.horseName ? `• ${box.horseName}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector del Tipo de Mantenimiento con Selección Múltiple */}
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    Labores Técnicas a Realizar (Selección Múltiple) *
                  </label>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                    {selectedMaintTypes.length} seleccionada{selectedMaintTypes.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllMaintTypes}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Marcar Todas
                  </button>
                  <span className="text-stone-300 dark:text-stone-700">•</span>
                  <button
                    type="button"
                    onClick={handleClearMaintTypes}
                    className="text-[11px] font-medium text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer"
                  >
                    Solo Cama
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mb-2">
                Haz clic en una o varias opciones para combinarlas en esta misma jornada de mantenimiento.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MAINTENANCE_TYPES.map((t) => {
                  const isSelected = selectedMaintTypes.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleMaintType(t.id)}
                      className={`p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2.5 text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-100 shadow-xs ring-2 ring-amber-500/40"
                          : "bg-white dark:bg-stone-800/70 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base flex-shrink-0">{t.icon}</span>
                        <span className="truncate">{t.label}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 border transition-all ${
                          isSelected
                            ? "bg-amber-600 border-amber-600 text-white"
                            : "border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedMaintTypes.length === 0 && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Debes seleccionar al menos una labor técnica de mantenimiento.
                </p>
              )}
            </div>

            {/* Descripción y Observaciones */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                Detalle de la Labor y Productos Utilizados
              </label>
              <textarea
                rows={2}
                value={maintDescription}
                onChange={(e) => setMaintDescription(e.target.value)}
                placeholder="ej: Se retiró viruta húmeda, se desinfectó el suelo con cal viva y se ajustó la válvula flotadora del bebedero."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
              />
            </div>

            {/* Responsable y Costo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Responsable / Operario *
                </label>
                <input
                  type="text"
                  required
                  value={maintResponsible}
                  onChange={(e) => setMaintResponsible(e.target.value)}
                  placeholder="ej: Mayordomo Jairo / Operario Carlos"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Costo de Insumos / Mano de Obra (COP)
                </label>
                <input
                  type="number"
                  value={maintCost}
                  onChange={(e) => setMaintCost(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="ej: 45000"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                />
              </div>
            </div>

            {/* BOTONES DE ACCIÓN INTELIGENTES SEGÚN ESTADO */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="w-full sm:w-auto text-xs cursor-pointer"
                >
                  Cancelar
                </Button>

                {/* Si está en mantenimiento: APROBAR Y HABILITAR PARA USO */}
                {selectedBoxForMaintenance.status === "mantenimiento" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openApprovalModal(selectedBoxForMaintenance)}
                    className="w-full sm:w-auto gap-2 text-xs bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-sm font-bold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {selectedBoxForMaintenance.assignedHorseName || selectedBoxForMaintenance.horseName
                        ? `Aprobar y Reintegrar a ${selectedBoxForMaintenance.assignedHorseName || selectedBoxForMaintenance.horseName}`
                        : "Aprobar Mantenimiento y Habilitar Uso"}
                    </span>
                  </Button>
                )}

                {/* Si no está en mantenimiento: Pasarlo a mantenimiento */}
                {selectedBoxForMaintenance.status !== "mantenimiento" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSaveMaintenance("set_maintenance")}
                    className="w-full sm:w-auto gap-2 text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-sm"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Iniciar Mantenimiento en este Box</span>
                  </Button>
                )}

                {/* Registrar solo en bitácora sin alterar estado */}
                <button
                  type="button"
                  onClick={() => handleSaveMaintenance("log_only")}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Guardar Tarea en Historial
                </button>
              </div>
            </div>

            {/* HISTORIAL PREVIO DE MANTENIMIENTOS DEL BOX */}
            {selectedBoxForMaintenance.maintenanceHistory &&
              selectedBoxForMaintenance.maintenanceHistory.length > 0 && (
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                    Historial de Intervenciones Anteriores ({selectedBoxForMaintenance.maintenanceHistory.length})
                  </span>
                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                    {selectedBoxForMaintenance.maintenanceHistory.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 flex items-start justify-between text-xs gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100 flex-wrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>{rec.typeName}</span>
                            {rec.status === "aprobado" || rec.completedAt ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                ✓ Aprobado {rec.approvedBy ? `(${rec.approvedBy})` : ""}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                ⏳ Pendiente Aprobación
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                            {rec.description}
                          </p>
                          {rec.approvalNotes && (
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 italic mt-0.5">
                              “{rec.approvalNotes}”
                            </p>
                          )}
                          <span className="text-[10px] text-stone-400 block mt-0.5">
                            Resp: {rec.responsiblePerson} • {rec.date}
                          </span>
                        </div>
                        {rec.cost && (
                          <span className="text-[11px] font-bold font-mono text-emerald-800 dark:text-emerald-300 shrink-0">
                            {formatCOP(rec.cost)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADVERTENCIA Y LIBERACIÓN / REUBICACIÓN / AUDITORÍA DE CANON */}
      {/* =================================================================== */}
      {isReleaseModalOpen && boxToRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                    <span>Desocupar Pesebrera: {boxToRelease.code}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {boxToRelease.name}
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Advertencia y confirmación de egreso o traslado del ejemplar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReleaseModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ficha Resumen del Caballo Huésped */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center justify-center text-lg">
                  🐎
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                    {horseDisplayName}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                    Propietario: {ownerDisplayName}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-400 block uppercase font-bold">Canon Mensual</span>
                <span className="text-xs font-bold font-mono text-stone-900 dark:text-stone-200">
                  {formatCOP(boxToRelease.monthlyPrice)}
                </span>
              </div>
            </div>

            {/* SELECCIÓN DE MOTIVO: Salida del Criadero vs Reubicación */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wider text-[11px]">
                ¿Por qué motivo estás liberando este box? *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Opción 1: Salida Definitiva del Criadero */}
                <button
                  type="button"
                  onClick={() => setReleaseAction("salida_criadero")}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    releaseAction === "salida_criadero"
                      ? "bg-rose-50/70 dark:bg-rose-950/40 border-rose-400 dark:border-rose-800 text-rose-950 dark:text-rose-200 ring-2 ring-rose-400/40"
                      : "bg-white dark:bg-stone-800/70 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex-shrink-0 mt-0.5">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs block text-stone-900 dark:text-stone-100">
                      Se fue del Criadero
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5 leading-tight">
                      Salida definitiva del centro ecuestre. Requiere verificar que esté al día en el pago del canon.
                    </span>
                  </div>
                </button>

                {/* Opción 2: Reubicación / Cambio de Pesebrera */}
                <button
                  type="button"
                  onClick={() => setReleaseAction("cambio_pesebrera")}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    releaseAction === "cambio_pesebrera"
                      ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/40"
                      : "bg-white dark:bg-stone-800/70 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex-shrink-0 mt-0.5">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs block text-stone-900 dark:text-stone-100">
                      Cambio de Pesebrera
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5 leading-tight">
                      Se traslada a otra pesebrera disponible sin abandonar las instalaciones del criadero.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* CASO A: SALIDA DEFINITIVA DEL CRIADERO (VERIFICACIÓN DE CANON) */}
            {releaseAction === "salida_criadero" && (
              <div className="space-y-3 pt-1">
                {/* Tarjeta de Control Financiero */}
                {isUpToDate ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <span className="font-extrabold text-emerald-900 dark:text-emerald-200 block text-sm">
                        ✅ Paz y Salvo en Canon y Mensualidades
                      </span>
                      <p className="text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed">
                        El ejemplar <strong>{horseDisplayName}</strong> se encuentra al día con el pago del canon de pesebrera y no registra recibos pendientes. Salida habilitada.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <span className="font-extrabold text-rose-950 dark:text-rose-200 block text-sm">
                          ⛔ Advertencia: El equino registra cánones pendientes de pago
                        </span>
                        <p className="text-rose-800 dark:text-rose-300 mt-0.5">
                          Saldo total adeudado: <strong className="font-mono text-rose-900 dark:text-rose-100">{formatCOP(totalDebt)}</strong> en {pendingPayments.length} recibo(s).
                        </p>
                      </div>
                    </div>

                    {/* Desglose de recibos pendientes con opción de saldar */}
                    <div className="space-y-2 pt-1 max-h-40 overflow-y-auto pr-1">
                      {pendingPayments.map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-rose-200 dark:border-rose-900/60 text-xs gap-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                              <span className="font-mono text-rose-700 dark:text-rose-400">{rec.receiptNumber}</span>
                              <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold">
                                {rec.status === "vencido" ? "Vencido" : "Pendiente"}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-600 dark:text-stone-300 truncate">{rec.concept}</p>
                            <span className="text-[10px] text-stone-400">Venció: {rec.dueDate}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
                              {formatCOP(rec.amount)}
                            </span>
                            {onMarkPaymentPaid && (
                              <button
                                type="button"
                                onClick={() => onMarkPaymentPaid(rec.id)}
                                title="Marcar este recibo como pagado inmediatamente"
                                className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              >
                                <Check className="w-3 h-3" />
                                <span>Saldar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Casilla de autorización excepcional */}
                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-800/80 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={authorizeWithDebt}
                        onChange={(e) => setAuthorizeWithDebt(e.target.checked)}
                        className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-amber-950 dark:text-amber-200 font-semibold leading-tight">
                        Autorizar salida extraordinaria con saldo pendiente (La deuda continuará vigente en la cartera del propietario: {ownerDisplayName}).
                      </span>
                    </label>
                  </div>
                )}

                {/* Observaciones de salida */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Observaciones o Destino del Egreso
                  </label>
                  <input
                    type="text"
                    value={releaseNotes}
                    onChange={(e) => setReleaseNotes(e.target.value)}
                    placeholder="ej: Traslado a criadero en Rionegro / Venta a nuevo propietario / Descanso"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            )}

            {/* CASO B: CAMBIO / REUBICACIÓN DE PESEBRERA */}
            {releaseAction === "cambio_pesebrera" && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Selecciona la Pesebrera de Destino *
                  </label>
                  {availableTargetBoxes.length > 0 ? (
                    <select
                      value={targetBoxId}
                      onChange={(e) => setTargetBoxId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      {availableTargetBoxes.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.code} - {target.name} ({target.zone} • {target.type.toUpperCase()}) — {formatCOP(target.monthlyPrice)}/mes
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                      ⚠️ No hay otras pesebreras disponibles en este momento. Debes liberar o habilitar una primero.
                    </div>
                  )}
                </div>

                {/* Nota informativa de cartera */}
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                    <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>El historial clínico y estado de cuenta se transfieren con el ejemplar.</span>
                  </div>
                  <span className={`font-bold ${isUpToDate ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                    {isUpToDate ? "Canon: Al día" : `Pendiente: ${formatCOP(totalDebt)}`}
                  </span>
                </div>

                {/* Motivo del traslado */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                    Motivo del Traslado
                  </label>
                  <input
                    type="text"
                    value={releaseNotes}
                    onChange={(e) => setReleaseNotes(e.target.value)}
                    placeholder="ej: Mejor ventilación, cercanía al picadero, recuperación médica"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            )}

            {/* BOTONES DE ACCIÓN */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsReleaseModalOpen(false)}
                className="w-full sm:w-auto text-xs cursor-pointer"
              >
                Cancelar
              </Button>

              {releaseAction === "salida_criadero" ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={!isUpToDate && !authorizeWithDebt}
                  onClick={handleConfirmRelease}
                  className={`w-full sm:w-auto gap-2 text-xs font-bold text-white cursor-pointer shadow-sm ${
                    !isUpToDate && !authorizeWithDebt
                      ? "bg-stone-400 cursor-not-allowed opacity-60"
                      : "bg-rose-700 hover:bg-rose-800"
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Confirmar Salida Definitiva del Criadero</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={availableTargetBoxes.length === 0 || !targetBoxId}
                  onClick={handleConfirmRelease}
                  className={`w-full sm:w-auto gap-2 text-xs font-bold text-white cursor-pointer shadow-sm ${
                    availableTargetBoxes.length === 0 || !targetBoxId
                      ? "bg-stone-400 cursor-not-allowed opacity-60"
                      : "bg-emerald-700 hover:bg-emerald-800"
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>
                    Confirmar Traslado a {selectedTargetBox ? selectedTargetBox.code : "Nueva Pesebrera"}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: INSPECCIÓN TÉCNICA Y APROBACIÓN DE MANTENIMIENTO */}
      {/* =================================================================== */}
      {isApprovalModalOpen && boxToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Cabecera del Modal de Aprobación */}
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base flex items-center gap-2">
                    <span>Aprobar Mantenimiento: {boxToApprove.code}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {boxToApprove.name}
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Inspección técnica final y habilitación de la pesebrera para uso activo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ficha Resumen de la labor a Aprobar */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-amber-800 dark:text-amber-400 tracking-wider">
                  Labor Técnica Concluida
                </span>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {boxToApprove.currentMaintenanceDate || new Date().toISOString().split("T")[0]}
                </span>
              </div>
              <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                🛠️ {boxToApprove.currentMaintenanceReason || "Mantenimiento General del Box"}
              </h4>
              {boxToApprove.maintenanceHistory?.[0]?.typeNames &&
                boxToApprove.maintenanceHistory[0].typeNames.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {boxToApprove.maintenanceHistory[0].typeNames.map((tn, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1"
                      >
                        <Check className="w-2.5 h-2.5 text-amber-700 dark:text-amber-300" />
                        <span>{tn}</span>
                      </span>
                    ))}
                  </div>
                )}
              <div className="flex items-center gap-4 text-xs text-stone-600 dark:text-stone-400 flex-wrap">
                <span>
                  <strong>Responsable:</strong> {boxToApprove.currentMaintenanceResponsible || "Mayordomía / Operario"}
                </span>
                <span>
                  <strong>Zona:</strong> {boxToApprove.zone} ({boxToApprove.dimensions})
                </span>
              </div>
            </div>

            {/* Selección de Retorno al Uso */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                Destino y Habilitación para Uso *
              </label>

              {Boolean(boxToApprove.assignedHorseName || boxToApprove.horseName) ? (
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      approvalTargetStatus === "auto" || approvalTargetStatus === "ocupada"
                        ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700"
                        : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="approvalDestiny"
                      checked={approvalTargetStatus === "auto" || approvalTargetStatus === "ocupada"}
                      onChange={() => setApprovalTargetStatus("auto")}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-emerald-950 dark:text-emerald-100 block">
                        Reintegrar al Huésped Titular: {boxToApprove.assignedHorseName || boxToApprove.horseName} (Recomendado)
                      </span>
                      <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5">
                        El box pasa de inmediato a estado <strong>Ocupada</strong> y el caballo vuelve a residir oficialmente en su plaza habitual.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      approvalTargetStatus === "disponible"
                        ? "bg-sky-50/70 dark:bg-sky-950/40 border-sky-400 dark:border-sky-700"
                        : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="approvalDestiny"
                      checked={approvalTargetStatus === "disponible"}
                      onChange={() => setApprovalTargetStatus("disponible")}
                      className="mt-1 text-sky-600 focus:ring-sky-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">
                        Habilitar como Box DISPONIBLE (El caballo fue reubicado o egresó)
                      </span>
                      <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5">
                        El box queda libre y disponible para ingresar a un nuevo ejemplar del criadero o cliente.
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Habilitación Directa: Pasa a DISPONIBLE</span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-400 text-[11px] mt-1">
                    Este box no tenía caballo titular asignado antes del mantenimiento. Al dar el aprobado quedará inmediatamente libre para asignación.
                  </p>
                </div>
              )}
            </div>

            {/* Inspector y Aprobado por */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Inspector / Aprobado por *
                </label>
                <input
                  type="text"
                  required
                  value={approvalInspector}
                  onChange={(e) => setApprovalInspector(e.target.value)}
                  placeholder="ej: Mayordomo Jairo / Administrador"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                  Fecha de Aprobación
                </label>
                <input
                  type="text"
                  disabled
                  value={new Date().toLocaleDateString("es-CO", { dateStyle: "long" })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-500 font-medium"
                />
              </div>
            </div>

            {/* Observaciones de Entrega Técnica */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-stone-700 dark:text-stone-300">
                Observaciones de Inspección y Entrega Técnica
              </label>
              <textarea
                rows={2}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="ej: Box revisado y verificado. Cama seca de viruta blanca, comedero desinfectado y bebedero sin fugas."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Botones del Modal de Aprobación */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsApprovalModalOpen(false)}
                className="w-full sm:w-auto text-xs cursor-pointer"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => handleExecuteApproval(boxToApprove)}
                className="w-full sm:w-auto gap-2 text-xs bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-md font-bold py-2 px-4"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Aprobado y Habilitar para Uso</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
