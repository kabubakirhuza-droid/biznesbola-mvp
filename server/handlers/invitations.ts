import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import {
  body,
  json,
  method,
  type Request,
  type Response,
} from "../http.js";
import { authenticated, failure } from "../session.js";
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    organization_id: z.uuid(),
    role: z.enum(["TEACHER", "STUDENT"]),
    group_id: z.uuid().nullable().optional(),
    project_id: z.uuid().nullable().optional(),
  }),
  z.object({
    action: z.literal("accept"),
    token: z.string().regex(/^[a-f0-9]{64}$/),
  }),
  z.object({ action: z.literal("revoke"), id: z.uuid() }),
]);
export default async function handler(req: Request, res: Response) {
  if (!method(req, res, ["POST"])) return;
  try {
    const { db } = await authenticated(req, res);
    const p = schema.parse(await body(req));
    let result;
    let token;
    if (p.action === "create") {
      token = randomBytes(32).toString("hex");
      result = await db.rpc("create_invitation", {
        org: p.organization_id,
        invited_role: p.role,
        hash: createHash("sha256").update(token).digest("hex"),
        team: p.group_id || null,
        project: p.project_id || null,
      });
    } else if (p.action === "accept")
      result = await db.rpc("accept_invitation", {
        hash: createHash("sha256").update(p.token).digest("hex"),
      });
    else result = await db.rpc("revoke_invitation", { invite_id: p.id });
    if (result.error) throw new Error("forbidden");
    json(res, 200, { data: result.data, token });
  } catch (e) {
    failure(res, e);
  }
}
