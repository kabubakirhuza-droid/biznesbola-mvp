export type Lesson = {
  id: string;
  title_uz: string;
  title_ru: string;
  body_uz: string;
  body_ru: string;
  question_uz: string;
  question_ru: string;
  answer_uz: string;
  answer_ru: string;
  explanation_uz: string;
  explanation_ru: string;
  age_group: string;
  status: string;
};
const definitions: [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
][] = [
  [
    "Ehtiyoj va istak",
    "Потребность и желание",
    "Ehtiyoj — zarur narsa. Istak — xohlagan narsang. Avval zarur xarajatlarni rejalashtir.",
    "Потребность — необходимое. Желание — то, что хочется. Сначала планируй необходимые расходы.",
    "Suv ehtiyojmi yoki istakmi?",
    "Вода — потребность или желание?",
    "ehtiyoj",
    "потребность",
  ],
  [
    "Byudjet",
    "Бюджет",
    "Byudjet — kiradigan va sarflanadigan pul rejasi. Reja xarajatni boshqarishga yordam beradi.",
    "Бюджет — план поступлений и расходов. Он помогает управлять затратами.",
    "3 000 + 2 000 so‘m xarajat. Jami qancha?",
    "Расходы 3 000 + 2 000 сум. Какова сумма?",
    "5000",
    "5000",
  ],
  [
    "Tannarx",
    "Себестоимость",
    "Tannarx barcha ishlab chiqarish xarajatlarini qamrab oladi. Umumiy xarajatni birliklar soniga bo‘l.",
    "Себестоимость включает все затраты на производство. Раздели общие расходы на число единиц.",
    "40 000 so‘mga 8 buyum. Birining tannarxi?",
    "8 изделий стоят 40 000 сум. Себестоимость одного?",
    "5000",
    "5000",
  ],
  [
    "Ustama va marja",
    "Наценка и маржа",
    "Ustama tannarxga qo‘shiladi. Marja — foydaning sotish narxidagi ulushi. Bu ikki foiz bir xil emas.",
    "Наценку добавляют к себестоимости. Маржа — доля прибыли в цене продажи. Эти проценты различаются.",
    "Tannarx 8 000, ustama 2 000. Narx qancha?",
    "Себестоимость 8 000, наценка 2 000. Какова цена?",
    "10000",
    "10000",
  ],
  [
    "Tushum va foyda",
    "Выручка и прибыль",
    "Tushum — sotuvdan kelgan pul. Foyda — tushumdan barcha xarajatlar ayrilgandagi natija.",
    "Выручка — поступления от продаж. Прибыль — выручка за вычетом всех расходов.",
    "Tushum 15 000, xarajat 8 000. Foyda?",
    "Выручка 15 000, расходы 8 000. Какова прибыль?",
    "7000",
    "7000",
  ],
  [
    "Jamg‘arma",
    "Накопления",
    "Jamg‘arma uchun maqsad va ajratiladigan summa kerak. Barcha tushumni emas, mavjud foydani taqsimla.",
    "Для накоплений нужны цель и выделенная сумма. Распределяй доступную прибыль, а не всю выручку.",
    "10 000 so‘m foydaning 30% qismi qancha?",
    "Сколько составляют 30% прибыли в 10 000 сум?",
    "3000",
    "3000",
  ],
  [
    "Xatar",
    "Риск",
    "Xatar — natija kutilganidan boshqacha bo‘lishi mumkinligi. Kichik sinov keraksiz xarajatni kamaytiradi.",
    "Риск — возможность получить иной результат. Небольшая проба уменьшает ненужные расходы.",
    "Avval kichik sinovmi yoki katta xarajatmi?",
    "Что сначала: маленькая проба или большие расходы?",
    "kichik sinov",
    "маленькая проба",
  ],
  [
    "Halol reklama",
    "Честная реклама",
    "Mahsulot haqida rost gapir. Natijani kafolatlama. Namuna bilan haqiqat orasidagi farqni ko‘rsat.",
    "Говори о товаре правду. Не гарантируй результат. Показывай разницу между примером и фактом.",
    "Reklama rost bo‘lishi kerakmi?",
    "Реклама должна быть правдивой?",
    "ha",
    "да",
  ],
  [
    "Qaytarish",
    "Возврат",
    "Qaytarilgan pul yangi xarajat yoki yana bir sotuv emas. Uni dastlabki sotuvga bog‘lab bir marta yoz.",
    "Возврат не является новой продажей. Свяжи его с исходной операцией и запиши один раз.",
    "15 000 tushumdan 5 000 qaytdi. Sof tushum?",
    "Из выручки 15 000 вернули 5 000. Сколько осталось?",
    "10000",
    "10000",
  ],
  [
    "Moliyaviy firibgarlik",
    "Финансовое мошенничество",
    "Parol va tasdiqlash kodlarini hech kimga yuborma. Noma’lum to‘lov taklifini ota-onangga ko‘rsat.",
    "Никому не отправляй пароль и коды подтверждения. Покажи взрослому незнакомое предложение оплаты.",
    "Notanish odamga parol berish mumkinmi?",
    "Можно ли передать пароль незнакомцу?",
    "yo‘q",
    "нет",
  ],
  [
    "Mas’uliyat",
    "Ответственность",
    "Xatoni yashirma. Yozuvni tekshir va sababini yozib tuzat. Pul bilan bog‘liq ishda kattalardan yordam so‘ra.",
    "Не скрывай ошибку. Проверь запись и исправь её с указанием причины. В денежных вопросах обращайся к взрослому.",
    "Xatoni yashirishmi yoki tuzatishmi?",
    "Ошибку скрыть или исправить?",
    "tuzatish",
    "исправить",
  ],
  [
    "Jamoaviy ish",
    "Командная работа",
    "Vazifalarni taqsimla, muddatni kelish va har bir hissani qayd et. Barcha ishni bitta odamga yuklama.",
    "Распредели задачи, согласуй сроки и запиши вклад участников. Не перекладывай всё на одного человека.",
    "Vazifalarni taqsimlash foydalimi?",
    "Полезно ли распределять задачи?",
    "ha",
    "да",
  ],
];
export const curriculum: Lesson[] = definitions.map((d, index) => ({
  id: `77777777-7777-4777-8777-${String(index + 1).padStart(12, "0")}`,
  title_uz: d[0],
  title_ru: d[1],
  body_uz: d[2],
  body_ru: d[3],
  question_uz: d[4],
  question_ru: d[5],
  answer_uz: d[6],
  answer_ru: d[7],
  explanation_uz: d[2],
  explanation_ru: d[3],
  age_group: "all",
  status: "published",
}));
export function ageChallenge(
  lesson: Lesson,
  age: string,
  language: "uz" | "ru",
) {
  if (age === "14–16" && lesson.id.endsWith("000000000004"))
    return {
      question:
        language === "uz"
          ? "Narx 10 000, tannarx 8 000. Marja necha foiz?"
          : "Цена 10 000, себестоимость 8 000. Какова маржа в процентах?",
      answer: "20",
      explanation:
        language === "uz"
          ? "(10 000 − 8 000) ÷ 10 000 × 100 = 20%."
          : "(10 000 − 8 000) ÷ 10 000 × 100 = 20%.",
    };
  if (age === "8–10" && lesson.id.endsWith("000000000003"))
    return {
      question:
        language === "uz"
          ? "Ikki qalam jami 4 000 so‘m. Bitta qalam qancha?"
          : "Два карандаша стоят 4 000 сум. Сколько стоит один?",
      answer: "2000",
      explanation:
        language === "uz"
          ? "4 000 ÷ 2 = 2 000 so‘m."
          : "4 000 ÷ 2 = 2 000 сум.",
    };
  return {
    question: lesson[`question_${language}`],
    answer: lesson[`answer_${language}`],
    explanation: lesson[`explanation_${language}`],
  };
}
