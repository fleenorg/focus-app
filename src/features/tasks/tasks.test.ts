import { describe, expect, it } from "vitest";
import {
  createTask,
  parseTaskList,
  removeTask,
  toggleTask,
  updateTaskTitle,
} from "./tasks";

describe("tasks", () => {
  it("creates, completes, edits, and deletes tasks", () => {
    const now = 1_000;
    const task = createTask("  Draft notes  ", "guest-1", now);
    expect(task.title).toBe("Draft notes");
    expect(task.completed).toBe(false);
    expect(task.ownerId).toBe("guest-1");

    let list = [task];
    list = toggleTask(list, task.id, now + 1);
    expect(list[0]?.completed).toBe(true);

    list = updateTaskTitle(list, task.id, "Lab notes", now + 2);
    expect(list[0]?.title).toBe("Lab notes");

    list = removeTask(list, task.id);
    expect(list).toEqual([]);
  });

  it("rejects malformed stored lists", () => {
    expect(parseTaskList(null)).toBeNull();
    expect(parseTaskList([{ id: "x" }])).toBeNull();
    const valid = parseTaskList([
      {
        id: "a",
        title: "Read",
        completed: false,
        createdAt: 1,
        updatedAt: 1,
        ownerId: null,
      },
    ]);
    expect(valid).toHaveLength(1);
  });
});
