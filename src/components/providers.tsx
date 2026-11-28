
"use client";

import { GuestAppProvider } from "@/features/app/GuestAppProvider";
import { ToastProvider } from "@/components/ui/toast";
import { FullscreenProvider } from "@/features/timer/FullscreenContext";
import { SoundscapeProvider } from "@/features/soundscapes/SoundscapeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <GuestAppProvider>
        <FullscreenProvider>
          <SoundscapeProvider>
            {children}
          </SoundscapeProvider>
        </FullscreenProvider>
      </GuestAppProvider>
    </ToastProvider>
  );
}
