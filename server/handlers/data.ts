import { z } from "zod";
import {
  body,
  json,
  method,
  type Request,
  type Response,
} from "../http.js";
import { authenticated, failure } from "../session.js";
import { resourceName, resources, rpcSchema } from "../resources.js";
export default async function handler(req: Request, res: Response) {
  if (!method(req, res, ["GET", "POST", "PATCH", "DELETE"])) return;
  try {
    const { db, profile } = await authenticated(req, res);
    const url = new URL(req.url || "/", "http://local");
    if (req.method === "GET" && url.searchParams.has("totals")) {
      const { data, error } = await db.rpc("ledger_totals", {
        project: z.uuid().parse(url.searchParams.get("totals")),
      });
      if (error) throw new Error("forbidden");
      return json(res, 200, { data });
    }
    if (req.method === "POST" && url.searchParams.get("rpc") === "1") {
      const p = rpcSchema.parse(await body(req));
      let response;
      switch (p.action) {
        case "organization":
          response = await db.rpc("create_organization", { org_name: p.name });
          break;
        case "learner":
          response = await db.rpc("create_learner", {
            nickname: p.alias,
            age: p.age,
            lang: p.language,
          });
          break;
        case "group_learner":
          response = await db.rpc("add_group_learner", {
            g: p.group_id,
            learner: p.learner_id,
          });
          break;
        case "member_role":
          response = await db.rpc("set_member_role", {
            org: p.organization_id,
            target: p.user_id,
            new_role: p.role,
          });
          break;
        case "correct_ledger":
          response = await db.rpc("correct_ledger", {
            original: p.original_id,
            new_amount: p.amount,
            new_cost: p.cost,
            explanation: p.reason,
            operation_key: p.key,
          });
          break;
        case "refund":
          response = await db.rpc("request_refund", {
            original: p.original_id,
            refund_amount: p.amount,
            explanation: p.reason,
            operation_key: p.key,
          });
          break;
      }
      if (response.error) throw new Error("forbidden");
      return json(res, 200, { data: response.data });
    }
    const table = resourceName.parse(url.searchParams.get("table"));
    if (table === "profiles" && profile.role !== "PLATFORM_ADMIN")
      throw new Error("forbidden");
    if (req.method === "GET") {
      const page = z.coerce
        .number()
        .int()
        .min(0)
        .max(10000)
        .parse(url.searchParams.get("page") || 0);
      let query = db
        .from(table)
        .select("*", { count: "exact" })
        .range(page * 25, page * 25 + 24);
      for (const field of [
        "organization_id",
        "project_id",
        "group_id",
        "assignment_id",
        "submission_id",
        "ticket_id",
        "learner_id",
      ]) {
        const value = url.searchParams.get(field);
        if (value) query = query.eq(field, z.uuid().parse(value));
      }
      if (url.searchParams.has("id"))
        query = query.eq("id", z.uuid().parse(url.searchParams.get("id")));
      const { data, error, count } = await query;
      if (error) throw new Error("invalid_request");
      return json(res, 200, { data, count, page });
    }
    const schema = resources[table as keyof typeof resources];
    if (!schema) throw new Error("forbidden");
    const payload = z
      .object({
        id: z.string().optional(),
        revision: z.number().int().optional(),
        data: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(await body(req, 50000));
    if (req.method === "DELETE") {
      if (table !== "projects" && table !== "project_tasks")
        throw new Error("forbidden");
      const { data, error } = await db
        .from(table)
        .delete()
        .eq("id", z.uuid().parse(payload.id))
        .select("id");
      if (error || !data?.length) throw new Error("forbidden");
      return json(res, 200, { ok: true });
    }
    if (
      req.method === "PATCH" &&
      [
        "ledger_entries",
        "allocations",
        "calculations",
        "demand_responses",
        "feedback",
        "support_messages",
      ].includes(table)
    )
      throw new Error("forbidden");
    if (
      req.method === "POST" &&
      [
        "profiles",
        "organizations",
        "learner_profiles",
        "notifications",
      ].includes(table)
    )
      throw new Error("forbidden");
    const input: Record<string, unknown> = schema.parse(payload.data);
    if (table === "projects" && req.method === "PATCH") {
      delete (input as Record<string, unknown>).organization_id;
      delete (input as Record<string, unknown>).learner_id;
      if (!payload.revision) throw new Error("conflict");
    }
    let query =
      req.method === "POST"
        ? db.from(table).insert(input)
        : db
            .from(table)
            .update(input)
            .eq(
              table === "feature_flags" ? "key" : "id",
              table === "feature_flags"
                ? payload.id
                : z.uuid().parse(payload.id),
            );
    if (table === "projects" && req.method === "PATCH")
      query = query.eq("revision", payload.revision);
    const { data, error } = await query.select().single();
    if (error || !data)
      throw new Error(
        table === "projects" && req.method === "PATCH"
          ? "conflict"
          : "forbidden",
      );
    json(res, 200, { data });
  } catch (error) {
    failure(res, error);
  }
}
