import { createId } from "@/lib/id";
import { asBoolean, asFiniteNumber, asString, isRecord } from "@/lib/storage";
import type { Task } from "@/types/domain";

export function createTask(title: string, ownerId: string | null, now: number): Task {
  const trimmed = title.trim();
  return {
    id: createId(),
    title: trimmed,
    completed: false,
    createdAt: now,
    updatedAt: now,
    ownerId,
  };
}

export function parseTask(value: unknown): Task | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = asString(value.id);
  const title = asString(value.title);
  const createdAt = asFiniteNumber(value.createdAt);
  const updatedAt = asFiniteNumber(value.updatedAt);
  if (!id || !title || createdAt === null || updatedAt === null) {
    return null;
  }
  const ownerId = asString(value.ownerId);
  return {
    id,
    title,
    completed: asBoolean(value.completed, false),
    createdAt,
    updatedAt,
    ownerId,
  };
}

export function parseTaskList(value: unknown): Task[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const tasks: Task[] = [];
  for (const item of value) {
    const task = parseTask(item);
    if (!task) {
      return null;
    }
    tasks.push(task);
  }
  return tasks;
}

export function updateTaskTitle(
  tasks: Task[],
  id: string,
  title: string,
  now: number,
): Task[] {
  const trimmed = title.trim();
  if (!trimmed) {
    return tasks;
  }
  return tasks.map((task) =>
    task.id === id ? { ...task, title: trimmed, updatedAt: now } : task,
  );
}

export function toggleTask(tasks: Task[], id: string, now: number): Task[] {
  return tasks.map((task) =>
    task.id === id
      ? { ...task, completed: !task.completed, updatedAt: now }
      : task,
  );
}

export function removeTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((task) => task.id !== id);
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return b.createdAt - a.createdAt;
  });
}
