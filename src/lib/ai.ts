import type { Message, Plan } from "../types";
import { planSchema } from "./validation";
export async function askRobert(
  text: string,
  language: "uz" | "ru",
  onText: (text: string) => void,
  history: Pick<Message, "role" | "text">[] = [],
  context: { mode?: string; ageGroup?: string; projectId?: string; conversationId?: string; organizationId?: string; stage?: number } = {},
  signal?: AbortSignal,
): Promise<Pick<Message, "text" | "plan" | "fallback">> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language, history, ...context }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(45000)]) : AbortSignal.timeout(45000),
  });
  if (
    !response.ok ||
    !response.body ||
    !response.headers.get("content-type")?.includes("application/x-ndjson")
  )
    throw new Error("Offline");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "",
    answer = "",
    plan: Plan | undefined;
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line) continue;
      const event = JSON.parse(line);
      if (event.error) throw new Error("AI failed");
      if (event.text) {
        answer += event.text;
        onText(answer);
      }
      if (event.plan) plan = planSchema.parse(event.plan);
    }
    if (done) break;
  }
  if (!answer) throw new Error("Empty response");
  return { text: answer, plan, fallback: false };
}
