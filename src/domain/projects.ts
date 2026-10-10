import { z } from "zod";
export const projectSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(2).max(100),
  description: z.string().max(2000),
  category: z.string(),
  mode: z.enum(["practice", "real"]),
  stage: z.number().int().min(0).max(7),
  audience: z.string(),
  goal: z.string(),
  budget: z.number().int().min(0).max(1e9),
  notes: z.string(),
  results: z.string(),
  reflection: z.string(),
  archived: z.boolean(),
  revision: z.number().int(),
  organization_id: z.string().nullable().optional(),
  learner_id: z.string().nullable().optional(),
});
export type Project = z.infer<typeof projectSchema>;
export type Demand = {
  id: string;
  kind: "opinion" | "intent" | "purchase";
  interested: boolean;
  acceptable_price: number;
  comment: string;
};
export type Task = {
  id: string;
  title: string;
  completed: boolean;
  due_date?: string | null;
};
export function blankProject(title: string, category = "own"): Project {
  return {
    id: crypto.randomUUID(),
    title,
    category,
    description: "",
    mode: "practice",
    stage: 0,
    audience: "",
    goal: "",
    budget: 0,
    notes: "",
    results: "",
    reflection: "",
    archived: false,
    revision: 1,
  };
}
export function canAdvance(project: Project, demand: Demand[], tasks: Task[]) {
  const rules = [
    project.description.trim().length > 1,
    project.audience.trim().length > 1,
    demand.length > 0,
    tasks.length > 0,
    project.budget > 0,
    tasks.some((t) => t.completed),
    project.results.trim().length > 1,
    project.reflection.trim().length > 1,
  ];
  return rules[project.stage];
}
export function demandSummary(rows: Demand[]) {
  return {
    responses: rows.length,
    interest: rows.filter((r) => r.interested).length,
    intent: rows.filter((r) => r.kind === "intent").length,
    purchases: rows.filter((r) => r.kind === "purchase").length,
  };
}
export function report(project: Project, demand: Demand[], tasks: Task[]) {
  return {
    project: project.title,
    description: project.description,
    audience: project.audience,
    goal: project.goal,
    demand: demandSummary(demand),
    tasks: tasks.map(({ title, completed }) => ({ title, completed })),
    results: project.results,
    reflection: project.reflection,
  };
}
