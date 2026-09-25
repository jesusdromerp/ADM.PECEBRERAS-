"use client";

import React, { useState } from "react";
import { PaymentRecord } from "@/types";
import { dataService } from "@/services";
import { downloadWordReceipt } from "@/lib/word-receipt";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageCircle,
  Copy,
  Check,
  X,
  FileText,
  Download,
  ExternalLink,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinanceViewProps {
  payments: PaymentRecord[];
  onMarkAsPaid: (id: string) => void;
}

export function FinanceView({ payments, onMarkAsPaid }: FinanceViewProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const safePayments = payments || [];

  const totalCollected = safePayments
    .filter((p) => p && p.status === "pagado")
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const totalPending = safePayments
    .filter((p) => p && p.status !== "pagado")
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const filteredPayments = safePayments.filter((p) => {
    if (!p) return false;
    if (statusFilter !== "todos" && p.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchNum = (p.receiptNumber || "").toLowerCase().includes(q);
      const matchClient = (p.clientName || "").toLowerCase().includes(q);
      const matchHorse = (p.horseName || "").toLowerCase().includes(q);
      const matchConcept = (p.concept || "").toLowerCase().includes(q);
      const matchBox = (p.pesebreraCode || "").toLowerCase().includes(q);
      if (!matchNum && !matchClient && !matchHorse && !matchConcept && !matchBox) return false;
    }
    return true;
  });

  // Manejador de apertura de WhatsApp con respaldo al portapapeles
  const handleOpenWhatsApp = (p: PaymentRecord) => {
    const data = dataService.generateWhatsAppReceiptData(p);
    // Garantía: copiar al portapapeles para que con Ctrl + V esté siempre disponible
    navigator.clipboard.writeText(data.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    window.open(data.waUrl, "_blank");
  };

  const handleOpenWhatsAppWeb = (p: PaymentRecord) => {
    const data = dataService.generateWhatsAppReceiptData(p);
    navigator.clipboard.writeText(data.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    window.open(data.webUrl, "_blank");
  };

  const handleCopyText = (p: PaymentRecord) => {
    const data = dataService.generateWhatsAppReceiptData(p);
    navigator.clipboard.writeText(data.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadWord = (p: PaymentRecord) => {
    downloadWordReceipt(p, undefined, dataService.getCenterSettings());
  };

  return (
    <div className="space-y-6">
      {/* Resumen Financiero Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-900 text-white rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-700/20 rounded-full blur-2xl" />
          <span className="text-xs uppercase font-semibold tracking-wider text-emerald-200">
            Total Recaudado (Mes Actual)
          </span>
          <div className="text-3xl sm:text-4xl font-black mt-2">
            {formatCOP(totalCollected)}
          </div>
          <p className="text-xs text-emerald-200/80 mt-2">
            Cánones de pesebrera, entrenamientos y servicios liquidados
          </p>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
          <span className="text-xs uppercase font-semibold tracking-wider text-stone-500">
            Pendiente por Cobrar
          </span>
          <div className="text-3xl sm:text-4xl font-black mt-2 text-amber-700 dark:text-amber-400">
            {formatCOP(totalPending)}
          </div>
          <p className="text-xs text-stone-500 mt-2">
            {payments.filter((p) => p.status !== "pagado").length} recibos pendientes para envío a propietarios
          </p>
        </div>
      </div>

      {/* Tabla de Pagos, Recibos, Descarga Word y WhatsApp */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
              Control de Alquileres, Servicios y Facturación
            </h3>
            <p className="text-xs text-stone-500">
              Exporta recibos oficiales en Word (.doc) y envíalos directamente por WhatsApp a los propietarios
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtros de estado */}
            <div className="inline-flex p-0.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs">
              {[
                { id: "todos", label: "Todos" },
                { id: "pendiente", label: "Pendientes" },
                { id: "pagado", label: "Pagados" },
                { id: "vencido", label: "Vencidos" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    statusFilter === f.id
                      ? "bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-300 shadow-xs"
                      : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Buscador de recibos */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar recibo, cliente..."
                className="pl-8 pr-3 py-1 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 w-44 sm:w-52"
              />
            </div>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-10 text-center text-xs text-stone-400">
            No se encontraron recibos con los criterios de búsqueda seleccionados.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {filteredPayments.map((p) => (
            <div
              key={p.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/60 dark:hover:bg-stone-800/30 transition-colors"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                    {p.receiptNumber}
                  </span>
                  <span className="text-xs text-stone-500">Vence: {p.dueDate}</span>
                  {p.pesebreraCode && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Box: {p.pesebreraCode}
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                  {p.concept}
                </h4>

                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Propietario: <strong className="text-stone-900 dark:text-stone-100">{p.clientName}</strong>
                  {p.horseName && ` • Ejemplar: ${p.horseName}`}
                  {p.clientPhone && ` • Tel: ${p.clientPhone}`}
                </p>

                {/* Desglose de servicios si existen */}
                {p.items && p.items.length > 0 && (
                  <div className="pt-1 flex items-center gap-2 flex-wrap">
                    {p.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-md"
                      >
                        {it.concept}: {formatCOP(it.amount)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Importes y Botones de Acción */}
              <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-stone-100">
                <div className="text-left md:text-right">
                  <div className="text-xl font-black text-stone-900 dark:text-stone-100">
                    {formatCOP(p.amount)}
                  </div>
                  <div>
                    {p.status === "pagado" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Pagado ({p.paymentDate})
                      </span>
                    ) : p.status === "vencido" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Vencido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Botón Descargar Word */}
                  <button
                    onClick={() => handleDownloadWord(p)}
                    title="Descargar Recibo Oficial en Word (.doc)"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Word</span>
                  </button>

                  {/* Botón WhatsApp */}
                  <button
                    onClick={() => setSelectedReceipt(p)}
                    title="Exportar y Enviar por WhatsApp"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-[1.02]"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>WhatsApp</span>
                  </button>

                  {/* Botón Marcar Pagado */}
                  {p.status !== "pagado" && (
                    <button
                      onClick={() => onMarkAsPaid(p.id)}
                      className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Pagar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Modal de Envío de Recibo a WhatsApp & Descarga de Word */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                    Enviar Recibo a WhatsApp & Descargar Word
                  </h3>
                  <p className="text-xs text-stone-500">
                    Propietario: {selectedReceipt.clientName} ({selectedReceipt.clientPhone || "Teléfono no registrado"})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tarjeta de Descarga en Word (.doc) */}
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    Recibo Oficial en Formato Word (.doc)
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Documento editable listo para adjuntar al chat de WhatsApp o imprimir
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleDownloadWord(selectedReceipt)}
                size="sm"
                className="bg-blue-700 hover:bg-blue-800 text-white gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Descargar Word
              </Button>
            </div>

            {/* Vista previa del mensaje formateado para WhatsApp */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Mensaje Formateado para WhatsApp:
                </span>
                {copied && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
                    <Check className="w-3.5 h-3.5" /> ¡Copiado al portapapeles!
                  </span>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 font-mono text-xs whitespace-pre-line text-stone-800 dark:text-stone-200 max-h-56 overflow-y-auto leading-relaxed select-all">
                {dataService.generateWhatsAppReceiptData(selectedReceipt).text}
              </div>
            </div>

            {/* Aviso informativo de soporte directo */}
            <p className="text-[11px] text-stone-500 italic">
              💡 <strong>Nota útil:</strong> Al hacer clic en &ldquo;Abrir WhatsApp&rdquo;, el mensaje también se copia automáticamente en tu portapapeles. Si tu WhatsApp no rellena el texto automáticamente, solo presiona <strong>Ctrl + V</strong> en el chat para pegarlo.
            </p>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={() => handleCopyText(selectedReceipt)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "¡Mensaje Copiado!" : "Copiar Texto"}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleOpenWhatsAppWeb(selectedReceipt)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>WhatsApp Web</span>
                </button>

                <button
                  onClick={() => handleOpenWhatsApp(selectedReceipt)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Abrir WhatsApp App</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
