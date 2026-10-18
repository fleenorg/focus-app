"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useGuestApp } from "@/features/app/GuestAppProvider";
import { cn } from "@/lib/cn";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";

export function TaskPanel() {
  const {
    tasks,
    activeTaskId,
    addTask,
    editTask,
    completeTask,
    deleteTask,
    restoreTask,
    selectTask,
  } = useGuestApp();
  const { notify } = useToast();
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const onAdd = (event: FormEvent) => {
    event.preventDefault();
    addTask(title);
    setTitle("");
  };

  const incomplete = tasks.filter((task) => !task.completed);
  const complete = tasks.filter((task) => task.completed);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-foreground">Tasks</h2>
        <p className="text-xs text-muted">{incomplete.length} open</p>
      </div>
      <form onSubmit={onAdd} className="flex gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task"
          aria-label="New task title"
        />
        <Button type="submit" variant="primary" size="icon" aria-label="Add task">
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {tasks.length === 0 ? (
        <p className="mt-6 text-sm leading-6 text-muted">
          Add one task you want to finish in this session. Keep the list short.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {incomplete.map((task) => (
            <TaskRow
              key={task.id}
              title={task.title}
              completed={false}
              active={task.id === activeTaskId}
              editing={editingId === task.id}
              draft={draft}
              onDraftChange={setDraft}
              onToggle={() => completeTask(task.id)}
              onSelect={() => selectTask(task.id === activeTaskId ? null : task.id)}
              onEdit={() => {
                setEditingId(task.id);
                setDraft(task.title);
              }}
              onSave={() => {
                editTask(task.id, draft);
                setEditingId(null);
              }}
              onDelete={() => {
                const wasActive = task.id === activeTaskId;
                deleteTask(task.id);
                notify("Task deleted", {
                  label: "Undo",
                  onClick: () => restoreTask(task, wasActive),
                });
              }}
            />
          ))}
          {complete.length > 0 ? (
            <li className="pt-2 text-xs uppercase tracking-[0.16em] text-muted">
              Completed
            </li>
          ) : null}
          {complete.map((task) => (
            <TaskRow
              key={task.id}
              title={task.title}
              completed
              active={task.id === activeTaskId}
              editing={editingId === task.id}
              draft={draft}
              onDraftChange={setDraft}
              onToggle={() => completeTask(task.id)}
              onSelect={() => selectTask(task.id === activeTaskId ? null : task.id)}
              onEdit={() => {
                setEditingId(task.id);
                setDraft(task.title);
              }}
              onSave={() => {
                editTask(task.id, draft);
                setEditingId(null);
              }}
              onDelete={() => {
                const wasActive = task.id === activeTaskId;
                deleteTask(task.id);
                notify("Task deleted", {
                  label: "Undo",
                  onClick: () => restoreTask(task, wasActive),
                });
              }}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

function TaskRow({
  title,
  completed,
  active,
  editing,
  draft,
  onDraftChange,
  onToggle,
  onSelect,
  onEdit,
  onSave,
  onDelete,
}: {
  title: string;
  completed: boolean;
  active: boolean;
  editing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onToggle: () => void;
  onSelect: () => void;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-xl border px-2 py-2",
        active ? "border-accent/40 bg-accent/5" : "border-transparent bg-background",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={completed ? `Mark ${title} incomplete` : `Mark ${title} complete`}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          completed && "border-accent bg-accent text-accent-foreground",
        )}
      >
        {completed ? <Check className="h-4 w-4" /> : null}
      </button>
      {editing ? (
        <form
          className="min-w-0 flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <Input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onBlur={onSave}
            aria-label="Edit task title"
            autoFocus
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "min-w-0 flex-1 rounded-lg px-2 py-1 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            completed ? "text-muted line-through" : "text-foreground",
          )}
        >
          {title}
          {active ? (
            <span className="ml-2 text-xs text-accent">Active</span>
          ) : null}
        </button>
      )}
      <Button size="icon" variant="ghost" aria-label={`Edit ${title}`} onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" aria-label={`Delete ${title}`} onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}
