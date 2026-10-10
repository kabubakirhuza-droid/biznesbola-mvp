export type FormField = {
  key: string;
  type?: "number" | "date" | "datetime-local" | "checkbox" | "textarea";
  options?: string[];
  reference?: string;
  required?: boolean;
  default?: string | number | boolean;
};
const f = (
  key: string,
  type?: FormField["type"],
  required = true,
): FormField => ({ key, type, required });
const ref = (key: string, reference: string): FormField => ({
  key,
  reference,
  required: true,
});
const option = (key: string, options: string[]): FormField => ({
  key,
  options,
  required: true,
  default: options[0],
});
export const resourceForms: Record<string, FormField[]> = {
  learner_profiles: [
    f("alias"),
    option("age_group", ["8–10", "11–13", "14–16"]),
    option("language", ["uz", "ru"]),
    option("avatar", ["🌱", "📚", "🎨", "⭐"]),
    f("archived", "checkbox", false),
  ],
  groups: [
    f("name"),
    ref("organization_id", "organizations"),
    ref("teacher_id", "organization_members"),
    f("archived", "checkbox", false),
  ],
  assignments: [
    f("title"),
    ref("group_id", "groups"),
    ref("lesson_id", "lessons"),
    f("instructions", "textarea"),
    f("due_at", "datetime-local", false),
  ],
  submissions: [
    ref("assignment_id", "assignments"),
    ref("learner_id", "learner_profiles"),
    f("body", "textarea"),
    option("status", ["submitted", "reviewed"]),
  ],
  feedback: [
    ref("submission_id", "submissions"),
    f("body", "textarea"),
    f("clarity", "number"),
    f("reasoning", "number"),
    f("reflection", "number"),
  ],
  support_tickets: [
    f("subject"),
    option("category", ["help", "bug", "privacy", "deletion"]),
    option("priority", ["normal", "urgent"]),
    option("status", ["open", "answered", "closed"]),
  ],
  support_messages: [
    ref("ticket_id", "support_tickets"),
    f("body", "textarea"),
    f("internal", "checkbox", false),
  ],
  moderation_reports: [
    f("reason", "textarea"),
    option("status", ["open", "resolved"]),
    f("decision", "textarea", false),
  ],
  profiles: [
    f("alias"),
    option("language", ["uz", "ru"]),
    option("status", ["active", "blocked", "archived"]),
  ],
  organizations: [
    f("name"),
    option("status", ["active", "blocked", "archived"]),
    { ...f("resource_limit", "number"), default: 100 },
  ],
  lessons: [
    ...["title", "body", "question", "answer", "explanation"].flatMap((k) =>
      ["uz", "ru"].map((l) =>
        f(
          k + "_" + l,
          k === "title" || k === "answer" ? undefined : "textarea",
        ),
      ),
    ),
    option("age_group", ["all", "8–10", "11–13", "14–16"]),
    option("status", ["draft", "published"]),
  ],
  feature_flags: [
    f("key"),
    f("enabled", "checkbox", false),
    f("description", "textarea", false),
  ],
  savings_goals: [
    f("title"),
    f("target", "number"),
    { ...f("allocated", "number"), default: 0 },
  ],
  allocations: [
    f("amount", "number"),
    { ...f("working", "number"), default: 50 },
    { ...f("dream", "number"), default: 30 },
    { ...f("personal", "number"), default: 20 },
  ],
};
export const displayColumns: Record<string, string[]> = {
  learner_profiles: ["alias", "age_group", "language", "archived"],
  groups: ["name", "teacher_id", "archived"],
  organization_members: ["user_id", "role", "active"],
  organizations: ["name", "status", "resource_limit"],
  profiles: ["alias", "role", "status"],
  assignments: ["title", "due_at"],
  submissions: ["body", "status", "submitted_at"],
  feedback: ["body", "clarity", "reasoning", "reflection"],
  lessons: ["title_uz", "title_ru", "age_group", "status", "revision"],
  support_tickets: ["subject", "category", "priority", "status"],
  support_messages: ["body", "internal", "created_at"],
  moderation_reports: ["reason", "status", "decision"],
  feature_flags: ["key", "enabled", "description"],
  audit_logs: ["action", "entity", "object_id", "reason", "created_at"],
  ai_usage: ["model", "input_tokens", "output_tokens", "status", "created_at"],
  notifications: ["title", "read_at"],
  user_achievements: ["event_key", "points", "created_at"],
  savings_goals: ["title", "target", "allocated"],
  allocations: ["amount", "working", "dream", "personal"],
  projects: ["title", "stage", "mode", "updated_at"],
  invitations: ["role", "expires_at", "used_by", "revoked_at"],
};
