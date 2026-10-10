import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cloud, csv, download } from "../lib/cloud";
import { useSession } from "../store/useSession";
import { resourceForms, displayColumns } from "../domain/resourceForms";
import { Field, Notice } from "./UI";
type Row = Record<string, unknown>;
export default function ResourceTable({
  table,
  editable = true,
  creatable = true,
}: {
  table: string;
  editable?: boolean;
  creatable?: boolean;
}) {
  const { t } = useTranslation();
  const session = useSession();
  const [rows, setRows] = useState<Row[]>([]);
  const [refs, setRefs] = useState<Record<string, Row[]>>({});
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState("");
  const [draft, setDraft] = useState<Row | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [saved, setSaved] = useState(false);
  const fields = resourceForms[table] || [];
  const columns = displayColumns[table] || ["id", "created_at"];
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.toLowerCase()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    setRows([]);
    setDraft(null);
    setError("");
    setSaved(false);
    setLoading(true);
    let filter = "";
    if (
      session.organization &&
      [
        "groups",
        "organization_members",
        "projects",
        "invitations",
        "audit_logs",
      ].includes(table)
    )
      filter = `&organization_id=${session.organization}`;
    cloud<{ data: Row[]; count: number }>(
      `/api/data?table=${table}&page=${page}${filter}`,
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
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    for (const ref of new Set(
      fields.map((f) => f.reference).filter((r): r is string => !!r),
    )) {
      cloud<{ data: Row[] }>(
        `/api/data?table=${ref}${session.organization && ["groups", "organization_members"].includes(ref) ? "&organization_id=" + session.organization : ""}`,
        "GET",
        undefined,
        controller.signal,
      )
        .then((r) => setRefs((s) => ({ ...s, [ref]: r.data })))
        .catch(() => {});
    }
    return () => controller.abort();
  }, [table, page, session.organization, reload, session.profile?.id]);
  const visible = rows
    .filter((row) =>
      columns.some((k) =>
        String(row[k] ?? "")
          .toLowerCase()
          .includes(debounced),
      ),
    )
    .sort((a, b) =>
      sort ? String(a[sort] ?? "").localeCompare(String(b[sort] ?? "")) : 0,
    );
  function create() {
    setDraft(
      Object.fromEntries(
        fields.map((f) => [
          f.key,
          f.default ??
            (f.type === "checkbox"
              ? false
              : f.type === "number"
                ? 0
                : f.options?.[0] || ""),
        ]),
      ),
    );
    setSaved(false);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = Object.fromEntries(
        fields.map((field) => {
          let value = draft[field.key];
          if (field.type === "number") value = Number(value);
          if (field.type === "datetime-local")
            value = value ? new Date(String(value)).toISOString() : null;
          if (field.reference && !value) value = null;
          return [field.key, value];
        }),
      );
      const id = draft.id || draft.key;
      await cloud("/api/data?table=" + table, id ? "PATCH" : "POST", {
        id,
        data,
      });
      setDraft(null);
      setReload((r) => r + 1);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "server_error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card resource-section">
      <div className="section-heading">
        <h2>{t("resource_" + table)}</h2>
        <div className="page-tools">
          {creatable && fields.length > 0 && (
            <button className="btn primary" onClick={create}>
              {t("create")}
            </button>
          )}
          <button
            className="btn secondary"
            disabled={!rows.length}
            onClick={() =>
              download(
                table + ".csv",
                csv(
                  rows.map((row) =>
                    Object.fromEntries(columns.map((k) => [k, row[k]])),
                  ),
                ),
                "text/csv;charset=utf-8",
              )
            }
          >
            {t("exportPage")}
          </button>
        </div>
      </div>
      <Field label={t("searchPage")}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} />
      </Field>
      {error && (
        <Notice>
          {t("error_" + error, { defaultValue: t("serverError") })}
        </Notice>
      )}
      {saved && <Notice>{t("saved")}</Notice>}
      {loading ? (
        <div className="skeleton" aria-label={t("loading")} />
      ) : !rows.length ? (
        <p>{t("emptyRecords")}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <caption>
              {t("resource_" + table)} · {count}
            </caption>
            <thead>
              <tr>
                {columns.map((key) => (
                  <th key={key}>
                    <button onClick={() => setSort(key)}>
                      {t("field_" + key, { defaultValue: t(key) })}
                    </button>
                  </th>
                ))}
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row, i) => (
                <tr key={String(row.id || row.key || row.user_id || i)}>
                  {columns.map((key) => (
                    <td key={key}>
                      {typeof row[key] === "boolean"
                        ? t(row[key] ? "yes" : "no")
                        : String(row[key] ?? "—")}
                    </td>
                  ))}
                  <td>
                    {editable && fields.length > 0 && (
                      <button
                        className="btn secondary"
                        onClick={() => setDraft(row)}
                      >
                        {t("edit")}
                      </button>
                    )}
                    {table === "notifications" && (
                      <button
                        className="btn secondary"
                        onClick={async () => {
                          try {
                            await cloud(
                              "/api/data?table=notifications",
                              "PATCH",
                              {
                                id: row.id,
                                data: { read_at: new Date().toISOString() },
                              },
                            );
                            setReload((r) => r + 1);
                          } catch {
                            setError("server_error");
                          }
                        }}
                      >
                        {t("markRead")}
                      </button>
                    )}
                    {table === "invitations" && !row.revoked_at && (
                      <button
                        className="btn secondary"
                        onClick={async () => {
                          if (!confirm(t("revokeConfirm"))) return;
                          try {
                            await cloud("/api/invitations", "POST", {
                              action: "revoke",
                              id: row.id,
                            });
                            setReload((r) => r + 1);
                          } catch {
                            setError("server_error");
                          }
                        }}
                      >
                        {t("revoke")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="page-tools">
        <button
          className="btn secondary"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          {t("previous")}
        </button>
        <span>{page + 1}</span>
        <button
          className="btn secondary"
          disabled={(page + 1) * 25 >= count}
          onClick={() => setPage(page + 1)}
        >
          {t("next")}
        </button>
      </div>
      {draft && (
        <form className="resource-editor" onSubmit={save}>
          <h3>{t(draft.id ? "edit" : "create")}</h3>
          {fields.map((field) => (
            <Field
              key={field.key}
              label={t("field_" + field.key, { defaultValue: t(field.key) })}
            >
              {field.options ? (
                <select
                  value={String(draft[field.key] ?? "")}
                  onChange={(e) =>
                    setDraft({ ...draft, [field.key]: e.target.value })
                  }
                >
                  {field.options.map((o) => (
                    <option key={o} value={o}>
                      {t("value_" + o, { defaultValue: o })}
                    </option>
                  ))}
                </select>
              ) : field.reference ? (
                <select
                  required={field.required}
                  value={String(draft[field.key] ?? "")}
                  onChange={(e) =>
                    setDraft({ ...draft, [field.key]: e.target.value })
                  }
                >
                  <option value="">{t("choose")}</option>
                  {(refs[field.reference] || []).map((r, i) => (
                    <option
                      key={String(r.id || r.user_id || i)}
                      value={String(r.id || r.user_id)}
                    >
                      {String(
                        r.title ||
                          r.name ||
                          r.alias ||
                          r.title_uz ||
                          r.subject ||
                          r.body ||
                          r.user_id ||
                          r.id,
                      )}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  required={field.required}
                  maxLength={4000}
                  value={String(draft[field.key] ?? "")}
                  onChange={(e) =>
                    setDraft({ ...draft, [field.key]: e.target.value })
                  }
                />
              ) : field.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={!!draft[field.key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [field.key]: e.target.checked })
                  }
                />
              ) : (
                <input
                  type={field.type || "text"}
                  required={field.required}
                  maxLength={160}
                  min={0}
                  max={1e9}
                  value={String(draft[field.key] ?? "")}
                  onChange={(e) =>
                    setDraft({ ...draft, [field.key]: e.target.value })
                  }
                />
              )}
            </Field>
          ))}
          <div className="plan-actions">
            <button className="btn primary" disabled={busy}>
              {t(busy ? "loading" : "save")}
            </button>
            <button
              className="btn secondary"
              type="button"
              onClick={() => {
                if (confirm(t("discardChanges"))) setDraft(null);
              }}
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
