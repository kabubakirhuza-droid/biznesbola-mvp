import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Project, Demand, Task } from "../domain/projects";
type State = {
  projects: Project[];
  demands: Record<string, Demand[]>;
  tasks: Record<string, Task[]>;
  selected: string;
  save: (p: Project) => void;
  remove: (id: string) => void;
  select: (id: string) => void;
  addDemand: (id: string, d: Demand) => void;
  saveTask: (id: string, t: Task) => void;
  imported: string[];
  markImported: (id: string) => void;
};
// This store is exclusively guest data. Authenticated projects never enter it.
export const useWorkshop = create<State>()(
  persist(
    (set) => ({
      projects: [],
      demands: {},
      tasks: {},
      selected: "",
      imported: [],
      save: (p) =>
        set((s) => ({
          projects: s.projects.some((x) => x.id === p.id)
            ? s.projects.map((x) => (x.id === p.id ? p : x))
            : [p, ...s.projects],
          selected: p.id,
        })),
      remove: (id) =>
        set((s) => ({
          projects: s.projects.filter((x) => x.id !== id),
          selected: s.selected === id ? "" : s.selected,
        })),
      select: (selected) => set({ selected }),
      addDemand: (id, d) =>
        set((s) => ({
          demands: { ...s.demands, [id]: [...(s.demands[id] || []), d] },
        })),
      saveTask: (id, t) =>
        set((s) => ({
          tasks: {
            ...s.tasks,
            [id]: (s.tasks[id] || []).some((x) => x.id === t.id)
              ? s.tasks[id].map((x) => (x.id === t.id ? t : x))
              : [...(s.tasks[id] || []), t],
          },
        })),
      markImported: (id) =>
        set((s) => ({ imported: [...new Set([...s.imported, id])] })),
    }),
    { name: "biznesbola-guest-workshop-v1" },
  ),
);
