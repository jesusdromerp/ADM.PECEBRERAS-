"use client";

import React, { useState } from "react";
import { InventoryItem, InventoryCategory, FeedTemplate, CenterSettings } from "@/types";
import {
  Package,
  AlertTriangle,
  Plus,
  Minus,
  Search,
  Filter,
  Download,
  FileText,
  Building,
  CheckCircle2,
  X,
  Check,
  Sparkles,
  LayoutGrid,
  Columns3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface InventoryViewProps {
  inventory: InventoryItem[];
  feedTemplates?: FeedTemplate[];
  centerSettings?: CenterSettings;
  onAdjustStock: (id: string, delta: number) => void;
  onAddItem: (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) => void;
}

export function InventoryView({
  inventory,
  feedTemplates = [],
  centerSettings,
  onAdjustStock,
  onAddItem,
}: InventoryViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"compact" | "detailed">("compact");

  // Formulario nuevo insumo
  const [name, setName] = useState("");
  const [category, setCategory] = useState<InventoryCategory>("alimento");
  const [currentStock, setCurrentStock] = useState(10);
  const [unit, setUnit] = useState("Bultos (40kg)");
  const [minStockAlert, setMinStockAlert] = useState(5);
  const [costPerUnit, setCostPerUnit] = useState(100000);
  const [location, setLocation] = useState("Bodega Principal");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "todas" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventory.filter((item) => item.currentStock <= item.minStockAlert);

  const getCategoryBadge = (cat: InventoryCategory) => {
    const map = {
      alimento: { label: "Alimento / Grano", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" },
      heno: { label: "Heno / Forraje", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" },
      cama: { label: "Cama / Viruta", color: "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300" },
      medicamento: { label: "Fármaco / Botiquín", color: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300" },
      suplemento: { label: "Suplemento Nutricional", color: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300" },
    };
    const c = map[cat];
    return <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${c.color}`}>{c.label}</span>;
  };

  const handleSubmitNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddItem({
      name: name.trim(),
      category,
      currentStock: Number(currentStock),
      unit: unit.trim(),
      minStockAlert: Number(minStockAlert),
      costPerUnit: Number(costPerUnit),
      location: location.trim(),
      supplier: supplier.trim() || undefined,
      lastRestocked: new Date().toISOString().split("T")[0],
      notes: notes.trim() || undefined,
    });

    setIsNewItemModalOpen(false);
    setName("");
    setNotes("");
  };

  // Exportar inventario completo en formato Word (.doc)
  const handleDownloadWordReport = () => {
    const rows = inventory
      .map(
        (it) => `
        <tr style="${it.currentStock <= it.minStockAlert ? "background-color: #fef2f2;" : ""}">
          <td style="padding: 8px; border-bottom: 1px solid #e7e5e4; font-weight: 600;">${it.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e7e5e4; text-transform: capitalize;">${it.category}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e7e5e4; text-align: center; font-weight: bold; ${it.currentStock <= it.minStockAlert ? "color: #b91c1c;" : ""}">${it.currentStock} ${it.unit}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e7e5e4; text-align: center;">${it.minStockAlert}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e7e5e4;">${it.location}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e7e5e4; text-align: right;">${formatCOP(it.costPerUnit)}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Inventario de Pesebreras</title>
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; color: #1c1917; margin: 35px; }
          .header { border-bottom: 2px solid #065f46; padding-bottom: 10px; margin-bottom: 20px; }
          h1 { color: #065f46; margin: 0; font-size: 20pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background-color: #065f46; color: white; padding: 8px; text-align: left; font-size: 10pt; }
          td { font-size: 9.5pt; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${(centerSettings?.stableName || "HACIENDA & PESEBRERAS").toUpperCase()} - INFORME DE INVENTARIO</h1>
          <p style="color: #78716c; margin: 4px 0;">${centerSettings?.location || "Control de Insumos, Alimentos, Heno, Camas y Fármacos"} • Generado: ${new Date().toLocaleDateString("es-CO")}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Artículo / Insumo</th>
              <th>Categoría</th>
              <th style="text-align: center;">Stock Actual</th>
              <th style="text-align: center;">Alerta Mín.</th>
              <th>Ubicación</th>
              <th style="text-align: right;">Costo Unitario</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff" + htmlContent], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Inventario_Establo_${new Date().toISOString().split("T")[0]}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Stock Crítico */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-md">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-amber-900 dark:text-amber-200 text-sm">
                ¡Atención de Compras! {lowStockItems.length} insumos con stock por debajo del mínimo
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {lowStockItems.map((i) => `${i.name} (Quedan ${i.currentStock} ${i.unit})`).join(" • ")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedCategory("todas")}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Revisar Insumos
          </button>
        </div>
      )}

      {/* Barra de Búsqueda, Filtros y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar insumo, bodega o proveedor..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Selector de modo de vista: Compacta (4 cols) vs Detallada (3 cols) */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setViewMode("compact")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "compact"
                  ? "bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-300 shadow-2xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
              title="Vista Compacta Adaptable (4 columnas)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Compacta</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("detailed")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "detailed"
                  ? "bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-300 shadow-2xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
              title="Vista Detallada (3 columnas)"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Detallada</span>
            </button>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer"
          >
            <option value="todas">Todas las categorías</option>
            <option value="alimento">Alimentos y Granos</option>
            <option value="heno">Heno y Forrajes</option>
            <option value="cama">Cama y Viruta</option>
            <option value="medicamento">Fármacos y Botiquín</option>
            <option value="suplemento">Suplementos</option>
          </select>

          <button
            onClick={handleDownloadWordReport}
            title="Descargar Reporte en Word (.doc)"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Reporte Word</span>
          </button>

          <Button
            onClick={() => setIsNewItemModalOpen(true)}
            size="sm"
            className="gap-1.5 whitespace-nowrap cursor-pointer text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Insumo
          </Button>
        </div>
      </div>

      {/* Grid de Artículos e Insumos / Concentrados */}
      {viewMode === "compact" ? (
        /* VISTA COMPACTA ADAPTABLE: 4 columnas en desktop, fichas estilizadas y amoldadas */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredItems.map((item) => {
            const isCritical = item.currentStock <= item.minStockAlert;

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-stone-900 rounded-2xl border p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                  isCritical
                    ? "border-amber-400/80 dark:border-amber-700/80 bg-amber-50/25 dark:bg-amber-950/20"
                    : "border-stone-200/90 dark:border-stone-800"
                }`}
              >
                <div className="space-y-2.5">
                  {/* Encabezado: Categoría y Alerta de Stock Bajo */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1 min-w-0">
                      {getCategoryBadge(item.category)}
                    </div>
                    {isCritical && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Bajo
                      </span>
                    )}
                  </div>

                  {/* Nombre y Ubicación */}
                  <div>
                    <h4
                      className="font-extrabold text-stone-900 dark:text-stone-100 text-xs sm:text-sm leading-snug line-clamp-1"
                      title={item.name}
                    >
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center gap-1 mt-0.5 truncate">
                      <Building className="w-2.5 h-2.5 shrink-0 text-stone-400" />
                      <span>{item.location}</span>
                    </p>
                  </div>

                  {/* Bloque de Existencia Actual y Ajuste Rápido (+ / -) */}
                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider block">
                        Stock
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`text-xl font-black ${
                            isCritical
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {item.currentStock}
                        </span>
                        <span className="text-[10px] font-semibold text-stone-500 truncate max-w-[80px]">
                          {item.unit}
                        </span>
                      </div>
                    </div>

                    {/* Botones rápidos +/- */}
                    <div className="flex items-center gap-1 bg-white dark:bg-stone-900 p-0.5 rounded-lg border border-stone-200/90 dark:border-stone-700 shadow-2xs shrink-0">
                      <button
                        onClick={() => onAdjustStock(item.id, -1)}
                        title="Consumir 1 unidad"
                        disabled={item.currentStock <= 0}
                        className="w-6 h-6 rounded flex items-center justify-center font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onAdjustStock(item.id, 1)}
                        title="Ingresar 1 unidad"
                        className="w-6 h-6 rounded bg-emerald-700 hover:bg-emerald-600 text-white flex items-center justify-center font-bold transition-colors shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Mini métricas: Mínimo y Costo Unitario */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-500 dark:text-stone-400 pt-0.5">
                    <div>
                      <span className="text-stone-400 block text-[9px]">Alerta Mín.</span>
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        {item.minStockAlert} {item.unit.split(" ")[0]}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-stone-400 block text-[9px]">Costo</span>
                      <span className="font-extrabold text-stone-900 dark:text-stone-100">
                        {formatCOP(item.costPerUnit)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pie de Ficha Compacta */}
                <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[9px] text-stone-400">
                  <span className="truncate max-w-[110px]" title={item.supplier || "Sin proveedor fijo"}>
                    {item.supplier || "Sin proveedor"}
                  </span>
                  <span>{item.lastRestocked}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA DETALLADA (3 columnas con notas completas) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isCritical = item.currentStock <= item.minStockAlert;

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-stone-900 rounded-3xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                  isCritical
                    ? "border-amber-300 dark:border-amber-900/60 bg-amber-50/20"
                    : "border-stone-200/90 dark:border-stone-800"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {getCategoryBadge(item.category)}
                      <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base mt-1.5 leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3.5 h-3.5 text-stone-400" />
                        {item.location}
                      </p>
                    </div>

                    {isCritical && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        Bajo
                      </span>
                    )}
                  </div>

                  {/* Stock Principal */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-stone-400 block font-normal">
                        Existencia Actual
                      </span>
                      <span
                        className={`text-2xl font-black ${
                          isCritical
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-emerald-800 dark:text-emerald-400"
                        }`}
                      >
                        {item.currentStock}
                      </span>
                      <span className="text-xs font-semibold text-stone-500 ml-1.5">
                        {item.unit}
                      </span>
                    </div>

                    {/* Botones rápidos de ajuste (+1 / -1) */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 p-1 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xs">
                      <button
                        onClick={() => onAdjustStock(item.id, -1)}
                        title="Registrar consumo (-1)"
                        disabled={item.currentStock <= 0}
                        className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 flex items-center justify-center font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onAdjustStock(item.id, 1)}
                        title="Registrar ingreso (+1)"
                        className="w-8 h-8 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white flex items-center justify-center font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Detalles: Alerta mínima, Proveedor, Costo */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 dark:text-stone-400 pt-1">
                    <div>
                      <span className="text-stone-400 block text-[11px]">Stock Mínimo</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {item.minStockAlert} {item.unit}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-stone-400 block text-[11px]">Costo Unitario</span>
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {formatCOP(item.costPerUnit)}
                      </span>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 italic bg-stone-50/60 dark:bg-stone-800/30 p-2 rounded-xl border border-stone-100 dark:border-stone-800">
                      &ldquo;{item.notes}&rdquo;
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                  <span>Último ingreso: {item.lastRestocked}</span>
                  {item.supplier && <span className="font-medium text-stone-500">{item.supplier}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Crear Nuevo Insumo */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                    Registrar Insumo de Establo
                  </h3>
                  <p className="text-xs text-stone-500">
                    Control de alimentos, pacas, virutas y botiquín
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewItemModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewItem} className="space-y-3.5 text-xs">
              {/* Autocompletar desde Catálogo de Concentrados / Insumos */}
              {feedTemplates && feedTemplates.length > 0 && (
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-1.5">
                  <label className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Cargar desde Catálogo de Concentrados
                  </label>
                  <select
                    onChange={(e) => {
                      const selectedTpl = feedTemplates.find((t) => t.id === e.target.value);
                      if (selectedTpl) {
                        setName(selectedTpl.name);
                        setCategory(selectedTpl.category);
                        setUnit(selectedTpl.defaultUnit);
                        setMinStockAlert(selectedTpl.defaultMinStockAlert);
                        setCostPerUnit(selectedTpl.defaultCostPerUnit);
                        setLocation(selectedTpl.defaultLocation);
                        setSupplier(selectedTpl.defaultSupplier || "");
                        setNotes(selectedTpl.nutritionalNotes || "");
                      }
                    }}
                    defaultValue=""
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 text-xs font-semibold text-stone-900 dark:text-stone-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="" disabled>
                      ⚡ Escoger automáticamente concentrado / insumo...
                    </option>
                    {feedTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.brand}] {t.name} — {t.defaultUnit} ({t.defaultLocation})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80">
                    Autocompleta nombre, marca, unidad, alerta, costo y proveedor al instante.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Nombre del Insumo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej: Concentrado Pinta Campeón (40kg)"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as InventoryCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="alimento">Alimento / Grano</option>
                    <option value="heno">Heno / Forraje</option>
                    <option value="cama">Cama / Viruta</option>
                    <option value="medicamento">Fármaco / Botiquín</option>
                    <option value="suplemento">Suplemento</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Unidad de Medida</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Bultos, Pacas, Frascos..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Alerta Mínima</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
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
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Ubicación en Hacienda</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="ej: Bodega 1, Heno Techado..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Proveedor Habitual</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="ej: Italcol, Agroalfalfa..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Observaciones</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ej: Mantener sellado contra humedad..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="gap-1.5 cursor-pointer">
                  <Check className="w-4 h-4" />
                  Guardar Insumo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
