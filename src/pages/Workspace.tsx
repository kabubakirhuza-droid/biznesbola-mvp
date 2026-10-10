import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "../store/useSession";
import { useWorkshop } from "../store/useWorkshop";
import { cloud } from "../lib/cloud";
import { Field, Notice } from "../components/UI";
import ResourceTable from "../components/ResourceTable";
import Showcase from "./Showcase";
type Learner = { id: string; alias: string };
export default function Workspace({ admin = false }: { admin?: boolean }) {
  const { t } = useTranslation();
  const session = useSession();
  const guest = useWorkshop();
  const [tab, setTab] = useState("overview");
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [age, setAge] = useState("11–13");
  const [learners, setLearners] = useState<Learner[]>([]);
  const [learner, setLearner] = useState("");
  const [password, setPassword] = useState("");
  const [login, setLogin] = useState("");
  const [invite, setInvite] = useState("");
  const [token, setToken] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [adminData, setAdminData] = useState<{
    counts: Record<string, number>;
    aiConfigured: boolean;
    model: string | null;
  } | null>(null);
  useEffect(() => {
    setError("");
    setTab("overview");
    if (!session.profile) return;
    if (admin) {
      cloud<typeof adminData>("/api/admin")
        .then(setAdminData)
        .catch((e) => setError(e.message));
    } else
      cloud<{ data: Learner[] }>("/api/data?table=learner_profiles")
        .then((r) => setLearners(r.data))
        .catch((e) => setError(e.message));
  }, [session.profile?.id, admin, session.organization]);
  async function action(fn: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setDone(false);
    try {
      await fn();
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "server_error");
    } finally {
      setBusy(false);
    }
  }
  if (!session.loaded)
    return <div className="skeleton" aria-label={t("loading")} />;
  if (!session.configured)
    return (
      <main className="public-shell">
        <h1>{t(admin ? "admin" : "workspace")}</h1>
        <Notice>{t("cloudUnavailable")}</Notice>
        <Link className="btn primary" to="/start">
          {t("guestStart")}
        </Link>
      </main>
    );
  if (!session.profile)
    return (
      <main className="public-shell">
        <Notice>{t("loginRequired")}</Notice>
        <Link to="/account">{t("login")}</Link>
      </main>
    );
  if (admin && session.profile.role !== "PLATFORM_ADMIN")
    return (
      <main className="public-shell">
        <h1>{t("forbidden")}</h1>
        <p>{t("adminDenied")}</p>
        <Link to="/">{t("home")}</Link>
      </main>
    );
  const orgAdmin = session.memberships.some(
    (m) =>
      m.organization_id === session.organization &&
      ["ORG_OWNER", "ORG_ADMIN"].includes(m.role),
  );
  const teacher = session.memberships.some(
    (m) =>
      m.organization_id === session.organization &&
      ["TEACHER", "ORG_OWNER", "ORG_ADMIN"].includes(m.role),
  );
  const tabs = admin
    ? [
        "overview", "showcase",
        "profiles",
        "organizations",
        "lessons",
        "support_tickets",
        "support_messages",
        "moderation_reports",
        "feature_flags",
        "ai_usage",
        "audit_logs",
      ]
    : [
        "overview", "showcase",
        ...(session.profile.role === "PARENT" ? ["learner_profiles"] : []),
        ...(teacher
          ? ["groups", "assignments", "submissions", "feedback"]
          : []),
        ...(orgAdmin
          ? ["organization_members", "invitations", "audit_logs"]
          : []),
        "projects",
        "savings_goals",
        "notifications",
        "support_tickets",
        "support_messages",
        "user_achievements",
      ];
  return (
    <div className={`adult-shell ${admin ? "admin-shell" : ""}`}>
      <header className="landing-nav">
        <Link className="brand" to="/">
          BiznesBola
        </Link>
        <nav>
          <Link to="/account">{session.profile.alias}</Link>
          <Link to="/projects">{t("projects")}</Link>
          {session.profile.role === "PLATFORM_ADMIN" && (
            <Link to={admin ? "/workspace" : "/admin"}>
              {t(admin ? "workspace" : "admin")}
            </Link>
          )}
        </nav>
      </header>
      <div className="adult-layout">
        <aside className="card">
          <h2>{t(admin ? "admin" : "workspace")}</h2>
          {!admin && (
            <Field label={t("organization")}>
              <select
                value={session.organization}
                onChange={(e) => session.selectOrganization(e.target.value)}
              >
                <option value="">{t("personalSpace")}</option>
                {session.memberships.map((m) => (
                  <option key={m.organization_id} value={m.organization_id}>
                    {m.organizations.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <nav>
            {tabs.map((k) => (
              <button
                key={k}
                className={`saved-plan ${tab === k ? "selected" : ""}`}
                onClick={() => setTab(k)}
              >
                {t(k === "overview" ? "overview" : "resource_" + k)}
              </button>
            ))}
          </nav>
        </aside>
        <main>
          {error && (
            <Notice>
              {t("error_" + error, { defaultValue: t("serverError") })}
            </Notice>
          )}
          {done && <Notice>{t("saved")}</Notice>}
          {tab === "overview" ? (
            <>
              <h1>{t(admin ? "admin" : "workspace")}</h1>
              {admin ? (
                <>
                  <div className="path-grid">
                    {Object.entries(adminData?.counts || {}).map(
                      ([key, count]) => (
                        <article className="card" key={key}>
                          <h3>{t("resource_" + key)}</h3>
                          <strong className="metric">{count}</strong>
                        </article>
                      ),
                    )}
                  </div>
                  <Notice>
                    {t(adminData?.aiConfigured ? "online" : "offline")} ·{" "}
                    {adminData?.model || t("modelNotConfigured")}
                  </Notice>
                  <Notice>{t("adminPrivacy")}</Notice>
                  <AdminRoles />
                </>
              ) : (
                <>
                  <section className="card">
                    <h2>{t("createOrganization")}</h2>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        action(async () => {
                          await cloud("/api/data?rpc=1", "POST", {
                            action: "organization",
                            name,
                          });
                          setName("");
                          await session.refresh();
                        });
                      }}
                    >
                      <Field label={t("organizationName")}>
                        <input
                          required
                          minLength={2}
                          maxLength={100}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </Field>
                      <button
                        className="btn primary"
                        disabled={busy || session.profile.role === "STUDENT"}
                      >
                        {t("create")}
                      </button>
                    </form>
                  </section>
                  {session.profile.role === "PARENT" && (
                    <section className="card">
                      <h2>{t("createLearner")}</h2>
                      <Notice>{t("guardianLimit")}</Notice>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          action(async () => {
                            await cloud("/api/data?rpc=1", "POST", {
                              action: "learner",
                              alias,
                              age,
                              language: session.profile?.language || "uz",
                            });
                            setAlias("");
                            const r = await cloud<{ data: Learner[] }>(
                              "/api/data?table=learner_profiles",
                            );
                            setLearners(r.data);
                          });
                        }}
                      >
                        <Field label={t("alias")}>
                          <input
                            required
                            minLength={2}
                            maxLength={60}
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                          />
                        </Field>
                        <Field label={t("ageGroup")}>
                          <select
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                          >
                            {["8–10", "11–13", "14–16"].map((a) => (
                              <option key={a}>{a}</option>
                            ))}
                          </select>
                        </Field>
                        <button className="btn primary" disabled={busy}>
                          {t("create")}
                        </button>
                      </form>
                      <h3>{t("learnerAccess")}</h3>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          action(async () => {
                            const r = await cloud<{ login: string }>(
                              "/api/adult",
                              "POST",
                              { learner_id: learner, password },
                            );
                            setLogin(r.login);
                            setPassword("");
                          });
                        }}
                      >
                        <Field label={t("learner")}>
                          <select
                            required
                            value={learner}
                            onChange={(e) => setLearner(e.target.value)}
                          >
                            <option value="">{t("choose")}</option>
                            {learners.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.alias}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label={t("password")}>
                          <input
                            type="password"
                            required
                            autoComplete="new-password"
                            minLength={12}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </Field>
                        <button className="btn secondary" disabled={busy}>
                          {t("issueAccess")}
                        </button>
                      </form>
                      {login && (
                        <Notice>
                          {t("learnerLogin")}: {login}
                        </Notice>
                      )}
                    </section>
                  )}
                  {orgAdmin && (
                    <section className="card">
                      <h2>{t("createInvitation")}</h2>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          action(async () => {
                            const r = await cloud<{ token: string }>(
                              "/api/invitations",
                              "POST",
                              {
                                action: "create",
                                organization_id: session.organization,
                                role,
                              },
                            );
                            setToken(r.token);
                          });
                        }}
                      >
                        <Field label={t("role")}>
                          <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                          >
                            {["TEACHER", "STUDENT"].map((r) => (
                              <option value={r} key={r}>
                                {t("role_" + r)}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <button className="btn secondary" disabled={busy}>
                          {t("createInvitation")}
                        </button>
                      </form>
                      {token && (
                        <Notice>
                          {t("inviteExpires")}: <code>{token}</code>
                        </Notice>
                      )}
                      <GroupMembership />
                      <MemberRoles />
                    </section>
                  )}
                  <section className="card">
                    <h2>{t("acceptInvitation")}</h2>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        action(async () => {
                          await cloud("/api/invitations", "POST", {
                            action: "accept",
                            token: invite,
                          });
                          setInvite("");
                          await session.refresh();
                        });
                      }}
                    >
                      <Field label={t("invitationCode")}>
                        <input
                          required
                          maxLength={64}
                          minLength={64}
                          value={invite}
                          onChange={(e) => setInvite(e.target.value.trim())}
                        />
                      </Field>
                      <button className="btn secondary" disabled={busy}>
                        {t("join")}
                      </button>
                    </form>
                  </section>
                  {guest.projects.filter((p) => !guest.imported.includes(p.id))
                    .length > 0 && (
                    <section className="card">
                      <h2>{t("guestImport")}</h2>
                      <Notice>{t("importScope")}</Notice>
                      {guest.projects
                        .filter((p) => !guest.imported.includes(p.id))
                        .map((p) => (
                          <div className="saved-plan" key={p.id}>
                            <strong>{p.title}</strong>
                            <p>
                              {t("importDetails", {
                                tasks: guest.tasks[p.id]?.length || 0,
                              })}
                            </p>
                            <button
                              className="btn secondary"
                              disabled={busy}
                              onClick={() => {
                                if (!confirm(t("importConfirm"))) return;
                                action(async () => {
                                  await cloud("/api/import", "POST", {
                                    id: p.id,
                                    title: p.title,
                                    description: p.description,
                                    category: p.category,
                                    audience: p.audience,
                                    goal: p.goal,
                                    tasks: (guest.tasks[p.id] || []).map(
                                      (t) => t.title,
                                    ),
                                  });
                                  guest.markImported(p.id);
                                });
                              }}
                            >
                              {t("importProject")}
                            </button>
                          </div>
                        ))}
                    </section>
                  )}
                </>
              )}
            </>
          ) : tab === "showcase" ? <Showcase moderation={admin}/> : (
            <ResourceTable
              key={tab + session.organization}
              table={tab}
              editable={!!resourceFormsFor(tab, admin, teacher)}
              creatable={[
                "groups",
                "assignments",
                "submissions",
                "feedback",
                "support_tickets",
                "support_messages",
                "lessons",
                "feature_flags",
                "savings_goals",
              ].includes(tab)}
            />
          )}
          <footer className="footer">
            <Link to="/privacy">{t("privacy")}</Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
function resourceFormsFor(table: string, admin: boolean, teacher: boolean) {
  return (
    admin ||
    ["learner_profiles", "savings_goals"].includes(table) ||
    (teacher && ["groups", "assignments", "submissions"].includes(table))
  );
}
function AdminRoles() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<{ id: string; alias: string }[]>([]);
  const [id, setId] = useState("");
  const [role, setRole] = useState("PARENT");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    cloud<{ data: typeof users }>("/api/data?table=profiles")
      .then((r) => setUsers(r.data))
      .catch(() => setError("server_error"));
  }, []);
  return (
    <section className="card">
      <h2>{t("manageRoles")}</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await cloud("/api/admin", "POST", { id, role, reason });
            setReason("");
          } catch (e) {
            setError(e instanceof Error ? e.message : "server_error");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label={t("user")}>
          <select required value={id} onChange={(e) => setId(e.target.value)}>
            <option value="">{t("choose")}</option>
            {users.map((u) => (
              <option value={u.id} key={u.id}>
                {u.alias}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("role")}>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {["PARENT", "STUDENT", "PLATFORM_ADMIN"].map((r) => (
              <option value={r} key={r}>
                {t("role_" + r)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("reason")}>
          <input
            required
            minLength={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <button className="btn secondary" disabled={busy}>
          {t("save")}
        </button>
      </form>
      {error && (
        <Notice>
          {t("error_" + error, { defaultValue: t("serverError") })}
        </Notice>
      )}
    </section>
  );
}
function GroupMembership() {
  return <MembershipForm kind="group_learner" />;
}
function MemberRoles() {
  return <MembershipForm kind="member_role" />;
}
function MembershipForm({ kind }: { kind: "group_learner" | "member_role" }) {
  const { t } = useTranslation();
  const session = useSession();
  const [groups, setGroups] = useState<Record<string, unknown>[]>([]);
  const [people, setPeople] = useState<Record<string, unknown>[]>([]);
  const [g, setG] = useState("");
  const [p, setP] = useState("");
  const [role, setRole] = useState("TEACHER");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const first = kind === "group_learner" ? "groups" : "organizations",
      second =
        kind === "group_learner" ? "learner_profiles" : "organization_members";
    Promise.all([
      cloud<{ data: Record<string, unknown>[] }>(`/api/data?table=${first}`),
      cloud<{ data: Record<string, unknown>[] }>(
        `/api/data?table=${second}${kind === "member_role" ? "&organization_id=" + session.organization : ""}`,
      ),
    ])
      .then(([a, b]) => {
        setGroups(a.data);
        setPeople(b.data);
      })
      .catch(() => setError("server_error"));
  }, [session.organization, kind]);
  return (
    <form
      className="project-subsection"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await cloud(
            "/api/data?rpc=1",
            "POST",
            kind === "group_learner"
              ? { action: kind, group_id: g, learner_id: p }
              : {
                  action: kind,
                  organization_id: session.organization,
                  user_id: p,
                  role,
                },
          );
          setError("");
        } catch {
          setError("server_error");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3>{t(kind)}</h3>
      {kind === "group_learner" && (
        <Field label={t("group")}>
          <select required value={g} onChange={(e) => setG(e.target.value)}>
            <option value="">{t("choose")}</option>
            {groups.map((x) => (
              <option key={String(x.id)} value={String(x.id)}>
                {String(x.name)}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label={t("learner")}>
        <select required value={p} onChange={(e) => setP(e.target.value)}>
          <option value="">{t("choose")}</option>
          {people.map((x) => (
            <option
              key={String(x.id || x.user_id)}
              value={String(x.id || x.user_id)}
            >
              {String(x.alias || x.user_id)}
            </option>
          ))}
        </select>
      </Field>
      {kind === "member_role" && (
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {["TEACHER", "STUDENT", "ORG_ADMIN"].map((r) => (
            <option value={r} key={r}>
              {t("role_" + r)}
            </option>
          ))}
        </select>
      )}
      <button className="btn secondary" disabled={busy}>
        {t("save")}
      </button>
      {error && <Notice>{t("serverError")}</Notice>}
    </form>
  );
}
