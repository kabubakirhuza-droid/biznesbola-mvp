export type CatalogProduct = {
  id: string;
  name: string;
  image: string;
  price: number;
  currency: "UZS";
  source: string;
  checkedAt: string;
  available: boolean;
  sourceStatus?: "live" | "snapshot";
};

export const catalog = [
  {
    id: "iphone-16",
    category: "phone",
    terms: "iphone 16 apple айфон",
    slug: "smartfon-apple-iphone-16-128gb-white",
  },
  {
    id: "galaxy-a16",
    category: "phone",
    terms: "samsung galaxy a16 самсунг",
    slug: "smartfon-samsung-galaxy-a16-4128gb-black",
  },
  {
    id: "himo-h1",
    category: "bike",
    terms: "xiaomi himo h1 portable",
    slug: "elektrovelosiped-skladnoi-xiaomi-himo-h1-portable-electric-bicycle-grey",
  },
  {
    id: "lenovo-v15",
    category: "laptop",
    terms: "lenovo v15 g4 amn",
    slug: "noutbuk-lenovo-v15-g4-amn-amd-7120u-ddr5-8gb-ssd-512gb-156-fullhd",
  },
  {
    id: "redmi-buds",
    category: "headphones",
    terms: "redmi buds 6 play xiaomi",
    slug: "besprovodnye-naushniki-redmi-buds-6-play-belye",
  },
  {
    id: "sariq-dev",
    category: "book",
    terms: "sariq devni minib xudoyberdi toxtaboyev",
    slug: "hudojberdi-tuhtaboev-sariq-devni-minib",
  },
] as const;

export function findCatalog(query: string) {
  const q = query
    .toLowerCase()
    .trim()
    .replace(/[‘’ʻʼ']/g, "");
  if (!q) return [...catalog];
  const groups: Record<string, string[]> = {
    phone: ["telefon", "telephon", "phone", "smartfon", "телефон", "смартфон"],
    bike: ["velosiped", "bike", "bicycle", "велосипед"],
    laptop: ["noutbuk", "laptop", "kompyuter", "ноутбук", "компьютер"],
    headphones: ["quloqchin", "quloqchun", "headphones", "наушники"],
    book: ["kitob", "book", "книга"],
  };
  const category = Object.entries(groups).find(([, words]) =>
    words.includes(q),
  )?.[0];
  const tokens = q
    .split(/\s+/)
    .filter(
      (token) => !Object.values(groups).some((words) => words.includes(token)),
    );
  return catalog.filter((p) =>
    category
      ? p.category === category
      : tokens.every((token) => `${p.id} ${p.terms}`.includes(token)),
  );
}
