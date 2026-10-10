import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import uz from "./uz.json";
import ru from "./ru.json";
let language = "uz";
try {
  language =
    JSON.parse(localStorage.getItem("biznesbola-learning-v1") || "{}").state
      ?.language || "uz";
} catch {
  /* default */
}
i18n.use(initReactI18next).init({
  resources: { uz: { translation: uz }, ru: { translation: ru } },
  lng: language,
  fallbackLng: "uz",
  interpolation: { escapeValue: false },
});
export default i18n;
