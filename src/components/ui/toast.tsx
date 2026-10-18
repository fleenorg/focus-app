"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Button } from "./button";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  message: string;
  action?: ToastAction;
}

interface ToastContextValue {
  notify: (message: string, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, action?: ToastAction) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, action }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        <ul className="flex w-full max-w-md flex-col gap-2">
          {toasts.map((toast) => (
            <li
              key={toast.id}
              className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground shadow-panel"
              role="status"
            >
              <span>{toast.message}</span>
              {toast.action ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    toast.action?.onClick();
                    setToasts((current) =>
                      current.filter((item) => item.id !== toast.id),
                    );
                  }}
                >
                  {toast.action.label}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return value;
}
