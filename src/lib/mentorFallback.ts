import type { Plan } from "../types";

export function mentorFallback(
  text: string,
  translate: (key: string) => string,
) {
  if(/crypto|kripto|bitcoin|крипт|кредит|qarz|kazino|casino|ставк|gambling|спирт|алкогол|tamaki|табак/i.test(text))return{text:translate("fallbackSafety"),fallback:true};
  if(/tannarx|себестоим/i.test(text))return{text:translate("conceptCost"),fallback:true};
  if(/foyda|прибыл/i.test(text))return{text:translate("conceptProfit"),fallback:true};
  const book = /kitob|komiks|книг|комикс|book/i.test(text);
  const craft = /bilaguzuk|браслет|bracelet|handmade|qo.l mehnat/i.test(text);
  if (!book && !craft) {
    return { text: translate("fallbackClarify"), fallback: true };
  }
  const plan: Plan = {
    product: translate(book ? "library" : "bracelet"),
    unit_cost: book ? 1000 : 8000,
    markup: book ? 2000 : 7000,
    price: book ? 3000 : 15000,
  };
  return {
    text: translate(book ? "fallbackBook" : "fallbackCraft"),
    fallback: true,
    plan,
  };
}
