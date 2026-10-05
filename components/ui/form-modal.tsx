"use client";

import { useEffect, useId, useState } from "react";
import { Icon } from "@/components/ui/icon";

export function FormModal({
  title,
  onClose,
  onSave,
  onDelete,
  valid = true,
  pending = false,
  saveLabel = "บันทึก",
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  valid?: boolean;
  pending?: boolean;
  saveLabel?: string;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    onDelete?.();
  };

  return (
    <div className="backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-head">
          <h3 id={titleId} style={{ flex: 1 }}>{title}</h3>
          <button className="btn" onClick={onClose} style={{ padding: "6px 9px" }} aria-label="ปิด">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div style={{ padding: "0 18px 18px", display: "flex", gap: 8 }}>
          {onDelete && (
            <button type="button" className="btn btn-danger" onClick={handleDelete} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="trash" size={15} />
              {confirming ? "ยืนยันลบ?" : "ลบ"}
            </button>
          )}
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!valid || pending}
            style={{ flex: 1, opacity: valid ? 1 : 0.4 }}
            onClick={onSave}
          >
            {pending ? "กำลังบันทึก…" : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "0 12px" }}>
      {children}
    </div>
  );
}
