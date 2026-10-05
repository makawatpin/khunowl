"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ToastState = { id: number; message: string; undo?: () => Promise<void> } | null;
type ToastContextValue = { show: (message: string, undo?: () => Promise<void>) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const router = useRouter();

  const show = useCallback((message: string, undo?: () => Promise<void>) => {
    const id = Date.now();
    setToast({ id, message, undo });
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setToast((t) => (t?.id === id ? null : t)), undo ? 5000 : 2600);
  }, []);

  const handleUndo = async () => {
    if (!toast?.undo) return;
    await toast.undo();
    setToast(null);
    router.refresh();
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div role="status" aria-live="polite">
        {toast && (
          <div className="toast">
            <span>{toast.message}</span>
            {toast.undo && <button onClick={handleUndo}>เลิกทำ</button>}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
