export type Profile = {
  name: string;
  age: string;
  avatar: string;
  dream: string;
  goal: number;
  product?: import("../domain/catalog").CatalogProduct;
};
export type Transaction = {
  id: string;
  kind: "income" | "expense" | "capital";
  amount: number;
  note: string;
  mode: "practice" | "real";
  date: string;
  cost: number;
};
export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  available: boolean;
  image?: string;
};
export type Draft = {
  demo?: boolean;
  avatar?: string;
  name: string;
  description: string;
  products: Product[];
  status: "draft" | "review";
};
export type Plan = {
  product: string;
  unit_cost: number;
  markup: number;
  price: number;
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  fallback?: boolean;
  plan?: Plan;
};
