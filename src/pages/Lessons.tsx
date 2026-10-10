import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { curriculum, ageChallenge, type Lesson } from "../content/curriculum";
import { useApp } from "../store/useApp";
import { usePractice } from "../store/usePractice";
import { useSession } from "../store/useSession";
import { cloud } from "../lib/cloud";
import { Field, Notice } from "../components/UI";
export default function Lessons() {
  const { t } = useTranslation();
  const language = useApp((s) => s.language);
  const age = useApp((s) => s.profile?.age || "11–13");
  const session = useSession();
  const guest = usePractice();
  const [lessons, setLessons] = useState<Lesson[]>(curriculum);
  const [selected, setSelected] = useState(curriculum[0].id);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{
    correct: boolean;
    explanation: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!session.profile) {
      setLessons(curriculum);
      return;
    }
    setLessons([]);
    cloud<{ data: Lesson[] }>("/api/data?table=lessons")
      .then((r) => {
        setLessons(r.data.filter((l) => l.status === "published"));
        setSelected(r.data[0]?.id || "");
      })
      .catch((e) => setError(e.message));
  }, [session.profile?.id]);
  const lesson = lessons.find((l) => l.id === selected);
  const challenge = lesson
    ? ageChallenge(lesson, session.profile ? "11–13" : age, language)
    : null;
  return (
    <>
      <h1>{t("lessons")}</h1>
      <p>{t("lessonIntro")}</p>
      {error && <Notice>{t("serverError")}</Notice>}
      <div className="workshop-layout">
        <aside className="card">
          {lessons.map((l) => (
            <button
              className="saved-plan"
              key={l.id}
              onClick={() => {
                setSelected(l.id);
                setAnswer("");
                setResult(null);
              }}
            >
              {l[`title_${language}`]}
              {!session.profile && guest.answers[l.id] ? " ✓" : ""}
            </button>
          ))}
        </aside>
        <section className="card">
          {lesson && challenge ? (
            <>
              <h2>{lesson[`title_${language}`]}</h2>
              <p>{lesson[`body_${language}`]}</p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError("");
                  try {
                    let response;
                    if (session.profile)
                      response = await cloud<{
                        correct: boolean;
                        explanation: string;
                      }>("/api/lessons", "POST", {
                        id: lesson.id,
                        answer,
                        language,
                      });
                    else {
                      response = {
                        correct:
                          answer.trim().toLowerCase().replaceAll(" ", "") ===
                          challenge.answer.toLowerCase().replaceAll(" ", ""),
                        explanation: challenge.explanation,
                      };
                      guest.answer(lesson.id, response.correct);
                    }
                    setResult(response);
                  } catch {
                    setError("server_error");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Field label={challenge.question}>
                  <input
                    required
                    maxLength={200}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                </Field>
                <button className="btn primary" disabled={busy}>
                  {t("checkAnswer")}
                </button>
              </form>
              {result && (
                <Notice>
                  <strong>
                    {t(result.correct ? "correctAnswer" : "tryAgain")}
                  </strong>
                  <p>{result.explanation}</p>
                </Notice>
              )}
            </>
          ) : (
            <p>{t("emptyRecords")}</p>
          )}
        </section>
      </div>
    </>
  );
}
