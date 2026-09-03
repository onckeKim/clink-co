"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

/** A confirm/cancel dialog for destructive or consequential admin actions (delete, cancel order, disable account). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-sm">
      {description && <p className="mb-6 text-sm text-stone">{description}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="secondary" size="md" className="flex-1" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="button"
          size="md"
          className={destructive ? "flex-1 bg-error hover:bg-error/90" : "flex-1"}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
