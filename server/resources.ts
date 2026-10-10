import { z } from "zod";
const id = z.uuid();
const short = z.string().trim().min(2).max(160);
const text = z.string().max(4000);
const amount = z.number().int().min(0).max(1e9);
export const resources = {
  projects: z.object({
    title: short,
    description: text.default(""),
    category: z.string().max(40).default("own"),
    mode: z.enum(["practice", "real"]).default("practice"),
    organization_id: id.nullable().optional(),
    learner_id: id.nullable().optional(),
    stage: z.number().int().min(0).max(7).default(0),
    audience: text.default(""),
    goal: text.default(""),
    budget: amount.default(0),
    notes: text.default(""),
    results: text.default(""),
    reflection: text.default(""),
    archived: z.boolean().default(false),
  }),
  project_tasks: z.object({
    project_id: id,
    title: short,
    due_date: z.iso.date().nullable().optional(),
    assigned_to: id.nullable().optional(),
    completed: z.boolean().default(false),
  }),
  demand_responses: z.object({
    project_id: id,
    kind: z.enum(["opinion", "intent", "purchase"]),
    interested: z.boolean(),
    acceptable_price: amount,
    comment: z.string().max(500).default(""),
  }),
  calculations: z
    .object({
      project_id: id,
      model: z.enum(["sale", "rental"]),
      units: z.number().int().min(1).max(100000),
      planned_sales: z.number().int().min(0).max(100000),
      total_cost: amount,
      unit_price: amount,
      fixed_cost: amount.default(0),
    })
    .refine((x) => x.model === "rental" || x.planned_sales <= x.units),
  ledger_entries: z.object({
    project_id: id,
    kind: z.enum(["capital", "revenue", "expense", "allocation"]),
    mode: z.enum(["practice", "real"]),
    amount,
    cost: amount.default(0),
    category: z.string().max(80).default(""),
    note: z.string().max(500).default(""),
    idempotency_key: id,
    occurred_at: z.iso.datetime().optional(),
  }),
  savings_goals: z.object({
    title: short,
    target: amount.min(1),
    allocated: amount.default(0),
  }),
  allocations: z
    .object({
      amount,
      working: z.number().int().min(0).max(100),
      dream: z.number().int().min(0).max(100),
      personal: z.number().int().min(0).max(100),
    })
    .refine((x) => x.working + x.dream + x.personal === 100),
  groups: z.object({
    organization_id: id,
    name: short,
    teacher_id: id,
    archived: z.boolean().default(false),
  }),
  assignments: z.object({
    group_id: id,
    title: short,
    instructions: text,
    lesson_id: id.nullable().optional(),
    due_at: z.iso.datetime().nullable().optional(),
  }),
  submissions: z.object({
    assignment_id: id,
    learner_id: id,
    body: text.min(1),
    status: z.enum(["submitted", "reviewed"]).default("submitted"),
  }),
  feedback: z.object({
    submission_id: id,
    body: text.min(1),
    clarity: z.number().int().min(1).max(5).optional(),
    reasoning: z.number().int().min(1).max(5).optional(),
    reflection: z.number().int().min(1).max(5).optional(),
  }),
  support_tickets: z.object({
    subject: short,
    category: z.string().max(40).default("help"),
    priority: z.enum(["normal", "urgent"]).default("normal"),
    status: z.enum(["open", "answered", "closed"]).default("open"),
  }),
  support_messages: z.object({
    ticket_id: id,
    body: text.min(1),
    internal: z.boolean().default(false),
  }),
  moderation_reports: z.object({
    storefront_id: id.nullable().optional(),
    reason: text.min(2),
    status: z.enum(["open", "resolved"]).default("open"),
    decision: text.default(""),
  }),
  lessons: z.object({
    title_uz: short,
    title_ru: short,
    body_uz: text.min(1),
    body_ru: text.min(1),
    question_uz: text.min(1),
    question_ru: text.min(1),
    answer_uz: short,
    answer_ru: short,
    explanation_uz: text.min(1),
    explanation_ru: text.min(1),
    age_group: z.enum(["all", "8–10", "11–13", "14–16"]).default("all"),
    status: z.enum(["draft", "published"]).default("draft"),
  }),
  feature_flags: z.object({
    key: z.string().regex(/^[a-z_]{2,60}$/),
    enabled: z.boolean(),
    description: text.default(""),
  }),
  profiles: z.object({
    alias: short,
    language: z.enum(["uz", "ru"]),
    status: z.enum(["active", "blocked", "archived"]),
  }),
  organizations: z.object({
    name: short,
    status: z.enum(["active", "blocked", "archived"]),
    resource_limit: z.number().int().min(1).max(10000),
  }),
  learner_profiles: z.object({
    alias: short,
    language: z.enum(["uz", "ru"]),
    age_group: z.enum(["8–10", "11–13", "14–16"]),
    avatar: z.string().max(8),
    archived: z.boolean(),
  }),
  notifications: z.object({ read_at: z.iso.datetime().nullable() }),
} as const;
export const readOnly = [
  "organization_members",
  "guardian_links",
  "group_members",
  "project_members",
  "project_stages",
  "audit_logs",
  "user_achievements",
  "simulation_sessions",
  "simulation_events",
  "ai_usage",
] as const;
export const resourceName = z.enum([
  "projects",
  ...Object.keys(resources).filter((k) => k !== "projects"),
  ...readOnly,
]);
export const rpcSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("organization"), name: short }),
  z.object({
    action: z.literal("learner"),
    alias: short,
    age: z.enum(["8–10", "11–13", "14–16"]),
    language: z.enum(["uz", "ru"]),
  }),
  z.object({
    action: z.literal("group_learner"),
    group_id: id,
    learner_id: id,
  }),
  z.object({
    action: z.literal("member_role"),
    organization_id: id,
    user_id: id,
    role: z.enum(["ORG_ADMIN", "TEACHER", "STUDENT"]),
  }),
  z.object({
    action: z.literal("correct_ledger"),
    original_id: id,
    amount,
    cost: amount,
    reason: short,
    key: id,
  }),
  z.object({
    action: z.literal("refund"),
    original_id: id,
    amount,
    reason: short,
    key: id,
  }),
]);
