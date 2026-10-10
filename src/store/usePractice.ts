import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Simulation, Round } from "../domain/simulation";
type State = {
  sessions: Simulation[];
  events: Record<string, Round[]>;
  answers: Record<string, boolean>;
  save: (s: Simulation, r?: Round) => void;
  answer: (id: string, correct: boolean) => void;
};
export const usePractice = create<State>()(
  persist(
    (set) => ({
      sessions: [],
      events: {},
      answers: {},
      save: (simulation, round) =>
        set((s) => ({
          sessions: s.sessions.some((x) => x.id === simulation.id)
            ? s.sessions.map((x) => (x.id === simulation.id ? simulation : x))
            : [simulation, ...s.sessions],
          events: round
            ? {
                ...s.events,
                [simulation.id]: [...(s.events[simulation.id] || []), round],
              }
            : s.events,
        })),
      answer: (id, correct) =>
        set((s) => ({ answers: { ...s.answers, [id]: correct } })),
    }),
    { name: "biznesbola-guest-practice-v1" },
  ),
);
