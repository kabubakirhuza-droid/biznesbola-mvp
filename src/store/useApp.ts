import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile, Transaction, Draft, Message, Plan } from "../types";
export const milestones = {
  idea: 10,
  calculation: 15,
  income: 30,
  draft: 40,
  publication: 20,
};
export function awardOnce(done: string[], key: string) {
  return done.includes(key) ? done : [...done, key];
}
type State = {
  profile: Profile | null;
  language: "uz" | "ru";
  transactions: Transaction[];
  milestones: string[];
  messages: Message[];
  plans: Plan[];
  draft: Draft;
  days: string[];
  allocation: number[];
  calculation: Plan | null;
  setProfile: (p: Profile) => void;
  setLanguage: (l: "uz" | "ru") => void;
  award: (k: keyof typeof milestones) => void;
  addTransaction: (t: Transaction) => void;
  removeTransaction: (id: string) => void;
  setTransactions: (t: Transaction[]) => void;
  setDraft: (d: Draft) => void;
  addMessage: (m: Message) => void;
  savePlan: (p: Plan) => void;
  setCalculation: (p: Plan) => void;
  learn: () => void;
  setAllocation: (a: number[]) => void;
};
export const useApp = create<State>()(
  persist(
    (set) => ({
      profile: null,
      language: "uz",
      transactions: [],
      milestones: [],
      messages: [],
      plans: [],
      draft: { name: "", description: "", products: [], status: "draft" },
      days: [],
      allocation: [50, 30, 20],
      calculation: null,
      setProfile: (profile) => set({ profile }),
      setLanguage: (language) => set({ language }),
      award: (key) =>
        set((s) => ({ milestones: awardOnce(s.milestones, key) })),
      addTransaction: (t) =>
        set((s) => ({
          transactions: [t, ...s.transactions],
          milestones:
            t.kind === "income"
              ? awardOnce(s.milestones, "income")
              : s.milestones,
        })),
      removeTransaction: (id) =>
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        })),
      setTransactions: (transactions) => set({ transactions }),
      setDraft: (draft) => set({ draft }),
      addMessage: (m) =>
        set((s) => ({ messages: [...s.messages, m].slice(-40) })),
      savePlan: (p) =>
        set((s) => ({
          plans: s.plans.some((x) => JSON.stringify(x) === JSON.stringify(p))
            ? s.plans
            : [p, ...s.plans],
        })),
      setCalculation: (calculation) => set({ calculation }),
      learn: () =>
        set((s) => {
          const date = new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Tashkent",
          });
          return { days: s.days.includes(date) ? s.days : [...s.days, date] };
        }),
      setAllocation: (allocation) => set({ allocation }),
    }),
    {
      name: "biznesbola-learning-v1",
      partialize: (s) => ({
        profile: s.profile,
        language: s.language,
        transactions: s.transactions,
        milestones: s.milestones,
        messages: s.messages,
        plans: s.plans,
        draft: s.draft,
        days: s.days,
        allocation: s.allocation,
        calculation: s.calculation,
      }),
    },
  ),
);
