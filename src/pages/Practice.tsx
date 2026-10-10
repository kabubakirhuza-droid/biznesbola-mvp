import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "../store/useSession";
import { usePractice } from "../store/usePractice";
import {
  playRound,
  scenarios,
  type Scenario,
  type Simulation,
  type Round,
} from "../domain/simulation";
import { cloud } from "../lib/cloud";
import { Field, Money, Notice } from "../components/UI";
export default function Practice() {
  const { t } = useTranslation();
  const session = useSession();
  const guest = usePractice();
  const [rows, setRows] = useState<Simulation[]>([]);
  const [selected, setSelected] = useState("");
  const [events, setEvents] = useState<Round[]>([]);
  const [quantity, setQuantity] = useState("3");
  const [price, setPrice] = useState("6500");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setRows([]);
    setSelected("");
    if (!session.profile) {
      setRows(guest.sessions);
      return;
    }
    cloud<{ data: Simulation[] }>("/api/data?table=simulation_sessions")
      .then((r) => setRows(r.data))
      .catch((e) => setError(e.message));
  }, [session.profile?.id, guest.sessions]);
  useEffect(() => {
    if (!selected) return;
    if (!session.profile) {
      setEvents(guest.events[selected] || []);
      return;
    }
    cloud<{ data: Round[] }>(`/api/simulation?id=${selected}`)
      .then((r) => setEvents(r.data))
      .catch((e) => setError(e.message));
  }, [selected, session.profile?.id, guest.events]);
  const current = rows.find((x) => x.id === selected);
  async function start(scenario: Scenario) {
    setBusy(true);
    setError("");
    try {
      let state: Simulation;
      if (session.profile) {
        const r = await cloud<{ data: Simulation }>("/api/simulation", "POST", {
          action: "start",
          scenario,
          seed: Math.floor(Math.random() * 1000000),
        });
        state = r.data;
        setRows([state, ...rows]);
      } else {
        state = {
          id: crypto.randomUUID(),
          scenario,
          seed: Math.floor(Math.random() * 1000000),
          round: 0,
          cash: scenarios[scenario].capital,
          stock: 0,
          revision: 1,
          completed: false,
        };
        guest.save(state);
      }
      setSelected(state.id);
      setPrice(String(scenarios[scenario].reference));
      setEvents([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "server_error");
    } finally {
      setBusy(false);
    }
  }
  async function next(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !current) return;
    setBusy(true);
    setError("");
    try {
      if (session.profile) {
        const r = await cloud<{ data: Simulation; event: Round }>(
          "/api/simulation",
          "POST",
          {
            action: "round",
            id: current.id,
            revision: current.revision,
            quantity: +quantity,
            price: +price,
          },
        );
        setRows(rows.map((x) => (x.id === current.id ? r.data : x)));
        setEvents([...events, r.event]);
      } else {
        const event = playRound(current, +quantity, +price);
        guest.save(
          {
            ...current,
            round: event.round,
            cash: event.cash,
            stock: event.stock,
            revision: current.revision + 1,
            completed: event.round >= 5,
          },
          event,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "server_error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>{t("simulator")}</h1>
      <Notice>{t("virtualOnly")}</Notice>
      {error && (
        <Notice>
          {t("error_" + error, { defaultValue: t("serverError") })}
        </Notice>
      )}
      <div className="template-row">
        {Object.keys(scenarios).map((k) => (
          <button
            key={k}
            className="btn primary"
            disabled={busy}
            onClick={() => start(k as Scenario)}
          >
            {t("scenario_" + k)}
          </button>
        ))}
      </div>
      <div className="workshop-layout">
        <aside className="card">
          <h2>{t("sessions")}</h2>
          {!rows.length && <p>{t("noSessions")}</p>}
          {rows.map((s) => (
            <button
              className="saved-plan"
              key={s.id}
              onClick={() => {
                setSelected(s.id);
                setPrice(String(scenarios[s.scenario].reference));
              }}
            >
              {t("scenario_" + s.scenario)} · {s.round}/5
            </button>
          ))}
        </aside>
        <section className="card">
          {current ? (
            <>
              <h2>{t("scenario_" + current.scenario)}</h2>
              <div className="stat-row">
                <div>
                  {t("virtualCash")}
                  <strong>
                    <Money value={current.cash} />
                  </strong>
                </div>
                <div>
                  {t("stock")}
                  <strong>{current.stock}</strong>
                </div>
                <div>
                  {t("round")}
                  <strong>{current.round}/5</strong>
                </div>
              </div>
              {!current.completed ? (
                <form onSubmit={next}>
                  <Field label={t("produceQuantity")}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={quantity}
                      required
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </Field>
                  <Field label={t("sellingPrice")}>
                    <input
                      type="number"
                      min={1}
                      max={100000}
                      value={price}
                      required
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </Field>
                  <p>
                    {t("simulationCostNote")}{" "}
                    <Money value={scenarios[current.scenario].cost} />
                  </p>
                  <button className="btn primary" disabled={busy}>
                    {t("playRound")}
                  </button>
                </form>
              ) : (
                <Notice>{t("simulationComplete")}</Notice>
              )}
              <div className="table-wrap">
                <table>
                  <caption>{t("decisionResults")}</caption>
                  <thead>
                    <tr>
                      {["round", "event", "sold", "cost", "revenue"].map(
                        (k) => (
                          <th key={k}>{t(k)}</th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((r) => (
                      <tr key={r.round}>
                        <td>{r.round}</td>
                        <td>{t("event_" + r.event)}</td>
                        <td>{r.sold}</td>
                        <td>
                          <Money value={r.cost} />
                        </td>
                        <td>
                          <Money value={r.revenue} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>{t("simulationExplain")}</p>
              {current.completed && (
                <p>
                  {t("simulationReflection", {
                    profit: current.cash - scenarios[current.scenario].capital,
                  })}
                </p>
              )}
            </>
          ) : (
            <p>{t("chooseScenario")}</p>
          )}
        </section>
      </div>
    </>
  );
}
