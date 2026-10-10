import { json, type Request, type Response } from "../server/http.js";

export default async function handler(req: Request, res: Response) {
 const url = new URL(req.url || "/", "http://localhost");
 const route = String(req.query?.route || url.searchParams.get("route") || url.pathname.replace(/^\/api\//, ""));
 url.searchParams.delete("route");
 req.url = `/api/${route}${url.searchParams.size ? "?" + url.searchParams.toString() : ""}`;
 try {
  switch(route) {
   case "admin": return (await import("../server/handlers/admin.js")).default(req, res);
   case "adult": return (await import("../server/handlers/adult.js")).default(req, res);
   case "ai/chat": return (await import("../server/handlers/ai/chat.js")).default(req, res);
   case "auth": return (await import("../server/handlers/auth.js")).default(req, res);
   case "conversation": return (await import("../server/handlers/conversation.js")).default(req, res);
   case "data": return (await import("../server/handlers/data.js")).default(req, res);
   case "import": return (await import("../server/handlers/import.js")).default(req, res);
   case "invitations": return (await import("../server/handlers/invitations.js")).default(req, res);
   case "lessons": return (await import("../server/handlers/lessons.js")).default(req, res);
   case "parent/login": return (await import("../server/handlers/parent/login.js")).default(req, res);
   case "parent/stores": return (await import("../server/handlers/parent/stores.js")).default(req, res);
   case "products": return (await import("../server/handlers/products.js")).default(req, res);
   case "showcase": return (await import("../server/handlers/showcase.js")).default(req, res);
   case "simulation": return (await import("../server/handlers/simulation.js")).default(req, res);
   case "status": return (await import("../server/handlers/status.js")).default(req, res);
   case "storefront/public": return (await import("../server/handlers/storefront/public.js")).default(req, res);
   default: return json(res, 404, {error: "not_found"});
  }
 } catch { return json(res, 503, {error: "server_unavailable"}); }
}
