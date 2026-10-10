import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useSession } from "../store/useSession";
import { useWorkshop } from "../store/useWorkshop";
import {
  blankProject,
  canAdvance,
  demandSummary,
  report,
  type Project,
  type Demand,
  type Task,
} from "../domain/projects";
import { cloud, download } from "../lib/cloud";
import { Field, Notice, Money, Progress } from "../components/UI";
export default function Projects() {
  const { t } = useTranslation();
  const session = useSession();
  const guest = useWorkshop();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState<Project | null>(null);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [task, setTask] = useState("");
  const [due, setDue] = useState("");
  const [interest, setInterest] = useState(true);
  const [kind, setKind] = useState<Demand["kind"]>("opinion");
  const [price, setPrice] = useState("0");
  const [comment, setComment] = useState("");
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setProjects([]);
    setBusy(true);
    if (!session.profile) {
      setProjects(guest.projects);
      setCount(guest.projects.length);
      setBusy(false);
      return;
    }
    const query = session.organization
      ? `&organization_id=${session.organization}`
      : "";
    cloud<{ data: Project[]; count: number }>(
      `/api/data?table=projects&page=${page}${query}`,
      "GET",
      undefined,
      controller.signal,
    )
      .then((r) => {
        if (!cancelled) {
          setProjects(r.data);
          setCount(r.count);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [session.profile?.id, session.organization, guest.projects, page]);
  useEffect(() => {
    if (!selected) return;
    const p = projects.find((x) => x.id === selected);
    setDraft(p || null);
    setSaved(false);
    setError("");
    if (!session.profile) {
      setDemands(guest.demands[selected] || []);
      setTasks(guest.tasks[selected] || []);
      return;
    }
    const controller = new AbortController();
    setDemands([]);
    setTasks([]);
    Promise.all([
      cloud<{ data: Demand[] }>(
        `/api/data?table=demand_responses&project_id=${selected}`,
        "GET",
        undefined,
        controller.signal,
      ),
      cloud<{ data: Task[] }>(
        `/api/data?table=project_tasks&project_id=${selected}`,
        "GET",
        undefined,
        controller.signal,
      ),
    ])
      .then(([d, t]) => {
        setDemands(d.data);
        setTasks(t.data);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [selected, projects, session.profile?.id, guest.demands, guest.tasks]);
  const dirty =
    !!draft &&
    JSON.stringify(draft) !==
      JSON.stringify(projects.find((x) => x.id === draft.id));
  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [dirty]);
  async function save(p: Project) {
    setBusy(true);
    setError("");
    try {
      if (!session.profile) {
        guest.save(p);
      } else {
        const exists = projects.some((x) => x.id === p.id);
        const { id, revision, ...data } = p;
        const result = await cloud<{ data: Project }>(
          "/api/data?table=projects",
          exists ? "PATCH" : "POST",
          {
            id,
            revision,
            data: {
              ...data,
              organization_id: exists
                ? data.organization_id
                : session.organization || null,
            },
          },
        );
        setProjects((rows) =>
          exists
            ? rows.map((x) => (x.id === id ? result.data : x))
            : [result.data, ...rows],
        );
        setDraft(result.data);
        p = result.data;
      }
      setSelected(p.id);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "server_error");
    } finally {
      setBusy(false);
    }
  }
  async function create(category: string) {
    const p = blankProject(t("template_" + category), category);
    await save(p);
  }
  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    try {
      if (session.profile) {
        const r = await cloud<{ data: Task }>(
          "/api/data?table=project_tasks",
          "POST",
          {
            data: { project_id: draft.id, title: task, due_date: due || null },
          },
        );
        setTasks([...tasks, r.data]);
      } else
        guest.saveTask(draft.id, {
          id: crypto.randomUUID(),
          title: task,
          completed: false,
          due_date: due || null,
        });
      setTask("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "server_error");
    } finally {
      setBusy(false);
    }
  }
  async function addDemand(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    try {
      const data = {
        project_id: draft.id,
        kind,
        interested: interest,
        acceptable_price: +price,
        comment,
      };
      if (session.profile) {
        const r = await cloud<{ data: Demand }>(
          "/api/data?table=demand_responses",
          "POST",
          { data },
        );
        setDemands([...demands, r.data]);
      } else guest.addDemand(draft.id, { id: crypto.randomUUID(), ...data });
      setComment("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "server_error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <h1>{t("projects")}</h1>
          <p>{t("projectIntro")}</p>
        </div>
        <Link className="btn secondary" to="/practice">
          {t("practice")}
        </Link>
      </div>
      {!session.profile && <Notice>{t("guestLocal")}</Notice>}
      {error && (
        <Notice>
          {t("error_" + error, { defaultValue: t("serverError") })}
        </Notice>
      )}
      {saved && <Notice>{t("saved")}</Notice>}
      <div className="template-row">
        {["books", "cards", "craft", "eco", "fair", "own"].map((k) => (
          <button
            key={k}
            className="btn secondary"
            disabled={busy}
            onClick={() => create(k)}
          >
            {t("template_" + k)}
          </button>
        ))}
      </div>
      <div className="workshop-layout">
        <aside className="card">
          <h2>{t("yourProjects")}</h2>
          {busy && <p>{t("loading")}</p>}
          {!busy && !projects.length && <p>{t("noProjects")}</p>}
          {projects.map((p) => (
            <button
              key={p.id}
              className={`saved-plan ${selected === p.id ? "selected" : ""}`}
              onClick={() => {
                if (!dirty || confirm(t("discardChanges"))) {
                  setSelected(p.id);
                  guest.select(p.id);
                }
              }}
            >
              {p.title}
              <small>
                {t("stage" + p.stage)}
                {p.archived ? " · " + t("archived") : ""}
              </small>
            </button>
          ))}
          {session.profile && (
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
          )}
        </aside>
        {draft ? (
          <section className="card">
            <div className="section-heading">
              <h2>{draft.title}</h2>
              <span className="pill">{t(draft.mode)}</span>
            </div>
            <Progress value={((draft.stage + 1) / 8) * 100} />
            <h3>{t("stage" + draft.stage)}</h3>
            <p>{t("stageHelp" + draft.stage)}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save(draft);
              }}
            >
              <Field label={t("projectTitle")}>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                />
              </Field>
              {[
                "description",
                "audience",
                "goal",
                "notes",
                "results",
                "reflection",
              ].map((key) => (
                <Field key={key} label={t(key)}>
                  <textarea
                    maxLength={2000}
                    value={String(draft[key as keyof Project])}
                    onChange={(e) =>
                      setDraft({ ...draft, [key]: e.target.value })
                    }
                  />
                </Field>
              ))}
              <Field label={t("projectBudget")}>
                <input
                  type="number"
                  min={0}
                  max={1e9}
                  required
                  value={draft.budget}
                  onChange={(e) =>
                    setDraft({ ...draft, budget: +e.target.value })
                  }
                />
              </Field>
              <Field label={t("mode")}>
                <select
                  value={draft.mode}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      mode: e.target.value as Project["mode"],
                    })
                  }
                >
                  <option value="practice">{t("practice")}</option>
                  <option value="real">{t("real")}</option>
                </select>
              </Field>
              <div className="plan-actions">
                <button className="btn primary" disabled={busy}>
                  {t("save")}
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  disabled={
                    busy ||
                    draft.stage === 7 ||
                    !canAdvance(draft, demands, tasks)
                  }
                  onClick={() => save({ ...draft, stage: draft.stage + 1 })}
                >
                  {t("nextStage")}
                </button>
              </div>
            </form>
            <section className="project-subsection">
              <h3>{t("demandCheck")}</h3>
              <Notice>{t("anonymousDemand")}</Notice>
              <form onSubmit={addDemand}>
                <Field label={t("responseKind")}>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as Demand["kind"])}
                  >
                    {["opinion", "intent", "purchase"].map((k) => (
                      <option value={k} key={k}>
                        {t(k)}
                      </option>
                    ))}
                  </select>
                </Field>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={interest}
                    onChange={(e) => setInterest(e.target.checked)}
                  />
                  {t("interested")}
                </label>
                <Field label={t("acceptablePrice")}>
                  <input
                    type="number"
                    min={0}
                    max={1e9}
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </Field>
                <Field label={t("comment")}>
                  <input
                    maxLength={500}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </Field>
                <button disabled={busy} className="btn secondary">
                  {t("addResponse")}
                </button>
              </form>
              <p>{t("demandCounts", demandSummary(demands))}</p>
              {demands.map((d) => (
                <p key={d.id}>
                  {t(d.kind)} · {t(d.interested ? "yes" : "no")} ·{" "}
                  <Money value={d.acceptable_price} />
                </p>
              ))}
            </section>
            <section className="project-subsection">
              <h3>{t("tasks")}</h3>
              <form onSubmit={addTask}>
                <Field label={t("taskTitle")}>
                  <input
                    required
                    maxLength={160}
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                  />
                </Field>
                <Field label={t("dueDate")}>
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                  />
                </Field>
                <button className="btn secondary" disabled={busy}>
                  {t("addTask")}
                </button>
              </form>
              {tasks.map((item) => (
                <label className="checkline" key={item.id}>
                  <input
                    type="checkbox"
                    disabled={busy}
                    checked={item.completed}
                    onChange={async (e) => {
                      const completed = e.target.checked;
                      setBusy(true);
                      try {
                        if (session.profile) {
                          await cloud(
                            "/api/data?table=project_tasks",
                            "PATCH",
                            {
                              id: item.id,
                              data: {
                                project_id: draft.id,
                                title: item.title,
                                due_date: item.due_date,
                                completed,
                              },
                            },
                          );
                          setTasks(
                            tasks.map((x) =>
                              x.id === item.id ? { ...item, completed } : x,
                            ),
                          );
                        } else guest.saveTask(draft.id, { ...item, completed });
                      } catch {
                        setError("server_error");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                  {item.title} {item.due_date}
                </label>
              ))}
            </section>
            <div className="plan-actions">
              <Link className="btn secondary" to="/calculator">
                {t("calculator")}
              </Link>
              <button
                className="btn secondary"
                onClick={() =>
                  download(
                    "project-report.json",
                    JSON.stringify(report(draft, demands, tasks), null, 2),
                    "application/json",
                  )
                }
              >
                {t("exportReport")}
              </button>
              <button
                className="btn secondary"
                disabled={busy}
                onClick={() => save({ ...draft, archived: !draft.archived })}
              >
                {t(draft.archived ? "restore" : "archive")}
              </button>
              <button
                className="btn secondary"
                disabled={busy}
                onClick={async () => {
                  if (!confirm(t("deleteProjectConfirm"))) return;
                  setBusy(true);
                  try {
                    if (session.profile) {
                      await cloud("/api/data?table=projects", "DELETE", {
                        id: draft.id,
                      });
                      setProjects(projects.filter((x) => x.id !== draft.id));
                    } else guest.remove(draft.id);
                    setDraft(null);
                    setSelected("");
                  } catch {
                    setError("server_error");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t("delete")}
              </button>
            </div>
          </section>
        ) : (
          <section className="card">
            <h2>{t("chooseProject")}</h2>
            <p>{t("projectIntro")}</p>
          </section>
        )}
      </div>
    </>
  );
}
