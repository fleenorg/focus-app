import { FocusMusic } from "@/features/music/FocusMusic";
import { DailySummary } from "@/features/sessions/DailySummary";
import { TaskPanel } from "@/features/tasks/TaskPanel";
import { TimerPanel } from "@/features/timer/TimerPanel";

export default function Home() {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <section className="space-y-6 lg:col-span-7">
        <TimerPanel />
        <DailySummary />
      </section>
      <aside className="space-y-6 lg:col-span-5">
        <TaskPanel />
        <FocusMusic />
      </aside>
    </div>
  );
}
