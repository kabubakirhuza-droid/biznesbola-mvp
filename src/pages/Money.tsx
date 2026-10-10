import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "../store/useSession";
import { cloud, csv, download } from "../lib/cloud";
import { ledgerSummary, type LedgerEntry } from "../domain/ledger";
import { allocate } from "../lib/budget";
import { Field, Money as Currency, Notice } from "../components/UI";
import ResourceTable from "../components/ResourceTable";
export default function Money() {
  const { t } = useTranslation();
  const session = useSession();
  const [projects, setProjects] = useState<
    { id: string; title: string; mode: "practice" | "real" }[]
  >([]);
  const [project, setProject] = useState("");
  const [rows, setRows] = useState<LedgerEntry[]>([]);
  const [kind, setKind] = useState("revenue");
  const [amount, setAmount] = useState("");
  const [cost, setCost] = useState("0");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [correction, setCorrection] = useState<LedgerEntry | null>(null);
  const [refund, setRefund] = useState<LedgerEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [aggregate, setAggregate] = useState(ledgerSummary([]));
  const [key, setKey] = useState(crypto.randomUUID());
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  useEffect(() => {
    setProjects([]);
    setProject("");
    setRows([]);
    cloud<{ data: typeof projects }>(
      `/api/data?table=projects${session.organization ? "&organization_id=" + session.organization : ""}`,
    )
      .then((r) => {
        setProjects(r.data);
        setProject(r.data[0]?.id || "");
      })
      .catch((e) => setError(e.message));
  }, [session.organization, session.profile?.id]);
  useEffect(() => {
    setRows([]);
    if (!project) return;
    const controller = new AbortController();
    cloud<{ data: ReturnType<typeof ledgerSummary> }>(
      `/api/data?totals=${project}`,
      "GET",
      undefined,
      controller.signal,
    )
      .then((r) => setAggregate(r.data))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    cloud<{ data: LedgerEntry[]; count: number }>(
      `/api/data?table=ledger_entries&project_id=${project}&page=${page}`,
      "GET",
      undefined,
      controller.signal,
    )
      .then((r) => {
        setRows(r.data);
        setCount(r.count);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [project, refresh, page]);
  const totals = aggregate;
  const current = projects.find((p) => p.id === project);
  const jars = allocate(Math.max(0, totals.profit), [50, 30, 20]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!current || busy) return;
    setBusy(true);
    setError("");
    try {
      if (correction)
        await cloud("/api/data?rpc=1", "POST", {
          action: "correct_ledger",
          original_id: correction.id,
          amount: +amount,
          cost: +cost,
          reason: note,
          key,
        });
      else if (refund)
        await cloud("/api/data?rpc=1", "POST", {
          action: "refund",
          original_id: refund.id,
          amount: +amount,
          reason: note,
          key,
        });
      else
        await cloud("/api/data?table=ledger_entries", "POST", {
          data: {
            project_id: project,
            kind,
            mode: current.mode,
            amount: +amount,
            cost: kind === "revenue" ? +cost : 0,
            note,
            idempotency_key: key,
            occurred_at: new Date(date + "T12:00:00+05:00").toISOString(),
          },
        });
      setRefresh((r) => r + 1);
      setAmount("");
      setCost("0");
      setNote("");
      setCorrection(null);
      setRefund(null);
      setKey(crypto.randomUUID());
    } catch (e) {
      setError(e instanceof Error ? e.message : "server_error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>{t("wallet")}</h1>
      <Notice>{t("manualLedger")}</Notice>
      {error && (
        <Notice>
          {t("error_" + error, { defaultValue: t("serverError") })}
        </Notice>
      )}
      <Field label={t("project")}>
        <select
          value={project}
          onChange={(e) => {
            setProject(e.target.value);
            setPage(0);
          }}
        >
          <option value="">{t("chooseProject")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} · {t(p.mode)}
            </option>
          ))}
        </select>
      </Field>
      {current && (
        <>
          <span className="pill">{t(current.mode)}</span>
          <Notice>{t("projectTotals")}</Notice>
          <div className="path-grid">
            {(
              [
                "revenue",
                "expenses",
                "profit",
                "balance",
                "capital",
                "refunds",
              ] as const
            ).map((k) => (
              <article className="card" key={k}>
                <h3>{t(k)}</h3>
                <strong>
                  <Currency value={totals[k]} />
                </strong>
              </article>
            ))}
          </div>
          <section className="card">
            <h2>
              {t(
                correction
                  ? "correctEntry"
                  : refund
                    ? "refundEntry"
                    : "addEntry",
              )}
            </h2>
            <form onSubmit={save}>
              {!correction && !refund && (
                <Field label={t("operationType")}>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    {["revenue", "expense", "capital", "allocation"].map(
                      (k) => (
                        <option key={k} value={k}>
                          {t(k)}
                        </option>
                      ),
                    )}
                  </select>
                </Field>
              )}
              <Field label={t("amount")}>
                <input
                  type="number"
                  min={0}
                  max={1e9}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              {(kind === "revenue" || correction?.kind === "revenue") &&
                !refund && (
                  <Field label={t("cost")}>
                    <input
                      type="number"
                      min={0}
                      max={1e9}
                      required
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                    />
                  </Field>
                )}
              <Field label={t("date")}>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
              <Field label={t(correction || refund ? "reason" : "comment")}>
                <input
                  required={!!correction || !!refund}
                  minLength={correction || refund ? 2 : 0}
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </Field>
              <button className="btn primary" disabled={busy}>
                {t("save")}
              </button>
              {(correction || refund) && (
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setCorrection(null);
                    setRefund(null);
                    setNote("");
                    setKey(crypto.randomUUID());
                  }}
                >
                  {t("cancel")}
                </button>
              )}
            </form>
          </section>
          <section className="card">
            <div className="section-heading">
              <h2>{t("ledgerHistory")}</h2>
              <button
                className="btn secondary"
                onClick={() =>
                  download(
                    "ledger-page.csv",
                    csv(rows as unknown as Record<string, unknown>[]),
                    "text/csv;charset=utf-8",
                  )
                }
              >
                {t("exportPage")}
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <caption>{t("ledgerHistory")}</caption>
                <thead>
                  <tr>
                    {[
                      "date",
                      "operationType",
                      "amount",
                      "comment",
                      "actions",
                    ].map((k) => (
                      <th key={k}>{t(k)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        {new Date(r.occurred_at).toLocaleDateString(undefined, {
                          timeZone: "Asia/Tashkent",
                        })}
                      </td>
                      <td>{t(r.kind)}</td>
                      <td>
                        <Currency value={r.amount} />
                      </td>
                      <td>{r.note}</td>
                      <td>
                        {["revenue", "capital", "expense"].includes(r.kind) && (
                          <button
                            className="btn secondary"
                            onClick={() => {
                              setCorrection(r);
                              setRefund(null);
                              setAmount(String(r.amount));
                              setCost(String(r.cost));
                              setNote("");
                              setKey(crypto.randomUUID());
                            }}
                          >
                            {t("correctEntry")}
                          </button>
                        )}
                        {r.kind === "revenue" && (
                          <button
                            className="btn secondary"
                            onClick={() => {
                              setRefund(r);
                              setCorrection(null);
                              setAmount("");
                              setNote("");
                              setKey(crypto.randomUUID());
                            }}
                          >
                            {t("refundEntry")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!rows.length && <p>{t("emptyRecords")}</p>}
            <div className="page-tools">
              <button
                className="btn secondary"
                disabled={!page}
                onClick={() => setPage(page - 1)}
              >
                {t("previous")}
              </button>
              <button
                className="btn secondary"
                disabled={(page + 1) * 25 >= count}
                onClick={() => setPage(page + 1)}
              >
                {t("next")}
              </button>
            </div>
            <h3>{t("allocationExample")}</h3>
            <p>{t("allocationConfirm")}</p>
            <p>
              Aylanma: <Currency value={jars[0]} /> · Orzu:{" "}
              <Currency value={jars[1]} /> · {t("myself")}:{" "}
              <Currency value={jars[2]} />
            </p>
          </section>
        </>
      )}
      <ResourceTable table="savings_goals" />
      <ResourceTable table="allocations" editable={false} />
    </>
  );
}
