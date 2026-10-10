import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  ArrowRight,
  Check,
  Calculator as CalcIcon,
} from "lucide-react";
import { useApp } from "../store/useApp";
import { calculate } from "../lib/calc";
import { Field, Money, PageTitle, Notice } from "../components/UI";
export default function Calculator() {
  const { t } = useTranslation();
  const s = useApp();
  const navigate = useNavigate();
  const p = s.calculation;
  const [name, setName] = useState(p?.product || t("bracelet"));
  const [expenses, setExpenses] = useState([
    {
      name: t("expenseDefault"),
      amount: p?.unit_cost ? String(p.unit_cost * 10) : "80000",
    },
  ]);
  const [quantity, setQuantity] = useState("10");
  const [sold, setSold] = useState("10");
  const [markup, setMarkup] = useState(
    p?.unit_cost ? String((p.markup / p.unit_cost) * 100) : "87.5",
  );
  const [manual, setManual] = useState(!!p);
  const [price, setPrice] = useState(String(p?.price || 15000));
  const [saved, setSaved] = useState(false);
  let result: ReturnType<typeof calculate> | null = null;
  try {
    result = calculate({
      expenses: expenses.map((e) => (e.amount === "" ? NaN : +e.amount)),
      quantity: +quantity,
      sold: +sold,
      markupPercent: +markup,
      manualPrice: manual ? +price : undefined,
    });
  } catch {
    /* invalid state */
  }
  function save() {
    if (!result || !name.trim()) return;
    s.setCalculation({
      product: name,
      unit_cost: result.unitCost,
      markup: Math.max(0, result.markup),
      price: result.price,
    });
    s.award("calculation");
    setSaved(true);
  }
  return (
    <>
      <PageTitle title="calcTitle" subtitle="calcSub" />
      <div className="two-column">
        <section className="card form-card">
          <div className="card-heading">
            <span className="icon-bg yellow">
              <CalcIcon />
            </span>
            <h2>{t("calculator")}</h2>
          </div>
          <Field label={t("productName")}>
            <input
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <div className="expense-label">{t("expenses")}</div>
          {expenses.map((e, i) => (
            <div className="expense-row" key={i}>
              <input
                aria-label={t("expenseName")}
                value={e.name}
                onChange={(event) =>
                  setExpenses(
                    expenses.map((r, j) =>
                      j === i ? { ...r, name: event.target.value } : r,
                    ),
                  )
                }
              />
              <input
                aria-label={t("amount")}
                type="number"
                min="0"
                value={e.amount}
                onChange={(event) =>
                  setExpenses(
                    expenses.map((r, j) =>
                      j === i ? { ...r, amount: event.target.value } : r,
                    ),
                  )
                }
              />
              <button
                className="icon-button"
                disabled={expenses.length === 1}
                aria-label={t("remove")}
                onClick={() => setExpenses(expenses.filter((_, j) => j !== i))}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          <button
            className="btn text"
            onClick={() =>
              setExpenses([...expenses, { name: "", amount: "0" }])
            }
          >
            <Plus size={17} />
            {t("addExpense")}
          </button>
          <div className="field-pair">
            <Field label={t("quantity")}>
              <input
                type="number"
                min="1"
                max="100000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <Field label={t("soldQuantity")}>
              <input
                type="number"
                min="0"
                max={quantity}
                value={sold}
                onChange={(e) => setSold(e.target.value)}
              />
            </Field>
          </div>
          <Field label={t("markupPercent")}>
            <input
              type="number"
              min="0"
              max="10000"
              value={markup}
              onChange={(e) => setMarkup(e.target.value)}
            />
          </Field>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={manual}
              onChange={(e) => setManual(e.target.checked)}
            />
            {t("manualPrice")}
          </label>
          {manual && (
            <Field label={t("price")}>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
          )}
        </section>
        <section className="card result-card">
          <span className="eyebrow">{t("forecast")}</span>
          <h2>{t("expectedProfit")}</h2>
          <div
            className={`big-money ${result && result.profit < 0 ? "negative" : ""}`}
          >
            <Money value={result?.profit || 0} />
          </div>
          {result ? (
            <>
              <div className="cost-visual">
                <span style={{ flex: Math.max(1, result.unitCost) }}>
                  {t("unitCost")}
                </span>
                <span style={{ flex: Math.max(1, result.markup) }}>
                  {t("markup")}
                </span>
              </div>
              <div className="result-rows">
                {[
                  ["totalCost", result.total],
                  ["unitCost", result.unitCost],
                  ["markup", result.markup],
                  ["sellingPrice", result.price],
                  ["profitUnit", result.markup],
                ].map(([key, v]) => (
                  <div key={key}>
                    <span>{t(key as string)}</span>
                    <strong>
                      <Money value={v as number} />
                    </strong>
                  </div>
                ))}
                <div>
                  <span>
                    {t("markup")} / {t("margin")}
                  </span>
                  <strong>
                    {result.markupPercent.toFixed(1)}% /{" "}
                    {result.margin.toFixed(1)}%
                  </strong>
                </div>
              </div>
              <Notice>
                {result.markup < 0
                  ? t("loss")
                  : result.breakEven && result.breakEven <= +quantity
                    ? t("breakEven", { count: result.breakEven })
                    : t("noBreakEven")}
              </Notice>
              <p className="small muted">{t("marginHint")}</p>
              <div className="stack-actions">
                <button
                  className="btn primary"
                  disabled={!name.trim()}
                  onClick={save}
                >
                  {saved ? <Check size={17} /> : null}
                  {t("saveCalculation")}
                </button>
                <button
                  className="btn secondary"
                  disabled={!name.trim()}
                  onClick={() => {
                    save();
                    s.setDraft({
                      ...s.draft,
                      status: "draft",
                      products: [
                        ...s.draft.products,
                        {
                          id: crypto.randomUUID(),
                          name,
                          price: result.price,
                          description: "",
                          available: true,
                        },
                      ].slice(0, 10),
                    });
                    navigate("/store");
                  }}
                >
                  {t("toStore")}
                  <ArrowRight size={17} />
                </button>
                <button
                  className="btn text"
                  onClick={() => {
                    save();
                    navigate("/wallet", {
                      state: {
                        sale: {
                          amount: result.price,
                          cost: result.unitCost,
                          note: name,
                        },
                      },
                    });
                  }}
                >
                  {t("recordSale")}
                  <ArrowRight size={17} />
                </button>
              </div>
              {saved && <Notice>{t("calculationSaved")}</Notice>}
            </>
          ) : (
            <Notice>{t("invalid")}</Notice>
          )}
        </section>
      </div>
    </>
  );
}
