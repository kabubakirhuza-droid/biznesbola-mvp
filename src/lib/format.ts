import uz from "../i18n/uz.json";
import ru from "../i18n/ru.json";
export const money = (n: number, language = "uz") =>
  new Intl.NumberFormat(language === "ru" ? "ru-RU" : "uz-UZ", {
    maximumFractionDigits: 0,
  })
    .formatToParts(n)
    .map((part) => (part.type === "group" ? " " : part.value))
    .join("") +
  " " +
  (language === "ru" ? ru.currency : uz.currency);
