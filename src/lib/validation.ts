import { z } from "zod";
export const planSchema = z
  .object({
    product: z.string().min(1).max(80),
    unit_cost: z.number().int().min(0).max(100000000),
    markup: z.number().int().min(0).max(100000000),
    price: z.number().int().min(0).max(100000000),
  })
  .refine((p) => p.unit_cost + p.markup === p.price);
export const chatSchema = z.object({
  text: z
    .string()
    .trim()
    .min(2)
    .max(1200)
    .refine((s) => !/(https?:|@|\+?\d[\d\s()-]{7,})/i.test(s)),
  language: z.enum(["uz", "ru"]),
  mode: z.enum(["idea","plan","concept","calculation","mistake","pitch","reflection"]).default("idea"),
  ageGroup: z.enum(["8–10","11–13","14–16"]).default("11–13"),
  projectId: z.uuid().optional(),
  conversationId: z.uuid().optional(),
  organizationId: z.uuid().optional(),
  stage: z.number().int().min(0).max(7).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().min(1).max(6500),
      }),
    )
    .max(6)
    .default([]),
});
export function safePublicText(s: string) {
  return !/(https?:|@|\+?\d[\d\s()-]{6,}|telefon|passport|pasport|manzil|адрес|телефон|школа|maktab)/i.test(
    s,
  );
}
export const productSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(80),
  description: z.string().max(140),
  price: z.number().int().min(0).max(100000000),
  available: z.boolean(),
  image: z.string().max(420000).optional(),
});
export const draftSchema = z
  .object({
    name: z.string().trim().min(2).max(60),
    description: z.string().max(140),
    products: z.array(productSchema).min(1).max(10),
    demo: z.boolean().optional(),
    avatar: z.enum(["📚", "🎨", "🌱", "⭐"]).optional(),
  })
  .refine((d) =>
    safePublicText(
      d.name +
        " " +
        d.description +
        " " +
        d.products.map((p) => p.name + " " + p.description).join(" "),
    ),
  );
