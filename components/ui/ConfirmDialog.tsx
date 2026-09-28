"use client";

import React, { useId } from "react";
import { Button } from "@/components/ui/button";
import { useDialog } from "@/hooks/use-dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  // Contenido adicional (ej: un selector) entre la descripción y los botones
  children?: React.ReactNode;
}

/** Confirmación accesible para acciones con consecuencias (pagos, borrados, liberar boxes). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  tone = "primary",
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const dialogRef = useDialog(open, onCancel);
  const titleId = useId();
  const descriptionId = useId();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="outline-none bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4"
      >
        <h3 id={titleId} className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
          {title}
        </h3>
        {description && (
          <div id={descriptionId} className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            {description}
          </div>
        )}
        {children}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="cursor-pointer">
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`cursor-pointer ${
              tone === "danger" ? "bg-rose-700 hover:bg-rose-800 focus:ring-rose-600" : ""
            }`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
