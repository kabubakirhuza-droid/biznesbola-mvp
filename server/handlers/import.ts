import { z } from "zod";
import {
  body,
  json,
  method,
  type Request,
  type Response,
} from "../http.js";
import { authenticated, failure } from "../session.js";
export default async function handler(req: Request, res: Response) {
  if (!method(req, res, ["POST"])) return;
  try {
    const { db } = await authenticated(req, res);
    const p = z
      .object({
        id: z.uuid(),
        title: z.string().min(2).max(100),
        description: z.string().max(2000),
        category: z.string().max(40),
        audience: z.string().max(2000),
        goal: z.string().max(2000),
        tasks: z.array(z.string().min(1).max(160)).max(50),
      })
      .parse(await body(req, 30000));
    const { data, error } = await db.rpc("import_guest_project", {
      source_id: p.id,
      project_title: p.title,
      project_description: p.description,
      project_category: p.category,
      target_audience: p.audience,
      project_goal: p.goal,
      task_titles: p.tasks,
    });
    if (error) throw new Error("invalid_request");
    json(res, 200, { id: data });
  } catch (e) {
    failure(res, e);
  }
}
