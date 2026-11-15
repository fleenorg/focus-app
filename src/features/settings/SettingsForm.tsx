"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { DEFAULT_TIMER_SETTINGS, TIMER_LIMITS } from "@/config/app";
import { useGuestApp } from "@/features/app/GuestAppProvider";
import type { TimerSettings } from "@/types/domain";
import { FormEvent, useEffect, useState } from "react";

export function SettingsForm() {
  const { settings, updateSettings, resetLocalData, timer } = useGuestApp();
  const { notify } = useToast();
  const [draft, setDraft] = useState<TimerSettings>(settings);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(settings);
  }, [settings]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    updateSettings(draft);
    notify(
      timer.status === "idle"
        ? "Settings saved"
        : "Settings saved. The current session keeps its original duration.",
    );
  };

  const requestNotifications = async () => {
    if (typeof Notification === "undefined") {
      notify("Notifications are not available in this browser.");
      return;
    }
    const permission = await Notification.requestPermission();
    setDraft((current) => ({
      ...current,
      notificationsEnabled: permission === "granted",
    }));
    if (permission !== "granted") {
      notify("Notification permission was not granted.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Durations apply to new sessions. Guest data stays in this browser and is not
          backed up to a server.
        </p>
      </div>

      <Card className="p-5">
        <form onSubmit={onSubmit} className="space-y-5">
          <NumberField
            label="Focus (minutes)"
            value={draft.focusMinutes}
            min={TIMER_LIMITS.focusMinutes.min}
            max={TIMER_LIMITS.focusMinutes.max}
            onChange={(focusMinutes) => setDraft((current) => ({ ...current, focusMinutes }))}
          />
          <NumberField
            label="Short break (minutes)"
            value={draft.shortBreakMinutes}
            min={TIMER_LIMITS.shortBreakMinutes.min}
            max={TIMER_LIMITS.shortBreakMinutes.max}
            onChange={(shortBreakMinutes) =>
              setDraft((current) => ({ ...current, shortBreakMinutes }))
            }
          />
          <NumberField
            label="Long break (minutes)"
            value={draft.longBreakMinutes}
            min={TIMER_LIMITS.longBreakMinutes.min}
            max={TIMER_LIMITS.longBreakMinutes.max}
            onChange={(longBreakMinutes) =>
              setDraft((current) => ({ ...current, longBreakMinutes }))
            }
          />
          <NumberField
            label="Long break every N focus sessions"
            value={draft.longBreakInterval}
            min={TIMER_LIMITS.longBreakInterval.min}
            max={TIMER_LIMITS.longBreakInterval.max}
            onChange={(longBreakInterval) =>
              setDraft((current) => ({ ...current, longBreakInterval }))
            }
          />
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--accent)]"
              checked={draft.soundEnabled}
              onChange={(event) =>
                setDraft((current) => ({ ...current, soundEnabled: event.target.checked }))
              }
            />
            Play a short chime when a session completes
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--accent)]"
              checked={draft.notificationsEnabled}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  notificationsEnabled: event.target.checked,
                }))
              }
            />
            Desktop notification when a session completes
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="primary">
              Save settings
            </Button>
            <Button type="button" variant="secondary" onClick={() => void requestNotifications()}>
              Request notification permission
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Privacy</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Lumen stores tasks, timer state, settings, and session history in browser
          localStorage. That is convenient, not a secure vault. The Focus Music panel
          loads Google&apos;s YouTube player, which may collect data according to Google&apos;s
          policies. This app does not add analytics or accounts in the MVP.
        </p>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-danger">Reset local data</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          This permanently deletes tasks, history, settings, and the saved YouTube link
          from this browser.
        </p>
        <Button className="mt-4" variant="danger" onClick={() => setConfirmReset(true)}>
          Reset local data
        </Button>
      </Card>

      <Dialog
        open={confirmReset}
        title="Reset local data?"
        description="Tasks, session history, settings, and music preferences will be deleted from this browser. This cannot be undone."
        onClose={() => setConfirmReset(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetLocalData();
                setDraft({ ...DEFAULT_TIMER_SETTINGS });
                setConfirmReset(false);
              }}
            >
              Reset
            </Button>
          </>
        }
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-2 block text-muted">{label}</span>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) {
            onChange(next);
          }
        }}
      />
    </label>
  );
}
