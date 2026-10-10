import { useState, useEffect, useRef } from "react";
import { useSession } from "../store/useSession";
import { cloud } from "../lib/cloud";
import type { Message } from "../types";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Send, Sparkles, ArrowRight, Bookmark, Check } from "lucide-react";
import { useApp } from "../store/useApp";
import { askRobert } from "../lib/ai";
import { Money, PageTitle, Notice } from "../components/UI";
import Robert from "../components/Robert";
import type { Plan } from "../types";
import { chatSchema } from "../lib/validation";
import { mentorFallback } from "../lib/mentorFallback";
import { useCapabilities } from "../hooks/useCapabilities";
export default function Mentor() {
  const { t } = useTranslation();
  const s = useApp();
  const navigate = useNavigate();
  const capabilities = useCapabilities();
  const session=useSession();
  const [mode,setMode]=useState("idea");
  const [conversation,setConversation]=useState<string|null>(null);
  const [accountMessages,setAccountMessages]=useState<Message[]>([]);
  const [projects,setProjects]=useState<{id:string;title:string;stage:number}[]>([]);
  const [projectId,setProjectId]=useState("");
  const controller=useRef<AbortController|null>(null);
  const messages=session.profile?accountMessages:s.messages;
  useEffect(()=>{controller.current?.abort();setAccountMessages([]);setConversation(null);setProjects([]);setProjectId("");if(session.profile){cloud<{id:string|null;messages:Message[]}>("/api/conversation").then(r=>{setConversation(r.id);setAccountMessages(r.messages);}).catch(()=>{});cloud<{data:typeof projects}>(`/api/data?table=projects${session.organization?'&organization_id='+session.organization:''}`).then(r=>setProjects(r.data)).catch(()=>{});}return()=>controller.current?.abort();},[session.profile?.id,session.organization]);
  function addMessage(message:Message){if(session.profile)setAccountMessages(rows=>[...rows,message].slice(-40));else s.addMessage(message);}
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [stream, setStream] = useState("");
  const [error, setError] = useState(false);
  async function send(text: string) {
    if (busy || text.trim().length < 2) return;
    if (!chatSchema.safeParse({ text, language: s.language }).success) {
      setError(true);
      return;
    }
    setError(false);
    setBusy(true);
    setInput("");
    addMessage({ id: crypto.randomUUID(), role: "user", text });
    if(!session.profile)s.award("idea");
    controller.current=new AbortController();
    let answer;
    try {
      let conversationId=conversation;
      if(session.profile){const r=await cloud<{id:string}>("/api/conversation","POST",{id:conversation,text});conversationId=r.id;setConversation(r.id);}
      answer = await askRobert(
        text,
        s.language,
        setStream,
        messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
        {mode,ageGroup:["8–10","11–13","14–16"].includes(s.profile?.age||"")?s.profile!.age:"11–13",conversationId:conversationId||undefined,projectId:projectId||undefined,organizationId:session.organization||undefined,stage:projects.find(p=>p.id===projectId)?.stage},
        controller.current.signal,
      );
    } catch {
      if(controller.current.signal.aborted){setStream("");setBusy(false);return;}
      answer = mentorFallback(text, t);
    }
    addMessage({ id: crypto.randomUUID(), role: "assistant", ...answer });
    setStream("");
    setBusy(false);
  }
  function transfer(plan: Plan, to: string) {
    s.savePlan(plan);
    s.setCalculation(plan);
    if (to === "/store")
      s.setDraft({
        ...s.draft,
        status: "draft",
        products: [
          ...s.draft.products,
          {
            id: crypto.randomUUID(),
            name: plan.product,
            price: plan.price,
            description: "",
            available: true,
          },
        ].slice(0, 10),
      });
    navigate(to);
  }
  return (
    <>
      <PageTitle title="mentorTitle" subtitle="mentorSub" />
      <div className="page-tools"><label className="field"><span>{t("mentorMode")}</span><select value={mode} disabled={busy} onChange={e=>setMode(e.target.value)}>{["idea","plan","concept","calculation","mistake","pitch","reflection"].map(m=><option key={m} value={m}>{t("mentorMode_"+m)}</option>)}</select></label>{session.profile&&<label className="field"><span>{t("project")}</span><select value={projectId} disabled={busy} onChange={e=>setProjectId(e.target.value)}><option value="">{t("chooseProject")}</option>{projects.map(p=><option value={p.id} key={p.id}>{p.title}</option>)}</select></label>}{busy&&<button className="btn secondary" onClick={()=>controller.current?.abort()}>{t("cancelRequest")}</button>}</div>
      {!capabilities.ai && <Notice>{t("mentorOfflineNotice")}</Notice>}
      {error && <Notice>{t("privacyText")}</Notice>}
      <div className="mentor-layout">
        <section className="chat-card card">
          <div className="chat-header">
            <div className="robert-avatar">
              <Robert />
            </div>
            <div>
              <h2>{t("ai")}</h2>
              <small>{t("mentorSub")}</small>
            </div>
            <span className="pill">
              {t(capabilities.ai ? "online" : "offline")}
            </span>
          </div>
          <div className="chat-messages" aria-live="polite">
            <div className="message assistant">
              <span className="message-avatar">✦</span>
              <div className="message-body">{t("mentorWelcome")}</div>
            </div>
            {messages.map((m) => (
              <div key={m.id} className={`message ${m.role}`}>
                <span className="message-avatar">
                  {m.role === "user" ? s.profile?.avatar : "✦"}
                </span>
                <div className="message-body">
                  {m.role === "assistant" && (
                    <span
                      className={`response-label ${m.fallback ? "fallback" : ""}`}
                    >
                      {t(m.fallback ? "offline" : "online")}
                    </span>
                  )}
                  <p>{m.text}</p>
                  {m.plan && (
                    <div className="plan-card">
                      <strong>{m.plan.product}</strong>
                      <div>
                        <span>{t("unitCost")}</span>
                        <Money value={m.plan.unit_cost} />
                      </div>
                      <div>
                        <span>{t("sellingPrice")}</span>
                        <strong>
                          <Money value={m.plan.price} />
                        </strong>
                      </div>
                      <p className="small muted">{t("estimate")}</p>
                      <div className="plan-actions">
                        <button
                          className="btn secondary"
                          onClick={() => s.savePlan(m.plan!)}
                        >
                          {s.plans.some(
                            (p) => JSON.stringify(p) === JSON.stringify(m.plan),
                          ) ? (
                            <Check size={16} />
                          ) : (
                            <Bookmark size={16} />
                          )}{" "}
                          {t("savePlan")}
                        </button>
                        <button
                          className="btn primary"
                          onClick={() => transfer(m.plan!, "/calculator")}
                        >
                          {t("toCalculator")}
                          <ArrowRight size={16} />
                        </button>
                        <button
                          className="btn text"
                          onClick={() => transfer(m.plan!, "/store")}
                        >
                          {t("toStore")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="message assistant">
                <span className="message-avatar">✦</span>
                <div className="message-body">
                  <span className="typing">{stream || t("thinking")}</span>
                </div>
              </div>
            )}
          </div>
          <div className="suggested-prompts">
            {[1, 2, 3, 4].map((i) => (
              <button
                disabled={busy}
                onClick={() => send(t(`prompt${i}`))}
                key={i}
              >
                {t(`prompt${i}`)}
              </button>
            ))}
          </div>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              maxLength={1200}
              aria-label={t("message")}
              placeholder={t("message")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
            />
            <button
              aria-label={t("send")}
              className="send-button"
              disabled={busy || input.trim().length < 2}
            >
              <Send size={20} />
            </button>
          </form>
        </section>
        <aside className="mentor-aside">
          <div className="mentor-poster">
            <Robert expression={busy ? "thinking" : "happy"} />
            <h3>{t("slogan")}</h3>
            <Sparkles size={26} />
          </div>
          <Notice>{t("privacyText")}</Notice>
          {s.plans.length > 0 && (
            <section className="card saved-plans">
              <h3>{t("savedPlans")}</h3>
              {s.plans.map((p, i) => (
                <button
                  className="saved-plan"
                  key={i}
                  onClick={() => transfer(p, "/calculator")}
                >
                  <Bookmark size={16} />
                  {p.product}
                  <ArrowRight size={16} />
                </button>
              ))}
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
