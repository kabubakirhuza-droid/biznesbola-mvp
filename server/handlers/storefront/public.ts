import { z } from "zod";
import { database } from "../../supabase.js";
import { json, method, type Request, type Response } from "../../http.js";
import type { Draft } from "../../../src/types";
import { draftSchema } from "../../../src/lib/validation.js";
export default async function handler(req: Request, res: Response) {
  if (!method(req, res, ["GET"])) return;
  try {
    const slug = z
      .string()
      .uuid()
      .parse(
        req.query?.slug ||
          new URL(
            req.url || "/",
            process.env.APP_ORIGIN || "http://localhost",
          ).searchParams.get("slug"),
      );
    const db = database();
    const { data, error } = await db
      .from("storefronts")
      .select("content")
      .eq("slug", slug)
      .eq("status", "published")
      .single();
    if (error || !data) {
      const {data:version}=await db.from("storefront_versions").select("id,title,description,status,approved_at,storefront_products(id,name,description,price,available,image_path)").eq("slug",slug).eq("status","PUBLISHED").not("approved_at","is",null).maybeSingle();
      if(!version)return json(res,404,{error:"not_found"});
      const content=draftSchema.parse({name:version.title,description:version.description,products:version.storefront_products.map(p=>({id:p.id,name:p.name,description:p.description,price:Number(p.price),available:p.available}))});
      for(let i=0;i<content.products.length;i++){const path=version.storefront_products[i].image_path;if(path){const {data:signed,error}=await db.storage.from("product-images").createSignedUrl(path,60);if(error)throw error;(content.products[i] as {image?:string}).image=signed.signedUrl;}}
      return json(res,200,{content});
    }
    const content = data.content as Draft;
    await Promise.all(
      content.products.map(async (p) => {
        if (p.image) {
          const { data: signed, error } = await db.storage
            .from("product-images")
            .createSignedUrl(p.image, 60);
          if (error) throw error;
          p.image = signed.signedUrl;
        }
      }),
    );
    json(res, 200, { content });
  } catch {
    json(res, 404, { error: "not_found" });
  }
}
