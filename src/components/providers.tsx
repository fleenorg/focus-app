"use client";

import { GuestAppProvider } from "@/features/app/GuestAppProvider";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <GuestAppProvider>{children}</GuestAppProvider>
    </ToastProvider>
  );
}
