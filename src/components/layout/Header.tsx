"use client";

import { APP } from "@/config/app";
import { cn } from "@/lib/cn";
import { BarChart3, Settings, Timer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Focus", icon: Timer },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
            L
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-wide text-foreground">
              {APP.name}
            </span>
            <span className="hidden text-xs text-muted sm:block">{APP.tagline}</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  active
                    ? "bg-surface-2 text-foreground"
                    : "text-muted hover:bg-surface-2 hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{link.label}</span>
                <span className="sm:hidden">{link.label}</span>
              </Link>
            );
          })}
          <span
            className="hidden cursor-not-allowed rounded-full px-3 py-2 text-sm text-muted/50 md:inline"
            title="Collaborative study rooms are planned for a later release."
            aria-disabled="true"
          >
            Rooms
          </span>
        </nav>
      </div>
    </header>
  );
}
