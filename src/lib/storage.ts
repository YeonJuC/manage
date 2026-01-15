import type { Task } from "../types";

const KEY = "ops-agent.tasks.v1";

export const loadTasks = (): Record<string, Task> => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const saveTasks = (map: Record<string, Task>) => {
  localStorage.setItem(KEY, JSON.stringify(map));
};
